import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves from /<repo>/ — set at build time via env.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/",
});
