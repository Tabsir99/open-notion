# `@open-notion/editor`

A **Notion-style block editor** for React: TipTap v3 on ProseMirror, floating and context menus, custom node views for rich blocks, and a document shape aligned with **`@open-notion/serializers`**.

---

## What this package is

| Concern | Owned by |
|--------|-----------|
| Editing UX (menus, node views, keyboard rules) | **This package** |
| JSON schema for documents (`DocContent`, nodes, marks) | **`@open-notion/serializers`** (types + export pipelines) |
| Shared document chrome CSS tokens | **`@open-notion/styles`** (dependency) |

The editor **re-exports** `@open-notion/serializers` from `src/index.ts`, so apps can import types and serializer helpers from either the serializers package or the editor barrel.

---

## Public API

### `OpenNotion` (convenience)

Single component: wraps **`Suspense`** (emoji catalog fetch), calls **`useOpenNotion`**, renders **`OpenNotionView`**. Use when you want defaults and a loading fallback without wiring hooks yourself.

### `useOpenNotion(options?)` → `TypedEditor | null`

Creates the TipTap instance via **`useEditor`**, resolves slash / turn-into / extension overrides through **`setEditorConfig`**, and:

- Loads emoji metadata from **`emojiDataUrl`** (default `"/emojis.json"`) — requires a parent **Suspense** boundary because the hook uses React **`use()`** on a cached fetch promise.
- Applies **`content`** as initial JSON; with **`storageKey`**, can **hydrate from `localStorage`** on create (`{key}-content`, `{key}-cursor`).
- **`onChange`**: receives **`DocContent`** (`editor.getJSON()` cast).
- **`extensions`**: `(defaults) => Extensions` to append or replace the default stack from **`defaultExtensions`**.

After the editor exists, the hook **patches** the instance with export helpers:

- **`getHTML()`** / **`getMarkdown()`** / **`getReact()`** — delegate to `@open-notion/serializers` (`docToHTML`, `docToMarkdown`, `docToReact`).
- **`getPDF(filename?, download?)`** — **dynamic import** of `@open-notion/serializers/pdf` (`docToPDF`) with **`interactiveCheckboxes: true`** by default for the editor wrapper.

### `OpenNotionView`

Renders **`EditorContent`** plus chrome: **`BlockSideMenu`**, **`BubbleMenu`**, **`SlashMenu`**, **`EmojiPicker`**, **`TableControls`**. Registers the container on **`editorStore`** so menus and drag logic share one **`TypedEditor`** and DOM anchor.

Root **`editorProps.attributes.class`** includes **`open-notion-doc`** so the same semantic/class hooks serializers and **`@open-notion/styles`** expect stay aligned.

### `TypedEditor` (`types.ts`)

**Augments** TipTap’s `Editor` with:

- **`getJSON(): DocContent`**
- **`isActive` / `getAttributes`** narrowed using serializer-derived **`AnyEditorNode`** and **`MarkDefs`**, so node and mark names stay in sync with the canonical JSON model.

**`TypedNodeViewProps<T>`** types **`node.attrs`** per node name for React node views.

---

## Configuration (`config.ts`)

A **module-level singleton** (`getEditorConfig` / `setEditorConfig`) holds:

- Resolved **slash** and **turn into** item arrays (defaults possibly transformed by the hook options).
- **`getEmojiUrl(hexId, source)`** — pluggable CDN / size strategy; **`source`** documents intent (`inline`, `picker-grid`, `category-bar`, `callout-icon`).
- **`storageKey`**, **`placeholder`**, **`emojiDataUrl`**, optional **`extensionsFn`**.

Menus read this at render time so they stay consistent with the mounted editor.

---

## Extension architecture (`extensions/index.ts`)

**`defaultExtensions(emojis, placeholder?)`** composes:

1. **Core** — `Document`, `Text`, `Paragraph`, `HardBreak`.
2. **Marks** — bold/italic/strike/underline/code, **`Link`** (extra `target`, `openOnClick: false`), **`TextStyleKit`**, **`BlockStyles`** (global attrs for block background, text color, font size/family on paragraph, heading, blockquote, callout).
3. **Nodes** — headings, blockquote, HR, **`ListKit`**, **`TableKit`** with a **`CustomTableView`** that wraps the table in **`data-type="tableContainer"`** and `group/table` for controls; **`TableCell` / `TableHeader`** extended with **cell background** parsing.
4. **Layout** — **`TextAlign`**, **`Placeholder`**, drop/gap cursor, trailing node, undo/redo, character count.
5. **Custom** — **`EmojiExtension`**, **`Image`** (`CustomImage`), **`CustomCodeBlock`**, **`Callout`**.

