import { useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { cn } from "@/lib/utils";
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
          className={cn(
            "flex items-center justify-center w-7 h-7 p-0",
            "border-none rounded bg-transparent text-zinc-500",
            "cursor-grab active:cursor-grabbing",
            "transition-colors duration-100 ease",
            "hover:bg-zinc-800 hover:text-zinc-200",
            "active:bg-zinc-700"
          )}
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
        className={cn(
          "w-[260px] max-h-[400px] overflow-y-auto p-1",
          "bg-zinc-900 border border-zinc-800 rounded-[10px]",
          "shadow-[0_4px_24px_rgba(0,0,0,0.25)]",
          "animate-in fade-in zoom-in-95 duration-100 ease-out",
          "block-context-menu"
        )}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.commands.focus();
        }}
      >
        <DropdownMenuItem className={cn(
            "flex items-center gap-2 h-8 px-2 py-1",
            "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
            "transition-colors duration-75",
            "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800"
          )} onSelect={handleDelete}>
          <Trash2 className="size-4 text-zinc-400" />
          <span>Delete</span>
          <DropdownMenuShortcut className="ml-auto text-xs font-mono text-zinc-500">
            Del
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem
          className={cn(
            "flex items-center gap-2 h-8 px-2 py-1",
            "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
            "transition-colors duration-75",
            "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800"
          )}
          onSelect={handleDuplicate}
        >
          <Copy className="size-4 text-zinc-400" />
          <span>Duplicate</span>
          <DropdownMenuShortcut className="ml-auto text-xs font-mono text-zinc-500">
            Ctrl+D
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem className={cn(
            "flex items-center gap-2 h-8 px-2 py-1",
            "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
            "transition-colors duration-75",
            "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800"
          )} onSelect={handleCopyLink}>
          <Link className="size-4 text-zinc-400" />
          <span>Copy link to block</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="h-px my-1 bg-zinc-800" />

        <TurnIntoSubmenu
          editor={editor}
          blockPos={blockPos}
          onClose={() => onOpenChange(false)}
        />

        <DropdownMenuSeparator className="h-px my-1 bg-zinc-800" />

        {/* Placeholder submenus — will be implemented in later phases */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={cn(
            "flex items-center gap-2 h-8 px-2 py-1",
            "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
            "transition-colors duration-75",
            "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800"
          )}>
            <ArrowRightLeft className="size-4 text-zinc-400" />
            <span>Move to</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className={cn(
            "min-w-[180px] p-1",
            "bg-zinc-900 border border-zinc-800 rounded-[10px]",
            "shadow-[0_4px_24px_rgba(0,0,0,0.25)]",
            "animate-in fade-in zoom-in-95 duration-100 ease-out"
          )}>
            <DropdownMenuItem disabled className={cn(
                "flex items-center gap-2 h-8 px-2 py-1",
                "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
                "transition-colors duration-75",
                "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800",
                "opacity-50"
              )}>
              <span>Coming soon...</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={cn(
            "flex items-center gap-2 h-8 px-2 py-1",
            "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
            "transition-colors duration-75",
            "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800"
          )}>
            <Palette className="size-4 text-zinc-400" />
            <span>Color</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className={cn(
            "min-w-[180px] p-1",
            "bg-zinc-900 border border-zinc-800 rounded-[10px]",
            "shadow-[0_4px_24px_rgba(0,0,0,0.25)]",
            "animate-in fade-in zoom-in-95 duration-100 ease-out"
          )}>
            <DropdownMenuItem disabled className={cn(
                "flex items-center gap-2 h-8 px-2 py-1",
                "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
                "transition-colors duration-75",
                "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800",
                "opacity-50"
              )}>
              <span>Coming soon...</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="h-px my-1 bg-zinc-800" />

        <DropdownMenuItem
          className={cn(
            "flex items-center gap-2 h-8 px-2 py-1",
            "rounded-md text-[13px] text-zinc-200 cursor-pointer select-none outline-none",
            "transition-colors duration-75",
            "hover:bg-zinc-800 focus:bg-zinc-800 data-highlighted:bg-zinc-800"
          )}
          onSelect={() => onOpenChange(false)}
        >
          <MessageSquare className="size-4 text-zinc-400" />
          <span>Comment</span>
          <DropdownMenuShortcut className="ml-auto text-xs font-mono text-zinc-500">
            Ctrl+Shift+M
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
