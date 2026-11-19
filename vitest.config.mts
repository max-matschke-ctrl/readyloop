import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const verzeichnis = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": path.resolve(verzeichnis, "src") } },
  test: { include: ["tests/**/*.test.ts", "src/**/*.test.ts"], environment: "node" },
});
