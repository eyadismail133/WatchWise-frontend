/// <reference types="vitest/config" />
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor";
          }
          // Motion is a large, rarely-changing animation runtime shared by every
          // route; a dedicated chunk keeps the app entry under the 500 kB budget
          // and lets browsers cache it across deploys.
          if (
            id.includes("node_modules/motion/") ||
            id.includes("node_modules/framer-motion/") ||
            id.includes("node_modules/motion-dom/") ||
            id.includes("node_modules/motion-utils/")
          ) {
            return "motion-vendor";
          }
        },
      },
    },
  },
  test: {
    setupFiles: ["./src/test-setup.ts"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
