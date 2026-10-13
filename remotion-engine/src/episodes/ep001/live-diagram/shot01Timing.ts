export const SHOT01_FPS = 30;
export const SHOT01_DURATION_SECONDS = 31;
export const SHOT01_DURATION_FRAMES = SHOT01_FPS * SHOT01_DURATION_SECONDS;

const f = (seconds: number) => Math.round(seconds * SHOT01_FPS);

export const SHOT01 = {
  phone: {
    emailVisible: f(0.6),
    passwordStart: f(2.1),
    passwordReady: f(4.8),
    pressStart: f(5.45),
    pressEnd: f(6.35),
  },
  loginIntent: {
    start: f(7),
    panelRevealEnd: f(8.35),
    focusEnd: f(17),
    validateGlowStart: f(9.7),
    validateGlowEnd: f(12.4),
    submitGlowStart: f(12.7),
    submitGlowEnd: f(16.5),
  },
  credentialInput: {
    start: f(17),
    revealEnd: f(18.3),
    focusEnd: f(24),
    identifierGlowStart: f(18.45),
    identifierGlowEnd: f(21.15),
    secretGlowStart: f(21.25),
    secretGlowEnd: f(23.9),
  },
  localUiState: {
    start: f(24),
    revealEnd: f(25.2),
    submittingStart: f(24.8),
    submittingEnd: f(28.9),
    waitingStart: f(28.55),
    waitingFull: f(29.35),
    spinnerStart: f(5.55),
  },
  requestAssemblyHint: {
    start: f(29.4),
    end: f(31),
  },
  controlledRealism: {
    bridgeStart: f(5.85),
    bridgeEnd: f(8.4),
    bridgePulseStart: f(5.5),
    bridgePulseEnd: f(8.9),
    fadeStart: f(6.8),
    fadeMid: f(17),
    fadeEnd: f(24),
    minimum: .28,
    bridgeTop: 225,
    bridgeBottom: 770,
  },
  camera: {
    phoneCloseHoldEnd: f(6.8),
    worldRevealStart: f(7),
    worldRevealEnd: f(9.6),
    credentialMoveStart: f(17),
    credentialMoveEnd: f(18.6),
    localUiMoveStart: f(24),
    localUiMoveEnd: f(25.5),
  },
} as const;
