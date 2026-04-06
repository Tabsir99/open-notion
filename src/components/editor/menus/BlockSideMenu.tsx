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
  const [translateY, setTranslateY] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const hasPositionedRef = useRef(false);

  const activeBlock = useActiveBlock({ editor, locked: menuOpen, menuRef });

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

    if (hasPositionedRef.current) return;

    menuRef.current?.style.setProperty("transition", "opacity 150ms ease");
    hasPositionedRef.current = true;
    // Force reflow then restore transition next frame
    requestAnimationFrame(() => {
      menuRef.current?.style.removeProperty("transition");
    });
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
      className={cn(
        "absolute top-0 left-[10px] z-10 flex items-center gap-px",
        "opacity-0 pointer-events-none transition-[transform,opacity] duration-250 ease-out",
        "data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto",
        "after:absolute after:top-0 after:-right-4 after:h-full after:w-4 after:pointer-events-auto after:content-['']",
      )}
      data-visible={visible}
      style={{ transform: `translateY(${translateY}px)` }}
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
        onOpenChange={setMenuOpen}
      />
    </div>
  );
}
