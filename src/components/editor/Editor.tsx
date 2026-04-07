import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { BlockSideMenu } from "./menus/BlockSideMenu";
import { BubbleToolbar } from "./menus/BubbleToolbar";
import { SlashMenu } from "./menus/SlashMenu";
import { CustomImage } from "./extensions/CustomImage";
import "./styles/editor.css";

function _Editor() {
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "editor-link",
          },
          enableClickSelection: true,
        },
      }),
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
    ],
    content: "",

    onUpdate(props) {
      localStorage.setItem(
        "editorContent",
        JSON.stringify(props.editor.getJSON()),
      );
    },

    onCreate(props) {
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
      >
        <BlockSideMenu editor={editor} containerRef={editorWrapperRef} />
        <BubbleToolbar editor={editor} />
        <SlashMenu editor={editor} />

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export const Editor = () => {
  return <_Editor />;
};
