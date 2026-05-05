import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    hydration: "src/hydration.ts",
    doc: "src/doc.css",
  },
  format: ["esm"],
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
  bundle: true,
  minify: true,
  dts: false,
  treeshake: true,
});
