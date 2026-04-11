import { useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/core";

export interface ActiveBlock {
  element: HTMLElement | null;
  pos: number;
  nodeType: string;
}

interface Options {
  editor: Editor | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
}

const computeTop = (
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

export function useActiveBlock({
  editor,
  menuRef,
  containerRef,
  open,
}: Options) {
  const activeRef = useRef<ActiveBlock>({
    element: null,
    pos: 0,
    nodeType: "",
  });
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const hasPositionedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  const getBlockFromEl = useCallback(
    (target: HTMLElement | null): HTMLElement | null => {
      if (!editor || !target) return null;
      const pm = editor.view.dom;
      let el: HTMLElement | null = target;
      while (el && el.parentElement !== pm) el = el.parentElement;
      return el?.parentElement === pm ? el : null;
    },
    [editor],
  );

  const getBlockByY = useCallback(
    (y: number): HTMLElement | null => {
      if (!editor) return null;
      const pm = editor.view.dom;
      const children = Array.from(pm.children) as HTMLElement[];
      for (const child of children) {
        const rect = child.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) return child;
      }
      return null;
    },
    [editor],
  );

  const resolveBlockInfo = useCallback(
    (blockEl: HTMLElement): ActiveBlock | null => {
      if (!editor) return null;
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
          if (!node) return null;
          nodeType = node.type.name;
        }
        return { element: blockEl, pos: blockPos, nodeType };
      } catch {
        return null;
      }
    },
    [editor],
  );

  const applyActive = useCallback(
    (block: ActiveBlock) => {
      const menu = menuRef.current;
      const container = containerRef.current;
      if (!menu || !container || !block.element) return;

      activeRef.current = block;
      const top = computeTop(block.element, container, menu);

      if (!hasPositionedRef.current) {
        // First show: snap without transition
        menu.style.transition = "opacity 200ms ease-out";
        menu.style.top = `${top}px`;
        hasPositionedRef.current = true;
        requestAnimationFrame(() => {
          menu.style.removeProperty("transition");
        });
      } else {
        menu.style.top = `${top}px`;
      }
      menu.dataset.visible = "true";
    },
    [menuRef, containerRef],
  );

  const clearActive = useCallback(() => {
    const menu = menuRef.current;
    if (!menu) return;
    hoveredElRef.current = null;
    menu.dataset.visible = "false";
  }, [menuRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || open || !editor) return;

    const processMove = (target: HTMLElement | null, clientY: number) => {
      let blockEl = getBlockFromEl(target);
      if (!blockEl) blockEl = getBlockByY(clientY);
      if (!blockEl || blockEl === hoveredElRef.current) return;
      hoveredElRef.current = blockEl;
      const info = resolveBlockInfo(blockEl);
      if (info) applyActive(info);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (debounceRef.current != null) clearTimeout(debounceRef.current);
      const target = e.target as HTMLElement;
      const clientY = e.clientY;
      debounceRef.current = window.setTimeout(() => {
        processMove(target, clientY);
      }, 0);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.relatedTarget as Node)) return;
      if (container.contains(e.relatedTarget as Node)) return;
      clearActive();
    };

    container.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (debounceRef.current != null) clearTimeout(debounceRef.current);
    };
  }, [
    editor,
    getBlockFromEl,
    getBlockByY,
    resolveBlockInfo,
    applyActive,
    clearActive,
    containerRef,
    menuRef,
    open,
  ]);

  return { activeRef, clearActive };
}
