import {shot02Intersects,type Rect,SHOT02_NODES} from './Shot02PremiumLayout';

export type Shot07BeatCue={beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number};
export const SHOT07_TERM_ORDER=[
  'OTHER_LOGINS','ACCOUNT_LOOKUP','AUTH_RETRY','RETRY_MECHANISM',
  'TEMPORARY_PROBLEM','DB_OVERLOADED','FIRST_LOOKUP_RUNNING',
  'RETRY_ADDS_WORK','OTHER_AUTH_RETRIES','TRAFFIC_STABLE',
  'ATTEMPTS_GROW','RETRY_AMPLIFICATION','RETRY_STORM',
  'CASCADING_FAILURE','READ_ONLY_LOOKUP',
] as const;
export type Shot07TermId=typeof SHOT07_TERM_ORDER[number];
export type Shot07TermCue={id:Shot07TermId;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot07SceneProps={
  durationInFrames:number;voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot07BeatCue[];termCues:Shot07TermCue[];
};
export const SHOT07_SAFE_ZONES={
  title:{left:80,top:78,width:1020,height:110},
  activeLogin:{left:1157,top:215,width:338,height:79},
  caption:{left:565,top:875,width:1060,height:69},
  phone:{left:55,top:160,width:445,height:800},
} as const satisfies Record<string,Rect>;
const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export const shot07Ease=(frame:number,start:number,length:number):number=>{
  const t=clamp((frame-start)/Math.max(1,length));
  return t*t*(3-2*t);
};
export function validateShot07Source(props:Shot07SceneProps){
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==5
    ||!Array.isArray(props.termCues)||props.termCues.length!==SHOT07_TERM_ORDER.length)
    throw Error('SHOT07_REQUIRES_CURRENT_APPROVED_REAL_TIMED_VOICE');
  let previous=0;
  for(let i=0;i<props.verifiedCues.length;i++){
    const beat=props.verifiedCues[i];
    if(beat?.beatNumber!==i+1||!beat.spokenAnchor?.trim()
      ||!Number.isInteger(beat.startFrame)||!Number.isInteger(beat.endFrame)
      ||beat.startFrame<0||beat.endFrame<=beat.startFrame
      ||beat.endFrame>props.durationInFrames
      ||(i>0&&beat.startFrame!==previous))
      throw Error('SHOT07_FIVE_DIRECTOR_BEATS_INVALID');
    previous=beat.endFrame;
  }
  if(previous!==props.durationInFrames)
    throw Error('SHOT07_DIRECTOR_BEATS_MUST_COVER_VOICE');
  previous=-1;
  for(let i=0;i<SHOT07_TERM_ORDER.length;i++){
    const cue=props.termCues[i];
    if(cue?.id!==SHOT07_TERM_ORDER[i]||!cue.spokenAnchor?.trim()
      ||!Number.isInteger(cue.startFrame)||!Number.isInteger(cue.endFrame)
      ||cue.startFrame<0||cue.endFrame<=cue.startFrame
      ||cue.endFrame>props.durationInFrames||cue.startFrame<previous)
      throw Error('SHOT07_REAL_SPOKEN_TERM_ORDER_INVALID');
    previous=cue.endFrame;
  }
  const positions=Object.fromEntries(props.termCues.map(t=>[t.id,t.startFrame])) as
    Record<Shot07TermId,number>;
  if(!(positions.AUTH_RETRY<positions.FIRST_LOOKUP_RUNNING
    &&positions.FIRST_LOOKUP_RUNNING<positions.OTHER_AUTH_RETRIES
    &&positions.TRAFFIC_STABLE<positions.ATTEMPTS_GROW
    &&positions.ATTEMPTS_GROW<positions.RETRY_AMPLIFICATION
    &&positions.RETRY_AMPLIFICATION<positions.RETRY_STORM
    &&positions.RETRY_STORM<positions.CASCADING_FAILURE
    &&positions.CASCADING_FAILURE<positions.READ_ONLY_LOOKUP))
    throw Error('SHOT07_RETRY_CAUSAL_VOICE_ORDER_INVALID');
  return {beats:props.verifiedCues,terms:props.termCues,positions};
}
export function assertShot07SafeLayout(){
  const items=Object.entries(SHOT07_SAFE_ZONES);
  for(const [name,box] of items) {
    if(box.left<44||box.top<40||box.left+box.width>1880
      ||box.top+box.height>1040)
      throw Error('SHOT07_OUTSIDE_SAFE_FRAME_'+name);
    for(const [otherName,other] of items)
      if(name<otherName&&shot02Intersects(box,other,18))
        throw Error('SHOT07_DIRECTOR_TEXT_OVERLAP_'+name+'_'+otherName);
  }
  const active=SHOT07_SAFE_ZONES.activeLogin;
  const auth=SHOT02_NODES.auth;
  if(active.top+active.height>auth.y-18
    ||active.left<auth.x-auth.width/2
    ||active.left+active.width>auth.x+auth.width/2)
    throw Error('SHOT07_ACTIVE_LOGIN_MUST_BE_ABOVE_AUTH_SERVICE');
  for(const [name,n] of Object.entries(SHOT02_NODES)){
    const arch={left:n.x-n.width/2,top:n.y,
      width:n.width,height:n.height};
    if(shot02Intersects(arch,SHOT07_SAFE_ZONES.caption,20)
      ||shot02Intersects(arch,SHOT07_SAFE_ZONES.phone,15))
      throw Error('SHOT07_PROTECTED_ARCHITECTURE_COLLISION_'+name);
  }
  if(SHOT02_NODES.auth.x!==1326||SHOT02_NODES.database.x!==1697)
    throw Error('SHOT07_PROTECTED_ARCHITECTURE_GEOGRAPHY_CHANGED');
}
