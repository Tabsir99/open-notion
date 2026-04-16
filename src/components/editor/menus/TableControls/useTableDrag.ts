import { useRef, useState, useCallback, useEffect } from "react";
import type { FocusedCell } from "./useTableFocus";
import { moveColumn, moveRow } from "./tableActions";
import { editorStore } from "../../store";

export interface DragState {
  axis: "col" | "row";
  fromIdx: number;
  toIdx: number;
  tablePos: number;
  tableDom: HTMLElement;
  isDragging: boolean;
}

const DRAG_THRESHOLD = 4;
const ANIM_MS = 250;

// ── DOM measurement ──────────────────────────────────────────────────

function getRows(tableEl: HTMLElement): HTMLTableRowElement[] {
  return Array.from(
    tableEl.querySelectorAll<HTMLTableRowElement>(":scope > tr, tbody > tr"),
  );
}

function getMidpoints(tableEl: HTMLElement, axis: "col" | "row"): number[] {
  if (axis === "col") {
    const firstRow = tableEl.querySelector("tr");
    if (!firstRow) return [];
    return Array.from(firstRow.children).map((c) => {
      const r = (c as HTMLElement).getBoundingClientRect();
      return r.left + r.width / 2;
    });
  }
  return getRows(tableEl).map((r) => {
    const rect = r.getBoundingClientRect();
    return rect.top + rect.height / 2;
  });
}

function nearestIdx(mids: number[], v: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < mids.length; i++) {
    const d = Math.abs(mids[i] - v);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function resolveTableEl(tablePos: number): HTMLElement | null {
  const { editor } = editorStore.get();
  if (!editor) return null;
  const nodeDom = editor.view.nodeDOM(tablePos) as HTMLElement | null;
  if (!nodeDom) return null;
  return nodeDom.tagName === "TABLE"
    ? nodeDom
    : (nodeDom.querySelector("table") as HTMLElement | null);
}

// ── FLIP animation ───────────────────────────────────────────────────

// Splice semantics: remove at `from`, insert at `to` in the shortened array.
function oldIdxOf(newIdx: number, from: number, to: number): number {
  if (newIdx === to) return from;
  if (from < to && newIdx >= from && newIdx < to) return newIdx + 1;
  if (from > to && newIdx > to && newIdx <= from) return newIdx - 1;
  return newIdx;
}

function getMovableGroups(
  tableEl: HTMLElement,
  axis: "col" | "row",
): HTMLElement[][] {
  const rows = getRows(tableEl);
  return axis === "row"
    ? rows.map((r) => [r])
    : rows.map((r) => Array.from(r.children) as HTMLElement[]);
}

function flipReorder(
  tableEl: HTMLElement,
  axis: "col" | "row",
  from: number,
  to: number,
  mutate: () => void,
) {
  const before = getMovableGroups(tableEl, axis).map((group) =>
    group.map((el) => el.getBoundingClientRect()),
  );

  mutate();

  getMovableGroups(tableEl, axis).forEach((group, rowIdx) => {
    group.forEach((el, cellIdx) => {
      const oldRow = axis === "row" ? oldIdxOf(rowIdx, from, to) : rowIdx;
      const oldCell = axis === "col" ? oldIdxOf(cellIdx, from, to) : cellIdx;
      const oldRect = before[oldRow]?.[oldCell];
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (!dx && !dy) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: ANIM_MS, easing: "ease-out" },
      );
    });
  });
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useTableDrag() {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const didDragRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const pendingCursorRef = useRef<{ x: number; y: number } | null>(null);
  const animTimerRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(
    () => () => {
      cleanupRef.current?.();
      if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
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

      const startX = e.clientX;
      const startY = e.clientY;

      dragRef.current = {
        axis,
        fromIdx,
        toIdx: fromIdx,
        tablePos: h.tablePos,
        tableDom: h.tableContainer,
        isDragging: false,
      };

      const evaluate = (clientX: number, clientY: number) => {
        const d = dragRef.current;
        if (!d) return;

        const tableEl = resolveTableEl(d.tablePos);
        if (!tableEl) return;

        const mids = getMidpoints(tableEl, d.axis);
        const cursor = d.axis === "col" ? clientX : clientY;
        const toIdx = nearestIdx(mids, cursor);

        if (toIdx === d.fromIdx) {
          // No reorder, but still mark dragging + sync tableDom
          const next = { ...d, isDragging: true, toIdx, tableDom: tableEl };
          dragRef.current = next;
          setDrag(next);
          return;
        }

        isAnimatingRef.current = true;
        flipReorder(tableEl, d.axis, d.fromIdx, toIdx, () => {
          if (d.axis === "col") moveColumn(d.tablePos, d.fromIdx, toIdx);
          else moveRow(d.tablePos, d.fromIdx, toIdx);
        });

        const next = {
          ...d,
          isDragging: true,
          toIdx,
          fromIdx: toIdx,
          tableDom: tableEl,
        };
        dragRef.current = next;
        setDrag(next);

        animTimerRef.current = window.setTimeout(() => {
          animTimerRef.current = null;
          isAnimatingRef.current = false;
          const pending = pendingCursorRef.current;
          pendingCursorRef.current = null;
          if (pending && dragRef.current) evaluate(pending.x, pending.y);
        }, ANIM_MS);
      };

      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;

        if (!d.isDragging) {
          const delta =
            d.axis === "col" ? ev.clientX - startX : ev.clientY - startY;
          if (Math.abs(delta) < DRAG_THRESHOLD) return;
        }

        if (isAnimatingRef.current) {
          pendingCursorRef.current = { x: ev.clientX, y: ev.clientY };
          return;
        }

        evaluate(ev.clientX, ev.clientY);
      };

      const onUp = () => {
        if (dragRef.current?.isDragging) {
          didDragRef.current = true;
          requestAnimationFrame(() => {
            didDragRef.current = false;
          });
        }
        dragRef.current = null;
        pendingCursorRef.current = null;
        cleanupRef.current?.();
        cleanupRef.current = null;
        setDrag(null);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      cleanupRef.current = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    },
    [],
  );

  return { drag, didDragRef, startDrag };
}
