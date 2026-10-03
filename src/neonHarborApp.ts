import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import {
  createInitialState,
  activeVehicle,
  claimNearestVehicle,
  collectPackage,
  completeDeliveryRun,
  deliverPackage,
  exitVehicle,
  orbitCamera,
  populateCityLife,
  softResetMission,
  startDeliveryRun,
  updateOnFootPlayer,
  updateCityLife,
  updatePursuitClear,
  updateVehicleDriving,
  type InputState,
  type NeonHarborState
} from "./gameState";

export interface NeonHarborApp {
  dispose: () => void;
}

export function createNeonHarborApp(root: HTMLElement): NeonHarborApp {
  let state: NeonHarborState = populateCityLife(createInitialState());
  const input: InputState = {
    backward: false,
    forward: false,
    left: false,
    right: false,
    sprint: false
  };
  const shell = document.createElement("main");
  shell.className = "game-shell";
  shell.innerHTML = `
    <div class="hud" aria-label="Neon Harbor HUD">
      <div class="brand">Neon Harbor</div>
      <div class="objective" data-testid="objective">Scaffold Slice: boot Vesper Key</div>
      <div class="player-readout" data-testid="player-readout">On foot</div>
      <div class="vehicle-readout" data-testid="vehicle-readout">Sunray parked</div>
      <div class="city-readout" data-testid="city-readout">City Life loading</div>
      <div class="heat" aria-label="Heat Bar" data-testid="heat-bar">
        <span></span><span></span><span></span>
      </div>
    </div>
    <canvas class="game-canvas" data-testid="game-canvas"></canvas>
    <div class="boot-card" data-testid="boot-card">Vesper Key scene online</div>
  `;
  root.append(shell);

  const canvas = shell.querySelector<HTMLCanvasElement>(".game-canvas");
  if (!canvas) {
    throw new Error("Neon Harbor canvas failed to mount.");
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101728);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(8, 7, 10);
  camera.lookAt(0, 0, 0);

  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  } catch {
    shell.dataset.renderer = "unavailable";
  }

  const ambient = new THREE.HemisphereLight(0xf7b7ff, 0x1a2740, 1.7);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff1c2, 2);
  sun.position.set(8, 12, 6);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x23314f, roughness: 0.62 })
  );
  ground.position.y = -0.1;
  scene.add(ground);

  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 2.4, 5),
    new THREE.MeshStandardMaterial({ color: 0xff4fd8, emissive: 0x661855 })
  );
  marker.position.set(0, 1.2, 0);
  scene.add(marker);

  const player = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.7, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x43f2d3, roughness: 0.5 })
  );
  player.position.set(
    state.player.position.x,
    state.player.position.y,
    state.player.position.z
  );
  scene.add(player);

  const playerVehicleMeshes = new Map<string, THREE.Group>();
  const trafficMeshes = new Map<string, THREE.Group>();
  const pedestrianMeshes = new Map<string, THREE.Mesh>();

  const createCarMesh = (bodyColor: number, roofColor: number) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.45, 2),
      new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.42 })
    );
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.42, 0.8),
      new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.35 })
    );
    roof.position.z = -0.18;
    roof.position.y = 0.38;
    group.add(body, roof);
    return group;
  };

  const ensurePlayerVehicleMesh = (vehicleId: string) => {
    let mesh = playerVehicleMeshes.get(vehicleId);
    if (!mesh) {
      mesh = createCarMesh(vehicleId === "sunray" ? 0xffd15c : 0x72ff8a, 0x66d9ff);
      playerVehicleMeshes.set(vehicleId, mesh);
      scene.add(mesh);
    }
    return mesh;
  };

  for (const vehicle of state.vehicles.filter((candidate) => candidate.kind === "player")) {
    ensurePlayerVehicleMesh(vehicle.id);
  }

  for (const vehicle of state.vehicles.filter((candidate) => candidate.kind === "traffic")) {
    const traffic = createCarMesh(0x8ad8ff, 0xf476ff);
    trafficMeshes.set(vehicle.id, traffic);
    scene.add(traffic);
  }

  for (const pedestrian of state.pedestrians) {
    const mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.38, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0xff8f70, roughness: 0.55 })
    );
    pedestrianMeshes.set(pedestrian.id, mesh);
    scene.add(mesh);
  }

  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0x875dff,
    roughness: 0.7
  });
  const signMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4fd8,
    emissive: 0x842266,
    roughness: 0.4
  });
  for (const [x, z, h] of [
    [-7, -5, 2.5],
    [7, -4, 3.2],
    [-7, 3, 2.2],
    [7, 4, 2.8],
    [0, 7, 1.8]
  ]) {
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(2, h, 1.8),
      buildingMaterial
    );
    building.position.set(x, h / 2, z);
    scene.add(building);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.24, 0.08), signMaterial);
    sign.position.set(x, h + 0.2, z > 0 ? z - 0.95 : z + 0.95);
    scene.add(sign);
  }

  const readout = shell.querySelector<HTMLElement>("[data-testid='player-readout']");
  const vehicleReadout = shell.querySelector<HTMLElement>(
    "[data-testid='vehicle-readout']"
  );
  const cityReadout = shell.querySelector<HTMLElement>("[data-testid='city-readout']");
  const objective = shell.querySelector<HTMLElement>("[data-testid='objective']");
  let lastTime = performance.now();
  let disposed = false;

  void RAPIER.init().then(() => {
    shell.dataset.rapier = "ready";
  });

  const resize = () => {
    const width = Math.max(1, shell.clientWidth);
    const height = Math.max(1, shell.clientHeight);
    renderer?.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const syncScene = () => {
    player.position.set(
      state.player.position.x,
      state.player.position.y,
      state.player.position.z
    );
    const primaryVehicle = state.vehicles.find((candidate) => candidate.id === "sunray");
    if (!primaryVehicle) {
      throw new Error("Sunray vehicle missing from Neon Harbor state.");
    }
    for (const vehicle of state.vehicles.filter((candidate) => candidate.kind === "player")) {
      const mesh = ensurePlayerVehicleMesh(vehicle.id);
      mesh.position.set(vehicle.position.x, vehicle.position.y, vehicle.position.z);
      mesh.rotation.y = vehicle.heading;
    }
    for (const traffic of state.vehicles.filter((candidate) => candidate.kind === "traffic")) {
      const mesh = trafficMeshes.get(traffic.id);
      if (mesh) {
        mesh.position.set(traffic.position.x, traffic.position.y, traffic.position.z);
        mesh.rotation.y = traffic.heading;
      }
    }
    for (const pedestrian of state.pedestrians) {
      const mesh = pedestrianMeshes.get(pedestrian.id);
      if (mesh) {
        mesh.position.set(
          pedestrian.position.x,
          pedestrian.position.y,
          pedestrian.position.z
        );
      }
    }
    player.visible = !state.player.inVehicleId;
    const cameraDistance = 8;
    const cameraHeight = 5;
    const cameraYaw =
      state.camera.mode === "chase" ? state.camera.yaw + Math.PI : state.camera.yaw;
    camera.position.set(
      state.player.position.x + Math.sin(cameraYaw) * cameraDistance,
      state.player.position.y + cameraHeight,
      state.player.position.z + Math.cos(cameraYaw) * cameraDistance
    );
    camera.lookAt(state.player.position.x, state.player.position.y, state.player.position.z);
    shell.dataset.playerX = state.player.position.x.toFixed(2);
    shell.dataset.playerZ = state.player.position.z.toFixed(2);
    shell.dataset.cameraMode = state.camera.mode;
    shell.dataset.vehicle = state.player.inVehicleId ?? "none";
    shell.dataset.vehicleSpeed = Math.abs(primaryVehicle.speed).toFixed(2);
    shell.dataset.vehicleDamage = primaryVehicle.damage.toFixed(0);
    shell.dataset.missionStage = state.mission.stage;
    shell.dataset.heatLevel = String(state.heat.level);
    shell.dataset.pursuit = state.heat.pursuing ? "active" : "clear";
    shell.dataset.safehouseUpgrade = state.progression.safehouseUpgrade ? "true" : "false";
    const trafficCount = state.vehicles.filter(
      (candidate) => candidate.kind === "traffic"
    ).length;
    shell.dataset.trafficCount = String(trafficCount);
    shell.dataset.pedestrianCount = String(state.pedestrians.length);
    shell.dataset.playerVehicleCount = String(
      state.vehicles.filter((candidate) => candidate.kind === "player").length
    );
    if (readout) {
      readout.textContent = state.player.inVehicleId
        ? "Driving Sunray"
        : state.player.sprinting
          ? "On foot - sprinting"
          : state.player.speed > 0
            ? "On foot - moving"
            : "On foot";
    }
    if (vehicleReadout) {
      const active = activeVehicle(state);
      vehicleReadout.textContent = active
        ? `Sunray ${Math.round(Math.abs(active.speed))} mph / damage ${Math.round(active.damage)}`
        : "E enter Sunray";
    }
    if (cityReadout) {
      cityReadout.textContent = `${trafficCount} traffic / ${state.pedestrians.length} pedestrians`;
    }
    if (objective) {
      objective.textContent = state.mission.objective;
    }
    const heatSegments = shell.querySelectorAll<HTMLElement>(".heat span");
    heatSegments.forEach((segment, index) => {
      segment.dataset.active = index < state.heat.level ? "true" : "false";
    });
  };

  const setKey = (event: KeyboardEvent, pressed: boolean) => {
    if (event.code === "KeyW" || event.code === "ArrowUp") input.forward = pressed;
    if (event.code === "KeyS" || event.code === "ArrowDown") input.backward = pressed;
    if (event.code === "KeyA" || event.code === "ArrowLeft") input.left = pressed;
    if (event.code === "KeyD" || event.code === "ArrowRight") input.right = pressed;
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") input.sprint = pressed;
    if (pressed && event.code === "KeyE") state = claimNearestVehicle(state);
    if (pressed && event.code === "KeyQ") state = exitVehicle(state);
    if (pressed && event.code === "KeyM") state = startDeliveryRun(state);
    if (pressed && event.code === "KeyP") state = collectPackage(state);
    if (pressed && event.code === "KeyO") state = deliverPackage(state);
    if (pressed && event.code === "KeyH") state = updatePursuitClear(state, 8);
    if (pressed && event.code === "KeyR") state = completeDeliveryRun(state);
    if (pressed && event.code === "KeyF") state = softResetMission(state);
  };

  const keyDown = (event: KeyboardEvent) => setKey(event, true);
  const keyUp = (event: KeyboardEvent) => setKey(event, false);
  const pointerMove = (event: PointerEvent) => {
    if (event.buttons === 1) {
      state = orbitCamera(state, event.movementX);
    }
  };

  const frame = () => {
    if (disposed) {
      return;
    }
    const now = performance.now();
    const deltaSeconds = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    state = updateCityLife(state, deltaSeconds);
    state = updatePursuitClear(state, deltaSeconds);
    state = state.player.inVehicleId
      ? updateVehicleDriving(state, input, deltaSeconds)
      : updateOnFootPlayer(state, input, deltaSeconds);
    syncScene();
    marker.rotation.y += 0.01;
    renderer?.render(scene, camera);
    window.requestAnimationFrame(frame);
  };

  resize();
  syncScene();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  canvas.addEventListener("pointermove", pointerMove);
  window.requestAnimationFrame(frame);

  return {
    dispose: () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      canvas.removeEventListener("pointermove", pointerMove);
      renderer?.dispose();
      shell.remove();
    }
  };
}
