# `@open-notion/editor`

A **Notion-style block editor** for React: Tiptap v3 on ProseMirror, floating and context menus, custom node views for rich blocks, and a document shape aligned with **`@open-notion/serializers`**.

---

## What this package is

| Concern | Owned by |
|---------|----------|
| Editing UX (menus, node views, keyboard rules) | **This package** |
| JSON schema for documents (`DocContent`, nodes, marks) | **`@open-notion/serializers`** (types + export pipelines) |
| Shared rendered-document CSS + hydration script | **`@open-notion/assets`** (dependency) |

The editor **re-exports** `@open-notion/serializers` from `src/index.ts`, so apps can import types and serializer helpers from either the serializers package or the editor barrel.

---

## Public API

### `OpenNotion` (convenience)

Single component: calls **`useOpenNotion`**, renders **`OpenNotionView`**. Use when you want defaults without wiring hooks yourself.

### `useOpenNotion(options?)` → `TypedEditor | null`

Creates the Tiptap instance via **`useEditor`** and:

- Loads emoji metadata from **`emojiDataUrl`** (default `"/emojis.json"`) on mount. The editor mounts **immediately** — emoji data fetch does not block first paint; raw `:shortcode:` matches that landed during the race window get reconciled by a one-shot sweep when the data arrives.
- Applies **`content`** as initial JSON; with **`storageKey`**, can **hydrate from `localStorage`** on create (`{key}-content`, `{key}-cursor`).
- **`onChange(json: DocContent)`** — already typed.
- **`onReady(editor: TypedEditor)`**, **`onSelectionChange(editor: TypedEditor)`** — receive a narrowed editor handle, no cast needed.
- **`extensions: (defaults) => Extensions`** — append or replace the default stack from **`defaultExtensions`**.
- **`slashItems: (defaults) => SlashItem[]`** / **`turnIntoItems: (defaults) => TurnIntoItem[]`** — compose menu items on top of the defaults.
- **`getEmojiUrl(hexId, source)`** — override URL strategy per render source (`inline`, `picker-grid`, `category-bar`, `callout-icon`).

After the editor exists, the hook **patches** the instance with async export helpers:

- **`getHTML(opts?)`** — full document or fragment export via **`@open-notion/serializers`** (`docToHTML`). Optionally bundles the CDN stylesheet + hydration script for `type: "document"`.
- **`getMarkdown()`** / **`getText()`** — via `docToMarkdown` / `docToText`.
- **`getPDF()`** — **dynamic import** of `@open-notion/serializers/pdf` (`docToPDF`).

### `OpenNotionView`

Renders **`EditorContent`** plus chrome: **`BlockSideMenu`**, **`BubbleMenu`**, **`SlashMenu`**, **`EmojiPicker`**, **`TableControls`** — all in lazy chunks (loaded on first interaction, not on first paint). Mounts the editor under an **`EditorContext.Provider`** so menus and hooks can discover the active editor without prop drilling.

Root **`editorProps.attributes.class`** includes **`open-notion-doc`** so the same semantic/class hooks serializers and the shared doc styles in **`@open-notion/assets`** stay aligned.

### `TypedEditor` (`types.ts`)

**Augments** Tiptap's `Editor` with:

- **`getJSON(): DocContent`**, async **`getHTML` / `getMarkdown` / `getText` / `getPDF`**.
- **`isActive(name, attrs?)`** / **`getAttributes(name)`** narrowed using serializer-derived **`NodeName`** / **`MarkName`** unions, so node and mark names stay in sync with the canonical JSON model.

**`TypedNodeViewProps<T>`** types **`node.attrs`** per node name for React node views.

---

## Per-editor runtime store (`runtime.ts`)

State is held **per editor instance**, in Tiptap's storage at **`editor.storage.openNotion`**, via a sentinel extension (`OpenNotionRoot`) added internally by `useOpenNotion`. Two editors in the same tree have independent stores — no shared module-level singletons.

```ts
import { getRuntime } from "@open-notion/editor"; // (internal export)

const runtime = getRuntime(editor);
runtime.get();             // current state
runtime.set({ ... });      // mutate; notifies React subscribers
runtime.subscribe(fn);     // useSyncExternalStore-compatible
```

State shape:

- **`slashItems`** / **`turnIntoItems`** — resolved menu item arrays.
- **`getEmojiUrl(hexId, source)`** — pluggable CDN/size strategy. **`source`** documents intent (`inline`, `picker-grid`, `category-bar`, `callout-icon`).
- **`hoveredBlock`** — Notion-style block-side-menu hover anchor; updated by the side menu's mouseover plugin.
- **`editorContainer`** — DOM container ref for menu anchoring.

React consumers read via the **`useEditor()`** + **`useEditorRuntime(selector)`** hooks (`context.tsx`).

