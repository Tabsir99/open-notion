import type { Editor } from "@tiptap/react";

// ── Registry (source of truth) ────────────────────────────────────────

export const NODE_NAMES = [
  "doc",
  "text",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "listItem",
  "taskItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "image",
  "emoji",
  "table",
  "tableRow",
  "tableCell",
  "tableHeader",
  "callout",
] as const;

export const MARK_NAMES = [
  "bold",
  "italic",
  "strike",
  "code",
  "link",
  "textStyle",
  "underline",
] as const;

export type NodeName = (typeof NODE_NAMES)[number];
export type MarkName = (typeof MARK_NAMES)[number];
export type EntityName = NodeName | MarkName;

// ── Attribute shapes ──────────────────────────────────────────────────

type Empty = Record<string, never>;

// Cross-cutting attrs applied via BlockStyles + TextAlign
interface BlockAttrs {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right" | "justify";
}

interface CellAttrs {
  backgroundColor?: string;
  colspan?: number;
  rowspan?: number;
  colwidth?: number[] | null;
}

export interface NodeAttrs {
  doc: Empty;
  text: Empty;
  hardBreak: Empty;
  horizontalRule: Empty;
  paragraph: BlockAttrs;
  heading: BlockAttrs & { level: 1 | 2 | 3 };
  blockquote: BlockAttrs;
  bulletList: Empty;
  orderedList: { start?: number };
  taskList: Empty;
  listItem: Empty;
  taskItem: { checked?: boolean };
  codeBlock: { language?: string };
  image: {
    src?: string;
    caption?: string;
    align?: "left" | "center" | "full";
    width?: string | number;
  };
  emoji: { name?: string };
  table: Empty;
  tableRow: Empty;
  tableCell: CellAttrs;
  tableHeader: CellAttrs;
}

export interface MarkAttrs {
  bold: Empty;
  italic: Empty;
  strike: Empty;
  code: Empty;
  underline: Empty;
  link: { href: string; target?: string };
  textStyle: { color?: string; fontFamily?: string; fontSize?: string };
}

type AttrsFor<T extends EntityName> = T extends keyof NodeAttrs
  ? NodeAttrs[T]
  : T extends keyof MarkAttrs
    ? MarkAttrs[T]
    : never;

// ── Typed editor ──────────────────────────────────────────────────────

export type TypedEditor = Omit<Editor, "isActive" | "getAttributes"> & {
  isActive<T extends EntityName>(
    name: T,
    attrs?: Partial<AttrsFor<T>>,
  ): boolean;
  isActive(attrs: Partial<BlockAttrs>): boolean;
  getAttributes<T extends EntityName>(name: T): AttrsFor<T>;
};
