use std::path::PathBuf;

/// Config directory: ~/.config/llauncher/
pub fn config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("llauncher")
}

/// Settings file path
pub fn settings_path() -> PathBuf {
    config_dir().join("settings.json")
}

/// Default game install directory
pub fn default_game_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Games")
        .join("ArknightsEndfield")
}

/// Default download (temp) directory
pub fn default_download_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Games")
        .join("ArknightsEndfield")
        .join("_download")
}

/// Default proton directory
pub fn default_proton_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".local")
                .join("share")
        })
        .join("llauncher")
        .join("proton")
}
