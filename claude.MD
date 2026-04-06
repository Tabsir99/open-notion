# Notion-Like Editor — Agent Memory

> This file is the persistent memory for any AI agent working on this project.
> **Update this file** whenever you: learn something new, fix a bug, discover a gotcha, or make an architectural decision.
> Read this file in full before starting any task.

## Project Overview

A Notion-style block editor built with Tiptap v3 (MIT), React 18, Vite, Tailwind CSS v4, and shadcn/ui. No paid/Pro Tiptap extensions. See `PROMPT.md` for full spec.

## Current Status

- [x] Phase 1 — Core Editor
- [ ] Phase 2 — Block Side Menu (Drag Handle + Block Context Menu) _(UX bugs fixed, awaiting confirmation)_
- [ ] Phase 3 — Bubble Menu
- [ ] Phase 4 — Slash Commands
- [ ] Phase 5 — Link Popover
- [ ] Phase 6 — Custom Blocks
- [ ] Phase 7 — Polish & Animation

## Critical Rules

### Tiptap v3 — Do NOT forget these

- **BubbleMenu/FloatingMenu**: Import from `@tiptap/react/menus`, NOT `@tiptap/react`
- **Floating UI**: Tiptap v3 uses `@floating-ui/dom`. Uninstall tippy.js if present.
- **List extensions**: All merged into `@tiptap/extension-list` (TaskList, TaskItem, BulletList, OrderedList, ListItem, ListKeymap)
- **Table extensions**: All merged into `@tiptap/extension-table`
- **Utility extensions**: Focus, Placeholder, Dropcursor, Gapcursor, TrailingNode are in `@tiptap/extensions`
- **shouldRerenderOnTransaction**: Disabled by default in v3. If toolbar buttons don't update on state change, set `shouldRerenderOnTransaction: true` in useEditor config, or use `useEditorState` hook.

### Search Before Coding

- Before implementing any UI component (menu, toolbar, popover), web search for:
  - Latest Tiptap docs for that specific extension/component
  - How Notion implements it (screenshots, interaction patterns)
  - Known issues or bugs with the approach
- Before adding any animation, search for the current best practice (CSS transitions? @starting-style? Radix data attributes?)
- Before using any shadcn component, search for the latest installation command and API

### Code Quality

- One component per file, max ~150 lines
- No `any` types — use Tiptap's exported types (`Editor`, `Node`, `Mark`, `JSONContent`, etc.)
- Always clean up in useEffect returns
- Direct Lucide imports: `import { Bold } from "lucide-react"` — never barrel import
- Tailwind classes only — no inline styles

### Agent Workflow

- Do NOT test UI via screenshots or browser automation unless explicitly asked.
- After implementing a visual/interactive feature, STOP and ask the user to test it live.
- Do NOT mark a phase as complete until the user confirms it.

### NOTE: Update your progress frequently. Not only at the end of session, but mid session if you think it is needed.

## Decisions Log

<!-- Record architectural decisions here with reasoning -->

| Date       | Decision                                                            | Reasoning                                                                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-05 | Installed Vite + React + Tailwind v4 + shadcn/ui                    | Initial setup.                                                                                                                                                                                                                                                                                       |
| 2026-04-05 | Manual components.json                                              | shadcn init fails with Tailwind v4, so bypassed it correctly.                                                                                                                                                                                                                                        |
| 2026-04-06 | Custom useActiveBlock hook instead of @tiptap/extension-drag-handle | We need fine-grained control over the traveling menu behavior (hover + selection tracking, custom animations). The official drag-handle extension is MIT but opinionated about positioning via floating-ui. Our custom hook uses `$from.before(1)` + `view.nodeDOM(pos)` for robust block detection. |
| 2026-04-06 | Single BlockContextMenu component with shadcn DropdownMenu          | Radix dropdown handles keyboard nav, focus trapping, and submenus out of the box. Custom CSS overrides applied via `.block-context-menu` class for Notion-like look.                                                                                                                                 |
| 2026-04-06 | Installed shadcn dropdown-menu component                            | Required for Block Context Menu. Also installed radix-ui as a dependency.                                                                                                                                                                                                                            |

## Gotchas & Fixes

<!-- When you hit a bug and fix it, document it here so it never happens again -->

| Problem                                                                   | Cause                                                                                                                                         | Fix                                                                                                                                                                                       |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `editor.isFocused` in useEffect doesn't trigger re-render                 | It's a getter, not reactive state — reading it in useEffect dependency array does nothing                                                     | Listen to `editor.on('focus')` and `editor.on('blur')` events separately to track focus state                                                                                             |
| `editor.view.posAtDOM(blockEl, 0)` can return positions inside text nodes | `posAtDOM` resolves to the nearest document position, which may be inside inline content, not at block start                                  | Use `doc.resolve(pos)` then `resolved.before(1)` to reliably get the top-level block position                                                                                             |
| Dropdown menu stays open when mouse leaves editor area                    | Mouse leaves container, visibility state hides the menu, but Radix DropdownMenu is in a portal                                                | Added `menuOpen` guard: don't set `isEditorHovered=false` while context menu is open                                                                                                      |
| Menu flickers when hovering a different block than cursor                 | `mouseleave` on block clears hoveredBlock → falls back to cursor block → menu moves → re-triggers hover → loop                                | Check `relatedTarget` on mouseleave: if mouse moved to the menu element (`[data-block-side-menu]`), don't clear hoveredBlock. Added bidirectional leave handling between blocks and menu. |
| Menu always visible even when not hovering                                | Visibility was tied to `editor.isFocused`, which is true whenever the editor has the cursor                                                   | Removed focus from visibility formula. Menu is now visible ONLY when `isEditorHovered \|\| menuOpen`, not on focus alone.                                                                 |
| Menu too close to text (overlapping block content)                        | `left: 8px` positioned menu inside the ProseMirror padding zone, overlapping with text                                                        | Changed to `left: max(0px, calc(3rem - 49px - 10px))` — positions menu with a 10px gap to the left of content, clamped to prevent negative clipping on narrow screens.                    |
| Turn Into / commands target cursor block, not menu block                  | `TurnIntoSubmenu` used `editor.chain().focus().setParagraph()` etc. which operates on current selection, not the block the menu was opened on | Pass `blockPos` to `TurnIntoSubmenu`, each action now calls `.setTextSelection(blockPos + 1)` before the transform command                                                                |
| Menu disappears when hovering the gap between menu and block content      | Gap between the absolutely-positioned menu and ProseMirror content is dead zone — neither menu nor block                                      | Added `::after` pseudo-element on `.block-side-menu` extending 16px to the right as invisible hit area                                                                                    |

