# KeyMan — Documentation Index

> Documentation index and writing guidelines for this project.

## Structure

| Folder | Contents |
|--------|----------|
| `ARCHITECTURE/` | Technical architecture, DB schema, design decisions |
| `GUIDES/` | Setup, development workflow, coding conventions |

## Root-level files (only these allowed)

`README.md`, `CHANGELOG.md`, `LICENSE`

## Writing rules

1. **No `.md` files at project root** except the allowed list above
2. **UPPERCASE_SNAKE_CASE** for all doc file names (`CODING_RULES.md`, not `coding-rules.md`)
3. **UPPERCASE** for all doc subfolders (`GUIDES/`, not `guides/`)
4. **0 warnings policy** — `cargo build` and `tsc --noEmit` must always be clean before committing
5. **Max 250 LOC per file** — split into components/modules if exceeded
6. **Archive, don't delete** — obsolete docs go to `ARCHIVED/` with a note
