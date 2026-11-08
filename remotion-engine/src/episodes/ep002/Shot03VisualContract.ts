import {SHOT02_NODES,shot02Intersects,type Rect} from './Shot02PremiumLayout';

export type Shot03BeatCue={
  beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number;
};
export type Shot03TermId='USER_DATABASE'|'FIVE_HUNDRED'|'THROUGHPUT'
  |'SIX_FIFTY'|'NINE_HUNDRED'|'ARRIVAL_RATE'|'UNFINISHED_WORK'
  |'BOTTLENECK'|'SATURATION'|'LATENCY'|'STILL_WORKING';
export type Shot03TermCue={
  id:Shot03TermId;spokenAnchor:string;startFrame:number;endFrame:number;
};
export type Shot03SceneProps={
  durationInFrames:number;voiceTakeId:string;
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues:Shot03BeatCue[];
  termCues:Shot03TermCue[];
};
export const SHOT03_TERM_ORDER:readonly Shot03TermId[]=[
  'USER_DATABASE','FIVE_HUNDRED','THROUGHPUT','SIX_FIFTY',
  'NINE_HUNDRED','ARRIVAL_RATE','UNFINISHED_WORK',
  'BOTTLENECK','SATURATION','LATENCY','STILL_WORKING',
] as const;

export const SHOT03_TEXT_AREAS={
  brand:{left:66,top:40,width:390,height:44},
  context:{left:546,top:119,width:385,height:125},
  completed:{left:985,top:107,width:391,height:143},
  arrivals:{left:1423,top:107,width:414,height:143},
  work:{left:1088,top:710,width:401,height:176},
  latency:{left:1517,top:710,width:318,height:176},
  conclusion:{left:542,top:911,width:1293,height:83},
} as const satisfies Record<string,Rect>;

export const SHOT03_AUTH_PORTS=[412,498,584] as const;
export const SHOT03_OUTPUT_PORT={x:1823,y:509};
export const SHOT03_OUTPUT_END={x:1856,y:509};

const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export const shot03Ease=(frame:number,start:number,length:number):number=>{
  const t=clamp((frame-start)/Math.max(1,length));
  return t*t*(3-2*t);
};

export function validateShot03Source(props:Shot03SceneProps):{
  beats:readonly Shot03BeatCue[];terms:readonly Shot03TermCue[];
} {
  if(!props||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<150||props.durationInFrames>108000
    ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
    ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(props.voiceTakeId)
    ||!Array.isArray(props.verifiedCues)||props.verifiedCues.length!==5
    ||!Array.isArray(props.termCues)||props.termCues.length!==SHOT03_TERM_ORDER.length)
    throw Error('SHOT03_REQUIRES_CURRENT_DIRECTOR_VERIFIED_TAKE_AND_REAL_CUES');
  const beats=props.verifiedCues;
  const terms=props.termCues;
  for(let i=0;i<beats.length;i++) {
    const beat=beats[i];
    if(!beat||beat.beatNumber!==i+1||!beat.spokenAnchor?.trim()
      ||!Number.isInteger(beat.startFrame)||!Number.isInteger(beat.endFrame)
      ||beat.startFrame<0||beat.endFrame>props.durationInFrames
      ||beat.endFrame<=beat.startFrame
      ||(i>0&&(beat.startFrame!==beats[i-1].endFrame
        ||beat.startFrame<=beats[i-1].startFrame)))
      throw Error('SHOT03_VERIFIED_BEAT_ORDER_INVALID');
  }
  if(beats[4].endFrame!==props.durationInFrames)
    throw Error('SHOT03_BEATS_DO_NOT_COVER_MEASURED_AUDIO');
  for(let i=0;i<terms.length;i++) {
    const term=terms[i];
    if(!term||term.id!==SHOT03_TERM_ORDER[i]||!term.spokenAnchor?.trim()
      ||!Number.isInteger(term.startFrame)||!Number.isInteger(term.endFrame)
      ||term.startFrame<0||term.endFrame<=term.startFrame
      ||term.endFrame>props.durationInFrames
      ||(i>0&&term.startFrame<terms[i-1].endFrame))
      throw Error('SHOT03_REAL_SPOKEN_TERM_ORDER_INVALID');
  }
  if(terms[1].startFrame<beats[0].startFrame
    ||terms[1].startFrame>=beats[0].endFrame
    ||terms[3].startFrame<beats[1].startFrame
    ||terms[3].startFrame>=beats[1].endFrame
    ||terms[4].startFrame>=beats[1].endFrame
    ||terms[5].startFrame<beats[2].startFrame
    ||terms[5].startFrame>=beats[2].endFrame
    ||terms[6].startFrame<beats[3].startFrame
    ||terms[6].startFrame>=beats[3].endFrame
    ||terms[7].startFrame<beats[4].startFrame
    ||terms[7].startFrame>=beats[4].endFrame)
    throw Error('SHOT03_TERMS_DISAGREE_WITH_VERIFIED_BEATS');
  return {beats,terms};
}

