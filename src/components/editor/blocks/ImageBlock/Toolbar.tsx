import * as React from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Trash2,
  RefreshCcw,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/editor/ui/button";
import { Separator } from "@/components/editor/ui/separator";
import { Toggle } from "@/components/editor/ui/toggle";

type Align = "left" | "center" | "full" | "right";

interface ImageToolbarProps {
  align: Align;
  onAlignChange: (align: Align) => void;
  onReplace: () => void;
  onDelete: () => void;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
  align,
  onAlignChange,
  onReplace,
  onDelete,
}) => (
  <div
    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-lg border bg-background shadow-md"
    onMouseDown={(e) => e.preventDefault()}
  >
    <Toggle
      size="sm"
      pressed={align === "left"}
      onPressedChange={() => onAlignChange("left")}
    >
      <AlignLeft className="size-3.5" />
    </Toggle>
    <Toggle
      size="sm"
      pressed={align === "center"}
      onPressedChange={() => onAlignChange("center")}
    >
      <AlignCenter className="size-3.5" />
    </Toggle>
    <Toggle
      size="sm"
      pressed={align === "full"}
      onPressedChange={() => onAlignChange("full")}
    >
      <AlignJustify className="size-3.5" />
    </Toggle>
    <Toggle
      size="sm"
      pressed={align === "right"}
      onPressedChange={() => onAlignChange("right")}
    >
      <AlignRight className="size-3.5" />
    </Toggle>

    <Separator orientation="vertical" className="h-4 mx-1" />

    <Button
      variant="ghost"
      size="icon"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onReplace}
      title="Replace image"
    >
      <RefreshCcw className="size-3.5" />
    </Button>
    <Button
      variant="destructive"
      size="icon"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onDelete}
      title="Delete"
    >
      <Trash2 className="size-3.5" />
    </Button>
  </div>
);
