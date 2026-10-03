import { describe, expect, it } from "vitest";
import { createNeonHarborApp } from "./neonHarborApp";

describe("Neon Harbor scaffold", () => {
  it("mounts the Vesper Key boot UI", () => {
    const root = document.createElement("div");

    const app = createNeonHarborApp(root);

    expect(root.querySelector("[data-testid='objective']")?.textContent).toContain(
      "Scaffold Slice"
    );
    expect(root.querySelector("[data-testid='game-canvas']")).toBeInstanceOf(
      HTMLCanvasElement
    );

    app.dispose();
  });
});
