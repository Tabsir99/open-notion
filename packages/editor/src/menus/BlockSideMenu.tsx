import { useRef, useState, useCallback } from "react";
import { GripVertical, Plus } from "lucide-react";
import { useHoveredBlock } from "./useHoveredBlock";
import { BlockContextMenu } from "./BlockContextMenu";
import { cn } from "../lib/utils";
import { Button } from "../ui/button";
import { useEditor } from "../context";
import { getRuntime } from "../runtime";

export function BlockSideMenu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const editor = useEditor();

  const { clearActive } = useHoveredBlock({ menuRef, open });

  const handlePlusClick = useCallback(() => {
    if (!editor) return;
    const { hoveredBlock } = getRuntime(editor).get();
    if (!hoveredBlock) return;

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
  }, [editor]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      if (!editor) return;
      const { hoveredBlock } = getRuntime(editor).get();
      if (!hoveredBlock) return;

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
    [editor],
  );

  return (
    <div
      ref={menuRef}
      data-visible="false"
      className={cn(
        "absolute top-0 flex items-center left-2",
        "opacity-0 pointer-events-none",
        "data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto",
        "after:absolute after:top-0 after:-right-full after:h-full after:w-full after:content-['']",
        "transition-[top,opacity] duration-200 ease-out will-change-[top]",
      )}
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
                if (!editor) return;
                const { hoveredBlock } = getRuntime(editor).get();
                if (!hoveredBlock) return;

                setOpen((p) => !p);
                editor.chain().focus().setNodeSelection(hoveredBlock.pos).run();
              }}
              onDragStart={handleDragStart}
              onDragEnd={() => {
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
