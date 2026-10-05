export const SHOT02_FPS = 30;
export const SHOT02_DURATION_SECONDS = 74;
export const SHOT02_DURATION_FRAMES = SHOT02_FPS * SHOT02_DURATION_SECONDS;

const f = (seconds: number) => Math.round(seconds * SHOT02_FPS);

export const SHOT02 = {
  validateSubmit: {
    start: f(0),
    validateActiveStart: f(0.8),
    validateActiveEnd: f(5.0),
    submitActiveStart: f(5.2),
    submitActiveEnd: f(11.2),
    handoffStart: f(9.5),
    handoffEnd: f(12),
  },
  requestAssembly: {
    revealStart: f(10.5),
    revealEnd: f(14.5),
    heroStart: f(12),
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
    convergeStart: f(70.2),
    convergeEnd: f(72.6),
    packetReadyStart: f(72.4),
    packetReadyEnd: f(74),
  },
  camera: {
    legacyShiftStart: f(8.8),
    legacyShiftEnd: f(15),
    requestFocusStart: f(12),
    requestFocusEnd: f(18),
    overviewStart: f(61.5),
    overviewEnd: f(66),
  },
} as const;
