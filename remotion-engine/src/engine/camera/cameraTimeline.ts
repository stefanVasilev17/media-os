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
      position: [1.9 - 0.18 * t, -10.8, 14.2],
      target: [1.7, 0.58, 0],
      zoom: 108 + 4 * t,
    };
  }

  if (frame < ANCHORS.phoneWaitingReveal) {
    const t = lerp(
      frame,
      [ANCHORS.databaseSlow, ANCHORS.phoneWaitingReveal],
      [0, 1],
    );
    return {
      position: [1.72 - 1.18 * t, -11.0, 14.8],
      target: [1.7 - 0.92 * t, 0.58 - 0.38 * t, 0],
      zoom: 112 - 16 * t,
    };
  }

  const t = lerp(
    frame,
    [ANCHORS.phoneWaitingReveal, ANCHORS.sliceEnd],
    [0, 1],
  );
  return {
    position: [0.54 - 0.66 * t, -11.5, 15.4],
    target: [0.78 - 0.88 * t, 0.2 - 0.34 * t, 0],
    zoom: 96 - 10 * t,
  };
};
