import { Node, type NodeConfig } from "@tiptap/core";
import { lazy, Suspense, createElement, type ComponentType } from "react";
import type { NodeAttrs, NodeName, TypedNodeViewProps } from "../types";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { BlockAttrs } from "@open-notion/serializers";

/**
 * Wraps `ReactNodeViewRenderer` to suppress two independent per-transaction
 * code paths in `@tiptap/react@3.22.5` that each fire `renderer.updateProps`
 * for every NodeView whose position shifted. With ~200+ NodeViews in a doc
 * the duplicated work is O(N) per keystroke and produces unusable input lag.
 * Our NodeViews don't read `getPos`, `selected`, decorations, or
 * innerDecorations from props, so all of it is pure overhead.
 *
 * ─── Path B: `ReactNodeView.update()` default branch (index.js:1000-1013).
 * PM calls `update(node, decorations, innerDecorations)` on every NodeView
 * whose desc didn't match-equal in PM's reconciler. Tiptap's default branch
 * then unconditionally calls `rerenderComponent` on a position shift.
 * Killed via the `update` option below: identity-equal node + reference-
 * equal decorations → return `true` without invoking the `updateProps()`
 * callback. Real content/attr/decoration changes fall through to
 * `updateProps()`, so emoji picker, code-block language switch, image
 * resize, etc. still propagate to React.
 *
 * ─── Path A: `positionCheckCallback`, registered with
 * `schedulePositionCheck` in the editor's `update`-event registry. The
 * natural counter is `cancelPositionCheck(editor, callback)`, but the
 * callback reference is *unreachable* due to a class-field-initialization-
 * after-super bug in Tiptap:
 *
 *     class ReactNodeView extends NodeView {
 *       constructor(...) {
 *         super(...);                         // base calls this.mount() inside,
 *                                             //   mount() assigns this.positionCheckCallback = closure
 *                                             //   and runs schedulePositionCheck(editor, closure)
 *         this.positionCheckCallback = null;  // class-field initializer fires
 *                                             //   AFTER super returns and resets the field
 *       }
 *     }
 *
 * After construction `nv.positionCheckCallback === null`, but the closure
 * is still inside the per-editor registry. Tiptap's own `destroy()` at
 * index.js:1045-1052 hits the same `if (this.positionCheckCallback)` check
 * and also leaks the closure for the editor's lifetime.
 *
 * We work around it by patching `nv.renderer.updateProps` on each NodeView
 * instance after construction. The leaked closure only ever calls it with
 * `{ getPos: () => ... }` — a single-key payload. Every legitimate caller
 * passes multiple keys (Path B's `updateProps()` callback for real changes)
 * or `{ selected: ... }` (PM's selectNode/deselectNode), both of which pass
 * through unchanged.
 *
 * `handleSelectionUpdate` (the `selectionUpdate` listener) does NOT have
 * the class-field bug — it's a prototype method bound inside mount() with
 * no shadowing field declaration — so we cancel it normally via
 * `editor.off`.
 */
function reactNodeViewLite(component: ComponentType<any>) {
  const inner = ReactNodeViewRenderer(component, {
    update: ({
      oldNode,
      newNode,
      oldDecorations,
      newDecorations,
      oldInnerDecorations,
      innerDecorations,
      updateProps,
    }) => {
      if (oldNode.type !== newNode.type) return false;
      if (
        oldNode === newNode &&
        oldDecorations === newDecorations &&
        oldInnerDecorations === innerDecorations
      ) {
        return true;
      }
      updateProps();
      return true;
    },
  });

  return (props: any) => {
    const nodeView = inner(props);

    // Path A workaround. The leaked positionCheckCallback (see banner)
    // calls `nv.renderer.updateProps({ getPos })` per transaction for any
    // NodeView whose position shifted. Filter that one shape out — every
    // legitimate updateProps call passes multiple keys or `{ selected }`.
    const renderer = (
      nodeView as {
        renderer?: { updateProps: (p: Record<string, unknown>) => void };
      }
    ).renderer;
    if (renderer && typeof renderer.updateProps === "function") {
      const original = renderer.updateProps.bind(renderer);
      renderer.updateProps = (next: Record<string, unknown> = {}) => {
        const keys = Object.keys(next);
        if (keys.length === 1 && keys[0] === "getPos") return;
        original(next);
      };
    }

    const nv = nodeView as { handleSelectionUpdate?: () => void };
    if (nv.handleSelectionUpdate) {
      props.editor.off("selectionUpdate", nv.handleSelectionUpdate);
    }

    return nodeView;
  };
}

/**
 * Wrap a NodeView component loader so the heavy UI ships in a lazy chunk.
 * The wrapper renders nothing until ProseMirror first mounts a node of the
 * matching type — so docs without that block pay zero (no chunk fetch).
 *
 * Returns `ComponentType<any>` — the loader is responsible for providing a
 * correctly-typed default export. Call-site assignment to a specific
 * `NodeView: ComponentType<TypedNodeViewProps<...>>` remains type-safe.
 */
export function lazyNodeView(
  loader: () => Promise<{ default: ComponentType<any> }>,
): ComponentType<any> {
  const Lazy = lazy(loader);
  const Wrapped: ComponentType<any> = (props) =>
    createElement(Suspense, { fallback: null }, createElement(Lazy, props));
  Wrapped.displayName = "LazyNodeView";
  return Wrapped;
}

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
        return reactNodeViewLite(NodeView as ComponentType<any>);
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
        return reactNodeViewLite(NodeView as ComponentType<any>);
      },
    }),
  } as unknown as NodeConfig);
}
