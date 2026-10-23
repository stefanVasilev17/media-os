import React from 'react';
import {Composition, getInputProps} from 'remotion';
import {LoginIntentLiveScene, loginIntentLiveSceneSchema} from './episodes/ep001/live-diagram/LoginIntentLiveScene';
import {PhoneFirstPreview, phoneFirstPreviewSchema} from './episodes/ep001/live-diagram/PhoneFirstPreview';
import {PhoneFirstYoutubePreview, phoneFirstYoutubePreviewSchema} from './episodes/ep001/live-diagram/PhoneFirstYoutubePreview';
import {RequestAssemblyYoutubePreview, requestAssemblyYoutubePreviewSchema} from './episodes/ep001/live-diagram/RequestAssemblyYoutubePreview';
import {ReadyNotSentYoutubePreview, readyNotSentYoutubePreviewSchema} from './episodes/ep001/live-diagram/ReadyNotSentYoutubePreview';
import {NetworkTransitYoutubePreview,networkTransitYoutubePreviewSchema} from './episodes/ep001/live-diagram/NetworkTransitYoutubePreview';
import {LoadBalancerYoutubePreview} from './episodes/ep001/live-diagram/LoadBalancerYoutubePreview';
import {Shot01VoiceSynced, Shot02VoiceSynced, Shot03VoiceSynced, Shot04VoiceSynced, Shot05VoiceSynced, Shot06VoiceSynced, Shot07VoiceSynced, voiceSyncedShotSchema} from './episodes/ep001/live-diagram/VoiceSyncedShot';
import {CurrentEpisodePreview, currentEpisodePreviewSchema} from './episodes/ep001/live-diagram/CurrentEpisodePreview';
import {StudioLivingMapDraftPreview, studioLivingMapDraftSchema} from './episodes/ep001/live-diagram/StudioLivingMapDraftPreview';
import {StudioDirectorPlanPreview, studioDirectorPlanSchema} from './episodes/ep001/live-diagram/StudioDirectorPlanPreview';
import {SHOT01_DURATION_FRAMES, SHOT01_FPS} from './episodes/ep001/live-diagram/shot01Timing';
import {SHOT02_DURATION_FRAMES, SHOT02_FPS} from './episodes/ep001/live-diagram/shot02Timing';
import {SHOT03_DURATION_FRAMES, SHOT03_FPS} from './episodes/ep001/live-diagram/shot03Timing';
import {SHOT04_DURATION_FRAMES,SHOT04_FPS} from './episodes/ep001/live-diagram/shot04Timing';
import {SHOT05_DURATION_FRAMES,SHOT05_FPS} from './episodes/ep001/live-diagram/shot05Timing';
import {VerticalSlice, verticalSliceSchema} from './episodes/ep001/vertical-slice/VerticalSlice';
import {FPS, VERTICAL_SLICE_FRAMES} from './episodes/ep001/vertical-slice/timeline';

