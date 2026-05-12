import CodeBlock from "@tiptap/extension-code-block";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

import { extendNode, lazyNodeView } from "../lib/createNode";
import { getRuntime } from "../runtime";
import type { WorkerReqBody, WorkerResBody } from "./shikiWorker";

interface ResultMeta {
  kind: "result";
  pos: number;
  to: number;
  decos: Decoration[];
}

export const shikiPluginKey = new PluginKey<DecorationSet>("shikiHighlight");

export const CustomCodeBlock = extendNode<"codeBlock">(
  CodeBlock.configure({
    defaultLanguage: "javascript",
  }),
  {
    NodeView: lazyNodeView(() =>
      import("../blocks/CodeBlock").then((m) => ({ default: m.CodeBlockView })),
    ),

    addProseMirrorPlugins() {
      const ext = this;

      return [
        ...(this.parent?.() ?? []),
        new Plugin<DecorationSet>({
          key: shikiPluginKey,
          state: {
            init: () => DecorationSet.empty,
            apply(tr, old, _, newState) {
              const meta = tr.getMeta(shikiPluginKey) as ResultMeta | undefined;
              if (meta?.kind === "result") {
                let next = old;
                const existing = next.find(meta.pos, meta.to);
                if (existing.length) next = next.remove(existing);
                if (meta.decos.length)
                  next = next.add(newState.doc, meta.decos);
                return next;
              }
              if (!tr.docChanged) return old;
              // Map positions through the change. Colors visually stay put
              // (just shifted with text) until the worker round-trips fresh
              // tokens.
              return old.map(tr.mapping, newState.doc);
            },
          },
          view(editorView) {
            // Worker is per-view, not per-plugin. ProseMirror may create
            // multiple plugin-view instances for the same plugin spec over
            // an editor's lifetime; a worker captured in the outer closure
            // would get terminated by the first destroy() and break the
            // remaining views.
            const worker = new Worker(
              new URL("./shikiWorker.ts", import.meta.url),
              { type: "module" },
            );
            // Tokenized content keyed by node identity. ProseMirror nodes
            // are immutable — a content change yields a new Node, so this
            // WeakMap is a built-in "is this content still the same?" check.
            const lastSent = new WeakMap<ProseMirrorNode, string>();

            const send = (pos: number, node: ProseMirrorNode) => {
              lastSent.set(node, node.textContent);
              worker.postMessage({
                pos,
                code: node.textContent,
                lang: node.attrs.language || "plaintext",
                engine: getRuntime(ext.editor).get().highlightEngine,
              } satisfies WorkerReqBody);
            };

            const walkAndSend = (doc: ProseMirrorNode) => {
              doc.descendants((node, pos) => {
                if (node.type.name !== ext.name) return;
                if (lastSent.get(node) === node.textContent) return false;
                send(pos, node);
                return false;
              });
            };

            const onMessage = (e: MessageEvent<WorkerResBody>) => {
              const { pos, decos: workerDecos } = e.data;
              if (editorView.isDestroyed) return;
              const node = editorView.state.doc.nodeAt(pos);
              if (!node || node.type.name !== ext.name) return;

              const decos = workerDecos.map((d) =>
                Decoration.inline(pos + d.from, pos + d.to, { style: d.style }),
              );
              editorView.dispatch(
                editorView.state.tr.setMeta(shikiPluginKey, {
                  kind: "result",
                  pos,
                  to: pos + node.nodeSize,
                  decos,
                } satisfies ResultMeta),
              );
            };
            worker.addEventListener("message", onMessage);

            let lastDoc = editorView.state.doc;
            walkAndSend(lastDoc);

            return {
              update(view) {
                if (view.state.doc === lastDoc) return;
                lastDoc = view.state.doc;
                walkAndSend(view.state.doc);
              },
              destroy() {
                worker.removeEventListener("message", onMessage);
                worker.terminate();
              },
            };
          },
          props: {
            decorations(state) {
              return shikiPluginKey.getState(state);
            },
          },
        }),
      ];
    },
  },
);
