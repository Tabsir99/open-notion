# Notion-Like Editor — Agent Memory

> This file is the persistent memory for any AI agent working on this project.
> **Update this file** whenever you: learn something new, fix a bug, discover a gotcha, or make an architectural decision.
> Read this file in full before starting any task.

## Project Overview

A Notion-style block editor built with Tiptap v3 (MIT), React 18, Vite, Tailwind CSS v4, and shadcn/ui (base-nova style, Base UI primitives). No paid/Pro Tiptap extensions. See `PROMPT.md` for full spec.

## Current Status

- [x] Phase 1 — Core Editor
- [x] Phase 2 — Block Side Menu (Drag Handle + Block Context Menu)
- [ ] Phase 3 — Bubble Menu
- [ ] Phase 4 — Slash Commands
- [ ] Phase 5 — Link Popover
- [ ] Phase 6 — Custom Blocks
- [ ] Phase 7 — Polish & Animation

## Critical Rules

### shadcn Uses Base UI, NOT Radix

This project uses shadcn `base-nova` style. All primitives come from `@base-ui/react`, not `@radix-ui/react-*`. Key API differences:

- `onCloseAutoFocus` → `finalFocus` (callback, return `false` to prevent default focus)
- `asChild` → `render` prop on Trigger components
- `data-state="open"` → `data-open` / `data-closed`
- Dropdown structure: `Root → Portal → Positioner → Popup` (not just `Content`)
- Always use `modal={false}` on dropdowns that coexist with the editor

### Styling: No Hardcoded Colors

