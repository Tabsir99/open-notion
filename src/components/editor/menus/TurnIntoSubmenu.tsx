import type { Editor } from "@tiptap/core";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
  AlertCircle,
} from "lucide-react";

interface TurnIntoItem {
  label: string;
  icon: React.ReactNode;
  action: (editor: Editor, blockPos: number) => void;
}

const turnIntoItems: TurnIntoItem[] = [
  {
    label: "Text",
    icon: <Type className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .setParagraph()
        .run(),
  },
  {
    label: "Heading 1",
    icon: <Heading1 className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .setHeading({ level: 1 })
        .run(),
  },
  {
    label: "Heading 2",
    icon: <Heading2 className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .setHeading({ level: 2 })
        .run(),
  },
  {
    label: "Heading 3",
    icon: <Heading3 className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .setHeading({ level: 3 })
        .run(),
  },
  {
    label: "Bullet List",
    icon: <List className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .toggleBulletList()
        .run(),
  },
  {
    label: "Numbered List",
    icon: <ListOrdered className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .toggleOrderedList()
        .run(),
  },
  {
    label: "Task List",
    icon: <ListChecks className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .toggleTaskList()
        .run(),
  },
  {
    label: "Quote",
    icon: <Quote className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .setBlockquote()
        .run(),
  },
  {
    label: "Code Block",
    icon: <Code className="size-4 text-zinc-400" />,
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .setCodeBlock()
        .run(),
  },
  {
    label: "Callout",
    icon: <AlertCircle className="size-4 text-zinc-400" />,
    action: (editor, blockPos) => {
      // Callout extension not yet implemented — log for now
      console.log("Turn into callout — extension not yet available");
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .run();
    },
  },
];

interface TurnIntoSubmenuProps {
  editor: Editor;
  blockPos: number;
  onClose: () => void;
}

export function TurnIntoSubmenu({
  editor,
  blockPos,
  onClose,
}: TurnIntoSubmenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="block-menu-item">
        <Type className="size-4 text-zinc-400" />
        <span>Turn into</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="block-menu-sub-content">
        {turnIntoItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className="block-menu-item"
            onSelect={() => {
              item.action(editor, blockPos);
              onClose();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
