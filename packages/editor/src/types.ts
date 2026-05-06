// editor.ts
import type { Editor, NodeViewProps } from "@tiptap/react";
import type {
  AnyEditorNode,
  MarkDefs,
  BlockAttrs,
  DocContent,
} from "@open-notion/serializers";
import type { DocToHTMLOpt } from "@open-notion/serializers/html";

// ── Inferred registries ───────────────────────────────────────────────

export type NodeName = AnyEditorNode["type"];
export type MarkName = keyof MarkDefs;
export type EntityName = NodeName | MarkName;

// ── Inferred attr maps ────────────────────────────────────────────────

export type NodeAttrs = {
  [T in AnyEditorNode as T["type"]]: T extends { attrs?: infer A }
    ? NonNullable<A>
    : Record<string, never>;
};

export type MarkAttrs = {
  [T in keyof MarkDefs]: MarkDefs[T] extends { attrs?: infer A }
    ? NonNullable<A>
    : Record<string, never>;
};

// ── Helpers ───────────────────────────────────────────────────────────

type AttrsFor<T extends EntityName> = T extends keyof NodeAttrs
  ? NodeAttrs[T]
  : T extends keyof MarkAttrs
    ? MarkAttrs[T]
    : never;

// ── Typed editor ──────────────────────────────────────────────────────

export type TypedEditor = Omit<
  Editor,
  | "isActive"
  | "getAttributes"
  | "getJSON"
  | "getHTML"
  | "getMarkdown"
  | "getText"
> & {
  isActive<T extends EntityName>(
    name: T,
    attrs?: Partial<AttrsFor<T>>,
  ): boolean;
  isActive(attrs: Partial<BlockAttrs>): boolean;
  getAttributes<T extends EntityName>(name: T): AttrsFor<T>;
  getJSON(): DocContent;
  getHTML: (params?: DocToHTMLOpt) => Promise<string>;
  getMarkdown: () => Promise<string>;
  getPDF: () => Promise<Blob>;
  getText: () => Promise<string>;
};

export type TypedNodeViewProps<T extends NodeName> = Omit<
  NodeViewProps,
  "node" | "updateAttributes"
> & {
  node: Omit<NodeViewProps["node"], "attrs"> & { attrs: NodeAttrs[T] };
  updateAttributes: (attrs: Partial<NodeAttrs[T]>) => void;
};
