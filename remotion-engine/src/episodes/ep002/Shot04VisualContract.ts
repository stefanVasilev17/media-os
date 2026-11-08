import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';

export type Shot04BeatCue={
  beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number;
};
export type Shot04TermId=
  'USER_DATABASE'|'HEALTH_CHECKS'|'LIVENESS_PROBE'|'READINESS_PROBE'
  |'REAL_LOGIN'|'SERVICE_AVAILABILITY'|'END_TO_END_CHECK'
  |'SPINNER'|'ALIVE_NOT_AVAILABLE';
export type Shot04TermCue={
  id:Shot04TermId;spokenAnchor:string;startFrame:number;endFrame:number;
};
export type Shot04SceneProps={
  durationInFrames:number;
  voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot04BeatCue[];
  termCues:Shot04TermCue[];
};
export const SHOT04_TERM_ORDER:readonly Shot04TermId[]=[
  'USER_DATABASE','HEALTH_CHECKS','LIVENESS_PROBE','READINESS_PROBE',
  'REAL_LOGIN','SERVICE_AVAILABILITY','END_TO_END_CHECK',
  'SPINNER','ALIVE_NOT_AVAILABLE',
] as const;

export const SHOT04_TEXT_AREAS={
  brand:{left:66,top:40,width:382,height:42},
  heading:{left:557,top:115,width:690,height:144},
  semantics:{left:1035,top:719,width:782,height:160},
  conclusion:{left:543,top:930,width:1280,height:76},
} as const satisfies Record<string,Rect>;

const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export const shot04Ease=(frame:number,start:number,length:number):number=>{
  const t=clamp((frame-start)/Math.max(1,length));
  return t*t*(3-2*t);
};

export function validateShot04Source(props:Shot04SceneProps):{
  beats:readonly Shot04BeatCue[];
  terms:readonly Shot04TermCue[];
}{
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==5
    ||!Array.isArray(props.termCues)
    ||props.termCues.length!==SHOT04_TERM_ORDER.length)
    throw Error('SHOT04_REQUIRES_CURRENT_DIRECTOR_APPROVED_TAKE_AND_REAL_CUES');
  const beats=props.verifiedCues,terms=props.termCues;
  for(let i=0;i<beats.length;i++){
    const b=beats[i];
    if(!b||b.beatNumber!==i+1||!b.spokenAnchor?.trim()
      ||!Number.isInteger(b.startFrame)||!Number.isInteger(b.endFrame)
      ||b.startFrame<0||b.endFrame>props.durationInFrames
      ||b.endFrame<=b.startFrame
      ||(i>0&&(b.startFrame!==beats[i-1].endFrame
        ||b.startFrame<=beats[i-1].startFrame)))
      throw Error('SHOT04_VERIFIED_BEAT_ORDER_INVALID');
  }
  if(beats[4].endFrame!==props.durationInFrames)
    throw Error('SHOT04_BEATS_DO_NOT_COVER_MEASURED_AUDIO');
  for(let i=0;i<terms.length;i++){
    const t=terms[i];
    if(!t||t.id!==SHOT04_TERM_ORDER[i]||!t.spokenAnchor?.trim()
      ||!Number.isInteger(t.startFrame)||!Number.isInteger(t.endFrame)
      ||t.startFrame<0||t.endFrame<=t.startFrame
      ||t.endFrame>props.durationInFrames
      ||(i>0&&t.startFrame<terms[i-1].endFrame))
      throw Error('SHOT04_REAL_SPOKEN_TERM_ORDER_INVALID');
  }
  if(!(terms[1].startFrame<terms[2].startFrame
    &&terms[2].startFrame<terms[3].startFrame
    &&terms[3].startFrame<terms[4].startFrame
    &&terms[4].startFrame<terms[5].startFrame
    &&terms[5].startFrame<terms[6].startFrame
    &&terms[6].startFrame<terms[7].startFrame
    &&terms[7].startFrame<terms[8].startFrame))
    throw Error('SHOT04_HEALTH_JOURNEY_NARRATIVE_ORDER_INVALID');
  return {beats,terms};
}

export function assertShot04SafeLayout():void{
  const areas=Object.entries(SHOT04_TEXT_AREAS);
  for(const [name,box] of areas){
    if(box.left<44||box.top<35||box.left+box.width>1876
      ||box.top+box.height>1040)
      throw Error('SHOT04_SAFE_AREA_CLIPPED_'+name);
    for(const [otherName,other] of areas){
      if(name<otherName&&shot02Intersects(box,other,13))
        throw Error('SHOT04_TEXT_COLLISION_'+name+'_'+otherName);
    }
  }
  for(const [name,node] of Object.entries(SHOT02_NODES)){
    const rect={left:node.x-node.width/2,top:node.y,
      width:node.width,height:node.height};
    for(const field of ['heading','semantics','conclusion'] as const)
      if(shot02Intersects(rect,SHOT04_TEXT_AREAS[field],8))
        throw Error('SHOT04_ARCHITECTURE_TEXT_COLLISION_'+name+'_'+field);
  }
}

export const shot04StatusPalette={
  healthy:'#73FFD0',
  waiting:'#F5A55A',
  overloaded:'#F06F58',
  silent:'#30516D',
} as const;

export const shot04QueueDepth=(frame:number):number=>
  Math.min(14,Math.max(7,7+Math.floor(Math.max(0,frame)/180)));

export const shot04ReplicaPhase=(frame:number,replica:number,packet:number):number=>{
  if(!Number.isFinite(frame)||!Number.isInteger(replica)||replica<0||replica>2
    ||!Number.isInteger(packet)||packet<0||packet>5)
    throw Error('SHOT04_REPLICA_PACKET_ARGUMENT_INVALID');
  const t=frame*.014+replica*.19+packet*.31;
  return (t%1+1)%1;
};
