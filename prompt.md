# Project: Notion-Like Block Editor

## Objective

Build a production-quality, Notion-style block-based editor from scratch. The result should feel indistinguishable from Notion's editing experience — slash commands, drag handles, bubble menus, smooth animations, polished dark UI.

## Pre-Task Research Rules

Before writing ANY code for a feature, you MUST:

1. **Search the web** for the latest docs, examples, and known issues for every library/extension you're about to use.
2. **Search for UI/UX references** — before designing any menu, toolbar, or interaction, look up how Notion, Linear, Craft, and other best-in-class editors implement it. Match that quality.
3. **Search for animation patterns** — before adding any animation, research the right approach (CSS transitions vs. framer-motion vs. CSS @starting-style). Don't guess.
4. **Verify import paths** — Tiptap v3 changed many imports (see Tech Stack below). Always confirm the correct import before using it.
5. **Never assume an API** — if you're unsure whether a method/prop exists, search first. Wrong guesses waste iterations.

## Tech Stack (Verified Versions — April 2026)

| Package                                 | Version | License | Notes                                                                                             |
| --------------------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------- |
| `@tiptap/core`                          | 3.22.x  | MIT     | Headless editor core                                                                              |
| `@tiptap/react`                         | 3.21.x  | MIT     | React bindings. BubbleMenu/FloatingMenu from `@tiptap/react/menus`                                |
| `@tiptap/pm`                            | 3.x     | MIT     | ProseMirror dependencies                                                                          |
| `@tiptap/starter-kit`                   | 3.x     | MIT     | Paragraph, Heading, Lists, Bold, Italic, Strike, Code, Blockquote, HR, History                    |
| `@tiptap/extension-placeholder`         | 3.x     | MIT     | Per-node placeholder text                                                                         |
| `@tiptap/extension-image`               | 3.x     | MIT     | Image blocks                                                                                      |
| `@tiptap/extension-list`                | 3.x     | MIT     | **v3 merged package**: BulletList, OrderedList, ListItem, ListKeymap, TaskList, TaskItem          |
| `@tiptap/extension-table`               | 3.x     | MIT     | **v3 merged package**: Table, TableRow, TableCell, TableHeader                                    |
| `@tiptap/extension-link`                | 3.x     | MIT     | Inline links                                                                                      |
| `@tiptap/extension-underline`           | 3.x     | MIT     | Underline mark                                                                                    |
| `@tiptap/extension-text-align`          | 3.x     | MIT     | Text alignment                                                                                    |
| `@tiptap/extension-code-block-lowlight` | 3.x     | MIT     | Syntax-highlighted code blocks                                                                    |
| `@tiptap/extensions`                    | 3.x     | MIT     | **v3 barrel**: Focus, Placeholder, History, Dropcursor, Gapcursor, TrailingNode                   |
| `@floating-ui/dom`                      | latest  | MIT     | **Required** — Tiptap v3 replaced tippy.js with Floating UI                                       |
| `lowlight`                              | latest  | MIT     | For code highlighting                                                                             |
| `@harshtalks/slash-tiptap`              | latest  | MIT     | Headless slash command (built on cmdk + @tiptap/suggestion)                                       |
| React                                   | 18.x    | MIT     | Tiptap UI works best with React 18                                                                |
| Vite                                    | latest  | MIT     | Dev server + bundler                                                                              |
| Tailwind CSS                            | v4      | MIT     | Utility CSS                                                                                       |
| shadcn/ui                               | CLI v4  | MIT     | Radix + Tailwind components (command, popover, dropdown-menu, tooltip, toggle, separator, button) |
| Lucide React                            | latest  | ISC     | Icons. **Always use direct imports**: `import { Bold } from "lucide-react"`                       |

### Critical Tiptap v3 Import Changes

```ts
// ❌ v2 (WRONG)
import { BubbleMenu } from "@tiptap/react";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

// ✅ v3 (CORRECT)
import { BubbleMenu } from "@tiptap/react/menus";
import { TaskList, TaskItem } from "@tiptap/extension-list";
```

### Framework

- **React + Vite** (NOT Next.js)
- TypeScript strict mode
- Path alias: `@/` → `./src/`

## Architecture

```
src/
├── components/
│   └── editor/
│       ├── Editor.tsx                 # Main editor — useEditor, extensions, renders children
│       ├── EditorProvider.tsx          # EditorContext wrapper for child components
│       ├── extensions/
│       │   ├── slash-command.ts        # Slash extension config + command items list
│       │   ├── drag-handle.ts          # ProseMirror plugin for drag handle
│       │   └── callout.ts             # Custom callout/alert node
│       ├── menus/
│       │   ├── BubbleToolbar.tsx       # Text selection toolbar (bold, italic, link, etc.)
│       │   ├── SlashMenu.tsx           # Slash command dropdown using cmdk
│       │   ├── BlockMenu.tsx           # Context menu on drag handle click (duplicate, delete, turn into)
│       │   └── LinkPopover.tsx         # Link edit/create popover
│       ├── blocks/
│       │   ├── CalloutBlock.tsx        # Callout ReactNodeView
│       │   ├── ImageBlock.tsx          # Image with upload/URL input
│       │   └── CodeBlock.tsx           # Syntax-highlighted code block
│       ├── ui/
│       │   ├── ToolbarButton.tsx       # Reusable icon button for toolbars
│       │   └── MenuSection.tsx         # Section header in menus
│       └── styles/
│           ├── editor.css              # Editor content styles (typography, blocks)
│           └── menus.css               # Menu/toolbar styles (if not using Tailwind)
├── lib/
│   └── utils.ts                       # cn() helper from shadcn
├── App.tsx
├── main.tsx
└── index.css                          # Tailwind v4 base: @import "tailwindcss"
```

