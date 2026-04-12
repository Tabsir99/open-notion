import type { Editor } from "@tiptap/core";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { textColors, bgColors, type ColorOption } from "./colors";

const getBlockAttr = (
  editor: Editor,
  pos: number,
  key: string,
): string | null => {
  const node = editor.state.doc.nodeAt(pos);
  return (node?.attrs[key] as string) ?? null;
};

const getTextColor = (editor: Editor, blockPos?: number) =>
  blockPos !== undefined
    ? getBlockAttr(editor, blockPos, "textColor")
    : ((editor.getAttributes("textStyle").color as string) ?? null);

const getBgColor = (editor: Editor, blockPos?: number) =>
  blockPos !== undefined
    ? getBlockAttr(editor, blockPos, "backgroundColor")
    : ((editor.getAttributes("textStyle").backgroundColor as string) ?? null);

function applyTextColor(editor: Editor, color: string, pos?: number) {
  const cmd = editor.chain().focus();
  if (pos !== undefined) {
    cmd.toggleBlockTextColor(color, pos).run();
  } else {
    const active = getTextColor(editor) === color;
    (active ? cmd.unsetColor() : cmd.setColor(color)).run();
  }
}

function applyBgColor(editor: Editor, color: string, pos?: number) {
  const cmd = editor.chain().focus();
  if (pos !== undefined) {
    cmd.toggleBlockBackground(color, pos).run();
  } else {
    const active = getBgColor(editor) === color;
    (active ? cmd.unsetBackgroundColor() : cmd.setBackgroundColor(color)).run();
  }
}

interface ColorMenuProps {
  editor: Editor;
  children: React.ReactNode;
  isSubMenu?: boolean;
  className?: string;
  container?: React.RefObject<HTMLDivElement | null>;
  blockPos?: number;
}

export function ColorMenu({
  editor,
  isSubMenu,
  children,
  className,
  container,
  blockPos,
}: ColorMenuProps) {
  const Root = isSubMenu ? DropdownMenuSub : DropdownMenu;
  const Trigger = isSubMenu ? DropdownMenuSubTrigger : DropdownMenuTrigger;
  const Content = isSubMenu ? DropdownMenuSubContent : DropdownMenuContent;

  const activeText = getTextColor(editor, blockPos);
  const activeBg = getBgColor(editor, blockPos);

  const renderItem = (item: ColorOption, kind: "text" | "bg") => {
    const displayColor = item.swatch ?? item.value;
    const active =
      kind === "text" ? activeText === item.value : activeBg === item.value;

    return (
      <DropdownMenuItem
        key={item.id}
        className="flex items-center gap-2 h-[30px] px-2 py-1"
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
    <Root>
      <Trigger
        className={cn("flex items-center gap-2 h-8 px-2 py-1", className)}
      >
        {children}
      </Trigger>
      <Content
        container={container}
        className="w-[220px] max-h-[420px] overflow-y-auto p-1"
      >
        <span className="px-2 pt-1.5 pb-0.5 text-[11px] font-medium uppercase tracking-wider">
          Text color
        </span>
        {textColors.map((item) => renderItem(item, "text"))}

        <DropdownMenuSeparator className="my-1" />

        <span className="px-2 pt-1.5 pb-0.5 text-[11px] font-medium uppercase tracking-wider">
          Background color
        </span>
        {bgColors.map((item) => renderItem(item, "bg"))}
      </Content>
    </Root>
  );
}
