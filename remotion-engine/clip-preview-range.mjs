export const CLIP_PREVIEW_INPUT_KEY = '__mediaOsClipRange';

export function resolveClipPreviewRange(profile, inputProps, sourceDurationFrames, fps) {
  const stored = inputProps?.[CLIP_PREVIEW_INPUT_KEY];
  if (profile !== 'CLIP_PREVIEW') {
    if (stored !== undefined) throw new Error('CLIP_PREVIEW metadata is invalid for this profile.');
    return null;
  }
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    throw new Error('CLIP_PREVIEW metadata is missing.');
  }
  const {startFrame, endFrame} = stored;
  const clipFrames = endFrame - startFrame + 1;
  if (!Number.isInteger(sourceDurationFrames) || sourceDurationFrames <= 0
    || !Number.isInteger(fps) || fps <= 0
    || !Number.isInteger(startFrame) || !Number.isInteger(endFrame)
    || startFrame < 0 || endFrame < startFrame || endFrame >= sourceDurationFrames
    || clipFrames > Math.min(900, fps * 30)) {
    throw new Error('CLIP_PREVIEW metadata contains an invalid frame range.');
  }
  return [startFrame, endFrame];
}
