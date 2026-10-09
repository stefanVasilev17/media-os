import React from 'react';
import {Composition, getInputProps} from 'remotion';
import {LoginIntentLiveScene, loginIntentLiveSceneSchema} from './episodes/ep001/live-diagram/LoginIntentLiveScene';
import {PhoneFirstPreview, phoneFirstPreviewSchema} from './episodes/ep001/live-diagram/PhoneFirstPreview';
import {PhoneFirstYoutubePreview, phoneFirstYoutubePreviewSchema} from './episodes/ep001/live-diagram/PhoneFirstYoutubePreview';
import {RequestAssemblyYoutubePreview, requestAssemblyYoutubePreviewSchema} from './episodes/ep001/live-diagram/RequestAssemblyYoutubePreview';
import {Shot01VoiceSynced, Shot02VoiceSynced, voiceSyncedShotSchema} from './episodes/ep001/live-diagram/VoiceSyncedShot';
import {CurrentEpisodePreview, currentEpisodePreviewSchema} from './episodes/ep001/live-diagram/CurrentEpisodePreview';
import {SHOT01_DURATION_FRAMES, SHOT01_FPS} from './episodes/ep001/live-diagram/shot01Timing';
import {SHOT02_DURATION_FRAMES, SHOT02_FPS} from './episodes/ep001/live-diagram/shot02Timing';
import {VerticalSlice, verticalSliceSchema} from './episodes/ep001/vertical-slice/VerticalSlice';
import {FPS, VERTICAL_SLICE_FRAMES} from './episodes/ep001/vertical-slice/timeline';

export const Root: React.FC = () => {
  const input = getInputProps() as {durationInFrames?: number};
  const dynamicDuration = Math.max(1, Math.round(Number(input?.durationInFrames || 1)));

  return (
    <>
      <Composition
        id="EP001-VerticalSlice"
        component={VerticalSlice}
        durationInFrames={VERTICAL_SLICE_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        schema={verticalSliceSchema}
        defaultProps={{
          showDebugLabels: false,
        }}
      />
      <Composition
        id="EP001-LoginIntent-LiveDiagram"
        component={LoginIntentLiveScene}
        durationInFrames={SHOT01_DURATION_FRAMES}
        fps={SHOT01_FPS}
        width={1920}
        height={1080}
        schema={loginIntentLiveSceneSchema}
        defaultProps={{
          showGuides: false,
          viewMode: 'shot',
        }}
      />
      <Composition
        id="EP001-LoginIntent-ClientWorld"
        component={LoginIntentLiveScene}
        durationInFrames={SHOT01_DURATION_FRAMES}
        fps={SHOT01_FPS}
        width={1440}
        height={2560}
        schema={loginIntentLiveSceneSchema}
        defaultProps={{
          showGuides: false,
          viewMode: 'world',
        }}
      />
      <Composition
        id="EP001-PhoneFirst-Preview"
        component={PhoneFirstPreview}
        durationInFrames={SHOT01_DURATION_FRAMES}
        fps={SHOT01_FPS}
        width={1440}
        height={2560}
        schema={phoneFirstPreviewSchema}
        defaultProps={{
          showGuides: false,
        }}
      />
      <Composition
        id="EP001-PhoneFirst-Youtube"
        component={PhoneFirstYoutubePreview}
        durationInFrames={SHOT01_DURATION_FRAMES}
        fps={SHOT01_FPS}
        width={1920}
        height={1080}
        schema={phoneFirstYoutubePreviewSchema}
        defaultProps={{
          showGuides: false,
        }}
      />
      <Composition
        id="EP001-RequestAssembly-Youtube"
        component={RequestAssemblyYoutubePreview}
        durationInFrames={SHOT02_DURATION_FRAMES}
        fps={SHOT02_FPS}
        width={1920}
        height={1080}
        schema={requestAssemblyYoutubePreviewSchema}
        defaultProps={{
          showGuides: false,
        }}
      />
      <Composition
        id="EP001-Shot01-VoiceSynced"
        component={Shot01VoiceSynced}
        durationInFrames={dynamicDuration || SHOT01_DURATION_FRAMES}
        fps={SHOT01_FPS}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl: '',
          durationInFrames: SHOT01_DURATION_FRAMES,
          anchors: {},
        }}
      />
      <Composition
        id="EP001-Shot02-VoiceSynced"
        component={Shot02VoiceSynced}
        durationInFrames={dynamicDuration || SHOT02_DURATION_FRAMES}
        fps={SHOT02_FPS}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl: '',
          durationInFrames: SHOT02_DURATION_FRAMES,
          anchors: {},
        }}
      />
      <Composition
        id="EP001-Voice-CurrentPreview"
        component={CurrentEpisodePreview}
        durationInFrames={dynamicDuration}
        fps={30}
        width={1920}
        height={1080}
        schema={currentEpisodePreviewSchema}
        defaultProps={{
          durationInFrames: 1,
          segments: [],
        }}
      />
    </>
  );
};
