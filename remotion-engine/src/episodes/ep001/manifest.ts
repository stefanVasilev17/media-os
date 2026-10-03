import {verticalSliceShotSpec} from './vertical-slice/shotSpec';
import {FPS, VERTICAL_SLICE_FRAMES} from './vertical-slice/timeline';

export const ep001Manifest = {
  episodeId: 'EP001',
  title: 'What Really Happens When You Click Login?',
  productionEngine: 'AT_VISUAL_ENGINE_v0.1',
  fps: FPS,
  compositions: {
    verticalSlice: {
      id: 'EP001-VerticalSlice',
      durationInFrames: VERTICAL_SLICE_FRAMES,
      width: 1920,
      height: 1080,
      shotSpec: verticalSliceShotSpec,
    },
  },
} as const;
