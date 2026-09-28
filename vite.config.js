import { defineConfig, loadEnv } from "vite";
import { validateCloudConfig } from "./scripts/cloud-config.js";
export default defineConfig(({ mode }) => {
  validateCloudConfig({
    ...loadEnv(mode, process.cwd(), "VITE_"),
    ...process.env,
  });
  return {
    server: { proxy: { "/api": "http://127.0.0.1:3001" } },
    build: { outDir: "dist" },
  };
});
