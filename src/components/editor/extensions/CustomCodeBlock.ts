import CodeBlock from "@tiptap/extension-code-block";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { CodeBlockView } from "../blocks/CodeBlock";
import { preloadLangs } from "../blocks/CodeBlock/languages";

import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import lightPlus from "@shikijs/themes/light-plus";
import darkPlus from "@shikijs/themes/dark-plus";

const langLoaders: Record<string, () => Promise<any>> = {
  javascript: () => import("@shikijs/langs/javascript"),
  typescript: () => import("@shikijs/langs/typescript"),
  python: () => import("@shikijs/langs/python"),
  json: () => import("@shikijs/langs/json"),
  html: () => import("@shikijs/langs/html"),
  css: () => import("@shikijs/langs/css"),
  bash: () => import("@shikijs/langs/bash"),
  rust: () => import("@shikijs/langs/rust"),
};

const darkTheme = darkPlus.name!;
const lightTheme = lightPlus.name!;

// ── Types (duck-typed to avoid shiki internal type deps) ──────────────

interface ShikiHighlighter {
  codeToTokens: (
    code: string,
    options: { lang: string; theme: string },
  ) => { tokens: { content: string; color?: string }[][] };
  getLoadedLanguages: () => string[];
  loadLanguage: (...langs: string[]) => Promise<void>;
}

// ── Decoration builder ────────────────────────────────────────────────

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

// ── Extension ─────────────────────────────────────────────────────────

export const CustomCodeBlock = CodeBlock.configure({
  defaultLanguage: "javascript",
}).extend({
  addStorage() {
    return { highlighter: null as ShikiHighlighter | null };
  },

  onCreate() {
    createHighlighterCore({
      themes: [lightPlus, darkPlus],
      langs: preloadLangs
        .map((l) => langLoaders[l])
        .filter(Boolean)
        .map((loader) => loader()),
      engine: createJavaScriptRegexEngine(),
    }).then(async (h) => {
      this.storage.highlighter = h;
      if (this.editor.view.isDestroyed) return;

      // Collect languages present in the restored doc
      const needed = new Set<string>();
      this.editor.state.doc.descendants((node) => {
        if (node.type.name === this.name) {
          const lang = node.attrs.language;
          if (lang && lang !== "plaintext") needed.add(lang);
        }
      });

      const loaded = new Set(h.getLoadedLanguages());
      const toLoad = [...needed].filter(
        (l) => !loaded.has(l) && langLoaders[l],
      );
      if (toLoad.length) {
        await h.loadLanguage(...toLoad.map((l) => langLoaders[l]()));
      }

      this.editor.view.dispatch(
        this.editor.view.state.tr.setMeta(shikiPluginKey, true),
      );
    });
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

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
});
