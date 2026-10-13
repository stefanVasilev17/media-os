import React from 'react';
import {Html5Audio, Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {PhoneFirstYoutubePreview} from './PhoneFirstYoutubePreview';
import {RequestAssemblyYoutubePreview} from './RequestAssemblyYoutubePreview';
import {ReadyNotSentYoutubePreview} from './ReadyNotSentYoutubePreview';
import {SHOT01_DURATION_FRAMES, SHOT01_FPS} from './shot01Timing';
import {SHOT02, SHOT02_DURATION_FRAMES, SHOT02_FPS} from './shot02Timing';

const voiceClipSchema = z.object({
  src: z.string(),
  fromFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
  trimBeforeFrames: z.number().int().nonnegative().default(0),
});

const comprehensionHoldSchema = z.object({
  fromFrame: z.number().int().nonnegative(),
  toFrame: z.number().int().nonnegative(),
  canonicalFrame: z.number().int().nonnegative(),
});

export const voiceSyncedShotSchema = z.object({
  audioUrl: z.string().default(''),
  audioClips: z.array(voiceClipSchema).default([]),
  durationInFrames: z.number().int().positive(),
  anchors: z.record(z.string(), z.number()).default({}),
  comprehensionHolds: z.array(comprehensionHoldSchema).default([]),
});

export type VoiceSyncedShotProps = z.infer<typeof voiceSyncedShotSchema>;

const VoiceAudio: React.FC<Pick<VoiceSyncedShotProps, 'audioUrl' | 'audioClips'>> = ({audioUrl, audioClips}) => {
  if (audioClips.length > 0) {
    return (
      <>
        {audioClips.map((clip, index) => (
          <Sequence
            key={clip.src + '-' + index}
            from={clip.fromFrame}
            durationInFrames={clip.durationInFrames}
            name={'Voice clip ' + (index + 1)}
          >
            <Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames} />
          </Sequence>
        ))}
      </>
    );
  }
  return audioUrl ? <Html5Audio src={audioUrl} /> : null;
};

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
      return left.canonical + progress * (right.canonical - left.canonical);
    }
  }

  return canonicalEnd - 1;
};

const actualFrame = (anchors: Record<string, number>, key: string, fallbackSeconds: number, fps: number) => {
  const seconds = anchors[key];
  return Math.round((Number.isFinite(seconds) ? seconds : fallbackSeconds) * fps);
};

export const Shot01VoiceSynced: React.FC<VoiceSyncedShotProps> = ({
  audioUrl,
  audioClips,
  durationInFrames,
  anchors,
}) => {
  const frame = useCurrentFrame();
  const points: AnchorPoint[] = [
    {actual: 0, canonical: 0},
    {actual: actualFrame(anchors, 'PRESS_LOGIN', 5.45, SHOT01_FPS), canonical: Math.round(5.45 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'LOGIN_INTENT', 7, SHOT01_FPS), canonical: Math.round(7 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'VALIDATE', 10.3, SHOT01_FPS), canonical: Math.round(10.3 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'SUBMIT', 13.3, SHOT01_FPS), canonical: Math.round(13.3 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'CREDENTIAL_INPUT', 17, SHOT01_FPS), canonical: Math.round(17 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'IDENTIFIER', 19.1, SHOT01_FPS), canonical: Math.round(19.1 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'SECRET', 21.6, SHOT01_FPS), canonical: Math.round(21.6 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'LOCAL_UI_STATE', 24, SHOT01_FPS), canonical: Math.round(24 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'SUBMITTING', 26.1, SHOT01_FPS), canonical: Math.round(26.1 * SHOT01_FPS)},
    {actual: actualFrame(anchors, 'WAITING', 28.7, SHOT01_FPS), canonical: Math.round(28.7 * SHOT01_FPS)},
    {actual: Math.max(1, durationInFrames - 1), canonical: SHOT01_DURATION_FRAMES - 1},
  ];
  const canonicalFrame = mapFrame(frame, points, SHOT01_DURATION_FRAMES);

  return (
    <>
      <PhoneFirstYoutubePreview showGuides={false} frameOverride={canonicalFrame} />
      <VoiceAudio audioUrl={audioUrl} audioClips={audioClips} />
    </>
  );
};

export const Shot02VoiceSynced: React.FC<VoiceSyncedShotProps> = ({audioUrl, audioClips, durationInFrames, anchors}) => {
  const frame = useCurrentFrame();
  const frameFor = (key: string, canonical: number) => ({
    actual: actualFrame(anchors, key, canonical / SHOT02_FPS, SHOT02_FPS),
    canonical,
  });
  const recapKeys = ['WHAT_SENDING', 'HOW_READ', 'SYSTEM_KNOW'];
  const recapHighlights = recapKeys.every(key => Number.isFinite(anchors[key])) &&
    recapKeys.every((key, index) => index === 0 || anchors[key] > anchors[recapKeys[index - 1]]);
  const points: AnchorPoint[] = [
    {actual: 0, canonical: 0},
    frameFor('VALIDATE', SHOT02.handoff.validateStart),
    frameFor('SUBMIT', SHOT02.handoff.submitStart),
    frameFor('REQUEST_ASSEMBLY', SHOT02.requestAssembly.revealStart),
    frameFor('PAYLOAD', SHOT02.payload.start),
    frameFor('IDENTITY', SHOT02.payload.identityStart),
    frameFor('SECRET', SHOT02.payload.secretStart),
    frameFor('HEADERS', SHOT02.headers.start),
    frameFor('USER_AGENT', SHOT02.headers.userAgentStart),
    frameFor('ACCEPT', SHOT02.headers.acceptStart),
    frameFor('REQUEST_CONTEXT', SHOT02.context.start),
    frameFor('TIMESTAMP', SHOT02.context.timestampStart),
    frameFor('SOURCE', SHOT02.context.sourceStart),
    ...(recapHighlights ? [
      frameFor('WHAT_SENDING', SHOT02.assembly.payloadFocusStart),
      frameFor('HOW_READ', SHOT02.assembly.headersFocusStart),
      frameFor('SYSTEM_KNOW', SHOT02.assembly.contextFocusStart),
    ] : []),
    frameFor('REQUEST_READY', SHOT02.assembly.readyStart),
    {actual: Math.max(1, durationInFrames - 1), canonical: SHOT02_DURATION_FRAMES - 1},
  ];
  const canonicalFrame = mapFrame(frame, points, SHOT02_DURATION_FRAMES);

  return (
    <>
      <RequestAssemblyYoutubePreview showGuides={false} recapHighlights={recapHighlights} frameOverride={canonicalFrame} />
      <VoiceAudio audioUrl={audioUrl} audioClips={audioClips} />
    </>
  );
};

export const Shot03VoiceSynced:React.FC<VoiceSyncedShotProps> = ({audioUrl,audioClips,anchors}) => (
  <>
    <ReadyNotSentYoutubePreview showGuides={false} anchors={anchors}/>
    <VoiceAudio audioUrl={audioUrl} audioClips={audioClips}/>
  </>
);
