import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CalloutBlock } from "../blocks/CalloutBlock";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType;
      toggleCallout: () => ReturnType;
    };
  }
}

export type CalloutColor =
  | "default"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "note";

export const CALLOUT_COLORS: {
  id: CalloutColor;
  label: string;
  emoji: string;
}[] = [
  { id: "default", label: "Default", emoji: "💡" },
  { id: "info", label: "Info", emoji: "ℹ️" },
  { id: "warning", label: "Warning", emoji: "⚠️" },
  { id: "success", label: "Success", emoji: "✅" },
  { id: "danger", label: "Danger", emoji: "🔴" },
  { id: "note", label: "Note", emoji: "📝" },
];

export const Callout = Node.create({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      emoji: {
        default: "💡",
        parseHTML: (el) => el.getAttribute("data-emoji"),
        renderHTML: (attrs) => ({ "data-emoji": attrs.emoji }),
      },
      color: {
        default: "default",
        parseHTML: (el) => el.getAttribute("data-color") ?? "default",
        renderHTML: (attrs) => ({ "data-color": attrs.color }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": this.name }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBlock);
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});
