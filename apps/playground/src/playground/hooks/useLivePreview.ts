import { useCallback, useRef, useState } from "react";
import type { TypedEditor } from "@open-notion/editor";
import type { PreviewMode } from "../Toolbar";

type HtmlState = { live: string; static: string };

export function useLivePreview() {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("static");
  const previewModeRef = useRef<PreviewMode>("static");
  previewModeRef.current = previewMode;

  const [html, setHtml] = useState<HtmlState>({ live: "", static: "" });

  const onChange = useCallback(async (editor: TypedEditor | null) => {
    if (previewModeRef.current !== "live" || !editor) return;

    const live = await editor.getHTML();
    setHtml((prev) => ({ ...prev, live }));
  }, []);

  const seedHtml = useCallback(async (editor: TypedEditor) => {
    const h = await editor.getHTML();
    setHtml({ live: h, static: h });
  }, []);

  const handlePreviewModeChange = useCallback(
    (editor: TypedEditor, mode: PreviewMode) => {
      if (mode === "static") {
        editor
          .getHTML()
          .then((s) => setHtml((prev) => ({ ...prev, static: s })));
      }
      setPreviewMode(mode);
    },
    [],
  );

  const refreshStatic = useCallback((editor: TypedEditor) => {
    editor.getHTML().then((s) => setHtml((prev) => ({ ...prev, static: s })));
  }, []);

  const previewHtml = previewMode === "live" ? html.live : html.static;

  return {
    previewMode,
    previewHtml,
    onChange,
    seedHtml,
    handlePreviewModeChange,
    refreshStatic,
  };
}
