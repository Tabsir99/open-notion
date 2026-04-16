import "./styles.css";
import { useCallback, useRef, useState } from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover";
import { createEmojiPicker } from "../../menus/EmojiPicker/createEmojipicker"; // adjust import path
import { PopoverArrow } from "@/components/ui/PopoverArrow";
import { getEmojiUrl } from "../../menus/EmojiPicker/getEmojiUrl";
import { shortcodeToEmoji } from "../../extensions/helpers/shortcodeToEmoji";
import { getEmojiArray } from "../../menus/EmojiPicker/createEmojipicker/data";

export function CalloutView({ node, updateAttributes, editor }: NodeViewProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const setContainer = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const api = createEmojiPicker(el, {
        onSelect: (emoji: string) => {
          updateAttributes({ emoji });
          setPickerOpen(false);
          editor.commands.focus();
        },
      });
      api.renderAll();
      return () => api.destroy();
    },
    [updateAttributes, editor],
  );

  const emoji = shortcodeToEmoji(node.attrs.emoji, getEmojiArray());

  const { backgroundColor, textColor, fontSize, fontFamily } = node.attrs;

  return (
    <NodeViewWrapper
      data-callout=""
      className="callout"
      as="div"
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
        contentEditable={false}
        suppressContentEditableWarning
        className="callout-emoji"
        onClick={() => setPickerOpen((p) => !p)}
      >
        <img
          src={getEmojiUrl(emoji?.id!)}
          draggable="false"
          loading="lazy"
          alt={`${emoji?.name} emoji`}
          className="w-5 h-5"
        />
      </button>

      <NodeViewContent className="callout-content" />

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
}
