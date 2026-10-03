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

test("walks and sprints through the on-foot control path", async ({ page }) => {
  await page.goto("/");
  const shell = page.locator(".game-shell");

  const initialZ = Number(await shell.getAttribute("data-player-z"));
  await page.keyboard.down("w");
  await page.waitForTimeout(250);
  await page.keyboard.up("w");

  const walkedZ = Number(await shell.getAttribute("data-player-z"));
  await expect(page.getByTestId("player-readout")).toContainText("On foot");
  expect(walkedZ).toBeLessThan(initialZ);

  await page.keyboard.down("Shift");
  await page.keyboard.down("w");
  await page.waitForTimeout(120);
  await expect(page.getByTestId("player-readout")).toContainText("sprinting");
  await page.keyboard.up("w");
  await page.keyboard.up("Shift");
});

test("claims, drives, and exits the Sunray vehicle", async ({ page }) => {
  await page.goto("/");
  const shell = page.locator(".game-shell");

  await page.keyboard.press("e");
  await expect(shell).toHaveAttribute("data-camera-mode", "chase");
  await expect(page.getByTestId("player-readout")).toContainText("Driving Sunray");

  await page.keyboard.down("w");
  await page.waitForTimeout(300);
  await page.keyboard.up("w");
  const speed = Number(await shell.getAttribute("data-vehicle-speed"));
  expect(speed).toBeGreaterThan(0);

  await page.keyboard.press("q");
  await expect(shell).toHaveAttribute("data-camera-mode", "orbit");
  await expect(page.getByTestId("player-readout")).toContainText("On foot");
});

test("renders Vesper Key city life density targets", async ({ page }) => {
  await page.goto("/");
  const shell = page.locator(".game-shell");

  await expect(shell).toHaveAttribute("data-traffic-count", "12");
  await expect(shell).toHaveAttribute("data-pedestrian-count", "20");
  await expect(page.getByTestId("city-readout")).toContainText(
    "12 traffic / 20 pedestrians"
  );
});

test("completes the Delivery Run with Heat pursuit and safehouse reward", async ({
  page
}) => {
  await page.goto("/");
  const shell = page.locator(".game-shell");

  await page.keyboard.press("m");
  await expect(shell).toHaveAttribute("data-mission-stage", "started");

  await page.keyboard.press("e");
  await page.keyboard.press("p");
  await expect(shell).toHaveAttribute("data-mission-stage", "package-collected");
  await expect(shell).toHaveAttribute("data-heat-level", "2");
  await expect(shell).toHaveAttribute("data-pursuit", "active");

  await page.keyboard.press("o");
  await expect(shell).toHaveAttribute("data-mission-stage", "delivered");
  await page.keyboard.press("h");
  await expect(shell).toHaveAttribute("data-pursuit", "clear");

  await page.keyboard.press("r");
  await expect(shell).toHaveAttribute("data-mission-stage", "complete");
  await expect(shell).toHaveAttribute("data-safehouse-upgrade", "true");
  await expect(shell).toHaveAttribute("data-player-vehicle-count", "2");
  await expect(page.getByTestId("objective")).toContainText("Delivery Run complete");
});

test("soft resets a failed Delivery Run to the safehouse", async ({ page }) => {
  await page.goto("/");
  const shell = page.locator(".game-shell");

  await page.keyboard.press("m");
  await page.keyboard.press("e");
  await page.keyboard.press("p");
  await page.keyboard.press("f");

  await expect(shell).toHaveAttribute("data-mission-stage", "failed");
  await expect(shell).toHaveAttribute("data-vehicle", "none");
  await expect(shell).toHaveAttribute("data-heat-level", "0");
});
