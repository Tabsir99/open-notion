# STATUS.md — Current State

> Update this at the end of every session. Load alongside `CLAUDE.md` each new session.

## Phase Progress

| Phase | Status |
|-------|--------|
| Phase 1 — Core Editor | ✅ Complete |
| Phase 2 — Block Side Menu | ✅ Complete |
| Phase 3 — Bubble Menu | ✅ Complete (user-confirmed) |
| Phase 4 — Slash Commands | ✅ Complete (user-confirmed) |
| Phase 5.1 — Image Block | ✅ Complete |
| Phase 5.2 — Link Popover | ✅ Complete |
| Phase 5.3 — Code Block | ✅ Complete |
| Phase 5.4 — Emoji Extension + Picker | ✅ Complete |
| Phase 5.5 — Callout Block | ✅ Complete |
| Phase 5.6 — Table Block | ⬜ Pending |

| Phase 6 — Text Color & Highlight | ⬜ Pending |
| Phase 7 — Polish & Animation | ⬜ Pending |

## Current Task

**Phase 6 — Text Color & Highlight**
- Implement Text Color extension (`@tiptap/extension` already in package.json)
- Implement Highlight extension (`@tiptap/extension-highlight` already in package.json)
- Wire Text Color & Highlight into SlashMenu and TurnIntoMenu
- Text Color & Highlight controls (add/remove row/col, merge cells, header row toggle)

## Known Backlog

- Drag-and-drop reorder: grip has `draggable` but no DnD logic (Phase 7)
- Move to / Color submenus: "Coming soon" placeholder (Phase 6)
- `+` button in BlockSideMenu: sets cursor only, slash menu integration still needed

## CSS Note

`global.css` has two `--color-background` and `--color-accent` definitions — one in `@theme` block (consumed by `editor.css`), one in shadcn inline theme (consumed by shadcn components). Both coexist intentionally. Don't merge them.