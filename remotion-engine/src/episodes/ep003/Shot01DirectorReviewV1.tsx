import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from '../ep002/Shot07CleanArchitectureWorld';
import {SHOT02_NODES,shot02Intersects} from '../ep002/Shot02PremiumLayout';
import {SHOT02_BALANCER_EXIT,SHOT02_AUTH_CARD_LEFT,SHOT02_AUTH_REPLICA_PORTS,
  shot02CubicPoint} from '../ep002/Shot02PressureVisuals';
import {shot10TextWidth} from '../../../shot10-content-fit-layout.mjs';

const WHITE='#F5FCFF',SOFT='#B5D2E6',AMBER='#F5A55A',MINT='#6FECD4',CYAN='#68E5FF';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const ease=(frame:number,start:number,duration:number)=>{
  const v=clamp((frame-start)/Math.max(1,duration));
  return v*v*(3-2*v);
};

export const EP003_SHOT01_EP002_PIN={
  renderId:'73ec0e6f-d348-4518-a32b-573bf89a8ab5',
  lastFrame:1571,frames:1572,worldLastFrame:10407+1571,
  width:1920,height:1080,fps:30,
} as const;

export const EP003_SHOT01_CARDS=[
  {cue:'STABLE',eyebrow:'AFTER THE RECOVERY',line:'THE RETRY STORM IS UNDER CONTROL',color:MINT},
  {cue:'UNRESOLVED',eyebrow:'THE USER JOURNEY',line:'SOME LOGINS STILL CANNOT FINISH',color:AMBER},
  {cue:'SHEDDING',eyebrow:'LOAD SHEDDING',line:'REJECT EXCESS WORK EARLY',color:AMBER},
  {cue:'CONSEQUENCE',eyebrow:'THE HUMAN CONSEQUENCE',line:'A FAST REJECTION IS STILL A FAILED LOGIN',color:AMBER},
  {cue:'CAPACITY',eyebrow:'THE NEXT QUESTION',line:'WHAT IF ONE DATABASE IS NOT ENOUGH?',color:CYAN},
] as const;
export type Ep003Shot01Cue=typeof EP003_SHOT01_CARDS[number]['cue'];
export type Ep003Shot01Props={
  durationInFrames:number;
  voiceTakeId:string;
  previousRenderId:string;
  previousLastFrameSha256:string;
  previousLastFrameDataUri:string;
  cueFrames:Record<Ep003Shot01Cue,number>;
  worldStartFrame:number;
};

const CARD_LEFT=560,CARD_TOP=742,CARD_MAX_RIGHT=1794,CARD_PAD=34;
export function ep003Shot01CardSize(eyebrow:string,line:string){
  const eyebrowWidth=shot10TextWidth(eyebrow,23);
  const lineWidth=shot10TextWidth(line,29);
  const width=Math.ceil(Math.max(eyebrowWidth,lineWidth)+CARD_PAD*2+12);
  const height=131;
  if(width>950||width<340||CARD_LEFT+width>CARD_MAX_RIGHT)
    throw Error('EP003_SHOT01_TEXT_CONTENT_FIT_BLOCKED');
  return {width,height};
}
export function validateEp003Shot01Props(p:Ep003Shot01Props){
  if(!p||p.previousRenderId!==EP003_SHOT01_EP002_PIN.renderId||
     !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||
     !/^[a-f0-9]{64}$/.test(p.previousLastFrameSha256)||
     p.worldStartFrame!==EP003_SHOT01_EP002_PIN.worldLastFrame||
     !/^[0-9a-f-]{36}$/i.test(p.voiceTakeId)||
     !Number.isInteger(p.durationInFrames)||p.durationInFrames<200||
     p.durationInFrames>12000)
    throw Error('EP003_SHOT01_REQUIRES_REAL_EP002_FINAL_FRAME_AND_SELECTED_TAKE');
  let old=0;
  for(const item of EP003_SHOT01_CARDS){
    const f=p.cueFrames?.[item.cue];
    if(!Number.isInteger(f)||f<old||f>=p.durationInFrames)
      throw Error('EP003_SHOT01_UNVERIFIED_REAL_SPOKEN_CUE_'+item.cue);
    old=f;
    const {width,height}=ep003Shot01CardSize(item.eyebrow,item.line);
    const rect={left:CARD_LEFT,top:CARD_TOP,width,height};
    if(CARD_LEFT+width>1870||CARD_TOP+height>1020)
      throw Error('EP003_SHOT01_TEXT_OUTSIDE_FRAME');
    for(const n of Object.values(SHOT02_NODES)){
      if(shot02Intersects(rect,
          {left:n.x-n.width/2,top:n.y,width:n.width,height:n.height},20))
        throw Error('EP003_SHOT01_CARD_NODE_COLLISION');
    }
  }
  return true;
}
const cueIndex=(frame:number,cues:Ep003Shot01Props['cueFrames'])=>
  EP003_SHOT01_CARDS.reduce((last,item,i)=>frame>=cues[item.cue]?i:last,-1);

/**
 * Exact same visible Balancer->Auth cubic as Shot07RequestFlows.
 * The rejection marker never travels on an invented shortcut.
 */
