import type {Ep002SceneContract} from '../api/ep002RemotionSceneContractApi';
import type {ExistingTakeAlignmentState} from '../api/ep002CreativeVoiceApi';

export type Shot01RenderDecision={
  action:'RENDER'|'ALIGN_AND_RENDER'|'BLOCKED';
  reason:string;
};

export function genuineShot01CueFrames(scene:Ep002SceneContract|null):boolean {
  return scene!==null
    && scene.cueTimingAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS'
    && scene.beats.length===5
    && scene.beats.every(b=>b.cueStatus==='AUDIO_ALIGNED'
      && b.startFrame!==null && b.endFrame!==null && b.endFrame>b.startFrame);
}

export function decideShot01Render(
  scene:Ep002SceneContract|null,alignment:ExistingTakeAlignmentState|null
):Shot01RenderDecision {
  if(scene===null)return {action:'BLOCKED',reason:'Read-only SHOT01 scene is not loaded.'};
  if(scene.inputs.preferredTakeId===null)
    return {action:'BLOCKED',reason:'Select and approve a current-revision voice Take first.'};
  if(scene.inputs.measuredDurationSeconds===null || scene.video.durationInFrames===null)
    return {action:'BLOCKED',reason:'The selected voice has no measured audio duration.'};
  const otherBlockers=scene.readiness.blockers.filter(b=>b!=='NARRATION_CUE_REVIEW_REQUIRED');
  if(otherBlockers.length>0)
    return {action:'BLOCKED',reason:'Current production blockers: '+otherBlockers.join(', ')};
  if(genuineShot01CueFrames(scene))
    return {action:'RENDER',reason:'Five real approved Take cues are ready for paid CPU rendering.'};
  if(!alignment)
    return {action:'BLOCKED',reason:'Cannot read selected Take alignment status. No paid request can start.'};
  if(alignment.preferredTakeId!==scene.inputs.preferredTakeId
    ||alignment.revision!==scene.inputs.scriptRevision)
    return {action:'BLOCKED',reason:'Selected Take or narration revision changed; reload the scene.'};
  if(alignment.alignmentPresent)
    return {action:'BLOCKED',reason:'The selected Take already has saved alignment, but its five spoken anchors cannot be verified. No new paid alignment is permitted.'};
  if(!alignment.canAlign)
    return {action:'BLOCKED',reason:alignment.reason||
      'Forced alignment cannot start; inspect the paid request status before any retry.'};
  return {action:'ALIGN_AND_RENDER',
    reason:'One Director-confirmed paid ElevenLabs Forced Alignment on the saved MP3 is required before a separate paid Railway Full HD render. No new TTS voice will be generated.'};
}
