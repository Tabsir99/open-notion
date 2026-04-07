# SPEC.md — Product Specification

> What to build. Load this when starting a new phase, not every session.
> For agent rules and gotchas → `CLAUDE.md`. For current state → `STATUS.md`.

---

## Objective

A production-quality, Notion-style block-based editor. The result should feel indistinguishable from Notion's editing experience — slash commands, drag handles, bubble menus, smooth animations, polished dark UI.

---

## Tech Stack

| Package | Version | Notes |
|---|---|---|
| `@tiptap/core` | 3.22.x | Headless editor core |
| `@tiptap/react` | 3.21.x | BubbleMenu/FloatingMenu from `@tiptap/react/menus` |
| `@tiptap/pm` | 3.x | ProseMirror dependencies |
| `@tiptap/starter-kit` | 3.x | Paragraph, Heading, Lists, Bold, Italic, Strike, Code, Blockquote, HR, History |
| `@tiptap/extension-list` | 3.x | BulletList, OrderedList, ListItem, ListKeymap, TaskList, TaskItem |
| `@tiptap/extension-table` | 3.x | Table, TableRow, TableCell, TableHeader |
| `@tiptap/extension-link` | 3.x | Inline links |
| `@tiptap/extension-underline` | 3.x | Underline mark |
| `@tiptap/extension-text-align` | 3.x | Text alignment |
| `@tiptap/extension-code-block-lowlight` | 3.x | Syntax-highlighted code blocks |
| `@tiptap/extension-image` | 3.x | Image blocks |
| `@tiptap/extensions` | 3.x | Focus, Placeholder, Dropcursor, Gapcursor, TrailingNode |
| `@tiptap/suggestion` | 3.x | Slash command suggestion plugin |
| `@floating-ui/dom` | latest | Tiptap v3 replaced tippy.js with this |
| `lowlight` | latest | Code syntax highlighting |
| React | 18.x | — |
| Vite | latest | Dev server + bundler |
| Tailwind CSS | v4 | `@tailwindcss/vite` plugin, no `tailwind.config.js` |
| shadcn/ui | CLI v4 | `base-nova` style — uses `@base-ui/react`, NOT Radix |
| `@base-ui/react` | latest | Primitives for all shadcn components |
| Lucide React | latest | Direct imports only: `import { Bold } from "lucide-react"` |

**Framework:** React + Vite (not Next.js). TypeScript strict mode. Path alias `@/` → `./src/`.

---

## Architecture

```
src/
├── components/
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── EditorProvider.tsx
│   │   ├── menus/
│   │   │   ├── BlockSideMenu.tsx
│   │   │   ├── BlockContextMenu.tsx
│   │   │   ├── TurnIntoSubmenu.tsx
│   │   │   ├── useActiveBlock.ts
│   │   │   ├── BubbleToolbar.tsx
│   │   │   ├── SlashMenu.tsx
│   │   │   ├── slash-items.ts
│   │   │   ├── LinkPopover.tsx        ← Phase 5.3
│   │   │   └── block-side-menu.css
│   │   ├── blocks/
│   │   │   ├── ImageBlock.tsx
│   │   │   ├── CodeBlock.tsx          ← Phase 5.2
│   │   │   └── CalloutBlock.tsx       ← Phase 5.4
│   │   └── styles/
│   │       └── editor.css
│   └── ui/
│       ├── button.tsx
│       ├── dropdown-menu.tsx
│       ├── toggle.tsx
│       ├── separator.tsx
│       └── popover.tsx
├── lib/utils.ts
├── App.tsx
├── main.tsx
└── global.css
```

**Architecture rules:**
- One responsibility per file.
- Extensions config in `extensions/` or alongside the block. React UI in `menus/` or `blocks/`.
- Editor child components access editor via `useCurrentEditor()` or prop drilling. No global state library.

---

## Phases

