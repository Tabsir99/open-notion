import { useState } from "react";
import { GripHorizontal, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableFocus } from "./useTableHover";
import { useTableDrag, type DragState } from "./useTableDrag";
import { ColMenu, RowMenu, CellMenu } from "./TableMenus";
import { createPortal } from "react-dom";

export const BTN = 24;
export const TOP_LEFT_PADDING = 6;

const TRIGGER_CLS = cn(
  "absolute flex items-center justify-center inset-0 m-auto",
  "rounded-[6px] z-40 cursor-grab border-0 p-0 outline-none",
  "bg-popover text-muted-foreground ring-1 ring-foreground/10 shadow-sm",
  "hover:text-foreground hover:bg-accent transition-[colors,opacity] duration-200",
  "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
);

function makeOnOpenChange(
  set: React.Dispatch<React.SetStateAction<boolean>>,
  didDragRef: React.RefObject<boolean>,
) {
  return (open: boolean, e?: { reason: string }) => {
    if (
      e?.reason === "trigger-hover" ||
      e?.reason === "focus-out" ||
      e?.reason === "trigger-press"
    )
      return;
    if (!open || !didDragRef.current) set(open);
  };
}

function DragIndicator({ drag }: { drag: DragState }) {
  if (!drag.isDragging) return null;
  const tableRect = drag.tableDom.getBoundingClientRect();

  if (drag.axis === "col") {
    const firstRow = drag.tableDom.querySelector("tr");
    const cell = firstRow?.children[drag.toIdx] as HTMLElement | undefined;
    const x = cell ? cell.getBoundingClientRect().left : tableRect.right;
    return (
      <div
        className="fixed pointer-events-none z-100 w-0.5 bg-primary"
        style={{ left: x, top: tableRect.top, height: tableRect.height }}
      />
    );
  }

  const rows = drag.tableDom.querySelectorAll(
    ":scope > tr, tbody > tr",
  ) as NodeListOf<HTMLElement>;
  const y =
    drag.toIdx < rows.length
      ? rows[drag.toIdx].getBoundingClientRect().top
      : tableRect.bottom;
  return (
    <div
      className="fixed pointer-events-none z-100 h-0.5 bg-primary"
      style={{ top: y, left: tableRect.left, width: tableRect.width }}
    />
  );
}

export function TableControls() {
  const focused = useTableFocus();
  const { drag, didDragRef, startDrag } = useTableDrag();

  const [colOpen, setColOpen] = useState(false);
  const [rowOpen, setRowOpen] = useState(false);
  const [cellOpen, setCellOpen] = useState(false);

  if (!focused) return drag?.isDragging ? <DragIndicator drag={drag} /> : null;

  const { colIndex, rowIndex, cell, col, row } = focused;

  const triggerCls = (open: boolean) =>
    cn(TRIGGER_CLS, open && "opacity-100 pointer-events-auto");

  return createPortal(
    <>
      {focused && (
        <div
          className="absolute pointer-events-none rounded-[2px] ring-2 ring-editor-accent/50
               transition-[top,left,width,height] duration-200 ease-out z-30"
          style={{ ...focused.cell, left: focused.cell.trueLeft }}
        />
      )}

      {drag?.isDragging && <DragIndicator drag={drag} />}

      {/* Column indicator */}
      <div
        className="group absolute z-40 transition-[left] duration-300 ease-out"
        style={{ ...col, height: BTN }}
      >
        <div
          className={cn(
            "absolute bottom-0 left-[20%] right-[20%] h-0.5 rounded-full bg-foreground/30 group-hover:opacity-0 transition-opacity",
            colOpen && "opacity-0",
          )}
        />
        <DropdownMenu
          open={colOpen}
          onOpenChange={makeOnOpenChange(setColOpen, didDragRef)}
        >
          <DropdownMenuTrigger
            className={triggerCls(colOpen)}
            style={{
              width: BTN,
              height: BTN / 2,
              top: BTN / 2 + TOP_LEFT_PADDING,
            }}
            onMouseDown={(e) => startDrag(e, "col", colIndex, focused)}
            onClick={() => setColOpen((p) => !p)}
          >
            <GripHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <ColMenu focused={focused} onClose={() => setColOpen(false)} />
        </DropdownMenu>
      </div>

      {/* Row indicator */}
      <div
        className="group absolute z-40 transition-[top] duration-300 ease-out"
        style={{ ...row, width: BTN }}
      >
        <div
          className={cn(
            "absolute top-[20%] bottom-[20%] right-0 w-0.5 rounded-full bg-foreground/30 group-hover:opacity-0 transition-opacity",
            rowOpen && "opacity-0",
          )}
        />
        <DropdownMenu
          open={rowOpen}
          onOpenChange={makeOnOpenChange(setRowOpen, didDragRef)}
        >
          <DropdownMenuTrigger
            className={triggerCls(rowOpen) + " rotate-90"}
            style={{ width: BTN, height: BTN / 2, left: BTN / 2 }}
            onMouseDown={(e) => startDrag(e, "row", rowIndex, focused)}
            onClick={() => setRowOpen((p) => !p)}
          >
            <GripHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <RowMenu focused={focused} onClose={() => setRowOpen(false)} />
        </DropdownMenu>
      </div>

      {/* Cell indicator */}
      <div className="group absolute z-40" style={{ ...cell, width: BTN }}>
        <div
          className={cn(
            "absolute top-[30%] bottom-[30%] left-1/2 -translate-x-1/2 w-0.5 rounded-full bg-foreground/30 group-hover:opacity-0 transition-opacity",
            cellOpen && "opacity-0",
          )}
        />
        <DropdownMenu open={cellOpen} onOpenChange={setCellOpen}>
          <DropdownMenuTrigger
            className={triggerCls(cellOpen) + " rotate-90"}
            style={{ width: BTN, height: BTN / 2 }}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <CellMenu focused={focused} onClose={() => setCellOpen(false)} />
        </DropdownMenu>
      </div>
    </>,
    focused.tableContainer,
  );
}
