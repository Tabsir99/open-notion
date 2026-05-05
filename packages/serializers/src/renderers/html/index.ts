import type { DocContent } from "../../jsonContent";
import { renderDocContent, _renderBlockContent } from "./renderers";

const html = String.raw;

interface DocRendererOptions {
  className: string;
  Tag: HTMLElement["tagName"];
  type: "content" | "document";
  title: string;
  stylesheetUrl: string | null;
  hydrationScriptUrl: string | null;
}

/**
 * Renders a {@link DocContent} node into an HTML string.
 *
 * @param doc - The document content to render.
 * @param options - Optional rendering configuration.
 */
export async function docToHTML(
  doc: DocContent,
  {
    Tag = "div",
    className = "",
    type = "content",
    title = "Document",
    /**
     * URL for the document stylesheet.
     * Defaults to the jsDelivr CDN build for the current package version.
     * Pass `null` to omit the stylesheet entirely.
     */
    stylesheetUrl,
    /**
     * URL for the hydration script (enables copy buttons in static HTML).
     * Omitted by default — only needed for fully static, no-bundler output.
     * Pass `null` to explicitly omit.
     */
    hydrationScriptUrl,
  }: Partial<DocRendererOptions> = {},
): Promise<string> {
  const rendered = await renderDocContent(doc);
  const content = `<${Tag} class="${className} open-notion-doc">${rendered}</${Tag}>`;

  if (type === "content") return content;

  const stylesheet = stylesheetUrl
    ? `<link rel="stylesheet" href="${stylesheetUrl}" />`
    : "";
  const script = hydrationScriptUrl
    ? `<script src="${hydrationScriptUrl}" defer async></script>`
    : "";

  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="color-scheme" content="light dark" />
        <title>${title}</title>
        ${stylesheet} ${script}
      </head>
      <body>
        ${content}
      </body>
    </html>`;
}

export { _renderBlockContent };
