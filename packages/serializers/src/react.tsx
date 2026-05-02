import { type ReactNode, type CSSProperties, Fragment, type JSX } from "react";
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

// ── Helpers ───────────────────────────────────────────────────────────

function blockAttrsToStyle(attrs?: BlockAttrs): CSSProperties {
  if (!attrs) return {};
  return {
    backgroundColor: attrs.backgroundColor,
    color: attrs.textColor,
    fontSize: attrs.fontSize,
    fontFamily: attrs.fontFamily,
    textAlign: attrs.textAlign,
  };
}

// ── Mark renderer (wraps inline content) ──────────────────────────────

function applyMarks(
  content: ReactNode,
  marks: AnyMark[],
  key: string,
): ReactNode {
  return marks.reduce((node, mark, i) => {
    const markKey = `${key}-mark-${i}`;
    switch (mark.type) {
      case "bold":
        return <strong key={markKey}>{node}</strong>;
      case "italic":
        return <em key={markKey}>{node}</em>;
      case "strike":
        return <s key={markKey}>{node}</s>;
      case "underline":
        return <u key={markKey}>{node}</u>;
      case "code":
        return <code key={markKey}>{node}</code>;
      case "link":
        return (
          <a
            key={markKey}
            href={mark.attrs.href}
            target={mark.attrs.target}
            rel="noreferrer"
          >
            {node}
          </a>
        );
      case "textStyle": {
        const style: CSSProperties = {
          color: mark.attrs?.color ?? undefined,
          fontFamily: mark.attrs?.fontFamily ?? undefined,
          fontSize: mark.attrs?.fontSize ?? undefined,
        };
        return (
          <span key={markKey} style={style}>
            {node}
          </span>
        );
      }
      default:
        return node;
    }
  }, content);
}

// ── Inline node renderer ──────────────────────────────────────────────

function renderInline(node: InlineNode, key: string): ReactNode {
  switch (node.type) {
    case "text": {
      const text: ReactNode = node.text;
      return node.marks?.length ? (
        applyMarks(text, node.marks, key)
      ) : (
        <Fragment key={key}>{text}</Fragment>
      );
    }
    case "hardBreak":
      return <br key={key} />;
    case "emoji":
      return (
        <span key={key} data-type="emoji">
          <img
            src={getEmojiUrl(node.attrs.hexId, "inline")}
            alt={node.attrs.name}
          />
        </span>
      );
  }
}

function renderInlineContent(nodes?: InlineNode[]): ReactNode[] {
  return (nodes ?? []).map((n, i) => renderInline(n, String(i)));
}

// ── Block node renderers ──────────────────────────────────────────────

function renderParagraph(node: ParagraphNode, key: string): ReactNode {
  return (
    <p key={key} style={blockAttrsToStyle(node.attrs)}>
      {renderInlineContent(node.content)}
    </p>
  );
}

function renderHeading(node: HeadingNode, key: string): ReactNode {
  const Tag = `h${node.attrs.level}` as const;
  return (
    <Tag key={key} style={blockAttrsToStyle(node.attrs)}>
      {renderInlineContent(node.content)}
    </Tag>
  );
}

function renderBlockquote(node: BlockquoteNode, key: string): ReactNode {
  return (
    <blockquote key={key} style={blockAttrsToStyle(node.attrs)}>
      {renderBlockContent(node.content)}
    </blockquote>
  );
}

function renderCodeBlock(node: CodeBlockNode, key: string): ReactNode {
  return (
    <pre key={key}>
      <code data-language={node.attrs.language}>
        {(node.content ?? []).map((t) => t.text).join("")}
      </code>
    </pre>
  );
}

function renderImage(node: ImageNode, key: string): ReactNode {
  const alignStyle: CSSProperties =
    node.attrs.align === "center"
      ? { display: "block", margin: "0 auto" }
      : node.attrs.align === "right"
        ? { display: "block", marginLeft: "auto" }
        : node.attrs.align === "full"
          ? { width: "100%" }
          : {};

  return (
    <figure key={key}>
      <img
        src={node.attrs.src ?? undefined}
        alt={node.attrs.caption ?? ""}
        width={node.attrs.width}
        height={node.attrs.height}
        style={alignStyle}
      />
      {node.attrs.caption && <figcaption>{node.attrs.caption}</figcaption>}
    </figure>
  );
}

