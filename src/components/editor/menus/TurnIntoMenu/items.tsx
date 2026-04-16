import { Node as PMNode, Schema } from "@tiptap/pm/model";
import type { LucideIcon } from "lucide-react";
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
  Table,
} from "lucide-react";
import type { ChainedCommands } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { editorStore } from "../../store";
import type { TypedEditor } from "../../types";

export const runTurnInto = (blockPos: number, item: TurnIntoItem) => {
  const editor = editorStore.get().editor;
  if (!editor) return;

  const node = editor.state.doc.nodeAt(blockPos);
  if (!node) return;

  // Fast path: textblock → textblock/wrap. Tiptap preserves inline content.
  if (node.isTextblock) {
    item
      .applyChain(
        editor
          .chain()
          .focus()
          .setTextSelection(blockPos + 1),
      )
      .run();
    return;
  }

  // Non-textblock (table, custom nodeview, atom): replace the whole node.
  editor
    .chain()
    .focus()
    .command(({ tr, state, dispatch }) => {
      if (!dispatch) return true;
      const replacement = item.buildNode(state.schema);
      tr.replaceWith(blockPos, blockPos + node.nodeSize, replacement);
      tr.setSelection(TextSelection.near(tr.doc.resolve(blockPos + 1)));
      return true;
    })
    .run();
};

interface TurnIntoItem {
  label: string;
  icon: LucideIcon;
  isActive: () => boolean;
  applyChain: (chain: ChainedCommands) => ChainedCommands;
  buildNode: (schema: Schema) => PMNode;
}

export const getTurnIntoItems = (editor: TypedEditor): TurnIntoItem[] => [
  {
    label: "Text",
    icon: Type,
    isActive: () => editor.isActive("paragraph"),
    applyChain: (c) => c.setParagraph(),
    buildNode: (s) => s.nodes.paragraph.create(),
  },
  {
    label: "Heading 1",
    icon: Heading1,
    isActive: () => editor.isActive("heading", { level: 1 }),
    applyChain: (c) => c.setHeading({ level: 1 }),
    buildNode: (s) => s.nodes.heading.create({ level: 1 }),
  },
  {
    label: "Heading 2",
    icon: Heading2,
    isActive: () => editor.isActive("heading", { level: 2 }),
    applyChain: (c) => c.setHeading({ level: 2 }),
    buildNode: (s) => s.nodes.heading.create({ level: 2 }),
  },
  {
    label: "Heading 3",
    icon: Heading3,
    isActive: () => editor.isActive("heading", { level: 3 }),
    applyChain: (c) => c.setHeading({ level: 3 }),
    buildNode: (s) => s.nodes.heading.create({ level: 3 }),
  },
  {
    label: "Bullet List",
    icon: List,
    isActive: () => editor.isActive("bulletList"),
    applyChain: (c) => c.toggleBulletList(),
    buildNode: (s) =>
      s.nodes.bulletList.create(
        null,
        s.nodes.listItem.create(null, s.nodes.paragraph.create()),
      ),
  },
  {
    label: "Numbered List",
    icon: ListOrdered,
    isActive: () => editor.isActive("orderedList"),
    applyChain: (c) => c.toggleOrderedList(),
    buildNode: (s) =>
      s.nodes.orderedList.create(
        null,
        s.nodes.listItem.create(null, s.nodes.paragraph.create()),
      ),
  },
  {
    label: "Task List",
    icon: ListChecks,
    isActive: () => editor.isActive("taskList"),
    applyChain: (c) => c.toggleTaskList(),
    buildNode: (s) =>
      s.nodes.taskList.create(
        null,
        s.nodes.taskItem.create(null, s.nodes.paragraph.create()),
      ),
  },
  {
    label: "Quote",
    icon: Quote,
    isActive: () => editor.isActive("blockquote"),
    applyChain: (c) => c.setBlockquote(),
    buildNode: (s) =>
      s.nodes.blockquote.create(null, s.nodes.paragraph.create()),
  },
  {
    label: "Code Block",
    icon: Code,
    isActive: () => editor.isActive("codeBlock"),
    applyChain: (c) => c.setCodeBlock(),
    buildNode: (s) => s.nodes.codeBlock.create(),
  },
  {
    label: "Table",
    icon: Table,
    isActive: () => editor.isActive("table"),
    applyChain: (c) =>
      c.insertTable({ cols: 3, rows: 3, withHeaderRow: false }),
    buildNode: (s) => s.nodes.table.create(),
  },
];
