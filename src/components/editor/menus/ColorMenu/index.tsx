import type { Editor } from "@tiptap/core";
import { Check } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { textColors, bgColors, type ColorOption } from "./colors";
import { AttributeHeader, AttributeMenu, getBlockAttr } from "../AttributeMenu";

function applyTextColor(editor: Editor, color: string, pos?: number) {
  const cmd = editor.chain().focus();
  if (pos !== undefined) {
    cmd.toggleBlockTextColor(color, pos).run();
  } else {
    const active = getBlockAttr(editor, "textColor") === color;
    (active ? cmd.unsetColor() : cmd.setColor(color)).run();
  }
}

function applyBgColor(editor: Editor, color: string, pos?: number) {
  const cmd = editor.chain().focus();
  if (pos !== undefined) {
    cmd.toggleBlockBackground(color, pos).run();
  } else {
    const active = getBlockAttr(editor, "backgroundColor") === color;
    (active ? cmd.unsetBackgroundColor() : cmd.setBackgroundColor(color)).run();
  }
}

interface ColorMenuProps {
  editor: Editor;
  children: React.ReactNode;
  isSubMenu?: boolean;
  container?: React.RefObject<HTMLDivElement | null>;
  blockPos?: number;
}

export function ColorMenu({
  editor,
  isSubMenu,
  children,
  container,
  blockPos,
}: ColorMenuProps) {
  const activeText = getBlockAttr(editor, "textColor", blockPos);
  const activeBg = getBlockAttr(editor, "backgroundColor", blockPos);

  const renderItem = (item: ColorOption, kind: "text" | "bg") => {
    const displayColor = item.swatch ?? item.value;
    const active =
      kind === "text" ? activeText === item.value : activeBg === item.value;

    return (
      <DropdownMenuItem
        key={item.id}
        className="flex items-center gap-2 p-2"
        onClick={() =>
          kind === "text"
            ? applyTextColor(editor, item.value, blockPos)
            : applyBgColor(editor, item.value, blockPos)
        }
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
      <AttributeHeader title="Text color" />
      {textColors.map((item) => renderItem(item, "text"))}

      <DropdownMenuSeparator className="my-1" />

      <AttributeHeader title="Background color" />
      {bgColors.map((item) => renderItem(item, "bg"))}
    </AttributeMenu>
  );
}
