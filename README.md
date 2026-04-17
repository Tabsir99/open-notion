# @tabsircg/open-notion: Architecture & Onboarding Document

Welcome to the project! This document serves as a comprehensive guide to understanding the architecture, design principles, and code structure of this production-quality, Notion-style block editor.

---

## 1. Architecture Overview

At a high level, this project is a **client-side React 19 application** built with **Vite** and styled using **Tailwind CSS v4** and customized **shadcn/ui**. 

The core of the application revolves around a headless rich-text editor engine powered by **Tiptap v3** (which itself is an abstraction over ProseMirror). The application achieves a Notion-like experience through a heavily customized UI overlay—floating menu systems (side menus, bubble toolbars, slash commands)—which interacts with the editor using a decoupled, reactive global state architecture and standard DOM measurement logic. 

**Key Architectural Tenets:**
- **Headless Content, Rich UI**: The document content is maintained by Tiptap internally, while the editing UI (menus, context dropdowns, slash autocompletions) is maintained entirely by React.
- **External State Management**: We intentionally avoid complex Context API trees for interacting closely with DOM elements (like hover toolbars), relying instead on standard DOM events and a zero-dependency external store.
- **Strict Separation of Concerns**: Tiptap extension configurations are strongly decoupled from the React NodeViews they render.

---

## 2. Directory & File Structure

The workspace follows a highly focused, component-centric layout under `/src`. 

```text
src/
├── App.tsx & main.tsx       # Standard React/Vite entry points
├── global.css               # Tailwind v4 injection, shadcn global CSS variables
├── lib/
│   └── utils.ts             # Global utilities (like className merger `cn()`)
├── components/
│   ├── ui/                  # Pure, headless UI primitives (Base UI + shadcn)
│   │   ├── button.tsx, dropdown-menu.tsx, popover.tsx, toggle.tsx...
│   └── editor/              # The core domain logic for the Block Editor
│       ├── Editor.tsx       # The primary wrapper, hooks into Tiptap context
│       ├── store.ts         # Zero-dependency reactive, external global store
│       ├── types.ts         # Single Source of Truth for Node, Mark, and Attribute typings
│       ├── blocks/          # React Components representing Rich Text Nodes (e.g., Image, Callout)
│       ├── extensions/      # Tiptap Extensions configs schema definitions, commands, shortcuts
│       ├── menus/           # Floating UIs: Popovers, Context Menus, Slash Commands, Toolbars
│       └── styles/          # ProseMirror-specific aesthetic adjustments (`editor.css`)
```

---

## 3. Core Modules & Responsibilities

1. **`Editor.tsx`**: 
   The main wrapper class. Its responsibility is to initialize `useEditor()`, inject the unified list of extensions, load/save initialization state, and statically mount the floating UIs (`BubbleMenu`, `SlashMenu`, `BlockSideMenu`).
2. **`editorStore` (`store.ts`)**: 
   Because React Context recalculations can be performant bottlenecks for floating high-frequency UI elements, we implement a `useSyncExternalStore` mechanism. It globally tracks `editor` references, hovered DOM coordinates, and active blocks transparently. 
3. **`extensions/index.ts`**:
   The registry that marries native Tiptap configurations (like headings and paragraphs) with our custom nodes (like Callouts and styled Tables).
4. **`blocks/` Directory**: 
   When an extension requires a complex UI (like a customizable Callout with an icon selector, or an Image with align tools), it defers to a `ReactNodeViewRenderer`. Those React components sit here.
5. **`menus/` Directory**: 
   Everything that triggers on selection, typing `/`, or hovering lives here. They largely read DOM positions (`useHoveredBlock`) and absolute-position themselves dynamically on the screen using standard `.style.top` interactions.

---

## 4. Data Flow

Understanding how data moves—from user input to rendering—is crucial. 

* **Input & Syncing**: When a user types, Tiptap intercepts the event via ProseMirror, translates it into a transaction, updates the Document State, and triggers an `onUpdate` event.
* **Persistent Storage**: `onUpdate` instantly synchronizes the `editor.getJSON()` output stringified into `localStorage`. Similarly, `onSelectionUpdate` saves the active cursor.
* **Floating UI Reactivity**: 
  1. A user hovers a paragraph block. `pointerover` event fires natively.
  2. The custom hook `useHoveredBlock` calculates the visual coordinates.
  3. `editorStore.set({ hoveredBlock: ... })` is called.
  4. The absolute positioned floating side menu updates its CSS properties *directly* through a ref or triggers a lightweight re-render to move alongside the active block without remounting the editor.
