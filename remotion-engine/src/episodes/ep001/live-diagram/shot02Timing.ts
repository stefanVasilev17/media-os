export const SHOT02_FPS = 30;
export const SHOT02_DURATION_SECONDS = 74;
export const SHOT02_DURATION_FRAMES = SHOT02_FPS * SHOT02_DURATION_SECONDS;

const f = (seconds: number) => Math.round(seconds * SHOT02_FPS);

export const SHOT02 = {
  handoff: {
    contextQuietStart: f(0.25),
    contextQuietEnd: f(2.6),
    phoneShiftStart: f(0.35),
    phoneShiftEnd: f(3.0),
    flowStart: f(1.0),
    flowEnd: f(2.2),
    hintEnd: f(1.6),
  },
  requestAssembly: {
    revealStart: f(1.25),
    revealEnd: f(2.8),
    settleStart: f(1.25),
    settleEnd: f(3.2),
    heroStart: f(3),
    heroEnd: f(22),
  },
  payload: {
    start: f(22),
    revealEnd: f(24.5),
    identityStart: f(25),
    identityEnd: f(30.5),
    secretStart: f(30.5),
    secretEnd: f(35.5),
  },
  headers: {
    start: f(36),
    revealEnd: f(38.5),
    userAgentStart: f(39),
    userAgentEnd: f(44.5),
    acceptStart: f(44.5),
    acceptEnd: f(49.5),
  },
  context: {
    start: f(50),
    revealEnd: f(52.5),
    timestampStart: f(53),
    timestampEnd: f(57.5),
    sourceStart: f(57.5),
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
