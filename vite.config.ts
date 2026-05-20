import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SoyaOS gateway during local dev. The Go binary listens on 7474.
const GATEWAY = "http://127.0.0.1:7474";

export default defineConfig({
  plugins: [react()],
  // Keep paths relative so the build can be embedded behind any prefix
  // by `soyaos serve` via go:embed. Critical for SPA fallback to work:
  // index.html will reference JS/CSS via "./assets/..." rather than
  // "/assets/...", so deep links like /chat reload correctly.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      "/v1": GATEWAY,
      "/control": GATEWAY,
      "/healthz": GATEWAY,
    },
  },
});
