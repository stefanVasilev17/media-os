import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,ATControlledRealismLayer,AT_FONT} from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {
  GatewayCard,BalancerCard,AuthCluster,DatabaseCard,PathSystem,
} from './Shot02DirectorVisualV5';
import {
  SHOT02_AUTH_REPLICA_PORTS,SHOT02_AUTH_CARD_LEFT,SHOT02_AUTH_CARD_RIGHT,
  SHOT02_PHONE_PIPE,SHOT02_GATEWAY_ENTRY,SHOT02_GATEWAY_EXIT,
  SHOT02_BALANCER_ENTRY,SHOT02_BALANCER_EXIT,SHOT02_DATABASE_ENTRY,
  shot02CubicPoint,
} from './Shot02PressureVisuals';
import {
  SHOT01_UNIFIED_PASS,requireShot01RealCues,shot01UnifiedState,
} from '../../../shot01-unified-visual-contract.mjs';

export type Shot01UnifiedVisualV2Props={
  durationInFrames:number;
  presentation:'STORYBOARD_PREVIEW_V1';
  beatStartFrames?:number[];
  timingMode?:'ELEVENLABS_CHARACTER_TIMESTAMPS'|'PROVISIONAL_STORYBOARD';
  voiceTakeId?:string;
  visualStylePass?:string;
};

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const linear=(a:{x:number;y:number},b:{x:number;y:number},t:number)=>({
  x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
});

const SingleLoginRequest:React.FC<{progress:number;visible:boolean}>=
  ({progress,visible})=>{
    if(!visible)return null;
    const first=SHOT02_AUTH_REPLICA_PORTS[0];
    const authIn={x:SHOT02_AUTH_CARD_LEFT+6,y:first.y};
    const authOut={x:SHOT02_AUTH_CARD_RIGHT,y:first.y};
    const path=[
      [SHOT02_PHONE_PIPE,SHOT02_GATEWAY_ENTRY],
      [SHOT02_GATEWAY_EXIT,SHOT02_BALANCER_ENTRY],
      [SHOT02_BALANCER_EXIT,authIn],
      [authIn,authOut],
      [authOut,SHOT02_DATABASE_ENTRY],
    ] as const;
    const raw=clamp(progress)*path.length;
    const segment=Math.min(path.length-1,Math.floor(raw));
    const t=clamp(raw-segment);
    const [from,to]=path[segment];
    const dot=segment===2
      ?shot02CubicPoint(t,from,{x:1090,y:from.y},
        {x:1137,y:to.y},to)
      :segment===4
        ?shot02CubicPoint(t,from,{x:1505,y:from.y},
          {x:1540,y:to.y},to)
        :linear(from,to,t);
    return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0,zIndex:7,pointerEvents:'none'}}>
      <circle cx={dot.x} cy={dot.y} r={8} fill="#8DF9E6"
        stroke="#E8FFFF" strokeWidth={2}
        style={{filter:'drop-shadow(0 0 15px rgba(98,239,216,.92))'}}/>
    </svg>;
  };

const HealthProbeFacts:React.FC<{opacity:number}>=({opacity})=>{
  if(opacity<=0)return null;
  return <div style={{position:'absolute',left:1130,top:713,zIndex:24,
    display:'inline-flex',flexDirection:'column',gap:10,
    opacity,transform:'translateY('+Math.round((1-opacity)*12)+'px)',
    pointerEvents:'none',fontFamily:AT_FONT}}>
    {['Liveness: PASS','Readiness: PASS'].map(text=>
      <div key={text} style={{display:'inline-flex',alignItems:'center',
        alignSelf:'flex-start',gap:14,padding:'12px 20px',
        boxSizing:'border-box',whiteSpace:'nowrap',
        border:'2px solid #5CE5B7',borderRadius:13,
        background:'linear-gradient(115deg,rgba(8,62,53,.97),rgba(4,35,38,.98))',
        boxShadow:'0 0 24px rgba(69,231,187,.20)',
        color:'#DFFFF1',fontSize:24,fontWeight:825}}>
        <span style={{width:11,height:11,borderRadius:6,
          background:'#72FFD1',boxShadow:'0 0 11px #72FFD1'}}/>
        {text}
      </div>)}
  </div>;
};

