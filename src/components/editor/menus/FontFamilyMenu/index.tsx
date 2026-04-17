import { Check } from "lucide-react";
import { DropdownMenuItem } from "@/components/editor/ui/dropdown-menu";
import { fontFamilies } from "./families";
import { AttributeHeader, AttributeMenu, getBlockAttr } from "../AttributeMenu";
import { cn } from "@/components/editor/lib/utils";
import { editorStore } from "../../store";

function applyFontFamily(family: string, pos?: number) {
  const { editor } = editorStore.get();
  if (!editor) return;

  const cmd = editor.chain().focus();
  if (pos !== undefined) {
    cmd.toggleBlockFontFamily(family, pos).run();
  } else {
    const active = getBlockAttr("fontFamily") === family;
    (active ? cmd.unsetFontFamily() : cmd.setFontFamily(family)).run();
  }
}

interface FontFamilyMenuProps {
  children: React.ReactNode;
  isSubMenu?: boolean;
  blockPos?: number;
}

export function FontFamilyMenu({
  children,
  isSubMenu,
  blockPos,
}: FontFamilyMenuProps) {
  const active = getBlockAttr("fontFamily", blockPos);

  return (
    <AttributeMenu trigger={children} isSub={isSubMenu}>
      <AttributeHeader title="Font family" />

      {fontFamilies.map((item) => {
        const isActive = item.value ? active === item.value : active === "";

        return (
          <DropdownMenuItem
            key={item.id}
            onClick={() => applyFontFamily(item.value, blockPos)}
            className={cn(
              "group flex items-center gap-3 px-2.5 py-2 rounded-md cursor-pointer",
              "focus:bg-accent/60 data-highlighted:bg-accent/60",
              isActive && "bg-accent/40",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                "bg-muted/60 border border-border/60",
                "text-[18px] leading-none font-medium",
                "transition-colors group-hover:bg-muted",
              )}
              style={{ fontFamily: item.value }}
              aria-hidden
            >
              Ag
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className="text-[13px] leading-tight truncate"
                style={{ fontFamily: item.value }}
              >
                {item.label}
              </span>
            </div>

            {isActive && (
              <Check className="size-3.5 text-foreground shrink-0" />
            )}
          </DropdownMenuItem>
        );
      })}
    </AttributeMenu>
  );
}
