# Use Lightweight Entity Registry and Plain Systems

Gameplay state will live in a lightweight entity registry with plain TypeScript systems rather than being buried inside Three.js objects or modeled with a heavyweight ECS framework. This keeps mission logic and tests able to inspect state while avoiding architecture ceremony before the game's needs are proven.
