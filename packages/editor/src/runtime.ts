import { Extension } from "@tiptap/core";
import type { Range, ChainedCommands } from "@tiptap/core";
import type { Node as PMNode, Schema } from "@tiptap/pm/model";
import type { LucideIcon } from "lucide-react";
import type { TypedEditor } from "./types";

export interface SlashItem {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  group: string;
  action: (editor: TypedEditor, range: Range) => void;
}

export interface TurnIntoItem {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: (editor: TypedEditor) => boolean;
  applyChain: (chain: ChainedCommands) => ChainedCommands;
  buildNode: (schema: Schema) => PMNode;
}

/**
 * Returns a URL for an emoji image.
 *
 * `source` describes *where* the emoji is being rendered — consumers can vary
 * provider, size, or format per context. It's metadata: callers may ignore it.
 *
 * - `"inline"`       — inline within editor text (small)
 * - `"picker-grid"`  — main grid in the picker popover (medium)
 * - `"category-bar"` — category tab icons (small, often animated)
 * - `"callout-icon"` — callout block leading icon (medium)
 */
export type GetEmojiUrl = (
  hexId: string,
  source: "inline" | "picker-grid" | "category-bar" | "callout-icon",
) => string;

export type PlaceholderConfig = string | ((node: PMNode) => string);

export interface NodeBlock {
  element: HTMLElement;
  pos: number;
  nodeType: string;
}

/**
 * Per-editor runtime state. Lives at `editor.storage.openNotion` for the
 * editor's lifetime (one instance per editor; auto-GC'd with the editor).
 *
 * **Mutate via `set()` only.** Direct field assignment skips notify() and
 * silently breaks React subscribers — Tiptap doesn't reactively track storage.
 */
export interface EditorRuntimeState {
  slashItems: SlashItem[];
  turnIntoItems: TurnIntoItem[];
  getEmojiUrl: GetEmojiUrl;
  hoveredBlock: NodeBlock | null;
  editorContainer: HTMLElement | null;
}

export interface EditorRuntime {
  subscribe: (listener: () => void) => () => void;
  get: () => EditorRuntimeState;
  set: (partial: Partial<EditorRuntimeState>) => void;
}

/**
 * Degenerate fallback state. Used when nothing has populated the runtime —
 * either because the editor is still mounting (consumed via context) or
 * because someone instantiated `OpenNotionRoot` without configuring it.
 *
 * Rich defaults (real slash menu items, twemoji URL resolver) live in their
 * source files (`menus/SlashMenu/slash-items`, `menus/TurnIntoMenu/items`,
 * `menus/EmojiPicker/getEmojiUrl`) and are applied by `useOpenNotion` — not
 * here. This file knows nothing about menu items or emoji providers.
 */
export const EMPTY_RUNTIME_STATE: EditorRuntimeState = {
  slashItems: [],
  turnIntoItems: [],
  getEmojiUrl: () => "",
  hoveredBlock: null,
  editorContainer: null,
};

/** Read the per-editor runtime from a Tiptap editor instance. */
export function getRuntime(editor: { storage: unknown }): EditorRuntime {
  return (editor.storage as { openNotion: EditorRuntime }).openNotion;
}

export interface OpenNotionRootOptions {
  slashItems?: SlashItem[];
  turnIntoItems?: TurnIntoItem[];
  getEmojiUrl?: GetEmojiUrl;
}

/**
 * Sentinel extension. Hosts the per-editor runtime store at
 * `editor.storage.openNotion`. Tiptap calls `addStorage()` once during editor
 * setup; the returned object is reused for the editor's lifetime and GC'd
 * with the editor.
 *
 * Holds NO defaults of its own. If used without `.configure({...})` the
 * runtime starts in `EMPTY_RUNTIME_STATE` (empty arrays, no-op getEmojiUrl).
 * Rich defaults are applied by `useOpenNotion`, which always passes resolved
 * values via `.configure()`.
 *
 * Mutate via `set()` only — direct field assignment skips notify() and
 * silently breaks React subscribers.
 */
export const OpenNotionRoot = Extension.create<
  OpenNotionRootOptions,
  EditorRuntime
>({
  name: "openNotion",

  addStorage() {
    const { slashItems, turnIntoItems, getEmojiUrl } = this.options;
    let state: EditorRuntimeState = {
      ...EMPTY_RUNTIME_STATE,
      ...(slashItems !== undefined && { slashItems }),
      ...(turnIntoItems !== undefined && { turnIntoItems }),
      ...(getEmojiUrl !== undefined && { getEmojiUrl }),
    };
    const listeners = new Set<() => void>();

    return {
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      get: () => state,
      set(partial) {
        const entries = Object.entries(partial) as [
          keyof EditorRuntimeState,
          unknown,
        ][];
        if (!entries.some(([k, v]) => state[k] !== v)) return;
        state = { ...state, ...partial };
        listeners.forEach((l) => l());
      },
    };
  },
});
