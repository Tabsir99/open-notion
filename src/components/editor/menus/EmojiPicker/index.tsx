import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover";
import type { Editor } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { EmojiNode } from "../../extensions/Emoji";
import { PopoverArrow } from "@/components/ui/PopoverArrow";
import { createEmojiPicker, type EmojiPickerApi } from "./createEmojiPicker";

interface EmojiPickerProps {
  editor: Editor;
}

const EmojiSuggestionPluginKey = new PluginKey("emojiSuggestion");

export const EmojiPicker = memo(({ editor }: EmojiPickerProps) => {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [open, setOpen] = useState(false);

  const apiRef = useRef<EmojiPickerApi | null>(null);
  const rangeRef = useRef<{ from: number; to: number } | null>(null);

  const insertEmoji = useCallback(
    (shortcode: string) => {
      if (!rangeRef.current) return;
      editor
        .chain()
        .focus()
        .deleteRange(rangeRef.current)
        .setEmoji(shortcode)
        .run();
    },
    [editor],
  );

  const setContainer = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        apiRef.current = createEmojiPicker(node, { onSelect: insertEmoji });
        apiRef.current.renderAll();
      } else {
        apiRef.current?.destroy();
        apiRef.current = null;
      }
    },
    [insertEmoji],
  );

  useEffect(() => {
    const plugin = Suggestion({
      editor,
      char: ":",
      pluginKey: EmojiSuggestionPluginKey,
      render: () => ({
        onStart(props) {
          setAnchor(props.clientRect?.() ?? null);
          setOpen(true);
          rangeRef.current = props.range;
          if (props.query) apiRef.current?.renderFiltered(props.query);
          else apiRef.current?.renderAll();
        },
        onUpdate(props) {
          setAnchor(props.clientRect?.() ?? null);
          rangeRef.current = props.range;
          if (props.query) apiRef.current?.renderFiltered(props.query);
          else apiRef.current?.renderAll();
        },
        onExit() {
          setOpen(false);
          rangeRef.current = null;
        },
        onKeyDown: ({ event }) => apiRef.current?.handleKey(event) ?? false,
      }),
      allow: ({ state, range }) => {
        const $from = state.doc.resolve(range.from);
        const type = state.schema.nodes[EmojiNode.name];
        return !!$from.parent.type.contentMatch.matchType(type);
      },
    });

    editor.registerPlugin(plugin, (p, plugins) => [p, ...plugins]);
    return () => {
      editor.unregisterPlugin(EmojiSuggestionPluginKey);
    };
  }, [editor]);

  const virtualAnchor = useMemo(
    () => ({ getBoundingClientRect: () => anchor ?? new DOMRect() }),
    [anchor],
  );

  return (
    <Popover open={open} onOpenChange={() => setOpen(false)}>
      <PopoverContent
        initialFocus={false}
        finalFocus={false}
        anchor={virtualAnchor}
        sideOffset={24}
        side="right"
        align="center"
        className="w-lg h-120 p-0 flex flex-col gap-0 duration-200 ease-in overflow-visible shadow-2xl transition-all"
      >
        <PopoverTitle className="sr-only">Emoji Picker</PopoverTitle>
        <div className="flex-1 min-h-0 relative" ref={setContainer} />
        <PopoverArrow facing="left" align="center" size={18} />
      </PopoverContent>
    </Popover>
  );
});
