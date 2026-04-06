import { useEffect, useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/core";

export interface ActiveBlockInfo {
  /** The DOM element of the active top-level block */
  element: HTMLElement | null;
  /** The ProseMirror document position of the block start */
  pos: number;
  /** The node type name (paragraph, heading, etc.) */
  nodeType: string;
  /** Whether a block is currently hovered (vs just cursor-based) */
  isHovered: boolean;
}

const MENU_SELECTOR = "[data-block-side-menu]";
/** Matches Radix portal content (dropdown menu body, submenus) */
const RADIX_CONTENT_SELECTOR = "[data-radix-popper-content-wrapper]";

/**
 * Checks whether a DOM element is the side menu, a child of it,
 * or part of a Radix dropdown portal (the dropdown body).
 */
function isMenuOrPortalElement(el: Element | null): boolean {
  if (!el) return false;
  const asHtml = el as HTMLElement;
  // Check if element is inside the side menu buttons
  if (asHtml.closest?.(MENU_SELECTOR)) return true;
  // Check if element is inside a Radix portal (dropdown body)
  if (asHtml.closest?.(RADIX_CONTENT_SELECTOR)) return true;
  return false;
}

/**
 * Tracks which top-level block is "active" — either via cursor position
 * or mouse hover — and returns its DOM element for menu positioning.
 *
 * Priority: hoveredBlock ALWAYS wins over cursor block.
 * Cursor block is only used as fallback when nothing is hovered.
 *
 * When `locked` is true, all block tracking (hover + selection) is frozen.
 * This is used when the context menu is open to prevent the menu from moving.
 */
export function useActiveBlock(editor: Editor | null, locked: boolean = false) {
  const [activeBlock, setActiveBlock] = useState<ActiveBlockInfo>({
    element: null,
    pos: 0,
    nodeType: "",
    isHovered: false,
  });

  const hoveredBlockRef = useRef<HTMLElement | null>(null);
  const isHoveringRef = useRef(false);
  const lockedRef = useRef(locked);

  // Keep the ref in sync with the prop
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  /**
   * Given a ProseMirror resolved position depth, gets the top-level
   * block element and its position.
   */
  const getBlockFromSelection = useCallback((): Omit<ActiveBlockInfo, "isHovered"> | null => {
    if (!editor) return null;

    const { $from } = editor.state.selection;

    // Depth 0 = doc, depth 1 = top-level block
    if ($from.depth < 1) return null;

    const pos = $from.before(1);
    const node = $from.node(1);
    const domNode = editor.view.nodeDOM(pos);

    if (domNode instanceof HTMLElement) {
      return {
        element: domNode,
        pos,
        nodeType: node.type.name,
      };
    }

    return null;
  }, [editor]);

  /**
   * Finds the top-level block element from a hovered DOM element
   * by walking up the DOM tree to find a direct child of .ProseMirror.
   */
  const getBlockFromHover = useCallback(
    (target: HTMLElement): HTMLElement | null => {
      if (!editor) return null;

      const proseMirrorEl = editor.view.dom;
      let current: HTMLElement | null = target;

      // Walk up until we find a direct child of the ProseMirror container
      while (current && current.parentElement !== proseMirrorEl) {
        current = current.parentElement;
      }

      // current is now a direct child of .ProseMirror (a top-level block)
      if (current && current.parentElement === proseMirrorEl) {
        return current;
      }

      return null;
    },
    [editor]
  );

  /**
   * Convert a block DOM element to ActiveBlockInfo with position data.
   */
  const resolveBlockInfo = useCallback(
    (blockEl: HTMLElement): Omit<ActiveBlockInfo, "isHovered"> | null => {
      if (!editor) return null;
      try {
        const pos = editor.view.posAtDOM(blockEl, 0);
        const resolved = editor.state.doc.resolve(pos);
        const blockPos = resolved.depth >= 1 ? resolved.before(1) : pos;
        const node = resolved.depth >= 1 ? resolved.node(1) : null;
        return {
          element: blockEl,
          pos: blockPos,
          nodeType: node?.type.name ?? "",
        };
      } catch {
        return null;
      }
    },
    [editor]
  );

  // Listen to selection changes (cursor movement, typing, arrow keys)
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      // Don't update if locked (menu open) or if hovering
      if (lockedRef.current || isHoveringRef.current) return;

      const block = getBlockFromSelection();
      if (block) {
        setActiveBlock({ ...block, isHovered: false });
      }
    };

    const handleUpdate = () => {
      if (lockedRef.current || isHoveringRef.current) return;

      const block = getBlockFromSelection();
      if (block) {
        setActiveBlock({ ...block, isHovered: false });
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("update", handleUpdate);

    // Initial position
    handleSelectionUpdate();

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("update", handleUpdate);
    };
  }, [editor, getBlockFromSelection]);

  // Listen to mouse hover on the editor
  useEffect(() => {
    if (!editor) return;

    const proseMirrorEl = editor.view.dom;

    const handleMouseMove = (e: MouseEvent) => {
      // Don't update if locked (menu open)
      if (lockedRef.current) return;

      const target = e.target as HTMLElement;
      const blockEl = getBlockFromHover(target);

      if (blockEl && blockEl !== hoveredBlockRef.current) {
        hoveredBlockRef.current = blockEl;
        isHoveringRef.current = true;

        const info = resolveBlockInfo(blockEl);
        if (info) {
          setActiveBlock({ ...info, isHovered: true });
        }
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // Don't update if locked (menu open)
      if (lockedRef.current) return;

      const relatedTarget = e.relatedTarget as Element | null;

      // If mouse moved to the side menu or a Radix portal, keep hover state
      if (isMenuOrPortalElement(relatedTarget)) {
        return;
      }

      // Mouse left the editor to somewhere else — clear hover but
      // DON'T snap to cursor block. Just mark as not hovered.
      // The menu will fade out via visibility logic in BlockSideMenu.
      hoveredBlockRef.current = null;
      isHoveringRef.current = false;

      // Keep the current block position (don't fall back to cursor block).
      // Just update isHovered to false so visibility can hide the menu.
      setActiveBlock((prev) => ({ ...prev, isHovered: false }));
    };

    proseMirrorEl.addEventListener("mousemove", handleMouseMove);
    proseMirrorEl.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      proseMirrorEl.removeEventListener("mousemove", handleMouseMove);
      proseMirrorEl.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [editor, getBlockFromHover, resolveBlockInfo]);

  // Handle mouseleave on the side menu element itself
  useEffect(() => {
    if (!editor) return;

    const proseMirrorEl = editor.view.dom;

    const handleMenuMouseLeave = (e: MouseEvent) => {
      // Don't update if locked (menu open)
      if (lockedRef.current) return;

      const relatedTarget = e.relatedTarget as HTMLElement | null;

      // If mouse went to a Radix portal (dropdown body), keep hover state
      if (isMenuOrPortalElement(relatedTarget)) {
        return;
      }

      if (!relatedTarget) {
        // Mouse left the window entirely — keep position, just clear hover
        hoveredBlockRef.current = null;
        isHoveringRef.current = false;
        setActiveBlock((prev) => ({ ...prev, isHovered: false }));
        return;
      }

      // If mouse moved to a block inside ProseMirror, update to that block
      const blockEl = getBlockFromHover(relatedTarget);
      if (blockEl) {
        hoveredBlockRef.current = blockEl;
        isHoveringRef.current = true;

        const info = resolveBlockInfo(blockEl);
        if (info) {
          setActiveBlock({ ...info, isHovered: true });
        }
        return;
      }

      // Mouse left to somewhere else (not a block, not menu) — clear hover
      hoveredBlockRef.current = null;
      isHoveringRef.current = false;
      setActiveBlock((prev) => ({ ...prev, isHovered: false }));
    };

    // Find the menu element to attach the listener
    const wrapper = proseMirrorEl.closest("[data-editor-wrapper]");
    const menuEl = wrapper?.querySelector(MENU_SELECTOR);

    if (menuEl) {
      menuEl.addEventListener("mouseleave", handleMenuMouseLeave as EventListener);
    }

    // Retry after a short delay in case menu isn't in the DOM yet
    let delayedMenuEl: Element | null = null;
    const timer = setTimeout(() => {
      delayedMenuEl = wrapper?.querySelector(MENU_SELECTOR) ?? null;
      if (delayedMenuEl && delayedMenuEl !== menuEl) {
        delayedMenuEl.addEventListener("mouseleave", handleMenuMouseLeave as EventListener);
      }
    }, 100);

    return () => {
      if (menuEl) {
        menuEl.removeEventListener("mouseleave", handleMenuMouseLeave as EventListener);
      }
      if (delayedMenuEl && delayedMenuEl !== menuEl) {
        delayedMenuEl.removeEventListener("mouseleave", handleMenuMouseLeave as EventListener);
      }
      clearTimeout(timer);
    };
  }, [editor, getBlockFromHover, resolveBlockInfo]);

  return activeBlock;
}