Consumers can wrap or filter this list via **`extensions`** in **`useOpenNotion`**.

### `createNode` / `extendNode` (`lib/createNode.ts`)

Thin typed wrappers around **`Node.create`** / **`base.extend`** that:

- Tie **`name`** and **`addAttributes`** to **`NodeAttrs`** from the serializer schema (excluding **`BlockAttrs`** where those come from **`BlockStyles`**).
- Optionally attach **`ReactNodeViewRenderer`** for **`NodeView`** components.

### `CustomCodeBlock`

Extends TipTap **`CodeBlock`** with:

- **`CodeBlockView`** React node view (toolbar, language, copy behavior in UI).
- **Shiki** from **`getHighlighter`** in storage; a **ProseMirror plugin** applies **inline decorations** for token colors, recomputed on doc change and when a **`MutationObserver`** sees **`document.documentElement`** `class` toggle (**dark** theme vs light).

### `Emoji` node

Atomic inline node with **`hexId`** / **`name`**; shortcode input rules, paste rules, and a plugin that converts raw Unicode emoji in text (when mappable to the loaded catalog). **`renderHTML`** uses **`getEditorConfig().getEmojiUrl(..., "inline")`**.

### `Image` / `Callout`

Block node views (**`ImageBlock`**, **`CalloutView`**) with commands like **`setImage`**, **`setCallout`**, **`toggleCallout`**. Callout includes **Enter** behavior to **lift** out of an empty trailing paragraph.

---

## UI layer

- **Primitives** — `src/ui/*`: shadcn-style building blocks (`button`, `dropdown-menu`, `popover`, etc.) backed by **`@base-ui/react`** (peer).
- **Menus** — Bubble (marks, link, color, turn-into), slash command palette, block side grip (+ context menu, drag), font/size/family menus, table controls (resize, merge, focus hooks), emoji picker (data + navigation submodules).
- **Store** — `editorStore` is a minimal **useSyncExternalStore**-compatible store for **`editor`**, **`editorContainer`**, **`hoveredBlock`** so floating UI can follow block geometry without prop drilling.

---

## Styles

- **`@open-notion/editor/styles`** — dev entry (`src/styles/dev.css`) vs built **`dist/styles/index.css`**.
- **`@open-notion/editor/styles.css`** — single **compiled** Tailwind bundle for apps that do not process the package source.

Build runs **tsup** (JS only; CSS loaded as empty in bundle) then **Tailwind CLI** on **`src/styles/_full.css`**, which imports **`editor.css`** and **`@source`** for tree scanning.

**`sideEffects: ["**/*.css"]`** so bundlers do not drop CSS imports.

---

## Peers and dependencies

**Peers:** `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`, `react`, `react-dom`, `@base-ui/react`, `@open-notion/serializers`.

**Workspace:** `@open-notion/styles` for design alignment with the rest of the Open Notion stack.

---

## Build

```bash
pnpm build        # tsup + Tailwind → dist/
pnpm dev          # tsup --watch
pnpm typecheck
pnpm lint
```

---

## Integration checklist

1. Install peers (TipTap 3.x, React 18+, Base UI).
2. Serve **`emojis.json`** at **`emojiDataUrl`** (or override URL); wrap the editor tree in **`Suspense`** if using **`useOpenNotion`** / **`OpenNotion`** directly.
3. Import **`@open-notion/editor/styles.css`** (or the split style export) alongside app layout.
4. Optionally call **`getHighlighter()`** from serializers early so first paint of code blocks and static HTML export stay in sync with theme.

---

## Design decisions (summary)

| Decision | Rationale |
|----------|-----------|
| Serializer types as source of truth | One **`DocContent`** contract for editor, export, and PDF. |
| `TypedEditor` augmentation | Safer commands and attrs at compile time; **`getHTML`** etc. live on the same handle apps already hold. |
| Module config singleton | Menus and emoji rendering resolve URLs and item lists without threading props through every menu. |
| Shiki as PM decorations | Keeps document as plain text inside code blocks; highlighting is a view concern. |
| Dynamic `getPDF` | Keeps **`@react-pdf/renderer`** off the critical path for apps that never export PDF. |
| `editorStore` + hovered block | Notion-like block handles and menus anchored to block rects. |