### Architecture Rules

- **One responsibility per file** — no 500-line components.
- **Extensions config separate from UI** — extension logic in `extensions/`, React components in `menus/` or `blocks/`.
- **All editor child components** access editor via `useCurrentEditor()` or prop drilling. No global state library.
- **No inline styles** — use Tailwind classes or CSS files.
- **No `any` types** — type everything properly. Use Tiptap's exported types.

## Phases

### Phase 1 — Core Editor

Set up Vite + React + Tailwind v4 + shadcn/ui. Create the editor with:

- StarterKit (paragraph, headings 1-3, bullet/ordered list, blockquote, code block, bold, italic, strike, inline code, HR, history)
- TaskList + TaskItem from `@tiptap/extension-list`
- Placeholder extension (per-node: "Type '/' for commands..." on paragraphs, "Heading 1" on headings, etc.)
- Dark theme (zinc palette)
- Clean typography: Inter font, 16px base, 1.75 line height, proper heading sizes, block spacing
- **No toolbar, no menus yet** — just a clean, styled, typeable editor

### Phase 2 — Bubble Menu

- Appears on text selection
- Buttons: Bold, Italic, Strikethrough, Code, Underline, Link, separator, turn-into dropdown (text → heading, list, quote)
- Built with shadcn `Toggle` + `Separator` + `Popover`
- Smooth fade-in animation
- **Research**: Look up how Notion's selection toolbar looks and behaves. Match the spacing, grouping, and feel.

### Phase 3 — Slash Commands

- Triggered by typing `/`
- Uses `@harshtalks/slash-tiptap` for extension logic
- UI uses shadcn `Command` (cmdk-based) for the dropdown
- Commands: Text, Heading 1-3, Bullet List, Numbered List, Task List, Quote, Code Block, Divider, Callout, Image
- Each item has: icon (Lucide), title, description, keyboard shortcut hint
- Grouped by category: "Basic", "Lists", "Media", "Advanced"
- Search/filter as user types
- Keyboard nav: arrows, enter, escape
- **Research**: Study Notion's slash menu grouping, icons, descriptions, and animation. Replicate the feel.

### Phase 4 — Drag Handle + Block Menu

- Drag handle appears on hover to the left of each block (⠿ icon)
- Click opens a context menu (shadcn `DropdownMenu`): Duplicate, Delete, Turn into (submenu), Move up, Move down
- Drag to reorder blocks
- **Research**: Look up ProseMirror drag handle implementations and Tiptap's open source DragHandle extension API.

### Phase 5 — Link Popover

- When cursor is on a link: show floating popover with URL, edit button, unlink button
- When creating a link from bubble toolbar: popover with URL input + paste detection
- Use shadcn `Popover` + `Input`

### Phase 6 — Custom Blocks

- **Callout block**: Colored left border, emoji picker, editable content inside. Uses `ReactNodeViewRenderer`.
- **Image block**: Click to add → URL input or file upload placeholder. Caption below.
- **Code block**: Syntax highlighting with lowlight. Language selector dropdown.

### Phase 7 — Polish & Animation

- Block hover transitions (drag handle appear/disappear)
- Menu open/close animations (scale + fade, 150ms)
- Smooth cursor and selection rendering
- Focus ring on the editor area
- Responsive: works on mobile viewports
- **Research**: Study CSS `@starting-style` for entry animations, Radix `data-[state]` attributes for transitions. Don't use framer-motion unless truly needed.

## Design System

### Colors (Zinc Dark)

```
Background:     #09090b (zinc-950)
Surface:        #18181b (zinc-900)
Surface hover:  #27272a (zinc-800)
Border:         #27272a (zinc-800)
Text primary:   #fafafa (zinc-50)
Text secondary: #a1a1aa (zinc-400)
Text muted:     #52525b (zinc-600)
Accent:         #3b82f6 (blue-500)
```

### Typography

```
Font:           Inter, system-ui, sans-serif
Base size:      16px
Line height:    1.75
H1:             2em, 700 weight, -0.025em tracking
H2:             1.5em, 600 weight, -0.02em tracking
H3:             1.25em, 600 weight
Code:           JetBrains Mono, monospace, 14px
```

### Spacing

```
Block gap:      0.75em between blocks
Editor padding: 3rem horizontal, 4rem vertical
Menu padding:   6px internal
Menu radius:    12px
Button radius:  6px
```

## Quality Checklist (apply to every phase)

- [ ] No TypeScript errors (strict mode)
- [ ] No console warnings or errors
- [ ] Keyboard accessible (tab, enter, escape, arrows)
- [ ] Dark theme looks polished — no white flashes, no unstyled elements
- [ ] Responsive down to 375px width
- [ ] No memory leaks (cleanup subscriptions, event listeners in useEffect returns)
- [ ] Code is clean, commented where non-obvious, no dead code
