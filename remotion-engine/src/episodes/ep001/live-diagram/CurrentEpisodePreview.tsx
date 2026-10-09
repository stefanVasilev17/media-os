import React from 'react';
import {Html5Video, Sequence} from 'remotion';
import {z} from 'zod';

const segmentSchema = z.object({
  shotKey: z.string(),
  videoUrl: z.string(),
  durationInFrames: z.number().int().positive(),
});

export const currentEpisodePreviewSchema = z.object({
  durationInFrames: z.number().int().positive(),
  segments: z.array(segmentSchema),
});

type Props = z.infer<typeof currentEpisodePreviewSchema>;

export const CurrentEpisodePreview: React.FC<Props> = ({segments}) => {
  let cursor = 0;

  return (
    <>
      {segments.map((segment) => {
        const from = cursor;
        cursor += segment.durationInFrames;
        return (
          <Sequence key={segment.shotKey} from={from} durationInFrames={segment.durationInFrames}>
            <Html5Video
              src={segment.videoUrl}
              durationInFrames={segment.durationInFrames}
            />
          </Sequence>
        );
      })}
    </>
  );
};
