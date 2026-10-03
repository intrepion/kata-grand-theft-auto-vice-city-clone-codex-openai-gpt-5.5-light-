import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import {
  createInitialState,
  orbitCamera,
  updateOnFootPlayer,
  type InputState,
  type NeonHarborState
} from "./gameState";

export interface NeonHarborApp {
  dispose: () => void;
}

export function createNeonHarborApp(root: HTMLElement): NeonHarborApp {
  let state: NeonHarborState = createInitialState();
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
      <div class="heat" aria-label="Heat Bar">
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

  const readout = shell.querySelector<HTMLElement>("[data-testid='player-readout']");
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
    const cameraDistance = 8;
    const cameraHeight = 5;
    camera.position.set(
      state.player.position.x + Math.sin(state.camera.yaw) * cameraDistance,
      state.player.position.y + cameraHeight,
      state.player.position.z + Math.cos(state.camera.yaw) * cameraDistance
    );
    camera.lookAt(player.position);
    shell.dataset.playerX = state.player.position.x.toFixed(2);
    shell.dataset.playerZ = state.player.position.z.toFixed(2);
    shell.dataset.cameraMode = state.camera.mode;
    if (readout) {
      readout.textContent = state.player.sprinting
        ? "On foot - sprinting"
        : state.player.speed > 0
          ? "On foot - moving"
          : "On foot";
    }
    if (objective) {
      objective.textContent = "Walking Slice: reach the hotel marker";
    }
  };

  const setKey = (event: KeyboardEvent, pressed: boolean) => {
    if (event.code === "KeyW" || event.code === "ArrowUp") input.forward = pressed;
    if (event.code === "KeyS" || event.code === "ArrowDown") input.backward = pressed;
    if (event.code === "KeyA" || event.code === "ArrowLeft") input.left = pressed;
    if (event.code === "KeyD" || event.code === "ArrowRight") input.right = pressed;
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") input.sprint = pressed;
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
    state = updateOnFootPlayer(state, input, deltaSeconds);
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
