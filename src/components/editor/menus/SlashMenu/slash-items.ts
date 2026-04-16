import type { LucideIcon } from "lucide-react";
import type { Range } from "@tiptap/core";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Minus,
  Image as ImageIcon,
  Smile,
  Table,
  AlertCircle,
} from "lucide-react";
import type { TypedEditor } from "../../types";

// ── Types ─────────────────────────────────────────────────────────────

export interface SlashItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  group: string;
  action: (editor: TypedEditor, range: Range) => void;
}

// ── Items ─────────────────────────────────────────────────────────────

export const slashItems: SlashItem[] = [
  // ── Basic ─────────────────────────────────────
  {
    id: "text",
    title: "Text",
    description: "Plain text block",
    icon: Type,
    group: "Basic",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    id: "heading1",
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    group: "Basic",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    id: "heading2",
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    group: "Basic",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    id: "heading3",
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    group: "Basic",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },

  // ── Lists ─────────────────────────────────────
  {
    id: "bullet-list",
    title: "Bullet List",
    description: "Unordered list with bullets",
    icon: List,
    group: "Lists",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: "numbered-list",
    title: "Numbered List",
    description: "Ordered list with numbers",
    icon: ListOrdered,
    group: "Lists",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: "task-list",
    title: "Task List",
    description: "Checklist with checkboxes",
    icon: ListChecks,
    group: "Lists",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },

  // ── Media ─────────────────────────────────────
  {
    id: "image",
    title: "Image",
    description: "Upload or embed with a link",
    icon: ImageIcon,
    group: "Media",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setImage({ src: "" }).run(),
  },

  // ── Advanced ──────────────────────────────────
  {
    id: "quote",
    title: "Quote",
    description: "Block quotation",
    icon: Quote,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setBlockquote().run(),
  },
  {
    id: "code-block",
    title: "Code Block",
    description: "Syntax-highlighted code",
    icon: Code,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
  {
    id: "divider",
    title: "Divider",
    description: "Horizontal separator",
    icon: Minus,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    id: "emoji",
    title: "Emoji",
    description: "Insert an emoji",
    icon: Smile,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent(":").run(),
  },
  {
    id: "callout",
    title: "Callout",
    description: "Block with an icon",
    icon: AlertCircle,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setCallout().run(),
  },
  {
    id: "table",
    title: "Table",
    description: "Insert a structured table",
    icon: Table,
    group: "Advanced",
    action: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
        .run(),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

/** Filter items by query, matching title or description */
export function filterSlashItems(query: string): SlashItem[] {
  const q = query.toLowerCase();
  return slashItems.filter((item) => item.title.toLowerCase().includes(q));
}

/** Group a flat item list by `group` field, preserving insertion order */
export function groupItems(
  items: SlashItem[],
): { label: string; items: SlashItem[] }[] {
  const map = new Map<string, SlashItem[]>();
  for (const item of items) {
    const list = map.get(item.group);
    if (list) list.push(item);
    else map.set(item.group, [item]);
  }
  return Array.from(map, ([label, groupItems]) => ({
    label,
    items: groupItems,
  }));
}
