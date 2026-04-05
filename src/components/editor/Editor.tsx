import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { EditorProvider } from "./EditorProvider";
import "./styles/editor.css";

export function Editor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
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
    ],
    content: "",
  });

  if (!editor) {
    return null;
  }

  return (
    <EditorProvider editor={editor}>
      <div className="w-full flex justify-center py-12">
        <div
          className="w-full max-w-[800px] min-h-screen bg-zinc-950 rounded-lg border
         border-zinc-800/70 hover:border-zinc-800 transition-colors cursor-text"
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </EditorProvider>
  );
}
