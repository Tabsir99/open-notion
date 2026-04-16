import { useState, useEffect } from "react";
import { getColIndex, getRowIndex, getTablePos } from "./tableActions";
import { cellAround } from "@tiptap/pm/tables";
import { editorStore } from "../../store";
import { BTN } from ".";

export interface FocusedCell {
  tableContainer: HTMLElement;
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

export function useTableFocus(): FocusedCell | null {
  const [focused, setFocused] = useState<FocusedCell | null>(null);

  useEffect(() => {
    const { editor } = editorStore.get();
    if (!editor) return;

    const resolve = () => {
      const { activeBlock } = editorStore.get();
      if (!activeBlock || activeBlock.nodeType !== "table") return;

      setTimeout(() => {
        const wrapperDom = activeBlock.element;
        const tableDom = wrapperDom.firstChild as HTMLTableElement;
        const cellPos = cellAround(editor.state.selection.$anchor)?.pos;

        if (!cellPos || !wrapperDom) return setFocused(null);

        const cellDom = editor.view.nodeDOM(cellPos) as HTMLElement | null;

        if (!cellDom || !tableDom) return setFocused(null);

        const tablePos = getTablePos(cellPos + 1);
        if (tablePos === null) return setFocused(null);

        setFocused({
          tableContainer: wrapperDom,
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
      }, 0);
    };

    editor.on("transaction", resolve);
    return () => {
      editor.off("transaction", resolve);
    };
  }, []);

  return focused;
}
