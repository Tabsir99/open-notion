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
    const resolvedPos = editor.state.doc.resolve(blockPos);
    if (resolvedPos.depth >= 1) {
      const nodeSize = resolvedPos.node(1).nodeSize;
      editor
        .chain()
        .focus()
        .deleteRange({ from: blockPos, to: blockPos + nodeSize })
        .run();
    }
    onOpenChange(false);
  }, [editor, blockPos, onOpenChange]);

  const handleDuplicate = useCallback(() => {
    const resolvedPos = editor.state.doc.resolve(blockPos);
    if (resolvedPos.depth >= 1) {
      const node = resolvedPos.node(1);
      const nodeSize = node.nodeSize;
      const insertPos = blockPos + nodeSize;

      editor.chain().focus().insertContentAt(insertPos, node.toJSON()).run();
    }
    onOpenChange(false);
  }, [editor, blockPos, onOpenChange]);

  const handleCopyLink = useCallback(() => {
    // Copy a link to the current block (placeholder — would need block IDs)
    const url = `${window.location.href}#block-${blockPos}`;
    navigator.clipboard.writeText(url).catch(() => {
      console.warn("Failed to copy link to clipboard");
    });
    onOpenChange(false);
  }, [blockPos, onOpenChange]);

  const handleComment = useCallback(() => {
    console.log("Open comment — not yet implemented");
    onOpenChange(false);
  }, [onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      {/* Hidden trigger — menu is opened programmatically via the grip icon in BlockSideMenu */}
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
      >
        {/* AI Section placeholder */}
        {/* <DropdownMenuItem disabled className="block-menu-item opacity-40">
          <Sparkles className="size-4 text-zinc-400" />
          <span>Ask AI</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="block-menu-separator" /> */}

        {/* Primary actions */}
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

        {/* Turn into submenu */}
        <TurnIntoSubmenu editor={editor} blockPos={blockPos} onClose={handleClose} />

        <DropdownMenuSeparator className="block-menu-separator" />

        {/* Move to & Color — placeholder submenus */}
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

        {/* Comment */}
        <DropdownMenuItem className="block-menu-item" onSelect={handleComment}>
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
