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
| Phase 5.6 — Table Block | ✅ Complete |

| Phase 6 — Block Styling (Color, Font, Size) | 🔄 In Progress |
| Phase 7 — Polish & Animation | ⬜ Pending |

## Current Task

**Phase 5.6 — Table Block** ✅ Completed
- ✅ TableKit already wired; added slash item, CSS, and full overlay UI
- ✅ TableControls: per-cell column/row/cell buttons on hover (absolutely positioned)
- ✅ Column ops: insert left/right, duplicate, clear, delete
- ✅ Row ops: insert above/below, clear, delete
- ✅ Cell op: clear cell
- ✅ Column drag-to-reorder (x-axis, visual indicator line)
- ✅ Row drag-to-reorder (y-axis, visual indicator line)
- ✅ Add-row "+" button below table (full width)

**Phase 6 — Block Styling (Color, Font, Size)**
- ✅ BlockStyles extension (backgroundColor, textColor, fontSize, fontFamily attrs on paragraph/heading/blockquote/listItem)
- ✅ ColorMenu (text + background color submenus)
- ✅ FontSizeMenu (preset sizes + custom size input)
- ✅ FontFamilyMenu (7 distinctive families with live preview)
- ✅ All wired into BlockContextMenu
- ⬜ Fix: style carry-over on Enter (addKeyboardShortcuts approach in BlockStyles, but heading→paragraph conversion on styled Enter needs review)

## Known Backlog

- Drag-and-drop reorder: grip has `draggable` but no DnD logic (Phase 7)
- Move to submenu: "Coming soon" placeholder (Phase 6)
- FontSize / FontFamily menus: ✅ wired into BlockContextMenu
- `+` button in BlockSideMenu: sets cursor only, slash menu integration still needed

## CSS Note

`global.css` has two `--color-background` and `--color-accent` definitions — one in `@theme` block (consumed by `editor.css`), one in shadcn inline theme (consumed by shadcn components). Both coexist intentionally. Don't merge them.