import CodeBlock from "@tiptap/extension-code-block";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { CodeBlockView } from "../blocks/CodeBlock";
import { preloadLangs } from "../blocks/CodeBlock/languages";
import type { BundledTheme } from "shiki";

// ── Types (duck-typed to avoid shiki internal type deps) ──────────────

interface ShikiHighlighter {
  codeToTokens: (
    code: string,
    options: { lang: string; theme: string },
  ) => { tokens: { content: string; color?: string }[][] };
  getLoadedLanguages: () => string[];
  loadLanguage: (...langs: string[]) => Promise<void>;
}

const themes: BundledTheme[] = ["light-plus", "dark-plus"];
// ── Decoration builder ────────────────────────────────────────────────

export const shikiPluginKey = new PluginKey("shikiHighlight");

function buildDecorations(
  doc: ProseMirrorNode,
  highlighter: ShikiHighlighter | null,
  typeName: string,
): DecorationSet {
  if (!highlighter) return DecorationSet.empty;

  const isDark = document.documentElement.classList.contains("dark");
  const theme = isDark ? themes[1] : themes[0];
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
    import("shiki").then(({ createHighlighter }) =>
      createHighlighter({ themes, langs: [...preloadLangs] }).then(
        async (h) => {
          this.storage.highlighter = h as unknown as ShikiHighlighter;
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
          const toLoad = [...needed].filter((l) => !loaded.has(l));
          if (toLoad.length) {
            await (h as unknown as ShikiHighlighter).loadLanguage(...toLoad);
          }

          this.editor.view.dispatch(
            this.editor.view.state.tr.setMeta(shikiPluginKey, true),
          );
        },
      ),
    );
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
