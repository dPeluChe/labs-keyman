use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub is_active: bool,
    pub sort_order: i64,
    pub app_trigger: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Button {
    pub id: i64,
    pub profile_id: i64,
    pub position: i64,
    pub label: String,
    pub icon: String,
    pub color: String,
    pub text_color: String,
    pub action_type: String,
    pub action_value: String,
    pub action_modifier: String,
    pub global_shortcut: String,
    pub enabled: bool,
}

pub fn open_connection(db_path: &std::path::PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    Ok(conn)
}

pub fn init_db(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS profiles (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            color       TEXT NOT NULL DEFAULT '#6366f1',
            is_active   INTEGER NOT NULL DEFAULT 0,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            app_trigger TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS buttons (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id      INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            position        INTEGER NOT NULL DEFAULT 0,
            label           TEXT NOT NULL DEFAULT '',
            icon            TEXT NOT NULL DEFAULT '',
            color           TEXT NOT NULL DEFAULT '#1e293b',
            text_color      TEXT NOT NULL DEFAULT '#ffffff',
            action_type     TEXT NOT NULL DEFAULT 'hotkey',
            action_value    TEXT NOT NULL DEFAULT '',
            action_modifier TEXT NOT NULL DEFAULT '',
            global_shortcut TEXT NOT NULL DEFAULT '',
            enabled         INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS settings (
            key     TEXT PRIMARY KEY,
            value   TEXT NOT NULL
        );
    ")?;

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM profiles",
        [],
        |r| r.get(0),
    )?;

    if count == 0 {
        conn.execute(
            "INSERT INTO profiles (name, color, is_active, sort_order) VALUES (?1, ?2, 1, 0)",
            params!["Default", "#6366f1"],
        )?;
        let profile_id = conn.last_insert_rowid();
        let default_buttons = vec![
            (0, "Copy",       "Copy",       "#1e293b", "#fff", "hotkey",   "c",             "ctrl"),
            (1, "Paste",      "Paste",      "#1e293b", "#fff", "hotkey",   "v",             "ctrl"),
            (2, "Undo",       "Undo2",      "#1e293b", "#fff", "hotkey",   "z",             "ctrl"),
            (3, "Redo",       "Redo2",      "#1e293b", "#fff", "hotkey",   "y",             "ctrl"),
            (4, "Save",       "Save",       "#1e293b", "#fff", "hotkey",   "s",             "ctrl"),
            (5, "New Tab",    "Plus",       "#0f766e", "#fff", "hotkey",   "t",             "ctrl"),
            (6, "Close Tab",  "X",          "#7f1d1d", "#fff", "hotkey",   "w",             "ctrl"),
            (7, "Screenshot", "Camera",     "#1d4ed8", "#fff", "hotkey",   "3",             "ctrl+shift"),
            (8, "Terminal",   "Terminal",   "#14532d", "#fff", "app",      "Terminal",      ""),
            (9, "Browser",    "Globe",      "#1e40af", "#fff", "app",      "Google Chrome", ""),
            (10,"Volume Up",  "Volume2",    "#78350f", "#fff", "media",    "volume_up",     ""),
            (11,"Volume Down","VolumeX",    "#78350f", "#fff", "media",    "volume_down",   ""),
        ];
        for (pos, label, icon, color, text_color, atype, aval, amod) in default_buttons {
            conn.execute(
                "INSERT INTO buttons (profile_id, position, label, icon, color, text_color, action_type, action_value, action_modifier, global_shortcut) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,'')",
                params![profile_id, pos, label, icon, color, text_color, atype, aval, amod],
            )?;
        }
    }
    Ok(())
}

pub fn migrate(conn: &Connection) -> Result<()> {
    let mut stmt = conn.prepare("PRAGMA table_info(buttons)")?;
    let cols: Vec<String> = stmt
        .query_map([], |r| r.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .collect();
    drop(stmt);
    if !cols.iter().any(|c| c == "global_shortcut") {
        conn.execute_batch("ALTER TABLE buttons ADD COLUMN global_shortcut TEXT NOT NULL DEFAULT ''")?;
    }

    let mut pstmt = conn.prepare("PRAGMA table_info(profiles)")?;
    let pcols: Vec<String> = pstmt
        .query_map([], |r| r.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .collect();
    drop(pstmt);
    if !pcols.iter().any(|c| c == "app_trigger") {
        conn.execute_batch("ALTER TABLE profiles ADD COLUMN app_trigger TEXT NOT NULL DEFAULT ''")?;
    }
    Ok(())
}

pub fn get_profiles(conn: &Connection) -> Result<Vec<Profile>> {
    let mut stmt = conn.prepare("SELECT id, name, color, is_active, sort_order, app_trigger FROM profiles ORDER BY sort_order, id")?;
    let rows = stmt.query_map([], |r| Ok(Profile {
        id: r.get(0)?,
        name: r.get(1)?,
        color: r.get(2)?,
        is_active: r.get::<_, i64>(3)? != 0,
        sort_order: r.get(4)?,
        app_trigger: r.get(5)?,
    }))?;
    rows.collect()
}

pub fn set_profile_app_trigger(conn: &Connection, id: i64, trigger: &str) -> Result<()> {
    conn.execute("UPDATE profiles SET app_trigger = ?1 WHERE id = ?2", params![trigger, id])?;
    Ok(())
}


pub fn get_buttons_for_profile(conn: &Connection, profile_id: i64) -> Result<Vec<Button>> {
    let mut stmt = conn.prepare("SELECT id, profile_id, position, label, icon, color, text_color, action_type, action_value, action_modifier, global_shortcut, enabled FROM buttons WHERE profile_id = ?1 ORDER BY position")?;
    let rows = stmt.query_map(params![profile_id], |r| Ok(Button {
        id: r.get(0)?,
        profile_id: r.get(1)?,
        position: r.get(2)?,
        label: r.get(3)?,
        icon: r.get(4)?,
        color: r.get(5)?,
        text_color: r.get(6)?,
        action_type: r.get(7)?,
        action_value: r.get(8)?,
        action_modifier: r.get(9)?,
        global_shortcut: r.get(10)?,
        enabled: r.get::<_, i64>(11)? != 0,
    }))?;
    rows.collect()
}

pub fn get_all_buttons_with_shortcuts(conn: &Connection) -> Result<Vec<Button>> {
    let mut stmt = conn.prepare("SELECT id, profile_id, position, label, icon, color, text_color, action_type, action_value, action_modifier, global_shortcut, enabled FROM buttons WHERE global_shortcut != '' ORDER BY id")?;
    let rows = stmt.query_map([], |r| Ok(Button {
        id: r.get(0)?,
        profile_id: r.get(1)?,
        position: r.get(2)?,
        label: r.get(3)?,
        icon: r.get(4)?,
        color: r.get(5)?,
        text_color: r.get(6)?,
        action_type: r.get(7)?,
        action_value: r.get(8)?,
        action_modifier: r.get(9)?,
        global_shortcut: r.get(10)?,
        enabled: r.get::<_, i64>(11)? != 0,
    }))?;
    rows.collect()
}

pub fn upsert_button(conn: &Connection, btn: &Button) -> Result<i64> {
    if btn.id == 0 {
        conn.execute(
            "INSERT INTO buttons (profile_id, position, label, icon, color, text_color, action_type, action_value, action_modifier, global_shortcut, enabled) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![btn.profile_id, btn.position, btn.label, btn.icon, btn.color, btn.text_color, btn.action_type, btn.action_value, btn.action_modifier, btn.global_shortcut, btn.enabled as i64],
        )?;
        Ok(conn.last_insert_rowid())
    } else {
        conn.execute(
            "UPDATE buttons SET profile_id=?1, position=?2, label=?3, icon=?4, color=?5, text_color=?6, action_type=?7, action_value=?8, action_modifier=?9, global_shortcut=?10, enabled=?11 WHERE id=?12",
            params![btn.profile_id, btn.position, btn.label, btn.icon, btn.color, btn.text_color, btn.action_type, btn.action_value, btn.action_modifier, btn.global_shortcut, btn.enabled as i64, btn.id],
        )?;
        Ok(btn.id)
    }
}

pub fn delete_button(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM buttons WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn create_profile(conn: &Connection, name: &str, color: &str) -> Result<i64> {
    conn.execute(
        "INSERT INTO profiles (name, color, is_active, sort_order) VALUES (?1, ?2, 0, (SELECT COALESCE(MAX(sort_order),0)+1 FROM profiles))",
        params![name, color],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn delete_profile(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM profiles WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn set_active_profile(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("UPDATE profiles SET is_active = 0", [])?;
    conn.execute("UPDATE profiles SET is_active = 1 WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>> {
    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |r| r.get(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        params![key, value],
    )?;
    Ok(())
}
