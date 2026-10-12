export const SHOT02_FPS = 30;
export const SHOT02_DURATION_SECONDS = 74;
export const SHOT02_DURATION_FRAMES = SHOT02_FPS * SHOT02_DURATION_SECONDS;

const f = (seconds: number) => Math.round(seconds * SHOT02_FPS);

export const SHOT02 = {
  origin: {
    validateStart: f(0.6),
    validateEnd: f(5.2),
    submitStart: f(5.0),
    submitEnd: f(11.8),
    shiftStart: f(5.8),
    shiftEnd: f(16.0),
  },
  assembly: {
    revealStart: f(11.2),
    revealEnd: f(15.8),
  },
  payload: {
    revealStart: f(21.0),
    revealEnd: f(23.0),
    activeStart: f(22.0),
    activeEnd: f(35.8),
  },
  headers: {
    revealStart: f(35.0),
    revealEnd: f(37.2),
    activeStart: f(36.0),
    activeEnd: f(49.8),
  },
  context: {
    revealStart: f(49.0),
    revealEnd: f(51.3),
    activeStart: f(50.0),
    activeEnd: f(63.0),
  },
  packet: {
    networkHintStart: f(59.5),
    networkHintEnd: f(63.5),
    formStart: f(63.0),
    formEnd: f(68.0),
    panelCollapseStart: f(64.0),
    panelCollapseEnd: f(68.7),
    travelStart: f(68.0),
    travelEnd: f(73.0),
  },
} as const;
