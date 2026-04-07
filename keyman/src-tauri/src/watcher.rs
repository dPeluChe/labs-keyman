use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

pub struct ContextWatcher {
    running: Arc<AtomicBool>,
}

impl ContextWatcher {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn start(&self, app: AppHandle) {
        if self.running.load(Ordering::Relaxed) {
            return;
        }
        self.running.store(true, Ordering::Relaxed);
        let running = self.running.clone();

        std::thread::spawn(move || {
            let mut last_app = String::new();

            while running.load(Ordering::Relaxed) {
                if let Some(current_app) = get_frontmost_app() {
                    if current_app != last_app {
                        last_app = current_app.clone();
                        let _ = app.emit("context-app-changed", &current_app);
                    }
                }
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
        });
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Relaxed);
    }

    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::Relaxed)
    }
}

fn get_frontmost_app() -> Option<String> {
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
    {
        None
    }
}
