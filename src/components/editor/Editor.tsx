import "./styles/editor.css";
import { Suspense, use, useMemo } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import type { Editor, Extensions } from "@tiptap/core";
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
import {
  setEditorConfig,
  getEditorConfig,
  type SlashItem,
  type TurnIntoItem,
  type GetEmojiUrl,
  type PlaceholderConfig,
} from "./config";
import { defaultSlashItems } from "./menus/SlashMenu/slash-items";
import { defaultTurnIntoItems } from "./menus/TurnIntoMenu/items";
import { getEmojiUrl as twemojiGetEmojiUrl } from "./menus/EmojiPicker/getEmojiUrl";
import { cn } from "./lib/utils";
import type { TypedEditor } from "./types";

// ── Public types ──────────────────────────────────────────────────────

export interface OpenNotionOptions {
  /** Initial document content (JSON). Only applied on mount. */
  content?: JSONContent;

  /** Called whenever the document changes. */
  onChange?: (json: JSONContent) => void;

  /** Called once when the editor is ready. */
  onReady?: (editor: Editor) => void;

  /** Called when the selection changes. */
  onSelectionChange?: (editor: Editor) => void;

  /**
   * Enable localStorage persistence. Pass a string to use as the key prefix.
   * Leave undefined (default) for no persistence.
   */
  storageKey?: string;

  /** URL of the emoji data JSON. Defaults to "/emojis.json". */
  emojiDataUrl?: string;

  /** Override how emoji image URLs are generated. */
  getEmojiUrl?: GetEmojiUrl;

  /** Placeholder text (string or per-node function). */
  placeholder?: PlaceholderConfig;

  /** Whether the editor is editable. Default: true. */
  editable?: boolean;

  /** Whether to autofocus the editor on mount. Default: true. */
  autofocus?: boolean;

  /** Modify the slash menu items. */
  slashItems?: (defaults: SlashItem[]) => SlashItem[];

  /** Modify the "Turn into" menu items. */
  turnIntoItems?: (defaults: TurnIntoItem[]) => TurnIntoItem[];

  /** Modify the extension list. */
  extensions?: (defaults: Extensions) => Extensions;
}

export interface OpenNotionViewProps {
  /** Editor instance returned from useOpenNotion(). */
  editor: TypedEditor | null;

  /** Class applied to the container. */
  className?: string | undefined;
}

// ── Emoji data loader (Suspense boundary) ─────────────────────────────

const dataPromiseCache = new Map<string, Promise<void>>();

function useEmojiData(url: string) {
  let promise = dataPromiseCache.get(url);
  if (!promise) {
    promise = loadEmojiData(url).then(() => void 0);
    dataPromiseCache.set(url, promise);
  }
  use(promise);
}

// ── The hook: creates and manages the editor ─────────────────────────

export function useOpenNotion({
  content,
  onChange,
  onReady,
  onSelectionChange,
  storageKey,
  emojiDataUrl = "/emojis.json",
  getEmojiUrl,
  placeholder,
  editable = true,
  autofocus = true,
  slashItems,
  turnIntoItems,
  extensions,
}: OpenNotionOptions = {}): TypedEditor | null {
  // Wait for emoji data. Requires Suspense boundary from caller.
  useEmojiData(emojiDataUrl);

  // Set config once, before any menu renders.
  useMemo(() => {
    setEditorConfig({
      slashItems: slashItems
        ? slashItems(defaultSlashItems)
        : defaultSlashItems,
      turnIntoItems: turnIntoItems
        ? turnIntoItems(defaultTurnIntoItems)
        : defaultTurnIntoItems,
      extensionsFn: extensions,
      emojiDataUrl,
      getEmojiUrl: getEmojiUrl ?? twemojiGetEmojiUrl,
      storageKey: storageKey ?? false,
      placeholder,
    });
  }, [
    slashItems,
    turnIntoItems,
    extensions,
    emojiDataUrl,
    getEmojiUrl,
    storageKey,
    placeholder,
  ]);

  const emojis = getEmojiArray();

  const editor = useEditor({
    extensions: (() => {
      const defaults = defaultExtensions(emojis);
      return extensions ? extensions(defaults) : defaults;
    })(),
    content: content ?? "",
    editable,
    autofocus,
    immediatelyRender: false,

    ...(storageKey || onselectionchange
      ? {
          onSelectionUpdate: (props) => {
            const ed = props.editor;
            const key = getEditorConfig().storageKey;
            if (key) {
              const { from } = ed.state.selection;
              localStorage.setItem(`${key}-cursor`, String(from));
            }
            onSelectionChange?.(ed);
          },
        }
      : {}),

    ...(onChange || storageKey
      ? {
          onUpdate: (props) => {
            const ed = props.editor;
            const json = ed.getJSON();
            const key = getEditorConfig().storageKey;
            if (key) {
              localStorage.setItem(`${key}-content`, JSON.stringify(json));
            }
            onChange?.(json);
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
  }) as TypedEditor | null;

  return editor;
}

// ── The view: renders the editor UI ──────────────────────────────────

export function OpenNotionView({
  editor,
  className = "pl-20 pr-10 py-16",
}: OpenNotionViewProps) {
  if (!editor) return null;

  return (
    <div
      ref={(el) => {
        editorStore.set({ editor, editorContainer: el });
      }}
      className={cn(
        "relative w-full cursor-text",
        "max-w-4xl min-h-svh cursor-text bg-background border border-border",
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
}

// ── Suspense wrapper (so consumers don't need to remember) ──────────

export interface OpenNotionProps extends OpenNotionOptions {
  /** Class applied to the container. */
  className?: string;

  /** Fallback shown while emoji data loads. */
  fallback?: React.ReactNode;
}

/**
 * Convenience wrapper for the common case: one editor, no parent-level
 * control, use defaults. For imperative control or custom layouts, use
 * `useOpenNotion()` + `<OpenNotionView>` directly.
 */
export function OpenNotion({
  className,
  fallback = (
    <div className="w-dvw h-dvh flex justify-center items-center text-4xl">
      Loading...
    </div>
  ),
  ...options
}: OpenNotionProps) {
  return (
    <Suspense fallback={fallback}>
      <OpenNotionInner options={options} className={className} />
    </Suspense>
  );
}

function OpenNotionInner({
  options,
  className,
}: {
  options: OpenNotionOptions;
  className?: string | undefined;
}) {
  const editor = useOpenNotion(options);
  return <OpenNotionView editor={editor} className={className} />;
}
