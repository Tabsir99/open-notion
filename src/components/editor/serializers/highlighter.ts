import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import lightPlus from "@shikijs/themes/light-plus";
import darkPlus from "@shikijs/themes/dark-plus";

export type AppHighlighter = Awaited<ReturnType<typeof createHighlighterCore>>;

let _highlighter: AppHighlighter | null = null;

export async function getHighlighter(): Promise<AppHighlighter> {
  if (_highlighter) return _highlighter;
  _highlighter = await createHighlighterCore({
    themes: [lightPlus, darkPlus],
    langs: [
      import("@shikijs/langs/typescript"),
      import("@shikijs/langs/python"),
      import("@shikijs/langs/html"),
      import("@shikijs/langs/css"),
      import("@shikijs/langs/json"),
      import("@shikijs/langs/bash"),
      import("@shikijs/langs/sql"),
      import("@shikijs/langs/go"),
      import("@shikijs/langs/rust"),
      import("@shikijs/langs/yaml"),
      import("@shikijs/langs/markdown"),
      import("@shikijs/langs/dockerfile"),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return _highlighter;
}
