# CLAUDE.md — Agent Memory

> Read this file in full before starting any task.
> Update this file when you fix bugs, discover gotchas, or make architectural decisions.
> For project spec and phases → `SPEC.md`. For decisions history → `DECISIONS.md`. For current task state → `STATUS.md`.

---

## Agent Workflow Rules YOU MUST FOLLOW ALL OF THESE

- **Search before coding.** Before implementing any feature, search for latest docs, known issues, and UI references (Notion, Linear, Craft). Never assume an API exists.
- **shadcn-first.** When a UI element is needed, check shadcn/ui first. Only build custom if shadcn doesn't cover it.
- **Stop and ask after visual features.** Do not test UI via screenshots or automation. After implementing anything visual/interactive, stop and ask the user to test live.
- **Do not mark a phase complete** until the user confirms it.
- **One component per file, max ~150 lines.**
- **No `any` types.** Use Tiptap's exported types (`Editor`, `Node`, `Mark`, `JSONContent`, etc.).
- **Always clean up in `useEffect` returns.**
- **Direct Lucide imports only:** `import { Bold } from "lucide-react"` — never barrel import.
- **Tailwind classes only** — no inline styles except dynamic `transform` values via `style` prop.
- **Data-driven UI:** repeated structures use typed arrays + `.map()`. Icons use `LucideIcon` type. className appears once in render.
- **Use `cn()`** from `@/lib/utils` for conditional class merging.
- **Use Clean architechure and try to avoid verbose code. Write maintainable code.**

---

## Critical: shadcn Uses Base UI, NOT Radix

This project uses shadcn `base-nova` style. All primitives come from `@base-ui/react`, not `@radix-ui/react-*`.

| Radix (wrong) | Base UI (correct) |
|---|---|
| `onCloseAutoFocus` | `finalFocus` — callback, return `false` to prevent default |
| `asChild` | `render` prop on Trigger |
| `data-state="open"` | `data-open` / `data-closed` |
| `Content` only | `Portal → Positioner → Popup` |
| — | `modal={false}` on dropdowns that coexist with the editor |

**Always check the actual component source in `src/components/ui/`** before using any primitive API.

---

## Critical: Tiptap v3 Import Changes

```ts
// ❌ v2 — WRONG
import { BubbleMenu } from "@tiptap/react";
import TaskList from "@tiptap/extension-task-list";

// ✅ v3 — CORRECT
import { BubbleMenu } from "@tiptap/react/menus";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
```

- **BubbleMenu / FloatingMenu** → `@tiptap/react/menus`
- **Lists** (TaskList, TaskItem, BulletList, OrderedList, ListItem, ListKeymap) → `@tiptap/extension-list`
- **Table extensions** → `@tiptap/extension-table`
- **Utility extensions** (Focus, Placeholder, Dropcursor, Gapcursor, TrailingNode) → `@tiptap/extensions`
- **`shouldRerenderOnTransaction: true`** required in `useEditor` config so toolbar buttons reflect state changes. Or use `useEditorState` hook.
- **Floating UI:** Tiptap v3 uses `@floating-ui/dom`. Do not use tippy.js.

---

## Styling Rules

### No Hardcoded Colors

Never add color classes to shadcn components. They inherit via CSS variables automatically.

**Allowed on shadcn components:** layout (`flex`, `items-center`), sizing (`w-[260px]`, `h-8`), spacing (`px-2`, `p-1`), border radius overrides, typography size (`text-xs`, `font-mono`), overflow, position, transitions.

**Never add:** `bg-zinc-*`, `text-neutral-*`, `border-slate-*`, `hover:bg-zinc-*`, hardcoded `shadow-*` with rgba.

