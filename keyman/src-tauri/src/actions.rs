use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ActionError {
    EnigoParse(String),
    EnigoExec(String),
}

impl std::fmt::Display for ActionError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            ActionError::EnigoParse(s) => write!(f, "Parse error: {s}"),
            ActionError::EnigoExec(s) => write!(f, "Exec error: {s}"),
        }
    }
}

fn parse_key(s: &str) -> Option<Key> {
    match s.to_lowercase().as_str() {
        "a" => Some(Key::Unicode('a')),
        "b" => Some(Key::Unicode('b')),
        "c" => Some(Key::Unicode('c')),
        "d" => Some(Key::Unicode('d')),
        "e" => Some(Key::Unicode('e')),
        "f" => Some(Key::Unicode('f')),
        "g" => Some(Key::Unicode('g')),
        "h" => Some(Key::Unicode('h')),
        "i" => Some(Key::Unicode('i')),
        "j" => Some(Key::Unicode('j')),
        "k" => Some(Key::Unicode('k')),
        "l" => Some(Key::Unicode('l')),
        "m" => Some(Key::Unicode('m')),
        "n" => Some(Key::Unicode('n')),
        "o" => Some(Key::Unicode('o')),
        "p" => Some(Key::Unicode('p')),
        "q" => Some(Key::Unicode('q')),
        "r" => Some(Key::Unicode('r')),
        "s" => Some(Key::Unicode('s')),
        "t" => Some(Key::Unicode('t')),
        "u" => Some(Key::Unicode('u')),
        "v" => Some(Key::Unicode('v')),
        "w" => Some(Key::Unicode('w')),
        "x" => Some(Key::Unicode('x')),
        "y" => Some(Key::Unicode('y')),
        "z" => Some(Key::Unicode('z')),
        "0" => Some(Key::Unicode('0')),
        "1" => Some(Key::Unicode('1')),
        "2" => Some(Key::Unicode('2')),
        "3" => Some(Key::Unicode('3')),
        "4" => Some(Key::Unicode('4')),
        "5" => Some(Key::Unicode('5')),
        "6" => Some(Key::Unicode('6')),
        "7" => Some(Key::Unicode('7')),
        "8" => Some(Key::Unicode('8')),
        "9" => Some(Key::Unicode('9')),
        "space" | " " => Some(Key::Space),
        "enter" | "return" => Some(Key::Return),
        "tab" => Some(Key::Tab),
        "esc" | "escape" => Some(Key::Escape),
        "backspace" => Some(Key::Backspace),
        "delete" | "del" => Some(Key::Delete),
        "up" => Some(Key::UpArrow),
        "down" => Some(Key::DownArrow),
        "left" => Some(Key::LeftArrow),
        "right" => Some(Key::RightArrow),
        "home" => Some(Key::Home),
        "end" => Some(Key::End),
        "pageup" | "pgup" => Some(Key::PageUp),
        "pagedown" | "pgdn" => Some(Key::PageDown),
        "f1" => Some(Key::F1),
        "f2" => Some(Key::F2),
        "f3" => Some(Key::F3),
        "f4" => Some(Key::F4),
        "f5" => Some(Key::F5),
        "f6" => Some(Key::F6),
        "f7" => Some(Key::F7),
        "f8" => Some(Key::F8),
        "f9" => Some(Key::F9),
        "f10" => Some(Key::F10),
        "f11" => Some(Key::F11),
        "f12" => Some(Key::F12),
        _ => None,
    }
}

pub fn execute_hotkey(key: &str, modifiers: &str) -> Result<(), ActionError> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| ActionError::EnigoExec(e.to_string()))?;

    let mods: Vec<&str> = if modifiers.is_empty() {
        vec![]
    } else {
        modifiers.split('+').collect()
    };

    let modifier_keys: Vec<Key> = mods
        .iter()
        .filter_map(|m| match m.to_lowercase().as_str() {
            "ctrl" | "control" => Some(Key::Control),
            "shift" => Some(Key::Shift),
            "alt" | "option" => Some(Key::Alt),
            "meta" | "cmd" | "command" | "super" => Some(Key::Meta),
            _ => None,
        })
        .collect();

    let main_key = parse_key(key)
        .ok_or_else(|| ActionError::EnigoParse(format!("Unknown key: {key}")))?;

    for &k in &modifier_keys {
        enigo.key(k, Press).map_err(|e| ActionError::EnigoExec(e.to_string()))?;
    }
    enigo.key(main_key, Click).map_err(|e| ActionError::EnigoExec(e.to_string()))?;
    for &k in modifier_keys.iter().rev() {
        enigo.key(k, Release).map_err(|e| ActionError::EnigoExec(e.to_string()))?;
    }

    Ok(())
}

pub fn type_text(text: &str) -> Result<(), ActionError> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| ActionError::EnigoExec(e.to_string()))?;
    enigo
        .text(text)
        .map_err(|e| ActionError::EnigoExec(e.to_string()))?;
    Ok(())
}

pub fn execute_action(action_type: &str, action_value: &str, action_modifier: &str, _app: &tauri::AppHandle) -> Result<(), String> {
    match action_type {
        "hotkey" => execute_hotkey(action_value, action_modifier).map_err(|e| e.to_string()),
        "text" => type_text(action_value).map_err(|e| e.to_string()),
        "app" => {
            #[cfg(target_os = "macos")]
            std::process::Command::new("open").arg("-a").arg(action_value).spawn().map_err(|e| e.to_string())?;
            #[cfg(target_os = "windows")]
            std::process::Command::new("explorer").arg(action_value).spawn().map_err(|e| e.to_string())?;
            #[cfg(target_os = "linux")]
            std::process::Command::new("xdg-open").arg(action_value).spawn().map_err(|e| e.to_string())?;
            Ok(())
        }
        "shell" => {
            #[cfg(unix)]
            std::process::Command::new("sh").arg("-c").arg(action_value).spawn().map_err(|e| e.to_string())?;
            #[cfg(windows)]
            std::process::Command::new("cmd").arg("/C").arg(action_value).spawn().map_err(|e| e.to_string())?;
            Ok(())
        }
        "url" => open::that(action_value).map_err(|e| e.to_string()),
        "media" => {
            match action_value {
                "volume_up" => {
                    #[cfg(target_os = "macos")]
                    std::process::Command::new("osascript").arg("-e").arg("set volume output volume (output volume of (get volume settings) + 10)").spawn().map_err(|e| e.to_string())?;
                }
                "volume_down" => {
                    #[cfg(target_os = "macos")]
                    std::process::Command::new("osascript").arg("-e").arg("set volume output volume (output volume of (get volume settings) - 10)").spawn().map_err(|e| e.to_string())?;
                }
                "mute" => {
                    #[cfg(target_os = "macos")]
                    std::process::Command::new("osascript").arg("-e").arg("set volume with output muted").spawn().map_err(|e| e.to_string())?;
                }
                _ => {}
            }
            Ok(())
        }
        _ => Err(format!("Unknown action type: {action_type}")),
    }
}
