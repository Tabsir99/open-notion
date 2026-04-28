import CodeBlock from "@tiptap/extension-code-block";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { CodeBlockView } from "../blocks/CodeBlock";

import lightPlus from "@shikijs/themes/light-plus";
import darkPlus from "@shikijs/themes/dark-plus";
import { extendNode } from "../lib/createNode";
import { getHighlighter } from "../serializers/highlighter";

const darkTheme = darkPlus.name!;
const lightTheme = lightPlus.name!;

interface ShikiHighlighter {
  codeToTokens: (
    code: string,
    options: { lang: string; theme: string },
  ) => { tokens: { content: string; color?: string }[][] };
  getLoadedLanguages: () => string[];
}

export const shikiPluginKey = new PluginKey("shikiHighlight");

function buildDecorations(
  doc: ProseMirrorNode,
  highlighter: ShikiHighlighter | null,
  typeName: string,
): DecorationSet {
  if (!highlighter) return DecorationSet.empty;

  const isDark = document.documentElement.classList.contains("dark");
  const theme = isDark ? darkTheme : lightTheme;
  const loaded = highlighter.getLoadedLanguages();
  const decorations: Decoration[] = [];

  console.log(loaded);
  doc.descendants((node, pos) => {
    if (node.type.name !== typeName) return;

    const lang = node.attrs.language || "plaintext";
    const code = node.textContent;
    if (!code.length || lang === "plaintext" || !loaded.includes(lang)) return;

    try {
      const { tokens } = highlighter.codeToTokens(code, { lang, theme });
      let offset = pos + 1;

      for (let i = 0; i < tokens.length; i++) {
        for (const token of tokens[i]) {
          const from = offset;
          const to = from + token.content.length;
          if (token.color) {
            decorations.push(
              Decoration.inline(from, to, { style: `color: ${token.color}` }),
            );
          }
          offset = to;
        }
        if (i < tokens.length - 1) offset += 1;
      }
    } catch {
      /* language parse error — render plain */
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const CustomCodeBlock = extendNode<"codeBlock">(
  CodeBlock.configure({
    defaultLanguage: "javascript",
  }),
  {
    addStorage() {
      return { highlighter: null as ShikiHighlighter | null };
    },

    onCreate() {
      getHighlighter().then((h) => {
        this.storage.highlighter = h;
        if (this.editor.view.isDestroyed) return;
        this.editor.view.dispatch(
          this.editor.view.state.tr.setMeta(shikiPluginKey, true),
        );
      });
    },

    NodeView: CodeBlockView,

    addProseMirrorPlugins() {
      const ext = this;
      return [
        ...(this.parent?.() ?? []),
        new Plugin({
          key: shikiPluginKey,
          state: {
            init(_, { doc }) {
              return buildDecorations(doc, ext.storage.highlighter, ext.name);
            },
            apply(tr, old, _, newState) {
              if (!tr.docChanged && !tr.getMeta(shikiPluginKey)) return old;
              return buildDecorations(
                newState.doc,
                ext.storage.highlighter,
                ext.name,
              );
            },
          },
          props: {
            decorations(state) {
              return this.getState(state);
            },
          },
        }),
      ];
    },
  },
);
