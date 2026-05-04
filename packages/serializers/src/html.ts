import type {
  DocContent,
  BlockNode,
  BlockAttrs,
  AnyMark,
  InlineNode,
  ParagraphNode,
  HeadingNode,
  BlockquoteNode,
  CodeBlockNode,
  ImageNode,
  CalloutNode,
  ListItemNode,
  TaskItemNode,
  BulletListNode,
  OrderedListNode,
  TaskListNode,
  TableNode,
  TableCellNode,
  TableHeaderNode,
  TableRowNode,
} from "./jsonContent";
import { getEmojiUrl } from "./utils";
import { getHighlighter } from "./highlighter";
import { DA, DATA_TYPE } from "./htmlDataAttrs";

const { type, codeBlock } = DA;

const html = String.raw;

// ── Escapers ──────────────────────────────────────────────────────────

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Attribute / style emitters ────────────────────────────────────────

function attr(name: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  return ` ${name}="${escapeAttr(String(value))}"`;
}

function styleAttr(css: string | undefined): string {
  return css ? ` style="${escapeAttr(css)}"` : "";
}

function dataAttrFlag(name: string): string {
  return ` ${name}`;
}

function blockAttrsToStyle(attrs?: BlockAttrs): string | undefined {
  if (!attrs) return undefined;
  const parts: string[] = [];
  if (attrs.backgroundColor)
    parts.push(`background-color: ${attrs.backgroundColor}`);
  if (attrs.textColor) parts.push(`color: ${attrs.textColor}`);
  if (attrs.fontSize) parts.push(`font-size: ${attrs.fontSize}`);
  if (attrs.fontFamily) parts.push(`font-family: ${attrs.fontFamily}`);
  if (attrs.textAlign) parts.push(`text-align: ${attrs.textAlign}`);
  return parts.length ? parts.join("; ") : undefined;
}

// ── Mark wrapping ─────────────────────────────────────────────────────

function wrapMark(content: string, mark: AnyMark): string {
  switch (mark.type) {
    case "bold":
      return `<strong>${content}</strong>`;
    case "italic":
      return `<em>${content}</em>`;
    case "strike":
      return `<s>${content}</s>`;
    case "underline":
      return `<u>${content}</u>`;
    case "code":
      return `<code>${content}</code>`;
    case "link":
      return `<a${attr("href", mark.attrs.href)}${attr("target", mark.attrs.target)} rel="noreferrer">${content}</a>`;
    case "textStyle": {
      const parts: string[] = [];
      if (mark.attrs?.color) parts.push(`color: ${mark.attrs.color}`);
      if (mark.attrs?.fontFamily)
        parts.push(`font-family: ${mark.attrs.fontFamily}`);
      if (mark.attrs?.fontSize) parts.push(`font-size: ${mark.attrs.fontSize}`);
      return `<span${styleAttr(parts.length ? parts.join("; ") : undefined)}>${content}</span>`;
    }
  }
}

function applyMarks(content: string, marks: AnyMark[] | undefined): string {
  if (!marks || marks.length === 0) return content;
  return marks.reduce<string>((node, mark) => wrapMark(node, mark), content);
}

// ── Inline rendering ──────────────────────────────────────────────────

function renderInline(node: InlineNode): string {
  switch (node.type) {
    case "text":
      return applyMarks(escapeText(node.text), node.marks);
    case "hardBreak":
      return "<br>";
    case "emoji":
      return `<span${attr(DATA_TYPE, type.emoji)}><img${attr(
        "src",
        getEmojiUrl(node.attrs.hexId, "inline"),
      )}${attr("alt", node.attrs.name)}></span>`;
  }
}

function renderInlineContent(nodes?: InlineNode[]): string {
  return (nodes ?? []).map(renderInline).join("");
}

// ── Block renderers ───────────────────────────────────────────────────

function renderParagraph(node: ParagraphNode): string {
  return `<p${styleAttr(blockAttrsToStyle(node.attrs))}>${renderInlineContent(node.content)}</p>`;
}

function renderHeading(node: HeadingNode): string {
  const tag = `h${node.attrs.level}`;
  return `<${tag}${styleAttr(blockAttrsToStyle(node.attrs))}>${renderInlineContent(node.content)}</${tag}>`;
}

