use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::actions;
use crate::db::{self, Button, Profile};
use crate::icon_utils;
use crate::watcher::ContextWatcher;

pub struct DbState(pub Mutex<rusqlite::Connection>);
pub struct WatcherState(pub Mutex<ContextWatcher>);

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct InstalledApp {
    pub name: String,
    pub path: String,
    pub icon_base64: Option<String>,
}

#[tauri::command]
pub fn get_profiles(state: State<DbState>) -> Result<Vec<Profile>, String> {
    let conn = state.0.lock().unwrap();
    db::get_profiles(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_buttons(state: State<DbState>, profile_id: i64) -> Result<Vec<Button>, String> {
    let conn = state.0.lock().unwrap();
    db::get_buttons_for_profile(&conn, profile_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_button(state: State<DbState>, button: Button) -> Result<i64, String> {
    let conn = state.0.lock().unwrap();
    db::upsert_button(&conn, &button).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_button(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    db::delete_button(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_profile(state: State<DbState>, name: String, color: String) -> Result<i64, String> {
    let conn = state.0.lock().unwrap();
    db::create_profile(&conn, &name, &color).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_profile(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    db::delete_profile(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn activate_profile(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    db::set_active_profile(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_setting(state: State<DbState>, key: String) -> Result<Option<String>, String> {
    let conn = state.0.lock().unwrap();
    db::get_setting(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_setting(state: State<DbState>, key: String, value: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    db::set_setting(&conn, &key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn execute_button_action(
    action_type: String,
    action_value: String,
    action_modifier: String,
    app: AppHandle,
) -> Result<(), String> {
    actions::execute_action(&action_type, &action_value, &action_modifier, &app)
}

#[tauri::command]
pub fn toggle_always_on_top(app: AppHandle, value: bool) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.set_always_on_top(value).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn close_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn reorder_buttons(state: State<DbState>, ordered_ids: Vec<i64>) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    for (pos, id) in ordered_ids.iter().enumerate() {
        conn.execute(
            "UPDATE buttons SET position = ?1 WHERE id = ?2",
            rusqlite::params![pos as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn scan_installed_apps() -> Result<Vec<InstalledApp>, String> {
    let apps = icon_utils::scan_apps()
        .into_iter()
        .map(|(name, path)| InstalledApp { name, path, icon_base64: None })
        .collect();
    Ok(apps)
}

#[tauri::command]
pub fn get_app_icon(app_name: String) -> Result<Option<String>, String> {
    Ok(icon_utils::app_icon_base64(&app_name))
}

#[tauri::command]
pub fn set_profile_trigger(
    state: State<DbState>,
    id: i64,
    trigger: String,
) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    db::set_profile_app_trigger(&conn, id, &trigger).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_context_watcher(
    app: AppHandle,
    watcher: State<WatcherState>,
) -> Result<(), String> {
    let w = watcher.0.lock().unwrap();
    w.start(app);
    Ok(())
}

#[tauri::command]
pub fn stop_context_watcher(watcher: State<WatcherState>) -> Result<(), String> {
    let w = watcher.0.lock().unwrap();
    w.stop();
    Ok(())
}

#[tauri::command]
pub fn is_context_watcher_running(watcher: State<WatcherState>) -> bool {
    let w = watcher.0.lock().unwrap();
    w.is_running()
}

#[tauri::command]
pub fn get_frontmost_app() -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("osascript")
            .arg("-e")
            .arg("tell application \"System Events\" to get name of first application process whose frontmost is true")
            .output()
            .ok()?;
        let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if name.is_empty() { None } else { Some(name) }
    }
    #[cfg(not(target_os = "macos"))]
    { None }
}

#[tauri::command]
pub fn register_global_shortcuts(
    app: AppHandle,
    state: State<DbState>,
) -> Result<(), String> {
    let buttons = {
        let conn = state.0.lock().unwrap();
        db::get_all_buttons_with_shortcuts(&conn).map_err(|e| e.to_string())?
    };

    let shortcut_manager = app.global_shortcut();
    let _ = shortcut_manager.unregister_all();

    for btn in buttons {
        if btn.global_shortcut.is_empty() || !btn.enabled {
            continue;
        }
        let shortcut: Shortcut = btn.global_shortcut.parse::<Shortcut>().map_err(|e| e.to_string())?;
        let app_clone = app.clone();
        let action_type = btn.action_type.clone();
        let action_value = btn.action_value.clone();
        let action_modifier = btn.action_modifier.clone();
        let label = btn.label.clone();

        shortcut_manager
            .on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = actions::execute_action(&action_type, &action_value, &action_modifier, &app_clone);
                    let _ = app_clone.emit("shortcut-triggered", &label);
                }
            })
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn set_window_min_size(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize::new(width as u32, height as u32))))
            .map_err(|e: tauri::Error| e.to_string())?;
    }
    Ok(())
}
