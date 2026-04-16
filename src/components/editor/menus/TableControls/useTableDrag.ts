import { useRef, useState, useCallback, useEffect } from "react";
import type { FocusedCell } from "./useTableHover";
import { moveColumn, moveRow } from "./tableActions";

export interface DragState {
  axis: "col" | "row";
  fromIdx: number;
  toIdx: number;
  tablePos: number;
  tableDom: HTMLElement;
  startX: number;
  startY: number;
  isDragging: boolean;
}

const DRAG_THRESHOLD = 4;

function getColMidpoints(tableDom: HTMLElement): number[] {
  const firstRow = tableDom.querySelector("tr");
  if (!firstRow) return [];
  return Array.from(firstRow.children).map((c) => {
    const r = (c as HTMLElement).getBoundingClientRect();
    return r.left + r.width / 2;
  });
}

function getRowMidpoints(tableDom: HTMLElement): number[] {
  return Array.from(tableDom.querySelectorAll(":scope > tr, tbody > tr")).map(
    (r) => {
      const rect = (r as HTMLElement).getBoundingClientRect();
      return rect.top + rect.height / 2;
    },
  );
}

function nearestIdx(mids: number[], v: number): number {
  return mids.reduce(
    (best, m, i) => (Math.abs(m - v) < Math.abs(mids[best] - v) ? i : best),
    0,
  );
}

export function useTableDrag() {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const didDragRef = useRef(false);

  useEffect(
    () => () => {
      dragRef.current = null;
      dragCleanupRef.current?.();
    },
    [],
  );

  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      axis: "col" | "row",
      fromIdx: number,
      h: FocusedCell,
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const state: DragState = {
        axis,
        fromIdx,
        toIdx: fromIdx,
        tablePos: h.tablePos,
        tableDom: h.tableContainer,
        startX: e.clientX,
        startY: e.clientY,
        isDragging: false,
      };
      dragRef.current = state;

      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const delta =
          d.axis === "col" ? ev.clientX - d.startX : ev.clientY - d.startY;
        if (!d.isDragging && Math.abs(delta) < DRAG_THRESHOLD) return;
        const toIdx =
          d.axis === "col"
            ? nearestIdx(getColMidpoints(d.tableDom), ev.clientX)
            : nearestIdx(getRowMidpoints(d.tableDom), ev.clientY);
        dragRef.current = { ...d, isDragging: true, toIdx };
        setDrag({ ...d, isDragging: true, toIdx });
      };

      const onUp = () => {
        const d = dragRef.current;
        if (d?.isDragging) {
          didDragRef.current = true;
          requestAnimationFrame(() => {
            didDragRef.current = false;
          });
          if (d.axis === "col") moveColumn(d.tablePos, d.fromIdx, d.toIdx);
          else moveRow(d.tablePos, d.fromIdx, d.toIdx);
        }
        dragRef.current = null;
        dragCleanupRef.current = null;
        setDrag(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      dragCleanupRef.current = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    },
    [],
  );

  return { drag, didDragRef, startDrag };
}
