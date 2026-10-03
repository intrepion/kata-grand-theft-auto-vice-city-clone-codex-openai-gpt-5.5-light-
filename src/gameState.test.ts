import { describe, expect, it } from "vitest";
import {
  activeVehicle,
  claimNearestVehicle,
  createInitialState,
  exitVehicle,
  orbitCamera,
  updateOnFootPlayer,
  updateVehicleDriving
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

describe("vehicle claim and driving", () => {
  it("claims a nearby parked vehicle and switches to chase camera", () => {
    const state = createInitialState();
    state.player.position = { x: -1.1, y: 0.55, z: -1.1 };

    const next = claimNearestVehicle(state);

    expect(next.player.inVehicleId).toBe("sunray");
    expect(next.camera.mode).toBe("chase");
    expect(activeVehicle(next)?.occupied).toBe(true);
  });

  it("drives the active vehicle and keeps player position attached", () => {
    const state = claimNearestVehicle(createInitialState(), 10);

    const next = updateVehicleDriving(
      state,
      { backward: false, forward: true, left: false, right: false, sprint: false },
      1
    );

    const vehicle = activeVehicle(next);
    expect(vehicle?.speed).toBeGreaterThan(0);
    expect(next.player.position.z).toBe(vehicle?.position.z);
  });

  it("exits beside the vehicle and returns to orbit camera", () => {
    const state = claimNearestVehicle(createInitialState(), 10);

    const next = exitVehicle(state);

    expect(next.player.inVehicleId).toBeNull();
    expect(next.camera.mode).toBe("orbit");
    expect(next.vehicles.find((vehicle) => vehicle.id === "sunray")?.occupied).toBe(
      false
    );
  });
});
