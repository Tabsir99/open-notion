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

function tokenizeNode(
  node: ProseMirrorNode,
  pos: number,
  highlighter: AppHighlighterConfig,
): Decoration[] {
  const { h, darkTheme, lightTheme } = highlighter;
  const lang = node.attrs.language || "plaintext";
  const code = node.textContent;
  if (
    !code.length ||
    lang === "plaintext" ||
    !h.getLoadedLanguages().includes(lang)
  ) {
    return [];
  }

  const decorations: Decoration[] = [];
  try {
    const lines = h.codeToTokensWithThemes(code, {
      lang,
      themes: { light: lightTheme, dark: darkTheme },
    });
    let offset = pos + 1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? [];
      for (let j = 0; j < line.length; j++) {
        const tok = line[j]!;
        const from = offset;
        const to = from + tok.content.length;
        const lightColor = tok.variants.light?.color;
        const darkColor = tok.variants.dark?.color;
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
      if (i < lines.length - 1) offset += 1;
    }
  } catch {
    /* language parse error — render plain */
  }
  return decorations;
}

function buildAllDecorations(
  doc: ProseMirrorNode,
  highlighter: AppHighlighterConfig | null,
  typeName: string,
): DecorationSet {
  if (!highlighter) return DecorationSet.empty;
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== typeName) return;
    decorations.push(...tokenizeNode(node, pos, highlighter));
    return false;
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
              return buildAllDecorations(doc, ext.storage.highlighter, ext.name);
            },
            apply(tr, old, _, newState) {
              const hl = ext.storage.highlighter;

              if (tr.getMeta(shikiPluginKey)) {
                return buildAllDecorations(newState.doc, hl, ext.name);
              }
              if (!tr.docChanged) return old;
              if (!hl) return old.map(tr.mapping, newState.doc);

              // Multi-step transactions (paste, undo replays, structural
              // edits) are rare outside the typing hot path — rebuild fully
              // to keep the incremental branch simple and correct.
              if (tr.steps.length !== 1) {
                return buildAllDecorations(newState.doc, hl, ext.name);
              }

              let changedFrom = Infinity;
              let changedTo = -Infinity;
              tr.steps[0]!.getMap().forEach((_a, _b, ns, ne) => {
                if (ns < changedFrom) changedFrom = ns;
                if (ne > changedTo) changedTo = ne;
              });

              // Step exposed no position range (e.g. AttrStep) — safest to
              // rebuild; this path doesn't fire on plain typing.
              if (changedFrom === Infinity) {
                return buildAllDecorations(newState.doc, hl, ext.name);
              }

              let next = old.map(tr.mapping, newState.doc);

              newState.doc.descendants((node, pos) => {
                if (node.type.name !== ext.name) return;
                const from = pos;
                const to = pos + node.nodeSize;
                if (changedTo <= from || changedFrom >= to) return false;
                const existing = next.find(from, to);
                if (existing.length) next = next.remove(existing);
                const decos = tokenizeNode(node, pos, hl);
                if (decos.length) next = next.add(newState.doc, decos);
                return false;
              });

              return next;
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