export const ep003RejectedPathPoint=(t:number,authIndex=1)=>{
  const row=SHOT02_AUTH_REPLICA_PORTS[authIndex];
  const entry=SHOT02_BALANCER_EXIT;
  const end={x:SHOT02_AUTH_CARD_LEFT,y:row.y};
  const c1={x:1090,y:entry.y},c2={x:1137,y:row.y};
  return shot02CubicPoint(1-clamp(t),entry,c1,c2,end);
};

const RejectionParticle:React.FC<{frame:number;start:number}>=({frame,start})=>{
  const age=frame-start;
  const progress=clamp(age/100);
  const visible=age>=0&&age<108?Math.min(1,age/12,(108-age)/12):0;
  const point=ep003RejectedPathPoint(progress);
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',left:0,top:0,zIndex:14,pointerEvents:'none'}}>
    <circle cx={point.x} cy={point.y} r="5"
      fill={AMBER} opacity={visible}
      style={{filter:'drop-shadow(0 0 8px rgba(245,165,90,.86))'}}/>
  </svg>;
};

const ContentCard:React.FC<{frame:number;cues:Ep003Shot01Props['cueFrames']}>=
({frame,cues})=>{
  const i=cueIndex(frame,cues);
  if(i<0)return null;
  const entry=EP003_SHOT01_CARDS[i];
  const since=frame-cues[entry.cue];
  const next=EP003_SHOT01_CARDS[i+1];
  const until=next?cues[next.cue]-frame:9999;
  const op=ease(since,0,22)*(next?1-ease(until,0,21):1);
  const size=ep003Shot01CardSize(entry.eyebrow,entry.line);
  return <div style={{position:'absolute',left:CARD_LEFT,top:CARD_TOP,
    width:size.width,height:size.height,borderRadius:17,
    boxSizing:'border-box',padding:'20px 34px',
    zIndex:23,opacity:op,pointerEvents:'none',
    border:'2px solid '+entry.color,
    background:'linear-gradient(120deg,rgba(10,32,50,.977),rgba(5,19,37,.988))',
    boxShadow:'0 13px 36px rgba(0,0,0,.33),0 0 18px rgba(89,202,232,.08)',
    fontFamily:AT_FONT,transform:'translateY('+((1-op)*5)+'px)'}}>
    <div style={{color:entry.color,fontSize:23,lineHeight:'29px',
      letterSpacing:'.015em',fontWeight:850,whiteSpace:'nowrap'}}>{entry.eyebrow}</div>
    <div style={{color:WHITE,fontSize:29,lineHeight:'39px',fontWeight:900,
      marginTop:11,whiteSpace:'nowrap',letterSpacing:'-.01em'}}>{entry.line}</div>
  </div>;
};
export const Ep003Shot01DirectorReviewV1:React.FC<Ep003Shot01Props>=(props)=>{
  const frame=useCurrentFrame();
  const cfg=useVideoConfig();
  if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||
    cfg.durationInFrames!==props.durationInFrames)
    throw Error('EP003_SHOT01_REQUIRES_1920X1080_30FPS_REAL_VOICE_DURATION');
  validateEp003Shot01Props(props);
  const p=props.cueFrames;
  const recovered=ease(frame,p.STABLE,75);
  const unresolved=ease(frame,p.UNRESOLVED,75);
  const capacity=ease(frame,p.CAPACITY,100);
  const fromPrior=1-ease(frame,0,55);
  const title=ease(frame,48,55);
  const movingWorldFrame=props.worldStartFrame+frame;
  return <ATBackground>
    <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
      transformOrigin:'50% 50%'}}>
      <Shot07CleanArchitectureWorld
        frame={movingWorldFrame} replicaGrowth={0}
        dbStress={.23+.10*unresolved}
        cascadeStartFrame={1} criticalPulseStartFrame={0}
        recoveryLevel={1} showPhone={1} showPools={.25}
        initialPressure showLoginBadge={0} showRetryAttempts={0}
        flowRetryLevel={.08} flowJitterLevel={.76}
        admissionLevel={.5} breakerLevel={.11}
        probeLevel={1}/>
      <RejectionParticle frame={frame} start={p.SHEDDING+24}/>
      <div style={{position:'absolute',left:SHOT02_NODES.database.x-
          SHOT02_NODES.database.width/2-11,top:SHOT02_NODES.database.y-11,
          width:SHOT02_NODES.database.width+22,
          height:SHOT02_NODES.database.height+22,
          border:'3px solid '+AMBER,borderRadius:24,boxSizing:'border-box',
          boxShadow:'0 0 38px rgba(245,165,90,.29)',
          opacity:capacity*.84,pointerEvents:'none',zIndex:18}}/>
    </AbsoluteFill>
    <AbsoluteFill style={{zIndex:30,opacity:fromPrior,pointerEvents:'none'}}>
      <Img src={props.previousLastFrameDataUri}
        style={{width:1920,height:1080,objectFit:'cover'}}/>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:25,opacity:title}}>
      <div style={{position:'absolute',left:560,top:78,fontFamily:AT_FONT,
        color:WHITE,fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
        THE SYSTEM IS STABLE. BUT LOGIN CAN STILL FAIL.
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <ContentCard frame={frame} cues={p}/>
    </AbsoluteFill>
  </ATBackground>;
};
