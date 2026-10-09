import React from 'react';
import {Freeze, Html5Audio, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {PhoneFirstYoutubePreview} from './PhoneFirstYoutubePreview';
import {RequestAssemblyYoutubePreview} from './RequestAssemblyYoutubePreview';
import {SHOT01_DURATION_FRAMES, SHOT01_FPS} from './shot01Timing';
import {SHOT02_DURATION_FRAMES, SHOT02_FPS} from './shot02Timing';

export const voiceSyncedShotSchema = z.object({
  audioUrl: z.string(),
  durationInFrames: z.number().int().positive(),
  anchors: z.record(z.string(), z.number()).default({}),
});

export type VoiceSyncedShotProps = z.infer<typeof voiceSyncedShotSchema>;

type AnchorPoint = {
  actual: number;
  canonical: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const mapFrame = (frame: number, points: AnchorPoint[], canonicalEnd: number) => {
  const sorted = [...points].sort((a, b) => a.actual - b.actual);
  if (sorted.length < 2) return clamp(frame, 0, canonicalEnd - 1);

  for (let index = 0; index < sorted.length - 1; index++) {
    const left = sorted[index];
    const right = sorted[index + 1];
    if (frame <= right.actual) {
      const width = Math.max(1, right.actual - left.actual);
      const progress = clamp((frame - left.actual) / width, 0, 1);
      return Math.round(left.canonical + progress * (right.canonical - left.canonical));
    }
  }

  return canonicalEnd - 1;
};

const actualFrame = (anchors: Record<string, number>, key: string, fallbackSeconds: number, fps: number) => {
  const seconds = anchors[key];
  return Math.round((Number.isFinite(seconds) ? seconds : fallbackSeconds) * fps);
};

export const Shot01VoiceSynced: React.FC<VoiceSyncedShotProps> = ({audioUrl, durationInFrames, anchors}) => {
  const frame = useCurrentFrame();
  const points: AnchorPoint[] = [
    {actual: 0, canonical: 0},
    {actual: actualFrame(anchors, 'PRESS_LOGIN', 5.45, SHOT01_FPS), canonical: Math.round(5.45 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'LOGIN_INTENT', 7, SHOT01_FPS), canonical: Math.round(7 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'CREDENTIAL_INPUT', 17, SHOT01_FPS), canonical: Math.round(17 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'LOCAL_UI_STATE', 24, SHOT01_FPS), canonical: Math.round(24 * SHOT01_FPS)},
    {actual: Math.max(1, durationInFrames - 1), canonical: SHOT01_DURATION_FRAMES - 1},
  ];
  const canonicalFrame = mapFrame(frame, points, SHOT01_DURATION_FRAMES);

  return (
    <>
      <Freeze frame={canonicalFrame}>
        <PhoneFirstYoutubePreview showGuides={false} />
      </Freeze>
      <Html5Audio src={audioUrl} />
    </>
  );
};

export const Shot02VoiceSynced: React.FC<VoiceSyncedShotProps> = ({audioUrl, durationInFrames, anchors}) => {
  const frame = useCurrentFrame();
  const points: AnchorPoint[] = [
    {actual: 0, canonical: 0},
    {actual: actualFrame(anchors, 'PAYLOAD', 22, SHOT02_FPS), canonical: Math.round(22 * SHOT02_FPS)},
    {actual: actualFrame(anchors, 'HEADERS', 36, SHOT02_FPS), canonical: Math.round(36 * SHOT02_FPS)},
    {actual: actualFrame(anchors, 'REQUEST_CONTEXT', 50, SHOT02_FPS), canonical: Math.round(50 * SHOT02_FPS)},
    {actual: actualFrame(anchors, 'REQUEST_READY', 72.4, SHOT02_FPS), canonical: Math.round(72.4 * SHOT02_FPS)},
    {actual: Math.max(1, durationInFrames - 1), canonical: SHOT02_DURATION_FRAMES - 1},
  ];
  const canonicalFrame = mapFrame(frame, points, SHOT02_DURATION_FRAMES);

  return (
    <>
      <Freeze frame={canonicalFrame}>
        <RequestAssemblyYoutubePreview showGuides={false} />
      </Freeze>
      <Html5Audio src={audioUrl} />
    </>
  );
};
