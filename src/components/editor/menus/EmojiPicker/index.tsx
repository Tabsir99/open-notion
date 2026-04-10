import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmojiPicker from "./useEmojiPicker";
import { EmojiCateogires } from "./Categories";
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover";
import type { Editor } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { EmojiNode } from "../../extensions/Emoji";
import { PopoverArrow } from "@/components/ui/PopoverArrow";
import { getEmojiData } from "./data";
import { createEmojiGrid, type EmojiGridApi } from "./createEmojiGrid";

interface EmojiPickerMenuProps {
  editor: Editor;
}

interface PickerState {
  anchor: DOMRect | null | undefined;
  open: boolean;
  query: string;
}

const EmojiSuggestionPluginKey = new PluginKey("emojiSuggestion");

export const EmojiPickerMenu = memo(({ editor }: EmojiPickerMenuProps) => {
  const [pickerState, setPickerState] = useState<PickerState>({
    anchor: null,
    open: false,
    query: "",
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rangeRef = useRef<{ from: number; to: number } | null>(null);
  const gridApiRef = useRef<EmojiGridApi | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      gridApiRef.current = createEmojiGrid(containerRef.current);
    }

    const plugin = Suggestion({
      editor,
      char: ":",
      pluginKey: EmojiSuggestionPluginKey,
      render: () => ({
        onStart(props) {
          setPickerState({
            anchor: props.clientRect?.(),
            open: true,
            query: props.query,
          });
          rangeRef.current = props.range;
        },

        onExit() {
          setPickerState((prev) => ({ ...prev, open: false, query: "" }));
          gridApiRef.current?.reset();
          rangeRef.current = null;
        },

        onUpdate(props) {
          setPickerState((prev) => ({
            ...prev,
            query: props.query,
            anchor: props.clientRect?.(),
          }));
          rangeRef.current = props.range;
        },

        onKeyDown: ({ event }) => {
          const api = gridApiRef.current;
          if (!api) return false;

          if (event.key === "Enter") {
            event.preventDefault();
            const btn = api.getFocusedButton();
            const range = rangeRef.current;
            if (!btn || !range) return true;

            const img = btn.querySelector("img");
            const shortcode =
              img && getEmojiData()?.emojis[img.id]?.shortcodes[0];
            if (shortcode) {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .setEmoji(shortcode)
                .run();
            }
            return true;
          }

          return api.handleKey(event) ?? false;
        },
      }),
      allow: ({ state, range }) => {
        const $from = state.doc.resolve(range.from);
        const type = state.schema.nodes[EmojiNode.name];
        return !!$from.parent.type.contentMatch.matchType(type);
      },
    });

    editor.registerPlugin(plugin);

    return () => {
      editor.unregisterPlugin(EmojiSuggestionPluginKey);
      gridApiRef.current?.reset();
      gridApiRef.current = null;
    };
  }, [editor]);

  const anchor = useMemo(
    () => ({
      getBoundingClientRect: () => pickerState.anchor ?? new DOMRect(),
    }),
    [pickerState.anchor],
  );

  return (
    <Popover
      open={pickerState.open}
      onOpenChange={() => setPickerState({ ...pickerState, open: false })}
    >
      <PopoverContent
        initialFocus={false}
        finalFocus={false}
        anchor={anchor}
        sideOffset={24}
        side="right"
        align="center"
        className="w-lg h-120 p-0 flex flex-col gap-0 duration-200 ease-in overflow-visible shadow-2xl transition-all"
      >
        <PopoverTitle className="sr-only">Emoji Picker</PopoverTitle>

        {/* EmojiPicker - takes remaining space */}
        <div className="flex-1 min-h-0 relative">
          <EmojiPicker
            onEmojiSelect={(shortcode) => {
              editor
                .chain()
                .focus()
                .deleteRange(rangeRef.current!)
                .setEmoji(shortcode)
                .run();
            }}
            searchQuery={pickerState.query}
            containerRef={containerRef}
            gridApiRef={gridApiRef}
          />
        </div>

        <PopoverArrow facing="left" align="center" size={18} />
      </PopoverContent>
    </Popover>
  );
});

interface EmojiPickerProps {
  onEmojiSelect: (emojiId: string) => void;
  className?: string;
  searchQuery: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridApiRef: React.RefObject<EmojiGridApi | null>;
}

const EmojiPicker = ({
  onEmojiSelect,
  className,
  searchQuery,
  containerRef,
  gridApiRef,
}: EmojiPickerProps) => {
  const { recentEmojis } = useEmojiPicker({
    onEmojiSelect,
    searchQuery,
    containerRef,
    gridApiRef,
  });

  const setContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node) {
      gridApiRef.current = createEmojiGrid(node);
    } else {
      gridApiRef.current?.reset();
      gridApiRef.current = null;
    }
  }, []);

  return (
    <div className={`h-full flex flex-col relative ${className}`}>
      <div
        className="flex-1 overflow-auto min-h-0"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div ref={setContainer} />
      </div>

      {searchQuery ? null : (
        <EmojiCateogires hasRecent={recentEmojis.length > 0} />
      )}
    </div>
  );
};
