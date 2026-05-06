import { useEffect, useState } from "react";
import { OpenNotionView, useOpenNotion } from "@open-notion/editor";
import { cn } from "@/lib/utils";
import { PlaygroundToolbar } from "./Toolbar";
import { usePlaygroundTheme } from "./usePlaygroundTheme";
import { useDivider } from "./hooks/useDivider";
import { useExportActions } from "./hooks/useExportAction";
import { useLivePreview } from "./hooks/useLivePreview";
import { usePdfActions } from "./hooks/usePdfActions";
import { PreviewPane, type PreviewTab } from "./PreviewPane";

export function PlaygroundWorkspace() {
  const { theme, toggleTheme } = usePlaygroundTheme();
  const [previewTab, setPreviewTab] = useState<PreviewTab>("html");

  const {
    previewMode,
    previewHtml,
    onChange,
    seedHtml,
    handlePreviewModeChange,
    refreshStatic,
  } = useLivePreview();

  const editor = useOpenNotion({
    storageKey: "oeditor",
    onChange: () => onChange(editor),
    throttle: 100,
  });

  const { pdf, handlePdfPreview, handlePdfDownload } = usePdfActions(
    editor,
    setPreviewTab,
  );
  const { exportHtml, exportMarkdown, exportPlain } = useExportActions(editor);
  const { leftPct, splitRef, onDividerMouseDown } = useDivider();

  useEffect(() => {
    if (editor) seedHtml(editor);
  }, [editor, seedHtml]);

  if (!editor) return null;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <PlaygroundToolbar
        previewMode={previewMode}
        onPreviewModeChange={(m) => handlePreviewModeChange(editor, m)}
        onRefreshStatic={() => refreshStatic(editor)}
        theme={theme}
        onToggleTheme={toggleTheme}
        exportDisabled={!editor}
        onExportHtml={exportHtml}
        onExportMarkdown={exportMarkdown}
        onExportPlain={exportPlain}
        pdfBusy={pdf.busy}
        onPdfPreview={handlePdfPreview}
        onPdfDownload={handlePdfDownload}
      />

      <div ref={splitRef} className="flex min-h-0 flex-1 border-t">
        <div
          className="flex min-h-0 flex-col overflow-hidden border-border bg-card"
          style={{ width: `${leftPct}%` }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {editor && (
              <OpenNotionView
                editor={editor}
                className={cn(
                  "open-notion-doc relative min-h-full w-full max-w-none cursor-text pl-20 pr-10 py-8",
                )}
              />
            )}
          </div>
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panes"
          onMouseDown={onDividerMouseDown}
          className="group relative w-px shrink-0 cursor-col-resize bg-border"
        >
          <span className="absolute inset-y-0 -left-1 -right-1 bg-transparent group-hover:bg-accent/30" />
        </div>

        <PreviewPane
          previewMode={previewMode}
          html={previewHtml}
          pdfUrl={pdf.url}
          pdfBusy={pdf.busy}
          pdfError={pdf.error}
          tab={previewTab}
          onTabChange={setPreviewTab}
        />
      </div>
    </div>
  );
}
