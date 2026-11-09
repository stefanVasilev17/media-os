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
  title:{left:80,top:78,width:1450,height:107},
  explanation:{left:80,top:847,width:1185,height:105},
  metrics:{left:80,top:626,width:1120,height:187},
  phone:{left:1520,top:690,width:300,height:325},
  retryTag:{left:995,top:515,width:322,height:88},
  dbCallout:{left:1506,top:240,width:322,height:93},
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
  for(const [name,box] of Object.entries(SHOT07_SAFE_ZONES)){
    if(box.left<40||box.top<40||box.left+box.width>1880
      ||box.top+box.height>1040)
      throw Error('SHOT07_OUTSIDE_SAFE_FRAME_'+name);
  }
  const {metrics,explanation,phone,retryTag,dbCallout,title}=SHOT07_SAFE_ZONES;
  const pairs:Array<[Rect,Rect,number]>=[
    [metrics,phone,24],[explanation,phone,24],[retryTag,metrics,22],
    [retryTag,phone,24],[dbCallout,phone,24],[dbCallout,title,22],
    [dbCallout,metrics,22],[retryTag,explanation,24],
  ];
  if(pairs.some(([a,b,gap])=>shot02Intersects(a,b,gap)))
    throw Error('SHOT07_DIRECTOR_CARD_OVERLAP');
  if(SHOT02_NODES.auth.x!==1326||SHOT02_NODES.auth.y!==315)
    throw Error('SHOT07_PROTECTED_ARCHITECTURE_GEOGRAPHY_CHANGED');
}
