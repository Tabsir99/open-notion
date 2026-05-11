import { memo, useCallback, useRef, useState } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { Popover, PopoverContent, PopoverTitle } from "../../ui/popover";
import { createEmojiPicker } from "../../menus/EmojiPicker/createEmojipicker";
import { PopoverArrow } from "../../ui/PopoverArrow";
import { getRuntime } from "../../runtime";
import { shortcodeToEmoji } from "../../extensions/helpers/shortcodeToEmoji";
import { getEmojiArray } from "../../menus/EmojiPicker/createEmojipicker/data";
import type { TypedNodeViewProps } from "../../types";

export const CalloutView = memo(
  ({ node, updateAttributes, editor }: TypedNodeViewProps<"callout">) => {
    const [pickerOpen, setPickerOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const getEmojiUrl = getRuntime(editor).get().getEmojiUrl;

    const setContainer = useCallback(
      (el: HTMLDivElement | null) => {
        if (!el) return;
        const api = createEmojiPicker(el, {
          getEmojiUrl,
          onSelect: (emoji, id) => {
            updateAttributes({ emoji, hexId: id });
            setPickerOpen(false);
            editor.commands.focus();
          },
        });
        api.renderAll();
        return () => api.destroy();
      },
      [updateAttributes, editor, getEmojiUrl],
    );

    const emoji = shortcodeToEmoji(node.attrs.emoji, getEmojiArray());

    const { backgroundColor, textColor, fontSize, fontFamily } = node.attrs;

    return (
      <NodeViewWrapper
        as="div"
        data-type="callout"
        style={{
          backgroundColor,
          color: textColor,
          fontSize,
          fontFamily,
        }}
      >
        <button
          ref={btnRef}
          type="button"
          data-type="emoji"
          contentEditable={false}
          onClick={() => setPickerOpen((p) => !p)}
          className="hover:bg-foreground/5 rounded-md cursor-pointer"
        >
          <img
            src={getEmojiUrl(emoji?.id ?? "1f4ac", "callout-icon")}
            draggable="false"
            loading="lazy"
            alt={`${emoji?.name} emoji`}
          />
        </button>

        <NodeViewContent as="div" />

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverContent
            initialFocus={false}
            finalFocus={false}
            anchor={btnRef}
            sideOffset={24}
            side="right"
            align="center"
            className="w-lg h-120 p-0 flex flex-col gap-0 duration-200 ease-in overflow-visible shadow-2xl transition-all"
          >
            <PopoverTitle className="sr-only">Emoji Picker</PopoverTitle>
            <div ref={setContainer} />
            <PopoverArrow facing="left" align="center" size={18} />
          </PopoverContent>
        </Popover>
      </NodeViewWrapper>
    );
  },
  (p, n) => p.node === n.node || p.node.attrs === n.node.attrs,
);
