# DECISIONS.md — Decisions Log

> Append-only. Load this file when making an architectural call, not every session.

| Date | Decision | Reasoning |
|------|----------|-----------|
| 2026-04-05 | Vite + React + Tailwind v4 + shadcn/ui | Initial setup |
| 2026-04-05 | Manual `components.json` | shadcn init fails with Tailwind v4; bypassed correctly |
| 2026-04-05 | shadcn `base-nova` style (Base UI) | Selected during init. All components use `@base-ui/react`, not Radix |
| 2026-04-06 | Custom `useActiveBlock` hook | Fine-grained control over traveling menu. Uses `$from.before(1)` + `view.nodeDOM(pos)`. Official drag-handle extension too opinionated |
| 2026-04-06 | Single BlockContextMenu with shadcn DropdownMenu | Base UI handles keyboard nav, focus trapping, submenus. `modal={false}` avoids editor focus issues |
| 2026-04-06 | Data-driven menu items | All items as typed `MenuItem[]` arrays rendered via `.map()`. Eliminates repeated JSX |
| 2026-04-06 | `finalFocus` for editor refocus | Base UI pattern: `finalFocus={() => { editor.commands.focus(); return false; }}` replaces Radix `onCloseAutoFocus` |
| 2026-04-06 | Migrated block-side-menu.css to Tailwind | Only scrollbar styles remain in CSS (`::-webkit-scrollbar` unsupported by Tailwind) |
| 2026-04-06 | shadcn-defaults-first styling | No hardcoded color classes on shadcn components. Colors via CSS variables only. Theme finalization in Phase 6 by editing `global.css` |
| 2026-04-06 | Editor vars → `--editor-*` namespace | Avoids collision with shadcn vars. Defined in `:root`/`.dark`, mapped via `@theme inline` |
| 2026-04-06 | `shouldRerenderOnTransaction: true` | Required in v3 so Toggle `pressed` state updates when marks are toggled |
| 2026-04-06 | Link `openOnClick: false` | Prevents navigation when clicking links during editing |
| 2026-04-06 | BubbleMenu `shouldShow` filter | Hides on empty selections and NodeSelections. Text range only |
| 2026-04-06 | Installed shadcn: Toggle, Separator, Popover | All Base UI primitives |
| 2026-04-07 | Merged Link Popover into Phase 5 | Too small to justify standalone phase. Sub-phases 5.1–5.5 |
| 2026-04-07 | Slash Menu: no ReactRenderer, no cmdk | Both cause ProseMirror event conflicts and React lifecycle pain. Standalone React state + Base UI Popover instead |
| 2026-04-07 | Restructured agent memory files | `CLAUDE.md` (rules + gotchas), `SPEC.md` (product spec), `DECISIONS.md` (history), `STATUS.md` (current state). Reduces per-session token load and eliminates `PROMPT.md` overlap |
| 2026-04-10 | Custom Emoji Picker structure | Avoids heavy components. Virtualized DOM structure wrapped in React. Connects with Tiptap `Suggestion` via `:`. |
| 2026-04-10 | Callout Block Architecture | Uses inline `NodeViewWrapper`. Instead of standard menus, it uses `EmojiPopover` inline and inline color buttons. Stores data via `[data-color]` and `[data-emoji]`. |
| 2026-04-12 | BlockStyles extension for block-level styling | Single extension with `addGlobalAttributes` + `addCommands` for backgroundColor, textColor, fontSize, fontFamily. Applied to paragraph/heading/blockquote/listItem. |
| 2026-04-12 | FontSizeMenu + FontFamilyMenu as dropdown submenus | Same pattern as ColorMenu — data file + component. FontSizeMenu includes a custom size input. FontFamilyMenu renders each option in its own font. Both wired into BlockContextMenu. |
| 2026-04-12 | Block style carry-over on Enter — pending fix | ProseMirror `splitBlock` copies all node attrs via `node.copy()`. Fix: `appendTransaction` plugin in BlockStyles that strips style attrs from newly split nodes. |