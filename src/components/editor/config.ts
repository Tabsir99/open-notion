import type { Extensions, Range, ChainedCommands } from "@tiptap/core";
import type { Node as PMNode, Schema } from "@tiptap/pm/model";
import type { LucideIcon } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import type { TypedEditor } from "./types";
import { getEmojiUrl as defaultGetEmojiUrl } from "./menus/EmojiPicker/getEmojiUrl";

// ── Public item shapes ────────────────────────────────────────────────

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
 * The `source` argument describes *where* the emoji is being rendered, so
 * consumers can vary providers, sizes, or formats per context if they want to.
 *
 * - `"inline"`       — inline within editor text (small, performance-sensitive)
 * - `"picker-grid"`  — main emoji grid inside the picker popover (medium)
 * - `"category-bar"` — category tab icons at the bottom of the picker (small, often animated)
 * - `"callout-icon"` — callout block's leading icon (medium)
 *
 * Consumers can ignore the `source` argument entirely and return a single URL
 * for all cases — it's metadata, not a required branching signal.
 *
 * Avoid breaking changes for source` in the future.
 */
export type GetEmojiUrl = (
  hexId: string,
  source: "inline" | "picker-grid" | "category-bar" | "callout-icon",
) => string;

// ── Placeholder type ──────────────────────────────────────────────────

export type PlaceholderConfig = string | ((node: PMNode) => string);

// ── Full resolved config ──────────────────────────────────────────────

export interface EditorConfig {
  slashItems: SlashItem[];
  turnIntoItems: TurnIntoItem[];
  extensionsFn?: ((defaults: Extensions) => Extensions) | undefined;
  emojiDataUrl: string;
  getEmojiUrl: GetEmojiUrl;
  storageKey: string | false;
  placeholder?: PlaceholderConfig | undefined;
  initialContent?: JSONContent | undefined;
  onChange?: ((json: JSONContent) => void) | undefined;
}

// ── Module-level singleton ────────────────────────────────────────────

// NOTE: defaults are set lazily via setEditorConfig on <Editor> mount.
// These are placeholder values — never read before the editor mounts.
let config: EditorConfig = {
  slashItems: [],
  turnIntoItems: [],
  emojiDataUrl: "/emoji.json",
  getEmojiUrl: defaultGetEmojiUrl,
  storageKey: false,
};

export const setEditorConfig = (next: Partial<EditorConfig>): void => {
  config = { ...config, ...next };
};

export const getEditorConfig = (): EditorConfig => config;