* **Executing Commands**: Actions within menus (e.g., clicking *Delete* on the `BlockContextMenu`) retrieve absolute block coordinates from `editorStore`, and command the editor context via isolated transactions (`editor.chain().focus().deleteRange().run()`).

---

## 5. Code Style & Conventions

- **shadcn-First Aesthetics:** Do not use `bg-zinc-*` or arbitrarily guess Tailwind colors. Use abstract shadcn variables: `bg-background`, `bg-popover`, `text-muted-foreground`, and `border-border`. Our global theming (like dark mode and branding) strictly overrides these CSS variable tokens in `global.css`.
- **Data-Driven Submenus:** UI logic is structured predictably. Items inside a dropdown menu are managed as static, typed arrays (`MenuItem[]`) and built using `.map()`. This enforces visual consistency and reduces redundant JSX.
- **Direct Imports Only:** Specifically regarding icons, do not use tree-shaking barrel loads. Use exact imports `import { Bold } from "lucide-react"`.

---

## 6. Design Patterns Used

- **`useSyncExternalStore` (Pub-Sub Store):** Keeps state completely outside the React lifecycle, subscribing targeted UI components selectively.
- **Headless Accessible UI (Base UI):** Uses underlying accessible patterns (like focus-trapping, ARIA tags, portaling) without imposing styles.
- **React NodeView Renderer:** A bridge pattern where Tiptap controls the schema representation, but hands rendering responsibilities of the visual entity over to a decoupled Context-aware React component.
- **Central Type Registry (`types.ts`):** Defines explicit union types instead of strings (e.g., `NodeName`, `MarkName`, `NodeAttrs`). Generates strict `typeof` configurations to make `editor.getAttributes("heading")` securely type-infer `{"level": 1 | 2 | 3}`.

---

## 7. Dependencies & Third-party Libraries

- **@tiptap/core & @tiptap/react (v3)**: The backbone handling text logic, nested parsing, copy/paste operations, and rich-text shortcuts.
- **Base UI (`@base-ui/react`)**: *Critical Note.* Instead of the commonly-used Radix UI, the `base-nova` shadcn style uses Base UI. You must check Base UI APIs specifically (like using `render` instead of `asChild` in Triggers, or using `finalFocus` instead of `onCloseAutoFocus`).
- **Tailwind CSS v4 & @tailwindcss/vite**: The engine processing fast styles without an external `tailwind.config.js` configuration file.
- **@floating-ui/dom**: Tiptap v3 mandates floating-ui for custom BubbleMenus and popovers, shifting away from tippy.js.
- **Lowlight / Shiki**: Provides exact matching and AST-level highlighting of code blocks.

---

## 8. Configuration & Environment

- The project does not utilize a heavy Next.js Server Side setup—it uses **Vite** bundled alongside React 19.
- To run logic locally, rely on `pnpm dev`. 
- To assert correct TypeScript behavior, rely on `pnpm typecheck` which runs `tsc` and avoids breaking changes in types.
- To handle emoji building operations (`loadEmojiData`), local setup processes invoke a custom Node script `build:emojis`. 

---

## 9. Testing Strategy

Current testing strictly revolves around two pillars:
- **Stringent Type Constraints (TypeScript):** Everything, down to `Tiptap.isActive("heading")` extensions and payload attributes are fully typed and error if an invalid mark constraint occurs.
- **Hot Reload Previews:** UI iterations are checked locally using local storage hydration capabilities baked straight into `Editor.tsx`'s `onCreate()` lifecycle to restore visual sessions. 

---

## 10. Known Patterns to Follow (Crucial)

**The Onboarding Rules to Stay Consistent:**
1. **Never import from Radix.** If you use Shadcn, ensure base primitives come from `@base-ui/react/...` (e.g. `import { Menu as MenuPrimitive } from "@base-ui/react/menu"`).
2. **Never inline color classes.** Use `bg-muted` over `bg-gray-100`. If ProseMirror internals require styles, modify them strictly in `editor.css` utilizing defined custom `var(--editor-text)` tokens. 
3. **Follow the Tiptap v3 import rules.** Don't blindly pull things from `@tiptap/react`. Use designated subdirectories: `import { BubbleMenu } from "@tiptap/react/menus"`, `import { TaskList } from "@tiptap/extension-list"`. 
4. **Keep Extensions headless.** Logic, data handling, and Tiptap API interactions belong in `/extensions/`. Do not pollute React rendering in `/blocks/` with pure transaction algorithms if possible.
5. **Clean Memory Links.** Menus and overlays frequently inject manual DOM Listeners (`.addEventListener('pointerover')`). Every active listener attached to the editor container must return an exact un-mount function (`.removeEventListener`) to avoid memory leaks.
