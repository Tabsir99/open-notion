import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/editor/ui/input";
import { cn } from "@/components/editor/lib/utils";
import { CornerDownLeft, ExternalLink, Unlink, X } from "lucide-react";
import type { TypedEditor } from "../../types";

interface LinkInputProps {
  editor: TypedEditor;
  onClose: () => void;
  isExiting?: boolean;
}

export function LinkInput({
  editor,
  onClose,
  isExiting = false,
}: LinkInputProps) {
  const initialUrl = editor.getAttributes("link").href || "";
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, []);

  const normalizeHref = (raw: string) =>
    /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  const apply = useCallback(() => {
    const trimmed = url.trim();
    if (trimmed) {
      editor
        .chain()
        .focus()
        .setLink({ href: normalizeHref(trimmed) })
        .run();
    }
    onClose();
  }, [editor, url, onClose]);

  const unlink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    onClose();
  }, [editor, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        apply();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        editor.commands.focus();
      }
    },
    [apply, onClose, editor],
  );

  const trimmed = url.trim();
  const visitHref = trimmed ? normalizeHref(trimmed) : undefined;
  const hasExistingLink = initialUrl.length > 0;

  const iconBtn = cn(
    "flex items-center justify-center size-6 rounded-md shrink-0",
    "text-muted-foreground transition-colors duration-150",
    "hover:text-foreground hover:bg-accent",
    "aria-disabled:opacity-40 aria-disabled:pointer-events-none",
  );

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-1.5",
        isExiting
          ? "animate-out fade-out-0 slide-out-to-left-2 duration-150"
          : "animate-in fade-in-0 slide-in-from-left-2 duration-150",
      )}
    >
      <Input
        ref={inputRef}
        value={url}
        onChange={(e) => setUrl(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Paste or type a link…"
        className="h-8 w-48 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:border-0 px-1"
      />

      {/* Visit */}
      <a
        href={visitHref ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!visitHref}
        className={iconBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          if (!visitHref) e.preventDefault();
        }}
        aria-label="Visit link"
      >
        <ExternalLink className="size-3.5" />
      </a>

      {/* Unlink — only when editing an existing link */}
      {hasExistingLink && (
        <button
          type="button"
          className={iconBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={unlink}
          aria-label="Remove link"
        >
          <Unlink className="size-3.5" />
        </button>
      )}

      {/* Apply */}
      <button
        type="button"
        className={iconBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={apply}
        aria-label="Apply link"
      >
        <CornerDownLeft className="size-3.5" />
      </button>

      {/* Cancel */}
      <button
        type="button"
        className={iconBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onClose();
          editor.commands.focus();
        }}
        aria-label="Cancel"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
