import { NodeViewWrapper } from "@tiptap/react";
import { useCallback, useRef } from "react";
import { Input } from "@/components/editor/ui/input";
import { cn } from "@/components/editor/lib/utils";
import { ImageEmptyState } from "./Empty";
import { ImageToolbar } from "./Toolbar";
import {
  startImageResize,
  RESIZE_HANDLES,
  type ResizeDirection,
} from "./resize";
import type { TypedNodeViewProps } from "../../types";

export const ImageBlock = ({
  node,
  updateAttributes,
  deleteNode,
}: TypedNodeViewProps<"image">) => {
  const { src, caption, align, width, height } = node.attrs;
  const imgRef = useRef<HTMLImageElement>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (!imgRef.current) return;
      startImageResize({
        direction,
        event: e,
        element: imgRef.current,
        onEnd: (size) => updateAttributes(size),
      });
    },
    [updateAttributes],
  );

  if (!src) {
    return (
      <NodeViewWrapper as="div" className="w-full my-2">
        <ImageEmptyState onSrcChange={(src) => updateAttributes({ src })} />
      </NodeViewWrapper>
    );
  }

  const hasExplicitSize = width != null || height != null;
  const isFullWidth = align === "full";

  return (
    <NodeViewWrapper
      as="div"
      className={cn(
        "relative my-2 flex flex-col",
        align === "center"
          ? "items-center"
          : align === "left"
            ? "items-start"
            : align === "right"
              ? "items-end"
              : "items-stretch",
      )}
    >
      {/* Subtle selection ring lives on this wrapper so it doesn't clip the image */}
      <div
        className={cn(
          "group relative inline-block rounded-xl",
          isFullWidth && "w-full",
        )}
      >
        <img
          ref={imgRef}
          src={src}
          alt={caption || "Image"}
          className={cn(
            "rounded-xl select-none block",
            !hasExplicitSize && "max-h-[600px] object-contain",
            isFullWidth && "w-full",
          )}
          style={
            isFullWidth
              ? {}
              : {
                  width: width ?? undefined,
                  height: height ?? undefined,
                }
          }
          draggable={false}
        />

        {/* Resize handles — hidden entirely when full-width */}
        {!isFullWidth &&
          RESIZE_HANDLES.map(({ dir, className }) => (
            <div
              key={dir}
              onMouseDown={(e) => onResizeStart(e, dir)}
              className={cn("absolute z-10 rounded-sm", className)}
            />
          ))}

        {/* Toolbar — fades up on hover */}
        <div
          className="
            pointer-events-none opacity-0 translate-y-1.5
            transition-all duration-150 ease-out
            group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0
          "
        >
          <ImageToolbar
            align={align}
            onAlignChange={(align) => updateAttributes({ align })}
            onReplace={() =>
              updateAttributes({ src: null, width: "", height: "" })
            }
            onDelete={deleteNode}
          />
        </div>
      </div>

      <Input
        type="text"
        value={caption ?? ""}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        placeholder="Write a caption…"
        className="text-center border-none focus-visible:ring-0 mt-2 w-full text-sm text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
      />
    </NodeViewWrapper>
  );
};
