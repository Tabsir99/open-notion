import { useCallback, useRef, useState } from "react";
import type {} from "@tiptap/core";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { useEditorState } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Palette,
  ChevronDown,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TurnIntomenu } from "../TurnIntoMenu";
import { ColorMenu } from "../ColorMenu";
import { LinkInput } from "./LinkInput";
import type { TypedEditor } from "../../types";

// ── Data ──────────────────────────────────────────────────────────────

interface MarkItem {
  id: string;
  label: string;
  icon: LucideIcon;
  markName: string;
  command: (editor: TypedEditor) => void;
}

const markItems: MarkItem[] = [
  {
    id: "bold",
    label: "Bold",
    icon: Bold,
    markName: "bold",
    command: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    label: "Italic",
    icon: Italic,
    markName: "italic",
    command: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "underline",
    label: "Underline",
    icon: Underline,
    markName: "underline",
    command: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    id: "strikethrough",
    label: "Strikethrough",
    icon: Strikethrough,
    markName: "strike",
    command: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: "code",
    label: "Code",
    icon: Code,
    markName: "code",
    command: (editor) => editor.chain().focus().toggleCode().run(),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

/** Returns a human-readable label for the current block type */
function getActiveBlockLabel(editor: TypedEditor): string {
  if (editor.isActive("heading", { level: 1 })) return "Heading 1";
  if (editor.isActive("heading", { level: 2 })) return "Heading 2";
  if (editor.isActive("heading", { level: 3 })) return "Heading 3";
  return "Text";
}

// ── Component ─────────────────────────────────────────────────────────

interface BubbleToolbarProps {
  editor: TypedEditor;
}

type LinkMode = "closed" | "open" | "closing";

export function BubbleMenu({ editor }: BubbleToolbarProps) {
  const [linkMode, setLinkMode] = useState<LinkMode>("closed");

  const activeStates = useEditorState({
    editor: editor as any,
    selector: (ctx) => {
      const ed = ctx.editor as TypedEditor;
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        strike: ed.isActive("strike"),
        code: ed.isActive("code"),
        link: ed.isActive("link"),
        label: getActiveBlockLabel(ed),
      };
    },
  });

  const handleLinkInputClose = useCallback(() => {
    setLinkMode("closing");
    setTimeout(() => setLinkMode("closed"), 150);
  }, []);

  const container = useRef<HTMLDivElement>(null);

  return (
    <TiptapBubbleMenu
      ref={container}
      editor={editor as any}
      options={{
        placement: "top",
        offset: 8,
        strategy: "absolute",
      }}
      shouldShow={({ state }) => {
        const { selection } = state;
        const { empty } = selection;

        // Don't show on empty selections
        if (empty) {
          setLinkMode("closed");
          return false;
        }

        // Don't show on node selections (images, etc.)
        if (selection.constructor.name === "NodeSelection") return false;

        return true;
      }}
      className="transition-[inset] shadow-xl"
    >
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-[10px] p-1",
          "bg-popover text-popover-foreground",
          "ring-1 ring-foreground/10",
          "animate-in fade-in-0 zoom-in-95 duration-150",
        )}
      >
        {linkMode !== "closed" ? (
          /* ── Inline link input mode ────────────────────────── */
          <LinkInput
            editor={editor}
            onClose={handleLinkInputClose}
            isExiting={linkMode === "closing"}
          />
        ) : (
          /* ── Normal toolbar mode ───────────────────────────── */
          <>
            {/* Formatting mark toggles */}
            {markItems.map(({ id, label, icon: Icon, markName, command }) => (
              <Toggle
                key={id}
                size="sm"
                pressed={
                  activeStates[markName as keyof typeof activeStates] === true
                }
                onPressedChange={() => command(editor)}
                aria-label={label}
              >
                <Icon className="size-4" />
              </Toggle>
            ))}

            <Separator orientation="vertical" className="mx-0.5 h-6" />

            {/* Link button */}
            <Toggle
              size="sm"
              pressed={activeStates.link}
              onPressedChange={() => setLinkMode("open")}
              aria-label="Link"
            >
              <Link className="size-4" />
            </Toggle>

            <Separator orientation="vertical" className="mx-0.5 h-6" />

            {/* Color menu */}
            <ColorMenu
              container={container}
              onSelectText={(c) =>
                editor
                  .chain()
                  .focus()
                  .setColor(c ?? "")
                  .run()
              }
              onSelectBg={(c) =>
                editor
                  .chain()
                  .focus()
                  .setBackgroundColor(c ?? "")
                  .run()
              }
            >
              <Palette className="size-4" />
            </ColorMenu>

            <Separator orientation="vertical" className="mx-0.5 h-6" />

            <TurnIntomenu
              blockPos={() =>
                editor.state.selection.$from.depth > 0
                  ? editor.state.selection.$from.before(1)
                  : 0
              }
              className={buttonVariants({ variant: "ghost" })}
              container={container}
            >
              <span>{activeStates.label}</span>
              <ChevronDown className="size-3" />
            </TurnIntomenu>
          </>
        )}
      </div>
    </TiptapBubbleMenu>
  );
}
