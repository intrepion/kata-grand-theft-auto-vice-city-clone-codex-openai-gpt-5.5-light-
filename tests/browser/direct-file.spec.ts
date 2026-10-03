import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

test("direct file build boots without a dev server", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(pathToFileURL("dist-file/index.html").toString());

  await expect(page.getByTestId("boot-card")).toContainText(
    "Vesper Key scene online"
  );
  await expect(page.getByTestId("game-canvas")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("repo root index boots as a direct file launcher", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(pathToFileURL("index.html").toString());

  await expect(page.getByTestId("boot-card")).toContainText(
    "Vesper Key scene online"
  );
  await expect(page.getByTestId("game-canvas")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
