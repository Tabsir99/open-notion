import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import type { Editor } from "@tiptap/core";
import { buttonVariants } from "@/components/ui/button";

export const getBlockAttr = (
  editor: Editor,
  key: string,
  pos?: number,
): string | null => {
  if (pos === undefined) return "";
  const node = editor.state.doc.nodeAt(pos);
  return (node?.attrs[key] as string) ?? "";
};

interface AttributeMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  isSub?: boolean;
  container?: React.RefObject<HTMLDivElement | null>;
}

export function AttributeMenu({
  children,
  container,
  trigger,
  isSub,
}: AttributeMenuProps) {
  const Root = isSub ? DropdownMenuSub : DropdownMenu;
  const Trigger = isSub ? DropdownMenuSubTrigger : DropdownMenuTrigger;
  const Content = isSub ? DropdownMenuSubContent : DropdownMenuContent;

  return (
    <Root>
      <Trigger
        className={cn(
          "flex items-center gap-2 h-8 px-2 py-1",
          !isSub && buttonVariants({ variant: "ghost", size: "sm" }),
        )}
      >
        {trigger}
      </Trigger>
      <Content
        container={container}
        className={cn(
          "w-[220px] max-h-[400px] overflow-y-auto no-scrollbar border py-0",
        )}
      >
        {children}
      </Content>
    </Root>
  );
}

export const AttributeHeader = ({ title }: { title: string }) => {
  return (
    <div className="sticky top-0 z-10 bg-popover px-2.5 py-1.5 border-b border-border/50">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
        {title}
      </span>
    </div>
  );
};
