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

/**
 * Returns true if the element belongs to the side menu or a Radix dropdown portal.
 * Prevents clearing hover state when cursor moves to these UI surfaces.
 */
function isMenuOrPortalElement(el: Element | null): boolean {
  if (!el) return false;
  return !!(
    (el as HTMLElement).closest?.("[data-block-side-menu]") ||
    (el as HTMLElement).closest?.("[data-radix-popper-content-wrapper]")
  );
}

/**
 * Tracks which top-level block is "active" via cursor position or mouse hover.
 *
 * - Hover always wins over cursor position.
 * - When `locked` is true (context menu open), all tracking freezes.
 */
export function useActiveBlock(editor: Editor | null, locked: boolean = false) {
  const [activeBlock, setActiveBlock] = useState<ActiveBlockInfo>(INIT_STATE);

  const hoveredBlockRef = useRef<HTMLElement | null>(null);

  const lockedRef = useRef(locked);
  lockedRef.current = locked;

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
    const wrapper = proseMirror.closest("[data-editor-wrapper]");
    const menuEl = wrapper?.querySelector("[data-block-side-menu]");

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
      if (isMenuOrPortalElement(e.relatedTarget as Element)) return;

      hoveredBlockRef.current = null;
      setActiveBlock((prev) => ({ ...prev, isHovered: false }));
    };

    proseMirror.addEventListener("mousemove", handleMouseMove);
    proseMirror.addEventListener("mouseleave", handleMouseLeave);
    menuEl?.addEventListener("mouseleave", handleMouseLeave as EventListener);

    return () => {
      proseMirror.removeEventListener("mousemove", handleMouseMove);
      proseMirror.removeEventListener("mouseleave", handleMouseLeave);
      menuEl?.removeEventListener(
        "mouseleave",
        handleMouseLeave as EventListener,
      );
    };
  }, [editor, getBlockFromHover, resolveBlockInfo]);

  useEffect(() => {
    console.log(activeBlock);
  }, [activeBlock]);

  return activeBlock;
}
