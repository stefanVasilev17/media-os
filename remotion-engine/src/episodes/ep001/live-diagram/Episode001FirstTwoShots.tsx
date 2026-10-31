import React from 'react';
import {Series} from 'remotion';
import {z} from 'zod';
import {PhoneFirstYoutubePreview} from './PhoneFirstYoutubePreview';
import {RequestAssemblyYoutubePreview} from './RequestAssemblyYoutubePreview';
import {SHOT01_DURATION_FRAMES} from './shot01Timing';
import {SHOT02_DURATION_FRAMES} from './shot02Timing';

export const episode001FirstTwoShotsSchema = z.object({showGuides:z.boolean()});
type Props = z.infer<typeof episode001FirstTwoShotsSchema>;

export const Episode001FirstTwoShots: React.FC<Props> = ({showGuides}) => (
  <Series>
    <Series.Sequence durationInFrames={SHOT01_DURATION_FRAMES}>
      <PhoneFirstYoutubePreview showGuides={showGuides}/>
    </Series.Sequence>
    <Series.Sequence durationInFrames={SHOT02_DURATION_FRAMES}>
      <RequestAssemblyYoutubePreview showGuides={showGuides}/>
    </Series.Sequence>
  </Series>
);
