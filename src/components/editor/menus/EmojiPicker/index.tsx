import { memo, useEffect, useMemo, useRef, useState } from "react";
import useEmojiPicker from "./useEmojiPicker";
import { EmojiCateogires } from "./Categories";
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover";
import type { Editor } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { EmojiNode } from "../../extensions/Emoji";
import { PopoverArrow } from "@/components/ui/PopoverArrow";

interface EmojiPickerMenuProps {
  editor: Editor;
}

interface PickerState {
  anchor: DOMRect | null | undefined;
  open: boolean;
  query: string;
  focusedEmoji: string | null;
}

const EmojiSuggestionPluginKey = new PluginKey("emojiSuggestion");

export const EmojiPickerMenu = memo(({ editor }: EmojiPickerMenuProps) => {
  const [pickerState, setPickerState] = useState<PickerState>({
    anchor: null,
    open: false,
    query: "",
    focusedEmoji: null,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rangeRef = useRef<{ from: number; to: number } | null>(null);

  useEffect(() => {
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
            focusedEmoji: null,
          });
          rangeRef.current = props.range;
        },
        onExit() {
          setPickerState((prev) => ({
            ...prev,
            open: false,
            query: "",
          }));
        },
        onUpdate(props) {
          console.log("onUpdate", props.range, new Error().stack);
          setPickerState((prev) => ({
            ...prev,
            query: props.query,
            anchor: props.clientRect?.(),
          }));
          rangeRef.current = props.range;
        },
        onKeyDown({ event }) {
          switch (event.key) {
            case "ArrowUp":
              event.preventDefault();

              return true;
            case "ArrowDown":
              event.preventDefault();
              return true;
            case "ArrowLeft":
              event.preventDefault();
              return true;
            case "ArrowRight":
              event.preventDefault();
              return true;
            case "Enter":
              event.preventDefault();
              return true;

            default:
              return false;
          }
        },
      }),
      allow: ({ state, range }) => {
        const $from = state.doc.resolve(range.from);
        const type = state.schema.nodes[EmojiNode.name];
        const allow = !!$from.parent.type.contentMatch.matchType(type);

        return allow;
      },
    });

    editor.registerPlugin(plugin);

    return () => {
      editor.unregisterPlugin(EmojiSuggestionPluginKey);
    };
  }, []);

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
  columns?: number;
  searchQuery: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const EmojiPicker = ({
  onEmojiSelect,
  className,
  searchQuery,
  containerRef,
}: EmojiPickerProps) => {
  const { categories } = useEmojiPicker({
    onEmojiSelect,
    searchQuery,
    containerRef,
  });

  return (
    <div className={`h-full flex flex-col relative ${className}`}>
      <div
        className="flex-1 overflow-auto min-h-0"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div ref={containerRef} />
      </div>

      {searchQuery ? null : <EmojiCateogires categories={categories} />}
    </div>
  );
};
