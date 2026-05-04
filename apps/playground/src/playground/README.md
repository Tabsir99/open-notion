# Playground UI (`src/playground`)

This folder is the **in-app demo shell** for the Open Notion editor: a split layout with the real **`OpenNotionView`** on the left and an **output preview / export** surface on the right. It is not a separate package; it lives inside **`apps/playground`** and composes **`@open-notion/editor`** and **`@open-notion/serializers`**.

`App.tsx` wraps **`PlaygroundWorkspace`** in **`Suspense`** because **`useOpenNotion`** waits on emoji data via React **`use()`** — the playground must keep that boundary above this tree.

---

## File map

| File | Role |
|------|------|
| **`PlaygroundWorkspace.tsx`** | Root state: editor instance, split ratio, live vs static HTML, PDF blob URL, errors, wiring to toolbar and preview. |
| **`Toolbar.tsx`** | **`PlaygroundToolbar`**: preview mode toggles, static refresh, export menus (HTML / Markdown / plain), PDF generate preview vs download, light/dark toggle. |
| **`PreviewPane.tsx`** | Tabbed **Output** card: HTML via **`dangerouslySetInnerHTML`**, PDF in an **`<iframe>`**, loading and error UI. |
| **`usePlaygroundTheme.ts`** | Reads/writes **`playground-theme`** in **`localStorage`**, syncs **`document.documentElement.classList`** (`dark`) for serializer/editor Shiki theme switching. |
| **`downloadBlob.ts`** | Small helpers: trigger browser download for a **`Blob`** or a UTF-8 string (**`downloadText`**). |

---

## Architecture

### Editor side

- **`useOpenNotion({ storageKey: "oeditor", onChange: … })`** persists document and cursor under that prefix (see editor package README) and keeps **`liveHtml`** in sync when **preview mode is `"live"`**.
- **`editorRef`** holds the latest **`TypedEditor`** so callbacks (toolbar, divider) always read the current instance without stale closures from **`onChange`** alone.
- **`OpenNotionView`** uses a wider **`className`** (`max-w-none`, adjusted padding) so the demo uses horizontal space unlike the default packaged layout.

### Preview modes

1. **`live`** — On each document change (while in live mode), **`editor.getHTML()`** refreshes the string fed to the HTML tab. Matches “what serializers would emit” as you type (including Shiki when the highlighter is ready and `dark` class matches theme).
2. **`static`** — HTML is a **frozen snapshot**. Switching to static copies the current HTML once; **Refresh** re-captures from **`editorRef`**. Useful for comparing before/after or avoiding constant iframe-style churn while inspecting one output.

### PDF flow

- **Generate preview** — **`editor.getPDF(undefined, false)`** returns a **`Blob`** without triggering the editor’s default download path; workspace creates an **object URL**, assigns **`pdfUrl`**, switches tab to **PDF**, and **revokes** the previous URL on replace and on unmount.
- **Download** — **`editor.getPDF("document.pdf", true)`** uses the built-in download behavior inside **`docToPDF`**.
- **`pdfBusy`** / **`pdfError`** gate the toolbar and show destructive **`Alert`** over the preview card when generation fails.

### Resizable split

- **`leftPct`** (clamped roughly **28–72%**) drives the editor column width; a vertical **separator** uses **`mousedown`** + window **`mousemove`** / **`mouseup`** for drag resizing (`role="separator"`).

### Exports (file downloads)

- **HTML** / **Markdown** — **`getHTML()`**, **`getMarkdown()`** on **`TypedEditor`** (serializer-backed).
- **Plain text** — **`docToText(editor.getJSON())`** imported directly from **`@open-notion/serializers`** for a literal text pipeline distinct from Markdown.

---

## Cross-cutting concerns

| Concern | Where handled |
|--------|----------------|
| Dark mode for Shiki in editor + static HTML | **`usePlaygroundTheme`** toggles **`html.dark`**; serializers read **`document.documentElement.classList.contains("dark")`**. |
| Demo persistence of document | **`storageKey: "oeditor"`** in **`useOpenNotion`**. |
| shadcn-style UI in toolbar/preview | **`@/components/ui/*`** imports (app-level components, not duplicated in this folder). |

---

## What this folder deliberately is not

- **Not** the TipTap schema or extensions (see **`packages/editor`**).
- **Not** the canonical **`DocContent`** types (see **`packages/serializers`**).
- **Not** a production CMS shell — no routing, auth, or collaborative backend; it is a focused **developer playground** for editing and inspecting outputs.

---

## Summary

The playground module **orchestrates** the editor hook, serializer-backed previews, PDF preview vs download, file exports, theme sync, and layout chrome. Individual files stay small by splitting **toolbar actions**, **preview presentation**, **theme**, and **download utilities** so the workspace file remains the single place that owns cross-pane state.
