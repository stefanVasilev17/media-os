import {
  EP004_SHOT01_LOCKED_SOURCE_SHA256,
  EP004_STANDBY_ROUTE,
  ep004Shot01Exit,
  ep004RequestTraffic,
  ep004FailureSignals,
  ep004BezierPosition
} from './EP004Shot01World.mjs';
import {
  EP004_SHOT01_V8_LOCKED_RENDER_ID,
  EP004_SHOT01_V8_SOURCE_COMMIT,
  EP004_SHOT01_V8_LAST_FRAME,
  EP004_SHOT01_V8_TOTAL_FRAMES
} from './EP004Shot02ContinuityWorld.mjs';

const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const y=clamp(x);return y*y*(3-2*y);};
export const EP004_SHOT02_COMPOSITION='EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL';
export const EP004_SHOT02_BREATH_FRAMES=60;
export const EP004_SHOT02_TAIL_FRAMES=45;

export function validateEp004Shot02Render(props){
  if(!props||props.episodeKey!=='EP004'||props.shotKey!=='SHOT02'
    ||props.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256
    ||props.previousRenderId!==EP004_SHOT01_V8_LOCKED_RENDER_ID
    ||props.previousSourceCommit!==EP004_SHOT01_V8_SOURCE_COMMIT
    ||props.worldStartFrame!==EP004_SHOT01_V8_LAST_FRAME
    ||props.previewOnly!==false
    ||props.directorCpuApproved!==true
    ||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<600||props.durationInFrames>9000
    ||!Number.isInteger(props.failoverTermStartFrame)
    ||props.failoverTermStartFrame<EP004_SHOT02_BREATH_FRAMES
    ||props.failoverTermStartFrame+240>props.durationInFrames-EP004_SHOT02_TAIL_FRAMES
    ||!Number.isInteger(props.scriptRevision)||props.scriptRevision<1
    ||typeof props.voiceTakeId!=='string'
    ||!/^[a-f0-9-]{36}$/.test(props.voiceTakeId)
    ||typeof props.narrationSha256!=='string'
    ||!/^[a-f0-9]{64}$/.test(props.narrationSha256)
    ||typeof props.expectedSourceCommit!=='string'
    ||!/^[a-f0-9]{40}$/.test(props.expectedSourceCommit)
    ||!Array.isArray(props.verifiedCues)
    ||!Array.isArray(props.visualBeats)
    ||props.verifiedCues.length<2||props.verifiedCues.length>40
    ||props.visualBeats.length!==props.verifiedCues.length)
    throw Error('EP004_SHOT02_AUTHENTIC_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  let previousFrame=EP004_SHOT02_BREATH_FRAMES-1,previousEnd=-1;
  const ids=new Set();
  for(let i=0;i<props.verifiedCues.length;i++){
    const cue=props.verifiedCues[i],beat=props.visualBeats[i];
    if(!cue||!beat||typeof cue.beatId!=='string'
      ||!/^SHOT02_[A-Z0-9_]{3,45}$/.test(cue.beatId)
      ||ids.has(cue.beatId)
      ||cue.beatId!==beat.beatId
      ||typeof cue.anchor!=='string'||cue.anchor.length<6
      ||cue.anchor!==beat.cueAnchor
      ||!Number.isInteger(cue.startFrame)||!Number.isInteger(cue.endFrame)
      ||cue.startFrame<=previousFrame||cue.endFrame<cue.startFrame
      ||cue.endFrame>=props.durationInFrames-EP004_SHOT02_TAIL_FRAMES+8
      ||typeof beat.direction!=='string'||beat.direction.length<3
      ||beat.direction.length>1500)
      throw Error('EP004_SHOT02_REAL_VERIFIED_CUE_AND_STORY_ORDER_MISMATCH_'+i);
    ids.add(cue.beatId);
    previousFrame=cue.startFrame;
    previousEnd=cue.endFrame;
  }
  if(previousEnd<EP004_SHOT02_BREATH_FRAMES)
    throw Error('EP004_SHOT02_CUES_NOT_IN_AUDIO_TIMELINE');
  return true;
}

export function ep004Shot02ProductionWorld(frame,props){
  validateEp004Shot02Render(props);
  if(!Number.isInteger(frame)||frame<0||frame>=props.durationInFrames)
    throw Error('EP004_SHOT02_FRAME_OUTSIDE_APPROVED_RENDER');
  const exit=ep004Shot01Exit({
    sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
    durationInFrames:EP004_SHOT01_V8_TOTAL_FRAMES,
    worldStartFrame:0,
    previewOnly:true
  });
  const index=props.verifiedCues.reduce((acc,cue,i)=>
    frame>=cue.startFrame?i:acc,-1);
  const firstFrame=index>=0?props.verifiedCues[index].startFrame:
    EP004_SHOT02_BREATH_FRAMES;
  const beatProgress=ease((frame-firstFrame)/55);
  const stage=index<0?0:(index+beatProgress)/props.verifiedCues.length;
  const focus=ease((frame-EP004_SHOT02_BREATH_FRAMES)/150);
  const worldFrame=exit.worldFrame+frame;
  const packetCycle=(worldFrame*.0022)%1;
  const secondaryOpacity=exit.failover*clamp(Math.min(packetCycle,1-packetCycle)*13);
  const state={
    ...exit,worldFrame,
    cameraX:exit.cameraX-30*focus-12*stage,
    cameraScale:exit.cameraScale+.018*focus,
    timeSinceFailover:exit.timeSinceFailover+frame,
    timeSinceSpillover:exit.timeSinceSpillover+frame,
    secondary:ep004BezierPosition(EP004_STANDBY_ROUTE,.03+.94*packetCycle),
    secondaryOpacity,
    secondaryVisible:secondaryOpacity>.01,
    tension:exit.tension+.09*stage+.04*focus*Math.sin(worldFrame*.038)**2
  };
  return Object.freeze({
    ...state,
    cueIndex:index,
    cueProgress:beatProgress,
    visualStage:stage,
    headerProgress:ease((frame-EP004_SHOT02_BREATH_FRAMES)/25),
    traffic:ep004RequestTraffic(state),
    diagnostics:ep004FailureSignals(state)
  });
}
