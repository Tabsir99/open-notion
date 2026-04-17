import {
  combineTransactionSteps,
  findChildrenInRange,
  getChangedRanges,
  InputRule,
  mergeAttributes,
  Node,
  PasteRule,
} from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import emojiRegex from "emoji-regex";

import { type Emoji } from "../menus/EmojiPicker/createEmojipicker/data.js";
import { emojiToShortcode } from "./helpers/emojiToShortcode.js";
import { shortcodeToEmoji } from "./helpers/shortcodeToEmoji.js";
import { getEmojiUrl } from "../menus/EmojiPicker/getEmojiUrl.js";
import type { GetEmojiUrl } from "../config.js";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    emoji: {
      /**
       * Add an emoji
       */
      setEmoji: (shortcode: string) => ReturnType;
    };
  }
}

export type EmojiOptions = {
  HTMLAttributes: Record<string, any>;
  getEmojiUrl: GetEmojiUrl;
  emojis: Emoji[];
};

export const inputRegex = /:([a-zA-Z0-9_+-]+):$/;

export const pasteRegex = /(^|\s):([a-zA-Z0-9_+-]+):/g;

export const EmojiNode = Node.create<EmojiOptions>({
  name: "emoji",

  inline: true,

  group: "inline",

  atom: true,

  selectable: false,

  addKeyboardShortcuts() {
    const step = (dir: -1 | 1) => () => {
      const { state, view } = this.editor;
      const { $from, empty } = state.selection;
      if (!empty) return false;

      const target = $from.pos + dir;
      if (target < 0 || target > state.doc.content.size) return false;

      const nodeBefore = $from.nodeBefore;
      const nodeAfter = $from.nodeAfter;
      const adjacent = dir === -1 ? nodeBefore : nodeAfter;

      if (!adjacent || adjacent.type.name !== this.name) return false;

      const $target = state.doc.resolve(target);
      view.dispatch(state.tr.setSelection(TextSelection.near($target, dir)));
      return true;
    };

    return { ArrowLeft: step(-1), ArrowRight: step(1) };
  },

  addOptions() {
    return { HTMLAttributes: {}, getEmojiUrl, emojis: [] };
  },

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.dataset.name,
        renderHTML: (attributes) => ({
          "data-name": attributes.name,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const emojiItem = shortcodeToEmoji(node.attrs.name, this.options.emojis);
    const attributes = mergeAttributes(
      HTMLAttributes,
      this.options.HTMLAttributes,
      { "data-type": this.name },
    );

    if (!emojiItem) {
      return ["span", attributes, `:${node.attrs.name}:`];
    }

    return [
      "span",
      attributes,
      [
        "img",
        {
          src: this.options.getEmojiUrl(emojiItem.id, "inline"),
          draggable: "false",
          loading: "lazy",
          alt: `${emojiItem.name} emoji`,
          style:
            "width: 1.2em; height: 1.2em; display: inline; margin-inline: 0.15em; margin-top: -0.1em;",
        },
      ],
    ];
  },

  renderText({ node }) {
    const emojiItem = shortcodeToEmoji(node.attrs.name, this.options.emojis);

    return emojiItem?.unicode || `:${node.attrs.name}:`;
  },

  renderMarkdown: (node) => {
    if (!node.attrs?.name) {
      return "";
    }

    return `:${node.attrs.name}:`;
  },

  addCommands() {
    return {
      setEmoji:
        (shortcode) =>
        ({ chain }) => {
          const emojiItem = shortcodeToEmoji(shortcode, this.options.emojis);

          if (!emojiItem) {
            return false;
          }

          chain()
            .insertContent({
              type: this.name,
              attrs: {
                name: emojiItem.name,
              },
            })
            .command(({ tr, state }) => {
              tr.setStoredMarks(
                state.doc.resolve(state.selection.to - 1).marks(),
              );
              return true;
            })
            .run();

          return true;
        },
    };
  },

  addInputRules() {
    const inputRules: InputRule[] = [];

    inputRules.push(
      new InputRule({
        find: inputRegex,
        handler: ({ range, match, chain }) => {
          const name = match[1];

          if (!shortcodeToEmoji(name, this.options.emojis)) {
            return;
          }

          chain()
            .insertContentAt(range, {
              type: this.name,
              attrs: {
                name,
              },
            })
            .command(({ tr, state }) => {
              tr.setStoredMarks(
                state.doc.resolve(state.selection.to - 1).marks(),
              );
              return true;
            })
            .run();
        },
      }),
    );

    return inputRules;
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: pasteRegex,
        handler: ({ range, match, chain }) => {
          // match[1] is the optional prefix (start or whitespace), match[2] is the shortcode name
          const prefix = match[1] || "";
          const name = match[2];

          if (!shortcodeToEmoji(name, this.options.emojis)) {
            return;
          }

          // Replace only the shortcode portion (preserve the prefix)
          const shortcodeFrom = range.from + prefix.length;
          const shortcodeTo = range.to;

          chain()
            .insertContentAt(
              { from: shortcodeFrom, to: shortcodeTo },
              {
                type: this.name,
                attrs: {
                  name,
                },
              },
              {
                updateSelection: false,
              },
            )
            .command(({ tr, state }) => {
              tr.setStoredMarks(
                state.doc.resolve(state.selection.to - 1).marks(),
              );
              return true;
            })
            .run();
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("emoji"),
        props: {
          // double click to select emoji doesn’t work by default
          // that’s why we simulate this behavior
          handleDoubleClickOn: (_view, pos, node) => {
            if (node.type !== this.type) {
              return false;
            }

            const from = pos;
            const to = from + node.nodeSize;

            this.editor.commands.setTextSelection({
              from,
              to,
            });

            return true;
          },
        },

        // replace text emojis with emoji node on any change
        appendTransaction: (transactions, oldState, newState) => {
          // Skip processing during IME composition
          if (this.editor.view.composing) {
            return;
          }
          const docChanges =
            transactions.some((transaction) => transaction.docChanged) &&
            !oldState.doc.eq(newState.doc);

          if (!docChanges) {
            return;
          }

          const { tr } = newState;
          const transform = combineTransactionSteps(
            oldState.doc,
            transactions as Transaction[],
          );
          const changes = getChangedRanges(transform);

          changes.forEach(({ newRange }) => {
            // We don’t want to add emoji inline nodes within code blocks.
            // Because this would split the code block.

            // This only works if the range of changes is within a code node.
            // For all other cases (e.g. the whole document is set/pasted and the parent of the range is `doc`)
            // it doesn't and we have to double check later.
            if (newState.doc.resolve(newRange.from).parent.type.spec.code) {
              return;
            }

            const textNodes = findChildrenInRange(
              newState.doc,
              newRange,
              (node) => node.type.isText,
            );

            textNodes.forEach(({ node, pos }) => {
              if (!node.text) {
                return;
              }

              const matches = [...node.text.matchAll(emojiRegex())];

              matches.forEach((match) => {
                if (match.index === undefined) {
                  return;
                }

                const emoji = match[0];
                const name = emojiToShortcode(emoji, this.options.emojis);

                if (!name) {
                  return;
                }

                const from = tr.mapping.map(pos + match.index);

                // Double check parent node is not a code block.
                if (newState.doc.resolve(from).parent.type.spec.code) {
                  return;
                }

                const to = from + emoji.length;
                const emojiNode = this.type.create({
                  name,
                });

                tr.replaceRangeWith(from, to, emojiNode);

                tr.setStoredMarks(newState.doc.resolve(from).marks());
              });
            });
          });

          if (!tr.steps.length) {
            return;
          }

          return tr;
        },
      }),
    ];
  },
});
