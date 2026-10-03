export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  position: Vec3;
  speed: number;
  sprinting: boolean;
}

export interface CameraState {
  yaw: number;
  mode: "orbit" | "chase";
}

export interface NeonHarborState {
  player: PlayerState;
  camera: CameraState;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
}

export function createInitialState(): NeonHarborState {
  return {
    player: {
      position: { x: 0, y: 0.55, z: 0 },
      speed: 0,
      sprinting: false
    },
    camera: {
      yaw: Math.PI * 0.25,
      mode: "orbit"
    }
  };
}

export function updateOnFootPlayer(
  state: NeonHarborState,
  input: InputState,
  deltaSeconds: number
): NeonHarborState {
  const next = structuredClone(state);
  const xAxis = Number(input.right) - Number(input.left);
  const zAxis = Number(input.backward) - Number(input.forward);
  const length = Math.hypot(xAxis, zAxis);
  const sprinting = input.sprint && length > 0;
  const speed = sprinting ? 7 : length > 0 ? 4 : 0;

  if (length > 0) {
    const normalizedX = xAxis / length;
    const normalizedZ = zAxis / length;
    const sin = Math.sin(next.camera.yaw);
    const cos = Math.cos(next.camera.yaw);
    const worldX = normalizedX * cos + normalizedZ * sin;
    const worldZ = normalizedZ * cos - normalizedX * sin;

    next.player.position.x += worldX * speed * deltaSeconds;
    next.player.position.z += worldZ * speed * deltaSeconds;
  }

  next.player.sprinting = sprinting;
  next.player.speed = speed;

  return next;
}

export function orbitCamera(
  state: NeonHarborState,
  movementX: number
): NeonHarborState {
  const next = structuredClone(state);
  next.camera.yaw -= movementX * 0.004;
  return next;
}
