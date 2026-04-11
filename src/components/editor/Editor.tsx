import { use, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { BlockSideMenu } from "./menus/BlockSideMenu";
import { BubbleMenu } from "./menus/BubbleMenu";
import { SlashMenu } from "./menus/SlashMenu";
import { CustomImage } from "./extensions/CustomImage";
import { CustomCodeBlock } from "./extensions/CustomCodeBlock";
import "./styles/editor.css";
import { EmojiNode } from "./extensions/Emoji";
import { EmojiPicker } from "./menus/EmojiPicker";
import {
  getEmojiArray,
  loadEmojiData,
} from "./menus/EmojiPicker/createEmojipicker/data";
import { Callout } from "./extensions/Callout";

const dataPromise = (async () => {
  await loadEmojiData();
  return getEmojiArray();
})();
function _Editor() {
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const emojis = use(dataPromise);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "editor-link",
          },
          enableClickSelection: true,
        },
      }),
      CustomCodeBlock,
      Callout,
      TaskList,
      TaskItem,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
          }
          if (node.type.name === "paragraph") {
            return "Type '/' for commands...";
          }
          return "";
        },
      }),
      CustomImage,
      EmojiNode.configure({ emojis }),
    ],
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
  return <_Editor />;
};
