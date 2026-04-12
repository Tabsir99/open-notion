import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockStyles: {
      toggleBlockBackground: (color: string | null, pos?: number) => ReturnType;
      toggleBlockTextColor: (color: string | null, pos?: number) => ReturnType;
      toggleBlockFontSize: (size: string | null, pos?: number) => ReturnType;
      toggleBlockFontFamily: (
        family: string | null,
        pos?: number,
      ) => ReturnType;
    };
  }
}

export const BlockStyles = Extension.create<{ types: string[] }>({
  name: "blockStyles",

  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote", "listItem"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (el) =>
              (el as HTMLElement).style.backgroundColor || null,
            renderHTML: (attrs) =>
              attrs.backgroundColor
                ? { style: `background-color: ${attrs.backgroundColor}` }
                : {},
          },
          textColor: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.color || null,
            renderHTML: (attrs) =>
              attrs.textColor ? { style: `color: ${attrs.textColor}` } : {},
          },
          fontSize: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
          fontFamily: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontFamily || null,
            renderHTML: (attrs) =>
              attrs.fontFamily
                ? { style: `font-family: ${attrs.fontFamily}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    const types = this.options.types;

    /** Resolves target block; falls back to the current selection's parent block. */
    const resolveTargetBlock = (
      state: { selection: any; doc: any },
      pos?: number,
    ): { pos: number; node: PMNode } | null => {
      const targetPos = pos ?? state.selection.$from.before(1);
      const node = state.doc.nodeAt(targetPos);
      if (!node || !types.includes(node.type.name)) return null;
      return { pos: targetPos, node };
    };

    const toggleBlockAttr =
      (attrKey: string) =>
      (value: string | null, pos?: number) =>
      ({ tr, dispatch, state }: any) => {
        const target = resolveTargetBlock(state, pos);
        if (!target) return false;
        const current = target.node.attrs[attrKey];

        if (current === null && value === null) return false;

        const next = current === value ? null : value;
        if (dispatch) {
          tr.setNodeMarkup(target.pos, undefined, {
            ...target.node.attrs,
            [attrKey]: next,
          });
        }
        return true;
      };

    return {
      toggleBlockBackground: toggleBlockAttr("backgroundColor"),
      toggleBlockTextColor: toggleBlockAttr("textColor"),
      toggleBlockFontSize: toggleBlockAttr("fontSize"),
      toggleBlockFontFamily: toggleBlockAttr("fontFamily"),
    };
  },
});
