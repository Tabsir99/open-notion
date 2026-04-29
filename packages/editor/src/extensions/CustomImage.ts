import { nodeInputRule } from "@tiptap/core";
import type { ImageNode } from "@open-notion/serializers";
import { createNode } from "../lib/createNode";
import { ImageBlock } from "../blocks/ImageBlock";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       * @param options The image attributes
       */
      setImage: (attrs: ImageNode["attrs"]) => ReturnType;
    };
  }
}

export const inputRegex =
  /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;

export const Image = createNode({
  name: "image",

  group: "block",

  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: undefined },
      height: { default: undefined },
      align: { default: "center" as const },
      caption: { default: undefined },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", HTMLAttributes];
  },

  parseMarkdown: (token, helpers) => {
    return helpers.createNode("image", {
      src: token.href,
      title: token.title,
      alt: token.text,
    });
  },

  renderMarkdown: (node) => {
    const src = node.attrs?.src ?? "";
    const alt = node.attrs?.alt ?? "";
    const title = node.attrs?.title ?? "";

    return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  NodeView: ImageBlock,

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title] = match;

          return { src, alt, title };
        },
      }),
    ];
  },
});
