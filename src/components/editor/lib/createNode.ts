import { Node, type NodeConfig } from "@tiptap/core";
import type { ComponentType } from "react";
import type { NodeAttrs, NodeName, TypedNodeViewProps } from "../types";
import type { BlockAttrs } from "../jsonContent";
import { ReactNodeViewRenderer } from "@tiptap/react";

type OwnAttrs<T extends NodeName> = Omit<NodeAttrs[T], keyof BlockAttrs>;

type TypedNodeConfig<T extends NodeName, Options = any, Storage = any> = Omit<
  NodeConfig<Options, Storage>,
  "addAttributes" | "parseHTML" | "renderHTML" | "addNodeView"
> &
  ThisType<{ options: Options; name: string; storage: Storage }> & {
    name: T;
    group?: string;
    content?: string;

    addAttributes?: () => {
      [K in keyof OwnAttrs<T>]-?: {
        default: OwnAttrs<T>[K] | null;
        parseHTML?: (el: HTMLElement) => OwnAttrs<T>[K] | null;
        renderHTML?: (attrs: OwnAttrs<T>) => Record<string, string>;
      };
    };

    parseHTML?: () => {
      tag: string;
      getAttrs?: (el: HTMLElement) => OwnAttrs<T> | false;
    }[];

    renderHTML?: (props: {
      node: { attrs: NodeAttrs[T] };
      HTMLAttributes: Record<string, string>;
    }) => unknown;

    NodeView?: ComponentType<TypedNodeViewProps<T>>;
  };

export function createNode<T extends NodeName, Options = any, Storage = any>(
  config: TypedNodeConfig<T, Options, Storage>,
): Node<Options, Storage> {
  const { NodeView, ...rest } = config;

  return Node.create<Options, Storage>({
    ...rest,
    ...(NodeView && {
      addNodeView() {
        return ReactNodeViewRenderer(NodeView as ComponentType<any>);
      },
    }),
  } as unknown as NodeConfig<Options, Storage>);
}

type TypedExtendConfig<T extends NodeName> = Omit<
  TypedNodeConfig<T>,
  "name" | "addAttributes"
> & {
  addAttributes?: (parent: () => Record<string, unknown>) => {
    [K in keyof OwnAttrs<T>]-?: {
      default: OwnAttrs<T>[K] | null;
      parseHTML?: (el: HTMLElement) => OwnAttrs<T>[K] | null;
      renderHTML?: (attrs: OwnAttrs<T>) => Record<string, string>;
    };
  };
};

export function extendNode<T extends NodeName>(
  base: Node,
  config: TypedExtendConfig<T>,
): ReturnType<typeof Node.create> {
  const { NodeView, addAttributes, ...rest } = config;

  return base.extend({
    ...rest,
    ...(addAttributes && {
      addAttributes() {
        return addAttributes((this as any).parent?.bind(this) ?? (() => ({})));
      },
    }),
    ...(NodeView && {
      addNodeView() {
        return ReactNodeViewRenderer(NodeView as ComponentType<any>);
      },
    }),
  } as unknown as NodeConfig);
}
