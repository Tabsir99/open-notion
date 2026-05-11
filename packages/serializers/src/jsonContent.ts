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
      backgroundColor: string | null;
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
    /** Descriptive name (e.g. "smiling face"). Used for `<img alt>`. */
    name: string;
    /** Canonical hex codepoint (e.g. "1F600"). Drives image URLs. */
    hexId: string;
    /** Canonical shortcode (e.g. "smile"). Used for `:fallback:` text and serialization. */
    shortcode: string;
  };
};
// Derived from the open `InlineNodeDefs` interface below — consumers can
// widen this set via declaration merging.
export type InlineNode = InlineNodeDefs[keyof InlineNodeDefs];

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

// ── Registries (open interfaces — extend via declaration merging) ─────
//
// `BlockNodeDefs` / `InlineNodeDefs` / `NodeDefs` are open interfaces so
// consumers can register custom node types and have them flow into
// `BlockNode`, `InlineNode`, `AnyEditorNode`, `NodeName`, `NodeAttrs`,
// `DocContent.content`, and the typed editor surface — same pattern
// `MarkDefs` already uses for marks.
//
// Example consumer extension:
//
//   declare module "@open-notion/serializers" {
//     interface BlockNodeDefs {
//       githubLink: {
//         type: "githubLink";
//         attrs: BlockAttrs & { url: string };
//         content?: InlineNode[];
//       };
//     }
//   }
//
// After that one declaration, `BlockNode` / `AnyEditorNode` /
// `DocContent.content` include `"githubLink"`, and `createNode({ name:
// "githubLink", ... })` type-checks with the consumer's attrs shape.

export interface BlockNodeDefs {
  paragraph: ParagraphNode;
  heading: HeadingNode;
  blockquote: BlockquoteNode;
  codeBlock: CodeBlockNode;
  horizontalRule: HorizontalRule;
  image: ImageNode;
  callout: CalloutNode;
  bulletList: BulletListNode;
  orderedList: OrderedListNode;
  taskList: TaskListNode;
  table: TableNode;
}

export interface InlineNodeDefs {
  text: TextNode;
  hardBreak: HardBreakNode;
  emoji: EmojiNode;
}

// Catch-all registry — block + inline + structural (list items, table
// cells/rows). Consumers normally widen `BlockNodeDefs` or `InlineNodeDefs`
// directly; `NodeDefs` is the union landing zone everything ends up in.
export interface NodeDefs extends BlockNodeDefs, InlineNodeDefs {
  listItem: ListItemNode;
  taskItem: TaskItemNode;
  tableRow: TableRowNode;
  tableCell: TableCellNode;
  tableHeader: TableHeaderNode;
}

// ── Unions (derived from registries) ──────────────────────────────────

export type BlockNode = BlockNodeDefs[keyof BlockNodeDefs];
export type AnyEditorNode = NodeDefs[keyof NodeDefs];

// ── Root ──────────────────────────────────────────────────────────────

export type DocContent = { type: "doc"; content: BlockNode[] };

export type TocItem = {
  id: string;
  level: 1 | 2 | 3;
  text: string;
  children: TocItem[];
};