async function renderBlockquote(node: BlockquoteNode): Promise<string> {
  return `<blockquote${styleAttr(blockAttrsToStyle(node.attrs))}>${await _renderBlockContent(node.content)}</blockquote>`;
}

async function renderCodeBlock(node: CodeBlockNode): Promise<string> {
  const copyIcon =
    "https://cdn.jsdelivr.net/npm/lucide-static@0.511.0/icons/copy.svg";
  const checkIcon =
    "https://cdn.jsdelivr.net/npm/lucide-static@0.511.0/icons/check.svg";
  const fileCodeIcon =
    "https://cdn.jsdelivr.net/npm/lucide-static@0.511.0/icons/file-code-2.svg";

  const lang = node.attrs.language || "plaintext";
  const text = (node.content ?? []).map((t) => t.text).join("");
  const highlighter = await getHighlighter();
  const loaded = highlighter?.h.getLoadedLanguages() ?? [];

  let highlighted = escapeText(text);

  if (text.length && lang !== "plaintext" && loaded.includes(lang)) {
    try {
      const raw = highlighter.h.codeToHtml(text, {
        lang,
        themes: { light: highlighter.lightTheme, dark: highlighter.darkTheme },
        defaultColor: false,
      });
      highlighted = raw.match(/<code>([\s\S]*)<\/code>/)?.[1] ?? highlighted;
    } catch {
      // fall through to escaped plain text
    }
  }

  return html`<div${attr(DATA_TYPE, type.codeBlock)}>
    <div${dataAttrFlag(codeBlock.header)}>
      <span${dataAttrFlag(codeBlock.language)}>
        <img src="${fileCodeIcon}" alt="" aria-hidden="true" />
        ${escapeText(lang)}
      </span>
      <button
        type="button"${dataAttrFlag(codeBlock.copy)}${attr(codeBlock.copyText, text)}${attr(
          codeBlock.copyIcon,
          copyIcon,
        )}${attr(codeBlock.checkIcon, checkIcon)}
      >
        <img src="${copyIcon}" alt="" aria-hidden="true"${dataAttrFlag(codeBlock.copyIconImg)} />
        <span${dataAttrFlag(codeBlock.copyLabel)}>Copy</span>
      </button>
    </div>
    <pre><code${attr(codeBlock.lang, lang)}>${highlighted}</code></pre>
  </div>`;
}

function renderImage(node: ImageNode): string {
  let alignStyle: string | undefined;
  switch (node.attrs.align) {
    case "center":
      alignStyle = "display: block; margin: 0 auto";
      break;
    case "right":
      alignStyle = "display: block; margin-left: auto";
      break;
    case "full":
      alignStyle = "width: 100%";
      break;
  }
  const img = `<img${attr("src", node.attrs.src ?? undefined)}${attr(
    "alt",
    node.attrs.caption ?? "",
  )}${attr("width", node.attrs.width)}${attr("height", node.attrs.height)}${styleAttr(alignStyle)}>`;
  const caption = node.attrs.caption
    ? `<figcaption>${escapeText(node.attrs.caption)}</figcaption>`
    : "";
  return `<figure>${img}${caption}</figure>`;
}

async function renderCallout(node: CalloutNode): Promise<string> {
  const emoji = `<span${attr(DATA_TYPE, type.emoji)}><img${attr(
    "src",
    getEmojiUrl(node.attrs.hexId, "callout-icon"),
  )}${attr("alt", node.attrs.emoji)}></span>`;
  return `<div${attr(DATA_TYPE, type.callout)}${styleAttr(blockAttrsToStyle(node.attrs))}>${emoji}<div>${await _renderBlockContent(node.content)}</div></div>`;
}

// ── Lists ─────────────────────────────────────────────────────────────

async function renderListItem(node: ListItemNode): Promise<string> {
  return `<li>${await _renderBlockContent(node.content)}</li>`;
}

async function renderTaskItem(node: TaskItemNode): Promise<string> {
  const checked = node.attrs.checked ? " checked" : "";
  return html`<li>
    <input type="checkbox" ${checked} disabled />
    <div>${await _renderBlockContent(node.content)}</div>
  </li>`;
}

