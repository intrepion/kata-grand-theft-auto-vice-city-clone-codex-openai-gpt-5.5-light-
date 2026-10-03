import { describe, expect, it } from "vitest";
import {
  activeVehicle,
  claimNearestVehicle,
  collectPackage,
  completeDeliveryRun,
  createInitialState,
  deliverPackage,
  exitVehicle,
  orbitCamera,
  populateCityLife,
  softResetMission,
  startDeliveryRun,
  updateCityLife,
  updateOnFootPlayer,
  updatePursuitClear,
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

describe("Delivery Run mission and Heat", () => {
  it("completes the Delivery Run and unlocks the safehouse reward", () => {
    let state = startDeliveryRun(createInitialState());
    state = claimNearestVehicle(state);
    state = collectPackage(state);
    state = deliverPackage(state);
    state = updatePursuitClear(state, 8);
    state = completeDeliveryRun(state);

    expect(state.mission.stage).toBe("complete");
    expect(state.heat.level).toBe(0);
    expect(state.progression.safehouseUpgrade).toBe(true);
    expect(state.vehicles.some((vehicle) => vehicle.id === "bayside")).toBe(true);
  });

  it("keeps pursuit active until line of sight, distance, and timer are satisfied", () => {
    let state = startDeliveryRun(createInitialState());
    state = claimNearestVehicle(state);
    state = collectPackage(state);
    state = updatePursuitClear(state, 8);

    expect(state.heat.pursuing).toBe(true);

    state = deliverPackage(state);
    state = updatePursuitClear(state, 7.5);
    expect(state.heat.pursuing).toBe(true);

    state = updatePursuitClear(state, 0.5);
    expect(state.heat.pursuing).toBe(false);
  });

  it("soft resets mission progress without ending the sandbox", () => {
    let state = startDeliveryRun(createInitialState());
    state = claimNearestVehicle(state);
    state = collectPackage(state);

    state = softResetMission(state);

    expect(state.mission.stage).toBe("failed");
    expect(state.player.inVehicleId).toBeNull();
    expect(state.heat.level).toBe(0);
  });
});

describe("Vesper Key city life", () => {
  it("populates the MVP traffic and pedestrian density targets", () => {
    const state = populateCityLife(createInitialState());

    expect(state.vehicles.filter((vehicle) => vehicle.kind === "traffic")).toHaveLength(
      12
    );
    expect(state.pedestrians).toHaveLength(20);
  });

  it("moves traffic and pedestrian loops", () => {
    const state = populateCityLife(createInitialState());
    const firstCarZ = state.vehicles.find((vehicle) => vehicle.kind === "traffic")
      ?.position.z;
    const firstPedZ = state.pedestrians[0]?.position.z;

    const next = updateCityLife(state, 1);

    expect(
      next.vehicles.find((vehicle) => vehicle.kind === "traffic")?.position.z
    ).not.toBe(firstCarZ);
    expect(next.pedestrians[0]?.position.z).not.toBe(firstPedZ);
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
