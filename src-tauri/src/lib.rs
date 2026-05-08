mod api;
mod commands;
mod config;
mod download;
mod error;
mod game;
mod state;

use config::settings::AppSettings;
use state::AppState;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_autostart::ManagerExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Use xdg-desktop-portal for file dialogs (native KDE/GNOME picker)
    std::env::set_var("GTK_USE_PORTAL", "1");

    // Workaround for WebKitGTK 2.40+ EGL_BAD_PARAMETER on Arch/CachyOS/Fedora
    // and NVIDIA setups. Disables the DMA-BUF renderer that breaks on many
    // Linux GPU stacks. Respect the user's override if they set it explicitly.
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    let settings = AppSettings::load();
    let app_state = AppState::new(settings);

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state)
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // Enable autostart on first launch
            {
                let state = app.state::<AppState>();
                let mut settings = state.settings.blocking_lock();
                if !settings.autostart_initialized {
                    let _ = app.autolaunch().enable();
                    settings.autostart_initialized = true;
                    let _ = settings.save();
                }
            }

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::get_game_version,
            commands::get_launcher_content,
            commands::check_game_state,
            commands::start_download,
            commands::cancel_download,
            commands::launch_game,
            commands::read_launch_log,
            commands::repair_game,
            commands::update_installed_version,
            commands::check_system_requirements,
            commands::get_dwproton_latest,
            commands::list_dwproton_releases,
            commands::list_installed_protons,
            commands::set_active_proton,
            commands::download_dwproton,
            commands::cancel_proton_download,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
