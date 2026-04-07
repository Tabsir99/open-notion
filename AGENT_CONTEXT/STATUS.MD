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
| Phase 5.2 — Code Block | ⬜ Next up |
| Phase 5.3 — Link Popover | ⬜ Pending |
| Phase 5.4 — Callout Block | ⬜ Pending |
| Phase 5.5 — Callout → TurnInto | ⬜ Pending |
| Phase 6 — Polish & Animation | ⬜ Pending |

## Next Task

**Phase 5.2 — Code block**
- `CodeBlockLowlight` from `@tiptap/extension-code-block-lowlight`
- Syntax highlighting via `lowlight`
- Language selector UI in block header
- Custom `ReactNodeViewRenderer` in `src/components/editor/blocks/CodeBlock.tsx`

## Known Pending (Non-blocking)

- Drag-and-drop reorder: grip has `draggable` but no DnD logic (Phase 6)
- Move to / Color submenus: "Coming soon" placeholder (Phase 6)
- Callout Turn Into: placeholder log, needs Callout extension (Phase 5.4 + 5.5)
- `+` button in BlockSideMenu: sets cursor only, slash menu integration still needed

## CSS Note

`global.css` has two `--color-background` and `--color-accent` definitions — one in `@theme` block (consumed by `editor.css`), one in shadcn inline theme (consumed by shadcn components). Both coexist intentionally. Don't merge them.