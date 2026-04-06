import { useCallback } from "react";
import type { Editor } from "@tiptap/core";
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
  GripVertical,
} from "lucide-react";
import { TurnIntoSubmenu } from "./TurnIntoSubmenu";

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
  const handleDelete = useCallback(() => {
    const node = editor.state.doc.nodeAt(blockPos);
    if (node) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: blockPos, to: blockPos + node.nodeSize })
        .run();
    }
    onOpenChange(false);
  }, [editor, blockPos, onOpenChange]);

  const handleDuplicate = useCallback(() => {
    const node = editor.state.doc.nodeAt(blockPos);
    if (node) {
      editor
        .chain()
        .focus()
        .insertContentAt(blockPos + node.nodeSize, node.toJSON())
        .run();
    }
    onOpenChange(false);
  }, [editor, blockPos, onOpenChange]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.href}#block-${blockPos}`;
    navigator.clipboard.writeText(url).catch(() => {
      console.warn("Failed to copy link to clipboard");
    });
    onOpenChange(false);
  }, [blockPos, onOpenChange]);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className="block-side-menu-grip"
          aria-label="Block options"
          draggable
        >
          <GripVertical className="size-4.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={8}
        className="block-context-menu"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.commands.focus();
        }}
      >
        <DropdownMenuItem className="block-menu-item" onSelect={handleDelete}>
          <Trash2 className="size-4 text-zinc-400" />
          <span>Delete</span>
          <DropdownMenuShortcut className="block-menu-shortcut">
            Del
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="block-menu-item"
          onSelect={handleDuplicate}
        >
          <Copy className="size-4 text-zinc-400" />
          <span>Duplicate</span>
          <DropdownMenuShortcut className="block-menu-shortcut">
            Ctrl+D
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem className="block-menu-item" onSelect={handleCopyLink}>
          <Link className="size-4 text-zinc-400" />
          <span>Copy link to block</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="block-menu-separator" />

        <TurnIntoSubmenu
          editor={editor}
          blockPos={blockPos}
          onClose={() => onOpenChange(false)}
        />

        <DropdownMenuSeparator className="block-menu-separator" />

        {/* Placeholder submenus — will be implemented in later phases */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="block-menu-item">
            <ArrowRightLeft className="size-4 text-zinc-400" />
            <span>Move to</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="block-menu-sub-content">
            <DropdownMenuItem disabled className="block-menu-item opacity-50">
              <span>Coming soon...</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="block-menu-item">
            <Palette className="size-4 text-zinc-400" />
            <span>Color</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="block-menu-sub-content">
            <DropdownMenuItem disabled className="block-menu-item opacity-50">
              <span>Coming soon...</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="block-menu-separator" />

        <DropdownMenuItem
          className="block-menu-item"
          onSelect={() => onOpenChange(false)}
        >
          <MessageSquare className="size-4 text-zinc-400" />
          <span>Comment</span>
          <DropdownMenuShortcut className="block-menu-shortcut">
            Ctrl+Shift+M
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
