use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};
use tauri::Emitter;

use crate::api::types::ExtractProgress;
use crate::error::AppError;

pub fn extract_split_zip(
    app: &tauri::AppHandle,
    first_part: &Path,
    extract_to: &Path,
    total_size: u64,
) -> Result<(), AppError> {
    std::fs::create_dir_all(extract_to)?;

    let total = archive_uncompressed_size(first_part)
        .filter(|t| *t > 0)
        .unwrap_or(total_size);

    let emit = |percent: u8, processed: u64, speed: u64| {
        app.emit(
            "download://extract-progress",
            ExtractProgress {
                percent,
                bytes_processed: processed,
                bytes_total: total,
                speed_bps: speed,
            },
        )
        .ok();
    };

    let baseline = dir_size(extract_to);

    emit(0, 0, 0);

    let mut child = Command::new("7z")
        .arg("x")
        .arg("-y")
        .arg(format!("-o{}", extract_to.display()))
        .arg(first_part.to_string_lossy().to_string())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|_| AppError::SevenZipNotFound)?;

    let stderr_handle = child.stderr.take().map(|mut e| {
        thread::spawn(move || {
            let mut s = String::new();
            e.read_to_string(&mut s).ok();
            s
        })
    });

    let start = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => {}
            Err(e) => return Err(AppError::Io(e)),
        }

        let written = dir_size(extract_to).saturating_sub(baseline);
        let processed = if total > 0 { written.min(total) } else { written };
        let elapsed = start.elapsed().as_secs_f64();
        let speed = if elapsed > 0.1 {
            (processed as f64 / elapsed) as u64
        } else {
            0
        };
        let percent = if total > 0 {
            ((processed as f64 / total as f64) * 100.0).floor().min(99.0) as u8
        } else {
            0
        };
        emit(percent, processed, speed);

        thread::sleep(Duration::from_millis(400));
    };

    if !status.success() {
        let stderr = stderr_handle
            .and_then(|h| h.join().ok())
            .unwrap_or_default();
        return Err(AppError::ExtractionFailed(stderr));
    }

    let final_bytes = if total > 0 {
        total
    } else {
        dir_size(extract_to).saturating_sub(baseline)
    };
    emit(100, final_bytes, 0);

    Ok(())
}

fn archive_uncompressed_size(first_part: &Path) -> Option<u64> {
    let output = Command::new("7z")
        .arg("l")
        .arg("-slt")
        .arg(first_part.to_string_lossy().to_string())
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let text = String::from_utf8_lossy(&output.stdout);
    let mut total: u64 = 0;
    let mut in_entries = false;
    for line in text.lines() {
        let trimmed = line.trim_start();
        if !in_entries {
            if trimmed.starts_with("----------") {
                in_entries = true;
            }
            continue;
        }
        if let Some(rest) = trimmed.strip_prefix("Size = ") {
            if let Ok(n) = rest.trim().parse::<u64>() {
                total = total.saturating_add(n);
            }
        }
    }

    (total > 0).then_some(total)
}

fn dir_size(path: &Path) -> u64 {
    let mut total = 0u64;
    let mut stack = vec![path.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            match entry.file_type() {
                Ok(ft) if ft.is_dir() => stack.push(entry.path()),
                Ok(ft) if ft.is_file() => {
                    if let Ok(meta) = entry.metadata() {
                        total = total.saturating_add(meta.len());
                    }
                }
                _ => {}
            }
        }
    }
    total
}
