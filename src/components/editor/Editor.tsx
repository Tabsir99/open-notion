import "./styles/editor.css";
import { Suspense, use } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BlockSideMenu } from "./menus/BlockSideMenu";
import { BubbleMenu } from "./menus/BubbleMenu";
import { SlashMenu } from "./menus/SlashMenu";
import { EmojiPicker } from "./menus/EmojiPicker";
import { TableControls } from "./menus/TableControls";
import {
  getEmojiArray,
  loadEmojiData,
} from "./menus/EmojiPicker/createEmojipicker/data";
import { defaultExtensions } from "./extensions";
import { editorStore } from "./store";
import type { TypedEditor } from "./types";

const dataPromise = (async () => {
  await loadEmojiData("/emoji.json");
  return getEmojiArray();
})();

function _Editor() {
  const emojis = use(dataPromise);

  const editor = useEditor({
    extensions: defaultExtensions(emojis),
    content: "",
    immediatelyRender: false,

    onSelectionUpdate(props) {
      const { from } = props.editor.state.selection;
      localStorage.setItem("editorCursor", String(from));
    },

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
      const savedCursor = localStorage.getItem("editorCursor");

      if (savedContent) {
        props.editor.commands.setContent(JSON.parse(savedContent));

        if (savedCursor) {
          props.editor.commands.setTextSelection(Number(savedCursor));
        }
      }
    },
  }) as TypedEditor | null;

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full flex justify-center pt-20">
      <div
        ref={(el) => {
          editorStore.set({ editor, editorContainer: el });
        }}
        className="relative w-full max-w-4xl min-h-svh cursor-text bg-background border border-border"
        onClick={() => editor.chain().focus().run()}
      >
        <BlockSideMenu />
        <BubbleMenu editor={editor} />
        <SlashMenu />
        <EmojiPicker />
        <TableControls />

        <EditorContent editor={editor as any} />
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
