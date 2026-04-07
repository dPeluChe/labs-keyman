# KeyMan — Technical Architecture

## Overview

KeyMan is a Tauri v2 desktop application. The Rust backend handles persistence, system interactions (keyboard simulation, app scanning, global shortcuts, context watching), and the React frontend handles all UI. Communication is via `invoke()` calls (frontend → backend) and `emit()` events (backend → frontend).

```
┌─────────────────────────────────────┐
│         React Frontend              │
│  Zustand store ←→ api.ts (invoke)   │
│  Components: TitleBar, ProfileBar,  │
│  KeyButton, ButtonEditor, AppPicker │
└────────────┬────────────────────────┘
             │ Tauri IPC (invoke / emit)
┌────────────▼────────────────────────┐
│         Rust Backend                │
│  commands.rs   — Tauri handlers     │
│  db.rs         — SQLite CRUD        │
│  actions.rs    — execute_action()   │
│  icon_utils.rs — sips icon extract  │
│  watcher.rs    — frontmost app poll │
└─────────────────────────────────────┘
```

## Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `lib.rs` | Tauri builder, plugin setup, tray icon, DB init + migrate |
| `commands.rs` | All `#[tauri::command]` handlers — thin layer calling db/actions/icon_utils/watcher |
| `db.rs` | SQLite schema, CRUD operations, `migrate()` for additive schema evolution |
| `actions.rs` | `execute_action()` — unified dispatch for hotkey/text/app/shell/url/media |
| `icon_utils.rs` | macOS app scanning (`/Applications`), icon extraction via `sips` → base64 PNG |
| `watcher.rs` | Background thread polling frontmost app via `osascript`, emits `context-app-changed` |

## Database Schema

```sql
profiles (
  id          INTEGER PK AUTOINCREMENT,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  is_active   INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  app_trigger TEXT NOT NULL DEFAULT ''    -- context-aware auto-switch
)

buttons (
  id              INTEGER PK AUTOINCREMENT,
  profile_id      INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position        INTEGER NOT NULL DEFAULT 0,
  label           TEXT NOT NULL DEFAULT '',
  icon            TEXT NOT NULL DEFAULT '',
  color           TEXT NOT NULL DEFAULT '#1e293b',
  text_color      TEXT NOT NULL DEFAULT '#ffffff',
  action_type     TEXT NOT NULL DEFAULT 'hotkey',   -- hotkey|text|app|shell|url|media
  action_value    TEXT NOT NULL DEFAULT '',
  action_modifier TEXT NOT NULL DEFAULT '',
  global_shortcut TEXT NOT NULL DEFAULT '',         -- e.g. "ctrl+shift+1"
  enabled         INTEGER NOT NULL DEFAULT 1
)

settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

DB file is stored in the Tauri app data directory (`~/Library/Application Support/com.keyman.app/keyman.db` on macOS).

Schema migrations are additive (`ALTER TABLE ADD COLUMN`) and handled by `db::migrate()` on every startup.

## Frontend State (Zustand)

```
KeymanStore {
  profiles[]         — all profiles
  activeProfileId    — currently selected profile
  buttons[]          — buttons for active profile (sorted by position)
  isEditMode         — enables drag/edit/delete UI
  gridCols           — 3 | 4 | 5
  alwaysOnTop        — window pin state
  autoMode           — context-aware profile switching
  contextApp         — currently detected frontmost app name
}
```

## Event Flow

### Button press (normal mode)
`KeyButton.onClick` → `store.executeButton()` → `api.executeButtonAction()` → `actions::execute_action()`

### Button reorder (edit mode drag)
`DragEnd` → `arrayMove(sortedIds)` → `store.reorderButtons()` → `api.reorderButtons()` → DB `UPDATE buttons SET position`

### Context-aware profile switch
`watcher.rs` (osascript poll 500ms) → `emit("context-app-changed", appName)` → `listen()` in `App.tsx` → `store.handleContextChange()` → `store.setActiveProfile()` if trigger matches

### Global shortcut fire
`tauri-plugin-global-shortcut` callback → `actions::execute_action()` + `emit("shortcut-triggered", label)`

## Key Design Decisions

- **Additive migrations only** — `ALTER TABLE ADD COLUMN` never drops or renames columns, preserving user data across updates
- **Thin commands layer** — `commands.rs` delegates immediately to `db`, `actions`, `icon_utils`, or `watcher`; no business logic inline
- **Frontend-side context matching** — profile trigger matching is done in the Zustand store (not Rust) since profiles are already in memory
- **Lazy icon loading** — app icons are only fetched on demand in `AppPicker`, never at scan time, keeping the list fast
- **Edit-mode-only DnD** — `useSortable` is disabled when not in edit mode to prevent accidental drags during normal use
