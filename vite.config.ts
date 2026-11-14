import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
// The Android app lays the page out inside the system bars (status bar on top, buttons below)
// instead of under them, so headers are never covered. The website keeps viewport-fit=cover.
const nativeViewport = (mode: string): Plugin => ({
  name: "native-viewport",
  transformIndexHtml: (html) => (mode === "native" ? html.replace("viewport-fit=cover", "viewport-fit=auto") : html),
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), nativeViewport(mode)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Split heavy vendor libs into their own chunks so the initial JS
    // download is small and pages render faster on slower devices/networks.
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "supabase": ["@supabase/supabase-js"],
          "query": ["@tanstack/react-query"],
          "i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
}));
