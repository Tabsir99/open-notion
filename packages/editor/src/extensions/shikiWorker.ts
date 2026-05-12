/// <reference lib="webworker" />
// Import via the `./highlighter` subpath (not the package index) — the index
// re-exports React renderers, which drag `@react-refresh` into the worker
// bundle, and `@react-refresh` references `window` (no such thing in a worker).
import {
  getHighlighter,
  type HighlightEngine,
} from "@open-notion/serializers/highlighter";

declare const self: DedicatedWorkerGlobalScope;

type TokenLines = Array<
  Array<{
    content: string;
    variants?: { light?: { color?: string }; dark?: { color?: string } };
  }>
>;

export type WorkerReqBody = {
  pos: number;
  code: string;
  lang: string;
  engine: HighlightEngine;
};

export type WorkerDeco = {
  /** Offset relative to the codeblock node start; the extension adds `pos`. */
  from: number;
  to: number;
  style: string;
};

export type WorkerResBody = {
  pos: number;
  decos: WorkerDeco[];
};

function decorationsFromTokens(tokens: TokenLines): WorkerDeco[] {
  const decos: WorkerDeco[] = [];
  // First text position inside the codeblock is pos + 1; the extension
  // adds `pos` back when creating ProseMirror decorations.
  let offset = 1;
  for (let i = 0; i < tokens.length; i++) {
    const line = tokens[i] ?? [];
    for (let j = 0; j < line.length; j++) {
      const tok = line[j]!;
      const from = offset;
      const to = from + tok.content.length;
      const lightColor = tok.variants?.light?.color;
      const darkColor = tok.variants?.dark?.color;
      if (lightColor || darkColor) {
        const styleParts: string[] = [];
        if (lightColor) styleParts.push(`--shiki-light: ${lightColor}`);
        if (darkColor) styleParts.push(`--shiki-dark: ${darkColor}`);
        decos.push({ from, to, style: styleParts.join("; ") });
      }
      offset = to;
    }
    if (i < tokens.length - 1) offset += 1;
  }
  return decos;
}

self.onmessage = async (e: MessageEvent<WorkerReqBody>) => {
  const { pos, code, lang, engine } = e.data;
  const { h, lightTheme, darkTheme } = await getHighlighter({ engine });

  let tokens: TokenLines = [];
  if (
    code.length > 0 &&
    lang !== "plaintext" &&
    h.getLoadedLanguages().includes(lang)
  ) {
    try {
      tokens = h.codeToTokensWithThemes(code, {
        lang,
        themes: { light: lightTheme, dark: darkTheme },
      }) as TokenLines;
    } catch {
      /* unsupported grammar — render plain */
    }
  }

  self.postMessage({
    pos,
    decos: decorationsFromTokens(tokens),
  } satisfies WorkerResBody);
};
