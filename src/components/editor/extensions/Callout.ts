import { mergeAttributes } from "@tiptap/core";
import { CalloutView } from "../blocks/Callout";
import { createNode } from "../lib/createNode";
import type { CalloutNode } from "../jsonContent";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs: CalloutNode["attrs"]) => ReturnType;
      toggleCallout: () => ReturnType;
    };
  }
}

export const Callout = createNode({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      emoji: { default: "bulb" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "",
        "data-emoji": node.attrs.emoji,
      }),
      ["span", { "data-callout-emoji": "" }, node.attrs.emoji],
      ["div", { "data-callout-content": "" }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
            content: [{ type: "paragraph" }],
          }),
      toggleCallout:
        () =>
        ({ commands, editor }) => {
          if (editor.isActive("callout")) {
            return commands.lift("callout");
          }
          return commands.setCallout({ emoji: "bulb" });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Exit callout on Enter at end of empty block
      Enter: ({ editor }) => {
        if (!editor.isActive("callout")) return false;
        const { $from } = editor.state.selection;

        // Find the callout node depth
        let depth = $from.depth;
        while (depth > 0 && $from.node(depth).type.name !== "callout") depth--;
        if (depth === 0) return false;

        const calloutNode = $from.node(depth);
        const insideBlock = $from.node(depth + 1);

        // Only exit if: cursor is in the last child, that child is an empty paragraph
        const isLastChild = $from.index(depth) === calloutNode.childCount - 1;
        const isEmpty =
          insideBlock.type.name === "paragraph" &&
          insideBlock.content.size === 0;

        if (isLastChild && isEmpty) {
          return editor.commands.lift("callout");
        }
        return false;
      },
    };
  },

  NodeView: CalloutView,
});