const WaitingRail:React.FC<{
  frame:number;opacity:number;rewind:number;
}>=({frame,opacity,rewind})=>{
  if(opacity<=0)return null;
  const shimmer=.5+.5*Math.sin(frame*.045);
  return <div style={{position:'absolute',left:1040,top:885,
    width:440,height:82,zIndex:24,pointerEvents:'none',
    opacity,transform:'translateY('+Math.round((1-opacity)*7)+
      'px) scaleX('+(1-.85*rewind)+')',
    transformOrigin:'12% 50%',fontFamily:AT_FONT}}>
    <div style={{position:'absolute',left:0,top:16,
      width:440,height:3,
      background:'linear-gradient(90deg,#FDBB6E,rgba(247,175,89,.16))',
      boxShadow:'0 0 17px rgba(255,191,108,.36)'}}/>
    {[0,1,2,3,4,5,6].map(i=>
      <div key={i} style={{position:'absolute',
        left:i*68,top:i%2===0?7:12,width:2,
        height:i%2===0?21:12,borderRadius:2,
        background:'#E9A96D',opacity:.6}}/>)}
    <div style={{position:'absolute',top:10,
      left:20+(rewind>0?(1-rewind)*355:shimmer*355),
      height:13,width:13,borderRadius:8,background:'#FFD099',
      boxShadow:'0 0 15px #FFC483'}}/>
    <div style={{position:'absolute',left:0,top:41,
      fontSize:24,fontWeight:790,letterSpacing:'.035em',
      color:'#F6C78D',whiteSpace:'nowrap'}}>
      TIME PASSES · NO RESPONSE
    </div>
  </div>;
};

export const Shot01UnifiedVisualV2:React.FC<Shot01UnifiedVisualV2Props>=({
  durationInFrames,beatStartFrames,timingMode,voiceTakeId,visualStylePass,
})=>{
  const frame=useCurrentFrame();
  const config=useVideoConfig();
  if(config.fps!==30||config.width!==1920||config.height!==1080
    ||config.durationInFrames!==durationInFrames
    ||visualStylePass!==SHOT01_UNIFIED_PASS
    ||!voiceTakeId||!(/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(voiceTakeId)))
    throw Error('SHOT01_UNIFIED_REQUIRES_REAL_TAKE_SOURCE_AND_1080P30');
  const cues=requireShot01RealCues(durationInFrames,beatStartFrames,timingMode);
  const v=shot01UnifiedState(frame,durationInFrames,cues);
  const camera='translate3d('+v.cameraX+'px,'+v.cameraY+
    'px,0) scale('+v.cameraScale+')';
  const focus=clamp(v.focus);
  return <ATBackground>
    <ATControlledRealismLayer frame={v.canonicalFrame}
      realism={.96} architectureReveal={.3}/>
    <div style={{position:'absolute',left:66,top:40,width:380,height:42,
      fontFamily:AT_FONT,fontSize:17,fontWeight:710,
      letterSpacing:'.20em',color:'#A6D6F3',zIndex:28}}>
      ARCHITECTURAL THINKING
    </div>
    <div style={{position:'absolute',left:66,top:86,width:340,height:1,
      background:'linear-gradient(90deg,rgba(95,204,255,.66),transparent)',
      zIndex:28}}/>
    <AbsoluteFill style={{transform:camera,transformOrigin:'50% 50%',
      pointerEvents:'none'}}>
      <PathSystem clock={0} load={0} arrival={0} lookup={0} stress={0}/>
      <GatewayCard activity={0}/>
      <BalancerCard activity={0}/>
      <AuthCluster activity={focus*.20} frame={v.canonicalFrame}/>
      <DatabaseCard pressure={0} reveal={0} frame={v.canonicalFrame}/>
      <AbsoluteFill style={{pointerEvents:'none',zIndex:12,
        transform:'translate3d(-680px,-150px,0) scale(1.11)',
        transformOrigin:'50% 50%'}}>
        <Shot02PressurePhone frame={v.canonicalFrame}
          reveal={1} credential={.22} ui={0}
          emailValue="user@example.com" passwordDots="••••••••"
          emailFocus={0} passwordFocus={0}
          localUi={v.waiting} press={v.press}
          pressStartFrame={Number.POSITIVE_INFINITY}
          waiting={v.waiting} spinner={v.waiting}
          pressure={0} realism={1} heroPush={0}/>
      </AbsoluteFill>
      <SingleLoginRequest progress={v.packetProgress}
        visible={v.packetVisible}/>
      <div style={{position:'absolute',left:1151,top:315,
        width:350,height:348,zIndex:14,pointerEvents:'none',
        borderRadius:25,border:'3px solid rgba(122,241,204,'+
          (.65*focus).toFixed(3)+')',
        boxShadow:'0 0 '+Math.round(32*focus)+
          'px rgba(108,241,196,'+(.35*focus).toFixed(3)+')',
        opacity:focus}}/>
      <HealthProbeFacts opacity={v.health}/>
      <WaitingRail frame={v.canonicalFrame} opacity={v.rail}
        rewind={v.rewindActive}/>
    </AbsoluteFill>
  </ATBackground>;
};