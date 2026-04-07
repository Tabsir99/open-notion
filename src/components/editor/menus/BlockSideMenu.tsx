import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { Plus } from "lucide-react";
import { useActiveBlock } from "./useActiveBlock";
import { BlockContextMenu } from "./BlockContextMenu";
import { cn } from "@/lib/utils";
import "./block-side-menu.css";
import { Button } from "@/components/ui/button";

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

  const menuRef = useRef<HTMLDivElement>(null);
  const hasPositionedRef = useRef(false);

  const { activeBlock, clearHover } = useActiveBlock({
    editor,
    locked: menuOpen,
    menuRef,
    containerRef,
  });

  const visible =
    (activeBlock.isHovered || menuOpen) && activeBlock.element !== null;

  // Recalculate vertical position when the active block changes
  useEffect(() => {
    if (hasPositionedRef.current || !activeBlock.element) return;

    menuRef.current?.style.setProperty("transition", "opacity 150ms ease");
    hasPositionedRef.current = true;
    // Force reflow then restore transition next frame
    requestAnimationFrame(() => {
      menuRef.current?.style.removeProperty("transition");
    });
  }, [activeBlock.element]);

  const handlePlusClick = useCallback(() => {
    editor
      .chain()
      .focus()
      .setTextSelection(activeBlock.pos + 1)
      .insertContent("/")
      .run();
  }, [editor, activeBlock.pos]);

  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute top-0 left-[10px] z-10 flex items-center",
        "opacity-0 pointer-events-none transition-[transform,opacity] duration-200 ease-out",
        "data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto",
        "after:absolute after:top-0 after:-right-4 after:h-full after:w-4 after:pointer-events-auto after:content-['']",
        // "*:border-red-500 *:border *:rounded-none!",
      )}
      data-visible={visible}
      style={{ transform: `translateY(${activeBlock.translateY}px)` }}
      id="block-side-menu"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlusClick}
        aria-label="Add block"
      >
        <Plus className="size-4.5" />
      </Button>

      <BlockContextMenu
        editor={editor}
        blockPos={activeBlock.pos}
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          if (!open) clearHover();
        }}
      />
    </div>
  );
}
