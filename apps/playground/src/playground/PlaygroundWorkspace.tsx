import {
  OpenNotionView,
  useOpenNotion,
  type TypedEditor,
} from "@open-notion/editor";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { cn } from "@/lib/utils";
import { downloadText } from "./downloadBlob";
import { PreviewPane, type PreviewTab } from "./PreviewPane";
import { PlaygroundToolbar, type PreviewMode } from "./Toolbar";
import { usePlaygroundTheme } from "./usePlaygroundTheme";

export function PlaygroundWorkspace() {
  const { theme, toggleTheme } = usePlaygroundTheme();
  const previewModeRef = useRef<PreviewMode>("live");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("live");
  previewModeRef.current = previewMode;

  const editorRef = useRef<TypedEditor | null>(null);
  const [liveHtml, setLiveHtml] = useState("");
  const [staticHtml, setStaticHtml] = useState("");

  const [leftPct, setLeftPct] = useState(50);
  const splitRef = useRef<HTMLDivElement>(null);

  const [previewTab, setPreviewTab] = useState<PreviewTab>("html");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const editor = useOpenNotion({
    storageKey: "oeditor",
    onChange: async () => {
      setPdfError(null);
      const ed = editorRef.current;
      if (!ed || previewModeRef.current !== "live") return;
      setLiveHtml(await ed.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.getHTML().then((html) => {
      setLiveHtml(html);
      setStaticHtml(html);
    });
  }, [editor]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePreviewModeChange = useCallback((mode: PreviewMode) => {
    if (mode === "static" && editorRef.current) {
      editorRef.current.getHTML().then(setStaticHtml);
    }
    setPreviewMode(mode);
  }, []);

  const refreshStatic = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.getHTML().then(setStaticHtml);
  }, []);

  const previewHtml = previewMode === "live" ? liveHtml : staticHtml;

  const handlePdfPreview = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      const blob = await ed.getPDF(undefined, false);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setPreviewTab("pdf");
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : "Could not generate PDF",
      );
    } finally {
      setPdfBusy(false);
    }
  }, []);

  const handlePdfDownload = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      await ed.getPDF("document.pdf", true);
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : "Could not download PDF",
      );
    } finally {
      setPdfBusy(false);
    }
  }, []);

  const exportDisabled = !editor;

  const exportHtml = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    downloadText(
      "document.html",
      await ed.getHTML(),
      "text/html;charset=utf-8",
    );
  }, []);

  const exportMarkdown = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    downloadText(
      "document.md",
      await ed.getMarkdown(),
      "text/markdown;charset=utf-8",
    );
  }, []);

  const exportPlain = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    downloadText(
      "document.txt",
      await ed.getText(),
      "text/plain;charset=utf-8",
    );
  }, []);

  const onDividerMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const wrap = splitRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const startX = e.clientX;
      const startPct = leftPct;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const deltaPct = (dx / rect.width) * 100;
        const next = Math.min(72, Math.max(28, startPct + deltaPct));
        setLeftPct(next);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [leftPct],
  );

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <PlaygroundToolbar
        previewMode={previewMode}
        onPreviewModeChange={handlePreviewModeChange}
        onRefreshStatic={refreshStatic}
        theme={theme}
        onToggleTheme={toggleTheme}
        exportDisabled={exportDisabled}
        onExportHtml={exportHtml}
        onExportMarkdown={exportMarkdown}
        onExportPlain={exportPlain}
        pdfBusy={pdfBusy}
        onPdfPreview={handlePdfPreview}
        onPdfDownload={handlePdfDownload}
      />

      <div ref={splitRef} className="flex min-h-0 flex-1 border-t">
        <div
          className="flex min-h-0 flex-col overflow-hidden border-border bg-card"
          style={{ width: `${leftPct}%` }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {editor ? (
              <OpenNotionView
                editor={editor}
                className={cn(
                  "open-notion-doc relative min-h-full w-full max-w-none cursor-text pl-20 pr-10 py-8",
                )}
              />
            ) : null}
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
          pdfUrl={pdfUrl}
          pdfBusy={pdfBusy}
          pdfError={pdfError}
          tab={previewTab}
          onTabChange={setPreviewTab}
        />
      </div>
    </div>
  );
}
