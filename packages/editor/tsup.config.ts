import { defineConfig } from "tsup";
import { execSync } from "child_process";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: {
      resolve: true,
      compilerOptions: {
        composite: false,
        incremental: false,
      },
    },
    tsconfig: "tsconfig.json",
    sourcemap: true,
    clean: true,
    minify: true,
    splitting: true,
    treeshake: true,
    target: "es2022",
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      /^@tiptap\//,
      "@open-notion/serializers",
    ],
    loader: {
      ".css": "empty",
    },

    onSuccess: async () => {
      execSync(
        "tailwindcss -i src/styles/_full.css -o dist/styles/compiled.css --minify",
      );

      // Worker is built as a sibling entry below; rewrite the source-mode
      // `.ts` reference left behind by esbuild so the published chunk points
      // at the real built worker file. Both extensions are 3 chars → byte
      // offsets unchanged, sourcemaps stay aligned.
      const distDir = "dist";
      for (const name of await readdir(distDir)) {
        if (!name.endsWith(".js")) continue;
        if (name === "shikiWorker.js") continue;
        const fp = join(distDir, name);
        const before = await readFile(fp, "utf8");
        const after = before.replaceAll(
          "./shikiWorker.ts",
          "./shikiWorker.js",
        );
        if (after !== before) await writeFile(fp, after);
      }
    },
  },

  {
    entry: { shikiWorker: "src/extensions/shikiWorker.ts" },
    format: ["esm"],
    outDir: "dist",
    tsconfig: "tsconfig.json",
    sourcemap: true,
    clean: false,
    minify: true,
    splitting: false,
    treeshake: true,
    target: "es2022",
    platform: "browser",
    dts: false,
    // Leave the worker as a thin transpile. The only bare import it has is
    // `@open-notion/serializers/highlighter`, which itself dynamically
    // imports `@shikijs/*`. The consumer's bundler treats this file as a
    // worker entry and bundles its dep graph independently, so shiki engine,
    // langs, and themes become separately code-split + cached chunks in the
    // consumer's output instead of a single 1.5 MB blob shipped from us.
    external: ["@open-notion/serializers"],
    loader: {
      ".css": "empty",
    },
  },
]);
