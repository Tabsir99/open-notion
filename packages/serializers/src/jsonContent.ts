// ── Shared attr shapes ────────────────────────────────────────────────

type Empty = Record<string, never>;

export interface BlockAttrs {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right" | "justify";
}

export interface CellAttrs {
  backgroundColor?: string;
  colspan?: number;
  rowspan?: number;
  colwidth: number[] | null;
}

// ── Marks ─────────────────────────────────────────────────────────────

export interface MarkDefs {
  bold: { attrs?: Empty };
  italic: { attrs?: Empty };
  strike: { attrs?: Empty };
  code: { attrs?: Empty };
  underline: { attrs?: Empty };
  link: { attrs: { href: string; target: string } };
  textStyle: {
    attrs?: {
      color: string | null;
      fontFamily: string | null;
      fontSize: string | null;
    };
  };
}

export type AnyMark = {
  [T in keyof MarkDefs]: { type: T } & MarkDefs[T];
}[keyof MarkDefs];

// ── Inline nodes ──────────────────────────────────────────────────────

export type TextNode = { type: "text"; text: string; marks?: AnyMark[] };
export type HardBreakNode = { type: "hardBreak" };
export type EmojiNode = {
  type: "emoji";
  attrs: {
    name: string;
    hexId: string;
  };
};
export type InlineNode = TextNode | HardBreakNode | EmojiNode;

// ── Block nodes ───────────────────────────────────────────────────────

export type ParagraphNode = {
  type: "paragraph";
  attrs?: BlockAttrs;
  content?: InlineNode[];
};
export type HeadingNode = {
  type: "heading";
  attrs: BlockAttrs & { level: 1 | 2 | 3; id: string };
  content?: InlineNode[];
};
export type BlockquoteNode = {
  type: "blockquote";
  attrs?: BlockAttrs;
  content?: BlockNode[];
};
export type CodeBlockNode = {
  type: "codeBlock";
  attrs: { language: string };
  content?: TextNode[];
};
export type HorizontalRule = { type: "horizontalRule" };
export type ImageNode = {
  type: "image";
  attrs: {
    src: string | null;
    caption?: string;
    align: "left" | "center" | "full" | "right";
    width?: number | undefined;
    height?: number | undefined;
  };
};
export type CalloutNode = {
  type: "callout";
  attrs: BlockAttrs & { emoji: string; hexId: string };
  content?: BlockNode[];
};

// ── List nodes ────────────────────────────────────────────────────────

export type ListItemNode = { type: "listItem"; content?: BlockNode[] };
export type TaskItemNode = {
  type: "taskItem";
  attrs: { checked: boolean };
  content?: BlockNode[];
};
export type BulletListNode = { type: "bulletList"; content?: ListItemNode[] };
export type OrderedListNode = {
  type: "orderedList";
  attrs: { start: number; type: string | null };
  content?: ListItemNode[];
};
export type TaskListNode = { type: "taskList"; content?: TaskItemNode[] };

// ── Table nodes ───────────────────────────────────────────────────────

export type TableCellNode = {
  type: "tableCell";
  attrs?: CellAttrs;
  content?: BlockNode[];
};
export type TableHeaderNode = {
  type: "tableHeader";
  attrs?: CellAttrs;
  content?: BlockNode[];
};
export type TableRowNode = {
  type: "tableRow";
  content?: (TableCellNode | TableHeaderNode)[];
};
export type TableNode = { type: "table"; content?: TableRowNode[] };

// ── Unions ────────────────────────────────────────────────────────────

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BlockquoteNode
  | CodeBlockNode
  | HorizontalRule
  | ImageNode
  | CalloutNode
  | BulletListNode
  | OrderedListNode
  | TaskListNode
  | TableNode;

export type AnyEditorNode =
  | BlockNode
  | InlineNode
  | ListItemNode
  | TaskItemNode
  | TableRowNode
  | TableCellNode
  | TableHeaderNode;

// ── Root ──────────────────────────────────────────────────────────────

export type DocContent = { type: "doc"; content: BlockNode[] };

export type TocItem = {
  id: string;
  level: 1 | 2 | 3;
  text: string;
  children: TocItem[];
};
