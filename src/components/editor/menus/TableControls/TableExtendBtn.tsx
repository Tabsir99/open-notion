import { Plus } from "lucide-react";
import { editorStore } from "../../store";
import { Button } from "@/components/editor/ui/button";
import { memo } from "react";
import { cn } from "@/components/editor/lib/utils";

function addRowAtEnd(tablePos: number) {
  const { editor } = editorStore.get();
  if (!editor) return;
  const table = editor.state.doc.nodeAt(tablePos);
  if (!table) return;
  const lastCellPos = tablePos + table.nodeSize - 3;
  editor.chain().focus().setTextSelection(lastCellPos).addRowAfter().run();
}

function addColumnAtEnd(tablePos: number) {
  const { editor } = editorStore.get();
  if (!editor) return;
  const table = editor.state.doc.nodeAt(tablePos);
  if (!table) return;
  const lastCellPos = tablePos + table.nodeSize - 3;
  editor.chain().focus().setTextSelection(lastCellPos).addColumnAfter().run();
}

export const TableEdgeAddons = memo(
  ({ tablePos }: { tablePos: number }) => {
    return (
      <>
        {/* Add column — right edge */}
        <Button
          variant="outline"
          onClick={() => addColumnAtEnd(tablePos)}
          className={cn(
            "absolute z-13 top-0 -right-6 h-full w-5 rounded-sm border-dashed transition-opacity duration-300",
            "opacity-0 group-hover/table:opacity-50 hover:opacity-100",
          )}
          aria-label="Add column"
          data-edge="col"
        >
          <Plus className="size-3" />
        </Button>

        {/* Add row — bottom edge */}
        <Button
          variant="outline"
          onClick={() => addRowAtEnd(tablePos)}
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
  },
  () => true,
);
