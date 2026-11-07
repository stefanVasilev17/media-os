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
  const taps=Math.max(4,Math.min(9,Math.floor(sequence/12)));
  const phase=(frame-start)*taps/sequence;
  if(phase>=taps)return 0;
  const within=phase-Math.floor(phase);
  if(within>=.58)return 0;
  return Math.sin(Math.PI*within/.58)**2;
}

export function shot02TermHold(frame:number,cue:Shot02Interval,
  nextStart:number,finalFrame:number):number {
  if(!Number.isFinite(frame)||cue.endFrame<=cue.startFrame)return 0;
  const release=Math.min(finalFrame,
    nextStart-2,Math.max(cue.endFrame+21,cue.startFrame+27));
  if(release<=cue.startFrame+5||frame<cue.startFrame||frame>=release)return 0;
  const onset=smooth((frame-cue.startFrame)/Math.min(12,
    Math.max(5,Math.floor((release-cue.startFrame)/4))));
  const fadeStart=Math.max(cue.startFrame+5,release-12);
  const exit=1-smooth((frame-fadeStart)/Math.max(1,release-fadeStart));
  return clamp01(onset*exit);
}

export function shot02FlowIntensity(frame:number,start:number,
  end:number):number {
  if(frame<start)return 0;
  const rise=smooth((frame-start)/Math.max(12,Math.min(45,end-start)));
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
    y:base.y+12*gateway+13*balancer+23*auth+18*database,
    scale:base.scale+zoom,
  };
}
