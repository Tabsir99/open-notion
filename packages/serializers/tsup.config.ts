import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  tsconfig: "tsconfig.build.json",
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@react-pdf/renderer",
    /^@shikijs\//,
  ],
});
