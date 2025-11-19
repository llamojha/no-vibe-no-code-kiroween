import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["tests/setup/vitest.setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "lib/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/properties/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "features/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["node_modules", "dist", ".next", "tests/e2e"],
    environmentMatchGlobs: [
      // Use jsdom for React component tests
      ["features/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}", "jsdom"],
      // Use node for property tests (no browser APIs needed)
      [
        "tests/properties/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "node",
      ],
      // Use node for domain/application/infrastructure tests
      ["src/domain/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}", "node"],
      [
        "src/application/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "node",
      ],
      [
        "src/infrastructure/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "node",
      ],
    ],
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
