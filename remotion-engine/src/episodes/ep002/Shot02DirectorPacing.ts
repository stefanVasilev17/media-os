export type Shot02Interval = {startFrame:number;endFrame:number};
export type Shot02FocusKey = 'gateway'|'balancer'|'auth'|'database';
export type Shot02FocusWeights = Record<Shot02FocusKey,number>;
export type Shot02CameraPose = {x:number;y:number;scale:number};

const clamp01=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{
  const t=clamp01(n);
  return t*t*(3-2*t);
};

export function shot02TapPulse(frame:number,start:number,end:number):number {
  if(!Number.isFinite(frame)||!Number.isFinite(start)||!Number.isFinite(end)
    ||end-start<12||frame<start||frame>=end-10)return 0;
  const sequence=Math.min(170,end-start-10);
  const taps=Math.max(3,Math.min(5,Math.floor(sequence/25)));
  const phase=(frame-start)*taps/sequence;
  if(phase>=taps)return 0;
  const within=phase-Math.floor(phase);
  if(within>=.58)return 0;
  return Math.sin(Math.PI*within/.58)**2;
}

export const SHOT02_MIN_NODE_READING_FRAMES=120;
export const SHOT02_MIN_CAMERA_FOCUS_WINDOW_FRAMES=90;

export function shot02TermHold(frame:number,cue:Shot02Interval,
  nextStart:number,finalFrame:number):number {
  if(!Number.isFinite(frame)||cue.endFrame<=cue.startFrame)return 0;
  const release=Math.min(finalFrame,nextStart-4,
    Math.max(cue.endFrame+45,cue.startFrame+SHOT02_MIN_CAMERA_FOCUS_WINDOW_FRAMES));
  if(release-cue.startFrame<SHOT02_MIN_CAMERA_FOCUS_WINDOW_FRAMES
      ||frame<cue.startFrame||frame>=release)return 0;
  const onset=smooth((frame-cue.startFrame)/20);
  const fadeStart=Math.max(cue.startFrame+20,release-22);
  return clamp01(onset*(1-smooth((frame-fadeStart)/Math.max(1,release-fadeStart))));
}

export function shot02ReadableInterior(frame:number,cue:Shot02Interval,
  finalFrame:number):number {
  if(!Number.isFinite(frame)||cue.endFrame<=cue.startFrame
      ||frame<cue.startFrame)return 0;
  const release=Math.min(finalFrame,
    Math.max(cue.startFrame+SHOT02_MIN_NODE_READING_FRAMES,
      cue.endFrame+42));
  if(frame>=release)return 0;
  const appear=smooth((frame-cue.startFrame)/18);
  const fadeStart=Math.max(cue.startFrame+18,release-23);
  return clamp01(appear*(1-smooth((frame-fadeStart)/Math.max(1,release-fadeStart))));
}

export function shot02AvailableReadingFrames(cue:Shot02Interval,finalFrame:number):number {
  return Math.max(0,Math.min(finalFrame,
    Math.max(cue.startFrame+SHOT02_MIN_NODE_READING_FRAMES,cue.endFrame+42))
    -cue.startFrame);
}

export function shot02FlowIntensity(frame:number,start:number,
  end:number):number {
  if(frame<start)return 0;
  const rise=smooth((frame-start)/Math.max(75,Math.min(90,end-start)));
  return clamp01(rise);
}

export function shot02FlowClock(frame:number,start:number):number {
  const elapsed=Math.max(0,frame-start);
  const integrated=elapsed-22*(1-Math.exp(-elapsed/22));
  return frame*.012+integrated*.035;
}

export function shot02FocusCamera(
  base:Shot02CameraPose,focus:Shot02FocusWeights,
):Shot02CameraPose {
  const gateway=clamp01(focus.gateway);
  const balancer=clamp01(focus.balancer);
  const auth=clamp01(focus.auth);
  const database=clamp01(focus.database);
  const total=Math.min(1,gateway+balancer+auth+database);
  const zoom=total*Math.min(.115,Math.max(0,1.24-base.scale));
  return {
    x:base.x-18*gateway-32*balancer-62*auth-100*database,
    y:base.y+12*gateway+13*balancer+23*auth+30*database,
    scale:base.scale+zoom,
  };
}
