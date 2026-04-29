import * as React from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Trash2,
  RefreshCcw,
  AlignRight,
  Lock,
  Unlock,
  RotateCcw,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import { Toggle } from "../../ui/toggle";
import type { ImageNode } from "@open-notion/serializers";

type ImageAttr = NonNullable<ImageNode["attrs"]>;

interface ImageToolbarProps {
  align: ImageAttr["align"];
  aspectLocked: boolean;
  onAlignChange: (align: ImageAttr["align"]) => void;
  onAspectLockChange: (locked: boolean) => void;
  onReset: () => void;
  onReplace: () => void;
  onDelete: () => void;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
  align,
  aspectLocked,
  onAlignChange,
  onAspectLockChange,
  onReset,
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
    {/* Alignment */}
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

    {/* Aspect ratio lock — controls edge handles (corners are always locked) */}
    <Toggle
      size="sm"
      pressed={aspectLocked}
      onPressedChange={onAspectLockChange}
      className="rounded-lg"
      title={
        aspectLocked
          ? "Unlock aspect ratio (edges)"
          : "Lock aspect ratio (edges)"
      }
    >
      {aspectLocked ? (
        <Lock className="size-3.5" />
      ) : (
        <Unlock className="size-3.5" />
      )}
    </Toggle>

    {/* Reset to natural size */}
    <Button
      variant="ghost"
      size="icon"
      className="rounded-lg h-7 w-7"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onReset}
      title="Reset to original size"
    >
      <RotateCcw className="size-3.5" />
    </Button>

    <Separator orientation="vertical" className="h-4 mx-1 opacity-40" />

    {/* Replace / Delete */}
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
