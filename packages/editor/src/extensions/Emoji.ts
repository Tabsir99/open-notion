import {
  combineTransactionSteps,
  findChildrenInRange,
  getChangedRanges,
  InputRule,
  mergeAttributes,
  PasteRule,
} from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import emojiRegex from "emoji-regex";

import {
  getEmojiArray,
  onEmojiDataLoaded,
} from "../menus/EmojiPicker/createEmojipicker/data";
import { emojiToShortcode } from "./helpers/emojiToShortcode";
import { shortcodeToEmoji } from "./helpers/shortcodeToEmoji";
import { getEditorConfig } from "../config";
import { createNode } from "../lib/createNode";
import type { EmojiNode } from "@open-notion/serializers";

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
};

type EmojiStorage = {
  unsubscribe: (() => void) | null;
};

export const inputRegex = /:([a-zA-Z0-9_+-]+):$/;

export const pasteRegex = /(^|\s):([a-zA-Z0-9_+-]+):/g;

const SWEEP_META = "forceEmojiSweep";

export const EmojiExtension = createNode<"emoji", EmojiOptions>({
  name: "emoji",

  inline: true,

  group: "inline",

  atom: true,

  selectable: false,

  addStorage(): EmojiStorage {
    return { unsubscribe: null };
  },

  onCreate() {
    const storage = this.storage as EmojiStorage;
    storage.unsubscribe = onEmojiDataLoaded(() => {
      if (this.editor.view.isDestroyed) return;
      this.editor.view.dispatch(
        this.editor.state.tr.setMeta(SWEEP_META, true),
      );
    });
  },

  onDestroy() {
    const storage = this.storage as EmojiStorage;
    storage.unsubscribe?.();
    storage.unsubscribe = null;
  },

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
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      hexId: { default: null },
      name: { default: null },
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
    const emojiItem = shortcodeToEmoji(node.attrs.name, getEmojiArray());
    const attributes = mergeAttributes(HTMLAttributes, {
      "data-type": this.name,
    });

    if (!emojiItem) {
      return ["span", attributes, `:unknown:`];
    }

    return [
      "span",
      attributes,
      [
        "img",
        {
          src: getEditorConfig().getEmojiUrl(emojiItem.id, "inline"),
          draggable: "false",
          loading: "lazy",
          alt: `${emojiItem.name} emoji`,
        },
      ],
    ];
  },

  renderText({ node }) {
    const emojiItem = shortcodeToEmoji(node.attrs.name, getEmojiArray());
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
          const emojiItem = shortcodeToEmoji(shortcode, getEmojiArray());

          if (!emojiItem) return false;

          chain()
            .insertContent({
              type: this.name,
              attrs: {
                hexId: emojiItem.id,
                name: emojiItem.name,
              } satisfies EmojiNode["attrs"],
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
          const emojiItem = shortcodeToEmoji(name, getEmojiArray());

          if (!emojiItem) {
            return;
          }

          chain()
            .insertContentAt(range, {
              type: this.name,
              attrs: {
                hexId: emojiItem.id,
                name: emojiItem.name,
              } satisfies EmojiNode["attrs"],
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
          const prefix = match[1] || "";
          const name = match[2];
          const emojiItem = shortcodeToEmoji(name, getEmojiArray());

          if (!emojiItem) {
            return;
          }

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
    const extType = this.type;
    const extName = this.name;

    return [
      new Plugin({
        key: new PluginKey("emoji"),
        props: {
          handleDoubleClickOn: (_view, pos, node) => {
            if (node.type !== extType) {
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

        appendTransaction: (transactions, oldState, newState) => {
          if (this.editor.view.composing) {
            return;
          }

          const isSweep = transactions.some((t) => t.getMeta(SWEEP_META));
          const docChanges =
            transactions.some((transaction) => transaction.docChanged) &&
            !oldState.doc.eq(newState.doc);

          if (!docChanges && !isSweep) {
            return;
          }

          const emojis = getEmojiArray();
          if (emojis.length === 0) return;

          const { tr } = newState;

          // Determine ranges to scan: full doc on sweep, changed ranges otherwise.
          type ScanRange = { from: number; to: number };
          const ranges: ScanRange[] = isSweep
            ? [{ from: 0, to: newState.doc.content.size }]
            : getChangedRanges(
                combineTransactionSteps(
                  oldState.doc,
                  transactions as Transaction[],
                ),
              ).map((c) => ({ from: c.newRange.from, to: c.newRange.to }));

          ranges.forEach(({ from: rFrom, to: rTo }) => {
            if (newState.doc.resolve(rFrom).parent.type.spec.code) {
              return;
            }

            const textNodes = findChildrenInRange(
              newState.doc,
              { from: rFrom, to: rTo },
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
                const name = emojiToShortcode(emoji, emojis);

                if (!name) {
                  return;
                }
                const emojiItem = shortcodeToEmoji(name, emojis);
                if (!emojiItem) {
                  return;
                }

                const from = tr.mapping.map(pos + match.index);

                if (newState.doc.resolve(from).parent.type.spec.code) {
                  return;
                }

                const to = from + emoji.length;
                const emojiNode = extType.create({ name });

                tr.replaceRangeWith(from, to, emojiNode);

                tr.setStoredMarks(newState.doc.resolve(from).marks());
              });
            });
          });

          // Sweep also re-evaluates pre-existing emoji shortcodes (`:smile:`)
          // typed before data loaded.
          if (isSweep) {
            newState.doc.descendants((node, pos) => {
              if (!node.type.isText || !node.text) return;
              if (newState.doc.resolve(pos).parent.type.spec.code) return;

              const re = /:([a-zA-Z0-9_+-]+):/g;
              let m: RegExpExecArray | null;
              while ((m = re.exec(node.text))) {
                const name = m[1];
                const emojiItem = shortcodeToEmoji(name, emojis);
                if (!emojiItem) continue;
                const from = tr.mapping.map(pos + m.index);
                const to = from + m[0].length;
                tr.replaceRangeWith(
                  from,
                  to,
                  extType.create({
                    hexId: emojiItem.id,
                    name: emojiItem.name,
                  }),
                );
              }
            });
            // Tag the appended tr so we don't loop on our own meta.
            tr.setMeta(extName, true);
          }

          if (!tr.steps.length) {
            return;
          }

          return tr;
        },
      }),
    ];
  },
});
