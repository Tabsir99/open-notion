import { Check } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/editor/ui/dropdown-menu";
import { textColors, bgColors, type ColorOption } from "./colors";
import { AttributeHeader, AttributeMenu, getBlockAttr } from "../AttributeMenu";
import { editorStore } from "../../store";

interface ColorMenuProps {
  children: React.ReactNode;
  isSubMenu?: boolean;

  onSelectText?: (color: string | null) => void;
  onSelectBg?: (color: string | null) => void;

  activeText?: string | null;
  activeBg?: string | null;

  container?: React.RefObject<HTMLElement | null>;
}

export function ColorMenu({
  children,
  isSubMenu,

  onSelectText,
  onSelectBg,

  activeText,
  activeBg,

  container,
}: ColorMenuProps) {
  const renderItem = (item: ColorOption, kind: "text" | "bg") => {
    const displayColor = item.swatch ?? item.value;
    const active =
      kind === "text" ? activeText === item.value : activeBg === item.value;
    const handler = kind === "text" ? onSelectText : onSelectBg;

    return (
      <DropdownMenuItem
        key={item.id}
        className="flex items-center gap-2 p-2"
        onClick={() => handler?.(item.value || null)}
      >
        {kind === "text" ? (
          <span
            className="flex size-5 items-center justify-center rounded text-sm font-semibold leading-none border"
            style={{ color: displayColor, borderColor: `${displayColor}60` }}
            aria-hidden
          >
            A
          </span>
        ) : (
          <span
            className="flex size-5 rounded"
            style={{ backgroundColor: displayColor }}
            aria-hidden
          />
        )}
        <span className="flex-1 text-[13px]">
          {item.label} {kind === "bg" ? "background" : "text"}
        </span>
        {active && <Check className="size-3.5 text-muted-foreground" />}
      </DropdownMenuItem>
    );
  };

  return (
    <AttributeMenu trigger={children} isSub={isSubMenu} container={container}>
      {onSelectText && (
        <>
          <AttributeHeader title="Text color" />
          {textColors.map((item) => renderItem(item, "text"))}
        </>
      )}
      {onSelectText && onSelectBg && <DropdownMenuSeparator className="my-1" />}
      {onSelectBg && (
        <>
          <AttributeHeader title="Background color" />
          {bgColors.map((item) => renderItem(item, "bg"))}
        </>
      )}
    </AttributeMenu>
  );
}

interface Props {
  children: React.ReactNode;
  isSubMenu?: boolean;
  blockPos?: number;
}

export function BlockColorMenu({ children, isSubMenu, blockPos }: Props) {
  const handle =
    (kind: "textColor" | "backgroundColor") => (color: string | null) => {
      const { editor } = editorStore.get();
      if (!editor || !color) return;
      const cmd = editor.chain().focus();

      if (blockPos !== undefined) {
        kind === "textColor"
          ? cmd.toggleBlockTextColor(color, blockPos).run()
          : cmd.toggleBlockBackground(color, blockPos).run();
      } else {
        const active = getBlockAttr(kind) === color;
        if (kind === "textColor") {
          (active ? cmd.unsetColor() : cmd.setColor(color)).run();
        } else {
          (active
            ? cmd.unsetBackgroundColor()
            : cmd.setBackgroundColor(color)
          ).run();
        }
      }
    };

  return (
    <ColorMenu
      isSubMenu={isSubMenu}
      activeText={getBlockAttr("textColor", blockPos)}
      activeBg={getBlockAttr("backgroundColor", blockPos)}
      onSelectText={handle("textColor")}
      onSelectBg={handle("backgroundColor")}
    >
      {children}
    </ColorMenu>
  );
}
