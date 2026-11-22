import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {EP004_SHOT03_PREDECESSOR} from './EP004Shot03LivingWorld.mjs';
import {validateEp004Shot04Production} from './EP004Shot04ProductionWorld.mjs';
import {ep004Shot05CinematicState,validateEp004Shot05XrayRoutes}
  from './EP004Shot05CinematicWorld.mjs';

export const EP004_SHOT05_COMPOSITION='EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL';
export const EP004_SHOT05_BREATH_FRAMES=72;
export const EP004_SHOT05_TAIL_FRAMES=45;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;

export function ep004Shot05StoryRoute(direction,index=0){
  const text=String(direction||'').toLowerCase();
  if(/both|shared|converge|bottleneck|pressure|same gateway|one gateway|overload/.test(text))
    return Object.freeze({key:'SHARED',focus:'primary',routes:['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS']});
  if(/failure|fails|outage|disrupt|lost|broken|down|degrad|error|unavailable/.test(text))
    return Object.freeze({key:'DEGRADED',focus:'primary',routes:['TEAMS_FAILOVER','PRIMARY_TEAMS']});
  if(/redirect|rerout|spill|shift|switch|fallback|failover|configuration|july/.test(text))
    return Object.freeze({key:'REROUTE',focus:'primary',routes:['TEAMS_FAILOVER','PRIMARY_TEAMS']});
  if(/mailbox|exchange|outlook|email|mail/.test(text))
    return Object.freeze({key:'MAIL',focus:'mailbox',routes:['OUTLOOK_PRIMARY','PRIMARY_MAILBOX']});
  if(/alternative|backup|secondary|independent/.test(text))
    return Object.freeze({key:'ALTERNATIVE',focus:'alternative',routes:['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS']});
  if(/teams|collaboration/.test(text))
    return Object.freeze({key:'TEAMS',focus:'teams',routes:['TEAMS_FAILOVER','PRIMARY_TEAMS']});
  if(/primary|gateway|traffic|request/.test(text))
    return Object.freeze({key:'PRIMARY',focus:'primary',routes:['OUTLOOK_PRIMARY','PRIMARY_MAILBOX']});
  return Object.freeze({key:'EXISTING',focus:index%2===0?'primary':'alternative',
    routes:index%2===0?['OUTLOOK_PRIMARY','PRIMARY_MAILBOX']:['TEAMS_FAILOVER','PRIMARY_TEAMS']});
}

