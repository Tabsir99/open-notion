import type { HighlighterCore } from "@shikijs/core";

type AppHighlighter = HighlighterCore;

let _promise: Promise<{
  h: AppHighlighter;
  darkTheme: string;
  lightTheme: string;
}> | null = null;

export async function getHighlighter(): Promise<{
  h: AppHighlighter;
  darkTheme: string;
  lightTheme: string;
}> {
  if (!_promise) {
    _promise = (async () => {
      const [
        { createHighlighterCore },
        { createJavaScriptRegexEngine },
        { default: lightPlus },
        { default: darkPlus },
      ] = await Promise.all([
        import("@shikijs/core"),
        import("@shikijs/engine-javascript"),
        import("@shikijs/themes/light-plus"),
        import("@shikijs/themes/dark-plus"),
      ]);
      const h = await createHighlighterCore({
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
      return { h, darkTheme: darkPlus.name!, lightTheme: lightPlus.name! };
    })();
  }
  return _promise;
}

export type AppHighlighterConfig = {
  h: AppHighlighter;
  darkTheme: string;
  lightTheme: string;
};
