import { memo, useCallback } from "react";
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
  ALargeSmall,
  CaseSensitive,
} from "lucide-react";
import { TurnIntomenu } from "./TurnIntoMenu";
import { BlockColorMenu } from "./ColorMenu";
import { FontSizeMenu } from "./FontSizeMenu";
import { FontFamilyMenu } from "./FontFamilyMenu";
import { editorStore, useEditorStore } from "../store";

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

type Dropdownprops = Omit<Parameters<typeof DropdownMenu>[0], "children">;
interface BlockContextMenuProps extends Dropdownprops {
  trigger: Parameters<typeof DropdownMenuTrigger>[0]["render"];
}
export const BlockContextMenu = memo(
  ({ trigger, ...props }: BlockContextMenuProps) => {
    const handleSelect = useCallback(
      (id: string) => {
        const { editor, activeBlock } = editorStore.get();
        if (!editor || !activeBlock) return;

        const { pos } = activeBlock;
        const node = editor.state.doc.nodeAt(pos);

        switch (id) {
          case "delete":
            if (node) {
              editor
                .chain()
                .focus()
                .deleteRange({ from: pos, to: pos + node.nodeSize })
                .run();
            }
            break;
          case "duplicate":
            if (node) {
              editor
                .chain()
                .focus()
                .insertContentAt(pos + node.nodeSize, node.toJSON())
                .run();
            }
            break;
          case "copy-link": {
            const url = `${window.location.href}#block-${pos}`;
            navigator.clipboard.writeText(url).catch(() => {
              console.warn("Failed to copy link to clipboard");
            });
            break;
          }
        }

        close();
      },
      [close],
    );

    const blockpos = useEditorStore((s) => s.activeBlock?.pos);

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
      <DropdownMenu {...props}>
        <DropdownMenuTrigger render={trigger} />
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={8}
          className="w-[260px] max-h-[400px] overflow-y-auto ease-in duration-200"
        >
          {renderItems(topItems)}

          <DropdownMenuSeparator className="h-px my-1" />

          <TurnIntomenu blockPos={blockpos!} isSubMenu>
            <Type className="size-4" />
            <span>Turn into</span>
          </TurnIntomenu>

          <BlockColorMenu blockPos={blockpos} isSubMenu>
            <Palette className="size-4" />
            <span>Color</span>
          </BlockColorMenu>

          <FontSizeMenu blockPos={blockpos} isSubMenu>
            <ALargeSmall className="size-4" />
            <span>Font size</span>
          </FontSizeMenu>

          <FontFamilyMenu blockPos={blockpos} isSubMenu>
            <CaseSensitive className="size-4" />
            <span>Font family</span>
          </FontFamilyMenu>

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
  },
  (p, n) =>
    p.open === n.open &&
    p.trigger === n.trigger &&
    p.onOpenChange === n.onOpenChange,
);
