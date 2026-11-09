import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';
export type Shot06BeatCue={beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot06TermId=
  'WAIT_FOR_CONNECTION'|'REQUEST_DEADLINE'|'CLOCK_CONTINUES'
  |'LOOKUP_NOT_STARTED'|'TIME_RUNS_OUT'|'REQUEST_TIMEOUT'|'PHONE_ERROR'
  |'SYSTEM_STILL_WORKING'|'REQUEST_B'|'LOOKUP_RUNNING'|'DB_CAPACITY'
  |'WAIT_LONGER'|'CANCELLATION'|'STOP_IF_POSSIBLE'|'RESOURCES_FREE';
export type Shot06TermCue={id:Shot06TermId;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot06SceneProps={durationInFrames:number;voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot06BeatCue[];termCues:Shot06TermCue[];};
export const SHOT06_TERM_ORDER:readonly Shot06TermId[]=[
  'WAIT_FOR_CONNECTION','REQUEST_DEADLINE','CLOCK_CONTINUES',
  'LOOKUP_NOT_STARTED','TIME_RUNS_OUT','REQUEST_TIMEOUT','PHONE_ERROR',
  'SYSTEM_STILL_WORKING','REQUEST_B','LOOKUP_RUNNING','DB_CAPACITY',
  'WAIT_LONGER','CANCELLATION','STOP_IF_POSSIBLE','RESOURCES_FREE',
] as const;
export const SHOT06_CARDS={
  heading:{left:278,top:108,width:1120,height:78},
  pool:{left:280,top:218,width:1238,height:535},
  queue:{left:282,top:795,width:1236,height:95},
  meaning:{left:282,top:905,width:1236,height:110},
  phone:{left:1580,top:710,width:165,height:270},
} as const satisfies Record<string,Rect>;
const clamp=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export const shot06Ease=(frame:number,start:number,length:number):number=>{
  const t=clamp((frame-start)/Math.max(1,length));return t*t*(3-2*t);
};
export const shot06DeadlineRemaining=(frame:number,terms:Record<Shot06TermId,number>):number=>{
  if(!(terms.REQUEST_DEADLINE<terms.TIME_RUNS_OUT))
    throw Error('SHOT06_REAL_DEADLINE_NARRATIVE_ORDER_INVALID');
  return 1-shot06Ease(frame,terms.REQUEST_DEADLINE,
    terms.TIME_RUNS_OUT-terms.REQUEST_DEADLINE);
};
export const shot06CallerTimedOut=(frame:number,terms:Record<Shot06TermId,number>)=>
  frame>=terms.TIME_RUNS_OUT;
export const shot06LookupBMayStillRun=(frame:number,terms:Record<Shot06TermId,number>)=>
  frame>=terms.LOOKUP_RUNNING;
export const shot06CancellationIsConditional=(frame:number,terms:Record<Shot06TermId,number>)=>
  frame>=terms.STOP_IF_POSSIBLE;
export function validateShot06Source(props:Shot06SceneProps){
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==5
    ||!Array.isArray(props.termCues)
    ||props.termCues.length!==SHOT06_TERM_ORDER.length)
    throw Error('SHOT06_REQUIRES_DIRECTOR_APPROVED_REAL_TIMED_VOICE');
  const beats=props.verifiedCues,terms=props.termCues;
  for(let i=0;i<beats.length;i++){
    const b=beats[i];
    if(b?.beatNumber!==i+1||!b.spokenAnchor?.trim()
      ||!Number.isInteger(b.startFrame)||!Number.isInteger(b.endFrame)
      ||b.startFrame<0||b.endFrame<=b.startFrame
      ||b.endFrame>props.durationInFrames
      ||(i>0&&b.startFrame!==beats[i-1].endFrame))
      throw Error('SHOT06_FIVE_REAL_DIRECTOR_BEATS_INVALID');
  }
  if(beats[beats.length-1]?.endFrame!==props.durationInFrames)
    throw Error('SHOT06_BEATS_MUST_COVER_REAL_SELECTED_TAKE');
  for(let i=0;i<terms.length;i++){
    const t=terms[i];
    if(t?.id!==SHOT06_TERM_ORDER[i]||!t.spokenAnchor?.trim()
      ||!Number.isInteger(t.startFrame)||!Number.isInteger(t.endFrame)
      ||t.startFrame<0||t.endFrame<=t.startFrame
      ||t.endFrame>props.durationInFrames
      ||(i>0&&t.startFrame<terms[i-1].endFrame))
      throw Error('SHOT06_FIFTEEN_ACTUAL_SPOKEN_TERMS_INVALID');
  }
  if(!(terms[1].startFrame<terms[4].startFrame
    &&terms[4].startFrame<terms[6].startFrame
    &&terms[6].startFrame<terms[8].startFrame
    &&terms[8].startFrame<terms[9].startFrame
    &&terms[9].startFrame<terms[12].startFrame
    &&terms[12].startFrame<terms[13].startFrame
    &&terms[13].startFrame<terms[14].startFrame))
    throw Error('SHOT06_SPOKEN_CAUSAL_ORDER_INVALID');
  return {beats,terms};
}
export function assertShot06SafeLayout(){
  for(const [name,rect] of Object.entries(SHOT06_CARDS)){
    if(rect.left<40||rect.top<26||rect.left+rect.width>1878
      ||rect.top+rect.height>1045)
      throw Error('SHOT06_SAFE_AREA_'+name);
  }
  if(shot02Intersects(SHOT06_CARDS.phone,SHOT06_CARDS.meaning,32)
    ||shot02Intersects(SHOT06_CARDS.phone,SHOT06_CARDS.heading,30))
    throw Error('SHOT06_PHONE_EXPLAINER_COLLISION');
  if(SHOT02_NODES.auth.x!==1326||SHOT02_NODES.auth.y!==315)
    throw Error('SHOT06_PROTECTED_AUTH_COORDINATES_CHANGED');
}
