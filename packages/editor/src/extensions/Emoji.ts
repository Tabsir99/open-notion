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
    const extType = this.type;

    const runCatchup = () => {
      const emojis = getEmojiArray();
      if (emojis.length === 0) return;

      const { state, view } = this.editor;
      const { tr } = state;

      state.doc.descendants((node, pos) => {
        if (!node.isText || !node.text) return;
        if (state.doc.resolve(pos).parent.type.spec.code) return;

        // shortcodes
        const scRe = /:([a-zA-Z0-9_+-]+):/g;
        let m: RegExpExecArray | null;
        while ((m = scRe.exec(node.text))) {
          const item = shortcodeToEmoji(m[1], emojis);
          if (!item) continue;
          const from = tr.mapping.map(pos + m.index);
          const to = from + m[0].length;
          tr.replaceRangeWith(
            from,
            to,
            extType.create({
              hexId: item.id,
              name: item.name,
              shortcode: item.shortcodes[0] ?? m[1],
            }),
          );
        }

        // unicode
        for (const um of node.text.matchAll(emojiRegex())) {
          if (um.index === undefined) continue;
          const sc = emojiToShortcode(um[0], emojis);
          if (!sc) continue;
          const item = shortcodeToEmoji(sc, emojis);
          if (!item) continue;
          const from = tr.mapping.map(pos + um.index);
          if (state.doc.resolve(from).parent.type.spec.code) continue;
          const to = from + um[0].length;
          tr.replaceRangeWith(
            from,
            to,
            extType.create({
              hexId: item.id,
              name: item.name,
              shortcode: item.shortcodes[0] ?? sc,
            }),
          );
        }
      });

      if (tr.steps.length) view.dispatch(tr);
    };

    // If data already loaded, run immediately. Otherwise subscribe.
    if (getEmojiArray().length > 0) {
      runCatchup();
    } else {
      storage.unsubscribe = onEmojiDataLoaded(() => {
        runCatchup();
        storage.unsubscribe?.();
        storage.unsubscribe = null;
      });
    }
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
      shortcode: {
        default: "",
        parseHTML: (el: HTMLElement) => {
          const explicit = el.getAttribute("data-shortcode");
          if (explicit) return explicit;
          // Backfill from descriptive name when emoji data is loaded
          // (e.g. parsing legacy HTML written before this attribute existed).
          const name = el.getAttribute("data-name");
          if (!name) return "";
          return shortcodeToEmoji(name, getEmojiArray())?.shortcodes[0] ?? "";
        },
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
    const attributes = mergeAttributes(HTMLAttributes, {
      "data-type": this.name,
    });

    const { hexId, name, shortcode } = node.attrs;

    if (!hexId) {
      const fallback = shortcode || name || "unknown";
      return ["span", attributes, `:${fallback}:`];
    }

    return [
      "span",
      attributes,
      [
        "img",
        {
          src: getEditorConfig().getEmojiUrl(hexId, "inline"),
          draggable: "false",
          loading: "lazy",
          alt: `${name} emoji`,
        },
      ],
    ];
  },

  renderText({ node }) {
    const lookup = node.attrs.shortcode || node.attrs.name;
    const emojiItem = shortcodeToEmoji(lookup, getEmojiArray());
    return emojiItem?.unicode || `:${lookup || "unknown"}:`;
  },

  renderMarkdown: (node) => {
    const code = node.attrs?.shortcode || node.attrs?.name;
    if (!code) return "";
    return `:${code}:`;
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
                shortcode: emojiItem.shortcodes[0] ?? emojiItem.name,
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
          const typed = match[1];
          const emojiItem = shortcodeToEmoji(typed, getEmojiArray());

          if (!emojiItem) {
            return;
          }

          chain()
            .insertContentAt(range, {
              type: this.name,
              attrs: {
                hexId: emojiItem.id,
                name: emojiItem.name,
                shortcode: emojiItem.shortcodes[0] ?? typed,
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
          const typed = match[2];
          const emojiItem = shortcodeToEmoji(typed, getEmojiArray());

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
                  hexId: emojiItem.id,
                  name: emojiItem.name,
                  shortcode: emojiItem.shortcodes[0] ?? typed,
                } satisfies EmojiNode["attrs"],
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
          if (this.editor.view.composing) return;

          const docChanges =
            transactions.some((transaction) => transaction.docChanged) &&
            !oldState.doc.eq(newState.doc);
          if (!docChanges) return;

          const emojis = getEmojiArray();
          if (emojis.length === 0) return;

          const { tr } = newState;
          const ranges = getChangedRanges(
            combineTransactionSteps(
              oldState.doc,
              transactions as Transaction[],
            ),
          ).map((c) => ({ from: c.newRange.from, to: c.newRange.to }));

          ranges.forEach(({ from: rFrom, to: rTo }) => {
            if (newState.doc.resolve(rFrom).parent.type.spec.code) return;

            const textNodes = findChildrenInRange(
              newState.doc,
              { from: rFrom, to: rTo },
              (node) => node.type.isText,
            );

            textNodes.forEach(({ node, pos }) => {
              if (!node.text) return;

              const matches = [...node.text.matchAll(emojiRegex())];

              for (const match of matches) {
                if (match.index === undefined) continue;
                const emoji = match[0];
                const sc = emojiToShortcode(emoji, emojis);
                if (!sc) continue;
                const item = shortcodeToEmoji(sc, emojis);
                if (!item) continue;
                const from = tr.mapping.map(pos + match.index);
                if (newState.doc.resolve(from).parent.type.spec.code) continue;
                const to = from + emoji.length;
                tr.replaceRangeWith(
                  from,
                  to,
                  extType.create({
                    hexId: item.id,
                    name: item.name,
                    shortcode: item.shortcodes[0] ?? sc,
                  }),
                );
                tr.setStoredMarks(newState.doc.resolve(from).marks());
              }
            });
          });

          return tr.steps.length ? tr : null;
        },
      }),
    ];
  },
});
