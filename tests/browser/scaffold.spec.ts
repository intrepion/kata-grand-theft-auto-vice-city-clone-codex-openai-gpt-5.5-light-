import { expect, test } from "@playwright/test";

test("boots a visible clean Neon Harbor scene", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");

  await expect(page.getByTestId("boot-card")).toContainText(
    "Vesper Key scene online"
  );
  await expect(page.getByTestId("game-canvas")).toBeVisible();
  await expect(page.locator(".game-shell")).toHaveAttribute("data-rapier", "ready");
  expect(consoleErrors).toEqual([]);
});
