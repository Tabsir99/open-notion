# `@open-notion/serializers`

Serializers turn **Open Notion editor JSON** (`DocContent`) into **HTML**, **Markdown**, **plain text**, **React trees**, and **PDF blobs**. They share one document model and parallel dispatch logic per output format.

---

## Role in the stack

| Layer | Responsibility |
|--------|----------------|
| **Editor** | Produces and edits `DocContent` (TipTap / ProseMirror-shaped JSON). |
| **This package** | **Read-only** rendering: JSON → string, React, or binary PDF. No schema migration or editing APIs. |

Consumers pick a format by import path (see [Package layout](#package-layout)). React-dependent paths use **optional** `react` as a peer dependency so Node-only consumers can use HTML / Markdown / text without installing React.

---

## Canonical document model

All serializers import types from `src/jsonContent.ts`.

### Root

- **`DocContent`**: `{ type: "doc"; content: BlockNode[] }` — the only root shape serializers accept.

### Blocks

Blocks are a closed union: paragraph, heading (levels 2–4), blockquote, code block, horizontal rule, image, callout, bullet / ordered / task lists, table.

### Inline nodes

Text (with optional **marks**), hard break, emoji (Twemoji-style `hexId` + display metadata).

### Marks

`bold`, `italic`, `strike`, `underline`, `code`, `link`, `textStyle` (color / font — lossy in Markdown).

### Cross-cutting block attrs

`BlockAttrs` (optional on several blocks): `backgroundColor`, `textColor`, `fontSize`, `fontFamily`, `textAlign`. **HTML** and **React** map these to inline styles; **Markdown** largely ignores rich block styling; **text** strips it; **PDF** uses layout-oriented styles from `pdfStyles.ts`, not arbitrary per-block CSS.

### Architectural choice

**Single schema, multiple projections.** Markdown, text, and PDF each implement their own walk (inline → blocks → nesting). **HTML and React share one implementation:** `DocRenderer` awaits **`_renderBlockContent`** from `html.ts` and injects that string into the DOM, so block markup stays identical between `docToHTML` and the React wrapper.

---

## Package layout

Published **subpath exports** (see `package.json`):

| Import | Module | Output |
|--------|--------|--------|
| `@open-notion/serializers` | `src/index.ts` | Re-exports all public APIs + types |
| `@open-notion/serializers/react` | `src/renderers/react.tsx` | `DocRenderer` |
| `@open-notion/serializers/html` | `src/renderers/html/index.ts` | `docToHTML` |
| `@open-notion/serializers/markdown` | `src/renderers/markdown.ts` | `docToMarkdown` |
| `@open-notion/serializers/text` | `src/renderers/text.ts` | `docToText` |
| `@open-notion/serializers/pdf` | `src/renderers/pdf/index.tsx` | `docToPDF` |

Types are re-exported from `./jsonContent` via `export type *` on the root entry.

---

## Modules in detail

### `highlighter.ts` — Shiki for code (HTML + React only)

- **`getHighlighter()`** — async **singleton**: first call builds Shiki **core** with a fixed language set (TypeScript, Python, HTML, CSS, JSON, Bash, SQL, Go, Rust, YAML, Markdown, Dockerfile), **Light+** / **Dark+** themes, and the JavaScript regex engine; later calls reuse the same instance.

**HTML** (including the string used inside **`DocRenderer`**) code blocks: if the highlighter is unavailable, language is `plaintext`, or the language is not loaded, output falls back to escaped plain text. Otherwise **`codeToHtml`** runs with **Light+** and **Dark+** from **`getHighlighter()`** (`themes.light` / `themes.dark`).

Markdown / text / PDF **do not** use Shiki (fenced code or plain monospace respectively).

### `utils.ts`

- **`CDN`**: Twemoji assets + Noto animated emoji base URLs.
- **`getEmojiUrl(hexId, source)`**: inline emojis → Twemoji SVG; callout icons → Noto animated WebP path shape.

### `react.tsx` — `DocRenderer`

- **Async** component: awaits **`_renderBlockContent`** from `html.ts`, then renders it with **`dangerouslySetInnerHTML`** on a wrapper element.
- Wrapper **`as`** (intrinsic tag) and **`className`** are optional; the root always includes CSS hook class **`open-notion-doc`** (pairs with shared doc styles in the wider design system).
- **Marks**, **code blocks** (Shiki when warm), **tables**, and **task lists** all follow the same HTML string as `docToHTML` for the inner document.

### `renderers/html` — `docToHTML(doc, options?)` + `_renderBlockContent`

- String output with **escaped** text and attributes.
- **`DA` / `DATA_TYPE`** in `htmlDataAttrs.ts` are the single source of truth for serialized `data-*` names and `data-type` values (consumed by `@open-notion/assets/hydration.js`).
- **Code blocks**: header (language + copy control markup). Pair with **`@open-notion/assets/hydration.js`** for clipboard copy in static HTML without React.
- **Tables**: optional `<colgroup>` from first-row `colwidth` metadata when present.
- Same Shiki integration and dark-mode detection as the React path (via shared `_renderBlockContent`).

### `@open-notion/assets/hydration.js` — client hydration for static HTML

- The hydration script lives in **`@open-notion/assets`** and wires up the **code-block copy** button behavior using `DA` from this package, so selectors and attribute names stay aligned.

### `markdown.ts` — `docToMarkdown(doc)`

- GFM-oriented: headings, lists, task list syntax, fenced code with language, tables (header row + separator + body).
- **Lossy**: `textStyle` and most block-level visual attrs are dropped or approximated; callouts become blockquoted prefixed lines; underline uses raw `<u>` in MD.
- **Code mark** on text: inner text is literal; marks before `code` are dropped; marks after wrap the formatted code span (see `renderTextNode`).
- Tables flatten non-paragraph cell blocks (only paragraph inline content is emitted per cell).

### `text.ts` — `docToText(doc)`

- Plain text: no marks formatting (raw text), emojis as Unicode from `hexId`, minimal structure (newlines / double newlines between blocks). Suitable for search previews, LLM context, or clipboard plain variant.

### `pdf.tsx` + `pdfStyles.ts` — `docToPDF(doc, options?)`

- **`@react-pdf/renderer`**: `Document` / `Page` (A4) / `View` / `Text` / `Image` / `Link` / optional **`Checkbox`**.
- **`Font.registerEmojiSource`**: Twemoji PNG fallback for emoji in text paths.
- **`pdfStyles.ts`**: centralized tokens (colors, spacing, fonts **Helvetica** / **Courier**) and `StyleSheet.create` layout — opinionated print-like PDF, not a pixel match to web CSS.
- **`docToPDF`**: `pdf(<DocComponent />).toBlob()`; optional **`download`** (default `true` in browser) triggers anchor download; returns **`Promise<Blob>`**.
- **`interactiveCheckboxes`**: `false` (default) draws static boxes; `true` uses PDF form checkboxes (read-only in current code).

---

## Dependencies

- **Runtime**: `@react-pdf/renderer`, `@shikijs/core`, `@shikijs/engine-javascript`, `@shikijs/langs`, `@shikijs/themes`.
- **Peer**: `react >= 18` (**optional** in `peerDependenciesMeta`) — only required for the `react` subpath and for **`DocRenderer`** from the root barrel if you bundle that path.

---

## Build

```bash
pnpm build   # tsc -b → dist/
pnpm typecheck
pnpm lint
```

`sideEffects: false` — safe for tree-shaking when importing subpaths only.

---

## Quick usage

```ts
import { docToHTML, docToMarkdown, getHighlighter } from "@open-notion/serializers";
import type { DocContent } from "@open-notion/serializers";

// Warm highlighter before first HTML/React render with code (optional)
await getHighlighter();

const doc: DocContent = { type: "doc", content: [/* … */] };
const html = docToHTML(doc, { className: "preview", Tag: "article" });
```

```tsx
import { DocRenderer } from "@open-notion/serializers/react";

export async function Preview({ doc }: { doc: DocContent }) {
  return (
    <DocRenderer doc={doc} className="preview" as="article" />
  );
}
```

---

## Summary

| Decision | Rationale |
|----------|-----------|
| Shared `jsonContent` types | One contract between editor and all outputs. |
| Separate files per format | Clear boundaries; different escaping and host constraints (DOM vs string vs PDF). |
| `DocRenderer` + `_renderBlockContent` | One HTML generation path for string export and React `dangerouslySetInnerHTML`. |
| `DA` (this pkg) + `@open-notion/assets/hydration.js` | Serialized `data-*` names stay aligned with static copy-button behavior. |
| Shiki via `getHighlighter()` singleton | Pay setup cost once; graceful fallback when highlighter or language is unavailable. |
| Optional React peer | HTML/Markdown/text usable in non-React servers and CLIs. |
| PDF via react-pdf + shared styles | Deterministic layout; different model than HTML/CSS. |