### Phase 1 — Core Editor ✅
Vite + React + Tailwind v4 + shadcn/ui (base-nova). StarterKit, TaskList, TaskItem, Placeholder. Dark theme, clean typography.

### Phase 2 — Block Side Menu ✅
Single traveling `+`/`⠿` menu instance. Smooth `translateY` animation. Block Context Menu with Delete, Duplicate, Copy link, Turn into submenu. Custom `useActiveBlock` hook.

### Phase 3 — Bubble Menu ✅
Appears on text selection. Buttons: Bold, Italic, Strikethrough, Code, Underline, Link, separator, turn-into dropdown. Built with shadcn Toggle + Separator + Popover. Fade-in animation.

### Phase 4 — Slash Commands ✅
`/` opens Notion-style command menu. Arrow keys navigate, Enter executes, Escape closes. Typing filters. `+` button in BlockSideMenu triggers it at that block. Built with `@tiptap/suggestion` + standalone React state + Base UI Popover.

### Phase 5 — Custom Blocks + Link Popover
- **5.1 Image block** ✅ — URL input / upload placeholder, caption, alignment
- **5.2 Code block** ⬜ — `CodeBlockLowlight`, lowlight syntax highlighting, language selector
- **5.3 Link popover** ⬜ — cursor-on-link floating popover + bubble-toolbar link creation flow
- **5.4 Callout block** ⬜ — ReactNodeView, emoji picker, colored border
- **5.5 Wire Callout into TurnIntoSubmenu** ⬜

### Phase 6 — Polish & Animation
- Drag-and-drop reorder (wire up grip button DnD)
- SlashMenu: smooth traveling highlight element between items. Scale-in animation on first appear. Decoration on `/` character in editor (configurable via plugin options).
- Block hover transitions
- Move to / Color submenus (currently "Coming soon")
- Theme finalization by editing `global.css` variables only

---

## Design System

### Theming

Two color systems, no hardcoding:
1. **shadcn CSS vars** (`--popover`, `--muted-foreground`, `--accent`, etc.) — consumed by shadcn components automatically.
2. **Editor CSS vars** (`--editor-surface`, `--editor-text`, etc.) — consumed by `editor.css`.

Theme finalization = editing `global.css` variables only.

### Typography

| Property | Value |
|---|---|
| Font | Geist Variable, sans-serif → `var(--font-sans)` |
| Mono | JetBrains Mono → `var(--font-mono)` |
| Base size | 16px |
| Line height | 1.75 |
| H1 | 2em, 700 weight, -0.025em tracking |
| H2 | 1.5em, 600 weight, -0.02em tracking |
| H3 | 1.25em, 600 weight |
| Code | `var(--font-mono)`, 14px |

### Spacing

| Element | Value |
|---|---|
| Block gap | 0.75em |
| Editor padding | 3rem |
| Editor max-width | 880px, centered |
| Menu padding | `p-1` (4px) |
| Menu radius | `rounded-[10px]` |
| Side menu position | `left-[10px]`, absolutely positioned |
| Side menu buttons | shadcn `Button` `variant="ghost" size="icon"` |

### Menus

- All dropdowns use shadcn DropdownMenu (Base UI), no color overrides
- `modal={false}` on all dropdowns coexisting with the editor
- `finalFocus` callback to restore editor focus on close
- Popup structural classes: `w-[260px] max-h-[400px] overflow-y-auto p-1 rounded-[10px]`

---

## Quality Checklist (apply to every phase)

- [ ] No TypeScript errors (strict mode)
- [ ] No console warnings or errors
- [ ] Keyboard accessible (Tab, Enter, Escape, arrows)
- [ ] Dark theme looks polished — no white flashes, no unstyled elements
- [ ] Responsive down to 375px
- [ ] No memory leaks (cleanup in useEffect returns)
- [ ] Data-driven: repeated UI uses typed arrays + `.map()`
- [ ] shadcn components used where available
- [ ] Base UI APIs used correctly (not Radix)