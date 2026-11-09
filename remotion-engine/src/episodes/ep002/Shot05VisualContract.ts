import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';

export type Shot05BeatCue={beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot05TermId=
  'CONNECTION_POOL'|'BORROWS_ONE'|'EIGHT_MAX'|'REPLAY'|'ONE_BUSY'
  |'FIVE_BUSY'|'SEVEN_BUSY'|'EIGHT_BUSY'|'POOL_EXHAUSTION'
  |'ANOTHER_LOGIN'|'WAIT_FOR_CONNECTION'|'REQUEST_QUEUEING'
  |'IN_FLIGHT'|'SPINNER'|'TIME_RUNNING_OUT';
export type Shot05TermCue={id:Shot05TermId;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot05SceneProps={
  durationInFrames:number;voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot05BeatCue[];termCues:Shot05TermCue[];
};
export const SHOT05_TERM_ORDER:readonly Shot05TermId[]=[
  'CONNECTION_POOL','BORROWS_ONE','EIGHT_MAX','REPLAY','ONE_BUSY',
  'FIVE_BUSY','SEVEN_BUSY','EIGHT_BUSY','POOL_EXHAUSTION',
  'ANOTHER_LOGIN','WAIT_FOR_CONNECTION','REQUEST_QUEUEING',
  'IN_FLIGHT','SPINNER','TIME_RUNNING_OUT',
] as const;
export const SHOT05_TEXT_AREAS={
  brand:{left:75,top:38,width:370,height:40},
  heading:{left:278,top:110,width:1100,height:70},
  pool:{left:280,top:218,width:1240,height:535},
  queue:{left:282,top:795,width:1236,height:96},
  explainers:{left:282,top:903,width:1236,height:109},
  phone:{left:1580,top:710,width:165,height:270},
} as const satisfies Record<string,Rect>;
const clamp=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export const shot05Ease=(frame:number,start:number,length:number):number=>{
  const t=clamp((frame-start)/Math.max(1,length));
  return t*t*(3-2*t);
};
export const shot05ReturnFrame=(terms:Record<Shot05TermId,number>):number=>
  terms.BORROWS_ONE+Math.max(24,Math.floor((terms.REPLAY-terms.BORROWS_ONE)*.42));

export const shot05ReplayBusy=(frame:number,terms:Record<Shot05TermId,number>):number=>{
  const r=terms.REPLAY,one=terms.ONE_BUSY,five=terms.FIVE_BUSY;
  const seven=terms.SEVEN_BUSY,eight=terms.EIGHT_BUSY;
  if(!(r<one&&one<five&&five<seven&&seven<eight))
    throw Error('SHOT05_REAL_SPOKEN_REPLAY_ORDER_INVALID');
  if(frame<terms.BORROWS_ONE)return 0;
  if(frame<r)return frame>=shot05ReturnFrame(terms)?0:1;
  if(frame<one)return 0;
  if(frame<five)return 1;
  if(frame<seven)return 5;
  if(frame<eight)return 7;
  return 8;
};

export const shot05SlotFill=(
  frame:number,index:number,terms:Record<Shot05TermId,number>,
):number=>{
  if(!Number.isInteger(index)||index<0||index>7)
    throw Error('SHOT05_POOL_INDEX_OUT_OF_BOUNDS');
  if(index===0&&frame<terms.REPLAY){
    return shot05Ease(frame,terms.BORROWS_ONE,18)*
      (1-shot05Ease(frame,shot05ReturnFrame(terms),20));
  }
  if(frame<terms.REPLAY)return 0;
  const activation=index===0?terms.ONE_BUSY
    :index<=4?terms.FIVE_BUSY+(index-1)*4
      :index<=6?terms.SEVEN_BUSY+(index-5)*5
        :terms.EIGHT_BUSY;
  return shot05Ease(frame,activation,18);
};

export const shot05QueueDepth=(frame:number,terms:Record<Shot05TermId,number>):number=>{
  if(frame<terms.ANOTHER_LOGIN)return 0;
  return Math.min(7,1+Math.floor(Math.max(0,frame-terms.ANOTHER_LOGIN)/47));
};
export const shot05WaitingForConnection=(frame:number,terms:Record<Shot05TermId,number>)=>
  frame>=terms.WAIT_FOR_CONNECTION;
export function validateShot05Source(props:Shot05SceneProps):{
  beats:readonly Shot05BeatCue[];terms:readonly Shot05TermCue[];
}{
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==5
    ||!Array.isArray(props.termCues)
    ||props.termCues.length!==SHOT05_TERM_ORDER.length)
    throw Error('SHOT05_REQUIRES_DIRECTOR_APPROVED_REAL_TIMED_VOICE');
  const beats=props.verifiedCues,terms=props.termCues;
  for(let i=0;i<beats.length;i++){
    const beat=beats[i];
    if(!beat||beat.beatNumber!==i+1||!beat.spokenAnchor?.trim()
      ||!Number.isInteger(beat.startFrame)||!Number.isInteger(beat.endFrame)
      ||beat.startFrame<0||beat.endFrame<=beat.startFrame
      ||beat.endFrame>props.durationInFrames
      ||(i>0&&beat.startFrame!==beats[i-1].endFrame))
      throw Error('SHOT05_FIVE_VERIFIED_HEAR_SEE_BEATS_INVALID');
  }
  if(beats[beats.length-1]?.endFrame!==props.durationInFrames)
    throw Error('SHOT05_BEATS_MUST_COVER_REAL_TAKE');
  for(let i=0;i<terms.length;i++){
    const cue=terms[i];
    if(!cue||cue.id!==SHOT05_TERM_ORDER[i]||!cue.spokenAnchor?.trim()
      ||!Number.isInteger(cue.startFrame)||!Number.isInteger(cue.endFrame)
      ||cue.startFrame<0||cue.endFrame<=cue.startFrame
      ||cue.endFrame>props.durationInFrames
      ||(i>0&&cue.startFrame<terms[i-1].endFrame))
      throw Error('SHOT05_FIFTEEN_REAL_TERMS_INVALID');
  }
  if(terms[3].startFrame>=terms[4].startFrame
    ||terms[4].startFrame>=terms[5].startFrame
    ||terms[5].startFrame>=terms[6].startFrame
    ||terms[6].startFrame>=terms[7].startFrame
    ||terms[7].startFrame>=terms[8].startFrame
    ||terms[9].startFrame>=terms[10].startFrame
    ||terms[12].startFrame>=terms[14].startFrame)
    throw Error('SHOT05_SPOKEN_CAUSAL_ORDER_INVALID');
  return {beats,terms};
}
export function assertShot05SafeLayout(){
  for(const [name,box] of Object.entries(SHOT05_TEXT_AREAS)){
    if(box.left<45||box.top<24||box.left+box.width>1878
      ||box.top+box.height>1043)
      throw Error('SHOT05_SAFE_AREA_INVALID_'+name);
  }
  const heading=SHOT05_TEXT_AREAS.heading;
  const phone:Rect=SHOT05_TEXT_AREAS.phone;
  if(shot02Intersects(SHOT05_TEXT_AREAS.explainers,phone,22))
    throw Error('SHOT05_SPOKEN_EXPLAINERS_PHONE_COLLISION');
  if(shot02Intersects(heading,phone,30))
    throw Error('SHOT05_PHONE_HEADER_COLLISION');
  const auth=SHOT02_NODES.auth;
  if(auth.x!==1326||auth.y!==315)
    throw Error('SHOT05_PROTECTED_AUTH01_WORLD_GEOGRAPHY_CHANGED');
}
