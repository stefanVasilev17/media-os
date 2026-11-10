import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';

export const SHOT09_TERM_ORDER=[
  'STOP_RETRIES',
  'NINE_HUNDRED',
  'FIVE_HUNDRED',
  'QUEUE_GROWS',
  'ADMISSION_CONTROL',
  'GATEWAY_POLICY',
  'THREE_AUTH',
  'SHARED_BUDGET',
  'FOUR_FIFTY',
  'ILLUSTRATION',
  'SHEDDING',
  'FAIL_FAST',
  'NO_SIGN_IN',
  'CONCURRENCY',
  'THREE_POOLS',
  'BULKHEAD',
  'BREAKER_OPEN',
  'TEST_PROBES',
  'TRADEOFF',
  'SOME_FAIL',
  'ADMITTED_WORK',
] as const;
export type Shot09TermId=typeof SHOT09_TERM_ORDER[number];
export type Shot09BeatCue={beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot09TermCue={id:Shot09TermId;spokenAnchor:string;startFrame:number;endFrame:number};
export type LockedShot08Handoff={
  renderId:'3415073a-5906-489d-bb69-6af7446c2c9b';
  sourceCommit:'a0dbdc8927cb2d47d5a1a3e691c6405bf0c28390';
  lastFrame:2313;
  shot07LastFrame:2673;
  worldLastFrame:4986;
  criticalPulseStartFrame:number;
  cascadeStartFrame:number;
};
export type Shot09SceneProps={
  durationInFrames:number;voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot09BeatCue[];termCues:Shot09TermCue[];
  lockedShot08Handoff:LockedShot08Handoff;
};
export const SHOT09_TEXT_AREAS={
  title:{left:560,top:78,width:900,height:92},
  leftPanel:{left:560,top:695,width:448,height:148},
  rightPanel:{left:1090,top:695,width:445,height:148},
  dbReadout:{left:1573,top:685,width:256,height:143},
  caption:{left:565,top:875,width:1060,height:69},
  footer:{left:560,top:983,width:1220,height:54},
} as const satisfies Record<string,Rect>;
const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export const shot09Ease=(frame:number,start:number,length:number)=>{
  const t=clamp((frame-start)/Math.max(1,length));
  return t*t*(3-2*t);
};
export function validateShot09Source(props:Shot09SceneProps){
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==7
    ||!Array.isArray(props.termCues)||props.termCues.length!==SHOT09_TERM_ORDER.length)
    throw Error('SHOT09_REQUIRES_SELECTED_REAL_VOICE_SEVEN_BEATS_TWENTY_ONE_TERMS');
  let prior=0;
  for(let i=0;i<7;i++){
    const beat=props.verifiedCues[i];
    if(beat?.beatNumber!==i+1||!beat.spokenAnchor?.trim()
      ||!Number.isInteger(beat.startFrame)||!Number.isInteger(beat.endFrame)
      ||beat.startFrame<0||beat.endFrame<=beat.startFrame
      ||beat.endFrame>props.durationInFrames
      ||(i>0&&beat.startFrame!==prior))
      throw Error('SHOT09_REAL_AUDIO_SEVEN_BEATS_INVALID');
    prior=beat.endFrame;
  }
  if(prior!==props.durationInFrames)
    throw Error('SHOT09_REAL_AUDIO_MUST_COVER_ALL_FRAMES');
  let previous=-1;
  for(let i=0;i<SHOT09_TERM_ORDER.length;i++){
    const term=props.termCues[i];
    if(term?.id!==SHOT09_TERM_ORDER[i]||!term.spokenAnchor?.trim()
      ||!Number.isInteger(term.startFrame)||!Number.isInteger(term.endFrame)
      ||term.startFrame<0||term.endFrame<=term.startFrame
      ||term.endFrame>props.durationInFrames||term.startFrame<previous)
      throw Error('SHOT09_REAL_SPOKEN_TERM_SEQUENCE_INVALID');
    previous=term.endFrame;
  }
  const locked=props.lockedShot08Handoff;
  if(!locked
    ||locked.renderId!=='3415073a-5906-489d-bb69-6af7446c2c9b'
    ||locked.sourceCommit!=='a0dbdc8927cb2d47d5a1a3e691c6405bf0c28390'
    ||locked.lastFrame!==2313||locked.shot07LastFrame!==2673
    ||locked.worldLastFrame!==4986
    ||!Number.isInteger(locked.criticalPulseStartFrame)
    ||!Number.isInteger(locked.cascadeStartFrame)
    ||locked.criticalPulseStartFrame<0
    ||locked.cascadeStartFrame<=locked.criticalPulseStartFrame
    ||locked.cascadeStartFrame>=2674)
    throw Error('SHOT09_REQUIRES_DIRECTOR_LOCKED_SHOT08_FINAL_WORLD_FRAME');
  const positions=Object.fromEntries(props.termCues.map(x=>[x.id,x.startFrame])) as
    Record<Shot09TermId,number>;
  if(!(positions.STOP_RETRIES<positions.NINE_HUNDRED
    &&positions.NINE_HUNDRED<positions.ADMISSION_CONTROL
    &&positions.ADMISSION_CONTROL<positions.SHARED_BUDGET
    &&positions.SHARED_BUDGET<positions.SHEDDING
    &&positions.SHEDDING<positions.CONCURRENCY
    &&positions.CONCURRENCY<positions.BREAKER_OPEN
    &&positions.BREAKER_OPEN<positions.TRADEOFF
    &&positions.TRADEOFF<positions.ADMITTED_WORK))
    throw Error('SHOT09_ADMISSION_CONTROL_CAUSAL_ORDER_INVALID');
  return {beats:props.verifiedCues,terms:props.termCues,positions};
}
export function assertShot09SafeLayout(){
  for(const [key,area] of Object.entries(SHOT09_TEXT_AREAS)){
    if(area.left<44||area.top<40||area.left+area.width>1880
      ||area.top+area.height>1045)
      throw Error('SHOT09_TEXT_OUTSIDE_SAFE_FRAME_'+key);
    for(const [other,b] of Object.entries(SHOT09_TEXT_AREAS)){
      if(key<other&&shot02Intersects(area,b,9))
        throw Error('SHOT09_TEXT_COLLISION_'+key+'_'+other);
    }
    for(const [node,n] of Object.entries(SHOT02_NODES)){
      const bounds={left:n.x-n.width/2,top:n.y,width:n.width,height:n.height};
      if(shot02Intersects(area,bounds,13))
        throw Error('SHOT09_TEXT_OVERLAPS_PROTECTED_WORLD_'+key+'_'+node);
    }
  }
  if(SHOT02_NODES.auth.x!==1326||SHOT02_NODES.database.x!==1697
    ||SHOT02_NODES.auth.width!==350||SHOT02_NODES.database.width!==252)
    throw Error('SHOT09_FIXED_THREE_AUTH_ONE_DATABASE_GEOMETRY_CHANGED');
}
