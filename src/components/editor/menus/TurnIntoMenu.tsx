import { cn } from "@/components/editor/lib/utils";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/editor/ui/dropdown-menu";
import { Check } from "lucide-react";
import { useEditor } from "../store";
import { memo } from "react";
import { runTurnInto } from "./TurnIntoMenu/items";
import { getEditorConfig } from "../config";

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
          {getEditorConfig().turnIntoItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              className={cn("flex items-center gap-2 h-8 px-2 py-1")}
              onClick={() => {
                runTurnInto(
                  typeof blockPos === "function" ? blockPos() : blockPos,
                  item,
                );
              }}
            >
              <item.icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {item.isActive(editor) && (
                <Check className="size-4 text-muted-foreground" />
              )}
            </DropdownMenuItem>
          ))}
        </MenuContent>
      </Menu>
    );
  },
  (p, n) => {
    return p.blockPos === n.blockPos;
  },
);