export function shot03ArrivalRate(frame:number,sixFifty:number,nineHundred:number):number {
  if(nineHundred<=sixFifty)throw Error('SHOT03_ARRIVAL_CUE_ORDER_INVALID');
  const a=shot03Ease(frame,sixFifty,28);
  const b=shot03Ease(frame,nineHundred,28);
  return Math.round((350+300*a+250*b)/10)*10;
}

export function shot03CompletionRate(frame:number,fiveHundred:number):number{
  return frame>=fiveHundred?500:350;
}

export function shot03DatabasePressure(frame:number,bottleneck:number,saturation:number):number{
  if(saturation<=bottleneck)throw Error('SHOT03_PRESSURE_CUE_ORDER_INVALID');
  return clamp(.55+.18*shot03Ease(frame,bottleneck,65)
    +.12*shot03Ease(frame,saturation,60));
}

export function shot03WaitingDepth(frame:number,unfinished:number,nineHundred:number):number{
  return Math.round(2+(4+5*shot03Ease(frame,nineHundred,65))
    *shot03Ease(frame,unfinished,65));
}

export function shot03LatencyBar(frame:number,latency:number):number {
  return 45+204*shot03Ease(frame,latency,85);
}

export function shot03FlowClock(frame:number,sixFifty:number,nineHundred:number):number{
  return .009*frame
    +Math.max(0,frame-sixFifty)*.002*shot03Ease(frame,sixFifty,42)
    +Math.max(0,frame-nineHundred)*.003*shot03Ease(frame,nineHundred,42);
}

export function assertShot03SafeLayout():void{
  for(const [name,box] of Object.entries(SHOT03_TEXT_AREAS)) {
    if(box.left<44||box.top<35||box.left+box.width>1876||box.top+box.height>1040)
      throw Error('SHOT03_SAFE_AREA_CLIPPED_'+name);
    for(const [otherName,other] of Object.entries(SHOT03_TEXT_AREAS)){
      if(name<otherName&&shot02Intersects(box,other,12))
        throw Error('SHOT03_TEXT_COLLISION_'+name+'_'+otherName);
    }
  }
  const {gateway,balancer,auth,database}=SHOT02_NODES;
  for(const node of [gateway,balancer,auth,database]) {
    const box={left:node.x-node.width/2,top:node.y,width:node.width,height:node.height};
    if(box.left<510||box.left+box.width>1870||box.top<270||box.top+box.height>700)
      throw Error('SHOT03_ARCHITECTURE_CLIPPED');
    for(const name of ['context','completed','arrivals','work','latency','conclusion'] as const) {
      if(shot02Intersects(box,SHOT03_TEXT_AREAS[name],10))
        throw Error('SHOT03_ARCHITECTURE_TEXT_COLLISION_'+name);
    }
  }
  if(SHOT03_OUTPUT_END.x>1870
    ||SHOT03_OUTPUT_END.x<=SHOT03_OUTPUT_PORT.x)
    throw Error('SHOT03_COMPLETION_OUTPUT_UNSAFE');
}
