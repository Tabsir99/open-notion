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
6. **shadcn-first** — when a UI element is needed (dropdown, popover, dialog, toggle, button, tooltip, etc.), always search the latest [shadcn/ui docs](https://ui.shadcn.com) first. Use the shadcn component if one exists. Only build custom elements when shadcn doesn't cover the use case.
<!-- 7. **tiptap-components** -- (https://tiptap.dev/components) for various toolbar related components and utilities always search form here, read the docs properly, install and apply. But you can avoid it for now, we will see it in the last phase of work during polishing the UI. But keep in mind. -->

## Tech Stack (Verified Versions — April 2026)

| Package | Version | License | Notes |
|---|---|---|---|
| `@tiptap/core` | 3.22.x | MIT | Headless editor core |
| `@tiptap/react` | 3.21.x | MIT | React bindings. BubbleMenu/FloatingMenu from `@tiptap/react/menus` |
| `@tiptap/pm` | 3.x | MIT | ProseMirror dependencies |
| `@tiptap/starter-kit` | 3.x | MIT | Paragraph, Heading, Lists, Bold, Italic, Strike, Code, Blockquote, HR, History |
| `@tiptap/extension-placeholder` | 3.x | MIT | Per-node placeholder text (imported from `@tiptap/extensions`) |
| `@tiptap/extension-image` | 3.x | MIT | Image blocks |
| `@tiptap/extension-list` | 3.x | MIT | **v3 merged package**: BulletList, OrderedList, ListItem, ListKeymap, TaskList, TaskItem |
| `@tiptap/extension-table` | 3.x | MIT | **v3 merged package**: Table, TableRow, TableCell, TableHeader |
| `@tiptap/extension-link` | 3.x | MIT | Inline links |
| `@tiptap/extension-underline` | 3.x | MIT | Underline mark |
| `@tiptap/extension-text-align` | 3.x | MIT | Text alignment |
| `@tiptap/extension-code-block-lowlight` | 3.x | MIT | Syntax-highlighted code blocks |
| `@tiptap/extensions` | 3.x | MIT | **v3 barrel**: Focus, Placeholder, History, Dropcursor, Gapcursor, TrailingNode |
| `@floating-ui/dom` | latest | MIT | **Required** — Tiptap v3 replaced tippy.js with Floating UI |
| `lowlight` | latest | MIT | For code highlighting |
| `@harshtalks/slash-tiptap` | latest | MIT | Headless slash command (built on cmdk + @tiptap/suggestion) |
| React | 18.x | MIT | Tiptap UI works best with React 18 |
| Vite | latest | MIT | Dev server + bundler |
| Tailwind CSS | v4 | MIT | Utility CSS, `@tailwindcss/vite` plugin |
| shadcn/ui | CLI v4 | MIT | **`base-nova` style — uses `@base-ui/react` (NOT Radix)**. Components: dropdown-menu, button, popover, command, toggle, separator, tooltip |
| `@base-ui/react` | latest | MIT | Primitives used by shadcn base-nova style. Replaces `@radix-ui/react-*` |
| Lucide React | latest | ISC | Icons. **Always use direct imports**: `import { Bold } from "lucide-react"` |

### Critical: shadcn Uses Base UI, NOT Radix

This project uses shadcn `base-nova` style. All shadcn components use `@base-ui/react` primitives:
```ts
// ❌ WRONG — Radix
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"

// ✅ CORRECT — Base UI
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
```

Base UI API differences from Radix to remember:
- `onCloseAutoFocus` → `finalFocus` (callback returning false to prevent default)
- `Trigger` uses `render` prop instead of `asChild`
- Portal/Positioner/Popup pattern instead of Radix's Content-only pattern
- `data-open` / `data-closed` instead of `data-state="open"` / `data-state="closed"`
- `modal={false}` on `DropdownMenu` root to avoid focus trapping with editor

### Critical Tiptap v3 Import Changes
```ts
// ❌ v2 (WRONG)
import { BubbleMenu } from "@tiptap/react";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

// ✅ v3 (CORRECT)
import { BubbleMenu } from "@tiptap/react/menus";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
```

### Framework

- **React + Vite** (NOT Next.js)
- TypeScript strict mode
- Path alias: `@/` → `./src/`
- Tailwind v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js`)

## Architecture
```
src/
├── components/
│   ├── editor/
│   │   ├── Editor.tsx                 # Main editor — useEditor, extensions, renders children
│   │   ├── EditorProvider.tsx         # EditorContext wrapper + useCurrentEditor hook
│   │   ├── extensions/
│   │   │   ├── slash-command.ts       # Slash extension config + command items list
│   │   │   └── callout.ts            # Custom callout/alert node
│   │   ├── menus/
│   │   │   ├── BlockSideMenu.tsx      # Traveling +/⠿ container, absolutely positioned
│   │   │   ├── BlockContextMenu.tsx   # Dropdown menu on ⠿ click (data-driven)
│   │   │   ├── TurnIntoSubmenu.tsx    # Turn into submenu items (data-driven)
│   │   │   ├── useActiveBlock.ts      # Hook: tracks active block via selection + hover
│   │   │   ├── BubbleToolbar.tsx      # Text selection toolbar
│   │   │   ├── SlashMenu.tsx          # Slash command dropdown
│   │   │   ├── LinkPopover.tsx        # Link edit/create popover
│   │   │   └── block-side-menu.css    # Minimal CSS (scrollbar styling only)
│   │   ├── blocks/
│   │   │   ├── CalloutBlock.tsx       # Callout ReactNodeView
│   │   │   ├── ImageBlock.tsx         # Image with upload/URL input
│   │   │   └── CodeBlock.tsx          # Syntax-highlighted code block
│   │   └── styles/
│   │       └── editor.css             # ProseMirror content styles (typography, blocks)
│   └── ui/
│       ├── button.tsx                 # shadcn Button (Base UI)
│       └── dropdown-menu.tsx          # shadcn DropdownMenu (Base UI)
├── lib/
│   └── utils.ts                       # cn() helper
├── App.tsx
├── main.tsx
└── global.css                         # Tailwind v4 + shadcn theme vars + custom theme vars
```

### Architecture Rules

- **One responsibility per file** — no 500-line components.
- **Extensions config separate from UI** — extension logic in `extensions/`, React components in `menus/` or `blocks/`.
- **All editor child components** access editor via `useCurrentEditor()` or prop drilling. No global state library.
- **No inline styles** — use Tailwind classes. Only exception: dynamic `transform` values via `style` prop.
- **No `any` types** — type everything properly. Use Tiptap's exported types.
- **Data-driven UI** — menu items, toolbar buttons, and repeated structures defined as typed arrays, rendered via `.map()`. Icons use `LucideIcon` type in data arrays.


### UI/UX Consistency Rules

#### Styling Philosophy: shadcn-Defaults-First

**The #1 rule: Let shadcn handle colors.** Do not add Tailwind color classes (`bg-zinc-900`, `text-zinc-400`, `border-zinc-800`, etc.) to shadcn components. They already have correct colors via CSS variables (`--popover`, `--muted-foreground`, `--border`, etc.).

Why: At Phase 7 we will finalize the theme by editing CSS variables in `global.css`. If colors are hardcoded in component classes, nothing updates. If everything uses shadcn defaults, one variable change themes the entire app.

**What you MAY add to shadcn components:**
- **Layout**: `flex`, `items-center`, `gap-2`, `justify-between`
- **Sizing**: `w-[260px]`, `max-h-[400px]`, `h-8`, `size-4`
- **Spacing**: `px-2`, `py-1`, `p-1`, `my-1`
- **Border radius overrides**: `rounded-[10px]` (when shadcn default doesn't match design)
- **Typography sizing**: `text-[13px]`, `text-xs`, `font-mono`
- **Overflow**: `overflow-y-auto`, `overflow-hidden`
- **Position**: `absolute`, `relative`, `z-10`
- **Transitions**: `transition-[transform,opacity]`, `duration-250`
- **Display/visibility**: `pointer-events-none`, `opacity-0`

**What you must NOT add:**
- `bg-zinc-*`, `bg-neutral-*`, `bg-slate-*` — use shadcn's `bg-popover`, `bg-muted`, `bg-accent` or nothing
- `text-zinc-*`, `text-neutral-*` — use shadcn's `text-popover-foreground`, `text-muted-foreground` or nothing
- `border-zinc-*` — use shadcn's `border-border` or nothing
- `shadow-*` with hardcoded rgba — let shadcn `shadow-md`, `shadow-lg` handle it
- `hover:bg-zinc-*` — shadcn components already have `focus:bg-accent` etc.

**For editor content styling** (`editor.css`), use `var(--editor-*)` CSS variables. These are the ONLY place where explicit color values exist, and they're defined once in `global.css`.

**For custom (non-shadcn) elements** that need theming, use shadcn's semantic classes:
- Background: `bg-background`, `bg-popover`, `bg-muted`, `bg-accent`
- Text: `text-foreground`, `text-popover-foreground`, `text-muted-foreground`
- Border: `border-border`

#### Menus & Dropdowns

- All dropdown/context menus use shadcn `DropdownMenu` (Base UI) with **no color overrides**.
- Structural classes only: `w-[260px] max-h-[400px] overflow-y-auto p-1 rounded-[10px]`
- Menu items: `flex items-center gap-2 h-8 px-2 py-1 rounded-md` — no color classes
- Shortcuts: `ml-auto text-xs font-mono` — no color classes (shadcn's `DropdownMenuShortcut` already handles muted color)
- Use `modal={false}` on dropdown menus that coexist with the editor
- Use `finalFocus` callback to restore editor focus

#### Data-Driven UI Pattern

Menu items, toolbar buttons, and repeated structures defined as typed arrays, rendered via `.map()`. Icons use `LucideIcon` type. The render function applies structural classes once — never per-item color overrides.

#### Animations & Transitions

- Side menu travel: `transition-[transform,opacity] duration-250 ease-out`
- Visibility: `data-[visible=true]` attribute toggling `opacity` + `pointer-events`
- Menu open/close: shadcn defaults (don't override animation classes)
- No framer-motion unless truly needed

#### Spacing & Layout

- Block gap: `0.75em` (in `editor.css`)
- Editor padding: `3rem` (in `editor.css`)
- Editor wrapper: `max-w-[880px]`, centered
- Side menu: absolutely positioned, `left-[10px]`
- Side menu buttons: shadcn `Button` with `variant="ghost" size="icon"` — no extra classes

#### Interaction Patterns

- Use `finalFocus` callback (Base UI) to restore editor focus after menu closes
- Use `modal={false}` on dropdown menus
- Active block tracking: custom `useActiveBlock` hook with `locked` param

### Component Guidelines

- **Always prefer shadcn components** — search the [latest shadcn/ui registry](https://ui.shadcn.com) first before building custom UI.
- **Remember: Base UI, not Radix** — check the actual component source in `src/components/ui/` before using any primitive API.
- Use `cn()` from `@/lib/utils` for conditional/merged class names.
- Direct Lucide imports only: `import { Icon } from "lucide-react"`.
- Use `LucideIcon` type for icon props in data arrays.

## Phases

### Phase 1 — Core Editor ✅
Vite + React + Tailwind v4 + shadcn/ui (base-nova). Editor with StarterKit, TaskList, TaskItem, Placeholder. Dark theme, clean typography.

### Phase 2 — Block Side Menu ✅
Single traveling menu instance with `+` and `⠿` icons. Smooth `translateY` animation between blocks. Block Context Menu with Delete, Duplicate, Copy link, Turn into (submenu), placeholder submenus. Custom `useActiveBlock` hook with hover + selection tracking and lock mechanism.

**Pending functionality (not blocking next phases):**
- `+` button: currently sets cursor position only, needs slash menu integration (Phase 4).
- Drag-and-drop reorder: grip has `draggable` but no DnD logic yet.
- Move to / Color submenus: placeholder "Coming soon".

### Phase 3 — Bubble Menu ✅
- Appears on text selection using `BubbleMenu` from `@tiptap/react/menus`
- Buttons: Bold, Italic, Strikethrough, Code, Underline, Link, separator, turn-into dropdown
- Built with shadcn `Toggle` + `Separator` + `Popover`
- Smooth fade-in animation
- **Research**: Look up how Notion's selection toolbar looks and behaves. Match the spacing, grouping, and feel.

### Phase 4 — Slash Commands

Triggered by typing /
Uses @harshtalks/slash-tiptap for both extension logic AND headless UI (SlashCmd.Root, SlashCmd.Cmd, SlashCmd.List, SlashCmd.Item, SlashCmd.Empty) — it's already cmdk-based, no shadcn Command needed
Wrap editor in SlashCmdProvider; add enableKeyboardNavigation to editorProps.handleDOMEvents.keydown
Suggestions defined via createSuggestionsItems() as a typed array with: title, searchTerms, icon (LucideIcon), description, shortcut, group, command
Commands: Text, Heading 1–3, Bullet List, Numbered List, Task List, Quote, Code Block, Divider, Callout (placeholder until Phase 5.1), Image (placeholder until Phase 5.2)
Grouped by category: Basic / Lists / Media / Advanced — rendered as section headers between mapped SlashCmd.Items
Search/filter is built into cmdk — free, no extra work
Style SlashCmd.* with Tailwind using shadcn semantic classes only (bg-popover, text-popover-foreground, border-border, shadow-md, rounded-[10px], p-1, w-[280px], max-h-[340px], overflow-y-auto). No hardcoded colors. Follow the same shadcn-defaults-first rules as every other menu
Item row layout: icon (size-5, muted container) + title (text-sm) + description (text-xs, text-muted-foreground) + shortcut hint (ml-auto, text-xs font-mono text-muted-foreground)
Wire + button in BlockSideMenu: on click, focus editor → setTextSelection(blockPos + 1) → insertContent('/'). The slash extension auto-detects and opens the menu at that position
Research: Notion's slash menu — group header styling, item spacing, icon containers, description text, keyboard shortcut badges, open/close animation

New files:

src/components/editor/extensions/slash-command.tsx — Slash.configure() + createSuggestionsItems() array with typed SlashItem[]
src/components/editor/menus/SlashMenu.tsx — renders SlashCmd.Root + item row component, consumes suggestions array
Update Editor.tsx — add Slash extension, wrap in SlashCmdProvider, mount <SlashMenu />
Update BlockSideMenu.tsx — wire + button click handler

Deliverable: Typing / anywhere opens a Notion-style command menu. Arrow keys navigate, enter executes, escape closes. + button in the side menu triggers it at that block. All items either work or clearly log a placeholder (Callout, Image).

### Phase 5 — Link Popover
- When cursor is on a link: show floating popover with URL, edit button, unlink button
- When creating a link from bubble toolbar: popover with URL input + paste detection
- Use shadcn `Popover` + `Input`

### Phase 6 — Custom Blocks
- **Callout block**: Colored left border, emoji picker, editable content. `ReactNodeViewRenderer`.
- **Image block**: Click to add → URL input or file upload placeholder. Caption below.
- **Code block**: Syntax highlighting with lowlight. Language selector dropdown.
- Wire up "Callout" in TurnIntoSubmenu.

### Phase 7 — Polish & Animation
- Drag-and-drop reorder (wire up grip button DnD)
- Block hover transitions
- Menu open/close animations refinement
- Smooth cursor and selection rendering
- Focus ring on the editor area
- Responsive: works on mobile viewports (375px+)
- Move to / Color submenus implementation
- **Research**: CSS `@starting-style`, Base UI `data-[state]` attributes for transitions.


## Design System

### Theming Strategy

All colors flow through two systems:
1. **shadcn CSS variables** (`--popover`, `--muted-foreground`, `--accent`, etc.) — consumed by shadcn components automatically. Defined in `:root` and `.dark` in `global.css`.
2. **Editor CSS variables** (`--editor-surface`, `--editor-text`, `--editor-accent`, etc.) — consumed by `editor.css` for ProseMirror content styling. Defined alongside shadcn vars in `global.css`.

**No hardcoded colors in components.** If you need a color, either:
- Use a shadcn semantic class (`bg-muted`, `text-muted-foreground`)
- Or define a new CSS variable in `global.css` and reference it

Theme finalization happens in Phase 7 by editing `global.css` variables only.

### Typography
```
Font:           Geist Variable, sans-serif    → var(--font-sans)
Mono:           JetBrains Mono, monospace     → var(--font-mono)
Base size:      16px
Line height:    1.75
H1:             2em, 700 weight, -0.025em tracking
H2:             1.5em, 600 weight, -0.02em tracking
H3:             1.25em, 600 weight
Code:           var(--font-mono), 14px
```

### Spacing
```
Block gap:      0.75em between blocks
Editor padding: 3rem
Menu padding:   p-1 (4px)
Menu radius:    rounded-[10px]
Button radius:  shadcn default (rounded-lg)
Side menu btn:  size="icon" (shadcn Button)
```
```

## Quality Checklist (apply to every phase)

- [ ] No TypeScript errors (strict mode)
- [ ] No console warnings or errors
- [ ] Keyboard accessible (tab, enter, escape, arrows)
- [ ] Dark theme looks polished — no white flashes, no unstyled elements
- [ ] Responsive down to 375px width
- [ ] No memory leaks (cleanup subscriptions, event listeners in useEffect returns)
- [ ] Code is clean, commented where non-obvious, no dead code
- [ ] Data-driven: repeated UI elements use typed arrays + `.map()`
- [ ] shadcn components used where available
- [ ] Base UI APIs used correctly (not Radix APIs)