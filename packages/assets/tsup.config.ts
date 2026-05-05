import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "hydration.js": "src/hydration.ts",
    "doc.css": "src/doc.css",
  },
  format: ["iife"],
  outDir: "dist",
  bundle: true,
  minify: true,
  dts: false,
  treeshake: true,
});
