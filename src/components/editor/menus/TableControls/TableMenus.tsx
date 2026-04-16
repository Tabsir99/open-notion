import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ArrowDownToLine,
  Copy,
  Eraser,
  Trash2,
  Palette,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ColorMenu } from "../ColorMenu";
import {
  duplicateColumn,
  clearColumn,
  clearRow,
  clearCell,
  setCellBgsForColumn,
  setCellBgsForRow,
} from "./tableActions";
import type { FocusedCell } from "./useTableFocus";
import { editorStore } from "../../store";
import type {} from "@tiptap/core";
import type { TypedEditor } from "../../types";

const ITEM = "flex items-center gap-2 h-8 px-2";

// ── Helpers ────────────────────────────────────────────────────────────

function act(fn: (ed: TypedEditor) => void, onClose: () => void) {
  const { editor } = editorStore.get();
  if (!editor) return;
  fn(editor);
  editor.commands.focus();
  onClose();
}

interface ItemDef {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "destructive";
}

function Items({ items }: { items: (ItemDef | "sep")[] }) {
  return items.map((item, i) =>
    item === "sep" ? (
      <DropdownMenuSeparator key={i} />
    ) : (
      <DropdownMenuItem
        key={i}
        variant={item.variant}
        className={ITEM}
        onClick={item.onClick}
      >
        <item.icon className="size-4" /> {item.label}
      </DropdownMenuItem>
    ),
  );
}

function ColorTrigger() {
  return (
    <div className={ITEM}>
      <Palette className="size-4" /> Color
    </div>
  );
}

// ── Menus ───────────────────────────────────────────────────────────────

interface MenuProps {
  focused: FocusedCell;
  onClose: () => void;
}

export function ColMenu({ focused, onClose }: MenuProps) {
  const a = (fn: (ed: TypedEditor) => void) => act(fn, onClose);
  const chain = (ed: TypedEditor) =>
    ed.chain().focus().setTextSelection(focused.cellPosInDoc);

  return (
    <DropdownMenuContent
      side="bottom"
      align="center"
      sideOffset={4}
      className="w-[200px]"
    >
      <Items
        items={[
          {
            icon: ArrowLeftToLine,
            label: "Insert column left",
            onClick: () => a((ed) => chain(ed).addColumnBefore().run()),
          },
          {
            icon: ArrowRightToLine,
            label: "Insert column right",
            onClick: () => a((ed) => chain(ed).addColumnAfter().run()),
          },
          {
            icon: Copy,
            label: "Duplicate column",
            onClick: () => duplicateColumn(focused.tablePos, focused.colIndex),
          },
          "sep",
        ]}
      />
      <ColorMenu
        isSubMenu
        onSelectBg={(c) =>
          setCellBgsForColumn(focused.tablePos, focused.colIndex, c)
        }
      >
        <ColorTrigger />
      </ColorMenu>
      <DropdownMenuSeparator />
      <Items
        items={[
          {
            icon: Eraser,
            label: "Clear column",
            onClick: () => clearColumn(focused.tablePos, focused.colIndex),
          },
          {
            icon: Trash2,
            label: "Delete column",
            variant: "destructive",
            onClick: () => a((ed) => chain(ed).deleteColumn().run()),
          },
        ]}
      />
    </DropdownMenuContent>
  );
}

export function RowMenu({ focused, onClose }: MenuProps) {
  const a = (fn: (ed: TypedEditor) => void) => act(fn, onClose);
  const chain = (ed: TypedEditor) =>
    ed.chain().focus().setTextSelection(focused.cellPosInDoc);

  return (
    <DropdownMenuContent
      side="right"
      align="center"
      sideOffset={4}
      className="w-[200px]"
    >
      <Items
        items={[
          {
            icon: ArrowUpToLine,
            label: "Insert row above",
            onClick: () => a((ed) => chain(ed).addRowBefore().run()),
          },
          {
            icon: ArrowDownToLine,
            label: "Insert row below",
            onClick: () => a((ed) => chain(ed).addRowAfter().run()),
          },
          "sep",
        ]}
      />
      <ColorMenu
        isSubMenu
        onSelectBg={(c) =>
          setCellBgsForRow(focused.tablePos, focused.rowIndex, c)
        }
      >
        <ColorTrigger />
      </ColorMenu>
      <DropdownMenuSeparator />
      <Items
        items={[
          {
            icon: Eraser,
            label: "Clear row",
            onClick: () => clearRow(focused.tablePos, focused.rowIndex),
          },
          {
            icon: Trash2,
            label: "Delete row",
            variant: "destructive",
            onClick: () => a((ed) => chain(ed).deleteRow().run()),
          },
        ]}
      />
    </DropdownMenuContent>
  );
}

export function CellMenu({ focused, onClose }: MenuProps) {
  const a = (fn: (ed: TypedEditor) => void) => act(fn, onClose);

  return (
    <DropdownMenuContent
      side="right"
      align="center"
      sideOffset={4}
      className="w-[200px]"
    >
      <ColorMenu
        isSubMenu
        onSelectBg={(c) =>
          a((ed) =>
            ed
              .chain()
              .focus()
              .setTextSelection(focused.cellPosInDoc)
              .setCellAttribute("backgroundColor", c)
              .run(),
          )
        }
        onSelectText={(c) =>
          a((ed) => {
            const cellPos = focused.cellPosInDoc - 1;
            const cellNode = ed.state.doc.nodeAt(cellPos);
            if (!cellNode) return;
            const chain = ed
              .chain()
              .focus()
              .setTextSelection({
                from: focused.cellPosInDoc,
                to: cellPos + cellNode.nodeSize - 1,
              });
            c ? chain.setColor(c).run() : chain.unsetColor().run();
          })
        }
      >
        <ColorTrigger />
      </ColorMenu>
      <DropdownMenuSeparator />
      <Items
        items={[
          {
            icon: Eraser,
            label: "Clear cell",
            onClick: () =>
              clearCell(focused.tablePos, focused.rowIndex, focused.colIndex),
          },
        ]}
      />
    </DropdownMenuContent>
  );
}
