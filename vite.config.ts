import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    rollupOptions: {
      input: "src/index.dev.html"
    },
    target: "es2022"
  },
  server: {
    host: "127.0.0.1"
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"]
  }
});
