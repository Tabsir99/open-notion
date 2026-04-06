import type { Editor } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

// ── Data ──────────────────────────────────────────────────────────────

interface TurnIntoItem {
  label: string;
  icon: LucideIcon;
  action: (editor: Editor, blockPos: number) => void;
}

const turnIntoItems: TurnIntoItem[] = [
  {
    label: "Text",
    icon: Type,
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
    icon: Heading1,
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
    icon: Heading2,
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
    icon: Heading3,
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
    icon: List,
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
    icon: ListOrdered,
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
    icon: ListChecks,
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
    icon: Quote,
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
    icon: Code,
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
    icon: AlertCircle,
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

// ── Component ─────────────────────────────────────────────────────────

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
      <DropdownMenuSubTrigger
        className={cn(
          "flex items-center gap-2 h-8 px-2 py-1",
          "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
          "transition-colors duration-75",
          "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800",
        )}
      >
        <Type className="size-4 text-zinc-400" />
        <span>Turn into</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        className={cn(
          "min-w-[180px] p-1",
          "bg-zinc-900 border border-zinc-800 rounded-[10px]",
          "shadow-[0_4px_24px_rgba(0,0,0,0.25)]",
          "animate-in fade-in zoom-in-95 duration-100 ease-out",
        )}
      >
        {turnIntoItems.map(({ label, icon: Icon, action }) => (
          <DropdownMenuItem
            key={label}
            className={cn(
              "flex items-center gap-2 h-8 px-2 py-1",
              "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
            )}
            onSelect={() => {
              action(editor, blockPos);
              onClose();
            }}
          >
            <Icon className="size-4 text-zinc-400" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
