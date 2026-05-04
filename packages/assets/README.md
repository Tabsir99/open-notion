# `@open-notion/assets`

Drop-in **CSS** and **client-side hydration** for content rendered by `@open-notion/serializers` (and used by `@open-notion/editor`).

---

## What this package contains

- **`@open-notion/assets/doc.css`**: the shared rendered-document stylesheet. It targets the wrapper class **`open-notion-doc`** that serializers and the editor output.
- **`@open-notion/assets/hydration.js`**: a tiny browser script that enables **code-block copy buttons** in static HTML output (no React required).

---

## Install

```bash
pnpm add @open-notion/assets
```

---

## Usage

### CSS (rendered doc styles)

In a bundler:

```ts
import "@open-notion/assets/doc.css";
```

Or via CDN (use the package version you publish):

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@open-notion/assets@1.0.0/doc.css"
/>
```

### Hydration (static HTML)

If you render HTML from `docToHTML(...)` and want the code-block **Copy** button behavior, load the hydration script:

```html
<script src="https://cdn.jsdelivr.net/npm/@open-notion/assets@1.0.0/hydration.js"></script>
```

This script relies on the `data-*` attributes emitted by `@open-notion/serializers` (via `DA`).