## Extension Registry

<!-- Track which extensions are installed and configured -->

| Extension         | Package                                 | Configured | Notes            |
| ----------------- | --------------------------------------- | ---------- | ---------------- |
| StarterKit        | `@tiptap/starter-kit`                   | No         |                  |
| TaskList          | `@tiptap/extension-list`                | No         | v3 merged import |
| Placeholder       | `@tiptap/extensions`                    | No         | Per-node config  |
| Image             | `@tiptap/extension-image`               | No         |                  |
| Link              | `@tiptap/extension-link`                | No         |                  |
| Underline         | `@tiptap/extension-underline`           | No         |                  |
| CodeBlockLowlight | `@tiptap/extension-code-block-lowlight` | No         |                  |
| Slash             | `@harshtalks/slash-tiptap`              | No         | MIT, headless    |

## File Index

<!-- Track what each file does as the project grows -->

| File                                               | Purpose                                                | Status |
| -------------------------------------------------- | ------------------------------------------------------ | ------ |
| `src/components/editor/Editor.tsx`                 | Main editor — useEditor, extensions, renders children  | ✅     |
| `src/components/editor/EditorProvider.tsx`         | EditorContext wrapper for child components             | ✅     |
| `src/components/editor/styles/editor.css`          | Editor content styles (typography, blocks)             | ✅     |
| `src/components/editor/menus/BlockSideMenu.tsx`    | Traveling +/⠿ container, absolutely positioned         | ✅     |
| `src/components/editor/menus/BlockContextMenu.tsx` | Dropdown menu content on ⠿ click                       | ✅     |
| `src/components/editor/menus/TurnIntoSubmenu.tsx`  | Turn into submenu items (Text, H1-H3, lists, etc.)     | ✅     |
| `src/components/editor/menus/useActiveBlock.ts`    | Hook: tracks active block position (selection + hover) | ✅     |
| `src/components/editor/menus/block-side-menu.css`  | Styles for side menu + context menu                    | ✅     |
| `src/components/ui/dropdown-menu.tsx`              | shadcn DropdownMenu (Radix)                            | ✅     |

## Current Issues

<!-- Active bugs or blockers -->

### Phase 2 — UX Bug Fix Tasks (2026-04-06)

- [x] **Task 1:** Menu should NOT be visible just because the editor is hovered. It should only appear when a **specific block** is hovered. **Fix:** Removed `isEditorHovered` from BlockSideMenu. useActiveBlock now exposes `isHovered` boolean. Visibility = `isHovered || menuOpen`.
- [x] **Task 2:** Dropdown body (Radix portal) causes flicker. **Fix:** `isMenuOrPortalElement()` now checks both `[data-block-side-menu]` and `[data-radix-popper-content-wrapper]` selectors. Mouse moving to the dropdown portal body no longer clears hover state.
- [x] **Task 3:** When mouse leaves the editor, the menu snaps back to the cursor block. **Fix:** On mouseleave, we now set `isHovered: false` but keep the current block position. Menu fades out in place instead of jumping to cursor block.
- [x] **Task 4:** When the context menu dropdown is open, the menu should **lock** to the block it was opened on. **Fix:** `useActiveBlock` accepts a `locked` parameter. When `locked=true` (menuOpen), all hover and selection tracking is frozen. BlockSideMenu also captures `lockedBlockPosRef` on menu open for operation safety.
- [x] **Task 5:** Turn Into and other commands target cursor block instead of the block the menu was opened on. **Fix:** Pass `blockPos` through to `TurnIntoSubmenu`. Each action calls `.setTextSelection(blockPos + 1)` before the transform.
- [x] **Task 6:** Gap between menu and block content causes menu to disappear on hover. **Fix:** Added `::after` pseudo-element on `.block-side-menu` (16px wide, invisible) bridging the gap.

### Other Issues

- Callout "Turn into" option logs a placeholder — needs the custom Callout extension from Phase 6.
- **Pending functionality (not wired up yet):**
  - `+` button: currently logs to console, needs slash menu integration.
  - Context menu actions (Delete, Duplicate): wired but not fully tested post-fix.
  - Drag-and-drop reorder: grip button has `draggable` attribute but no DnD logic.
  - These will be a separate task — current fixes don't break the placeholder click handlers.

## Notes for Next Session

<!-- Leave breadcrumbs for the next agent/session -->

Working on Phase 2 UX bug fixes round 2 (2026-04-06). See Current Issues for the task list.
