import { defineConfig } from "tsup";
import { execSync } from "child_process";

export default defineConfig({
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
  },
});
