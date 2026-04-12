import { useRef, useState, useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { GripVertical, Plus } from "lucide-react";
import { useActiveBlock } from "./useActiveBlock";
import { BlockContextMenu } from "./BlockContextMenu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import "../styles/block-side-menu.css";

interface Props {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function BlockSideMenu({ editor, containerRef }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { activeRef, clearActive } = useActiveBlock({
    editor,
    menuRef,
    containerRef,
    open,
  });

  const handlePlusClick = useCallback(() => {
    const pos = activeRef.current.pos;
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
  }, [editor, activeRef]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      const { pos, element } = activeRef.current;
      if (!element) return;
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
    [editor, activeRef],
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
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Block options"
          className="cursor-grab"
          draggable
          onClick={() => {
            setOpen(true);
            editor
              .chain()
              .focus()
              .setNodeSelection(activeRef.current.pos)
              .run();
          }}
          onDragStart={handleDragStart}
          onDragEnd={() => {
            editor.view.dragging = null;
          }}
        >
          <GripVertical className="size-4" />
        </Button>

        <BlockContextMenu
          editor={editor}
          blockPos={activeRef.current.pos}
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              clearActive();
            }
          }}
        />
      </div>
    </div>
  );
}
