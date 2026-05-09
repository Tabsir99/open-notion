import CodeBlock from "@tiptap/extension-code-block";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

import { extendNode, lazyNodeView } from "../lib/createNode";
import {
  getHighlighter,
  type AppHighlighterConfig,
} from "@open-notion/serializers";

export const shikiPluginKey = new PluginKey("shikiHighlight");

function buildDecorations(
  doc: ProseMirrorNode,
  highlighter: AppHighlighterConfig | null,
  typeName: string,
): DecorationSet {
  if (!highlighter) return DecorationSet.empty;

  const { h, darkTheme, lightTheme } = highlighter;
  const loaded = h.getLoadedLanguages();
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== typeName) return;

    const lang = node.attrs.language || "plaintext";
    const code = node.textContent;
    if (!code.length || lang === "plaintext" || !loaded.includes(lang)) return;

    try {
      const { tokens: lightTokens } = h.codeToTokens(code, {
        lang,
        theme: lightTheme,
      });
      const { tokens: darkTokens } = h.codeToTokens(code, {
        lang,
        theme: darkTheme,
      });
      let offset = pos + 1;

      for (let i = 0; i < lightTokens.length; i++) {
        const lightLine = lightTokens[i] ?? [];
        const darkLine = darkTokens[i] ?? [];
        for (let j = 0; j < lightLine.length; j++) {
          const lightTok = lightLine[j]!;
          const darkTok = darkLine[j];
          const from = offset;
          const to = from + lightTok.content.length;
          const lightColor = lightTok.color;
          const darkColor = darkTok?.color;

          if (lightColor || darkColor) {
            const styleParts: string[] = [];
            if (lightColor) styleParts.push(`--shiki-light: ${lightColor}`);
            if (darkColor) styleParts.push(`--shiki-dark: ${darkColor}`);
            decorations.push(
              Decoration.inline(from, to, { style: styleParts.join("; ") }),
            );
          }
          offset = to;
        }
        if (i < lightTokens.length - 1) offset += 1;
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
      return { highlighter: null as AppHighlighterConfig | null };
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

    NodeView: lazyNodeView(() =>
      import("../blocks/CodeBlock").then((m) => ({ default: m.CodeBlockView })),
    ),

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
