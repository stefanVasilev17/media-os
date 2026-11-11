export const SHOT01_UNIFIED_PASS='SHOT01_SHOT02_UNIFIED_V2';

const clamp=value=>Math.max(0,Math.min(1,value));
export const shot01UnifiedEase=(frame,begin,end)=>{
  const t=clamp((frame-begin)/Math.max(1,end-begin));
  return t*t*(3-2*t);
};

export const requireShot01RealCues=(duration,starts,mode)=>{
  if(!Number.isInteger(duration)||duration<150||duration>108000
    ||mode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!Array.isArray(starts)||starts.length!==5)
    throw Error('SHOT01_UNIFIED_REQUIRES_FIVE_REAL_VOICE_CUES');
  for(let i=0;i<5;i++){
    if(!Number.isInteger(starts[i])||starts[i]<0||starts[i]>=duration
      ||(i>0&&starts[i]<=starts[i-1]))
      throw Error('SHOT01_UNIFIED_REAL_CUE_SEQUENCE_INVALID');
  }
  if(duration-starts[4]<15)
    throw Error('SHOT01_UNIFIED_REWIND_NEEDS_REAL_TIME');
  return starts;
};

export const shot01UnifiedState=(frame,duration,starts)=>{
  const [tap,wait,healthCheck,stillWaiting,rewind]=starts;
  const closing=shot01UnifiedEase(frame,Math.max(rewind+10,duration-28),duration-1);
  const remaining=1-closing;
  const press=shot01UnifiedEase(frame,tap,tap+7)*
    (1-shot01UnifiedEase(frame,tap+8,tap+17))*remaining;
  const waiting=shot01UnifiedEase(frame,tap+6,tap+19)*remaining;
  const health=shot01UnifiedEase(frame,healthCheck,healthCheck+32)*remaining;
  const focus=shot01UnifiedEase(frame,healthCheck,healthCheck+36)*
    (1-shot01UnifiedEase(frame,stillWaiting,stillWaiting+32))*remaining;
  const rail=shot01UnifiedEase(frame,wait,wait+31)*remaining;
  const rewindActive=shot01UnifiedEase(frame,rewind,rewind+18);
  return {
    closing,press,waiting,health,focus,rail,rewindActive,
    cameraX:-11*focus,cameraY:3*focus,cameraScale:1+.012*focus,
    canonicalFrame:Math.round(frame*remaining),
    packetProgress:clamp((frame-tap-5)/110),
    packetVisible:frame>=tap+5 && frame<wait+12 && remaining>.15,
  };
};