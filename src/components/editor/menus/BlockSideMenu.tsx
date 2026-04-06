import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { Plus } from "lucide-react";
import { useActiveBlock } from "./useActiveBlock";
import { BlockContextMenu } from "./BlockContextMenu";
import "./block-side-menu.css";

interface BlockSideMenuProps {
  editor: Editor;
  /** The editor wrapper element that contains both the menu and ProseMirror */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * The traveling block side menu — ONE instance that moves between blocks.
 * Shows a "+" button and a grip "⠿" handle to the left of the active block.
 */
export function BlockSideMenu({ editor, containerRef }: BlockSideMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Pass `menuOpen` as `locked` — when the dropdown is open, block tracking freezes (Task 4)
  const activeBlock = useActiveBlock(editor, menuOpen);

  const menuRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);

  // Capture the blockPos at the moment the menu opens, so operations
  // always target the correct block even if hover changes (Task 4 safety)
  const lockedBlockPosRef = useRef(activeBlock.pos);

  useEffect(() => {
    if (menuOpen) {
      // Lock the position when menu opens
      lockedBlockPosRef.current = activeBlock.pos;
    }
  }, [menuOpen, activeBlock.pos]);

  const effectiveBlockPos = menuOpen
    ? lockedBlockPosRef.current
    : activeBlock.pos;

  // Menu is visible ONLY when:
  // - A specific block is being hovered (Task 1), OR
  // - The context menu dropdown is open (Task 2/4)
  const visible =
    (activeBlock.isHovered || menuOpen) && activeBlock.element !== null;

  // Calculate the translateY position relative to the container
  useEffect(() => {
    console.log("Active elementc h anged:", activeBlock);
    if (!activeBlock.element || !containerRef.current) return;

    const container = containerRef.current;
    const blockRect = activeBlock.element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Position the menu vertically centered on the first line of the block.
    // We approximate the first line center as blockRect.top + ~14px (half of line-height).
    const firstLineCenter = blockRect.top - containerRect.top + 14;
    const menuHeight = menuRef.current?.offsetHeight ?? 28;

    setTranslateY(firstLineCenter - menuHeight / 2);
  }, [activeBlock.element, containerRef]);

  const handlePlusClick = useCallback(() => {
    // Will be wired to slash menu later
    console.log("open slash menu");

    // Focus the editor at the start of this block
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
      style={{
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Plus button — opens slash command menu */}
      <button
        className="block-side-menu-btn"
        onClick={handlePlusClick}
        aria-label="Add block"
      >
        <Plus className="size-4.5" />
      </button>

      {/* Grip handle — opens context menu or starts drag */}
      <BlockContextMenu
        editor={editor}
        blockPos={effectiveBlockPos}
        open={menuOpen}
        onOpenChange={setMenuOpen}
      />
    </div>
  );
}
