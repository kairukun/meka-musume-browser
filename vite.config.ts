import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves from /<repo>/ — set at build time via env.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/",
  server: {
    proxy: {
      // Local Ollama without browser CORS pain during `npm run dev`
      "/ollama-api": {
        target: "http://127.0.0.1:11434",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama-api/, ""),
      },
    },
  },
});
