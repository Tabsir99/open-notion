import type { AnyMark, BlockAttrs, InlineNode } from "../../jsonContent";
import { DA, DATA_TYPE } from "./htmlDataAttrs";
import { getEmojiUrl } from "../../utils";

const { type } = DA;

// ── Escapers ──────────────────────────────────────────────────────────

export function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Attribute / style emitters ────────────────────────────────────────

export function attr(
  name: string,
  value: string | number | undefined | null,
): string {
  if (value === undefined || value === null || value === "") return "";
  return ` ${name}="${escapeAttr(String(value))}"`;
}

export function styleAttr(css: string | undefined): string {
  return css ? ` style="${escapeAttr(css)}"` : "";
}

export function dataAttrFlag(name: string): string {
  return ` ${name}`;
}

export function blockAttrsToStyle(attrs?: BlockAttrs): string | undefined {
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

export function wrapMark(content: string, mark: AnyMark): string {
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

export function applyMarks(
  content: string,
  marks: AnyMark[] | undefined,
): string {
  if (!marks || marks.length === 0) return content;
  return marks.reduce<string>((node, mark) => wrapMark(node, mark), content);
}

// ── Inline rendering ──────────────────────────────────────────────────

export function renderInline(node: InlineNode): string {
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

export function renderInlineContent(nodes?: InlineNode[]): string {
  return (nodes ?? []).map(renderInline).join("");
}
