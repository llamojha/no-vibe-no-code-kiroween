import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["tests/setup/vitest.setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "lib/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/properties/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "features/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["node_modules", "dist", ".next", "tests/e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      exclude: [
        "node_modules/",
        ".next/",
        "dist/",
        "src/**/*.d.ts",
        "src/**/*.config.*",
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/**/test-runner.ts",
        "tests/properties/**/*.test.*",
        "tests/properties/**/*.spec.*",
      ],
      all: false,
      skipFull: false,
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@/domain": resolve(__dirname, "src/domain"),
      "@/application": resolve(__dirname, "src/application"),
      "@/infrastructure": resolve(__dirname, "src/infrastructure"),
      "@/shared": resolve(__dirname, "src/shared"),
    },
  },
});
