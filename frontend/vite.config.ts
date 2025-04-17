import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/sse": "http://localhost:3001",
      "/messages": "http://localhost:3001",
    },
  },
});
