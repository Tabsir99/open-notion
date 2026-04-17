import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { DropdownMenuItem } from "@/components/editor/ui/dropdown-menu";
import { Input } from "@/components/editor/ui/input";
import { fontSizes } from "./sizes";
import { AttributeHeader, AttributeMenu, getBlockAttr } from "../AttributeMenu";
import { cn } from "@/components/editor/lib/utils";
import { editorStore } from "../../store";

function applyFontSize(size: string, pos?: number) {
  const { editor } = editorStore.get();
  if (!editor) return;

  const cmd = editor.chain().focus();
  if (pos !== undefined) {
    cmd.toggleBlockFontSize(size, pos).run();
  } else {
    const active = getBlockAttr("fontSize") === size;
    (active ? cmd.unsetFontSize() : cmd.setFontSize(size)).run();
  }
}

interface FontSizeMenuProps {
  children: React.ReactNode;
  isSubMenu?: boolean;
  blockPos?: number;
}

export function FontSizeMenu({
  isSubMenu,
  children,
  blockPos,
}: FontSizeMenuProps) {
  const active = getBlockAttr("fontSize", blockPos);

  const [customValue, setCustomValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input with current active size when menu opens
  useEffect(() => {
    if (active) {
      const num = parseInt(active, 10);
      if (!isNaN(num)) setCustomValue(String(num));
    } else {
      setCustomValue("");
    }
  }, [active]);

  const handleCustomSubmit = () => {
    const val = customValue.trim();
    if (!val) return;
    const px = val.endsWith("px") ? val : `${val}px`;
    applyFontSize(px, blockPos);
  };

  return (
    <AttributeMenu trigger={children} isSub={isSubMenu}>
      <AttributeHeader title="Font size" />

      {fontSizes.map((item) => {
        const isActive = item.value ? active === item.value : active === "";

        return (
          <DropdownMenuItem
            key={item.id}
            onClick={() => applyFontSize(item.value, blockPos)}
            className={cn(
              "group flex items-center gap-3 px-2.5 py-2 rounded-md cursor-pointer",
              "focus:bg-accent/60 data-highlighted:bg-accent/60",
              isActive && "bg-accent/40",
            )}
          >
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-md",
                "bg-muted/60 border border-border/60",
                "leading-none font-medium aspect-square",
                "transition-colors group-hover:bg-muted",
                "min-h-9 min-w-9 px-2",
              )}
              style={{
                fontSize: item.value || "14px",
              }}
              aria-hidden
            >
              Aa
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[13px] leading-tight truncate">
                {item.label}
              </span>
              {item.value && (
                <span className="text-[10.5px] text-muted-foreground/70 tabular-nums leading-none">
                  {item.value}
                </span>
              )}
            </div>

            {isActive && (
              <Check className="size-3.5 text-foreground shrink-0 self-center" />
            )}
          </DropdownMenuItem>
        );
      })}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCustomSubmit();
        }}
        className="mt-2 flex items-center gap-1.5 px-2.5 py-2.5 border-t border-border/50"
      >
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="number"
            min={1}
            max={200}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="16"
            className="h-8 w-full pr-7 text-[13px] tabular-nums"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/70 pointer-events-none tabular-nums">
            px
          </span>
        </div>
        <button
          type="submit"
          className={cn(
            "h-8 rounded-md px-3 text-[12px] font-medium shrink-0",
            "bg-foreground text-background",
            "hover:opacity-90 active:opacity-80 transition-opacity",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
          disabled={!customValue.trim()}
        >
          Set
        </button>
      </form>
    </AttributeMenu>
  );
}
