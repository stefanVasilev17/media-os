import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {EP004_SHOT03_PREDECESSOR,ep004Shot03StoryboardWorld}
  from './EP004Shot03LivingWorld.mjs';

export const EP004_SHOT04_COMPOSITION='EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL';
export const EP004_SHOT04_BREATH_FRAMES=72;
export const EP004_SHOT04_TAIL_FRAMES=45;
export const EP004_SHOT04_PREVIOUS_WORLD_START=4123;
export const EP004_SHOT04_REVEAL_START=30;
export const EP004_SHOT04_REVEAL_END=156;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const locations=Object.freeze([
  Object.freeze({x:1315,y:377,key:'primary'}),
  Object.freeze({x:1315,y:696,key:'alternative'}),
  Object.freeze({x:1725,y:371,key:'mailbox'}),
  Object.freeze({x:1725,y:698,key:'teams'})
]);
export function validateEp004Shot04Production(props){
  if(!props||props.episodeKey!=='EP004'||props.shotKey!=='SHOT04'
    ||props.previewOnly!==false||props.directorCpuApproved!==true
    ||props.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256
    ||!UUID.test(props.previousRenderId)||!COMMIT.test(props.previousSourceCommit)
    ||!Number.isInteger(props.previousFrameCount)
    ||props.previousFrameCount<600||props.previousFrameCount>9000
    ||props.previousLastEncodedFrame!==props.previousFrameCount-1
    ||props.worldStartFrame!==EP004_SHOT04_PREVIOUS_WORLD_START+props.previousLastEncodedFrame
    ||!SHA.test(props.previousVideoSha256)
    ||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<600||props.durationInFrames>9000
    ||props.breathFrames!==EP004_SHOT04_BREATH_FRAMES
    ||!Number.isInteger(props.scriptRevision)||props.scriptRevision<1
    ||!UUID.test(props.voiceTakeId)||!SHA.test(props.narrationSha256)
    ||!COMMIT.test(props.expectedSourceCommit)
    ||typeof props.shotTitle!=='string'||props.shotTitle.length<8
    ||props.shotTitle.length>240)
      throw Error('EP004_SHOT04_APPROVED_TAKE_LOCKED_SHOT03_CONTINUITY_REQUIRED');
  if(props.previousLastFrameDataUri!=null
    &&(typeof props.previousLastFrameDataUri!=='string'
      ||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(props.previousLastFrameDataUri)
      ||props.previousLastFrameDataUri.length>12000000))
    throw Error('EP004_SHOT04_AUTHENTIC_PREVIOUS_LAST_FRAME_PNG_REQUIRED');
  if(!Array.isArray(props.verifiedCues)||!Array.isArray(props.visualBeats)
    ||props.verifiedCues.length<2||props.verifiedCues.length>40
    ||props.verifiedCues.length!==props.visualBeats.length)
    throw Error('EP004_SHOT04_REAL_APPROVED_VOICE_CUES_REQUIRED');
  let prev=EP004_SHOT04_BREATH_FRAMES-1;
  for(let i=0;i<props.verifiedCues.length;i++){
    const cue=props.verifiedCues[i],beat=props.visualBeats[i];
    if(!cue||!beat||!/^SHOT04_[A-Z0-9_]{3,45}$/.test(cue.beatId)
      ||cue.beatId!==beat.beatId||cue.anchor!==beat.cueAnchor
      ||typeof cue.anchor!=='string'||cue.anchor.length<6
      ||typeof beat.direction!=='string'||beat.direction.length<3
      ||!Number.isInteger(cue.startFrame)||!Number.isInteger(cue.endFrame)
      ||cue.startFrame<=prev||cue.endFrame<cue.startFrame
      ||cue.endFrame>props.durationInFrames-EP004_SHOT04_TAIL_FRAMES+8)
      throw Error('EP004_SHOT04_ORIGINAL_STORY_AND_AUDIO_CUE_MISMATCH_'+i);
    prev=cue.startFrame;
  }
  return true;
}
function focusFromStory(direction,index){
  const lower=direction.toLowerCase();
  if(/teams|collaboration/.test(lower))return locations[3];
  if(/mailbox|exchange|outlook|email/.test(lower))return locations[2];
  if(/alternative|secondary|backup|fallback/.test(lower))return locations[1];
  if(/primary|gateway|route|traffic/.test(lower))return locations[0];
  return locations[index%locations.length];
}
export function ep004Shot04ProductionWorld(frame,props){
  validateEp004Shot04Production(props);
  if(!Number.isInteger(frame)||frame<0||frame>=props.durationInFrames)
    throw Error('EP004_SHOT04_FRAME_OUTSIDE_APPROVED_VOICE');
  const worldFrame=props.worldStartFrame+frame;
  const sourceProps={
    episodeKey:'EP004',shotKey:'SHOT03',previewOnly:true,
    sourceSha256:EP004_SHOT03_PREDECESSOR.sourceSha256,
    previousRenderId:EP004_SHOT03_PREDECESSOR.renderId,
    previousSourceCommit:EP004_SHOT03_PREDECESSOR.sourceCommit,
    previousFrameCount:EP004_SHOT03_PREDECESSOR.frameCount,
    previousLastEncodedFrame:EP004_SHOT03_PREDECESSOR.lastEncodedFrame,
    worldStartFrame:EP004_SHOT03_PREDECESSOR.worldStartFrame,
    durationInFrames:540,
  };
  const storyboard=ep004Shot03StoryboardWorld(539,sourceProps,worldFrame);
  const reveal=ease((frame-EP004_SHOT04_REVEAL_START)/
    (EP004_SHOT04_REVEAL_END-EP004_SHOT04_REVEAL_START));
  const spoken=frame>=EP004_SHOT04_BREATH_FRAMES;
  let beatIndex=-1;
  for(let i=0;i<props.verifiedCues.length;i++)
    if(frame>=props.verifiedCues[i].startFrame)beatIndex=i;
  const beat=beatIndex<0?null:props.visualBeats[beatIndex];
  const target=beat?focusFromStory(beat.direction,beatIndex):locations[0];
  const cueStart=beatIndex<0?EP004_SHOT04_BREATH_FRAMES:
    props.verifiedCues[beatIndex].startFrame;
  const focusAlpha=beat?reveal*ease((frame-cueStart)/24):0;
  const pulse=(.5+.5*Math.sin(worldFrame*.08)**2);
  return Object.freeze({
    frame,worldFrame,originalSourceWorldFrame:props.worldStartFrame,
    breathFrames:EP004_SHOT04_BREATH_FRAMES,
    voiceStartFrame:EP004_SHOT04_BREATH_FRAMES,
    spoken,sourceSnapshotIsStatic:false,
    storyboard,
    reveal,sourceHeadingOpacity:1-ease((frame-30)/105),
    titleOpacity:ease((frame-108)/48),
    cameraScale:1+0.045*reveal,
    beatIndex,focusAlpha,focusX:target.x,focusY:target.y,
    focusPulse:pulse
  });
}
