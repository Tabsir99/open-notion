import "./styles/editor.css";
import { Suspense, use, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BlockSideMenu } from "./menus/BlockSideMenu";
import { BubbleMenu } from "./menus/BubbleMenu";
import { SlashMenu } from "./menus/SlashMenu";
import { EmojiPicker } from "./menus/EmojiPicker";
import {
  getEmojiArray,
  loadEmojiData,
} from "./menus/EmojiPicker/createEmojipicker/data";
import { getExtensions } from "./extensions";

const dataPromise = (async () => {
  await loadEmojiData();
  return getEmojiArray();
})();
function _Editor() {
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const emojis = use(dataPromise);

  const editor = useEditor({
    extensions: getExtensions({ emojis }),
    content: "",
    immediatelyRender: false,

    onUpdate(props) {
      localStorage.setItem(
        "editorContent",
        JSON.stringify(props.editor.getJSON()),
      );
    },

    autofocus: true,

    async onCreate(props) {
      props.editor.commands.focus();
      const savedContent = localStorage.getItem("editorContent");
      if (savedContent) {
        props.editor.commands.setContent(JSON.parse(savedContent));
      }
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full flex justify-center pt-20">
      <div
        ref={editorWrapperRef}
        className="relative w-full max-w-4xl min-h-svh cursor-text bg-background border border-border
             "
        onClick={() => editor.chain().focus().run()}
      >
        <BlockSideMenu editor={editor} containerRef={editorWrapperRef} />
        <BubbleMenu editor={editor} />
        <SlashMenu editor={editor} />
        <EmojiPicker editor={editor} />

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export const Editor = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <_Editor />
    </Suspense>
  );
};
