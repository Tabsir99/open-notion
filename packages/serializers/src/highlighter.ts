import type { HighlighterCore, RegexEngine } from "@shikijs/core";

// Bundlers (Vite/Webpack/esbuild) inline `process.env.NODE_ENV` at build
// time; the typeof guard makes the runtime safe in environments where the
// constant wasn't inlined (e.g. raw browser ESM).
declare const process:
  | { env: { NODE_ENV?: string } }
  | undefined;

type AppHighlighter = HighlighterCore;

export type HighlightEngine = "js" | "wasm";

export type AppHighlighterConfig = {
  h: AppHighlighter;
  darkTheme: string;
  lightTheme: string;
};

const _promises = new Map<HighlightEngine, Promise<AppHighlighterConfig>>();
let _default: HighlightEngine = "js";

/**
 * Set the engine returned by `getHighlighter()` calls that don't pass one
 * explicitly. Per-engine caches are unaffected — a later call with an
 * explicit `engine` still receives that engine's highlighter.
 */
export function setHighlightEngine(engine: HighlightEngine): void {
  _default = engine;
}

async function createJsEngine(): Promise<RegexEngine> {
  const { createJavaScriptRegexEngine } = await import(
    "@shikijs/engine-javascript"
  );
  return createJavaScriptRegexEngine();
}

async function createWasmEngine(): Promise<RegexEngine> {
  const [{ createOnigurumaEngine }, wasmInlined] = await Promise.all([
    import("@shikijs/engine-oniguruma"),
    import("@shikijs/engine-oniguruma/wasm-inlined"),
  ]);
  return createOnigurumaEngine(wasmInlined);
}

async function build(engine: HighlightEngine): Promise<AppHighlighterConfig> {
  const [
    { createHighlighterCore },
    { default: lightPlus },
    { default: darkPlus },
    regexEngine,
  ] = await Promise.all([
    import("@shikijs/core"),
    import("@shikijs/themes/light-plus"),
    import("@shikijs/themes/dark-plus"),
    engine === "wasm" ? createWasmEngine() : createJsEngine(),
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
    engine: regexEngine,
  });
  return { h, darkTheme: darkPlus.name!, lightTheme: lightPlus.name! };
}

/**
 * Return the highlighter for the requested engine. Each engine is built at
 * most once; concurrent callers for the same engine share the in-flight
 * promise. Different engines yield independent highlighter instances.
 */
export async function getHighlighter(opts?: {
  engine?: HighlightEngine;
}): Promise<AppHighlighterConfig> {
  const engine = opts?.engine ?? _default;
  let p = _promises.get(engine);
  if (!p) {
    if (
      _promises.size > 0 &&
      typeof process !== "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      const loaded = Array.from(_promises.keys()).join(", ");
      console.warn(
        `[open-notion] Loading shiki engine "${engine}" while "${loaded}" ` +
          `${_promises.size === 1 ? "is" : "are"} already loaded. ` +
          `Multiple engines double the bundle cost; pick one via setHighlightEngine() ` +
          `or useOpenNotion({ highlightEngine }).`,
      );
    }
    p = build(engine);
    _promises.set(engine, p);
  }
  return p;
}
