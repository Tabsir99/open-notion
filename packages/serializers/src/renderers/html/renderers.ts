import type {
  BlockNode,
  BlockquoteNode,
  BulletListNode,
  CalloutNode,
  DocContent,
  HeadingNode,
  ImageNode,
  ListItemNode,
  OrderedListNode,
  ParagraphNode,
  TaskItemNode,
  TaskListNode,
} from "../../jsonContent";
import { DA, DATA_TYPE } from "./htmlDataAttrs";
import { getEmojiUrl } from "../../utils";
import {
  attr,
  blockAttrsToStyle,
  escapeText,
  renderInlineContent,
  styleAttr,
} from "./_internal";
import { renderCodeBlock } from "./codeBlock";
import { renderTable } from "./table";

const { type } = DA;

const html = String.raw;

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

export async function renderDocContent(doc: DocContent): Promise<string> {
  return (await Promise.all(doc.content.map(renderBlock))).join("");
}
