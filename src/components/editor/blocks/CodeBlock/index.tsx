import { useState, useCallback } from "react";
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import { cn } from "@/components/editor/lib/utils";
import { Check, ChevronDown, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/editor/ui/dropdown-menu";
import { languages, getLanguage } from "./languages";
import { shikiPluginKey } from "../../extensions/CustomCodeBlock";
import { Button } from "@/components/editor/ui/button";

export const CodeBlockView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor,
  extension,
}) => {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || "plaintext";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [node.textContent]);

  const handleLanguageChange = useCallback(
    async (lang: string) => {
      updateAttributes({ language: lang });

      const highlighter = extension.storage.highlighter;
      if (
        highlighter &&
        lang !== "plaintext" &&
        !highlighter.getLoadedLanguages().includes(lang)
      ) {
        await highlighter.loadLanguage(lang);
        if (!editor.view.isDestroyed) {
          editor.view.dispatch(
            editor.view.state.tr.setMeta(shikiPluginKey, true),
          );
        }
      }
    },
    [editor, extension, updateAttributes],
  );

  const { name, icon: Icon } = getLanguage(language);

  return (
    <NodeViewWrapper
      as="div"
      className="my-4 rounded-md overflow-hidden border border-editor-border/50 shadow-sm"
    >
      <div
        className="flex items-center justify-between px-3.5 py-2 border-b border-editor-border/50"
        contentEditable={false}
      >
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="group flex items-center gap-1.5 rounded-md p-2 -ml-1.5 text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all outline-none">
            <Icon size={18} />
            {name}
            <ChevronDown className="size-3 opacity-70 group-hover:opacity-100 transition-all group-data-popup-open:rotate-180" />{" "}
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

        {/* Copy button */}
        <Button
          onClick={handleCopy}
          className={cn(
            "group flex items-center gap-1.5",
            "text-[11px] font-medium tracking-wide",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-[hsl(var(--foreground)/0.05)]",
            // Copied state
            copied && "text-emerald-500 hover:text-emerald-500",
          )}
          variant="ghost"
          type="button"
        >
          <span
            className={cn(
              "transition-all duration-200",
              copied ? "scale-110" : "scale-100 group-hover:scale-105",
            )}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </span>
          <span className="uppercase tracking-wider">
            {copied ? "Copied" : "Copy"}
          </span>
        </Button>
      </div>

      <pre spellCheck="false" className="m-0 bg-transparent p-0">
        <code>
          <NodeViewContent
            as="div"
            className="block px-5 py-4 text-[13px] leading-relaxed font-mono overflow-x-auto"
          />
        </code>
      </pre>
    </NodeViewWrapper>
  );
};
