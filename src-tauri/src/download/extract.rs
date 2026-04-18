use std::path::Path;

use crate::error::AppError;

pub fn extract_split_zip(first_part: &Path, extract_to: &Path) -> Result<(), AppError> {
    std::fs::create_dir_all(extract_to)?;

    let output = std::process::Command::new("7z")
        .arg("x")
        .arg("-y")
        .arg(format!("-o{}", extract_to.display()))
        .arg(first_part.to_string_lossy().to_string())
        .output()
        .map_err(|_| AppError::SevenZipNotFound)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::ExtractionFailed(stderr.to_string()));
    }

    Ok(())
}
