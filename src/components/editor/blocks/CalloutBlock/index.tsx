import { memo, useCallback, useRef, useState } from "react";
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getEmojiData } from "../../menus/EmojiPicker/data";
import { CALLOUT_COLORS, type CalloutColor } from "../../extensions/Callout";
import {
  createEmojiGrid,
  type EmojiGridApi,
} from "../../menus/EmojiPicker/createEmojiGrid";

// ── Color swatch ──────────────────────────────────────────────────────────

const COLOR_MAP: Record<CalloutColor, string> = {
  default: "bg-accent/40 border-accent/30",
  info: "bg-blue-500/10 border-blue-500/25",
  warning: "bg-amber-500/10 border-amber-500/25",
  success: "bg-emerald-500/10 border-emerald-500/25",
  danger: "bg-red-500/10 border-red-500/25",
  note: "bg-violet-500/10 border-violet-500/25",
};

// ── Main Block ────────────────────────────────────────────────────────────

export const CalloutBlock: React.FC<NodeViewProps> = memo(
  ({ node, updateAttributes }) => {
    const { emoji, color } = node.attrs;
    const [emojiOpen, setEmojiOpen] = useState(false);

    const handleEmoji = useCallback(
      (shortcode: string) => {
        const data = getEmojiData();
        if (!data) return;
        const e = data.emojis[shortcode];
        if (e) {
          updateAttributes({ emoji: e.unicode });
        }
        setEmojiOpen(false);
      },
      [updateAttributes],
    );

    const handleColor = useCallback(
      (c: CalloutColor) => {
        updateAttributes({ color: c });
      },
      [updateAttributes],
    );

    return (
      <NodeViewWrapper as="div" className="my-2">
        <div
          className={cn(
            "flex gap-3 rounded-lg border px-4 py-3 transition-colors",
            COLOR_MAP[color as CalloutColor] || COLOR_MAP.default,
          )}
        >
          {/* Emoji trigger */}
          <div contentEditable={false} className="shrink-0 pt-0.5">
            <EmojiPopover
              open={emojiOpen}
              onOpenChange={setEmojiOpen}
              currentEmoji={emoji}
              onSelect={handleEmoji}
            />
          </div>

          {/* Rich content */}
          <div className="min-w-0 flex-1">
            <NodeViewContent as="div" className="outline-none" />
          </div>
        </div>

        {/* Color picker row */}
        <div contentEditable={false} className="mt-1.5 flex gap-1 px-1">
          {CALLOUT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleColor(c.id)}
              className={cn(
                "size-5 rounded-full border transition-all",
                color === c.id
                  ? "border-foreground/40 scale-110"
                  : "border-transparent opacity-50 hover:opacity-80",
                c.id === "default" && "bg-accent",
                c.id === "info" && "bg-blue-500",
                c.id === "warning" && "bg-amber-500",
                c.id === "success" && "bg-emerald-500",
                c.id === "danger" && "bg-red-500",
                c.id === "note" && "bg-violet-500",
              )}
            />
          ))}
        </div>
      </NodeViewWrapper>
    );
  },
);

CalloutBlock.displayName = "CalloutBlock";

// ── Inline Emoji Popover ──────────────────────────────────────────────────

interface EmojiPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmoji: string;
  onSelect: (shortcode: string) => void;
}

const EmojiPopover = memo(
  ({ open, onOpenChange, currentEmoji, onSelect }: EmojiPopoverProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gridApiRef = useRef<EmojiGridApi | null>(null);

    const setContainer = useCallback((node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (node) {
        gridApiRef.current = createEmojiGrid(node);
      } else {
        gridApiRef.current?.reset();
        gridApiRef.current = null;
      }
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const api = gridApiRef.current;
        if (!api) return;

        if (e.key === "Enter") {
          e.preventDefault();
          const btn = api.getFocusedButton();
          const img = btn?.querySelector("img");
          const data = getEmojiData();
          if (img && data) {
            const shortcode = data.emojis[img.id]?.shortcodes?.[0];
            if (shortcode) onSelect(shortcode);
          }
          return;
        }

        const handled = api.handleKey(e.nativeEvent);
        if (handled) e.preventDefault();
      },
      [onSelect],
    );

    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="text-xl leading-none hover:bg-foreground/10 rounded-md p-0.5 transition-colors"
            />
          }
        >
          <span className="text-xl leading-none">{currentEmoji}</span>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          className="w-80 h-72 p-0 overflow-hidden rounded-xl shadow-xl"
          onKeyDown={handleKeyDown}
        >
          <div
            ref={setContainer}
            className="h-full overflow-auto"
            style={{ scrollbarWidth: "none" }}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

EmojiPopover.displayName = "EmojiPopover";
