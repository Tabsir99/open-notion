import { useRef, useState, useCallback } from "react";
import { GripVertical, Plus } from "lucide-react";
import { useHoveredBlock } from "./useHoveredBlock";
import { BlockContextMenu } from "./BlockContextMenu";
import { cn } from "../lib/utils";
import { Button } from "../ui/button";
import { useEditor } from "../context";
import { getRuntime, type DropTarget } from "../runtime";
import type { TypedEditor } from "../types";

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function computeDropTarget(
  editor: TypedEditor,
  clientY: number,
): DropTarget | null {
  const viewDom = editor.view.dom as HTMLElement;
  const children = Array.from(viewDom.children) as HTMLElement[];
  if (children.length === 0) return null;

  let target = children[0];
  for (const el of children) {
    const r = el.getBoundingClientRect();
    if (clientY >= r.top && clientY <= r.bottom) {
      target = el;
      break;
    }
    if (clientY > r.bottom) target = el;
  }

  try {
    const inside = editor.view.posAtDOM(target, 0);
    const $pos = editor.state.doc.resolve(inside);
    if ($pos.depth < 1) return null;
    return { element: target, blockPos: $pos.before(1) };
  } catch {
    return null;
  }
}

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

      const blockRect = element.getBoundingClientRect();
      const dragOffsetY = e.clientY - blockRect.top;
      const lockedX = blockRect.left;

      // Suppress native browser drag image so we can render our own Y-locked ghost.
      const transparent = new Image();
      transparent.src = TRANSPARENT_PIXEL;
      e.dataTransfer.setDragImage(transparent, 0, 0);
      e.dataTransfer.effectAllowed = "move";

      const ghost = element.cloneNode(true) as HTMLElement;
      ghost.style.cssText = [
        "position: fixed",
        "pointer-events: none",
        "z-index: 9999",
        "opacity: 0.5",
        "margin: 0",
        `width: ${blockRect.width}px`,
        "left: 0",
        "top: 0",
        `transform: translate(${lockedX}px, ${blockRect.top}px)`,
        "transition: none",
      ].join(";");
      document.body.appendChild(ghost);

      let pendingFrame: number | null = null;
      let lastClientY = e.clientY;
      let lastTargetEl: HTMLElement | null = null;

      const flush = () => {
        pendingFrame = null;
        ghost.style.transform = `translate(${lockedX}px, ${lastClientY - dragOffsetY}px)`;
        const next = computeDropTarget(editor, lastClientY);
        // Only notify subscribers when the targeted block element actually
        // changes — avoids re-rendering BlockDropIndicator every RAF.
        const nextEl = next?.element ?? null;
        if (nextEl !== lastTargetEl) {
          lastTargetEl = nextEl;
          getRuntime(editor).set({ dropTarget: next });
        }
      };

      const onDocDragOver = (ev: DragEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
        lastClientY = ev.clientY;
        if (pendingFrame === null) {
          pendingFrame = requestAnimationFrame(flush);
        }
      };

      const onDocDrop = (ev: DragEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        const dragging = editor.view.dragging;
        const target = dragging ? computeDropTarget(editor, ev.clientY) : null;
        if (dragging && target) {
          const tr = editor.view.state.tr;
          tr.deleteSelection();
          tr.insert(tr.mapping.map(target.blockPos), dragging.slice.content);
          editor.view.dispatch(tr.scrollIntoView());
        }
        endDrag();
      };

      const onKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") endDrag();
      };

      const endDrag = () => {
        if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
        ghost.remove();
        editor.view.dragging = null;
        getRuntime(editor).set({ dropTarget: null, hoveredBlock: null });
        if (menuRef.current) menuRef.current.dataset.visible = "false";
        document.removeEventListener("dragover", onDocDragOver, true);
        document.removeEventListener("drop", onDocDrop, true);
        document.removeEventListener("dragend", endDrag);
        document.removeEventListener("keydown", onKeyDown);
      };

      document.addEventListener("dragover", onDocDragOver, true);
      document.addEventListener("drop", onDocDrop, true);
      document.addEventListener("dragend", endDrag);
      document.addEventListener("keydown", onKeyDown);
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
            >
              <GripVertical className="size-4" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
