mod actions;
mod commands;
mod db;
mod icon_utils;
mod watcher;

use commands::{DbState, WatcherState};
use watcher::ContextWatcher;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
            let db_path = app_dir.join("keyman.db");

            let conn = db::open_connection(&db_path).expect("failed to open DB");
            db::init_db(&conn).expect("failed to init DB");
            db::migrate(&conn).expect("failed to migrate DB");

            app.manage(DbState(Mutex::new(conn)));
            app.manage(WatcherState(Mutex::new(ContextWatcher::new())));

            let show = MenuItem::with_id(app, "show", "Show KeyMan", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("KeyMan")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
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
                        if let Some(win) = app.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_profiles,
            commands::get_buttons,
            commands::save_button,
            commands::remove_button,
            commands::create_profile,
            commands::remove_profile,
            commands::activate_profile,
            commands::get_setting,
            commands::set_setting,
            commands::execute_button_action,
            commands::toggle_always_on_top,
            commands::minimize_window,
            commands::close_window,
            commands::reorder_buttons,
            commands::scan_installed_apps,
            commands::get_app_icon,
            commands::register_global_shortcuts,
            commands::set_profile_trigger,
            commands::start_context_watcher,
            commands::stop_context_watcher,
            commands::is_context_watcher_running,
            commands::get_frontmost_app,
            commands::set_window_min_size,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
