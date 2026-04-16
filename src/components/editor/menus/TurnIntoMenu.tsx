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
import { useEditor } from "../store";
import type { Editor } from "@tiptap/core";
import { memo } from "react";

// ── Data ──────────────────────────────────────────────────────────────

export interface TurnIntoItem {
  label: string;
  icon: LucideIcon;
  action: (blockPos: number) => void;
  isActive: () => boolean;
}

export const getTurnIntoItems = (editor: Editor) => {
  return [
    {
      label: "Text",
      icon: Type,
      isActive: () => editor.isActive("paragraph"),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("heading", { level: 1 }),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("heading", { level: 2 }),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("heading", { level: 3 }),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("bulletList"),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("orderedList"),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("taskList"),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("blockquote"),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("codeBlock"),
      action: (blockPos) =>
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
      isActive: () => editor.isActive("callout"),
      action: (blockPos) =>
        editor
          .chain()
          .focus()
          .setTextSelection(blockPos + 1)
          .setCallout()
          .run(),
    },
  ] satisfies TurnIntoItem[];
};

// ── Component ─────────────────────────────────────────────────────────

interface TurnIntoSubmenuProps {
  blockPos: number | (() => number);
  children: React.ReactNode;
  isSubMenu?: boolean;
  className?: string;
  container?: React.RefObject<HTMLDivElement | null>;
}

export const TurnIntomenu = memo(
  ({
    blockPos,
    isSubMenu,
    children,
    className,
    container,
  }: TurnIntoSubmenuProps) => {
    const Menu = isSubMenu ? DropdownMenuSub : DropdownMenu;
    const MenuTrigger = isSubMenu
      ? DropdownMenuSubTrigger
      : DropdownMenuTrigger;
    const MenuContent = isSubMenu
      ? DropdownMenuSubContent
      : DropdownMenuContent;

    const editor = useEditor();
    if (!editor) return null;

    return (
      <Menu>
        <MenuTrigger
          className={cn("flex items-center gap-2 h-8 px-2 py-1", className)}
        >
          {children}
        </MenuTrigger>
        <MenuContent className={cn("min-w-[180px] p-1")} container={container}>
          {getTurnIntoItems(editor).map(
            ({ label, icon: Icon, action, isActive }) => (
              <DropdownMenuItem
                key={label}
                className={cn("flex items-center gap-2 h-8 px-2 py-1")}
                onClick={() => {
                  action(
                    typeof blockPos === "function" ? blockPos() : blockPos,
                  );
                }}
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {isActive() && (
                  <Check className="size-4 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            ),
          )}
        </MenuContent>
      </Menu>
    );
  },
  (p, n) => {
    return p.blockPos === n.blockPos;
  },
);
