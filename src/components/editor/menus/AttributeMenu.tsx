import { cn } from "@/components/editor/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/editor/ui/dropdown-menu";
import { buttonVariants } from "@/components/editor/ui/button";
import { editorStore, useEditorStore } from "../store";

export const getBlockAttr = (key: string, pos?: number): string | null => {
  if (pos === undefined) return "";
  const node = editorStore.get().editor?.state.doc.nodeAt(pos);
  return (node?.attrs[key] as string) ?? "";
};

interface AttributeMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  isSub?: boolean;
  container?: React.RefObject<HTMLElement | null>;
}

export function AttributeMenu({
  children,
  trigger,
  isSub,
  container,
}: AttributeMenuProps) {
  const Root = isSub ? DropdownMenuSub : DropdownMenu;
  const Trigger = isSub ? DropdownMenuSubTrigger : DropdownMenuTrigger;
  const Content = isSub ? DropdownMenuSubContent : DropdownMenuContent;

  const editorContainer = useEditorStore((s) => s.editorContainer);

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
        container={container ?? editorContainer}
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
