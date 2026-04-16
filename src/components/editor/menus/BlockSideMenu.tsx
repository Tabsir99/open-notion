import { useRef, useState, useCallback } from "react";
import { GripVertical, Plus } from "lucide-react";
import { useHoveredBlock } from "./useHoveredBlock";
import { BlockContextMenu } from "./BlockContextMenu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import "../styles/block-side-menu.css";
import { editorStore } from "../store";

export function BlockSideMenu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { clearActive } = useHoveredBlock({ menuRef, open });

  const handlePlusClick = useCallback(() => {
    const { editor, hoveredBlock } = editorStore.get();
    if (!editor || !hoveredBlock) return;

    const pos = hoveredBlock.pos;
    const $pos = editor.state.doc.resolve(pos);
    if (!$pos.nodeAfter) return;
    const endOfBlock = $pos.pos + $pos.nodeAfter.nodeSize;
    editor
      .chain()
      .focus()
      .insertContentAt(endOfBlock, { type: "paragraph" })
      .setTextSelection(endOfBlock + 1)
      .insertContent("/")
      .run();
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      const { editor, hoveredBlock } = editorStore.get();
      if (!editor || !hoveredBlock) return;

      const { pos, element } = hoveredBlock;

      editor.commands.setNodeSelection(pos);
      editor.view.dragging = {
        slice: editor.view.state.selection.content(),
        move: true,
      };
      const rect = element.getBoundingClientRect();
      e.dataTransfer.setDragImage(
        element,
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    },
    [],
  );

  return (
    <div
      ref={menuRef}
      data-visible="false"
      className={cn(
        "absolute top-0 left-[10px] z-10 flex items-center",
        "opacity-0 pointer-events-none",
        "data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto",
        "after:absolute after:top-0 after:-right-4 after:h-full after:w-4 after:content-['']",
      )}
      id="block-side-menu"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlusClick}
        aria-label="Add block"
      >
        <Plus className="size-4" />
      </Button>

      <div className="relative">
        <BlockContextMenu
          open={open}
          onOpenChange={(o, e) => {
            if (
              e.reason === "trigger-hover" ||
              e.reason === "focus-out" ||
              e.reason === "trigger-press"
            )
              return;

            if (!o) {
              setOpen(o);
              clearActive();
            }
          }}
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Block options"
              className="cursor-grab"
              draggable
              onClick={() => {
                const { editor, hoveredBlock } = editorStore.get();
                if (!editor || !hoveredBlock) return;

                setOpen((p) => !p);
                editor.chain().focus().setNodeSelection(hoveredBlock.pos).run();
              }}
              onDragStart={handleDragStart}
              onDragEnd={() => {
                const { editor } = editorStore.get();
                if (!editor) return;

                editor.view.dragging = null;
              }}
            >
              <GripVertical className="size-4" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
