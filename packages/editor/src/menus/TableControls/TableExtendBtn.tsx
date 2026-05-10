import { Plus } from "lucide-react";
import { useEditor } from "../../context";
import { Button } from "../../ui/button";
import { memo } from "react";
import { cn } from "../../lib/utils";
import type { TypedEditor } from "../../types";

function addRowAtEnd(editor: TypedEditor, tablePos: number) {
  const table = editor.state.doc.nodeAt(tablePos);
  if (!table) return;
  const lastCellPos = tablePos + table.nodeSize - 3;
  editor.chain().focus().setTextSelection(lastCellPos).addRowAfter().run();
}

function addColumnAtEnd(editor: TypedEditor, tablePos: number) {
  const table = editor.state.doc.nodeAt(tablePos);
  if (!table) return;
  const lastCellPos = tablePos + table.nodeSize - 3;
  editor.chain().focus().setTextSelection(lastCellPos).addColumnAfter().run();
}

export const TableEdgeAddons = memo(({ tablePos }: { tablePos: number }) => {
  const editor = useEditor();

  return (
    <>
      <Button
        variant="outline"
        onClick={() => editor && addColumnAtEnd(editor, tablePos)}
        className={cn(
          "absolute z-13 top-0 -right-6 h-full w-5 rounded-sm border-dashed transition-opacity duration-300",
          "opacity-0 group-hover/table:opacity-50 hover:opacity-100",
        )}
        aria-label="Add column"
        data-edge="col"
      >
        <Plus className="size-3" />
      </Button>

      <Button
        variant="outline"
        onClick={() => editor && addRowAtEnd(editor, tablePos)}
        className={cn(
          "absolute z-13 -bottom-6 left-0 h-5 w-full rounded-sm border-dashed transition-opacity duration-300",
          "opacity-0 group-hover/table:opacity-60 hover:opacity-100",
        )}
        aria-label="Add row"
        data-edge="row"
      >
        <Plus className="size-3" />
      </Button>
    </>
  );
});
