import { useState, useEffect, useMemo, memo, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
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
import { setEditorConfig, getEditorConfig, type GetEmojiUrl } from "./config";
import { defaultSlashItems } from "./menus/SlashMenu/slash-items";
import { defaultTurnIntoItems } from "./menus/TurnIntoMenu/items";
import { getEmojiUrl as twemojiGetEmojiUrl } from "./menus/EmojiPicker/getEmojiUrl";
import { cn } from "./lib/utils";
import type { TypedEditor } from "./types";

import {
  docToHTML,
  docToMarkdown,
  docToText,
  type DocContent,
} from "@open-notion/serializers";
import { version, name } from "@open-notion/assets/package.json";

export interface OpenNotionOptions {
  /** Initial document content (JSON). Only applied on mount. */
  content: DocContent;

  /** Called whenever the document changes. */
  onChange: (json: DocContent) => void;

  /** Called once when the editor is ready. */
  onReady: (editor: Editor) => void;

  /** Called when the selection changes. */
  onSelectionChange: (editor: Editor) => void;

  /**
   * Enable localStorage persistence. Pass a string to use as the key prefix.
   * Leave undefined (default) for no persistence.
   */
  storageKey: string;

  /** URL of the emoji data JSON. Defaults to "/emojis.json". */
  emojiDataUrl: string;

  /** Override how emoji image URLs are generated. */
  getEmojiUrl: GetEmojiUrl;

  /** Whether the editor is editable. Default: true. */
  editable: boolean;

  /** Whether to autofocus the editor on mount. Default: true. */
  autofocus: boolean;

  throttle: number;
}

export interface OpenNotionViewProps {
  /** Editor instance returned from useOpenNotion(). */
  editor: TypedEditor | null;

  /** Class applied to the container. */
  className?: string | undefined;
}

function useEmojiData(url?: string) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (url) loadEmojiData(url).then(() => setReady(true));
    else
      import("@open-notion/assets/emojis.json")
        .then((m) => loadEmojiData(m.default))
        .then(() => setReady(true));
  }, [url]);

  return ready;
}

export function useOpenNotion({
  content,
  onChange,
  onReady,
  onSelectionChange,
  storageKey,
  emojiDataUrl,
  getEmojiUrl,
  editable = true,
  autofocus = true,
  throttle = 0,
}: Partial<OpenNotionOptions> = {}): TypedEditor | null {
  const ready = useEmojiData(emojiDataUrl);

  useMemo(() => {
    setEditorConfig({
      slashItems: defaultSlashItems,
      turnIntoItems: defaultTurnIntoItems,
      getEmojiUrl: getEmojiUrl ?? twemojiGetEmojiUrl,
      storageKey: storageKey ?? false,
    });
  }, [emojiDataUrl, getEmojiUrl, storageKey]);

  const throttleUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleSelectionRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const editor = useEditor(
    {
      extensions: defaultExtensions(getEmojiArray()),
      content: content ?? "",
      editable,
      autofocus,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,

      editorProps: {
        attributes: {
          class: cn("outline-none m-0 open-notion-doc"),
        },
      },

      ...(storageKey || onSelectionChange
        ? {
            onSelectionUpdate: (props) => {
              if (throttleSelectionRef.current) return;
              throttleSelectionRef.current = setTimeout(() => {
                const ed = props.editor;
                const key = getEditorConfig().storageKey;
                if (key) {
                  const { from } = ed.state.selection;
                  localStorage.setItem(`${key}-cursor`, String(from));
                }
                onSelectionChange?.(ed);
                throttleSelectionRef.current = null;
              }, throttle);
            },
          }
        : {}),

      ...(onChange || storageKey
        ? {
            onUpdate: (props) => {
              if (throttleUpdateRef.current) return;
              throttleUpdateRef.current = setTimeout(() => {
                const ed = props.editor;
                const json = ed.getJSON();
                const key = getEditorConfig().storageKey;
                if (key) {
                  localStorage.setItem(`${key}-content`, JSON.stringify(json));
                }
                onChange?.(json as DocContent);
                throttleUpdateRef.current = null;
              }, throttle);
            },
          }
        : {}),

      ...(content || onReady || storageKey
        ? {
            onCreate: (props) => {
              const ed = props.editor;
              const key = getEditorConfig().storageKey;
              if (key && content === undefined) {
                const savedContent = localStorage.getItem(`${key}-content`);
                const savedCursor = localStorage.getItem(`${key}-cursor`);
                if (savedContent) {
                  try {
                    ed.commands.setContent(JSON.parse(savedContent));
                    if (savedCursor) {
                      ed.commands.setTextSelection(Number(savedCursor));
                    }
                  } catch {
                    // Ignore malformed saved content
                  }
                }
              }
              if (autofocus) ed.commands.focus();
              onReady?.(ed);
            },
          }
        : {}),
    },
    [ready],
  ) as unknown as TypedEditor | null;

  return useMemo(() => {
    if (!editor) return null;

    const cdnBase = "https://cdn.jsdelivr.net/npm";

    editor.getHTML = async (opt) =>
      docToHTML(editor.getJSON(), {
        ...(opt?.type === "document"
          ? {
              stylesheetUrl:
                opt.stylesheetUrl ?? `${cdnBase}/${name}@${version}/doc.css`,
              hydrationScriptUrl:
                opt.hydrationScriptUrl ??
                `${cdnBase}/${name}@${version}/hydration.js`,
            }
          : {}),
        ...opt,
      });
    editor.getMarkdown = async () => docToMarkdown(editor.getJSON());
    editor.getPDF = async () =>
      import("@open-notion/serializers/pdf").then(({ docToPDF }) =>
        docToPDF(editor.getJSON()),
      );
    editor.getText = async () => docToText(editor.getJSON());
    return editor;
  }, [editor]);
}

export const OpenNotionView = memo(
  ({ editor, className = "pl-20 pr-10 py-16" }: OpenNotionViewProps) => {
    if (!editor) return null;

    return (
      <div
        ref={(el) => {
          editorStore.set({ editor, editorContainer: el });
        }}
        className={cn(
          "relative w-full cursor-text",
          "max-w-4xl min-h-svh",
          className,
        )}
        onClick={() => editor.chain().focus().run()}
      >
        <BlockSideMenu />
        <BubbleMenu editor={editor} />
        <SlashMenu />
        <EmojiPicker />
        <TableControls />

        <EditorContent editor={editor as any} />
      </div>
    );
  },
);

export interface OpenNotionProps extends OpenNotionOptions {
  /** Class applied to the container. */
  className?: string;
}

export const OpenNotion = memo(({ className, ...options }: OpenNotionProps) => {
  const editor = useOpenNotion(options);
  return <OpenNotionView editor={editor} className={className} />;
});
