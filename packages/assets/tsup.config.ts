import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "open-notion-hydration": "src/hydration.ts",
    "open-notion-doc": "src/open-notion-doc.css",
  },
  format: ["iife"],
  outDir: "dist",
  bundle: true,
  minify: true,
  dts: false,
  treeshake: true,
});
