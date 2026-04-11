import type { Editor } from "@tiptap/core";
import { cn } from "@/lib/utils";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  // DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { textColors, bgColors } from "./colors";
import type { ColorOption } from "./colors";

// ── Helpers ───────────────────────────────────────────────────────────

function getActiveTextColor(editor: Editor): string | null {
  return (editor.getAttributes("textStyle").color as string) ?? null;
}

function getActiveBgColor(editor: Editor): string | null {
  return (editor.getAttributes("textStyle").backgroundColor as string) ?? null;
}

function applyTextColor(editor: Editor, color: string | null) {
  if (color === null) {
    editor.chain().focus().unsetColor().run();
  } else {
    editor.chain().focus().setColor(color).run();
  }
}

function applyBgColor(editor: Editor, color: string | null) {
  if (color === null) {
    editor.chain().focus().unsetBackgroundColor().run();
  } else {
    editor.chain().focus().setBackgroundColor(color).run();
  }
}

// ── Swatch components ─────────────────────────────────────────────────

function TextSwatch({
  swatch,
  className,
}: {
  swatch: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-5 items-center justify-center rounded text-sm font-semibold leading-none border",
        className,
      )}
      style={{ color: swatch, borderColor: `${swatch}60` }}
      aria-hidden
    >
      A
    </span>
  );
}

function BgSwatch({
  swatch,
  isDefault,
  className,
}: {
  swatch: string;
  isDefault?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-5 items-center justify-center rounded",
        isDefault && "ring-1 ring-inset ring-border",
        className,
      )}
      style={{ backgroundColor: swatch }}
      aria-hidden
    />
  );
}

// ── Color row ─────────────────────────────────────────────────────────

function ColorRow({
  item,
  isActive,
  isBg,
  onClick,
}: {
  item: ColorOption;
  isActive: boolean;
  isBg?: boolean;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem
      className="flex items-center gap-2 h-[30px] px-2 py-1"
      onClick={onClick}
    >
      {isBg ? (
        <BgSwatch swatch={item.swatch} isDefault={item.value === null} />
      ) : (
        <TextSwatch swatch={item.swatch} />
      )}
      <span className="flex-1 text-[13px]">
        {item.label} {isBg ? "background" : "text"}
      </span>
      {isActive && <Check className="size-3.5 text-muted-foreground" />}
    </DropdownMenuItem>
  );
}

// ── Scrollable section ────────────────────────────────────────────────

function ColorSection({
  editor,
  label,
  items,
  isBg,
}: {
  editor: Editor;
  label: string;
  items: ColorOption[];
  isBg?: boolean;
}) {
  const activeValue = isBg
    ? getActiveBgColor(editor)
    : getActiveTextColor(editor);

  return (
    <>
      <span className="px-2 pt-1.5 pb-0.5 text-[11px] font-medium uppercase tracking-wider">
        {label}
      </span>
      {items.map((item) => (
        <ColorRow
          key={item.id}
          item={item}
          isActive={activeValue === item.value}
          isBg={isBg}
          onClick={() =>
            isBg
              ? applyBgColor(editor, item.value)
              : applyTextColor(editor, item.value)
          }
        />
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────

interface ColorMenuProps {
  editor: Editor;
  children: React.ReactNode;
  isSubMenu?: boolean;
  className?: string;
  container?: React.RefObject<HTMLDivElement | null>;
}

export function ColorMenu({
  editor,
  isSubMenu,
  children,
  className,
  container,
}: ColorMenuProps) {
  const Menu = isSubMenu ? DropdownMenuSub : DropdownMenu;
  const MenuTrigger = isSubMenu ? DropdownMenuSubTrigger : DropdownMenuTrigger;
  const MenuContent = isSubMenu ? DropdownMenuSubContent : DropdownMenuContent;

  return (
    <Menu>
      <MenuTrigger
        className={cn("flex items-center gap-2 h-8 px-2 py-1", className)}
      >
        {children}
      </MenuTrigger>
      <MenuContent
        container={container}
        className="w-[220px] max-h-[420px] overflow-y-auto p-1"
      >
        <ColorSection editor={editor} label="Text color" items={textColors} />
        <DropdownMenuSeparator className="my-1" />
        <ColorSection
          editor={editor}
          label="Background color"
          items={bgColors}
          isBg
        />
      </MenuContent>
    </Menu>
  );
}
