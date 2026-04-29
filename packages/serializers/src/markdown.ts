import type {
  DocContent,
  BlockNode,
  InlineNode,
  AnyMark,
  TextNode,
  ParagraphNode,
  HeadingNode,
  BlockquoteNode,
  CodeBlockNode,
  ImageNode,
  CalloutNode,
  BulletListNode,
  OrderedListNode,
  TaskListNode,
  TableNode,
  TableCellNode,
  TableHeaderNode,
} from "./jsonContent";

// ── Text helpers ──────────────────────────────────────────────────────

function hexIdToUnicode(hexId: string): string {
  return hexId
    .split("-")
    .map((cp) => String.fromCodePoint(parseInt(cp, 16)))
    .join("");
}

function escapeInline(text: string): string {
  return text.replace(/[\\`*_~\[\]<]/g, "\\$&");
}

function formatInlineCode(text: string): string {
  let maxRun = 0;
  let currentRun = 0;
  for (const ch of text) {
    if (ch === "`") {
      currentRun++;
      if (currentRun > maxRun) maxRun = currentRun;
    } else {
      currentRun = 0;
    }
  }
  const delim = "`".repeat(maxRun + 1);
  const padded = text.startsWith("`") || text.endsWith("`");
  return padded ? `${delim} ${text} ${delim}` : `${delim}${text}${delim}`;
}

function prefixLines(
  text: string,
  prefix: string,
  firstPrefix: string = prefix,
): string {
  return text
    .split("\n")
    .map((line, i) => {
      const p = i === 0 ? firstPrefix : prefix;
      return line === "" ? p.trimEnd() : p + line;
    })
    .join("\n");
}

// ── Marks ─────────────────────────────────────────────────────────────

function applyMark(content: string, mark: AnyMark): string {
  switch (mark.type) {
    case "bold":
      return `**${content}**`;
    case "italic":
      return `*${content}*`;
    case "strike":
      return `~~${content}~~`;
    case "underline":
      return `<u>${content}</u>`;
    case "link":
      return `[${content}](${mark.attrs.href})`;
    case "code":
      // Code marks are handled in renderTextNode (text inside is literal).
      // Reaching here shouldn't happen; emit conservatively.
      return formatInlineCode(content);
    case "textStyle":
      // No Markdown equivalent — strip styling, keep text.
      return content;
  }
}

function renderTextNode(node: TextNode): string {
  const marks = node.marks ?? [];
  const codeIdx = marks.findIndex((m) => m.type === "code");

  if (codeIdx === -1) {
    let content = escapeInline(node.text);
    for (const mark of marks) {
      content = applyMark(content, mark);
    }
    return content;
  }

  // Code mark present: text inside the code span is literal.
  // Marks before `code` cannot wrap literal text and are dropped.
  // Marks after `code` wrap the code span normally.
  let content = formatInlineCode(node.text);
  for (let i = codeIdx + 1; i < marks.length; i++) {
    content = applyMark(content, marks[i]);
  }
  return content;
}

// ── Inline rendering ──────────────────────────────────────────────────

function renderInline(node: InlineNode): string {
  switch (node.type) {
    case "text":
      return renderTextNode(node);
    case "hardBreak":
      return "\\\n";
    case "emoji":
      return hexIdToUnicode(node.attrs.hexId);
  }
}

function renderInlineContent(nodes?: InlineNode[]): string {
  return (nodes ?? []).map(renderInline).join("");
}

// ── Block rendering ───────────────────────────────────────────────────

function renderParagraph(node: ParagraphNode): string {
  return renderInlineContent(node.content);
}

function renderHeading(node: HeadingNode): string {
  return `${"#".repeat(node.attrs.level)} ${renderInlineContent(node.content)}`;
}

function renderBlockquote(node: BlockquoteNode): string {
  return prefixLines(renderBlockContent(node.content), "> ");
}

function renderCodeBlock(node: CodeBlockNode): string {
  const text = (node.content ?? []).map((t) => t.text).join("");
  let maxRun = 2;
  const matches = text.match(/`+/g);
  if (matches) {
    for (const m of matches) {
      if (m.length > maxRun) maxRun = m.length;
    }
  }
  const fence = "`".repeat(Math.max(3, maxRun + 1));
  const lang = node.attrs.language;
  const opener = lang ? `${fence}${lang}` : fence;
  return `${opener}\n${text}\n${fence}`;
}

function renderImage(node: ImageNode): string {
  const src = node.attrs.src ?? "";
  const alt = node.attrs.caption ?? "";
  return `![${escapeInline(alt)}](${src})`;
}

function renderCallout(node: CalloutNode): string {
  const emoji = hexIdToUnicode(node.attrs.emoji);
  const inner = renderBlockContent(node.content);
  const combined = inner ? `${emoji}\n\n${inner}` : emoji;
  return prefixLines(combined, "> ");
}

// ── Lists ─────────────────────────────────────────────────────────────

function renderBulletList(node: BulletListNode): string {
  return (node.content ?? [])
    .map((item) => prefixLines(renderBlockContent(item.content), "  ", "- "))
    .join("\n");
}

function renderOrderedList(node: OrderedListNode): string {
  const start = node.attrs.start ?? 1;
  return (node.content ?? [])
    .map((item, i) => {
      const marker = `${start + i}. `;
      const indent = " ".repeat(marker.length);
      return prefixLines(renderBlockContent(item.content), indent, marker);
    })
    .join("\n");
}

function renderTaskList(node: TaskListNode): string {
  return (node.content ?? [])
    .map((item) => {
      const marker = item.attrs.checked ? "- [x] " : "- [ ] ";
      return prefixLines(renderBlockContent(item.content), "  ", marker);
    })
    .join("\n");
}

// ── Tables ────────────────────────────────────────────────────────────

function renderTableCell(cell: TableCellNode | TableHeaderNode): string {
  const parts: string[] = [];
  for (const block of cell.content ?? []) {
    if (block.type === "paragraph") {
      parts.push(renderInlineContent(block.content));
    }
    // Non-paragraph blocks can't be expressed in a GFM cell; skipped.
  }
  return parts.join("<br>").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderTable(node: TableNode): string {
  const rows = node.content ?? [];
  if (rows.length === 0) return "";

  const headerCells = (rows[0].content ?? []).map(renderTableCell);
  const colCount = headerCells.length;
  if (colCount === 0) return "";

  const lines: string[] = [];
  lines.push(`| ${headerCells.join(" | ")} |`);
  lines.push(`| ${Array(colCount).fill("---").join(" | ")} |`);
  for (const row of rows.slice(1)) {
    const cells = (row.content ?? []).map(renderTableCell);
    while (cells.length < colCount) cells.push("");
    cells.length = colCount;
    lines.push(`| ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
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
      return "---";
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
  return (nodes ?? []).map(renderBlock).join("\n\n");
}

// ── Entry ─────────────────────────────────────────────────────────────

export function docToMarkdown(doc: DocContent): string {
  return doc.content.map(renderBlock).join("\n\n") + "\n";
}
