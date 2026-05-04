import type {
  DocContent,
  BlockNode,
  InlineNode,
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

// ── Inline rendering ──────────────────────────────────────────────────

function renderInline(node: InlineNode): string {
  switch (node.type) {
    case "text":
      return node.text;
    case "hardBreak":
      return "\n";
    case "emoji":
      return hexIdToUnicode(node.attrs.hexId);
  }
}

function renderInlineContent(nodes?: InlineNode[]): string {
  return (nodes ?? []).map(renderInline).join("");
}

// ── Block renderers ───────────────────────────────────────────────────

function renderParagraph(node: ParagraphNode): string {
  return renderInlineContent(node.content);
}

function renderHeading(node: HeadingNode): string {
  return renderInlineContent(node.content);
}

function renderBlockquote(node: BlockquoteNode): string {
  return renderBlockContent(node.content);
}

function renderCodeBlock(node: CodeBlockNode): string {
  return (node.content ?? []).map((t) => t.text).join("");
}

function renderImage(node: ImageNode): string {
  // No inherent text — fall back to the caption when present, otherwise a
  // blank line so the image's position in the document is preserved.
  return node.attrs.caption ?? "\n";
}

function renderCallout(node: CalloutNode): string {
  const emoji = hexIdToUnicode(node.attrs.emoji);
  const inner = renderBlockContent(node.content);
  return inner ? `${emoji} ${inner}` : emoji;
}

// ── Lists ─────────────────────────────────────────────────────────────

function renderBulletList(node: BulletListNode): string {
  return (node.content ?? [])
    .map((item) => renderBlockContent(item.content))
    .join("\n");
}

function renderOrderedList(node: OrderedListNode): string {
  return (node.content ?? [])
    .map((item) => renderBlockContent(item.content))
    .join("\n");
}

function renderTaskList(node: TaskListNode): string {
  return (node.content ?? [])
    .map((item) => renderBlockContent(item.content))
    .join("\n");
}

// ── Tables ────────────────────────────────────────────────────────────

function renderTableCell(cell: TableCellNode | TableHeaderNode): string {
  return renderBlockContent(cell.content).replace(/\s+/g, " ").trim();
}

function renderTable(node: TableNode): string {
  return (node.content ?? [])
    .map((row) => (row.content ?? []).map(renderTableCell).join("\t"))
    .join("\n");
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
      return "\n";
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

export async function docToText(doc: DocContent): Promise<string> {
  return doc.content.map(renderBlock).join("\n\n") + "\n";
}
