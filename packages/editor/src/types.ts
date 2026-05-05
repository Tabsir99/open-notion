// editor.ts
import type { Editor, NodeViewProps } from "@tiptap/react";
import type {
  AnyEditorNode,
  MarkDefs,
  BlockAttrs,
  DocContent,
  docToHTML,
} from "@open-notion/serializers";

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
  getHTML: (params?: Parameters<typeof docToHTML>["1"]) => Promise<string>;
  getMarkdown: () => Promise<string>;
  getPDF: (filename?: string, download?: boolean) => Promise<Blob>;
  getText: () => Promise<string>;
};

export type TypedNodeViewProps<T extends NodeName> = Omit<
  NodeViewProps,
  "node" | "updateAttributes"
> & {
  node: Omit<NodeViewProps["node"], "attrs"> & { attrs: NodeAttrs[T] };
  updateAttributes: (attrs: Partial<NodeAttrs[T]>) => void;
};
