import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';

export const SHOT08_TERM_ORDER=[
  'AFTER_STORM','OWN_REPEATS','THREE_AUTH','ONE_DB','CONTROL_FIRST',
  'AUTH01','LOOKUP_TIMEOUT','DEADLINE_CHECK','STOP_EXPIRED',
  'SHARED_BUDGET','SAFE_READ','BUDGET_EXHAUSTED','NO_LOGIN_REPLAY',
  'EXP_BACKOFF','JITTER','STAGGER','WATCH_DB','FEWER_ATTEMPTS',
  'CAPACITY_UNCHANGED','STORM_CONTAINED','NEW_ARRIVALS',
] as const;
export type Shot08TermId=typeof SHOT08_TERM_ORDER[number];
export type Shot08BeatCue={beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot08TermCue={id:Shot08TermId;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot08SceneProps={
  durationInFrames:number;voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot08BeatCue[];termCues:Shot08TermCue[];
};
export const SHOT08_TEXT_AREAS={
  title:{left:560,top:76,width:1130,height:120},
  caption:{left:560,top:875,width:1200,height:78},
  final:{left:560,top:983,width:1220,height:54},
  budget:{left:1120,top:686,width:416,height:142},
  databaseMeter:{left:1573,top:685,width:256,height:143},
} as const satisfies Record<string,Rect>;
const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export const shot08Ease=(frame:number,start:number,length:number)=>{
  const t=clamp((frame-start)/Math.max(1,length));
  return t*t*(3-2*t);
};
export function validateShot08Source(props:Shot08SceneProps){
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==6
    ||!Array.isArray(props.termCues)||props.termCues.length!==SHOT08_TERM_ORDER.length)
    throw Error('SHOT08_RECOVERY_REQUIRES_CURRENT_REAL_SELECTED_VOICE_AND_SIX_BEATS');
  let prior=0;
  for(let i=0;i<6;i++){
    const b=props.verifiedCues[i];
    if(b?.beatNumber!==i+1||!b.spokenAnchor?.trim()
      ||!Number.isInteger(b.startFrame)||!Number.isInteger(b.endFrame)
      ||b.startFrame<0||b.endFrame<=b.startFrame
      ||b.endFrame>props.durationInFrames
      ||(i>0&&b.startFrame!==prior))
      throw Error('SHOT08_SIX_AUDIO_ALIGNED_BEATS_INVALID');
    prior=b.endFrame;
  }
  if(prior!==props.durationInFrames)throw Error('SHOT08_BEATS_MUST_SPAN_REAL_AUDIO');
  let previous=-1;
  for(let i=0;i<SHOT08_TERM_ORDER.length;i++){
    const t=props.termCues[i];
    if(t?.id!==SHOT08_TERM_ORDER[i]||!t.spokenAnchor?.trim()
      ||!Number.isInteger(t.startFrame)||!Number.isInteger(t.endFrame)
      ||t.startFrame<0||t.endFrame<=t.startFrame||t.endFrame>props.durationInFrames
      ||t.startFrame<previous)
      throw Error('SHOT08_RECOVERY_SPOKEN_TERM_ORDER_INVALID');
    previous=t.endFrame;
  }
  const positions=Object.fromEntries(props.termCues.map(x=>[x.id,x.startFrame])) as
    Record<Shot08TermId,number>;
  if(!(positions.AFTER_STORM<positions.THREE_AUTH
    &&positions.THREE_AUTH<positions.AUTH01
    &&positions.AUTH01<positions.SHARED_BUDGET
    &&positions.SHARED_BUDGET<positions.EXP_BACKOFF
    &&positions.EXP_BACKOFF<positions.WATCH_DB
    &&positions.WATCH_DB<positions.CAPACITY_UNCHANGED
    &&positions.CAPACITY_UNCHANGED<positions.NEW_ARRIVALS))
    throw Error('SHOT08_RECOVERY_CAUSAL_ORDER_INVALID');
  return {beats:props.verifiedCues,terms:props.termCues,positions};
}
export function assertShot08SafeLayout(){
  for(const [name,area] of Object.entries(SHOT08_TEXT_AREAS)){
    if(area.left<44||area.top<40||area.left+area.width>1880
      ||area.top+area.height>1045)
      throw Error('SHOT08_TEXT_OUTSIDE_SAFE_FRAME_'+name);
    for(const [other,rectangle] of Object.entries(SHOT08_TEXT_AREAS))
      if(name<other&&shot02Intersects(area,rectangle,12))
        throw Error('SHOT08_OVERLAPPING_TEXT_ZONES_'+name+'_'+other);
    for(const [node,n] of Object.entries(SHOT02_NODES)){
      const bounds={left:n.x-n.width/2,top:n.y,width:n.width,height:n.height};
      if(shot02Intersects(bounds,area,13))
        throw Error('SHOT08_TEXT_COLLIDES_WITH_WORLD_'+name+'_'+node);
    }
  }
  if(SHOT02_NODES.auth.x!==1326||SHOT02_NODES.database.x!==1697)
    throw Error('SHOT08_PROTECTED_ARCHITECTURE_GEOGRAPHY_CHANGED');
}
