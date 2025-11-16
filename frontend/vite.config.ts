// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.VITE_PORT) || 5173,
    proxy: {
      "/api/auth": {
        target: "http://backend:8080",
        changeOrigin: true,
      },
      "/api/bookmarks": {
        target: "http://backend:8080",
        changeOrigin: true,
      },
      "/api": {
        target: "http://ai:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
