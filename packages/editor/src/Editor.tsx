import { useEffect, useMemo, memo, useRef, lazy, Suspense } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor, Extensions } from "@tiptap/core";

const BlockSideMenu = lazy(() =>
  import("./menus/BlockSideMenu").then((m) => ({ default: m.BlockSideMenu })),
);
const BubbleMenu = lazy(() =>
  import("./menus/BubbleMenu").then((m) => ({ default: m.BubbleMenu })),
);
const SlashMenu = lazy(() =>
  import("./menus/SlashMenu").then((m) => ({ default: m.SlashMenu })),
);
const EmojiPicker = lazy(() =>
  import("./menus/EmojiPicker").then((m) => ({ default: m.EmojiPicker })),
);
const TableControls = lazy(() =>
  import("./menus/TableControls").then((m) => ({ default: m.TableControls })),
);
import { loadEmojiData } from "./menus/EmojiPicker/createEmojipicker/data";
import { defaultExtensions } from "./extensions";
import { EditorContext } from "./context";
import {
  getRuntime,
  OpenNotionRoot,
  type GetEmojiUrl,
  type SlashItem,
  type TurnIntoItem,
} from "./runtime";
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

export type ExtensionsResolver = (defaults: Extensions) => Extensions;
export type SlashItemsResolver = (defaults: SlashItem[]) => SlashItem[];
export type TurnIntoItemsResolver = (
  defaults: TurnIntoItem[],
) => TurnIntoItem[];

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

  /**
   * Compose your own Tiptap extensions array on top of the defaults.
   * Receives the default extension list and returns the final list.
   * Example: `(d) => [...d, MyExtension]`
   */
  extensions: ExtensionsResolver;

  /** Compose slash-menu items on top of the defaults. */
  slashItems: SlashItemsResolver;

  /** Compose turn-into menu items on top of the defaults. */
  turnIntoItems: TurnIntoItemsResolver;
}

export interface OpenNotionViewProps {
  /** Editor instance returned from useOpenNotion(). */
  editor: TypedEditor | null;

  /** Class applied to the container. */
  className?: string | undefined;
}

function useEmojiLoader(url?: string) {
  useEffect(() => {
    if (url) {
      void loadEmojiData(url);
    } else {
      void import("@open-notion/assets/emojis.json").then((m) =>
        loadEmojiData(m.default),
      );
    }
  }, [url]);
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
  extensions: userExtensions,
  slashItems: userSlashItems,
  turnIntoItems: userTurnIntoItems,
}: Partial<OpenNotionOptions> = {}): TypedEditor | null {
  useEmojiLoader(emojiDataUrl);

  const resolvedSlashItems = useMemo(
    () =>
      userSlashItems ? userSlashItems(defaultSlashItems) : defaultSlashItems,
    [userSlashItems],
  );
  const resolvedTurnIntoItems = useMemo(
    () =>
      userTurnIntoItems
        ? userTurnIntoItems(defaultTurnIntoItems)
        : defaultTurnIntoItems,
    [userTurnIntoItems],
  );
  const resolvedGetEmojiUrl = getEmojiUrl ?? twemojiGetEmojiUrl;

  // Built once on first render. Tiptap's useEditor is given `[]` deps so the
  // editor is not recreated when these references change — post-mount updates
  // flow through the runtime via the useEffect below.
  const initialExtensions = useMemo<Extensions>(() => {
    const defaults = defaultExtensions();
    const composed = userExtensions ? userExtensions(defaults) : defaults;
    return [
      ...composed,
      OpenNotionRoot.configure({
        slashItems: resolvedSlashItems,
        turnIntoItems: resolvedTurnIntoItems,
        getEmojiUrl: resolvedGetEmojiUrl,
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { initContent, initCursor } = useMemo(() => {
    const key = storageKey ?? false;
    if (!key || !!content) return { initContent: content, initCursor: null };

    try {
      const savedContent = localStorage.getItem(`${key}-content`);
      const savedCursor = localStorage.getItem(`${key}-cursor`);
      return {
        initContent: savedContent ? JSON.parse(savedContent) : "",
        initCursor: savedCursor ? Number(savedCursor) : null,
      };
    } catch {
      return { initContent: "", initCursor: null };
    }
  }, [storageKey, content]);

  const throttleUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleSelectionRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const editor = useEditor(
    {
      extensions: initialExtensions,
      content: initContent,
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
                if (storageKey) {
                  const { from } = ed.state.selection;
                  localStorage.setItem(`${storageKey}-cursor`, String(from));
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
                if (storageKey) {
                  localStorage.setItem(
                    `${storageKey}-content`,
                    JSON.stringify(json),
                  );
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
              if (initCursor !== null && Number.isFinite(initCursor)) {
                try {
                  ed.commands.setTextSelection(initCursor);
                } catch {
                  // Ignore invalid selection restore
                }
              }
              if (autofocus) ed.commands.focus();
              onReady?.(ed);
            },
          }
        : {}),
    },
    [],
  ) as unknown as TypedEditor | null;

  // Configure options only seed the runtime at editor init. Post-mount prop
  // changes flow into the live store here.
  useEffect(() => {
    if (!editor) return;
    getRuntime(editor).set({
      slashItems: resolvedSlashItems,
      turnIntoItems: resolvedTurnIntoItems,
      getEmojiUrl: resolvedGetEmojiUrl,
    });
  }, [editor, resolvedSlashItems, resolvedTurnIntoItems, resolvedGetEmojiUrl]);

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
      <EditorContext.Provider value={editor}>
        <div
          ref={(el) => {
            getRuntime(editor).set({
              editorContainer: el,
              hoveredBlock: el ? getRuntime(editor).get().hoveredBlock : null,
            });
          }}
          className={cn(
            "relative w-full cursor-text",
            "max-w-4xl min-h-svh",
            className,
          )}
          onClick={() => editor.chain().focus().run()}
        >
          <Suspense fallback={null}>
            <BlockSideMenu />
            <BubbleMenu editor={editor} />
            <SlashMenu />
            <EmojiPicker />
            <TableControls />
          </Suspense>

          <EditorContent editor={editor as any} />
        </div>
      </EditorContext.Provider>
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
