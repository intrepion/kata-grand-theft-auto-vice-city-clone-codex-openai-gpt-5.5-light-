import { describe, expect, it } from "vitest";
import {
  createInitialState,
  orbitCamera,
  updateOnFootPlayer
} from "./gameState";

describe("on-foot player control", () => {
  it("moves relative to the hybrid orbit camera yaw", () => {
    const state = createInitialState();

    const next = updateOnFootPlayer(
      state,
      { backward: false, forward: true, left: false, right: false, sprint: false },
      1
    );

    expect(next.player.position.x).toBeLessThan(-2);
    expect(next.player.position.z).toBeLessThan(-2);
    expect(next.player.speed).toBe(4);
  });

  it("sprints when movement and sprint input are both active", () => {
    const state = createInitialState();

    const next = updateOnFootPlayer(
      state,
      { backward: false, forward: true, left: false, right: false, sprint: true },
      1
    );

    expect(next.player.sprinting).toBe(true);
    expect(next.player.speed).toBe(7);
  });

  it("orbits the camera from mouse movement", () => {
    const state = createInitialState();

    const next = orbitCamera(state, 25);

    expect(next.camera.yaw).toBeLessThan(state.camera.yaw);
  });
});
