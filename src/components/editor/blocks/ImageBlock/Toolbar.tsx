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
import type { ImageNode } from "../../jsonContent";

type ImageAttr = NonNullable<ImageNode["attrs"]>;
interface ImageToolbarProps {
  align: ImageAttr["align"];
  onAlignChange: (align: ImageAttr["align"]) => void;
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
    className={[
      "absolute bottom-3 left-1/2 -translate-x-1/2 z-20",
      "flex items-center gap-0.5 px-1.5 py-1",
      "rounded-xl border border-white/20",
      "bg-background/70 backdrop-blur-md",
      "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.05)_inset]",
    ].join(" ")}
    onMouseDown={(e) => e.preventDefault()}
  >
    <Toggle
      size="sm"
      pressed={align === "left"}
      onPressedChange={() => onAlignChange("left")}
      className="rounded-lg"
    >
      <AlignLeft className="size-3.5" />
    </Toggle>
    <Toggle
      size="sm"
      pressed={align === "center"}
      onPressedChange={() => onAlignChange("center")}
      className="rounded-lg"
    >
      <AlignCenter className="size-3.5" />
    </Toggle>
    <Toggle
      size="sm"
      pressed={align === "full"}
      onPressedChange={() => onAlignChange("full")}
      className="rounded-lg"
    >
      <AlignJustify className="size-3.5" />
    </Toggle>
    <Toggle
      size="sm"
      pressed={align === "right"}
      onPressedChange={() => onAlignChange("right")}
      className="rounded-lg"
    >
      <AlignRight className="size-3.5" />
    </Toggle>

    <Separator orientation="vertical" className="h-4 mx-1 opacity-40" />

    <Button
      variant="ghost"
      size="icon"
      className="rounded-lg h-7 w-7"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onReplace}
      title="Replace image"
    >
      <RefreshCcw className="size-3.5" />
    </Button>
    <Button
      variant="destructive"
      size="icon"
      className="rounded-lg h-7 w-7"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onDelete}
      title="Delete"
    >
      <Trash2 className="size-3.5" />
    </Button>
  </div>
);
