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
    validateGlowStart: f(10.1),
    validateGlowEnd: f(11.9),
    submitGlowStart: f(12.45),
    submitGlowEnd: f(14.8),
  },
  credentialInput: {
    start: f(17),
    revealEnd: f(18.3),
    focusEnd: f(24),
    identifierGlowStart: f(18.65),
    identifierGlowEnd: f(20.65),
    secretGlowStart: f(21.05),
    secretGlowEnd: f(23.25),
  },
  localUiState: {
    start: f(24),
    revealEnd: f(25.2),
    submittingStart: f(25.0),
    submittingEnd: f(28.15),
    waitingStart: f(28.15),
    waitingFull: f(29.05),
    spinnerStart: f(25.4),
  },
  requestAssemblyHint: {
    start: f(29.4),
    end: f(31),
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
