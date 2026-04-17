import * as React from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/editor/ui/input";
import { cn } from "@/components/editor/lib/utils";
import { ImageEmptyState } from "./Empty";
import { ImageToolbar } from "./Toolbar";

export const ImageBlock: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const { src, caption, align } = node.attrs;

  if (!src) {
    return (
      <NodeViewWrapper as="div" className="w-full my-2">
        <ImageEmptyState onSrcChange={(src) => updateAttributes({ src })} />
      </NodeViewWrapper>
    );
  }

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
      <div className={cn(align === "full" && "w-full")}>
        <div className="group relative">
          <img
            src={src}
            alt={caption || "Image"}
            className={cn(
              "rounded-lg max-h-[600px] object-contain transition-all",
              align === "full" && "w-full",
            )}
            draggable={false}
          />

          <div
            className="
            pointer-events-none opacity-0 translate-y-1
            transition-all duration-150 ease-out
            group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0
          "
          >
            <ImageToolbar
              align={align}
              onAlignChange={(align) => updateAttributes({ align })}
              onReplace={() => updateAttributes({ src: null })}
              onDelete={deleteNode}
            />
          </div>
        </div>

        <Input
          type="text"
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Write a caption…"
          className="text-center border-none focus-visible:ring-0 mt-2 w-full "
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};
