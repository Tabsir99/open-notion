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
import type { SlashItem } from "../../runtime";
import { rankFuzzy } from "../../lib/fuzzy";

export type { SlashItem };

export const defaultSlashItems: SlashItem[] = [
  {
    id: "text",
    title: "Text",
    description: "Plain text block",
    aliases: ["Paragraph", "Plain", "Body"],
    icon: Type,
    group: "Basic",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    id: "heading1",
    title: "Heading 1",
    description: "Large section heading",
    aliases: ["H1", "Title", "Big heading", "Large heading"],
    icon: Heading1,
    group: "Basic",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    id: "heading2",
    title: "Heading 2",
    description: "Medium section heading",
    aliases: ["H2", "Subtitle", "Section heading"],
    icon: Heading2,
    group: "Basic",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    id: "heading3",
    title: "Heading 3",
    description: "Small section heading",
    aliases: ["H3", "Subsection", "Small heading", "Minor heading"],
    icon: Heading3,
    group: "Basic",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 4 }).run(),
  },

  {
    id: "bullet-list",
    title: "Bullet List",
    description: "Unordered list with bullets",
    aliases: ["Unordered List", "UL", "Bullets", "Dot list", "Points"],
    icon: List,
    group: "Lists",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: "numbered-list",
    title: "Numbered List",
    description: "Ordered list with numbers",
    aliases: ["Ordered List", "OL", "Numbers", "Numeric list", "1. 2. 3."],
    icon: ListOrdered,
    group: "Lists",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: "task-list",
    title: "Task List",
    description: "Checklist with checkboxes",
    aliases: [
      "Checklist",
      "Todo",
      "Todos",
      "To-do",
      "Checkbox",
      "Checkboxes",
      "Action items",
    ],
    icon: ListChecks,
    group: "Lists",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },

  {
    id: "image",
    title: "Image",
    description: "Upload or embed with a link",
    aliases: ["Picture", "Photo", "Img", "Media", "Upload"],
    icon: ImageIcon,
    group: "Media",
    action: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setImage({ src: "", align: "left" })
        .run(),
  },

  {
    id: "quote",
    title: "Quote",
    description: "Block quotation",
    aliases: ["Blockquote", "Citation", "Pull quote"],
    icon: Quote,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setBlockquote().run(),
  },
  {
    id: "code-block",
    title: "Code Block",
    description: "Syntax-highlighted code",
    aliases: ["Code", "Snippet", "Pre", "Codeblock", "Source code", "Listing"],
    icon: Code,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
  {
    id: "divider",
    title: "Divider",
    description: "Horizontal separator",
    aliases: [
      "Horizontal Rule",
      "HR",
      "Line",
      "Separator",
      "Break",
      "Section break",
      "Hairline",
    ],
    icon: Minus,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    id: "emoji",
    title: "Emoji",
    description: "Insert an emoji",
    aliases: ["Smiley", "Reaction", "Sticker", "Icon", "Symbol"],
    icon: Smile,
    group: "Advanced",
    action: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent(":").run(),
  },
  {
    id: "callout",
    title: "Callout",
    description: "Block with an icon",
    aliases: ["Note", "Info box", "Alert", "Admonition", "Aside", "Tip", "Warning"],
    icon: AlertCircle,
    group: "Advanced",
    action: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setCallout({ emoji: "bulb", hexId: "1F4A1" })
        .run(),
  },
  {
    id: "table",
    title: "Table",
    description: "Insert a structured table",
    aliases: ["Grid", "Spreadsheet", "Matrix", "Rows and columns"],
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

/**
 * Filter & rank slash items by query.
 * Empty query → original order. Non-empty → fuzzy-ranked across
 * aliases (highest weight), title, and description.
 */
export function filterSlashItems(
  items: SlashItem[],
  query: string,
): SlashItem[] {
  if (!query) return items;
  return rankFuzzy(items, query, (item) => ({
    high: item.aliases,
    medium: item.title,
    low: item.description,
  }));
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