- **Never add color classes to shadcn components.** They inherit colors from CSS variables automatically.
- Only add structural classes: layout, sizing, spacing, radius, typography size, overflow, position, transitions.
- For non-shadcn elements, use semantic classes: `bg-background`, `bg-popover`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`.
- Editor content colors live in `editor.css` via `var(--editor-*)` variables.
- All color values are defined exactly ONCE in `global.css` under `:root` and `.dark`.
- If a new color is needed, add a CSS variable to `global.css` — never hardcode hex/zinc/oklch in a component.

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
- Before adding any animation, search for the current best practice
- Before using any shadcn component, search for the latest installation command and API
- **Always check the actual component source in `src/components/ui/`** — the APIs are Base UI, not Radix

### Code Quality

- One component per file, max ~150 lines
- No `any` types — use Tiptap's exported types (`Editor`, `Node`, `Mark`, `JSONContent`, etc.)
- Always clean up in useEffect returns
- Direct Lucide imports: `import { Bold } from "lucide-react"` — never barrel import
- Tailwind classes only — no inline styles (exception: dynamic `transform` via `style` prop)
- Data-driven: menu items and repeated UI use typed arrays + `.map()`, className appears once in render function
- Use `cn()` from `@/lib/utils` for conditional class merging

### Agent Workflow

- Do NOT test UI via screenshots or browser automation unless explicitly asked.
- After implementing a visual/interactive feature, STOP and ask the user to test it live.
- Do NOT mark a phase as complete until the user confirms it.
- Update `claude.md` mid-session when you fix bugs, learn something, or make decisions.


## Decisions Log

| Date | Decision | Reasoning |
|------|----------|-----------|
| 2026-04-05 | Installed Vite + React + Tailwind v4 + shadcn/ui | Initial setup. |
| 2026-04-05 | Manual components.json | shadcn init fails with Tailwind v4, so bypassed it correctly. |
| 2026-04-05 | shadcn `base-nova` style (Base UI) | Selected during shadcn init. All components use `@base-ui/react` primitives, not Radix. |
| 2026-04-06 | Custom useActiveBlock hook | Fine-grained control over traveling menu behavior. Uses `$from.before(1)` + `view.nodeDOM(pos)` for block detection. Official drag-handle extension is too opinionated. |
| 2026-04-06 | Single BlockContextMenu with shadcn DropdownMenu | Base UI dropdown handles keyboard nav, focus trapping, submenus. `modal={false}` avoids editor focus issues. |
| 2026-04-06 | Data-driven menu items | All menu items defined as typed arrays (`MenuItem[]`), rendered via `.map()`. Icons use `LucideIcon` type. Eliminates repeated JSX. |
| 2026-04-06 | `finalFocus` for editor refocus | Base UI pattern: `finalFocus={() => { editor.commands.focus(); return false; }}` replaces Radix `onCloseAutoFocus`. |
| 2026-04-06 | Migrated block-side-menu.css to Tailwind | Only scrollbar styles remain in CSS (`::-webkit-scrollbar` not supported by Tailwind). Everything else uses Tailwind classes. |
| 2026-04-06 | shadcn-defaults-first styling | No hardcoded color classes on shadcn components. Colors flow through CSS variables only. Structural classes (layout/sizing/spacing) are the only additions. Theme finalization in Phase 7 by editing global.css variables. |
| 2026-04-06 | Editor vars renamed to `--editor-*` namespace | Avoids collision with shadcn vars (`--accent`, `--border`, `--background`). Defined in `:root`/`.dark`, mapped to Tailwind utilities via `@theme inline`. |

## Gotchas & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| `editor.isFocused` in useEffect doesn't trigger re-render | It's a getter, not reactive state | Listen to `editor.on('focus')` and `editor.on('blur')` events separately |
| `editor.view.posAtDOM(blockEl, 0)` returns positions inside text nodes | `posAtDOM` resolves to nearest position, may be inside inline content | Use `doc.resolve(pos)` then `resolved.before(1)` for top-level block position |
| Dropdown stays open when mouse leaves editor | Radix/Base UI portal is outside editor DOM | Added `menuOpen` guard: don't clear hover state while context menu is open |
| Menu flickers when hovering different block than cursor | `mouseleave` on block clears hoveredBlock → falls back to cursor → loop | Check `relatedTarget` on mouseleave: if target is menu element, don't clear. Bidirectional leave handling. |
| Menu always visible | Visibility was tied to `editor.isFocused` which is always true when cursor is in editor | Menu visible ONLY when `isHovered \|\| menuOpen` |
| Menu too close to text | `left: 8px` positioned inside ProseMirror padding zone | Changed to `left-[10px]` with gap calculation |
| Turn Into targets cursor block, not menu block | Commands used `editor.chain().focus().setParagraph()` operating on current selection | Pass `blockPos`, each action calls `.setTextSelection(blockPos + 1)` before transform |
| Gap between menu and block content hides menu | Neither menu nor block DOM covers the gap | Added `::after` pseudo-element on menu extending 16px right as invisible hit area |
| shadcn DropdownMenu uses Base UI, not Radix | `base-nova` style selected during init | Use `finalFocus` instead of `onCloseAutoFocus`, `render` instead of `asChild`, `data-open` instead of `data-state="open"` |

## Extension Registry

| Extension | Package | Configured | Notes |
|-----------|---------|------------|-------|
| StarterKit | `@tiptap/starter-kit` | ✅ | Paragraph, Heading, Lists, Bold, Italic, Strike, Code, Blockquote, HR, History |
| TaskList | `@tiptap/extension-list` | ✅ | v3 merged import |
| TaskItem | `@tiptap/extension-list` | ✅ | v3 merged import |
| Placeholder | `@tiptap/extensions` | ✅ | Per-node: "Type '/' for commands..." on paragraphs, "Heading N" on headings |
| Image | `@tiptap/extension-image` | ❌ | Phase 6 |
| Link | `@tiptap/extension-link` | ❌ | Phase 3 (Bubble Menu) or Phase 5 |
| Underline | `@tiptap/extension-underline` | ❌ | Phase 3 (Bubble Menu) |
| CodeBlockLowlight | `@tiptap/extension-code-block-lowlight` | ❌ | Phase 6 |
| Slash | `@harshtalks/slash-tiptap` | ❌ | Phase 4, MIT, headless |

## File Index

| File | Purpose | Status |
|------|---------|--------|
| `src/App.tsx` | Root app component, renders Editor | ✅ |
| `src/main.tsx` | React entry point, StrictMode | ✅ |
| `src/global.css` | Tailwind v4 + shadcn theme + custom theme vars | ✅ |
| `src/lib/utils.ts` | `cn()` helper (clsx + twMerge) | ✅ |
| `src/components/editor/Editor.tsx` | Main editor — useEditor, extensions, renders BlockSideMenu + EditorContent | ✅ |
| `src/components/editor/EditorProvider.tsx` | EditorContext + useCurrentEditor hook | ✅ |
| `src/components/editor/styles/editor.css` | ProseMirror content styles (typography, placeholders, blocks) | ✅ |
| `src/components/editor/menus/BlockSideMenu.tsx` | Traveling +/⠿ container, `translateY` animation, visibility via `data-visible` | ✅ |
| `src/components/editor/menus/BlockContextMenu.tsx` | Dropdown menu on ⠿ click, data-driven items, Delete/Duplicate/Copy link/Turn into | ✅ |
| `src/components/editor/menus/TurnIntoSubmenu.tsx` | Turn into submenu, data-driven items, targets blockPos not cursor | ✅ |
| `src/components/editor/menus/useActiveBlock.ts` | Hook: tracks active block via hover + selection, lock mechanism for open menus | ✅ |
| `src/components/editor/menus/block-side-menu.css` | Scrollbar styles only (webkit) | ✅ |
| `src/components/ui/button.tsx` | shadcn Button (Base UI) | ✅ |
| `src/components/ui/dropdown-menu.tsx` | shadcn DropdownMenu (Base UI) | ✅ |

## Current Issues

### Pending Phase 2 Functionality (non-blocking)
- `+` button: sets cursor position only, needs slash menu integration (Phase 4)
- Drag-and-drop reorder: grip has `draggable` attribute but no DnD logic (Phase 7)
- Move to / Color submenus: placeholder "Coming soon" (Phase 7)
- Callout Turn Into: logs placeholder, needs Callout extension (Phase 6)

### CSS Note
- `global.css` has duplicate `--color-background` and `--color-accent` definitions — once in `@theme` block (custom) and once in shadcn inline theme. The shadcn vars use oklch and are consumed by shadcn components. The custom vars in `@theme` are consumed by `editor.css`. Both coexist but could cause confusion for future agents.

## Notes for Next Session

Phase 2 complete and confirmed. Next up: **Phase 3 — Bubble Menu**.

Key context for Phase 3:
- Import `BubbleMenu` from `@tiptap/react/menus` (v3 path)
- Need to install: `@tiptap/extension-link`, `@tiptap/extension-underline` for the toolbar buttons
- shadcn components needed: `Toggle`, `Separator`, `Popover` (for link editing). Install via `npx shadcn@latest add toggle separator popover`
- Remember: shadcn uses Base UI (`@base-ui/react`), not Radix. Check actual component APIs after installing.
- Follow data-driven pattern established in Phase 2 for toolbar buttons
- Research Notion's selection toolbar before implementing