use base64::Engine as _;

const APP_DIRS: &[&str] = &[
    "/Applications",
    "/System/Applications",
    "/System/Applications/Utilities",
];

pub fn find_app_path(app_name: &str) -> Option<String> {
    for dir in APP_DIRS {
        let path = format!("{}/{}.app", dir, app_name);
        if std::path::Path::new(&path).exists() {
            return Some(path);
        }
    }
    None
}

pub fn app_icon_base64(app_name: &str) -> Option<String> {
    #[cfg(not(target_os = "macos"))]
    { let _ = app_name; return None; }

    #[cfg(target_os = "macos")]
    {
        let app_path = find_app_path(app_name)?;
        let icon_file = read_icon_filename(&app_path);
        let icns_path = format!("{}/Contents/Resources/{}", app_path, icon_file);

        if !std::path::Path::new(&icns_path).exists() {
            return None;
        }

        let tmp_png = format!("/tmp/keyman_icon_{}.png", app_name.replace(' ', "_"));
        let ok = std::process::Command::new("sips")
            .args(["-s", "format", "png", "--resampleHeightWidth", "64", "64", &icns_path, "--out", &tmp_png])
            .output()
            .is_ok();

        if ok {
            if let Ok(bytes) = std::fs::read(&tmp_png) {
                let _ = std::fs::remove_file(&tmp_png);
                let enc = base64::engine::general_purpose::STANDARD.encode(&bytes);
                return Some(format!("data:image/png;base64,{}", enc));
            }
        }
        None
    }
}

#[cfg(target_os = "macos")]
fn read_icon_filename(app_path: &str) -> String {
    let plist = format!("{}/Contents/Info.plist", app_path);
    let raw = std::process::Command::new("defaults")
        .arg("read").arg(&plist).arg("CFBundleIconFile")
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default();

    let name = if raw.is_empty() { "AppIcon".to_string() } else { raw };
    if name.ends_with(".icns") { name } else { format!("{}.icns", name) }
}

pub fn scan_apps() -> Vec<(String, String)> {
    let mut apps: Vec<(String, String)> = Vec::new();
    for dir in APP_DIRS {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("app") {
                    if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                        if !name.is_empty() {
                            apps.push((name.to_string(), path.to_string_lossy().to_string()));
                        }
                    }
                }
            }
        }
    }
    apps.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));
    apps.dedup_by(|a, b| a.0 == b.0);
    apps
}
