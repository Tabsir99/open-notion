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
import { TableKit } from "@tiptap/extension-table/kit";

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
import { Callout } from "./Callout";
import { CustomImage } from "./CustomImage";
import { CustomCodeBlock } from "./CustomCodeBlock";

import type { Extensions } from "@tiptap/core";

interface GetExtensionsProps {
  emojis: typeof EmojiNode.options.emojis;
}
export const getExtensions = (props: GetExtensionsProps) =>
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

    // Nodes
    Heading,
    Blockquote,
    HorizontalRule,
    BulletList,
    OrderedList,
    ListItem,
    TableKit,

    // Functionality
    TextAlign,
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") {
          return `Heading ${node.attrs.level}`;
        }
        if (node.type.name === "paragraph") {
          return "Type '/' for commands...";
        }
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
    EmojiNode.configure({
      emojis: props.emojis,
    }),
    Callout,
    CustomImage,
    CustomCodeBlock,
  ] as Extensions;
