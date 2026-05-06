import { NodeViewWrapper } from "@tiptap/react";
import { memo, useCallback, useRef, useState } from "react";
import { Input } from "../../ui/input";
import { cn } from "../../lib/utils";
import { ImageEmptyState } from "./Empty";
import { ImageToolbar } from "./Toolbar";
import {
  startImageResize,
  RESIZE_HANDLES,
  type ResizeDirection,
  type Size,
} from "./resize";
import type { TypedNodeViewProps } from "../../types";

export const ImageBlock = memo(
  ({ node, updateAttributes, deleteNode }: TypedNodeViewProps<"image">) => {
    const { src, caption, align, width, height } = node.attrs;
    const imgRef = useRef<HTMLImageElement>(null);
    const containerSize = useRef<Size | null>(null);

    const [aspectLocked, setAspectLocked] = useState(false);

    const naturalSize = useRef<Size | null>(null);

    const handleImageLoad = useCallback(() => {
      const img = imgRef.current;
      if (!img) return;
      naturalSize.current = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    }, []);

    /**
     * Derive the current aspect ratio from:
     *   1. Current rendered size (most accurate if already resized), or
     *   2. Natural image dimensions (fallback on first drag before any resize).
     */
    const getAspectRatio = useCallback((): number => {
      const img = imgRef.current;
      if (!img) return 0;

      const w = img.offsetWidth;
      const h = img.offsetHeight;
      if (w > 0 && h > 0) return w / h;

      const nat = naturalSize.current;
      if (nat && nat.height > 0) return nat.width / nat.height;

      return 0;
    }, []);

    const onResizeStart = useCallback(
      (e: React.MouseEvent, direction: ResizeDirection) => {
        if (!imgRef.current) return;
        startImageResize({
          direction,
          event: e,
          element: imgRef.current,
          aspectRatio: getAspectRatio(),
          locked: aspectLocked,
          onEnd: (size) => updateAttributes(size),
          containerSize: containerSize.current!,
        });
      },
      [updateAttributes, aspectLocked, getAspectRatio, containerSize],
    );

    const handleReset = useCallback(() => {
      updateAttributes({ width: undefined, height: undefined });
      if (imgRef.current) {
        imgRef.current.style.width = "";
        imgRef.current.style.height = "";
      }
    }, [updateAttributes]);

    const containerRef = useCallback((el: HTMLDivElement | null) => {
      if (!el) return;

      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        containerSize.current = { width, height };
      });

      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    if (!src) {
      return (
        <NodeViewWrapper as="div" className="w-full">
          <ImageEmptyState onSrcChange={(src) => updateAttributes({ src })} />
        </NodeViewWrapper>
      );
    }

    const isFullWidth = align === "full";

    return (
      <NodeViewWrapper
        as="div"
        className={cn(
          "relative flex flex-col",
          align === "center"
            ? "items-center"
            : align === "left"
              ? "items-start"
              : align === "right"
                ? "items-end"
                : "items-stretch",
        )}
        ref={containerRef}
      >
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
            onLoad={handleImageLoad}
            className={cn(
              "rounded-xl select-none block",
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

          {!isFullWidth &&
            RESIZE_HANDLES.map(({ dir, className }) => (
              <div
                key={dir}
                onMouseDown={(e) => onResizeStart(e, dir)}
                className={cn("absolute z-10 rounded-sm", className)}
              />
            ))}

          <div
            className="
            pointer-events-none opacity-0 translate-y-1.5
            transition-all duration-150 ease-out
            group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0
          "
          >
            <ImageToolbar
              align={align}
              aspectLocked={aspectLocked}
              onAlignChange={(align) => updateAttributes({ align })}
              onAspectLockChange={setAspectLocked}
              onReset={handleReset}
              onReplace={() =>
                updateAttributes({
                  src: null,
                  width: undefined,
                  height: undefined,
                })
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
  },
  (p, n) => p.node.attrs === n.node.attrs,
);
