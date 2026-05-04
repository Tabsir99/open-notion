import type {
  DocContent,
  BlockNode,
  InlineNode,
  AnyMark,
  ParagraphNode,
  HeadingNode,
  BlockquoteNode,
  CodeBlockNode,
  ImageNode,
  CalloutNode,
  BulletListNode,
  OrderedListNode,
  TaskListNode,
  ListItemNode,
  TaskItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  TableHeaderNode,
  BlockAttrs,
} from "./jsonContent";
import { getEmojiUrl } from "./utils";
import { getCachedHighlighter } from "./highlighter";

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
      const style = parts.length ? parts.join("; ") : undefined;
      return `<span${styleAttr(style)}>${content}</span>`;
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
      return `<span data-type="emoji"><img${attr(
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

function renderBlockquote(node: BlockquoteNode): string {
  return `<blockquote${styleAttr(blockAttrsToStyle(node.attrs))}>${renderBlockContent(node.content)}</blockquote>`;
}

function renderCodeBlock(node: CodeBlockNode): string {
  const copyIcon =
    "https://cdn.jsdelivr.net/npm/lucide-static@0.511.0/icons/copy.svg";
  const checkIcon =
    "https://cdn.jsdelivr.net/npm/lucide-static@0.511.0/icons/check.svg";
  const fileCodeIcon =
    "https://cdn.jsdelivr.net/npm/lucide-static@0.511.0/icons/file-code-2.svg";
  const lang = node.attrs.language || "plaintext";
  const text = (node.content ?? []).map((t) => t.text).join("");
  const escapedText = escapeText(text);
  const highlighter = getCachedHighlighter();
  const loaded = highlighter?.h.getLoadedLanguages() ?? [];
  let highlighted = escapedText;

  if (highlighter && text.length && lang !== "plaintext" && loaded.includes(lang)) {
    try {
      const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");
      const { tokens } = highlighter.h.codeToTokens(text, {
        lang,
        theme: isDark ? highlighter.darkTheme : highlighter.lightTheme,
      });
      highlighted = tokens
        .map((line) =>
          line
            .map((token) => {
              const content = escapeText(token.content);
              return token.color
                ? `<span style="color:${token.color}">${content}</span>`
                : content;
            })
            .join(""),
        )
        .join("\n");
    } catch {
      highlighted = escapedText;
    }
  }

  return `<div data-type="codeBlock">
<div data-code-block-header>
<span data-code-block-language>
<img src="${fileCodeIcon}" alt="" aria-hidden="true">
${escapeText(lang)}
</span>
<button type="button" data-copy-button data-copy-text="${escapeAttr(text)}" onclick="(function(btn){var icon=btn.querySelector('[data-copy-icon]');var label=btn.querySelector('[data-copy-label]');var copyText=btn.getAttribute('data-copy-text')||'';navigator.clipboard.writeText(copyText).then(function(){btn.setAttribute('data-copied','true');if(icon)icon.setAttribute('src','${checkIcon}');if(label)label.textContent='Copied';setTimeout(function(){btn.setAttribute('data-copied','false');if(icon)icon.setAttribute('src','${copyIcon}');if(label)label.textContent='Copy';},2000);});})(this)">
<img src="${copyIcon}" alt="" aria-hidden="true" data-copy-icon>
<span data-copy-label>Copy</span>
</button>
</div>
<pre><code${attr("data-language", lang)}>${highlighted}</code></pre>
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

function renderCallout(node: CalloutNode): string {
  const emoji = `<span data-type="emoji"><img${attr(
    "src",
    getEmojiUrl(node.attrs.hexId, "callout-icon"),
  )}${attr("alt", node.attrs.emoji)}></span>`;
  return `<div data-type="callout"${styleAttr(blockAttrsToStyle(node.attrs))}>${emoji}<div>${renderBlockContent(node.content)}</div></div>`;
}

// ── Lists ─────────────────────────────────────────────────────────────

function renderListItem(node: ListItemNode): string {
  return `<li>${renderBlockContent(node.content)}</li>`;
}

function renderTaskItem(node: TaskItemNode): string {
  const checked = node.attrs.checked ? " checked" : "";
  return `<li><input type="checkbox"${checked} disabled><div>${renderBlockContent(node.content)}</div></li>`;
}

function renderBulletList(node: BulletListNode): string {
  return `<ul>${(node.content ?? []).map(renderListItem).join("")}</ul>`;
}

function renderOrderedList(node: OrderedListNode): string {
  return `<ol${attr("start", node.attrs.start)}>${(node.content ?? []).map(renderListItem).join("")}</ol>`;
}

function renderTaskList(node: TaskListNode): string {
  return `<ul data-type="taskList">${(node.content ?? []).map(renderTaskItem).join("")}</ul>`;
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

function renderTableCell(node: TableCellNode | TableHeaderNode): string {
  const tag = node.type === "tableHeader" ? "th" : "td";
  const style = node.attrs?.backgroundColor
    ? `background-color: ${node.attrs.backgroundColor}`
    : undefined;
  return `<${tag}${styleAttr(style)}${attr("colspan", node.attrs?.colspan)}${attr("rowspan", node.attrs?.rowspan)}>${renderBlockContent(node.content)}</${tag}>`;
}

function renderTableRow(node: TableRowNode): string {
  return `<tr>${(node.content ?? []).map(renderTableCell).join("")}</tr>`;
}

function renderTable(node: TableNode): string {
  return `<div data-type="tableContainer"><table>${buildColgroup(node)}<tbody>${(node.content ?? []).map(renderTableRow).join("")}</tbody></table></div>`;
}

// ── Dispatcher ────────────────────────────────────────────────────────

function renderBlock(node: BlockNode): string {
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

function renderBlockContent(nodes?: BlockNode[]): string {
  return (nodes ?? []).map(renderBlock).join("");
}

// ── Entry point ───────────────────────────────────────────────────────

interface DocRendererOptions {
  className: string;
  Tag: HTMLElement["tagName"];
}

export function docToHTML(
  doc: DocContent,
  { Tag = "div", className = "" }: Partial<DocRendererOptions> = {},
): string {
  return `<${Tag} class="${className} open-notion-doc"> ${doc.content.map(renderBlock).join("")} </${Tag}>`;
}
