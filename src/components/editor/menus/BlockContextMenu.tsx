import { useCallback } from "react";
import type { Editor } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  Copy,
  Link,
  ArrowRightLeft,
  Palette,
  MessageSquare,
  Type,
} from "lucide-react";
import { TurnIntomenu } from "./TurnIntoMenu";
import { ColorMenu } from "./ColorMenu";

// ── Data ──────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}

interface PlaceholderSubmenu {
  id: string;
  label: string;
  icon: LucideIcon;
}

const topItems: MenuItem[] = [
  { id: "delete", label: "Delete", icon: Trash2, shortcut: "Del" },
  { id: "duplicate", label: "Duplicate", icon: Copy, shortcut: "Ctrl+D" },
  { id: "copy-link", label: "Copy link to block", icon: Link },
];

const placeholderSubmenus: PlaceholderSubmenu[] = [
  { id: "move-to", label: "Move to", icon: ArrowRightLeft },
];

const bottomItems: MenuItem[] = [
  {
    id: "comment",
    label: "Comment",
    icon: MessageSquare,
    shortcut: "Ctrl+Shift+M",
  },
];

// ── Component ─────────────────────────────────────────────────────────

interface BlockContextMenuProps {
  editor: Editor;
  blockPos: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlockContextMenu({
  editor,
  blockPos,
  open,
  onOpenChange,
}: BlockContextMenuProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleSelect = useCallback(
    (id: string) => {
      const node = editor.state.doc.nodeAt(blockPos);

      switch (id) {
        case "delete":
          if (node) {
            editor
              .chain()
              .focus()
              .deleteRange({ from: blockPos, to: blockPos + node.nodeSize })
              .run();
          }
          break;
        case "duplicate":
          if (node) {
            editor
              .chain()
              .focus()
              .insertContentAt(blockPos + node.nodeSize, node.toJSON())
              .run();
          }
          break;
        case "copy-link": {
          const url = `${window.location.href}#block-${blockPos}`;
          navigator.clipboard.writeText(url).catch(() => {
            console.warn("Failed to copy link to clipboard");
          });
          break;
        }
      }

      close();
    },
    [editor, blockPos, close],
  );

  const renderItems = (items: MenuItem[]) =>
    items.map(({ id, label, icon: Icon, shortcut }) => (
      <DropdownMenuItem
        key={id}
        className="flex items-center gap-2 h-8 px-2 py-1 rounded-md"
        onClick={() => handleSelect(id)}
      >
        <Icon className="size-4" />
        <span>{label}</span>
        {shortcut && (
          <DropdownMenuShortcut className="ml-auto">
            {shortcut}
          </DropdownMenuShortcut>
        )}
      </DropdownMenuItem>
    ));

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        className="absolute inset-0 opacity-0 pointer-events-none"
        aria-hidden
      />
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-[260px] max-h-[400px] overflow-y-auto"
      >
        {renderItems(topItems)}

        <DropdownMenuSeparator className="h-px my-1" />

        <TurnIntomenu editor={editor} blockPos={blockPos} isSubMenu>
          <Type className="size-4" />
          <span>Turn into</span>
        </TurnIntomenu>

        <ColorMenu editor={editor} isSubMenu>
          <Palette className="size-4" />
          <span>Color</span>
        </ColorMenu>

        <DropdownMenuSeparator className="h-px my-1" />

        {placeholderSubmenus.map(({ id, label, icon: Icon }) => (
          <DropdownMenuSub key={id}>
            <DropdownMenuSubTrigger className="flex items-center gap-2 h-8 px-2 py-1 rounded-md">
              <Icon className="size-4" />
              <span>{label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-[180px] p-1 rounded-[10px]">
              <DropdownMenuItem
                disabled
                className="flex items-center gap-2 h-8 px-2 py-1 rounded-md"
              >
                <span>Coming soon...</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}

        <DropdownMenuSeparator className="h-px my-1" />

        {renderItems(bottomItems)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
