import { useState, useCallback, memo, type MouseEvent } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { cn } from "../../lib/utils";
import { Check, ChevronDown, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../ui/dropdown-menu";
import { languages, getLanguage } from "./languages";
import { shikiPluginKey } from "../../extensions/CustomCodeBlock";
import type { TypedNodeViewProps } from "../../types";

export const CodeBlockView = memo(
  ({ node, updateAttributes, editor }: TypedNodeViewProps<"codeBlock">) => {
    const [copied, setCopied] = useState(false);
    const language = node.attrs.language || "plaintext";

    const handleCopy = useCallback(
      async (e: MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(node.textContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      [node.textContent],
    );

    const handleLanguageChange = useCallback(
      (lang: string) => {
        updateAttributes({ language: lang });
        if (!editor.view.isDestroyed) {
          editor.view.dispatch(
            editor.view.state.tr.setMeta(shikiPluginKey, true),
          );
        }
      },
      [editor, updateAttributes],
    );

    const Lang = getLanguage(language);

    return (
      <NodeViewWrapper
        ref={(el: HTMLElement | null) => {
          el?.parentElement?.setAttribute("data-type", "codeBlock");
        }}
        as="div"
      >
        <div data-code-block-header contentEditable={false}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              data-code-block-language
              className="cursor-pointer hover:bg-foreground/5 p-1.5 rounded-md"
            >
              <Lang.icon size={14} />
              {Lang.name}
              <ChevronDown size={10} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-64 overflow-y-auto min-w-40 p-1 rounded-lg"
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.id}
                  className={cn(
                    "flex items-center gap-2.5 h-7 px-2 py-5 rounded-md text-sm font-medium",
                    language === lang.id && "bg-foreground/5 text-foreground",
                  )}
                  onClick={() => handleLanguageChange(lang.id)}
                >
                  <span className="flex items-center size-3.5 opacity-70">
                    <lang.icon />
                  </span>
                  <span className="flex-1">{lang.name}</span>
                  {language === lang.id && (
                    <Check className="size-3 text-muted-foreground/50" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            data-copy-button
            data-copied={copied}
            onClick={handleCopy}
            type="button"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <pre spellCheck="false">
          <code>
            <NodeViewContent as="div" />
          </code>
        </pre>
      </NodeViewWrapper>
    );
  },
  (p, n) => {
    if (p.node.attrs.language !== n.node.attrs.language) return false;
    if (p.node.textContent !== n.node.textContent) return false;
    return true;
  },
);
