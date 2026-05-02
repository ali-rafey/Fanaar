import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    // Note: route-level code splitting via React.lazy in App.tsx already
    // produces per-page chunks. We intentionally do NOT use rollup
    // manualChunks — splitting node_modules by library can break React's
    // module identity (a chunk evaluating before its React import resolves
    // throws "Cannot read properties of undefined (reading 'createContext')").
    // Vite's default chunking is already correct and well-cached.
  },
}));
