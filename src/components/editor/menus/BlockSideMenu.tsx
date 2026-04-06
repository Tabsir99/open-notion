import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { Plus } from "lucide-react";
import { useActiveBlock } from "./useActiveBlock";
import { BlockContextMenu } from "./BlockContextMenu";
import "./block-side-menu.css";

interface BlockSideMenuProps {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Traveling block side menu — a single instance that repositions
 * next to the active block. Shows "+" and grip "⠿" buttons.
 */
export function BlockSideMenu({ editor, containerRef }: BlockSideMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeBlock = useActiveBlock(editor, menuOpen);

  const menuRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);

  // Capture blockPos once when the menu transitions from closed → open
  const lockedBlockPosRef = useRef(activeBlock.pos);
  const prevMenuOpenRef = useRef(false);
  if (menuOpen && !prevMenuOpenRef.current) {
    lockedBlockPosRef.current = activeBlock.pos;
  }
  prevMenuOpenRef.current = menuOpen;

  const effectiveBlockPos = menuOpen
    ? lockedBlockPosRef.current
    : activeBlock.pos;

  const visible =
    (activeBlock.isHovered || menuOpen) && activeBlock.element !== null;

  // Recalculate vertical position when the active block changes
  useEffect(() => {
    if (!activeBlock.element || !containerRef.current) return;

    const container = containerRef.current;
    const blockRect = activeBlock.element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const lineHeight = parseFloat(
      window.getComputedStyle(activeBlock.element).lineHeight,
    );
    const firstLineCenter =
      blockRect.top - containerRect.top + container.scrollTop + lineHeight / 2;
    const menuHeight = menuRef.current?.offsetHeight ?? 28;

    setTranslateY(firstLineCenter - menuHeight / 2);
  }, [activeBlock.element, containerRef]);

  const handlePlusClick = useCallback(() => {
    // Will be wired to slash menu in Phase 4
    editor
      .chain()
      .focus()
      .setTextSelection(activeBlock.pos + 1)
      .run();
  }, [editor, activeBlock.pos]);

  return (
    <div
      ref={menuRef}
      className="block-side-menu"
      data-block-side-menu
      data-visible={visible}
      style={{ transform: `translateY(${translateY}px)` }}
    >
      <button
        className="block-side-menu-btn"
        onClick={handlePlusClick}
        aria-label="Add block"
      >
        <Plus className="size-4.5" />
      </button>

      <BlockContextMenu
        editor={editor}
        blockPos={effectiveBlockPos}
        open={menuOpen}
        onOpenChange={setMenuOpen}
      />
    </div>
  );
}
