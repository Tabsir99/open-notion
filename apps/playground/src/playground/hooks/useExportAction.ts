import { useCallback } from "react";
import type { TypedEditor } from "@open-notion/editor";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, content: string, mime: string) {
  downloadBlob(new Blob([content], { type: mime }), filename);
}

export function useExportActions(editor: TypedEditor | null) {
  const exportHtml = useCallback(async () => {
    if (!editor) return;
    downloadText(
      "document.html",
      await editor.getHTML(),
      "text/html;charset=utf-8",
    );
  }, [editor]);

  const exportMarkdown = useCallback(async () => {
    if (!editor) return;
    downloadText(
      "document.md",
      await editor.getMarkdown(),
      "text/markdown;charset=utf-8",
    );
  }, [editor]);

  const exportPlain = useCallback(async () => {
    if (!editor) return;
    downloadText(
      "document.txt",
      await editor.getText(),
      "text/plain;charset=utf-8",
    );
  }, [editor]);

  return { exportHtml, exportMarkdown, exportPlain };
}
