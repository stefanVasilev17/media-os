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
import {Ep003Shot03WordingV4} from './episodes/ep003/Shot03WordingV4';
import {Ep003Shot04ReadWriteSplittingV1} from './episodes/ep003/Shot04ReadWriteSplittingV1';
import {Ep003Shot05StaleReadV1} from './episodes/ep003/Shot05StaleReadV1';
import {Ep003Shot06CorrectnessBeforeSpeedV1} from './episodes/ep003/Shot06CorrectnessBeforeSpeedV1';
import {Ep003Shot07BottleneckMeasurementV1} from './episodes/ep003/Shot07BottleneckMeasurementV1';
import {Ep003Shot07BottleneckMeasurementV2} from './episodes/ep003/Shot07BottleneckMeasurementV2';
import {Ep003Shot07BottleneckMeasurementV3} from './episodes/ep003/Shot07BottleneckMeasurementV3';
import {Ep003Shot08WhenCopiesAreNotEnoughV1} from './episodes/ep003/Shot08WhenCopiesAreNotEnoughV1';
import {Ep003Shot08WhenCopiesAreNotEnoughV2} from './episodes/ep003/Shot08WhenCopiesAreNotEnoughV2';
import {Ep003Shot08WhenCopiesAreNotEnoughV3} from './episodes/ep003/Shot08WhenCopiesAreNotEnoughV3';
import {Ep003Shot09WhenPrimaryDisappearsV1} from './episodes/ep003/Shot09WhenPrimaryDisappearsV1';
import {Ep003Shot09WhenPrimaryDisappearsV2} from './episodes/ep003/Shot09WhenPrimaryDisappearsV2';
import {Ep003Shot10ProveArchitectureV1} from './episodes/ep003/Shot10ProveArchitectureV1';
import {Ep003Shot08WhenCopiesAreNotEnoughV4} from './episodes/ep003/Shot08WhenCopiesAreNotEnoughV4';
import {Ep003Shot09WhenPrimaryDisappearsV3} from './episodes/ep003/Shot09WhenPrimaryDisappearsV3';
import {Ep003Shot10ProveArchitectureV2} from './episodes/ep003/Shot10ProveArchitectureV2';
import {Ep003Shot11HumanFirstFinaleV1} from './episodes/ep003/Shot11HumanFirstFinaleV1';
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
        id="EP003-SHOT11-FINALE-V1-DIRECTOR-CANDIDATE"
        component={Ep003Shot11HumanFirstFinaleV1}
        durationInFrames={dynamicDuration ?? 3104}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:3104,
          voiceTakeId:'5c3435f6-ae66-4ec3-a6b0-bf1cc8207486',
          previousRenderId:'174c8a8b-3202-4067-95ef-7dab1de11aa3',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:47457,
          cueFrames:{
            BEGIN:60,ONE_PERSON:165,FOLLOWED:270,AUTH_STATE:375,
            PRESSURE:480,HEALTHY:585,BOTTLENECK:690,PROTECTED:795,
            CAPACITY:900,CHOICES:1005,REPLICATION:1110,CONSISTENCY:1215,
            SHARDING:1320,FAILOVER:1425,RESPONSIBILITY:1530,
            MORE_CAPACITY:1635,MORE_COPIES:1740,MORE_OWNERS:1845,
            SYSTEM_DESIGN:1950,NOT_COMPONENTS:2055,TRADEOFF:2160,
            HUMAN:2460,LOGIN:2565,SUCCESS:2670
          },
        }}
      />
      <Composition
        id="EP003-SHOT10-MEASUREMENT-V2-DIRECTOR-CANDIDATE"
        component={Ep003Shot10ProveArchitectureV2}
        durationInFrames={dynamicDuration ?? 4016}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:4016,
          voiceTakeId:'0168eb87-538f-49d8-9c79-132d822bdb60',
          previousRenderId:'b3a3912f-79ee-4c72-b313-cbe09f950a5e',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:43442,
          cueFrames:{
            RETURN:60,
            ORIGINAL_DB:190,
            EXPLORED:320,
            PROVE:450,
            OUTCOME:580,
            SUCCESS:710,
            SLI:840,
            SLI_DEFINITION:970,
            SLO:1100,
            TWO_SECONDS:1230,
            REJECTED:1360,
            LATENCY:1490,
            P95:1620,
            SUCCESS_BIAS:1750,
            HALF_USERS:1880,
            DATABASE_METRICS:2010,
            SHARD_OVERLOAD:2140,
            TEST_FAILOVER:2270,
            RECOVERY:2400,
            RTO_RPO:2530,
            COMPARE:2660,
            MORE_LOGINS:2790,
            PRESSURE:2920,
            COMPLEXITY:3050,
            PURPOSE:3180,
          },
        }}
      />
      <Composition
        id="EP003-SHOT10-MEASUREMENT-V1-DIRECTOR-CANDIDATE"
        component={Ep003Shot10ProveArchitectureV1}
        durationInFrames={dynamicDuration ?? 4016}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:4016,
          voiceTakeId:'0168eb87-538f-49d8-9c79-132d822bdb60',
          previousRenderId:'b3a3912f-79ee-4c72-b313-cbe09f950a5e',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:43442,
          cueFrames:{
            RETURN:60,
            ORIGINAL_DB:190,
            EXPLORED:320,
            PROVE:450,
            OUTCOME:580,
            SUCCESS:710,
            SLI:840,
            SLI_DEFINITION:970,
            SLO:1100,
            TWO_SECONDS:1230,
            REJECTED:1360,
            LATENCY:1490,
            P95:1620,
            SUCCESS_BIAS:1750,
            HALF_USERS:1880,
            DATABASE_METRICS:2010,
            SHARD_OVERLOAD:2140,
            TEST_FAILOVER:2270,
            RECOVERY:2400,
            RTO_RPO:2530,
            COMPARE:2660,
            MORE_LOGINS:2790,
            PRESSURE:2920,
            COMPLEXITY:3050,
            PURPOSE:3180,
          },
        }}
      />
      <Composition
        id="EP003-SHOT09-FAILOVER-V3-DIRECTOR-CANDIDATE"
        component={Ep003Shot09WhenPrimaryDisappearsV3}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'7510815a-d096-415f-b4f0-52ae8398ce45',
          previousRenderId:'00000000-0000-4000-8000-000000000000',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:40298,
          cueFrames:{
            INTRO:60,
            PRIMARY_AND_REPLICA:74,
            PRIMARY_OWNS:88,
            PRIMARY_FAIL:102,
            REQUEST_FAILURE:116,
            OTHER_SHARD:130,
            RECOVERY_PATH:144,
            PROMOTE:158,
            FAILOVER:172,
            LEGITIMATE_OWNER:186,
            OLD_RETURN:200,
            TWO_WRITERS:214,
            SPLIT_BRAIN:228,
            FENCING:242,
            FENCE_MEANING:256,
            DATA_RISK:270,
            ASYNC:284,
            LAG:298,
            DATA_LOSS:312,
            GREEN_ARROW:326,
            CORRECTNESS:340,
            INSTANCES:354,
            WRONG_STATE:368,
            TEST_FAILURES:382,
          },
        }}
      />
      <Composition
        id="EP003-SHOT09-FAILOVER-V2-DIRECTOR-CANDIDATE"
        component={Ep003Shot09WhenPrimaryDisappearsV2}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'7510815a-d096-415f-b4f0-52ae8398ce45',
          previousRenderId:'00000000-0000-4000-8000-000000000000',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:40298,
          cueFrames:{
            INTRO:60,
            PRIMARY_AND_REPLICA:74,
            PRIMARY_OWNS:88,
            PRIMARY_FAIL:102,
            REQUEST_FAILURE:116,
            OTHER_SHARD:130,
            RECOVERY_PATH:144,
            PROMOTE:158,
            FAILOVER:172,
            LEGITIMATE_OWNER:186,
            OLD_RETURN:200,
            TWO_WRITERS:214,
            SPLIT_BRAIN:228,
            FENCING:242,
            FENCE_MEANING:256,
            DATA_RISK:270,
            ASYNC:284,
            LAG:298,
            DATA_LOSS:312,
            GREEN_ARROW:326,
            CORRECTNESS:340,
            INSTANCES:354,
            WRONG_STATE:368,
            TEST_FAILURES:382,
          },
        }}
      />
      <Composition
        id="EP003-SHOT09-FAILOVER-V1-DIRECTOR-CANDIDATE"
        component={Ep003Shot09WhenPrimaryDisappearsV1}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'7510815a-d096-415f-b4f0-52ae8398ce45',
          previousRenderId:'22059373-cc17-44fd-ad03-56d092cc57dc',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:40298,
          cueFrames:{
            INTRO:60,
            PRIMARY_AND_REPLICA:74,
            PRIMARY_OWNS:88,
            PRIMARY_FAIL:102,
            REQUEST_FAILURE:116,
            OTHER_SHARD:130,
            RECOVERY_PATH:144,
            PROMOTE:158,
            FAILOVER:172,
            LEGITIMATE_OWNER:186,
            OLD_RETURN:200,
            TWO_WRITERS:214,
            SPLIT_BRAIN:228,
            FENCING:242,
            FENCE_MEANING:256,
            DATA_RISK:270,
            ASYNC:284,
            LAG:298,
            DATA_LOSS:312,
            GREEN_ARROW:326,
            CORRECTNESS:340,
            INSTANCES:354,
            WRONG_STATE:368,
            TEST_FAILURES:382,
          },
        }}
      />
      <Composition
        id="EP003-SHOT08-SHARDING-V4-DIRECTOR-CANDIDATE"
        component={Ep003Shot08WhenCopiesAreNotEnoughV4}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'368c239c-a93b-437e-a833-2f955fa51803',
          previousRenderId:'09457c3c-32d9-432c-aa92-67f0e7b13f60',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:34927,
          cueFrames:{
            INTRO:60,
            ONE_PRIMARY:76,
            DIVIDE:92,
            OWNER_A:108,
            OWNER_B:124,
            SHARDING:140,
            SHARD_DEF:156,
            INDEPENDENT_PRIMARY:172,
            CRITICAL_LOOKUPS:188,
            SHARD_A:204,
            SHARD_B:220,
            AUTHORITATIVE:236,
            SHARD_KEY_QUESTION:252,
            SHARD_KEY:268,
            SHARD_KEY_DEF:284,
            MAPPING:300,
            ROUTING:316,
            IDENTIFIER_CHANGE:332,
            MISSING_KEY:348,
            HOT_SHARD_QUESTION:364,
            HOT_SHARD:380,
            HOT_WARNING:396,
            CROSS_SHARD:412,
            EACH_REPLICAS:428,
            COMPARE:444,
            COMPARE_DEF:460,
            CAPACITY:476,
            HYPOTHESIS:492,
            FAILURE:508
          },
        }}
      />
      <Composition
        id="EP003-SHOT08-SHARDING-V3-DIRECTOR-CANDIDATE"
        component={Ep003Shot08WhenCopiesAreNotEnoughV3}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'368c239c-a93b-437e-a833-2f955fa51803',
          previousRenderId:'09457c3c-32d9-432c-aa92-67f0e7b13f60',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:34927,
          cueFrames:{
            INTRO:60,
            ONE_PRIMARY:76,
            DIVIDE:92,
            OWNER_A:108,
            OWNER_B:124,
            SHARDING:140,
            SHARD_DEF:156,
            INDEPENDENT_PRIMARY:172,
            CRITICAL_LOOKUPS:188,
            SHARD_A:204,
            SHARD_B:220,
            AUTHORITATIVE:236,
            SHARD_KEY_QUESTION:252,
            SHARD_KEY:268,
            SHARD_KEY_DEF:284,
            MAPPING:300,
            ROUTING:316,
            IDENTIFIER_CHANGE:332,
            MISSING_KEY:348,
            HOT_SHARD_QUESTION:364,
            HOT_SHARD:380,
            HOT_WARNING:396,
            CROSS_SHARD:412,
            EACH_REPLICAS:428,
            COMPARE:444,
            COMPARE_DEF:460,
            CAPACITY:476,
            HYPOTHESIS:492,
            FAILURE:508
          },
        }}
      />
      <Composition
        id="EP003-SHOT08-SHARDING-V2-DIRECTOR-CANDIDATE"
        component={Ep003Shot08WhenCopiesAreNotEnoughV2}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'368c239c-a93b-437e-a833-2f955fa51803',
          previousRenderId:'09457c3c-32d9-432c-aa92-67f0e7b13f60',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:34927,
          cueFrames:{
            INTRO:60,
            ONE_PRIMARY:76,
            DIVIDE:92,
            OWNER_A:108,
            OWNER_B:124,
            SHARDING:140,
            SHARD_DEF:156,
            INDEPENDENT_PRIMARY:172,
            CRITICAL_LOOKUPS:188,
            SHARD_A:204,
            SHARD_B:220,
            AUTHORITATIVE:236,
            SHARD_KEY_QUESTION:252,
            SHARD_KEY:268,
            SHARD_KEY_DEF:284,
            MAPPING:300,
            ROUTING:316,
            IDENTIFIER_CHANGE:332,
            MISSING_KEY:348,
            HOT_SHARD_QUESTION:364,
            HOT_SHARD:380,
            HOT_WARNING:396,
            CROSS_SHARD:412,
            EACH_REPLICAS:428,
            COMPARE:444,
            COMPARE_DEF:460,
            CAPACITY:476,
            HYPOTHESIS:492,
            FAILURE:508
          },
        }}
      />
      <Composition
        id="EP003-SHOT08-SHARDING-V1-DIRECTOR-CANDIDATE"
        component={Ep003Shot08WhenCopiesAreNotEnoughV1}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'368c239c-a93b-437e-a833-2f955fa51803',
          previousRenderId:'09457c3c-32d9-432c-aa92-67f0e7b13f60',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:34927,
          cueFrames:{
            INTRO:60,
            ONE_PRIMARY:76,
            DIVIDE:92,
            OWNER_A:108,
            OWNER_B:124,
            SHARDING:140,
            SHARD_DEF:156,
            INDEPENDENT_PRIMARY:172,
            CRITICAL_LOOKUPS:188,
            SHARD_A:204,
            SHARD_B:220,
            AUTHORITATIVE:236,
            SHARD_KEY_QUESTION:252,
            SHARD_KEY:268,
            SHARD_KEY_DEF:284,
            MAPPING:300,
            ROUTING:316,
            IDENTIFIER_CHANGE:332,
            MISSING_KEY:348,
            HOT_SHARD_QUESTION:364,
            HOT_SHARD:380,
            HOT_WARNING:396,
            CROSS_SHARD:412,
            EACH_REPLICAS:428,
            COMPARE:444,
            COMPARE_DEF:460,
            CAPACITY:476,
            HYPOTHESIS:492,
            FAILURE:508
          },
        }}
      />
      <Composition
        id="EP003-SHOT07-BOTTLENECK-V3-DIRECTOR-CANDIDATE"
        component={Ep003Shot07BottleneckMeasurementV3}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'0007bd16-edbf-4ecc-927a-4a5781d0b921',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:31452,
          cueFrames:{
            INTRO:60,THREE_AUTH:100,PRIMARY_ONE:120,TWO_REPLICAS:140,
            MORE_MACHINES:160,ORIGINAL_PROBLEM:190,LOGIN_RATE:220,
            LOOKUP_RATE:245,AFTER_REPLICAS:270,MEASURE_WORKLOAD:290,
            OPTIONAL_BUSY:315,PRIMARY_CHECK:335,LIMIT_REACHED:360,
            REPLICAS_HELPED:385,NOT_REMOVED:400,CRITICAL_PATH:420,
            PATH_DEFINITION:445,LOGIN_REQUIRED:465,PREFERENCE_FAST:490,
            PRIMARY_DEP:515,COMPLEXITY:540,MORE_DB:565,DASHBOARD:590,
            STILL_FAIL:615,WORK_STAYED:640,BETTER_QUESTION:665,
            PARTITION_OWNERSHIP:695
          },
        }}
      />
      <Composition
        id="EP003-SHOT07-BOTTLENECK-V2-DIRECTOR-CANDIDATE"
        component={Ep003Shot07BottleneckMeasurementV2}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'0007bd16-edbf-4ecc-927a-4a5781d0b921',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:31452,
          cueFrames:{
            INTRO:60,THREE_AUTH:100,PRIMARY_ONE:120,TWO_REPLICAS:140,
            MORE_MACHINES:160,ORIGINAL_PROBLEM:190,LOGIN_RATE:220,
            LOOKUP_RATE:245,AFTER_REPLICAS:270,MEASURE_WORKLOAD:290,
            OPTIONAL_BUSY:315,PRIMARY_CHECK:335,LIMIT_REACHED:360,
            REPLICAS_HELPED:385,NOT_REMOVED:400,CRITICAL_PATH:420,
            PATH_DEFINITION:445,LOGIN_REQUIRED:465,PREFERENCE_FAST:490,
            PRIMARY_DEP:515,COMPLEXITY:540,MORE_DB:565,DASHBOARD:590,
            STILL_FAIL:615,WORK_STAYED:640,BETTER_QUESTION:665,
            PARTITION_OWNERSHIP:695
          },
        }}
      />
      <Composition
        id="EP003-SHOT07-BOTTLENECK-V1-DIRECTOR-CANDIDATE"
        component={Ep003Shot07BottleneckMeasurementV1}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'0007bd16-edbf-4ecc-927a-4a5781d0b921',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:31452,
          cueFrames:{
            INTRO:60,THREE_AUTH:100,PRIMARY_ONE:120,TWO_REPLICAS:140,
            MORE_MACHINES:160,ORIGINAL_PROBLEM:190,LOGIN_RATE:220,
            LOOKUP_RATE:245,AFTER_REPLICAS:270,MEASURE_WORKLOAD:290,
            OPTIONAL_BUSY:315,PRIMARY_CHECK:335,LIMIT_REACHED:360,
            REPLICAS_HELPED:385,NOT_REMOVED:400,CRITICAL_PATH:420,
            PATH_DEFINITION:445,LOGIN_REQUIRED:465,PREFERENCE_FAST:490,
            PRIMARY_DEP:515,COMPLEXITY:540,MORE_DB:565,DASHBOARD:590,
            STILL_FAIL:615,WORK_STAYED:640,BETTER_QUESTION:665,
            PARTITION_OWNERSHIP:695
          },
        }}
      />
      <Composition
        id="EP003-SHOT06-CORRECTNESS-V1-DIRECTOR-CANDIDATE"
        component={Ep003Shot06CorrectnessBeforeSpeedV1}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'04b9f55a-7705-4f23-b9f7-a0103e8c955b',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:27852,
          cueFrames:{
            INTRO:60,FASTEST:100,GUARANTEES:140,CONSISTENCY:180,VERSION:210,
            ACCOUNT_SECURITY:240,PRIMARY_AUTH:270,PREFERENCE:310,
            VERSION_CHECK:340,MISSING_VERSION:370,WAIT:400,PRIMARY_FALLBACK:425,
            REJECT:445,FAIL_CLOSED:465,WHEN_UNSAFE:485,COST:510,
            TRADEOFFS:530,BALANCE:550,NOT_MAGIC:575,REAL_QUESTION:600,
            MORE_USERS:625,MEASURE:650
          },
        }}
      />
      <Composition
        id="EP003-SHOT05-STALE-READ-V1-DIRECTOR-CANDIDATE"
        component={Ep003Shot05StaleReadV1}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'4079729b-c1b3-405c-9a83-1ace0ef25641',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:24852,
          cueFrames:{
            INTRO:60,ACCOUNT_LOCKED:95,PRIMARY_WRITE:130,LOCK_COMMITTED:165,
            REPLICA_LAG:200,VERSION_SPLIT:235,LAG_DEFINITION:270,
            ANOTHER_LOGIN:305,SAFE_PRIMARY:340,HYPOTHETICAL:375,
            STALE_ACTIVE:410,STALE_READ:445,UNSAFE:480,EVENTUAL:515,
            CATCH_UP:550,DISPLAY_PREFERENCE:575,SECURITY:600,
            FAST_UNSAFE:620,CONCLUSION:640
          },
        }}
      />
      <Composition
        id="EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE"
        component={Ep003Shot04ReadWriteSplittingV1}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'fc26ca7b-60f2-4c35-b248-6b373736ce99',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:21012,
          cueFrames:{
            INTRO:60,THREE:100,DANGER:150,AUTH_ROUTING:195,
            SPLIT:225,WRITES:265,AUTH_CHECK:300,DISABLED:335,
            PRIMARY_SAFE:365,PREFERENCE:400,REPLICA_A:430,REPLICA_B:465,
            READ_SCALING:490,PRIMARY_CAPACITY:515,CRITICAL_STILL:540,
            MORE_READS:575,FRESHNESS:615
          },
        }}
      />
      <Composition
        id="EP003-SHOT03-WORDING-V4-DIRECTOR-CANDIDATE"
        component={Ep003Shot03WordingV4}
        durationInFrames={dynamicDuration ?? 660}
        fps={30} width={1920} height={1080}
        defaultProps={{
          durationInFrames:660,
          voiceTakeId:'00000000-0000-0000-0000-000000000001',
          previousRenderId:'78db6f85-ba05-4714-ba4f-fc70d64def88',
          previousLastFrameSha256:'0'.repeat(64),
          previousLastFrameDataUri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lm0AAAAASUVORK5CYII=',
          worldStartFrame:17933,
          cueFrames:{INTRO:60,PRIMARY:120,INTRO_REPLICAS:165,REPLICA_A:200,
            REPLICA_B:250,COPY:290,REPLICATION:330,WRITE:375,
            ASYNC:420,LAG:460,READS:510,SCALE:550,QUESTION:600},
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
