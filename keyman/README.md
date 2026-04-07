# KeyMan — Macro Keypad Desktop App

A floating macro keypad for macOS (and cross-platform) built with **Tauri v2 + React 19 + Rust + SQLite**. Lives in your system tray, always on top, lets you assign hotkeys, launch apps, run shell commands, type text, and open URLs — with one click or a global shortcut.

## Features

- **Button grid** — configurable 3×, 4×, or 5× column layout
- **Drag & drop reorder** — in edit mode, drag buttons to rearrange (dnd-kit)
- **6 action types** — hotkey, text, app launch, shell command, URL, media control
- **App picker** — scans `/Applications` and shows real app icons (macOS)
- **Global shortcuts** — per-button shortcuts that fire even when KeyMan isn't focused
- **Context-aware profiles** — auto-switch profiles based on the active app (e.g. Zoom → Zoom profile)
- **Multiple profiles** — create unlimited profiles, each with independent button sets
- **System tray** — always accessible, click tray icon to show/hide
- **Always on top** — stays visible over other windows (toggleable)

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, TailwindCSS v4, Zustand |
| Desktop | Tauri v2 |
| Backend | Rust, rusqlite (SQLite), enigo |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Package manager | Bun |

## Quick Start

```bash
# Install dependencies (from repo root OR from keyman/)
bun install

# Development — run from repo root OR from keyman/
bun run tauri:dev

# Production build
bun run tauri:build

# TypeScript check (0 errors required)
bun run check

# Lint (alias for check)
bun run lint

# Frontend-only build (no Tauri)
bun run build
```

> All scripts work from both `labs-keyman/` (repo root) and `labs-keyman/keyman/`.

**Prerequisites:** Rust (stable), Bun, Xcode Command Line Tools (macOS)

## Project Structure

```
keyman/
├── src/                        # React frontend
│   ├── components/
│   │   ├── TitleBar.tsx        # Top bar: auto mode, always-on-top, edit toggle
│   │   ├── ProfileBar.tsx      # Profile tabs + app trigger assignment
│   │   ├── KeyButton.tsx       # Individual button (press + edit mode)
│   │   ├── SortableKeyButton.tsx  # dnd-kit wrapper for KeyButton
│   │   ├── ButtonEditor.tsx    # Modal editor for button config
│   │   ├── AppPicker.tsx       # macOS app scanner + icon display
│   │   ├── ShortcutRecorder.tsx   # Keyboard shortcut capture input
│   │   ├── AddButtonSlot.tsx   # Empty slot in edit mode
│   │   └── DynamicIcon.tsx     # Lucide icon by name
│   ├── store.ts                # Zustand global state
│   ├── api.ts                  # Tauri invoke wrappers
│   └── types.ts                # TypeScript interfaces
│
├── src-tauri/src/
│   ├── lib.rs                  # Tauri builder, plugins, setup
│   ├── commands.rs             # #[tauri::command] handlers
│   ├── db.rs                   # SQLite schema, CRUD, migrations
│   ├── actions.rs              # Keyboard/app/shell action execution
│   ├── icon_utils.rs           # macOS app icon extraction (sips)
│   └── watcher.rs              # Background context watcher thread
│
└── docs/
    ├── ARCHITECTURE/           # Technical decisions and schema docs
    └── GUIDES/                 # Setup and development guides
```

## Context-Aware Profiles

1. Enter **edit mode** (pencil icon)
2. Hover a profile tab → click the 🔗 green button
3. Type the app name trigger (e.g. `Zoom`, `Figma`, `Google Chrome`)
4. Click ⚡ (Zap) in the title bar to enable **Auto Mode**
5. KeyMan will auto-switch profiles when you switch apps

## Global Shortcuts

Open any button in edit mode → scroll to **Global Shortcut** → click **Record** → press your key combination. The shortcut fires the button action system-wide, even when KeyMan is hidden.

## Build Quality

- **0 Rust warnings** — enforced on every build
- **0 TypeScript errors** — `tsc --noEmit` always clean
- All source files kept under **250 LOC**

## Docs

See [`docs/`](./docs/README.md) for architecture and development guides.
