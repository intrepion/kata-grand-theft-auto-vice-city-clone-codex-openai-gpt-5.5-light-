export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  position: Vec3;
  speed: number;
  sprinting: boolean;
  inVehicleId: string | null;
}

export interface VehicleState {
  id: string;
  position: Vec3;
  heading: number;
  speed: number;
  damage: number;
  occupied: boolean;
  kind: "player" | "traffic" | "police";
}

export interface PedestrianState {
  id: string;
  position: Vec3;
  routePhase: number;
  panicked: boolean;
}

export interface CameraState {
  yaw: number;
  mode: "orbit" | "chase";
}

export interface NeonHarborState {
  player: PlayerState;
  camera: CameraState;
  vehicles: VehicleState[];
  pedestrians: PedestrianState[];
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
      inVehicleId: null,
      speed: 0,
      sprinting: false
    },
    camera: {
      yaw: Math.PI * 0.25,
      mode: "orbit"
    },
    vehicles: [
      {
        id: "sunray",
        position: { x: -1.2, y: 0.35, z: -1.2 },
        heading: Math.PI * 0.2,
        speed: 0,
        damage: 0,
        occupied: false,
        kind: "player"
      }
    ],
    pedestrians: createPedestrians()
  };
}

export function populateCityLife(state: NeonHarborState): NeonHarborState {
  const next = structuredClone(state);
  if (next.vehicles.some((vehicle) => vehicle.kind === "traffic")) {
    return next;
  }
  for (let index = 0; index < 12; index += 1) {
    next.vehicles.push({
      id: `traffic-${index + 1}`,
      position: {
        x: index % 2 === 0 ? -5.4 : 5.4,
        y: 0.35,
        z: -6 + index
      },
      heading: index % 2 === 0 ? 0 : Math.PI,
      speed: 2.2 + (index % 3) * 0.35,
      damage: 0,
      occupied: false,
      kind: "traffic"
    });
  }
  return next;
}

export function updateCityLife(
  state: NeonHarborState,
  deltaSeconds: number
): NeonHarborState {
  const next = populateCityLife(state);
  for (const vehicle of next.vehicles) {
    if (vehicle.kind !== "traffic") {
      continue;
    }
    vehicle.position.z += Math.cos(vehicle.heading) * vehicle.speed * deltaSeconds;
    if (vehicle.position.z > 7) vehicle.position.z = -7;
    if (vehicle.position.z < -7) vehicle.position.z = 7;
  }
  for (const pedestrian of next.pedestrians) {
    pedestrian.routePhase = (pedestrian.routePhase + deltaSeconds * 0.18) % 1;
    const block = Number(pedestrian.id.split("-")[1]) - 1;
    const side = block % 2 === 0 ? -1 : 1;
    pedestrian.position.x = side * (2.8 + (block % 5) * 0.42);
    pedestrian.position.z = -6 + pedestrian.routePhase * 12;
  }
  return next;
}

export function updateOnFootPlayer(
  state: NeonHarborState,
  input: InputState,
  deltaSeconds: number
): NeonHarborState {
  const next = structuredClone(state);
  if (next.player.inVehicleId) {
    return next;
  }
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

export function claimNearestVehicle(
  state: NeonHarborState,
  claimRange = 3
): NeonHarborState {
  const next = structuredClone(state);
  if (next.player.inVehicleId) {
    return next;
  }
  const nearest = next.vehicles
    .filter((vehicle) => !vehicle.occupied)
    .map((vehicle) => ({
      vehicle,
      distance: distance2d(next.player.position, vehicle.position)
    }))
    .filter(({ distance }) => distance <= claimRange)
    .sort((a, b) => a.distance - b.distance)[0]?.vehicle;

  if (!nearest) {
    return next;
  }

  nearest.occupied = true;
  next.player.inVehicleId = nearest.id;
  next.player.position = { ...nearest.position, y: 0.55 };
  next.player.speed = 0;
  next.player.sprinting = false;
  next.camera.mode = "chase";
  next.camera.yaw = nearest.heading;

  return next;
}

export function exitVehicle(state: NeonHarborState): NeonHarborState {
  const next = structuredClone(state);
  const vehicle = activeVehicle(next);
  if (!vehicle) {
    return next;
  }

  vehicle.occupied = false;
  vehicle.speed = 0;
  next.player.inVehicleId = null;
  next.player.position = {
    x: vehicle.position.x + Math.cos(vehicle.heading + Math.PI / 2) * 1.4,
    y: 0.55,
    z: vehicle.position.z + Math.sin(vehicle.heading + Math.PI / 2) * 1.4
  };
  next.player.speed = 0;
  next.camera.mode = "orbit";
  next.camera.yaw = vehicle.heading + Math.PI * 0.25;

  return next;
}

export function updateVehicleDriving(
  state: NeonHarborState,
  input: InputState,
  deltaSeconds: number
): NeonHarborState {
  const next = structuredClone(state);
  const vehicle = activeVehicle(next);
  if (!vehicle) {
    return next;
  }

  const acceleration = Number(input.forward) - Number(input.backward);
  const steering = Number(input.left) - Number(input.right);
  const maxSpeed = Math.max(6, 13 - vehicle.damage * 0.08);
  vehicle.speed = clamp(vehicle.speed + acceleration * 12 * deltaSeconds, -5, maxSpeed);
  vehicle.speed *= Math.pow(0.88, deltaSeconds * 10);
  vehicle.heading += steering * deltaSeconds * (0.8 + Math.abs(vehicle.speed) * 0.08);
  vehicle.position.x += Math.sin(vehicle.heading) * vehicle.speed * deltaSeconds;
  vehicle.position.z += Math.cos(vehicle.heading) * vehicle.speed * deltaSeconds;

  const roadLimit = 7.5;
  if (Math.abs(vehicle.position.x) > roadLimit || Math.abs(vehicle.position.z) > roadLimit) {
    vehicle.position.x = clamp(vehicle.position.x, -roadLimit, roadLimit);
    vehicle.position.z = clamp(vehicle.position.z, -roadLimit, roadLimit);
    vehicle.damage = clamp(vehicle.damage + Math.abs(vehicle.speed) * 0.6, 0, 100);
    vehicle.speed *= -0.25;
  }

  next.player.position = { ...vehicle.position, y: 0.55 };
  next.player.speed = Math.abs(vehicle.speed);
  next.camera.mode = "chase";
  next.camera.yaw = vehicle.heading;

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

export function activeVehicle(state: NeonHarborState): VehicleState | undefined {
  return state.vehicles.find((vehicle) => vehicle.id === state.player.inVehicleId);
}

function createPedestrians(): PedestrianState[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `pedestrian-${index + 1}`,
    position: {
      x: index % 2 === 0 ? -3.2 : 3.2,
      y: 0.55,
      z: -6 + (index % 10) * 1.2
    },
    routePhase: (index % 10) / 10,
    panicked: false
  }));
}

function distance2d(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
