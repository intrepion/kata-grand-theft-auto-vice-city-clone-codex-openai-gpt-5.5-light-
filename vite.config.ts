import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
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
