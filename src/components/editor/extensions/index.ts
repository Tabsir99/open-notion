// --- Core ---
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import Paragraph from "@tiptap/extension-paragraph";
import HardBreak from "@tiptap/extension-hard-break";

// --- Marks ---
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import Code from "@tiptap/extension-code";
import Link from "@tiptap/extension-link";
import { TextStyleKit } from "@tiptap/extension-text-style/text-style-kit";

// --- Nodes ---
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { BulletList, OrderedList, ListItem } from "@tiptap/extension-list";
import {
  TableCell,
  TableHeader,
  TableKit,
  TableView,
} from "@tiptap/extension-table";
import { Callout } from "./Callout";

const bgAttr = {
  backgroundColor: {
    default: null,
    parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
    renderHTML: (attrs: Record<string, unknown>) =>
      attrs.backgroundColor
        ? { style: `background-color: ${attrs.backgroundColor}` }
        : {},
  },
};

const TableCellWithBg = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...bgAttr };
  },
});

const TableHeaderWithBg = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...bgAttr };
  },
});

class CustomTableView extends TableView {
  constructor(node: any, cellMinWidth: number) {
    super(node, cellMinWidth);

    const wrapper = document.createElement("div");
    wrapper.className = "table-container";

    this.dom.classList.add("group/table");

    wrapper.appendChild(this.table);

    this.dom.appendChild(wrapper);
  }
}

// --- Functionality ---
import TextAlign from "@tiptap/extension-text-align";
import {
  Dropcursor,
  Gapcursor,
  TrailingNode,
  CharacterCount,
  UndoRedo,
  Selection,
  Placeholder,
} from "@tiptap/extensions";

// --- Custom ---
import { EmojiNode } from "./Emoji";
import { CustomImage } from "./CustomImage";
import { CustomCodeBlock } from "./CustomCodeBlock";
import { BlockStyles } from "./BlockStyles";

import type { Extensions } from "@tiptap/core";
import type { PlaceholderConfig } from "../config";

export const defaultExtensions = (
  emojis: typeof EmojiNode.options.emojis,
  placeholder?: PlaceholderConfig,
): Extensions =>
  [
    // Core
    Document,
    Text,
    Paragraph,
    HardBreak,

    // Marks
    Bold,
    Italic,
    Strike,
    Underline,
    Code,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "editor-link",
      },
      enableClickSelection: true,
    }),
    TextStyleKit,
    BlockStyles,

    // Nodes
    Heading,
    Blockquote,
    HorizontalRule,
    BulletList,
    OrderedList,
    ListItem,
    TableKit.configure({
      table: {
        resizable: true,
        handleWidth: 10,
        cellMinWidth: 75,
        View: CustomTableView,
      },
      tableCell: false,
      tableHeader: false,
    }),
    TableCellWithBg,
    TableHeaderWithBg,

    // Functionality
    TextAlign,
    Placeholder.configure({
      placeholder:
        typeof placeholder === "function"
          ? ({ node }) => placeholder(node)
          : placeholder
            ? () => placeholder as string
            : ({ node }) => {
                if (node.type.name === "heading")
                  return `Heading ${node.attrs.level}`;
                if (node.type.name === "paragraph")
                  return "Type '/' for commands...";
                return "";
              },
    }),
    Dropcursor,
    Gapcursor,
    TrailingNode,
    UndoRedo,
    CharacterCount,
    Selection.configure({
      className: "bg-editor-selected",
    }),

    // Custom
    EmojiNode.configure({ emojis }),
    CustomImage,
    CustomCodeBlock,
    Callout,
  ] as Extensions;