**For custom (non-shadcn) elements:** use semantic classes — `bg-background`, `bg-popover`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`.

**For editor content:** use `var(--editor-*)` variables defined in `global.css`. Never put explicit color values in `editor.css`.

All color values defined exactly **once** in `global.css` under `:root` and `.dark`. If a new color is needed, add a CSS variable there — never hardcode hex/oklch in a component.

---

## Gotchas & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| `editor.isFocused` in useEffect doesn't trigger re-render | It's a getter, not reactive state | Listen to `editor.on('focus')` and `editor.on('blur')` separately |
| `editor.view.posAtDOM(blockEl, 0)` returns positions inside text nodes | `posAtDOM` resolves to nearest position | Use `doc.resolve(pos)` then `resolved.before(1)` for top-level block position |
| Dropdown stays open when mouse leaves editor | Base UI portal is outside editor DOM | Added `menuOpen` guard: don't clear hover state while context menu is open |
| Menu flickers when hovering different block than cursor | `mouseleave` clears hoveredBlock → falls back to cursor → loop | Check `relatedTarget` on mouseleave: if target is menu element, don't clear |
| Turn Into targets cursor block, not menu block | Commands operated on current selection | Pass `blockPos`; each action calls `.setTextSelection(blockPos + 1)` before transform |
| Gap between menu and block content hides menu | Neither menu nor block DOM covers the gap | `::after` pseudo-element on menu extending 16px right as invisible hit area |
| Toolbar buttons don't update on mark toggle | `shouldRerenderOnTransaction` disabled by default in v3 | Set `shouldRerenderOnTransaction: true` in `useEditor` config |
| Slash menu keyboard events bleed to ProseMirror | Suggestion plugin and DOM both handle arrow/enter | `e.preventDefault()` on Arrow and Enter keys in the slash menu handler |

---

## Extension Registry

| Extension | Package | Active | Notes |
|-----------|---------|--------|-------|
| StarterKit | `@tiptap/starter-kit` | ✅ | Paragraph, Heading, Lists, Bold, Italic, Strike, Code, Blockquote, HR, History |
| TaskList | `@tiptap/extension-list` | ✅ | v3 merged import |
| TaskItem | `@tiptap/extension-list` | ✅ | v3 merged import |
| Placeholder | `@tiptap/extensions` | ✅ | Per-node: "Type '/' for commands…" on paragraphs, "Heading N" on headings |
| Image (custom) | `@tiptap/extension-image` | ✅ | Phase 5.1. Custom NodeView `ImageBlock.tsx`. `caption`, `align`, `width` attrs |
| Link | `@tiptap/extension-link` | ✅ | `openOnClick: false`. Styled via `.editor-link` class |
| Underline | `@tiptap/extension-underline` | ✅ | Toggled via BubbleToolbar |
| Slash | `@tiptap/suggestion` (custom) | ✅ | Phase 4. Standalone React state + Base UI Popover. No ReactRenderer or cmdk |
| CodeBlock (custom) | `@tiptap/extension-code-block` | ✅ | Phase 5.3. Shiki decorations, ReactNodeView `CodeBlock/index.tsx`. Language selector, copy button |

---

## File Index

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root app, renders Editor |
| `src/main.tsx` | React entry, StrictMode |
| `src/global.css` | Tailwind v4 + shadcn theme + `--editor-*` vars |
| `src/lib/utils.ts` | `cn()` helper |
| `src/components/editor/Editor.tsx` | useEditor, extensions, renders BlockSideMenu + EditorContent |
| `src/components/editor/EditorProvider.tsx` | EditorContext + `useCurrentEditor` hook |
| `src/components/editor/styles/editor.css` | ProseMirror content styles (typography, placeholders, blocks) |
| `src/components/editor/menus/BlockSideMenu.tsx` | Traveling +/⠿ container, `translateY` animation, `data-visible` |
| `src/components/editor/menus/BlockContextMenu.tsx` | Dropdown on ⠿ click — data-driven, Delete/Duplicate/Turn into |
| `src/components/editor/menus/TurnIntoSubmenu.tsx` | Turn into submenu — targets `blockPos`, not cursor |
| `src/components/editor/menus/useActiveBlock.ts` | Hook: active block via hover + selection, lock mechanism |
| `src/components/editor/menus/block-side-menu.css` | Scrollbar styles only (webkit) |
| `src/components/editor/menus/BubbleToolbar.tsx` | Text selection toolbar — mark toggles, link, turn-into |
| `src/components/editor/menus/slash-items.ts` | `SlashItem[]` data — groups, names, icons, Tiptap actions |
| `src/components/editor/menus/SlashMenu.tsx` | Slash UI — `@tiptap/suggestion` plugin + Base UI Popover |
| `src/components/editor/blocks/ImageBlock/index.tsx` | Image ReactNodeView — URL/upload popover, alignment toolbar |
| `src/components/editor/blocks/CodeBlock/index.tsx` | Code block ReactNodeView — language selector, copy button |
| `src/components/editor/blocks/CodeBlock/languages.ts` | Language data + preload list for shiki |
| `src/components/editor/extensions/CustomCodeBlock.ts` | CodeBlock extension + shiki decoration plugin |
| `src/components/ui/button.tsx` | shadcn Button (Base UI) |
| `src/components/ui/dropdown-menu.tsx` | shadcn DropdownMenu (Base UI) |
| `src/components/ui/toggle.tsx` | shadcn Toggle (Base UI) |
| `src/components/ui/separator.tsx` | shadcn Separator (Base UI) |
| `src/components/ui/popover.tsx` | shadcn Popover (Base UI) |