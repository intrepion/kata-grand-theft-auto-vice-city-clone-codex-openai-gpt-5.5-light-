import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  use: {
    baseURL: "http://127.0.0.1:4387",
    browserName: "chromium"
  },
  webServer: {
    command: "npm run build:file && npx vite preview --host 127.0.0.1 --port 4387",
    url: "http://127.0.0.1:4387",
    reuseExistingServer: false,
    timeout: 120000
  }
});
