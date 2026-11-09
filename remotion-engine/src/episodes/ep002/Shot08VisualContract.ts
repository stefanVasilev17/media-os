import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';

export const SHOT08_TERM_ORDER=[
  'WHAT_IF_ADD_AUTH','HORIZONTAL_SCALING','THREE_TO_SIX',
  'MORE_ROUTES','EIGHT_CONNECTIONS','MORE_SERVERS',
  'FOLLOW_CONNECTIONS','SAME_USER_DATABASE','DB_AT_CAPACITY',
  'DB_NOT_FASTER','MORE_COMPETITION','SHARED_BOTTLENECK',
  'BRIDGE_ANALOGY','APP_NOT_LIMIT','SCALED_NOT_BOTTLENECK',
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
  title:{left:560,top:76,width:1120,height:123},
  caption:{left:560,top:850,width:1220,height:95},
  final:{left:560,top:960,width:1200,height:54},
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
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==5
    ||!Array.isArray(props.termCues)||props.termCues.length!==SHOT08_TERM_ORDER.length)
    throw Error('SHOT08_REQUIRES_CURRENT_DIRECTOR_APPROVED_REAL_VOICE');
  let end=0;
  for(let i=0;i<5;i++){
    const b=props.verifiedCues[i];
    if(b?.beatNumber!==i+1||!b.spokenAnchor?.trim()
      ||!Number.isInteger(b.startFrame)||!Number.isInteger(b.endFrame)
      ||b.startFrame!==end||b.endFrame<=b.startFrame
      ||b.endFrame>props.durationInFrames)
      throw Error('SHOT08_FIVE_DIRECTOR_BEATS_INVALID');
    end=b.endFrame;
  }
  if(end!==props.durationInFrames)
    throw Error('SHOT08_DIRECTOR_BEATS_MUST_COVER_REAL_TAKE');
  let previous=-1;
  for(let i=0;i<SHOT08_TERM_ORDER.length;i++){
    const t=props.termCues[i];
    if(t?.id!==SHOT08_TERM_ORDER[i]||!t.spokenAnchor?.trim()
      ||!Number.isInteger(t.startFrame)||!Number.isInteger(t.endFrame)
      ||t.startFrame<0||t.endFrame<=t.startFrame||t.endFrame>props.durationInFrames
      ||t.startFrame<previous)
      throw Error('SHOT08_REAL_SPOKEN_TERM_ORDER_INVALID');
    previous=t.endFrame;
  }
  const positions=Object.fromEntries(props.termCues.map(x=>[x.id,x.startFrame])) as
    Record<Shot08TermId,number>;
  if(!(positions.HORIZONTAL_SCALING<positions.THREE_TO_SIX
    &&positions.THREE_TO_SIX<positions.EIGHT_CONNECTIONS
    &&positions.EIGHT_CONNECTIONS<positions.SAME_USER_DATABASE
    &&positions.SAME_USER_DATABASE<positions.DB_NOT_FASTER
    &&positions.DB_NOT_FASTER<positions.SHARED_BOTTLENECK
    &&positions.SHARED_BOTTLENECK<positions.BRIDGE_ANALOGY
    &&positions.BRIDGE_ANALOGY<positions.APP_NOT_LIMIT
    &&positions.APP_NOT_LIMIT<positions.SCALED_NOT_BOTTLENECK))
    throw Error('SHOT08_SCALING_BOTTLENECK_CAUSAL_ORDER_INVALID');
  return {beats:props.verifiedCues,terms:props.termCues,positions};
}
export function assertShot08SafeLayout(){
  const items=Object.entries(SHOT08_TEXT_AREAS);
  for(const [a,A] of items){
    if(A.left<45||A.top<40||A.left+A.width>1878
      ||A.top+A.height>1040)
      throw Error('SHOT08_TEXT_OUTSIDE_SAFE_FRAME_'+a);
    for(const [b,B] of items)
      if(a<b&&shot02Intersects(A,B,18))
        throw Error('SHOT08_TEXT_AREAS_OVERLAP_'+a+'_'+b);
  }
  for(const [name,rect] of Object.entries(SHOT02_NODES)){
    const bounds={left:rect.x-rect.width/2,top:rect.y,
      width:rect.width,height:rect.height};
    for(const key of ['caption','final'] as const)
      if(shot02Intersects(bounds,SHOT08_TEXT_AREAS[key],20))
        throw Error('SHOT08_CAPTION_OVER_ARCHITECTURE_'+name+'_'+key);
  }
  if(SHOT02_NODES.auth.x!==1326||SHOT02_NODES.database.x!==1697)
    throw Error('SHOT08_CANONICAL_ARCHITECTURE_GEOGRAPHY_CHANGED');
}
