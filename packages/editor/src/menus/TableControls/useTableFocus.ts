import { useState, useEffect } from "react";
import { getColIndex, getRowIndex, getTablePos } from "./tableActions";
import { cellAround } from "@tiptap/pm/tables";
import type { Node as PMNode } from "@tiptap/pm/model";
import { editorStore } from "../../store";
import type { TypedEditor } from "../../types";
import { BTN } from ".";

export interface FocusedCell {
  tableWrapper: HTMLElement;
  tablePos: number;
  cellPosInDoc: number;
  colIndex: number;
  rowIndex: number;
  col: { top: number; left: number; width: number };
  row: { top: number; left: number; height: number };
  cell: {
    top: number;
    left: number;
    height: number;
    width: number;
    trueLeft: number;
  };
}

function findTableAtSelection(editor: TypedEditor) {
  const { $anchor } = editor.state.selection;
  for (let depth = $anchor.depth; depth >= 0; depth--) {
    const node = $anchor.node(depth);
    if (node.type.name === "table") {
      const pos = depth === 0 ? 0 : $anchor.before(depth);
      const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
      if (!dom) return null;
      return { node, pos, dom } as {
        node: PMNode;
        pos: number;
        dom: HTMLElement;
      };
    }
  }
  return null;
}

export function useTableFocus(): FocusedCell | null {
  const [focused, setFocused] = useState<FocusedCell | null>(null);

  useEffect(() => {
    const { editor } = editorStore.get();
    if (!editor) return;

    let observer: ResizeObserver | null = null;
    let observedCell: HTMLElement | null = null;
    let observedTable: HTMLElement | null = null;
    let rafId: number | null = null;

    const scheduleRemeasure = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measure();
      });
    };

    const ensureObserving = (cellDom: HTMLElement, tableDom: HTMLElement) => {
      if (observedCell === cellDom && observedTable === tableDom) return;
      observer?.disconnect();
      observer = new ResizeObserver(scheduleRemeasure);
      observer.observe(cellDom);
      observer.observe(tableDom);
      observedCell = cellDom;
      observedTable = tableDom;
    };

    const teardown = () => {
      observer?.disconnect();
      observer = null;
      observedCell = null;
      observedTable = null;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };

    const measure = () => {
      const table = findTableAtSelection(editor);
      if (!table) {
        teardown();
        return setFocused(null);
      }

      const cellPos = cellAround(editor.state.selection.$anchor)?.pos;
      if (cellPos == null) return setFocused(null);

      const cellDom = editor.view.nodeDOM(cellPos) as HTMLElement | null;
      if (!cellDom) return setFocused(null);

      const wrapperDom = table.dom;
      const tableDom = wrapperDom.querySelector(
        "table",
      ) as HTMLTableElement | null;
      if (!tableDom) return setFocused(null);

      ensureObserving(cellDom, tableDom);

      const tablePos = getTablePos(cellPos + 1);
      if (tablePos === null) return setFocused(null);

      setFocused({
        tableWrapper: wrapperDom,
        tablePos,
        cellPosInDoc: cellPos + 1,
        colIndex: getColIndex(cellDom),
        rowIndex: getRowIndex(cellDom),
        col: {
          top: tableDom.offsetTop - BTN,
          left: cellDom.offsetLeft,
          width: cellDom.offsetWidth,
        },
        row: {
          top: cellDom.offsetTop,
          left: tableDom.offsetLeft - BTN,
          height: cellDom.offsetHeight,
        },
        cell: {
          top: cellDom.offsetTop,
          left: cellDom.offsetLeft + cellDom.offsetWidth - BTN / 2,
          height: cellDom.offsetHeight,
          width: cellDom.offsetWidth,
          trueLeft: cellDom.offsetLeft,
        },
      });
    };

    measure();
    editor.on("selectionUpdate", measure);
    editor.on("focus", measure);
    return () => {
      editor.off("selectionUpdate", measure);
      editor.off("focus", measure);
      teardown();
    };
  }, []);

  return focused;
}
