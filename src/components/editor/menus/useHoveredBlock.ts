import { useEffect, useRef, useCallback } from "react";
import { editorStore, type NodeBlock } from "../store";

interface Options {
  menuRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
}

const computeTop = (blockEl: HTMLElement, menu: HTMLElement): number => {
  const blockRect = blockEl.getBoundingClientRect();
  const containerRect = editorStore
    .get()
    .editorContainer?.getBoundingClientRect();
  if (!containerRect) return 0;

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

export function useHoveredBlock({ menuRef, open }: Options) {
  const hasPositionedRef = useRef(false);

  const getBlockFromEl = useCallback(
    (target: HTMLElement | null): HTMLElement | null => {
      const { editor } = editorStore.get();
      if (!editor || !target) return null;
      const pm = editor.view.dom;
      let el: HTMLElement | null = target;
      while (el && el.parentElement !== pm) el = el.parentElement;
      return el?.parentElement === pm ? el : null;
    },
    [],
  );

  const resolveBlockInfo = useCallback(
    (blockEl: HTMLElement): NodeBlock | null => {
      const { editor } = editorStore.get();
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
    [],
  );

  const applyActive = useCallback(
    (block: NodeBlock) => {
      const menu = menuRef.current;
      if (!menu || !block.element) return;

      editorStore.set({ hoveredBlock: block });
      const top = computeTop(block.element, menu);

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
    [menuRef],
  );

  const clearActive = useCallback(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const hoveringMenu = menu.matches(":hover");
    const hoveringBlock = editorStore
      .get()
      .hoveredBlock?.element.matches(":hover");

    if (hoveringMenu || hoveringBlock) return;

    menu.dataset.visible = "false";
    editorStore.set({ hoveredBlock: null });
  }, [menuRef]);

  useEffect(() => {
    const editorDom = editorStore.get().editor?.view.dom;
    if (!editorDom || open) return;

    const handlePointerOver = (e: PointerEvent) => {
      setTimeout(() => {
        const blockEl = getBlockFromEl(e.target as HTMLElement);
        if (!blockEl) return;

        const info = resolveBlockInfo(blockEl);
        if (info) applyActive(info);
      }, 0);
    };

    editorDom.addEventListener("pointerover", handlePointerOver, {
      passive: true,
    });
    editorDom.addEventListener("mouseleave", clearActive);
    menuRef.current?.addEventListener("mouseleave", clearActive);

    return () => {
      editorDom.removeEventListener("pointerover", handlePointerOver);
      editorDom.removeEventListener("mouseleave", clearActive);
      menuRef.current?.removeEventListener("mouseleave", clearActive);
    };
  }, [
    getBlockFromEl,
    resolveBlockInfo,
    applyActive,
    clearActive,
    menuRef,
    open,
  ]);

  return { clearActive };
}
