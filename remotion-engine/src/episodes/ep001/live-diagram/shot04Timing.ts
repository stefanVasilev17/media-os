export const SHOT04_FPS=30;
export const SHOT04_DURATION_SECONDS=67;
export const SHOT04_DURATION_FRAMES=SHOT04_FPS*SHOT04_DURATION_SECONDS;
const f=(seconds:number)=>Math.round(seconds*SHOT04_FPS);
export const SHOT04={
  release:f(1),
  destinationQuestion:f(9.5),
  dns:f(12),
  resolve:f(20),
  cache:f(26.5),
  network:f(38),
  latency:f(42),
  rtt:f(50),
  jitter:f(54),
  destinationKnown:f(62),
  journeyHealth:f(64),
} as const;
