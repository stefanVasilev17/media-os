import {
  EP004_SHOT03_PREDECESSOR,
  EP004_SHOT03_BREATH_FRAMES,
  ep004Shot03StoryboardWorld
} from './EP004Shot03LivingWorld.mjs';
import {validateEp004Shot02Render,ep004Shot02ProductionWorld}
  from './EP004Shot02ProductionWorld.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const v=clamp(x);return v*v*(3-2*v);};
export const EP004_SHOT03_COMPOSITION='EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL';
export const EP004_SHOT03_TAIL_FRAMES=45;
export const EP004_SHOT03_SOURCE_TAIL_FRAMES=190;
const SOURCE=EP004_SHOT03_PREDECESSOR;

function checkCues(props){
  if(!Array.isArray(props.verifiedCues)||!Array.isArray(props.visualBeats)
    ||props.verifiedCues.length<2||props.verifiedCues.length>40
    ||props.verifiedCues.length!==props.visualBeats.length)
    throw Error('SHOT03_REQUIRES_REAL_APPROVED_CUE_COUNT');
  let previous=EP004_SHOT03_BREATH_FRAMES-1;
  for(let i=0;i<props.verifiedCues.length;i++){
    const cue=props.verifiedCues[i],beat=props.visualBeats[i];
    if(!cue||!beat||typeof cue.beatId!=='string'
      ||!/^SHOT03_[A-Z0-9_]{3,45}$/.test(cue.beatId)
      ||cue.beatId!==beat.beatId
      ||typeof cue.anchor!=='string'||cue.anchor.length<6
      ||cue.anchor!==beat.cueAnchor
      ||typeof beat.direction!=='string'||beat.direction.length<3
      ||!Number.isInteger(cue.startFrame)||!Number.isInteger(cue.endFrame)
      ||cue.startFrame<=previous||cue.endFrame<cue.startFrame
      ||cue.endFrame>props.durationInFrames-EP004_SHOT03_TAIL_FRAMES+8)
      throw Error('SHOT03_REAL_VOICE_CUE_ORIGINAL_STORY_MISMATCH_'+i);
    previous=cue.startFrame;
  }
  return true;
}
export function extendedEp004Shot02SourceProps(props){
  const previous=props?.previousShot02Props;
  if(!previous||typeof previous!=='object'
    ||Array.isArray(previous)
    ||previous.episodeKey!=='EP004'||previous.shotKey!=='SHOT02'
    ||previous.previewOnly!==false||previous.directorCpuApproved!==true
    ||previous.sourceSha256!==SOURCE.sourceSha256
    ||previous.expectedSourceCommit!==SOURCE.sourceCommit
    ||previous.durationInFrames!==SOURCE.frameCount
    ||previous.worldStartFrame!==2000)
    throw Error('SHOT03_PREVIOUS_SHOT02_AUTHENTIC_INPUT_PROPS_MISSING');
  validateEp004Shot02Render(previous);
  return {...previous,durationInFrames:SOURCE.frameCount+EP004_SHOT03_SOURCE_TAIL_FRAMES+1};
}
export function validateEp004Shot03Production(props){
  if(!props||props.episodeKey!=='EP004'||props.shotKey!=='SHOT03'
    ||props.previewOnly!==false||props.directorCpuApproved!==true
    ||props.sourceSha256!==SOURCE.sourceSha256
    ||props.previousRenderId!==SOURCE.renderId
    ||props.previousSourceCommit!==SOURCE.sourceCommit
    ||props.previousFrameCount!==SOURCE.frameCount
    ||props.previousLastEncodedFrame!==SOURCE.lastEncodedFrame
    ||props.worldStartFrame!==SOURCE.worldStartFrame
    ||typeof props.previousVideoSha256!=='string'
    ||!/^[a-f0-9]{64}$/.test(props.previousVideoSha256)
    ||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<600||props.durationInFrames>9000
    ||!Number.isInteger(props.novemberFrame)||!Number.isInteger(props.backwardFrame)
    ||props.novemberFrame<EP004_SHOT03_BREATH_FRAMES+90
    ||props.backwardFrame<=props.novemberFrame+90
    ||props.backwardFrame>=props.durationInFrames-EP004_SHOT03_TAIL_FRAMES-20
    ||!Number.isInteger(props.scriptRevision)||props.scriptRevision<1
    ||typeof props.voiceTakeId!=='string'||!/^[a-f0-9-]{36}$/.test(props.voiceTakeId)
    ||typeof props.narrationSha256!=='string'||!/^[a-f0-9]{64}$/.test(props.narrationSha256)
    ||typeof props.expectedSourceCommit!=='string'||!/^[a-f0-9]{40}$/.test(props.expectedSourceCommit)
    ||typeof props.shotTitle!=='string'||props.shotTitle.length<8)
    throw Error('SHOT03_REAL_VOICE_EXACT_SOURCE_SEAM_AND_60F_GUARD_REQUIRED');
  if(props.previousLastFrameDataUri!=null
      &&(typeof props.previousLastFrameDataUri!=='string'
        ||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(props.previousLastFrameDataUri)
        ||props.previousLastFrameDataUri.length>12000000))
    throw Error('SHOT03_FRAME_ZERO_SNAPSHOT_MUST_BE_AUTHENTIC_VERIFIED_PNG');
  extendedEp004Shot02SourceProps(props);
  checkCues(props);
  return true;
}
function remap(frame,props){
  if(frame<=EP004_SHOT03_BREATH_FRAMES)return frame;
  if(frame<props.novemberFrame)
    return EP004_SHOT03_BREATH_FRAMES+(frame-EP004_SHOT03_BREATH_FRAMES)*
      225/(props.novemberFrame-EP004_SHOT03_BREATH_FRAMES);
  if(frame<props.backwardFrame)
    return 285+(frame-props.novemberFrame)*135/
      (props.backwardFrame-props.novemberFrame);
  return 420+(frame-props.backwardFrame)*119/
    (props.durationInFrames-EP004_SHOT03_TAIL_FRAMES-props.backwardFrame);
}
export function ep004Shot03ProductionWorld(frame,props){
  validateEp004Shot03Production(props);
  if(!Number.isInteger(frame)||frame<0||frame>=props.durationInFrames)
    throw Error('SHOT03_FRAME_OUTSIDE_MEASURED_REAL_VOICE');
  const extended=extendedEp004Shot02SourceProps(props);
  const tail=Math.min(frame,EP004_SHOT03_SOURCE_TAIL_FRAMES-1);
  const previous=ep004Shot02ProductionWorld(SOURCE.lastEncodedFrame+tail,extended);
  const storyboardProps={
    episodeKey:'EP004',shotKey:'SHOT03',previewOnly:true,
    sourceSha256:SOURCE.sourceSha256,
    previousRenderId:SOURCE.renderId,
    previousSourceCommit:SOURCE.sourceCommit,
    previousFrameCount:SOURCE.frameCount,
    previousLastEncodedFrame:SOURCE.lastEncodedFrame,
    worldStartFrame:SOURCE.worldStartFrame,
    durationInFrames:540,
  };
  const editorialFrame=Math.max(0,Math.min(539,Math.floor(remap(frame,props))));
  const storyboard=ep004Shot03StoryboardWorld(editorialFrame,storyboardProps,
    SOURCE.worldStartFrame+frame);
  const fade=ease((frame-EP004_SHOT03_BREATH_FRAMES)/120);
  const storyAlpha=fade,sourceAlpha=1-fade;
  return Object.freeze({
    worldFrame:SOURCE.worldStartFrame+frame,
    sourceFrame:SOURCE.lastEncodedFrame+tail,
    originalSourceWorldFrame:previous.worldFrame,
    sourceAlpha,storyAlpha,
    editorialFrame,sourceSnapshotIsStatic:false,
    silenceFrames:EP004_SHOT03_BREATH_FRAMES,
    realVoiceStartFrame:EP004_SHOT03_BREATH_FRAMES,
    cameraX:storyboard.cameraX,cameraScale:storyboard.cameraScale,
    storyboard,previous,
  });
}
