import type { Editor } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
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
  Check,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────

export interface TurnIntoItem {
  label: string;
  icon: LucideIcon;
  action: (editor: Editor, blockPos: number) => void;
  isActive: (editor: Editor) => boolean;
}

export const turnIntoItems: TurnIntoItem[] = [
  {
    label: "Text",
    icon: Type,
    isActive: (editor) => editor.isActive("paragraph"),
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
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
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
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
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
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
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
    isActive: (editor) => editor.isActive("bulletList"),
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
    isActive: (editor) => editor.isActive("orderedList"),
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
    isActive: (editor) => editor.isActive("taskList"),
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
    isActive: (editor) => editor.isActive("blockquote"),
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
    isActive: (editor) => editor.isActive("codeBlock"),
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
    isActive: (editor) => editor.isActive("callout"),
    action: (editor, blockPos) =>
      editor
        .chain()
        .focus()
        .setTextSelection(blockPos + 1)
        .setCallout()
        .run(),
  },
];

// ── Component ─────────────────────────────────────────────────────────

interface TurnIntoSubmenuProps {
  editor: Editor;
  blockPos: number | ((editor: Editor) => number);
  children: React.ReactNode;
  isSubMenu?: boolean;
  className?: string;
  container?: React.RefObject<HTMLDivElement | null>;
}

export function TurnIntomenu({
  editor,
  blockPos,
  isSubMenu,
  children,
  className,
  container,
}: TurnIntoSubmenuProps) {
  const Menu = isSubMenu ? DropdownMenuSub : DropdownMenu;
  const MenuTrigger = isSubMenu ? DropdownMenuSubTrigger : DropdownMenuTrigger;
  const MenuContent = isSubMenu ? DropdownMenuSubContent : DropdownMenuContent;

  return (
    <Menu>
      <MenuTrigger
        className={cn("flex items-center gap-2 h-8 px-2 py-1", className)}
      >
        {children}
      </MenuTrigger>
      <MenuContent className={cn("min-w-[180px] p-1")} container={container}>
        {turnIntoItems.map(({ label, icon: Icon, action, isActive }) => (
          <DropdownMenuItem
            key={label}
            className={cn("flex items-center gap-2 h-8 px-2 py-1")}
            onClick={() => {
              action(
                editor,
                typeof blockPos === "function" ? blockPos(editor) : blockPos,
              );
            }}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {isActive(editor) && (
              <Check className="size-4 text-muted-foreground" />
            )}
          </DropdownMenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
