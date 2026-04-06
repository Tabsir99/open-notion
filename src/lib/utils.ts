import type { ActiveBlock } from "@/components/editor/menus/useActiveBlock";
import type { Editor } from "@tiptap/core";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resolves the top-level block from the current cursor/selection. */
export const getBlockFromSelection = (editor: Editor): ActiveBlock | null => {
  if (!editor) return null;
  const { $from } = editor.state.selection;
  if ($from.depth < 1) return null;

  const pos = $from.before(1);
  const domNode = editor.view.nodeDOM(pos);

  return domNode instanceof HTMLElement
    ? { element: domNode, pos, nodeType: $from.node(1).type.name }
    : null;
};
