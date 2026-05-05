import type {
  TableCellNode,
  TableHeaderNode,
  TableNode,
  TableRowNode,
} from "../../jsonContent";
import { DA, DATA_TYPE } from "./htmlDataAttrs";
import { _renderBlockContent } from "./renderers";
import { attr, styleAttr } from "./_internal";

const { type } = DA;

const html = String.raw;

export function buildColgroup(table: TableNode): string {
  const firstRow = table.content?.[0];
  if (!firstRow) return "";

  const widths: (number | undefined)[] = [];
  for (const cell of firstRow.content ?? []) {
    const span = cell.attrs?.colspan ?? 1;
    const cw = cell.attrs?.colwidth;
    if (cw && cw.length === span) widths.push(...cw);
    else for (let i = 0; i < span; i++) widths.push(undefined);
  }

  if (widths.every((w) => w === undefined)) return "";

  const cols = widths
    .map((w) => `<col${styleAttr(w ? `width: ${w}px` : undefined)}>`)
    .join("");
  return `<colgroup>${cols}</colgroup>`;
}

export async function renderTableCell(
  node: TableCellNode | TableHeaderNode,
): Promise<string> {
  const tag = node.type === "tableHeader" ? "th" : "td";
  const style = node.attrs?.backgroundColor
    ? `background-color: ${node.attrs.backgroundColor}`
    : undefined;
  return `<${tag}${styleAttr(style)}${attr("colspan", node.attrs?.colspan)}${attr("rowspan", node.attrs?.rowspan)}>${await _renderBlockContent(node.content)}</${tag}>`;
}

export async function renderTableRow(node: TableRowNode): Promise<string> {
  return `<tr>${(await Promise.all((node.content ?? []).map(renderTableCell))).join("")}</tr>`;
}

export async function renderTable(node: TableNode): Promise<string> {
  return html`<div${attr(DATA_TYPE, type.tableContainer)}>
    <table>
      ${buildColgroup(node)}
      <tbody>
        ${(await Promise.all((node.content ?? []).map(renderTableRow))).join("")}
      </tbody>
    </table>
  </div>`;
}
