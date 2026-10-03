import {Easing, interpolate} from 'remotion';
import {ANCHORS} from '../../episodes/ep001/vertical-slice/timeline';

export type CameraPose = {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
};

const lerp = (frame: number, input: [number, number], output: [number, number]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

export const getVerticalSliceCameraPose = (frame: number): CameraPose => {
  if (frame < ANCHORS.databaseSlow) {
    const t = lerp(frame, [0, ANCHORS.databaseSlow], [0, 1]);
    return {
      position: [2.2 - 0.25 * t, -11.5, 15.5],
      target: [2.15, 0.75, 0],
      zoom: 88,
    };
  }

  if (frame < ANCHORS.phoneWaitingReveal) {
    const t = lerp(
      frame,
      [ANCHORS.databaseSlow, ANCHORS.phoneWaitingReveal],
      [0, 1],
    );
    return {
      position: [2.0 - 1.35 * t, -11.8, 16],
      target: [2.0 - 1.15 * t, 0.55 - 0.45 * t, 0],
      zoom: 90 - 13 * t,
    };
  }

  const t = lerp(
    frame,
    [ANCHORS.phoneWaitingReveal, ANCHORS.sliceEnd],
    [0, 1],
  );
  return {
    position: [0.65 - 0.75 * t, -12.4, 16.8],
    target: [0.85 - 1.0 * t, 0.1 - 0.45 * t, 0],
    zoom: 77 - 12 * t,
  };
};
