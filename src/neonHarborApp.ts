import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export interface NeonHarborApp {
  dispose: () => void;
}

export function createNeonHarborApp(root: HTMLElement): NeonHarborApp {
  const shell = document.createElement("main");
  shell.className = "game-shell";
  shell.innerHTML = `
    <div class="hud" aria-label="Neon Harbor HUD">
      <div class="brand">Neon Harbor</div>
      <div class="objective" data-testid="objective">Scaffold Slice: boot Vesper Key</div>
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

  const frame = () => {
    if (disposed) {
      return;
    }
    marker.rotation.y += 0.01;
    renderer?.render(scene, camera);
    window.requestAnimationFrame(frame);
  };

  resize();
  window.addEventListener("resize", resize);
  window.requestAnimationFrame(frame);

  return {
    dispose: () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      renderer?.dispose();
      shell.remove();
    }
  };
}
