import type { Node as PMNode } from "@tiptap/pm/model";
import type { TypedEditor } from "../../types";

export function getColIndex(cellDom: HTMLElement): number {
  const row = cellDom.closest("tr");
  if (!row) return 0;
  return Array.from(row.children).indexOf(cellDom);
}

export function getRowIndex(cellDom: HTMLElement): number {
  const tbody = cellDom.closest("tbody, table");
  if (!tbody) return 0;
  const rows = Array.from(tbody.querySelectorAll(":scope > tr"));
  const row = cellDom.closest("tr");
  return row ? rows.indexOf(row) : 0;
}

export function getTablePos(
  editor: TypedEditor,
  cellDomPos: number,
): number | null {
  try {
    const $pos = editor.state.doc.resolve(cellDomPos);
    for (let d = $pos.depth; d >= 0; d--) {
      if ($pos.node(d).type.name === "table") return $pos.before(d);
    }
  } catch {
    // pos out of range
  }
  return null;
}

function rebuildTable(
  tableNode: PMNode,
  mapRow: (cells: PMNode[], rowIdx: number) => PMNode[],
): PMNode {
  const newRows = tableNode.content.content.map((row, rowIdx) => {
    const cells = [...row.content.content];
    const newCells = mapRow(cells, rowIdx);
    return row.type.create(row.attrs, newCells, row.marks);
  });
  return tableNode.type.create(tableNode.attrs, newRows, tableNode.marks);
}

function applyTableReplace(
  editor: TypedEditor,
  tablePos: number,
  newTable: PMNode,
): void {
  const { state, dispatch } = editor.view;
  const tableNode = state.doc.nodeAt(tablePos);
  if (!tableNode) return;
  dispatch(
    state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable),
  );
}

export function moveColumn(
  editor: TypedEditor,
  tablePos: number,
  from: number,
  to: number,
): void {
  if (from === to) return;
  const tableNode = editor.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const newTable = rebuildTable(tableNode, (cells) => {
    const moved = [...cells];
    const [cell] = moved.splice(from, 1);
    moved.splice(to, 0, cell);
    return moved;
  });
  applyTableReplace(editor, tablePos, newTable);
}

export function duplicateColumn(
  editor: TypedEditor,
  tablePos: number,
  colIdx: number,
): void {
  const tableNode = editor.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const newTable = rebuildTable(tableNode, (cells) => {
    const result = [...cells];
    result.splice(colIdx + 1, 0, cells[colIdx]);
    return result;
  });
  applyTableReplace(editor, tablePos, newTable);
}

function clearCells(
  editor: TypedEditor,
  tablePos: number,
  shouldClear: (rowIdx: number, colIdx: number) => boolean,
): void {
  const tableNode = editor.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const emptyParagraph = editor.state.schema.nodes.paragraph.create();
  const newTable = rebuildTable(tableNode, (cells, rowIdx) =>
    cells.map((cell, colIdx) =>
      shouldClear(rowIdx, colIdx)
        ? cell.type.create(cell.attrs, emptyParagraph, cell.marks)
        : cell,
    ),
  );
  applyTableReplace(editor, tablePos, newTable);
}

export function clearColumn(
  editor: TypedEditor,
  tablePos: number,
  colIdx: number,
): void {
  clearCells(editor, tablePos, (_, col) => col === colIdx);
}

export function moveRow(
  editor: TypedEditor,
  tablePos: number,
  from: number,
  to: number,
): void {
  if (from === to) return;

  const tableNode = editor.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const rows = [...tableNode.content.content];
  const [row] = rows.splice(from, 1);
  rows.splice(to, 0, row);

  const newTable = tableNode.type.create(
    tableNode.attrs,
    rows,
    tableNode.marks,
  );
  applyTableReplace(editor, tablePos, newTable);
}

export function clearRow(
  editor: TypedEditor,
  tablePos: number,
  rowIdx: number,
): void {
  clearCells(editor, tablePos, (row) => row === rowIdx);
}

function setCellBgs(
  editor: TypedEditor,
  tablePos: number,
  shouldColor: (rowIdx: number, colIdx: number) => boolean,
  color: string | null,
): void {
  const tableNode = editor.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const tr = editor.state.tr;
  let rowPos = tablePos + 1;
  let rowIdx = 0;
  tableNode.content.forEach((rowNode) => {
    let colIdx = 0;
    rowNode.content.forEach((cellNode, offset) => {
      if (shouldColor(rowIdx, colIdx)) {
        tr.setNodeMarkup(rowPos + 1 + offset, undefined, {
          ...cellNode.attrs,
          backgroundColor: color,
        });
      }
      colIdx++;
    });
    rowIdx++;
    rowPos += rowNode.nodeSize;
  });
  editor.view.dispatch(tr);
}

export function setCellBgsForColumn(
  editor: TypedEditor,
  tablePos: number,
  colIdx: number,
  color: string | null,
): void {
  setCellBgs(editor, tablePos, (_, col) => col === colIdx, color);
}

export function setCellBgsForRow(
  editor: TypedEditor,
  tablePos: number,
  rowIdx: number,
  color: string | null,
): void {
  setCellBgs(editor, tablePos, (row) => row === rowIdx, color);
}

export function clearCell(
  editor: TypedEditor,
  tablePos: number,
  rowIdx: number,
  colIdx: number,
): void {
  clearCells(
    editor,
    tablePos,
    (row, col) => row === rowIdx && col === colIdx,
  );
}