function renderCallout(node: CalloutNode, key: string): ReactNode {
  return (
    <div key={key} style={blockAttrsToStyle(node.attrs)} data-type="callout">
      <span data-type="emoji">
        <img
          src={getEmojiUrl(node.attrs.emoji, "callout-icon")}
          alt={node.attrs.emoji}
        />
      </span>
      <div>{renderBlockContent(node.content)}</div>
    </div>
  );
}

// ── List renderers ────────────────────────────────────────────────────

function renderListItem(node: ListItemNode, key: string): ReactNode {
  return <li key={key}>{renderBlockContent(node.content)}</li>;
}

function renderTaskItem(node: TaskItemNode, key: string): ReactNode {
  return (
    <li key={key}>
      <input
        type="checkbox"
        defaultChecked={node.attrs.checked}
        readOnly
        style={{ marginTop: 3 }}
      />
      <div>{renderBlockContent(node.content)}</div>
    </li>
  );
}

function renderBulletList(node: BulletListNode, key: string): ReactNode {
  return (
    <ul key={key}>
      {(node.content ?? []).map((item, i) => renderListItem(item, String(i)))}
    </ul>
  );
}

function renderOrderedList(node: OrderedListNode, key: string): ReactNode {
  return (
    <ol key={key} start={node.attrs.start}>
      {(node.content ?? []).map((item, i) => renderListItem(item, String(i)))}
    </ol>
  );
}

function renderTaskList(node: TaskListNode, key: string): ReactNode {
  return (
    <ul key={key} data-type="taskList">
      {(node.content ?? []).map((item, i) => renderTaskItem(item, String(i)))}
    </ul>
  );
}

// ── Table renderers ───────────────────────────────────────────────────

function renderTableCell(
  node: TableCellNode | TableHeaderNode,
  key: string,
): ReactNode {
  const Tag = node.type === "tableHeader" ? "th" : "td";
  const style: CSSProperties = {
    backgroundColor: node.attrs?.backgroundColor,
  };
  return (
    <Tag
      key={key}
      style={style}
      colSpan={node.attrs?.colspan}
      rowSpan={node.attrs?.rowspan}
    >
      {renderBlockContent(node.content)}
    </Tag>
  );
}

function renderTableRow(node: TableRowNode, key: string): ReactNode {
  return (
    <tr key={key}>
      {(node.content ?? []).map((cell, i) => renderTableCell(cell, String(i)))}
    </tr>
  );
}

function renderTable(node: TableNode, key: string): ReactNode {
  return (
    <table key={key}>
      <tbody>
        {(node.content ?? []).map((row, i) => renderTableRow(row, String(i)))}
      </tbody>
    </table>
  );
}

// ── Core block dispatcher ─────────────────────────────────────────────

function renderBlock(node: BlockNode, key: string): ReactNode {
  switch (node.type) {
    case "paragraph":
      return renderParagraph(node, key);
    case "heading":
      return renderHeading(node, key);
    case "blockquote":
      return renderBlockquote(node, key);
    case "codeBlock":
      return renderCodeBlock(node, key);
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return renderImage(node, key);
    case "callout":
      return renderCallout(node, key);
    case "bulletList":
      return renderBulletList(node, key);
    case "orderedList":
      return renderOrderedList(node, key);
    case "taskList":
      return renderTaskList(node, key);
    case "table":
      return renderTable(node, key);
  }
}

function renderBlockContent(nodes?: BlockNode[]): ReactNode[] {
  return (nodes ?? []).map((n, i) => renderBlock(n, String(i)));
}

// ── Root component ────────────────────────────────────────────────────

interface DocRendererOptions {
  className: string;
  Tag: keyof JSX.IntrinsicElements;
}

export function docToReact(
  doc: DocContent,
  { className, Tag = "div" }: Partial<DocRendererOptions> = {},
) {
  return (
    <Tag id="open-notion" className={className + " open-notion-doc"}>
      {doc.content.map((node, i) => renderBlock(node, String(i)))}
    </Tag>
  );
}
