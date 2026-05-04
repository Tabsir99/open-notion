import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import lightPlus from "@shikijs/themes/light-plus";
import darkPlus from "@shikijs/themes/dark-plus";

type AppHighlighter = Awaited<ReturnType<typeof createHighlighterCore>>;

let _highlighter: AppHighlighter | null = null;

export async function getHighlighter(): Promise<{
  h: AppHighlighter;
  darkTheme: string;
  lightTheme: string;
}> {
  if (!_highlighter)
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

  return {
    h: _highlighter,
    darkTheme: darkPlus.name!,
    lightTheme: lightPlus.name!,
  };
}

export function getCachedHighlighter(): {
  h: AppHighlighter;
  darkTheme: string;
  lightTheme: string;
} | null {
  if (!_highlighter) return null;
  return {
    h: _highlighter,
    darkTheme: darkPlus.name!,
    lightTheme: lightPlus.name!,
  };
}

export type AppHighlighterConfig = {
  h: AppHighlighter;
  darkTheme: string;
  lightTheme: string;
};
