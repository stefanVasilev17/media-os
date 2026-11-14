import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from '../ep002/Shot07CleanArchitectureWorld';
import {SHOT02_NODES,shot02Intersects} from '../ep002/Shot02PremiumLayout';
import {shot10TextWidth} from '../../../shot10-content-fit-layout.mjs';
import {ep003CardIsReadable,ep003CardOpacity} from '../../../ep003-readable-card-policy.mjs';

const WHITE='#F5FCFF',MINT='#6FECD4',AMBER='#F5A55A',CYAN='#68E5FF',SOFT='#B5D2E6';
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const ease=(f:number,start:number,duration:number)=>{
  const t=clamp((f-start)/Math.max(1,duration));
  return t*t*(3-2*t);
};

export const EP003_SHOT02_LOCKED_PREDECESSOR={
  renderId:'b6fd7f30-7c78-414b-a88c-387c0ee8c43a',
  videoSha256:'da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08',
  frameCount:2514,
  realLastFrame:2513,
  worldLastFrame:11978+2513,
  width:1920,height:1080,fps:30,
} as const;

export const EP003_SHOT02_CARDS=[
  {cue:'INTRO',eyebrow:'ONE ARCHITECTURE',line:'THREE AUTH SERVERS. ONE USER DATABASE.',color:CYAN},
  {cue:'DEMAND',eyebrow:'INCOMING DEMAND',line:'900 NEW LOGIN REQUESTS / SECOND',color:CYAN},
  {cue:'CAPACITY',eyebrow:'MEASURED DATABASE CAPACITY',line:'ABOUT 500 ACCOUNT LOOKUPS / SECOND',color:AMBER},
  {cue:'QUEUES',eyebrow:'WHEN DEMAND EXCEEDS CAPACITY',line:'MORE WAITING. LONGER QUEUES.',color:AMBER},
  {cue:'THROUGHPUT',eyebrow:'TWO DIFFERENT MEASUREMENTS',line:'HOW MUCH FINISHES VS HOW LONG IT TAKES',color:CYAN},
  {cue:'BOTTLENECK',eyebrow:'THE REAL BOTTLENECK',line:'ALL THREE AUTH SERVERS SHARE THE LIMIT',color:AMBER},
  {cue:'MORE_AUTH',eyebrow:'MORE AUTH SERVERS?',line:'MORE SERVERS. SAME DATABASE.',color:AMBER},
  {cue:'BUDGET',eyebrow:'ADMISSION CONTROL',line:'450 LOOKUPS / SECOND PROTECTS THE DATABASE',color:MINT},
  {cue:'NEXT',eyebrow:'THE ARCHITECTURAL QUESTION',line:'WHICH DATABASE WORK NEEDS MORE CAPACITY?',color:CYAN},
] as const;

export type Ep003Shot02Cue=typeof EP003_SHOT02_CARDS[number]['cue'];
export type Ep003Shot02Props={
  durationInFrames:number;
  voiceTakeId:string;
  previousRenderId:string;
  previousLastFrameSha256:string;
  previousLastFrameDataUri:string;
  worldStartFrame:number;
  cueFrames:Record<Ep003Shot02Cue,number>;
};

const CARD_LEFT=560,CARD_TOP=742,CARD_PAD=34;
export function ep003Shot02CardSize(eyebrow:string,line:string){
  const width=Math.ceil(Math.max(shot10TextWidth(eyebrow,23),
    shot10TextWidth(line,29))+CARD_PAD*2+12);
  if(width<320||width>950||CARD_LEFT+width>1794)
    throw Error('EP003_SHOT02_TEXT_CONTENT_FIT_BLOCKED');
  return {width,height:131};
}
export function validateEp003Shot02Props(p:Ep003Shot02Props){
  if(!p||p.previousRenderId!==EP003_SHOT02_LOCKED_PREDECESSOR.renderId
      ||p.worldStartFrame!==EP003_SHOT02_LOCKED_PREDECESSOR.worldLastFrame
      ||!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(p.previousLastFrameDataUri)
      ||!/^[a-f0-9]{64}$/.test(p.previousLastFrameSha256)
      ||!/^[0-9a-f-]{36}$/i.test(p.voiceTakeId)
      ||!Number.isInteger(p.durationInFrames)
      ||p.durationInFrames<200||p.durationInFrames>18000)
    throw Error('EP003_SHOT02_REQUIRES_REAL_LOCKED_V2_FRAME_AND_SELECTED_VOICE');
  let previous=-1;
  for(const item of EP003_SHOT02_CARDS){
    const cue=p.cueFrames?.[item.cue];
    if(!Number.isInteger(cue)||cue<=previous||cue>=p.durationInFrames)
      throw Error('EP003_SHOT02_REQUIRES_UNIQUE_REAL_VOICE_CUE_'+item.cue);
    previous=cue;
    const size=ep003Shot02CardSize(item.eyebrow,item.line);
    const rect={left:CARD_LEFT,top:CARD_TOP,...size};
    if(CARD_TOP+size.height>1020||CARD_LEFT+size.width>1870)
      throw Error('EP003_SHOT02_PANEL_OUTSIDE_1080P_SAFE_AREA');
    for(const node of Object.values(SHOT02_NODES)){
      if(shot02Intersects(rect,{left:node.x-node.width/2,
        top:node.y,width:node.width,height:node.height},20))
        throw Error('EP003_SHOT02_PANEL_OVERLAPS_LIVING_ARCHITECTURE');
    }
  }
  return true;
}