export function validateEp004Shot05Production(props){
  if(!props||props.episodeKey!=='EP004'||props.shotKey!=='SHOT05'
    ||props.previewOnly!==false||props.directorCpuApproved!==true
    ||props.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256
    ||!UUID.test(props.previousRenderId)||!COMMIT.test(props.previousSourceCommit)
    ||!Number.isInteger(props.previousFrameCount)||props.previousFrameCount<600
    ||props.previousFrameCount>9000
    ||props.previousLastEncodedFrame!==props.previousFrameCount-1
    ||!Number.isInteger(props.previousWorldStartFrame)
    ||props.previousWorldStartFrame<EP004_SHOT03_PREDECESSOR.worldStartFrame+600
    ||props.worldStartFrame!==props.previousWorldStartFrame+props.previousLastEncodedFrame
    ||!SHA.test(props.previousVideoSha256)
    ||!Number.isInteger(props.durationInFrames)||props.durationInFrames<600
    ||props.durationInFrames>9000
    ||props.breathFrames!==EP004_SHOT05_BREATH_FRAMES
    ||!Number.isInteger(props.scriptRevision)||props.scriptRevision<1
    ||!UUID.test(props.voiceTakeId)||!SHA.test(props.narrationSha256)
    ||!COMMIT.test(props.expectedSourceCommit)
    ||typeof props.shotTitle!=='string'||props.shotTitle.length<8
    ||props.shotTitle.length>240)
    throw Error('EP004_SHOT05_LOCKED_SHOT04_APPROVED_TAKE_REQUIRED');
  if(props.previousLastFrameDataUri!=null
    &&(typeof props.previousLastFrameDataUri!=='string'
      ||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(props.previousLastFrameDataUri)
      ||props.previousLastFrameDataUri.length>12000000))
    throw Error('EP004_SHOT05_AUTHENTIC_PREVIOUS_FRAME_PNG_REQUIRED');
  const prev=props.previousShot04Props;
  if(!prev||prev.episodeKey!=='EP004'||prev.shotKey!=='SHOT04'
     ||prev.expectedSourceCommit!==props.previousSourceCommit
     ||prev.worldStartFrame!==props.previousWorldStartFrame
     ||prev.durationInFrames!==props.previousFrameCount
     ||prev.sourceSha256!==props.sourceSha256)
    throw Error('EP004_SHOT05_PREVIOUS_ORIGINAL_RENDER_PROPS_REQUIRED');
  validateEp004Shot04Production(prev);
  if(!Array.isArray(props.verifiedCues)||!Array.isArray(props.visualBeats)
     ||props.verifiedCues.length<2||props.verifiedCues.length>40
     ||props.verifiedCues.length!==props.visualBeats.length)
    throw Error('EP004_SHOT05_REAL_APPROVED_VOICE_CUES_REQUIRED');
  let previous=EP004_SHOT05_BREATH_FRAMES-1;
  for(let i=0;i<props.verifiedCues.length;i++){
    const cue=props.verifiedCues[i],beat=props.visualBeats[i];
    if(!cue||!beat||!/^SHOT05_[A-Z0-9_]{3,45}$/.test(cue.beatId)
       ||cue.beatId!==beat.beatId||cue.anchor!==beat.cueAnchor
       ||typeof cue.anchor!=='string'||cue.anchor.length<6
       ||typeof beat.direction!=='string'||beat.direction.length<3
       ||!Number.isInteger(cue.startFrame)||!Number.isInteger(cue.endFrame)
       ||cue.startFrame<=previous||cue.endFrame<cue.startFrame
       ||cue.endFrame>props.durationInFrames-EP004_SHOT05_TAIL_FRAMES+8)
      throw Error('EP004_SHOT05_ORIGINAL_STORY_CUE_MISMATCH_'+i);
    previous=cue.startFrame;
  }
  return true;
}

export function ep004Shot05ProductionWorld(frame,props){
  validateEp004Shot05Production(props);
  validateEp004Shot05XrayRoutes();
  if(!Number.isInteger(frame)||frame<0||frame>=props.durationInFrames)
    throw Error('EP004_SHOT05_FRAME_OUTSIDE_APPROVED_VOICE');
  const cinematic=ep004Shot05CinematicState(
    frame,props.verifiedCues,props.visualBeats,props.durationInFrames);
  const beatIndex=cinematic.beatIndex;
  const cue=beatIndex>=0?props.verifiedCues[beatIndex]:null;
  const route=beatIndex>=0
    ?ep004Shot05StoryRoute(props.visualBeats[beatIndex].direction,beatIndex):null;
  const worldFrame=props.worldStartFrame+frame;
  return Object.freeze({
    frame,worldFrame,spoken:frame>=EP004_SHOT05_BREATH_FRAMES,
    sourceWorldFrame:props.previousWorldStartFrame+props.previousLastEncodedFrame,
    beatIndex,route,cinematic,
    cameraScale:cinematic.camera.scale,panX:cinematic.camera.x,
    routeOpacity:cinematic.routeProgress,
    oldOpacity:cinematic.sourceOpacity,
    sceneIn:cinematic.interiorOpacity,
    appear:cinematic.stageAppear,
    cueAge:cue?frame-cue.startFrame:0,
    titleOpacity:cinematic.captionOpacity,
    sourceHeadingOpacity:0
  });
}
