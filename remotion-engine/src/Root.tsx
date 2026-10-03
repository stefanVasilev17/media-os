import React from 'react';
import {Composition} from 'remotion';
import {VerticalSlice, verticalSliceSchema} from './episodes/ep001/vertical-slice/VerticalSlice';
import {FPS, VERTICAL_SLICE_FRAMES} from './episodes/ep001/vertical-slice/timeline';

export const Root: React.FC = () => {
  return (
    <Composition
      id="EP001-VerticalSlice"
      component={VerticalSlice}
      durationInFrames={VERTICAL_SLICE_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
      schema={verticalSliceSchema}
      defaultProps={{
        showDebugLabels: true,
      }}
    />
  );
};
