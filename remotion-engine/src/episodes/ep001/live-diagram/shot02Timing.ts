export const SHOT02_FPS = 30;
export const SHOT02_DURATION_SECONDS = 74;
export const SHOT02_DURATION_FRAMES = SHOT02_FPS * SHOT02_DURATION_SECONDS;

const f = (seconds: number) => Math.round(seconds * SHOT02_FPS);

export const SHOT02 = {
  handoff: {
    validateStart: f(2.3),
    validateEnd: f(6.6),
    submitStart: f(7.5),
    submitEnd: f(11.7),
    contextQuietStart: f(0.15),
    contextQuietEnd: f(8.0),
    phoneShiftStart: f(0.2),
    phoneShiftEnd: f(11.5),
    flowStart: f(13.75),
    flowEnd: f(14.7),
    hintEnd: f(2.2),
  },
  requestAssembly: {
    revealStart: f(14.35),
    revealEnd: f(15.2),
    settleStart: f(14.35),
    settleEnd: f(15.7),
    heroStart: f(15.2),
    heroEnd: f(21.9),
    defocusStart: f(70.8),
    defocusEnd: f(72.8),
  },
  payload: {
    start: f(21.85),
    revealEnd: f(22.75),
    identityStart: f(24.4),
    identityEnd: f(30.5),
    secretStart: f(29.9),
    secretEnd: f(35.5),
  },
  headers: {
    start: f(35.85),
    revealEnd: f(36.75),
    userAgentStart: f(38.4),
    userAgentEnd: f(44.5),
    acceptStart: f(43.9),
    acceptEnd: f(49.5),
  },
  context: {
    start: f(51.2),
    revealEnd: f(52.05),
    timestampStart: f(52.8),
    timestampEnd: f(57.5),
    sourceStart: f(57.1),
    sourceEnd: f(62.5),
  },
  assembly: {
    start: f(63),
    payloadFocusStart: f(63.2),
    payloadFocusEnd: f(65.8),
    headersFocusStart: f(65.8),
    headersFocusEnd: f(68.4),
    contextFocusStart: f(68.4),
    contextFocusEnd: f(70.6),
    settleStart: f(70.2),
    settleEnd: f(72.6),
    readyStart: f(72.4),
    readyEnd: f(74),
  },
  camera: {
    overviewStart: f(61.5),
    overviewEnd: f(66),
  },
} as const;
