# Notion-Like Editor — Agent Memory

> This file is the persistent memory for any AI agent working on this project.
> **Update this file** whenever you: learn something new, fix a bug, discover a gotcha, or make an architectural decision.
> Read this file in full before starting any task.

## Project Overview

A Notion-style block editor built with Tiptap v3 (MIT), React 18, Vite, Tailwind CSS v4, and shadcn/ui. No paid/Pro Tiptap extensions. See `PROMPT.md` for full spec.

## Current Status

- [x] Phase 1 — Core Editor
- [ ] Phase 2 — Bubble Menu
- [ ] Phase 3 — Slash Commands
- [ ] Phase 4 — Drag Handle + Block Menu
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

### NOTE: Update your progress frequently. Not only at the end of session, but mid session if you think it is needed.

## Decisions Log

<!-- Record architectural decisions here with reasoning -->

| Date       | Decision                                         | Reasoning                                                     |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------- |
| 2026-04-05 | Installed Vite + React + Tailwind v4 + shadcn/ui | Initial setup.                                                |
| 2026-04-05 | Manual components.json                           | shadcn init fails with Tailwind v4, so bypassed it correctly. |

## Gotchas & Fixes

<!-- When you hit a bug and fix it, document it here so it never happens again -->

| Problem | Cause | Fix |
| ------- | ----- | --- |
|         |       |     |

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

| File | Purpose | Status |
| ---- | ------- | ------ |
|      |         |        |

## Current Issues

<!-- Active bugs or blockers -->

## Notes for Next Session

<!-- Leave breadcrumbs for the next agent/session -->

Phase 1 is complete. Core Editor is styled and typeable, Placeholder extension configured. TaskList configured.
Next up: Phase 2 - Bubble Menu with shadcn Toggle, Separator, and Popover.
