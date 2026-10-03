export const FPS = 30;
export const VERTICAL_SLICE_SECONDS = 64;
export const VERTICAL_SLICE_FRAMES = FPS * VERTICAL_SLICE_SECONDS;

export const seconds = (value: number) => Math.round(value * FPS);

// Provisional narrative anchors for 09:09–10:13.
// These are intentionally isolated here so ElevenLabs Forced Alignment can replace
// the timings later without changing scene/component logic.
export const ANCHORS = {
  databaseAnswerForms: seconds(0),
  databaseAnswerArrives: seconds(11),
  authHealthyReset: seconds(11),
  lookupBegins: seconds(16),
  lookupArrives: seconds(25),
  databaseSlow: seconds(25),
  authHealthyWhileWaiting: seconds(39),
  phoneWaitingReveal: seconds(51),
  sliceEnd: seconds(64),
} as const;
