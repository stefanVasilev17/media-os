import {
  EP004_SHOT01_LOCKED_SOURCE_SHA256,
  EP004_STANDBY_ROUTE,
  ep004Shot01Exit,
  ep004RequestTraffic,
  ep004FailureSignals,
  ep004BezierPosition
} from './EP004Shot01World.mjs';

export const EP004_SHOT01_V8_LOCKED_RENDER_ID='e8f3818e-aac0-40f2-8e1a-d70e9fa108e0';
export const EP004_SHOT01_V8_SOURCE_COMMIT='590448542604e8308750664354bbd8dea55a53e5';
export const EP004_SHOT01_V8_TOTAL_FRAMES=2001;
export const EP004_SHOT01_V8_LAST_FRAME=2000;
export const EP004_SHOT02_SILENT_PRELUDE_FRAMES=60;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};

export function ep004Shot02Validate(props){
  if(!props||props.previousRenderId!==EP004_SHOT01_V8_LOCKED_RENDER_ID
      ||props.previousSourceCommit!==EP004_SHOT01_V8_SOURCE_COMMIT
      ||props.previousSourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256
      ||props.worldStartFrame!==EP004_SHOT01_V8_LAST_FRAME
      ||!Number.isInteger(props.durationInFrames)
      ||props.durationInFrames<120||props.durationInFrames>9000
      ||typeof props.previewOnly!=='boolean')
    throw Error('EP004_SHOT02_REQUIRES_EXACT_LOCKED_V8_FRAME_2000');
  if(!props.previewOnly)
    throw Error('EP004_SHOT02_SCRIPT_VOICE_AND_REAL_CUES_NOT_YET_VERIFIED');
  return true;
}

export function ep004Shot02World(frame,props){
  ep004Shot02Validate(props);
  if(!Number.isInteger(frame)||frame<0||frame>=props.durationInFrames)
    throw Error('EP004_SHOT02_FRAME_OUTSIDE_PREVIEW');
  const exit=ep004Shot01Exit({
    sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
    durationInFrames:EP004_SHOT01_V8_TOTAL_FRAMES,
    worldStartFrame:0,
    previewOnly:true
  });
  const worldFrame=exit.worldFrame+frame;
  const cameraShift=ease((frame-EP004_SHOT02_SILENT_PRELUDE_FRAMES)/190);
  const packetCycle=(worldFrame*.0022)%1;
  const secondaryOpacity=exit.failover*clamp(Math.min(packetCycle,1-packetCycle)*13);
  const state={
    ...exit,
    worldFrame,
    cameraX:exit.cameraX-22*cameraShift,
    cameraScale:exit.cameraScale+.012*cameraShift,
    timeSinceFailover:exit.timeSinceFailover+frame,
    timeSinceSpillover:exit.timeSinceSpillover+frame,
    secondary:ep004BezierPosition(EP004_STANDBY_ROUTE,.03+.94*packetCycle),
    secondaryOpacity,
    secondaryVisible:secondaryOpacity>.01
  };
  return Object.freeze({
    ...state,
    traffic:ep004RequestTraffic(state),
    diagnostics:ep004FailureSignals(state)
  });
}
