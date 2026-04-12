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

| Phase 6 — Block Styling (Color, Font, Size) | 🔄 In Progress |
| Phase 7 — Polish & Animation | ⬜ Pending |

## Current Task

**Phase 6 — Block Styling (Color, Font, Size)**
- ✅ BlockStyles extension (backgroundColor, textColor, fontSize, fontFamily attrs on paragraph/heading/blockquote/listItem)
- ✅ ColorMenu (text + background color submenus)
- ✅ FontSizeMenu (preset sizes + custom size input)
- ✅ FontFamilyMenu (7 distinctive families with live preview)
- ✅ All wired into BlockContextMenu
- ⬜ Fix: style carry-over on Enter (splitBlock copies attrs — need appendTransaction cleanup plugin in BlockStyles)

## Known Backlog

- Drag-and-drop reorder: grip has `draggable` but no DnD logic (Phase 7)
- Move to submenu: "Coming soon" placeholder (Phase 6)
- FontSize / FontFamily menus: ✅ wired into BlockContextMenu
- `+` button in BlockSideMenu: sets cursor only, slash menu integration still needed

## CSS Note

`global.css` has two `--color-background` and `--color-accent` definitions — one in `@theme` block (consumed by `editor.css`), one in shadcn inline theme (consumed by shadcn components). Both coexist intentionally. Don't merge them.