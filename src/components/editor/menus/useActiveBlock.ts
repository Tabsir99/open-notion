import { useEffect, useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/core";

export interface ActiveBlockInfo {
  element: HTMLElement | null;
  pos: number;
  nodeType: string;
  isHovered: boolean;
  translateY: number;
}

export type ActiveBlock = Omit<ActiveBlockInfo, "isHovered">;

const INIT_STATE: ActiveBlockInfo = {
  element: null,
  pos: 0,
  nodeType: "",
  isHovered: false,
  translateY: 0,
};

const computeTranslateY = (
  blockEl: HTMLElement,
  container: HTMLElement,
  menu: HTMLElement,
): number => {
  const blockRect = blockEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const menuHeight = menu.offsetHeight;

  const style = window.getComputedStyle(blockEl);
  const lineHeight = parseFloat(style.lineHeight) || 24;

  const blockHeight = blockEl.offsetHeight;
  const firstLineCenter =
    blockHeight < menuHeight
      ? blockHeight / 2
      : Math.min(lineHeight, menuHeight) / 2;

  return blockRect.top - containerRect.top + firstLineCenter - menuHeight / 2;
};

interface UseActiveBlockOptions {
  editor: Editor | null;
  locked?: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}
/**
 * Tracks which top-level block is "active" via cursor position or mouse hover.
 *
 * - Hover always wins over cursor position.
 * - When `locked` is true (context menu open), all tracking freezes.
 */
export function useActiveBlock(params: UseActiveBlockOptions) {
  const { editor, locked = false, menuRef, containerRef } = params;
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
      if (!editor) throw new Error("Editor not initialized");
      try {
        const pos = editor.view.posAtDOM(blockEl, 0);
        const resolved = editor.state.doc.resolve(pos);

        let blockPos = pos;
        let nodeType = "";

        if (resolved.depth >= 1) {
          blockPos = resolved.before(1);
          nodeType = resolved.node(1).type.name;
        } else {
          const node = editor.state.doc.nodeAt(pos);
          if (!node) throw new Error("Node not found");
          nodeType = node.type.name;
        }

        return {
          element: blockEl,
          pos: blockPos,
          nodeType,
          translateY: computeTranslateY(
            blockEl,
            containerRef.current!,
            menuRef.current!,
          ),
        };
      } catch {
        return null;
      }
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    const proseMirror = editor.view.dom;
    const menu = menuRef.current;

    const handlePointerMove = (e: MouseEvent) => {
      if (lockedRef.current) return;

      const blockEl = getBlockFromHover(e.target as HTMLElement);
      if (!blockEl || blockEl === hoveredBlockRef.current) return;
      hoveredBlockRef.current = blockEl;
      const info = resolveBlockInfo(blockEl);
      if (info) setActiveBlock({ ...info, isHovered: true });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (lockedRef.current) return;
      if (menuRef.current?.contains(e.relatedTarget as Node)) return;
      clearHover();
    };

    proseMirror.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    proseMirror.addEventListener("mouseleave", handleMouseLeave);
    menu?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      proseMirror.removeEventListener("pointermove", handlePointerMove);
      proseMirror.removeEventListener("mouseleave", handleMouseLeave);
      menu?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [editor]);

  return { activeBlock, clearHover, setActiveBlock };
}
