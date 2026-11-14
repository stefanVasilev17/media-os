import React from 'react';
import {EpisodeShotQaPreview} from './episodes/shared/EpisodeShotQaPreview';
import {Shot01UnifiedVisualV2} from './episodes/ep002/Shot01UnifiedVisualV2';
import {Shot02DirectorVisualV5} from './episodes/ep002/Shot02DirectorVisualV5';
import {Shot03DirectorVisualV1} from './episodes/ep002/Shot03DirectorVisualV1';
import {Shot04DirectorVisualV1} from './episodes/ep002/Shot04DirectorVisualV1';
import {Shot05DirectorVisualV1} from './episodes/ep002/Shot05DirectorVisualV1';
import {Shot06DirectorVisualV1} from './episodes/ep002/Shot06DirectorVisualV1';
import {Shot07DirectorVisualV1} from './episodes/ep002/Shot07DirectorVisualV1';
import {Shot08DirectorVisualV1} from './episodes/ep002/Shot08DirectorVisualV1';
import {Shot09DirectorVisualV1} from './episodes/ep002/Shot09DirectorVisualV1';
import {Shot10DirectorVisualV1} from './episodes/ep002/Shot10DirectorVisualV1';
import {Shot11DirectorVisualV1} from './episodes/ep002/Shot11DirectorVisualV1';
import {Ep003Shot01DirectorReviewV1} from './episodes/ep003/Shot01DirectorReviewV1';
import {Ep003Shot02DirectorReviewV1} from './episodes/ep003/Shot02DirectorReviewV1';
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
import {Shot04FinalPolish, Shot06FinalPolish, Shot07FinalPolish} from './episodes/ep001/live-diagram/FinalPolishSourceShots';
import {UserDatabaseHappyPathV1} from './episodes/ep001/live-diagram/UserDatabaseHappyPathV1';
import {UserDatabaseHappyPathV2} from './episodes/ep001/live-diagram/UserDatabaseHappyPathV2';
import {Shot08V3PremiumSlice} from './episodes/ep001/live-diagram/Shot08V3PremiumSlice';
import {Shot08V4ContinuousDive} from './episodes/ep001/live-diagram/Shot08V4ContinuousDive';
import {UserDatabaseV5ModernTable} from './episodes/ep001/live-diagram/UserDatabaseV5ModernTable';
import {UserDatabaseV6Premium} from './episodes/ep001/live-diagram/UserDatabaseV6Premium';
import {UserDatabaseV7Premium} from './episodes/ep001/live-diagram/UserDatabaseV7Premium';
import {UserDatabaseV8Premium} from './episodes/ep001/live-diagram/UserDatabaseV8Premium';
import {Shot08ApprovedVoiceV9} from './episodes/ep001/live-diagram/Shot08ApprovedVoiceV9';
import {Shot08ApprovedVoiceV10} from './episodes/ep001/live-diagram/Shot08ApprovedVoiceV10';
import {Shot09DirectorVoiceV1} from './episodes/ep001/live-diagram/Shot09DirectorVoiceV1';
import {Shot09DirectorVoiceV2} from './episodes/ep001/live-diagram/Shot09DirectorVoiceV2';
import {Shot09DirectorVoiceV3} from './episodes/ep001/live-diagram/Shot09DirectorVoiceV3';
import {Shot09DirectorVoiceV5} from './episodes/ep001/live-diagram/Shot09DirectorVoiceV5';
import {Shot09DirectorVoiceV6} from './episodes/ep001/live-diagram/Shot09DirectorVoiceV6';
import {Shot10SessionCreationShortV1} from './episodes/ep001/live-diagram/Shot10SessionCreationShortV1';
import {Shot10SessionCreationShortV2} from './episodes/ep001/live-diagram/Shot10SessionCreationShortV2';
import {Shot10SessionCreationShortV3} from './episodes/ep001/live-diagram/Shot10SessionCreationShortV3';
import {Shot10SessionCreationShortV4} from './episodes/ep001/live-diagram/Shot10SessionCreationShortV4';
import {Shot10SessionCreationShortV5} from './episodes/ep001/live-diagram/Shot10SessionCreationShortV5';
import {Shot10SessionCreationShortV6} from './episodes/ep001/live-diagram/Shot10SessionCreationShortV6';
import {Shot10SessionCreationShortV7} from './episodes/ep001/live-diagram/Shot10SessionCreationShortV7';
import {Shot10SessionCreationPresentationV8} from './episodes/ep001/live-diagram/Shot10SessionCreationPresentationV8';
import {Shot11RouteDecisionPresentationV1} from './episodes/ep001/live-diagram/Shot11RouteDecisionPresentationV1';
import {Shot11RouteDecisionPresentationV2} from './episodes/ep001/live-diagram/Shot11RouteDecisionPresentationV2';
import {Shot11RouteDecisionPresentationV3} from './episodes/ep001/live-diagram/Shot11RouteDecisionPresentationV3';
import {Shot11RouteDecisionPresentationV4} from './episodes/ep001/live-diagram/Shot11RouteDecisionPresentationV4';
import {Shot11RouteDecisionPresentationV5} from './episodes/ep001/live-diagram/Shot11RouteDecisionPresentationV5';
import {Shot12CompleteLoginRecapV1, SHOT12_RECAP_V1_FRAMES} from './episodes/ep001/live-diagram/Shot12CompleteLoginRecapV1';
import {Shot12CompleteLoginRecapV2, SHOT12_RECAP_V2_FRAMES} from './episodes/ep001/live-diagram/Shot12CompleteLoginRecapV2';
import {Shot12CompleteLoginRecapV3, SHOT12_RECAP_V3_FRAMES} from './episodes/ep001/live-diagram/Shot12CompleteLoginRecapV3';
import {Shot12CompleteLoginRecapV4, SHOT12_RECAP_V4_FRAMES} from './episodes/ep001/live-diagram/Shot12CompleteLoginRecapV4';
import {Shot12CompleteLoginRecapV5, SHOT12_RECAP_V5_FRAMES} from './episodes/ep001/live-diagram/Shot12CompleteLoginRecapV5';
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
        id="EP003-SHOT02-DIRECTOR-CANDIDATE"
        component={Ep003Shot02DirectorReviewV1}
        durationInFrames={dynamicDuration ?? 600}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:600,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'b6fd7f30-7c78-414b-a88c-387c0ee8c43a',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:14491,
          cueFrames:{INTRO:15,DEMAND:95,CAPACITY:165,QUEUES:240,
            THROUGHPUT:300,BOTTLENECK:350,MORE_AUTH:410,BUDGET:475,NEXT:560},
        }}
      />
      <Composition
        id="EP003-SHOT01-DIRECTOR-CANDIDATE"
        component={Ep003Shot01DirectorReviewV1}
        durationInFrames={dynamicDuration ?? 600}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:600,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'73ec0e6f-d348-4518-a32b-573bf89a8ab5',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:11978,
          cueFrames:{STABLE:10,UNRESOLVED:120,SHEDDING:230,CONSEQUENCE:350,CAPACITY:480},
        }}
      />
      <Composition
        id="EP002-SHOT11-CANDIDATE"
        component={Shot11DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
          lockedShot10Handoff:{
            renderId:'2034d8c6-99b2-46a5-9469-bf3df325d6c0',
            sourceCommit:'a4d9fe5d1dcec033f36ce68a190160fd8077faea',
            durationInFrames:2360,
            lastFrame:2359,
            shot09WorldLastFrame:8048,
            worldLastFrame:10407,
            criticalPulseStartFrame:0,
            cascadeStartFrame:1,
          },
        }}
      />
      <Composition
        id="EP002-SHOT10-CANDIDATE"
        component={Shot10DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
          lockedShot09Handoff:{
            renderId:'d4b6c8ff-10c5-4181-aa59-fcd16a4470ba',
            sourceCommit:'b33f00ee81f89301115a4fd79874802c712f2724',
            lastFrame:3062,
            durationInFrames:3063,
            shot08WorldLastFrame:4986,
            worldLastFrame:8048,
            criticalPulseStartFrame:0,
            cascadeStartFrame:1,
          },
        }}
      />
      <Composition
        id="EP002-SHOT09-CANDIDATE"
        component={Shot09DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
          lockedShot08Handoff:{
            renderId:'3415073a-5906-489d-bb69-6af7446c2c9b',
            sourceCommit:'a0dbdc8927cb2d47d5a1a3e691c6405bf0c28390',
            lastFrame:2313,
            shot07LastFrame:2673,
            worldLastFrame:4986,
            criticalPulseStartFrame:0,
            cascadeStartFrame:1,
          },
        }}
      />
      <Composition
        id="EP002-SHOT08-CANDIDATE"
        component={Shot08DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
          lockedShot07Handoff:{
            renderId:'b2a335dd-cb71-48f2-bf47-0f8bdcdd969d',
            sourceCommit:'d4fd0701f7298903dad2167e38bb7931edeae6bb',
            lastFrame:2673,
            criticalPulseStartFrame:0,cascadeStartFrame:1,
          },
        }}
      />
      <Composition
        id="EP002-SHOT07-CANDIDATE"
        component={Shot07DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
          criticalPulseStartFrame:0,
        }}
      />
      <Composition
        id="EP002-SHOT06-CANDIDATE"
        component={Shot06DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
        }}
      />
      <Composition
        id="EP002-SHOT05-CANDIDATE"
        component={Shot05DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
        }}
      />
      <Composition
        id="EP002-SHOT04-CANDIDATE"
        component={Shot04DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
        }}
      />
      <Composition
        id="EP002-SHOT03-CANDIDATE"
        component={Shot03DirectorVisualV1}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames:6,
          voiceTakeId:'',
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues:[],
          termCues:[],
        }}
      />
      <Composition
        id="EP002-SHOT02-CANDIDATE"
        component={Shot02DirectorVisualV5}
        durationInFrames={dynamicDuration ?? 6}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          durationInFrames: 6,
          voiceTakeId: '',
          timingMode: 'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          verifiedCues: [],
          termCues: [],
        }}
      />
      <Composition
        id="EP002-SHOT01-DRAFT"
        component={Shot01UnifiedVisualV2}
        durationInFrames={dynamicDuration ?? 1200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:1200,presentation:'STORYBOARD_PREVIEW_V1' as const,
          voiceTakeId:'',beatStartFrames:[],
          timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS' as const,
          visualStylePass:'SHOT01_SHOT02_UNIFIED_V2'}}
      />
      <Composition
        id="AT-EpisodeShot-QA"
        component={EpisodeShotQaPreview}
        durationInFrames={dynamicDuration ?? 150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          episodeId: '',
          shotKey: 'SHOT 01',
          shotTitle: 'Architecture storyboard',
          shotRevision: 1,
          scriptRevision: 1,
          visualDirection: '',
          durationInFrames: 150,
        }}
      />
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
        id="EP001-Shot08-VisualDraft"
        component={UserDatabaseHappyPathV1}
        durationInFrames={dynamicDuration ?? 2850}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2850,anchors:{}}}
      />
      <Composition
        id="EP001-Shot08-VisualDraft-V2"
        component={UserDatabaseHappyPathV2}
        durationInFrames={dynamicDuration ?? 2850}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2850,anchors:{}}}
      />
      <Composition
        id="EP001-Shot08-PremiumSlice-V3"
        component={Shot08V3PremiumSlice}
        durationInFrames={dynamicDuration ?? 900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:900}}
      />
      <Composition
        id="EP001-Shot08-ContinuousDive-V4"
        component={Shot08V4ContinuousDive}
        durationInFrames={dynamicDuration ?? 900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:900}}
      />
      <Composition
        id="EP001-Shot08-TableLookup-V5"
        component={UserDatabaseV5ModernTable}
        durationInFrames={dynamicDuration ?? 1650}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:1650,anchors:{}}}
      />
      <Composition
        id="EP001-Shot08-PremiumV6"
        component={UserDatabaseV6Premium}
        durationInFrames={dynamicDuration ?? 1650}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:1650,anchors:{}}}
      />
      <Composition
        id="EP001-Shot08-PremiumV7"
        component={UserDatabaseV7Premium}
        durationInFrames={dynamicDuration ?? 1650}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:1650,anchors:{}}}
      />
      <Composition
        id="EP001-Shot08-PremiumV8"
        component={UserDatabaseV8Premium}
        durationInFrames={dynamicDuration ?? 1650}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:1650,anchors:{}}}
      />
      <Composition
        id="EP001-Shot08-DirectorVoiceV9"
        component={Shot08ApprovedVoiceV9}
        durationInFrames={dynamicDuration ?? 4690}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:4690,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot08-DirectorVoiceV10"
        component={Shot08ApprovedVoiceV10}
        durationInFrames={dynamicDuration ?? 4690}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:4690,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot09-DirectorVoiceV1"
        component={Shot09DirectorVoiceV1}
        durationInFrames={dynamicDuration ?? 4090}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:4090,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot09-DirectorVoiceV2"
        component={Shot09DirectorVoiceV2}
        durationInFrames={dynamicDuration ?? 4090}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:4090,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot09-DirectorVoiceV3"
        component={Shot09DirectorVoiceV3}
        durationInFrames={dynamicDuration ?? 4090}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:4090,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot09-DirectorVoiceV4"
        component={Shot09DirectorVoiceV3}
        durationInFrames={dynamicDuration ?? 4090}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:4090,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot09-DirectorVoiceV5"
        component={Shot09DirectorVoiceV5}
        durationInFrames={dynamicDuration ?? 4090}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:4090,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot09-DirectorVoiceV6"
        component={Shot09DirectorVoiceV6}
        durationInFrames={dynamicDuration ?? 4090}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:4090,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot10-SessionCreationShortV1"
        component={Shot10SessionCreationShortV1}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot10-SessionCreationShortV2"
        component={Shot10SessionCreationShortV2}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot10-SessionCreationShortV3"
        component={Shot10SessionCreationShortV3}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot10-SessionCreationShortV4"
        component={Shot10SessionCreationShortV4}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot10-SessionCreationShortV5"
        component={Shot10SessionCreationShortV5}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot10-SessionCreationShortV6"
        component={Shot10SessionCreationShortV6}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot10-SessionCreationShortV7"
        component={Shot10SessionCreationShortV7}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot10-SessionCreationPresentationV8"
        component={Shot10SessionCreationPresentationV8}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot11-RouteDecisionPresentationV1"
        component={Shot11RouteDecisionPresentationV1}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot11-RouteDecisionPresentationV2"
        component={Shot11RouteDecisionPresentationV2}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot11-RouteDecisionPresentationV3"
        component={Shot11RouteDecisionPresentationV3}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot11-RouteDecisionPresentationV4"
        component={Shot11RouteDecisionPresentationV4}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot11-RouteDecisionPresentationV5"
        component={Shot11RouteDecisionPresentationV5}
        durationInFrames={dynamicDuration ?? 2160}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:2160,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot12-CompleteLoginRecapV1"
        component={Shot12CompleteLoginRecapV1}
        durationInFrames={dynamicDuration ?? SHOT12_RECAP_V1_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:SHOT12_RECAP_V1_FRAMES,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot12-CompleteLoginRecapV2"
        component={Shot12CompleteLoginRecapV2}
        durationInFrames={dynamicDuration ?? SHOT12_RECAP_V2_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:SHOT12_RECAP_V2_FRAMES,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot12-CompleteLoginRecapV3"
        component={Shot12CompleteLoginRecapV3}
        durationInFrames={dynamicDuration ?? SHOT12_RECAP_V3_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:SHOT12_RECAP_V3_FRAMES,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot12-CompleteLoginRecapV4"
        component={Shot12CompleteLoginRecapV4}
        durationInFrames={dynamicDuration ?? SHOT12_RECAP_V4_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:SHOT12_RECAP_V4_FRAMES,audioClips:[]}}
      />
      <Composition
        id="EP001-Shot12-CompleteLoginRecapV5"
        component={Shot12CompleteLoginRecapV5}
        durationInFrames={dynamicDuration ?? SHOT12_RECAP_V5_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{durationInFrames:SHOT12_RECAP_V5_FRAMES,audioClips:[]}}
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
        id="EP001-Shot04-FinalPolish" component={Shot04FinalPolish}
        durationInFrames={2601} fps={30} width={1920} height={1080}/>
      <Composition
        id="EP001-Shot06-FinalPolish" component={Shot06FinalPolish}
        durationInFrames={5137} fps={30} width={1920} height={1080}/>
      <Composition
        id="EP001-Shot07-FinalPolish" component={Shot07FinalPolish}
        durationInFrames={4882} fps={30} width={1920} height={1080}/>
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
