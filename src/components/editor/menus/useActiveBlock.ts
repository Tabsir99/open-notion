import { useEffect, useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/core";

export interface ActiveBlockInfo {
  element: HTMLElement | null;
  pos: number;
  nodeType: string;
  isHovered: boolean;
}

export type ActiveBlock = Omit<ActiveBlockInfo, "isHovered">;

const INIT_STATE: ActiveBlockInfo = {
  element: null,
  pos: 0,
  nodeType: "",
  isHovered: false,
};

interface UseActiveBlockOptions {
  editor: Editor | null;
  locked?: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
}
/**
 * Tracks which top-level block is "active" via cursor position or mouse hover.
 *
 * - Hover always wins over cursor position.
 * - When `locked` is true (context menu open), all tracking freezes.
 */
export function useActiveBlock(params: UseActiveBlockOptions) {
  const { editor, locked = false, menuRef } = params;
  const [activeBlock, setActiveBlock] = useState<ActiveBlockInfo>(INIT_STATE);

  const hoveredBlockRef = useRef<HTMLElement | null>(null);

  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const clearHover = useCallback(() => {
    hoveredBlockRef.current = null;
    setActiveBlock((prev) => ({ ...prev, isHovered: false }));
  }, []);

  /** Walks up from `target` to find the direct child of .ProseMirror (top-level block). */
  const getBlockFromHover = useCallback(
    (target: HTMLElement): HTMLElement | null => {
      if (!editor) return null;
      const proseMirror = editor.view.dom;
      let el: HTMLElement | null = target;

      while (el && el.parentElement !== proseMirror) {
        el = el.parentElement;
      }
      return el?.parentElement === proseMirror ? el : null;
    },
    [editor],
  );

  /** Converts a block DOM element to position info via posAtDOM → resolve. */
  const resolveBlockInfo = useCallback(
    (blockEl: HTMLElement): ActiveBlock | null => {
      if (!editor) return null;
      try {
        const pos = editor.view.posAtDOM(blockEl, 0);
        const resolved = editor.state.doc.resolve(pos);
        return {
          element: blockEl,
          pos: resolved.before(1),
          nodeType: resolved.node(1).type.name,
        };
      } catch {
        return null;
      }
    },
    [editor],
  );

  // Hover tracking (mousemove + mouseleave on ProseMirror + menu)
  useEffect(() => {
    if (!editor) return;

    const proseMirror = editor.view.dom;

    const handleMouseMove = (e: MouseEvent) => {
      if (lockedRef.current) return;

      const blockEl = getBlockFromHover(e.target as HTMLElement);
      if (!blockEl || blockEl === hoveredBlockRef.current) return;

      hoveredBlockRef.current = blockEl;
      const info = resolveBlockInfo(blockEl);
      if (info) setActiveBlock({ ...info, isHovered: true });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (lockedRef.current) return;
      // if the mouse is hovering over the menu it self don't make isHovered false
      if (menuRef.current?.contains(e.relatedTarget as Node)) return;

      clearHover();
    };

    proseMirror.addEventListener("mousemove", handleMouseMove);
    proseMirror.addEventListener("mouseleave", handleMouseLeave);
    menuRef.current?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      proseMirror.removeEventListener("mousemove", handleMouseMove);
      proseMirror.removeEventListener("mouseleave", handleMouseLeave);
      menuRef.current?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [editor, getBlockFromHover, resolveBlockInfo]);

  return { activeBlock, clearHover };
}
