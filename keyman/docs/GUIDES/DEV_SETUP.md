# Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Rust | stable | `curl https://sh.rustup.rs -sSf \| sh` |
| Bun | ≥ 1.2 | `curl -fsSL https://bun.sh/install \| bash` |
| Xcode CLT | latest | `xcode-select --install` |

## First run

```bash
git clone <repo>
cd keyman
bun install
bun run tauri dev
```

## Common commands

```bash
bun run tauri dev       # Dev mode with hot-reload
bun run tauri build     # Production build → src-tauri/target/release/bundle/
bun run check           # tsc --noEmit (TypeScript check, 0 errors required)
cargo build             # Rust check (0 warnings required)
```

## Coding conventions

### File size limit
**All source files must stay under 250 LOC.** If a file exceeds this, extract a component, module, or hook.

### 0 warnings policy
Both `cargo build` and `tsc --noEmit` must produce no warnings or errors at all times. This is enforced before any commit.

### Rust
- Commands (`commands.rs`) are thin — they call into `db`, `actions`, `icon_utils`, or `watcher`; no logic inline
- Schema changes: **additive only** — add columns via `db::migrate()`, never drop or rename

### TypeScript / React
- One component per file, file named after the component
- State lives in Zustand (`store.ts`); components only read and dispatch
- API calls go through `api.ts` — never call `invoke()` directly from a component

## macOS permissions

KeyMan needs two macOS permissions:

| Permission | Used for | How to grant |
|-----------|---------|-------------|
| Accessibility | `enigo` keyboard simulation | System Settings → Privacy & Security → Accessibility → add KeyMan |
| Automation | `osascript` frontmost app detection | Granted automatically on first use (dialog prompt) |

In development (`tauri dev`), grant permissions to the **Terminal/IDE** process that launched it.

## DB location

```
~/Library/Application Support/com.keyman.app/keyman.db
```

To reset: delete the file. The app will re-seed with defaults on next launch.

## Adding a new button action type

1. Add the value to `ACTION_TYPES` in `src/types.ts`
2. Handle it in `actions::execute_action()` in `src-tauri/src/actions.rs`
3. `ButtonEditor` will automatically show the value input field

## Adding a new Tauri command

1. Add `pub fn your_command(...)` with `#[tauri::command]` in `commands.rs`
2. Register it in `tauri::generate_handler![...]` in `lib.rs`
3. Add the `invoke` wrapper in `src/api.ts`
