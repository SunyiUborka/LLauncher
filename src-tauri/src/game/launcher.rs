use std::path::Path;
use std::process::Command;

use crate::config::settings::AppSettings;
use crate::error::AppError;

/// Escape a string for safe use inside single quotes in a shell command.
fn shell_escape(s: &str) -> String {
    // Replace each ' with '\'' (end quote, escaped quote, start quote)
    format!("'{}'", s.replace('\'', "'\\''"))
}

pub fn launch_game(settings: &AppSettings) -> Result<(), AppError> {
    let game_path = Path::new(&settings.game_dir);
    let exe_path = game_path.join("Endfield.exe");

    if !exe_path.exists() {
        return Err(AppError::GameNotFound(format!(
            "Executable not found: {}",
            exe_path.display()
        )));
    }

    let proton_path = Path::new(&settings.proton_dir).join("proton");
    if !proton_path.exists() {
        return Err(AppError::ProtonNotFound(format!(
            "Proton not found at: {}",
            proton_path.display()
        )));
    }

    // Convert Linux path to Wine Z: path
    let wine_path = format!("Z:{}", exe_path.to_string_lossy().replace('/', "\\"));

    let compat_data = game_path.join("_proton");
    std::fs::create_dir_all(&compat_data)?;

    // Log file path
    let log_path = dirs::config_dir()
        .unwrap_or_else(|| Path::new("/tmp").to_path_buf())
        .join("llauncher")
        .join("launch.log");
    std::fs::create_dir_all(log_path.parent().unwrap())?;

    // Build shell script with exported env vars
    let mut script = String::new();

    // Unset Python vars that break Proton's bundled Python
    script.push_str("unset PYTHONHOME PYTHONPATH\n");

    // Standard env vars
    script.push_str(&format!(
        "export PROTON_USE_WINEALSA=1\n\
         export UMU_USE_STEAM=1\n\
         export STEAM_COMPAT_CLIENT_INSTALL_PATH={}\n\
         export STEAM_COMPAT_DATA_PATH={}\n\
         export PROTON_USE_WINED3D=0\n",
        shell_escape(&settings.proton_dir),
        shell_escape(&compat_data.to_string_lossy()),
    ));

    if settings.use_dxvk_async {
        script.push_str("export DXVK_ASYNC=1\n");
    }

    if settings.use_wayland {
        script.push_str("export PROTON_ENABLE_WAYLAND=1\n");
    }

    if settings.disable_fsync {
        script.push_str("export PROTON_NO_FSYNC=1\n");
    }
    if settings.disable_esync {
        script.push_str("export PROTON_NO_ESYNC=1\n");
    }

    if settings.use_canonical_hole {
        script.push_str("export WINE_CANONICAL_HOLE='skip_volatile_check'\n");
    }

    // Custom env vars (KEY=VALUE per line)
    if !settings.custom_env_vars.is_empty() {
        for line in settings.custom_env_vars.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if let Some((key, value)) = line.split_once('=') {
                script.push_str(&format!(
                    "export {}={}\n",
                    key.trim(),
                    shell_escape(value.trim())
                ));
            }
        }
    }

    // cd into game directory
    script.push_str(&format!("cd {}\n", shell_escape(&game_path.to_string_lossy())));

    // Build the launch command with optional wrappers
    let proton_escaped = shell_escape(&proton_path.to_string_lossy());
    let wine_escaped = shell_escape(&wine_path);

    let mut launch_cmd = String::new();
    if settings.use_gamemode {
        launch_cmd.push_str("gamemoderun ");
    }
    if settings.use_mangohud {
        launch_cmd.push_str("mangohud ");
    }
    launch_cmd.push_str(&format!("{} run {}", proton_escaped, wine_escaped));

    // Native Vulkan renderer
    if settings.use_native_vulkan {
        launch_cmd.push_str(" -vulkan");
    }

    // Custom launch args
    if !settings.custom_launch_args.is_empty() {
        launch_cmd.push(' ');
        launch_cmd.push_str(&settings.custom_launch_args);
    }

    // Redirect output to log file
    script.push_str(&format!(
        "exec {} > {} 2>&1\n",
        launch_cmd,
        shell_escape(&log_path.to_string_lossy())
    ));

    Command::new("bash")
        .arg("-c")
        .arg(&script)
        .spawn()
        .map_err(|e| AppError::GameNotFound(format!("Failed to launch: {}", e)))?;

    Ok(())
}
