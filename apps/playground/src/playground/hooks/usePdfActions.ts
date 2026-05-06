import { useCallback, useEffect, useState } from "react";
import type { TypedEditor } from "@open-notion/editor";
import type { PreviewTab } from "../PreviewPane";
import { downloadBlob } from "./useExportAction";

type PdfState = {
  url: string | null;
  busy: boolean;
  error: string | null;
};

export function usePdfActions(
  editor: TypedEditor | null,
  setPreviewTab: (tab: PreviewTab) => void,
) {
  const [pdf, setPdf] = useState<PdfState>({
    url: null,
    busy: false,
    error: null,
  });

  // Revoke blob URL on unmount or when it changes
  useEffect(() => {
    return () => {
      if (pdf.url) URL.revokeObjectURL(pdf.url);
    };
  }, [pdf.url]);

  const handlePdfPreview = useCallback(async () => {
    if (!editor) return;
    setPdf((prev) => ({ ...prev, busy: true, error: null }));
    try {
      const blob = await editor.getPDF();
      setPdf((prev) => {
        if (prev.url) URL.revokeObjectURL(prev.url);
        return { busy: false, error: null, url: URL.createObjectURL(blob) };
      });
      setPreviewTab("pdf");
    } catch (err) {
      setPdf((prev) => ({
        ...prev,
        busy: false,
        error: err instanceof Error ? err.message : "Could not generate PDF",
      }));
    }
  }, [editor, setPreviewTab]);

  const handlePdfDownload = useCallback(async () => {
    if (!editor) return;
    setPdf((prev) => ({ ...prev, busy: true, error: null }));
    try {
      downloadBlob(await editor.getPDF(), "document.pdf");
      setPdf((prev) => ({ ...prev, busy: false }));
    } catch (err) {
      setPdf((prev) => ({
        ...prev,
        busy: false,
        error: err instanceof Error ? err.message : "Could not download PDF",
      }));
    }
  }, [editor]);

  return { pdf, handlePdfPreview, handlePdfDownload };
}
