import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({ optimize: true }),
    visualizer({
      filename: "temp/bundle-stats.html",
      open: false,
      template: "treemap",
    }) as any,
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    conditions: ["source"],
  },
  assetsInclude: ["**/*.svg"],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          )
            return "react";
          if (id.includes("node_modules/prosemirror-")) return "prosemirror";
          if (id.includes("node_modules/@tiptap/")) return "tiptap";
          if (
            id.includes("node_modules/@base-ui/") ||
            id.includes("node_modules/@floating-ui/")
          )
            return "ui";
        },
      },
    },
  },
});
