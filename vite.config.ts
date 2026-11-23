import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SoyaOS gateway during local dev. The Go binary listens on 7474.
const GATEWAY = "http://127.0.0.1:7474";

export default defineConfig({
  plugins: [react()],
  // The Go gateway mounts Studio at /. Root-relative asset URLs also work
  // when a client-side route is opened directly or has a trailing slash.
  base: "/",
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
