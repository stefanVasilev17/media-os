import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';

export const SHOT11_TERM_ORDER=[
  'FULL_JOURNEY','PHONE_GATEWAY_BALANCER','THREE_AUTH','ONE_DATABASE',
  'NO_NEW_SERVERS','NO_FASTER_DB','LIMIT_RETRIES','CONCURRENT_LOOKUPS',
  'REJECT_EXCESS','QUEUE_SHRINK','ON_TIME_LOGINS','FAST_FAILURE',
  'TRADEOFF','STOP_AMPLIFICATION','LESSON','HEALTHY_NOT_AVAILABLE',
  'WHOLE_JOURNEY','ONE_DB_QUESTION','NEXT_STORY',
] as const;
export type Shot11TermId=typeof SHOT11_TERM_ORDER[number];
export type Shot11BeatCue={beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot11TermCue={id:Shot11TermId;spokenAnchor:string;startFrame:number;endFrame:number};
export type Shot11LockedShot10Handoff={
  renderId:'2034d8c6-99b2-46a5-9469-bf3df325d6c0';
  sourceCommit:'a4d9fe5d1dcec033f36ce68a190160fd8077faea';
  durationInFrames:2360;
  lastFrame:2359;
  shot09WorldLastFrame:8048;
  worldLastFrame:10407;
  criticalPulseStartFrame:number;
  cascadeStartFrame:number;
};
export type Shot11SceneProps={
  durationInFrames:number;voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot11BeatCue[];termCues:Shot11TermCue[];
  lockedShot10Handoff:Shot11LockedShot10Handoff;
};
export const SHOT11_TEXT_AREAS={
  lockedTitle:{left:560,top:78,width:1010,height:92},
  orangeStory:{left:560,top:742,width:1240,height:176},
  lockedFooter:{left:560,top:983,width:1220,height:54},
} as const satisfies Record<string,Rect>;
const clamp=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export const shot11Ease=(frame:number,start:number,duration:number)=>{
  const t=clamp((frame-start)/Math.max(1,duration));
  return t*t*(3-2*t);
};
export function validateShot11Source(props:Shot11SceneProps){
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==5
    ||!Array.isArray(props.termCues)||props.termCues.length!==SHOT11_TERM_ORDER.length)
    throw Error('SHOT11_REQUIRES_CURRENT_REAL_SELECTED_TAKE_FIVE_BEATS_NINETEEN_TERMS');
  let previous=0;
  for(let i=0;i<5;i++){
    const b=props.verifiedCues[i];
    if(b?.beatNumber!==i+1||!b.spokenAnchor?.trim()
      ||!Number.isInteger(b.startFrame)||!Number.isInteger(b.endFrame)
      ||b.startFrame<0||b.endFrame<=b.startFrame
      ||b.endFrame>props.durationInFrames
      ||(i>0&&b.startFrame!==previous))
      throw Error('SHOT11_FIVE_REAL_AUDIO_BEATS_INVALID');
    previous=b.endFrame;
  }
  if(previous!==props.durationInFrames)
    throw Error('SHOT11_REAL_VOICE_FRAMES_MUST_COVER_SHOT');
  previous=-1;
  for(let i=0;i<SHOT11_TERM_ORDER.length;i++){
    const t=props.termCues[i];
    if(t?.id!==SHOT11_TERM_ORDER[i]||!t.spokenAnchor?.trim()
      ||!Number.isInteger(t.startFrame)||!Number.isInteger(t.endFrame)
      ||t.startFrame<0||t.endFrame<=t.startFrame
      ||t.endFrame>props.durationInFrames||t.startFrame<previous)
      throw Error('SHOT11_NINETEEN_REAL_SPOKEN_TERMS_INVALID');
    previous=t.endFrame;
  }
  const h=props.lockedShot10Handoff;
  if(!h
    ||h.renderId!=='2034d8c6-99b2-46a5-9469-bf3df325d6c0'
    ||h.sourceCommit!=='a4d9fe5d1dcec033f36ce68a190160fd8077faea'
    ||h.durationInFrames!==2360||h.lastFrame!==2359
    ||h.shot09WorldLastFrame!==8048||h.worldLastFrame!==10407
    ||!Number.isInteger(h.criticalPulseStartFrame)
    ||!Number.isInteger(h.cascadeStartFrame)
    ||h.criticalPulseStartFrame<0||h.cascadeStartFrame<=h.criticalPulseStartFrame
    ||h.cascadeStartFrame>=2674)
    throw Error('SHOT11_EXACT_DIRECTOR_LOCKED_SHOT10_FINAL_MP4_HANDOFF_REQUIRED');
  const positions=Object.fromEntries(props.termCues.map(t=>[t.id,t.startFrame])) as Record<Shot11TermId,number>;
  if(!(positions.FULL_JOURNEY<positions.NO_NEW_SERVERS
    &&positions.NO_NEW_SERVERS<positions.LIMIT_RETRIES
    &&positions.LIMIT_RETRIES<positions.REJECT_EXCESS
    &&positions.REJECT_EXCESS<positions.QUEUE_SHRINK
    &&positions.QUEUE_SHRINK<positions.ON_TIME_LOGINS
    &&positions.ON_TIME_LOGINS<positions.FAST_FAILURE
    &&positions.FAST_FAILURE<positions.LESSON
    &&positions.LESSON<positions.HEALTHY_NOT_AVAILABLE
    &&positions.HEALTHY_NOT_AVAILABLE<positions.ONE_DB_QUESTION
    &&positions.ONE_DB_QUESTION<positions.NEXT_STORY))
    throw Error('SHOT11_ARCHITECTURAL_TRUTH_CAUSAL_SEQUENCE_INVALID');
  return {positions,beats:props.verifiedCues,terms:props.termCues};
}
export function assertShot11SafeLayout(){
  for(const [name,rect] of Object.entries(SHOT11_TEXT_AREAS)){
    if(rect.left<44||rect.top<40||rect.left+rect.width>1880
      ||rect.top+rect.height>1045)
      throw Error('SHOT11_TEXT_OUTSIDE_SAFE_FRAME_'+name);
    for(const [other,b] of Object.entries(SHOT11_TEXT_AREAS)){
      if(name<other&&shot02Intersects(rect,b,9))
        throw Error('SHOT11_INFORMATION_PANELS_COLLIDE_'+name+'_'+other);
    }
    for(const [nameNode,n] of Object.entries(SHOT02_NODES)){
      const bounds={left:n.x-n.width/2,top:n.y,width:n.width,height:n.height};
      if(shot02Intersects(rect,bounds,13))
        throw Error('SHOT11_TEXT_OVERLAPS_ORIGINAL_ARCHITECTURE_'+name+'_'+nameNode);
    }
  }
  if(SHOT02_NODES.auth.x!==1326||SHOT02_NODES.database.x!==1697
    ||SHOT02_NODES.auth.width!==350||SHOT02_NODES.database.width!==252)
    throw Error('SHOT11_ONE_SHARED_DATABASE_THREE_AUTH_IMMUTABILITY_VIOLATED');
}