async function renderBulletList(node: BulletListNode): Promise<string> {
  return `<ul>${(await Promise.all((node.content ?? []).map(renderListItem))).join("")}</ul>`;
}

async function renderOrderedList(node: OrderedListNode): Promise<string> {
  return `<ol${attr("start", node.attrs.start)}>${(await Promise.all((node.content ?? []).map(renderListItem))).join("")}</ol>`;
}

async function renderTaskList(node: TaskListNode): Promise<string> {
  return `<ul${attr(DATA_TYPE, type.taskList)}>${(await Promise.all((node.content ?? []).map(renderTaskItem))).join("")}</ul>`;
}

// ── Tables ────────────────────────────────────────────────────────────

function buildColgroup(table: TableNode): string {
  const firstRow = table.content?.[0];
  if (!firstRow) return "";

  const widths: (number | undefined)[] = [];
  for (const cell of firstRow.content ?? []) {
    const span = cell.attrs?.colspan ?? 1;
    const cw = cell.attrs?.colwidth;
    if (cw && cw.length === span) widths.push(...cw);
    else for (let i = 0; i < span; i++) widths.push(undefined);
  }

  if (widths.every((w) => w === undefined)) return "";

  const cols = widths
    .map((w) => `<col${styleAttr(w ? `width: ${w}px` : undefined)}>`)
    .join("");
  return `<colgroup>${cols}</colgroup>`;
}

async function renderTableCell(
  node: TableCellNode | TableHeaderNode,
): Promise<string> {
  const tag = node.type === "tableHeader" ? "th" : "td";
  const style = node.attrs?.backgroundColor
    ? `background-color: ${node.attrs.backgroundColor}`
    : undefined;
  return `<${tag}${styleAttr(style)}${attr("colspan", node.attrs?.colspan)}${attr("rowspan", node.attrs?.rowspan)}>${await _renderBlockContent(node.content)}</${tag}>`;
}

async function renderTableRow(node: TableRowNode): Promise<string> {
  return `<tr>${(await Promise.all((node.content ?? []).map(renderTableCell))).join("")}</tr>`;
}

async function renderTable(node: TableNode): Promise<string> {
  return html`<div${attr(DATA_TYPE, type.tableContainer)}>
    <table>
      ${buildColgroup(node)}
      <tbody>
        ${(await Promise.all((node.content ?? []).map(renderTableRow))).join("")}
      </tbody>
    </table>
  </div>`;
}

// ── Dispatcher ────────────────────────────────────────────────────────

function renderBlock(node: BlockNode): Promise<string> | string {
  switch (node.type) {
    case "paragraph":
      return renderParagraph(node);
    case "heading":
      return renderHeading(node);
    case "blockquote":
      return renderBlockquote(node);
    case "codeBlock":
      return renderCodeBlock(node);
    case "horizontalRule":
      return "<hr>";
    case "image":
      return renderImage(node);
    case "callout":
      return renderCallout(node);
    case "bulletList":
      return renderBulletList(node);
    case "orderedList":
      return renderOrderedList(node);
    case "taskList":
      return renderTaskList(node);
    case "table":
      return renderTable(node);
  }
}

export async function _renderBlockContent(
  nodes?: BlockNode[],
): Promise<string> {
  return (await Promise.all((nodes ?? []).map(renderBlock))).join("");
}

// ── Entry point ───────────────────────────────────────────────────────

interface DocRendererOptions {
  className: string;
  Tag: HTMLElement["tagName"];
  type?: "content" | "document";
  title?: string;
}

export async function docToHTML(
  doc: DocContent,
  {
    Tag = "div",
    className = "",
    type = "content",
    title = "Document",
  }: Partial<DocRendererOptions> = {},
): Promise<string> {
  const rendered = (await Promise.all(doc.content.map(renderBlock))).join("");
  const content = `<${Tag} class="${className} open-notion-doc"> ${rendered} </${Tag}>`;

  if (type === "document") return content;

  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="color-scheme" content="light dark" />
        <title>${title}</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@open-notion/assets@1.0.0/doc.css"
        />
      </head>
      <body>
        ${content}
      </body>
    </html>`;
}
