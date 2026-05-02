import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "temp/bundle-stats.html",
      open: false,
      template: "list",
    }) as any,
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    conditions: ["source"],
  },
  assetsInclude: ["**/*.svg"],
});