const ActiveCard:React.FC<{
  frame:number;cueFrames:Ep003Shot02Props['cueFrames'];durationInFrames:number
}>=({frame,cueFrames,durationInFrames})=>{
  const i=EP003_SHOT02_CARDS.reduce((index,card,n)=>
    frame>=cueFrames[card.cue]?n:index,-1);
  if(i<0)return null;
  const card=EP003_SHOT02_CARDS[i],next=EP003_SHOT02_CARDS[i+1];
  const from=cueFrames[card.cue];
  const to=next?cueFrames[next.cue]:durationInFrames;
  if(!ep003CardIsReadable(card.eyebrow,card.line,from,to,30))return null;
  const alpha=ep003CardOpacity(frame,from,to);
  const size=ep003Shot02CardSize(card.eyebrow,card.line);
  return <div style={{position:'absolute',left:CARD_LEFT,top:CARD_TOP,
    ...size,boxSizing:'border-box',padding:'20px 34px',zIndex:23,
    borderRadius:17,border:'2px solid '+card.color,
    background:'linear-gradient(120deg,rgba(10,32,50,.977),rgba(5,19,37,.988))',
    boxShadow:'0 13px 36px rgba(0,0,0,.33),0 0 18px rgba(89,202,232,.08)',
    opacity:alpha,pointerEvents:'none',fontFamily:AT_FONT,
    transform:'translateY('+((1-alpha)*5)+'px)'}}>
    <div style={{color:card.color,fontSize:23,lineHeight:'29px',
      letterSpacing:'.015em',fontWeight:850,whiteSpace:'nowrap'}}>{card.eyebrow}</div>
    <div style={{color:WHITE,fontSize:29,lineHeight:'39px',fontWeight:900,
      marginTop:11,whiteSpace:'nowrap',letterSpacing:'-.01em'}}>{card.line}</div>
  </div>;
};

export const Ep003Shot02DirectorReviewV1:React.FC<Ep003Shot02Props>=(props)=>{
  const frame=useCurrentFrame(),cfg=useVideoConfig();
  if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30
      ||cfg.durationInFrames!==props.durationInFrames)
    throw Error('EP003_SHOT02_REQUIRES_REAL_VOICE_1920X1080_30FPS');
  validateEp003Shot02Props(props);
  const cues=props.cueFrames;
  const priorVisual=1-ease(frame,0,55);
  const headingChange=ease(frame,80,65);
  const pressure=ease(frame,cues.DEMAND,100);
  const deeperPressure=ease(frame,cues.QUEUES,100);
  const ring=.84+.14*pressure;
  const worldFrame=props.worldStartFrame+frame;
  return <ATBackground>
    <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
      transformOrigin:'50% 50%'}}>
      <Shot07CleanArchitectureWorld
        frame={worldFrame} replicaGrowth={0}
        dbStress={.33+.12*pressure+.11*deeperPressure}
        cascadeStartFrame={1} criticalPulseStartFrame={0}
        recoveryLevel={1} showPhone={1} showPools={.25}
        initialPressure showLoginBadge={0} showRetryAttempts={0}
        flowRetryLevel={.08} flowJitterLevel={.76}
        admissionLevel={.5} breakerLevel={.11} probeLevel={1}/>
      <div style={{position:'absolute',left:SHOT02_NODES.database.x-
          SHOT02_NODES.database.width/2-11,top:SHOT02_NODES.database.y-11,
          width:SHOT02_NODES.database.width+22,
          height:SHOT02_NODES.database.height+22,
          border:'3px solid '+AMBER,borderRadius:24,boxSizing:'border-box',
          boxShadow:'0 0 38px rgba(245,165,90,.29)',
          opacity:ring,pointerEvents:'none',zIndex:18}}/>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:25}}>
      <div style={{position:'absolute',left:560,top:78,
        opacity:1-headingChange,color:WHITE,fontFamily:AT_FONT,
        fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
        THE SYSTEM IS STABLE. BUT LOGIN CAN STILL FAIL.
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <div style={{position:'absolute',left:560,top:78,
        opacity:headingChange,color:WHITE,fontFamily:AT_FONT,
        fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
        FIND THE REAL BOTTLENECK.
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
      </div>
      <ActiveCard frame={frame} cueFrames={cues} durationInFrames={props.durationInFrames}/>
    </AbsoluteFill>
    <AbsoluteFill style={{zIndex:30,opacity:priorVisual,pointerEvents:'none'}}>
      <Img src={props.previousLastFrameDataUri}
        style={{width:1920,height:1080,objectFit:'cover'}}/>
    </AbsoluteFill>
  </ATBackground>;
};
