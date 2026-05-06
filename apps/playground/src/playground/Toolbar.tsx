import { memo } from "react";
import {
  ChevronDown,
  FileCode2,
  FileDown,
  FileText,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type PreviewMode = "live" | "static";

type ToolbarProps = {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onRefreshStatic: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  exportDisabled: boolean;
  onExportHtml: () => void;
  onExportMarkdown: () => void;
  onExportPlain: () => void;
  pdfBusy: boolean;
  onPdfPreview: () => void;
  onPdfDownload: () => void;
};

export const PlaygroundToolbar = memo(
  ({
    previewMode,
    onPreviewModeChange,
    onRefreshStatic,
    theme,
    onToggleTheme,
    exportDisabled,
    onExportHtml,
    onExportMarkdown,
    onExportPlain,
    pdfBusy,
    onPdfPreview,
    onPdfDownload,
  }: ToolbarProps) => {
    return (
      <Card className="gap-0 rounded-none border-x-0 border-t-0 py-0 shadow-none ring-0">
        <CardContent className="flex flex-row flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Playground
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Editor &amp; preview
            </span>
          </div>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <ToggleGroup
            type="single"
            spacing={0}
            variant="outline"
            size="sm"
            value={previewMode}
            onValueChange={(v) => {
              if (v === "live" || v === "static") onPreviewModeChange(v);
            }}
            aria-label="Preview update mode"
          >
            <ToggleGroupItem value="live">Live preview</ToggleGroupItem>
            <ToggleGroupItem value="static">Static preview</ToggleGroupItem>
          </ToggleGroup>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={previewMode !== "static"}
            onClick={onRefreshStatic}
            title={
              previewMode === "static"
                ? "Capture the current document into the static preview"
                : "Switch to static preview to refresh manually"
            }
          >
            <RefreshCw data-icon="inline-start" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Separator orientation="vertical" className="hidden h-6 md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={exportDisabled}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              Export
              <ChevronDown className="opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuItem onSelect={onExportHtml}>
                <FileCode2 />
                HTML
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportMarkdown}>
                <FileText />
                Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportPlain}>
                <FileText />
                Plain text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={exportDisabled}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              {pdfBusy ? "PDF…" : "PDF"}
              <ChevronDown className="opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              <DropdownMenuItem disabled={pdfBusy} onSelect={onPdfPreview}>
                <FileDown />
                Generate preview
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onPdfDownload}>
                <FileDown />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex flex-1 min-[520px]:justify-end">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onToggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
  (p, n) => {
    const keys = Object.keys(n) as (keyof typeof n)[];
    return keys.every((key) => {
      if (typeof n[key] === "function") return true; // ignore function changes
      return p[key] === n[key];
    });
  },
);