export const Root: React.FC = () => {
  const input = getInputProps() as {durationInFrames?: number};
  const requestedDuration = Number(input?.durationInFrames);
  const dynamicDuration = Number.isFinite(requestedDuration) && requestedDuration > 0
    ? Math.round(requestedDuration)
    : null;

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
        durationInFrames={dynamicDuration ?? SHOT01_DURATION_FRAMES}
        fps={SHOT01_FPS}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl: '',
          audioClips: [],
          durationInFrames: SHOT01_DURATION_FRAMES,
          anchors: {},
          comprehensionHolds: [],
        }}
      />
      <Composition
        id="EP001-Shot02-VoiceSynced"
        component={Shot02VoiceSynced}
        durationInFrames={dynamicDuration ?? SHOT02_DURATION_FRAMES}
        fps={SHOT02_FPS}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl: '',
          audioClips: [],
          durationInFrames: SHOT02_DURATION_FRAMES,
          anchors: {},
          comprehensionHolds: [],
        }}
      />
      <Composition
        id="EP001-ReadyNotSent-Youtube"
        component={ReadyNotSentYoutubePreview}
        durationInFrames={SHOT03_DURATION_FRAMES}
        fps={SHOT03_FPS}
        width={1920}
        height={1080}
        schema={readyNotSentYoutubePreviewSchema}
        defaultProps={{showGuides:false}}
      />
      <Composition
        id="EP001-Shot03-VoiceSynced"
        component={Shot03VoiceSynced}
        durationInFrames={dynamicDuration ?? SHOT03_DURATION_FRAMES}
        fps={SHOT03_FPS}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl:'',
          audioClips:[],
          durationInFrames:SHOT03_DURATION_FRAMES,
          anchors:{},
          comprehensionHolds:[],
        }}
      />
      <Composition
        id="EP001-NetworkTransit-Youtube"
        component={NetworkTransitYoutubePreview}
        durationInFrames={SHOT04_DURATION_FRAMES}
        fps={SHOT04_FPS}
        width={1920}
        height={1080}
        schema={networkTransitYoutubePreviewSchema}
        defaultProps={{showGuides:false}}
      />
      <Composition
        id="EP001-Shot04-VoiceSynced"
        component={Shot04VoiceSynced}
        durationInFrames={dynamicDuration ?? SHOT04_DURATION_FRAMES}
        fps={SHOT04_FPS}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl:'',
          audioClips:[],
          durationInFrames:SHOT04_DURATION_FRAMES,
          anchors:{},
          comprehensionHolds:[],
        }}
      />
      <Composition
        id="EP001-Shot05-VoiceSynced"
        component={Shot05VoiceSynced}
        durationInFrames={dynamicDuration ?? SHOT05_DURATION_FRAMES}
        fps={SHOT05_FPS}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl:"",audioClips:[],durationInFrames:SHOT05_DURATION_FRAMES,
          anchors:{},comprehensionHolds:[],
        }}
      />
      <Composition
        id="EP001-LoadBalancer-Youtube"
        component={LoadBalancerYoutubePreview}
        durationInFrames={dynamicDuration ?? 5220}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:5220,anchors:{},clipStarts:[]}}
      />
      <Composition
        id="EP001-Shot06-VoiceSynced"
        component={Shot06VoiceSynced}
        durationInFrames={dynamicDuration ?? 5220}
        fps={30}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl:'',audioClips:[],durationInFrames:5220,
          anchors:{},comprehensionHolds:[],
        }}
      />
      <Composition
        id="EP001-Shot07-VoiceSynced"
        component={Shot07VoiceSynced}
        durationInFrames={dynamicDuration ?? 6000}
        fps={30}
        width={1920}
        height={1080}
        schema={voiceSyncedShotSchema}
        defaultProps={{
          audioUrl:'',audioClips:[],durationInFrames:6000,
          anchors:{},comprehensionHolds:[],
        }}
      />
      <Composition
        id="EP001-Studio-DirectorPlan"
        component={StudioDirectorPlanPreview}
        durationInFrames={dynamicDuration ?? 3900}
        fps={30}
        width={1920}
        height={1080}
        schema={studioDirectorPlanSchema}
        defaultProps={{
          durationInFrames:3900,
          directorPlan:{
            schemaVersion:1,recipeId:'EP001_GATEWAY_DIAGNOSTICS_V1',
            shotKey:'SHOT 05',fps:30,durationInFrames:3900,
            originalVideoPreserved:true,livingMapSource:'EP001_CURRENT_WORLD',
            voiceSignature:'0'.repeat(64),directorNotes:'',sections:[],events:[],
            anchors:{},audioSources:[],
          },
          audioClips:[],
        }}
      />
      <Composition
        id="EP001-Studio-LivingMapDraft"
        component={StudioLivingMapDraftPreview}
        durationInFrames={dynamicDuration ?? 600}
        fps={30}
        width={1920}
        height={1080}
        schema={studioLivingMapDraftSchema}
        defaultProps={{shotKey:'',shotTitle:'Architecture',focusNode:'API Gateway',routeNodes:['Client','API Gateway','Auth Service'],cameraMode:'FOCUS',annotation:'',audioClips:[],durationInFrames:600}}
      />
      <Composition
        id="EP001-Voice-CurrentPreview"
        component={CurrentEpisodePreview}
        durationInFrames={dynamicDuration ?? 1}
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
