import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';

export const SHOT10_TERMS=[
  'LOOK_DATABASE','RETRIES_LIMITED','QUEUE_SHRINK',
  'DB_COMPLETIONS','SHARED_BUDGET','DRAIN_BACKLOG',
  'CONNECTIONS_RETURN','LATENCY_IMPROVES','PRESSURE_AMBER','MEASUREMENT',
  'OLD_TIMEOUT','OLD_OVER','NEW_LOGIN','EVIDENCE','VALID_SUCCESS',
  'SYSTEM_ERRORS','WRONG_PASSWORD','P95_P99','TRACING','REJECTIONS','RECOVERY',
] as const;
export type Shot10TermId=typeof SHOT10_TERMS[number];
export type Shot10BeatCue={beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot10TermCue={id:Shot10TermId;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot10LockedShot09Handoff={
  renderId:'d4b6c8ff-10c5-4181-aa59-fcd16a4470ba';
  sourceCommit:'b33f00ee81f89301115a4fd79874802c712f2724';
  lastFrame:3062;
  durationInFrames:3063;
  shot08WorldLastFrame:4986;
  worldLastFrame:8048;
  criticalPulseStartFrame:number;
  cascadeStartFrame:number;
};
export type Shot10SceneProps={
  durationInFrames:number;
  voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot10BeatCue[];
  termCues:Shot10TermCue[];
  lockedShot09Handoff:Shot10LockedShot09Handoff;
};
export const SHOT10_TEXT_AREAS={
  title:{left:560,top:78,width:920,height:92},
  demand:{left:560,top:695,width:448,height:148},
  intervention:{left:1090,top:695,width:445,height:148},
  database:{left:1573,top:685,width:256,height:143},
  caption:{left:565,top:875,width:1060,height:69},
  footer:{left:560,top:983,width:1220,height:54},
} as const satisfies Record<string,Rect>;
const clamp=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export const shot10Ease=(frame:number,start:number,length:number)=>{
  const t=clamp((frame-start)/Math.max(1,length));
  return t*t*(3-2*t);
};
export function validateShot10Source(props:Shot10SceneProps){
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==6
    ||!Array.isArray(props.termCues)||props.termCues.length!==SHOT10_TERMS.length)
    throw Error('SHOT10_REQUIRES_SELECTED_REAL_VOICE_SIX_BEATS_TWENTY_ONE_TERMS');
  let previous=0;
  for(let i=0;i<6;i++){
    const beat=props.verifiedCues[i];
    if(beat?.beatNumber!==i+1||!beat.spokenAnchor?.trim()
      ||!Number.isInteger(beat.startFrame)||!Number.isInteger(beat.endFrame)
      ||beat.startFrame<0||beat.endFrame<=beat.startFrame
      ||beat.endFrame>props.durationInFrames
      ||(i>0&&beat.startFrame!==previous))
      throw Error('SHOT10_SIX_REAL_SPOKEN_BEATS_INVALID');
    previous=beat.endFrame;
  }
  if(previous!==props.durationInFrames)
    throw Error('SHOT10_REAL_VOICE_FRAMES_NOT_COVERED');
  previous=-1;
  for(let i=0;i<SHOT10_TERMS.length;i++){
    const term=props.termCues[i];
    if(term?.id!==SHOT10_TERMS[i]||!term.spokenAnchor?.trim()
      ||!Number.isInteger(term.startFrame)||!Number.isInteger(term.endFrame)
      ||term.startFrame<0||term.endFrame<=term.startFrame
      ||term.endFrame>props.durationInFrames||term.startFrame<previous)
      throw Error('SHOT10_TWENTY_ONE_REAL_TERMS_INVALID');
    previous=term.endFrame;
  }
  const h=props.lockedShot09Handoff;
  if(!h||h.renderId!=='d4b6c8ff-10c5-4181-aa59-fcd16a4470ba'
    ||h.sourceCommit!=='b33f00ee81f89301115a4fd79874802c712f2724'
    ||h.lastFrame!==3062||h.durationInFrames!==3063
    ||h.shot08WorldLastFrame!==4986||h.worldLastFrame!==8048
    ||!Number.isInteger(h.criticalPulseStartFrame)
    ||!Number.isInteger(h.cascadeStartFrame)
    ||h.criticalPulseStartFrame<0
    ||h.cascadeStartFrame<=h.criticalPulseStartFrame
    ||h.cascadeStartFrame>=2674)
    throw Error('SHOT10_REQUIRES_EXACT_DIRECTOR_LOCKED_SHOT09_MP4_HANDOFF');
  const positions=Object.fromEntries(props.termCues.map(t=>[t.id,t.startFrame])) as
    Record<Shot10TermId,number>;
  if(!(positions.LOOK_DATABASE<positions.QUEUE_SHRINK
    &&positions.QUEUE_SHRINK<positions.DB_COMPLETIONS
    &&positions.DB_COMPLETIONS<positions.DRAIN_BACKLOG
    &&positions.DRAIN_BACKLOG<positions.CONNECTIONS_RETURN
    &&positions.CONNECTIONS_RETURN<positions.MEASUREMENT
    &&positions.MEASUREMENT<positions.OLD_TIMEOUT
    &&positions.OLD_TIMEOUT<positions.NEW_LOGIN
    &&positions.NEW_LOGIN<positions.EVIDENCE
    &&positions.EVIDENCE<positions.P95_P99
    &&positions.P95_P99<positions.TRACING
    &&positions.TRACING<positions.REJECTIONS
    &&positions.REJECTIONS<positions.RECOVERY))
    throw Error('SHOT10_VOICE_DRIVEN_RECOVERY_CAUSAL_ORDER_INVALID');
  return {positions,beats:props.verifiedCues,terms:props.termCues};
}
export function assertShot10SafeLayout(){
  for(const [key,area] of Object.entries(SHOT10_TEXT_AREAS)){
    if(area.left<44||area.top<40||area.left+area.width>1880
      ||area.top+area.height>1045)
      throw Error('SHOT10_TEXT_OUTSIDE_SAFE_FRAME_'+key);
    for(const [other,b] of Object.entries(SHOT10_TEXT_AREAS)){
      if(key<other&&shot02Intersects(area,b,9))
        throw Error('SHOT10_TEXT_COLLISION_'+key+'_'+other);
    }
    for(const [name,n] of Object.entries(SHOT02_NODES)){
      const bounds={left:n.x-n.width/2,top:n.y,width:n.width,height:n.height};
      if(shot02Intersects(area,bounds,13))
        throw Error('SHOT10_TEXT_OVERLAPS_PROTECTED_WORLD_'+key+'_'+name);
    }
  }
  if(SHOT02_NODES.auth.x!==1326||SHOT02_NODES.database.x!==1697
    ||SHOT02_NODES.auth.width!==350||SHOT02_NODES.database.width!==252)
    throw Error('SHOT10_THREE_AUTH_ONE_DATABASE_GEOMETRY_CHANGED');
}
