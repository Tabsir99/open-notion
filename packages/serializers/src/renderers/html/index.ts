import type { DocContent } from "../../jsonContent";
import { renderDocContent, _renderBlockContent } from "./renderers";
const html = String.raw;

interface BaseRendererOptions {
  className: string;
  Tag: HTMLElement["tagName"];
}

interface ContentRendererOptions extends BaseRendererOptions {
  type: "content";
}

interface DocumentRendererOptions extends BaseRendererOptions {
  type: "document";
  title: string;
  stylesheetUrl: string | null;
  hydrationScriptUrl: string | null;
}

export type DocToHTMLOpt = ContentRendererOptions | DocumentRendererOptions;

/**
 * Renders a {@link DocContent} node into an HTML string.
 *
 * @param doc - The document content to render.
 * @param options - Optional rendering configuration.
 */
export async function docToHTML(
  doc: DocContent,
  options: Partial<DocToHTMLOpt> = {},
): Promise<string> {
  const { Tag = "div", className = "", type = "content" } = options;

  const rendered = await renderDocContent(doc);
  const content = `<${Tag} class="${className} open-notion-doc">${rendered}</${Tag}>`;

  if (type === "content") return content;

  const {
    title = "Document",
    stylesheetUrl,
    hydrationScriptUrl,
  } = options as Partial<DocumentRendererOptions>;

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
