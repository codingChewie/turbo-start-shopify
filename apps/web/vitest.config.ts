import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
  // The Next preset sets `jsx: "preserve"` and lets the Next compiler handle it,
  // which leaves esbuild defaulting to the classic runtime and a component under
  // test failing on `React is not defined`.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
