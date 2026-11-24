import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot05Production} from './EP004Shot05ProductionWorld.mjs';
import {validateShot06PreviewTimeline,shot06PreviewState} from './EP004Shot06FleetPreview.mjs';

export const EP004_SHOT06_COMPOSITION='EP004-SHOT06-SERVER-FLEET-V1-VISUAL';
export const EP004_SHOT06_PREDECESSOR=Object.freeze({renderId:'38162e2a-3bc2-4c07-80d8-fa445cdc5e8d',sourceCommit:'1766ff8391b81c928acae0578cfebcae73d7a1b1',frames:2573});
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
export function validateEp004Shot06Production(p,requireFrame=false){
  const lock=EP004_SHOT06_PREDECESSOR;
  if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT06'||p.previewOnly!==false||p.directorCpuApproved!==true
    ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
    ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1
    ||!Number.isInteger(p.previousWorldStartFrame)||p.previousWorldStartFrame<600
    ||p.worldStartFrame!==p.previousWorldStartFrame+p.previousLastEncodedFrame||!SHA.test(p.previousVideoSha256)
    ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1
    ||!UUID.test(p.voiceTakeId)||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)
    ||!Number.isInteger(p.voiceAudioBytes)||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824
    ||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId))
    throw Error('SHOT06_EXACT_LOCKED_SHOT05_AND_APPROVED_TAKE_REQUIRED');
  const prev=p.previousShot05Props;
  if(!prev||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
    throw Error('SHOT06_PREDECESSOR_PROPS_REQUIRED');
  validateEp004Shot05Production(prev);
  validateShot06PreviewTimeline(p.verifiedCues,p.durationInFrames);
  if(!Array.isArray(p.visualBeats)||p.visualBeats.length!==p.verifiedCues.length)throw Error('SHOT06_ORIGINAL_BEATS_REQUIRED');
  for(let i=0;i<p.verifiedCues.length;i++){
    const c=p.verifiedCues[i],b=p.visualBeats[i];
    if(!b||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||c.endFrame>p.durationInFrames-45+8)
      throw Error('SHOT06_ORIGINAL_CUE_MISMATCH_'+i);
  }
  if((requireFrame||p.previousLastFrameDataUri!=null)&&
    (typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
    throw Error('SHOT06_DECODED_LOCKED_FRAME_REQUIRED');
  return true;
}
export function verifyEp004Shot06ActualMotion(p){
  validateEp004Shot06Production(p);
  const s=f=>shot06PreviewState(f,p.verifiedCues,p.durationInFrames);
  const failure=p.verifiedCues[5].startFrame;
  if(s(failure-1).failed||!s(failure).failed||s(failure).local.some(x=>x.phase==='OUT'))throw Error('SHOT06_FAILURE_CUE_CAUSALITY');
  const final=s(p.durationInFrames-1);
  if(final.interior!==0||final.close!==0||!final.failed||!final.comparison||final.serverStates[0].status!=='Unresponsive'||final.serverStates.slice(1).some(x=>x.status!=='Higher load'))throw Error('SHOT06_FINAL_HANDOFF_INVALID');
  return {status:'PASS',failureFrame:failure,comparisonFrame:p.verifiedCues[6].startFrame,finalFrame:final.frame,offeredInterval:final.offeredInterval};
}