---

## Extensibility

Consumers can add custom blocks, marks, and commands with the same type safety internal blocks have — **`editor.isActive("yourBlock")`** narrows by name, **`createNode({ name: "yourBlock" })`** autocompletes, **`NodeView`** props are typed against the consumer's attrs shape, and inside `addCommands` / `addProseMirrorPlugins` / `onCreate` / etc., **`this.editor`** is **`TypedEditor`** (no casts).

The mechanism is **TypeScript declaration merging** against open interfaces (`BlockNodeDefs`, `InlineNodeDefs`, `MarkDefs`) exported from `@open-notion/serializers`. Full walkthrough in **[EXTENDING.md](./EXTENDING.md)**.

```ts
// 1. Declare the node's JSON shape
declare module "@open-notion/serializers" {
  interface BlockNodeDefs {
    githubLink: {
      type: "githubLink";
      attrs: BlockAttrs & { url: string };
      content?: InlineNode[];
    };
  }
}

// 2. Define the extension
import { defineBlock } from "@open-notion/editor";

export const GithubLink = defineBlock({
  name: "githubLink",                    // ← autocompletes from registry
  group: "inline",
  inline: true,
  addAttributes: () => ({ url: { default: "" } }),
  NodeView: ({ node }) => <a href={node.attrs.url}>{node.attrs.url}</a>,
});

// 3. Plug in
const editor = useOpenNotion({
  extensions: (d) => [...d, GithubLink],
});
```

---

## Extension architecture (`extensions/index.ts`)

**`defaultExtensions(placeholder?)`** composes:

1. **Core** — `Document`, `Text`, `Paragraph`, `HardBreak`.
2. **Marks** — bold/italic/strike/underline/code, **`Link`** (slim in-tree mark, no `linkifyjs` dependency — regex autolink-on-type), **`TextStyleKit`**, **`BlockStyles`** (global attrs for block background, text color, font size/family on paragraph, heading, blockquote, callout).
3. **Nodes** — headings, blockquote, HR, **`ListKit`**, **`TableKit`** with a **`CustomTableView`** that wraps tables in **`data-type="tableContainer"`** for controls; **`TableCell` / `TableHeader`** extended with cell-background parsing.
4. **Layout** — **`TextAlign`**, **`Placeholder`**, drop/gap cursor, trailing node, undo/redo, character count.
5. **Custom** — **`EmojiExtension`**, **`Image`** (`CustomImage`), **`CustomCodeBlock`**, **`Callout`**.
6. **Sentinel** — **`OpenNotionRoot`** (hosts the per-editor runtime store; added automatically by `useOpenNotion`, not by `defaultExtensions`).

Consumers compose on top of these via the **`extensions`** resolver in **`useOpenNotion`**.

### `createNode` / `defineBlock` / `extendNode` (`lib/createNode.ts`)

Typed wrappers around Tiptap's `Node.create` / `base.extend` that:

- Constrain **`name`** to **`NodeName`** (derived from the open `NodeDefs` registry) — autocompletion + typo errors at the call site.
- Type **`addAttributes`** against **`NodeAttrs[name]`** (excluding inherited **`BlockAttrs`** that come from **`BlockStyles`**).
- Type **`NodeView`** props as **`TypedNodeViewProps<name>`** — `node.attrs` is the consumer's shape.
- Lift **`this.editor`** inside every config method (`addCommands`, `addKeyboardShortcuts`, `addInputRules`, `addPasteRules`, `addProseMirrorPlugins`, `addStorage`) and lifecycle hook (`on*`) from base `Editor` to **`TypedEditor`** — `this.editor.isActive("foo")` is registry-aware without casting.

**`defineBlock`** is an alias of `createNode` with a richer JSDoc walkthrough — prefer it for new blocks.

### NodeView performance harness

`createNode`'s internal NodeView wrapper (`reactNodeViewLite`) suppresses two per-transaction React reconciliation paths Tiptap installs for every NodeView:

- **Path B** — `ReactNodeView.update()` is intercepted via the official `update` option; identity-equal node + reference-equal decorations short-circuits without `updateProps`.
- **Path A** — `positionCheckCallback`, registered with `schedulePositionCheck`, leaks for the editor's lifetime due to a class-field-initialization-after-super bug in `@tiptap/react@3.22.5`. Worked around by patching `nv.renderer.updateProps` per-instance to drop the single-key `{ getPos }` payload the leaked closure produces.

Result: docs with 200-300+ NodeView-backed blocks (Callouts, Images, code blocks) type smoothly at the start as well as the end of the doc. See the banner comment in `lib/createNode.ts` for the full diagnosis.

### `CustomCodeBlock`

Extends Tiptap **`CodeBlock`** with:

- **`CodeBlockView`** React node view (language picker, copy button).
- **Shiki** from **`getHighlighter`** in storage; a **ProseMirror plugin** applies **inline decorations** for token colors, recomputed on doc change and when a **`MutationObserver`** sees **`document.documentElement`** `class` toggle (dark vs light theme).
- Devicon language icons lazy-loaded on demand (placeholder until resolved).

### `Emoji` node

Atomic inline node with **`hexId`** / **`name`** / **`shortcode`**; shortcode input rules, paste rules, and a plugin that converts raw Unicode emoji in text (when mappable to the loaded catalog). The extension reads emoji data **live** from a singleton — editor mount doesn't wait for the catalog JSON. A `forceEmojiSweep` meta transaction reconciles any pre-load matches when data arrives. **`renderHTML`** uses **`getRuntime(editor).get().getEmojiUrl(..., "inline")`**.

### `Image` / `Callout`

Block node views (**`ImageBlock`**, **`CalloutView`**) with commands like **`setImage`**, **`setCallout`**, **`toggleCallout`**. Callout includes **Enter** behavior to **lift** out of an empty trailing paragraph. Both ship in lazy chunks via `lazyNodeView` so docs without that block pay zero (no chunk fetch).

---

## UI layer

- **Primitives** — `src/ui/*`: shadcn-style building blocks (`button`, `dropdown-menu`, `popover`, etc.) backed by **`@base-ui/react`** (peer).
- **Menus** — Bubble (marks, link, color, turn-into), slash command palette, block side grip (`+`-button + context menu, drag), font/size/family menus, table controls (resize, merge, focus hooks), emoji picker (data + navigation submodules). All lazy-loaded.
- **Context** — `EditorContext` exposes the active editor handle; `useEditor()` + `useEditorRuntime(selector)` give menus access without prop drilling.

---

## Styles

- **`@open-notion/editor/styles`** — source CSS entrypoint (`src/styles/index.css`). Use this when your tooling can consume package CSS (Vite, PostCSS, Tailwind v4, etc.).
- **`@open-notion/editor/styles/compiled`** — precompiled CSS bundle (`dist/styles/compiled.css`) for apps that **do not** process the package source CSS.

Build runs **tsup** (JS only; CSS loaded as empty in bundle) then **Tailwind CLI** on **`src/styles/_full.css`**, which imports the main style entry and uses **`@source`** for tree scanning.

**`sideEffects: ["**/*.css"]`** so bundlers do not drop CSS imports.

---

## Peers and dependencies

**Peers:** `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`, `react`, `react-dom`, `@base-ui/react`, `@open-notion/serializers`.

**Workspace:** `@open-notion/assets` for shared rendered-doc styles and hydration used by the rest of the Open Notion stack.

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

1. Install peers (Tiptap 3.x, React 18+, Base UI).
2. Serve **`emojis.json`** at **`emojiDataUrl`** (or override URL). No `Suspense` wrapper required — the editor mounts immediately and reconciles emoji shortcodes when the catalog lands.
3. Import **`@open-notion/editor/styles`** (or **`@open-notion/editor/styles/compiled`** if your tooling can't process package CSS) alongside app layout.
4. Optionally call **`getHighlighter()`** from serializers early so first paint of code blocks and static HTML export stay in sync with theme.
5. To add custom blocks: see **[EXTENDING.md](./EXTENDING.md)**.

---

## Design decisions (summary)

| Decision | Rationale |
|----------|-----------|
| Serializer types as source of truth | One **`DocContent`** contract for editor, export, and PDF. |
| Open `NodeDefs` / `MarkDefs` registries | Consumers extend types via declaration merging — same shape internal blocks use. |
| `TypedEditor` augmentation everywhere (incl. `this.editor` inside extensions) | Registry-aware narrowing on `isActive` / `getJSON` / `getAttributes` without per-call-site casts. |
| Per-editor runtime store at `editor.storage.openNotion` | Two editors in the same tree have independent state — no shared module-level singleton. |
| Shiki as PM decorations | Keeps document as plain text inside code blocks; highlighting is a view concern. |
| Dynamic `getPDF` | Keeps **`@react-pdf/renderer`** off the critical path for apps that never export PDF. |
| `hoveredBlock` in the runtime store | Notion-style block handles and menus anchored to block rects, accessed via `useEditorRuntime`. |
| NodeView render wrapper (`reactNodeViewLite`) | Suppresses two duplicate per-transaction React reconciliation paths Tiptap installs — makes docs with 200+ NodeView-backed blocks type smoothly. |
| Slim in-tree `Link` mark (no `linkifyjs`) | ~25 KB min off the entry bundle; regex autolink covers the same surface. |
| Lazy NodeViews + lazy menus | Editor mount ships ~167 KB raw / ~50 KB gzip; the rest fetches on first interaction. |
