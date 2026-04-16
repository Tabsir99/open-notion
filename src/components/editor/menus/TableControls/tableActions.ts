import type { Node as PMNode } from "@tiptap/pm/model";
import { editorStore } from "../../store";

// ── DOM Helpers ────────────────────────────────────────────────────────

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

// ── ProseMirror Position Helpers ───────────────────────────────────────

export function getTablePos(cellDomPos: number): number | null {
  try {
    const { editor } = editorStore.get();
    if (!editor) throw new Error("Editor not found");

    const $pos = editor.state.doc.resolve(cellDomPos);
    for (let d = $pos.depth; d >= 0; d--) {
      if ($pos.node(d).type.name === "table") return $pos.before(d);
    }
  } catch {
    // pos out of range
  }
  return null;
}

// ── Table Node Rebuild Helpers ─────────────────────────────────────────

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

function applyTableReplace(tablePos: number, newTable: PMNode): void {
  const { editor } = editorStore.get();
  if (!editor) return;

  const { state, dispatch } = editor.view;
  const tableNode = state.doc.nodeAt(tablePos);
  if (!tableNode) return;
  dispatch(
    state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable),
  );
}

// ── Column Operations ──────────────────────────────────────────────────

export function moveColumn(tablePos: number, from: number, to: number): void {
  const { editor } = editorStore.get();
  if (from === to || !editor) return;
  const tableNode = editor.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const newTable = rebuildTable(tableNode, (cells) => {
    const moved = [...cells];
    const [cell] = moved.splice(from, 1);
    moved.splice(to, 0, cell);
    return moved;
  });
  applyTableReplace(tablePos, newTable);
}

export function duplicateColumn(tablePos: number, colIdx: number): void {
  const { editor } = editorStore.get();
  const tableNode = editor?.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const newTable = rebuildTable(tableNode, (cells) => {
    const result = [...cells];
    result.splice(colIdx + 1, 0, cells[colIdx]);
    return result;
  });
  applyTableReplace(tablePos, newTable);
}

function clearCells(
  tablePos: number,
  shouldClear: (rowIdx: number, colIdx: number) => boolean,
): void {
  const { editor } = editorStore.get();
  const tableNode = editor?.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const emptyParagraph = editor!.state.schema.nodes.paragraph.create();
  const newTable = rebuildTable(tableNode, (cells, rowIdx) =>
    cells.map((cell, colIdx) =>
      shouldClear(rowIdx, colIdx)
        ? cell.type.create(cell.attrs, emptyParagraph, cell.marks)
        : cell,
    ),
  );
  applyTableReplace(tablePos, newTable);
}

export function clearColumn(tablePos: number, colIdx: number): void {
  clearCells(tablePos, (_, col) => col === colIdx);
}

// ── Row Operations ─────────────────────────────────────────────────────

export function moveRow(tablePos: number, from: number, to: number): void {
  const { editor } = editorStore.get();
  if (from === to || !editor) return;

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
  applyTableReplace(tablePos, newTable);
}

export function clearRow(tablePos: number, rowIdx: number): void {
  clearCells(tablePos, (row) => row === rowIdx);
}

// ── Background Color Operations ────────────────────────────────────────

function setCellBgs(
  tablePos: number,
  shouldColor: (rowIdx: number, colIdx: number) => boolean,
  color: string | null,
): void {
  const { editor } = editorStore.get();
  const tableNode = editor?.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const tr = editor!.state.tr;
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
  editor!.view.dispatch(tr);
}

export function setCellBgsForColumn(
  tablePos: number,
  colIdx: number,
  color: string | null,
): void {
  setCellBgs(tablePos, (_, col) => col === colIdx, color);
}

export function setCellBgsForRow(
  tablePos: number,
  rowIdx: number,
  color: string | null,
): void {
  setCellBgs(tablePos, (row) => row === rowIdx, color);
}

// ── Cell Operations ────────────────────────────────────────────────────

export function clearCell(
  tablePos: number,
  rowIdx: number,
  colIdx: number,
): void {
  clearCells(tablePos, (row, col) => row === rowIdx && col === colIdx);
}
