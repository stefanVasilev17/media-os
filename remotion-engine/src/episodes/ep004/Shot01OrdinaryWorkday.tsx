import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {
  ATBackground,ATCameraRig,ATControlledRealismLayer,AT_FONT
} from '../../components/architectural-thinking';
import {
  EP004_MAIL_ROUTE,EP004_STANDBY_ROUTE,EP004_SHOT01_LAYOUT,ep004RoutePolyline,
  ep004Shot01Phase,ep004Shot01Validate
} from '../../components/architectural-thinking/EP004Shot01World.mjs';
import type {Ep004Shot01Props} from '../../components/architectural-thinking/EP004Shot01World.mjs';

const C={
  cyan:'#68E5FF',mint:'#6FECD4',white:'#F5FCFF',soft:'#B5D2E6',
  amber:'#F5A55A',line:'#498CB7',quiet:'#7494AB',black:'#010711'
};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const pulse=(frame:number,speed:number)=>.5+.5*Math.sin(frame*speed);
const border=(color:string,glow:string)=>({
  border:'2px solid '+color,borderRadius:19,boxSizing:'border-box' as const,
  background:'linear-gradient(145deg,rgba(8,32,53,.99),rgba(3,15,30,.998))',
  boxShadow:'0 0 24px '+glow+',inset 0 1px 0 rgba(255,255,255,.09)',
  overflow:'hidden' as const
});
const pathString=(route:typeof EP004_MAIL_ROUTE)=>ep004RoutePolyline(route);
const L=EP004_SHOT01_LAYOUT;

type MailProps={worldFrame:number;press:number;blocked:number};
const MailGlyph:React.FC=()=> <svg width={44} height={44} viewBox="0 0 44 44"
  style={{display:'block',flexShrink:0}}>
  <rect x={4} y={7} width={34} height={30} rx={8}
    fill="rgba(104,229,255,.07)" stroke={C.cyan} strokeWidth={2.4}/>
  <path d="M 10 15 L 21 24 L 32 15" fill="none"
    stroke={C.mint} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M 10 31 L 17 25 M 32 31 L 25 25" fill="none"
    stroke={C.cyan} strokeWidth={1.8} opacity={.7}/>
</svg>;

const OutlookClient:React.FC<MailProps>=({worldFrame,press,blocked})=>{
  const active=pulse(worldFrame,.032);
  const busy=.24+.76*press;
  return <div style={{
    position:'absolute',left:L.client.x,top:L.client.y,
    width:L.client.width,height:L.client.height,
    ...border(blocked>.28?C.amber:'#5DCEE8',
      blocked>.28?'rgba(245,165,90,.20)':'rgba(42,176,223,.21)'),
    padding:'24px 26px',fontFamily:AT_FONT,zIndex:8,
    filter:'drop-shadow(0 24px 38px rgba(0,0,0,.28))'
  }}>
    <div style={{display:'flex',alignItems:'center',gap:15,height:57}}>
      <MailGlyph/>
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        <div style={{fontSize:29,fontWeight:840,letterSpacing:'-.035em',
          color:C.white,lineHeight:1.1}}>Outlook</div>
        <div style={{fontSize:15,fontWeight:680,color:C.soft,
          letterSpacing:'.06em'}}>PERSONAL INBOX</div>
      </div>
      <div style={{marginLeft:'auto',height:9,width:9,borderRadius:'50%',
        background:blocked>.3?C.amber:C.mint,
        boxShadow:'0 0 '+(9+8*active)+'px '+(blocked>.3?C.amber:C.mint)}}/>
    </div>
    <div style={{height:1,background:'rgba(108,176,208,.32)',
      margin:'17px 0 14px'}}/>
    <div style={{fontSize:23,fontWeight:820,color:C.white,
      marginBottom:13,letterSpacing:'-.025em'}}>Inbox</div>
    {[0,1,2,3].map(i=><div key={i} style={{
      display:'flex',gap:12,alignItems:'center',height:54,
      padding:'0 8px',borderBottom:'1px solid rgba(85,142,185,.18)',
      background:i===0?'linear-gradient(90deg,rgba(28,89,121,.24),transparent)':'transparent'
    }}>
      <div style={{width:8,height:8,borderRadius:4,
        background:i===0?C.mint:C.quiet,opacity:i===0?.94:.45}}/>
      <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
        <div style={{height:5,borderRadius:4,
          background:i===0?'rgba(190,230,248,.83)':'rgba(151,191,218,.56)',
          width:[216,174,191,166][i]}}/>
        <div style={{height:4,borderRadius:4,background:'rgba(90,140,172,.5)',
          width:[183,150,195,131][i]}}/>
      </div>
    </div>)}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
      marginTop:22}}>
      <div style={{minWidth:178,height:44,borderRadius:12,
        border:'1.8px solid '+(press>.2?C.mint:C.cyan),
        background:press>.2?'rgba(16,127,121,.52)':'rgba(24,80,109,.6)',
        boxShadow:press>.2?'0 0 18px rgba(111,236,212,.23)':'none',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:17,fontWeight:840,letterSpacing:'.025em',
        color:C.white}}>OPEN INBOX</div>
      <div style={{fontSize:13,color:blocked>.28?C.amber:C.soft,
        fontWeight:780,letterSpacing:'.07em'}}>
        {blocked>.28?'WAITING':'OPENING'}
      </div>
    </div>
    <svg width={29} height={32} viewBox="0 0 29 32" style={{
      position:'absolute',left:236+7*(1-press),top:397-22*press,
      filter:'drop-shadow(0 2px 2px rgba(0,0,0,.7))',
      transform:'rotate(-11deg)'}}>
      <path d="M 3 3 L 3 27 L 10 21 L 16 31 L 21 28 L 14 18 L 25 18 Z"
        fill={C.white} stroke="#061725" strokeWidth={1.5}/>
    </svg>
    <div style={{position:'absolute',left:0,top:0,right:0,height:2,
      background:'linear-gradient(90deg,transparent,rgba(104,229,255,'+
        (.30+.35*busy)+'),transparent)'}}/>
  </div>;
};

const Gateway:React.FC<{reveal:number;blocked:number;worldFrame:number}>=
({reveal,blocked,worldFrame})=>{
  const beat=pulse(worldFrame,.027);
  return <div style={{
    position:'absolute',left:L.gateway.x,top:L.gateway.y,
    width:L.gateway.width,height:L.gateway.height,zIndex:8,
    ...border(blocked>.2?C.amber:'#5DCEE8',
      blocked>.2?'rgba(245,165,90,.25)':'rgba(42,176,223,.21)'),
    opacity:.18+.82*reveal,fontFamily:AT_FONT,padding:'25px 20px'
  }}>
    <div style={{color:C.white,fontSize:27,fontWeight:850,
      letterSpacing:'-.035em'}}>Gateway</div>
    <div style={{marginTop:8,color:C.soft,fontSize:16,fontWeight:680}}>
      Shared entry layer
    </div>
    <div style={{marginTop:18,height:1,background:'rgba(105,167,202,.34)'}}/>
    <div style={{display:'flex',alignItems:'center',gap:18,marginTop:23}}>
      <svg width={80} height={80} viewBox="0 0 80 80" style={{flexShrink:0}}>
        <circle cx={40} cy={40} r={30} fill="rgba(7,35,55,.32)"
          stroke={blocked>.2?C.amber:C.cyan} strokeWidth={3.5}
          opacity={.78+.2*beat}/>
        <path d="M 23 40 H 57 M 40 23 V 57" fill="none"
          stroke={blocked>.2?C.amber:C.mint} strokeWidth={3.2}
          strokeLinecap="round"/>
        {[0,1,2,3].map(i=><circle key={i}
          cx={[40,69,40,11][i]} cy={[11,40,69,40][i]}
          r={3.4} fill={blocked>.2?C.amber:C.mint}
          opacity={.38+.38*beat}/>)}
      </svg>
      <div style={{color:blocked>.2?C.amber:C.mint,
        fontWeight:830,fontSize:17,lineHeight:1.38}}>
        {blocked>.2?'REQUEST HELD':'REQUEST ROUTING'}
      </div>
    </div>
    <div style={{position:'absolute',bottom:20,left:20,right:20,
      fontSize:14,fontWeight:720,letterSpacing:'.035em',color:C.soft}}>
      {blocked>.2?'WAITING AT THE BOUNDARY':'THE PATH CONTINUES'}
    </div>
  </div>;
};

const ServerFleet:React.FC<{show:number;failover:number;worldFrame:number}>=
({show,failover,worldFrame})=>{
  const lit=clamp(failover)*(.6+.4*pulse(worldFrame,.018));
  return <>
    <div style={{
      position:'absolute',left:L.server.x,top:L.server.y,
      width:L.server.width,height:L.server.height,
      ...border('#5DCEE8','rgba(42,176,223,.15)'),
      zIndex:8,opacity:show,fontFamily:AT_FONT,padding:'20px 20px'
    }}>
      <div style={{fontSize:24,fontWeight:840,color:C.white,
        letterSpacing:'-.03em'}}>Server fleet</div>
      <div style={{fontSize:13,fontWeight:700,color:C.soft,marginTop:4}}>
        Remaining capacity
      </div>
      <div style={{height:1,background:'rgba(105,167,202,.28)',margin:'12px 0'}}/>
      {[0,1,2].map(i=><div key={i} style={{
        height:22,display:'flex',alignItems:'center',gap:10,
        borderBottom:'1px solid rgba(91,146,181,.24)'
      }}>
        <div style={{width:7,height:7,borderRadius:4,
          background:i===1&&lit>.48?C.amber:C.mint,
          opacity:i===1?.26+.7*lit:.55,
          boxShadow:'0 0 7px rgba(111,236,212,.2)'}}/>
        <div style={{width:[102,125,92][i],height:4,borderRadius:4,
          background:'rgba(109,163,197,.56)'}}/>
      </div>)}
    </div>
    <div style={{
      position:'absolute',left:L.otherServices.x,top:L.otherServices.y,
      width:L.otherServices.width,height:L.otherServices.height,
      zIndex:7,opacity:show*.68,
      ...border('#40718F','rgba(50,103,150,.08)'),
      fontFamily:AT_FONT,padding:'18px 20px'
    }}>
      <div style={{fontSize:22,fontWeight:820,color:C.white}}>Other services</div>
      <div style={{fontSize:16,fontWeight:650,color:C.soft,marginTop:12}}>
        Not all unavailable
      </div>
    </div>
  </>;
};

const Routes:React.FC<{
  state:ReturnType<typeof ep004Shot01Phase>
}>=({state})=>{
  const beat=pulse(state.worldFrame,.053);
  const routeColor=state.blocked>.16?C.amber:C.cyan;
  return <>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0,zIndex:3,pointerEvents:'none'}}>
      <defs>
        <linearGradient id="ep004V2Connector" x1="0" x2="1">
          <stop stopColor={C.cyan} stopOpacity={.74}/>
          <stop offset="1" stopColor={routeColor} stopOpacity={.92}/>
        </linearGradient>
      </defs>
      <polyline points={pathString(EP004_MAIL_ROUTE)} fill="none"
        stroke="#15394C" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={pathString(EP004_MAIL_ROUTE)} fill="none"
        stroke="url(#ep004V2Connector)" strokeWidth={3.8}
        strokeLinecap="round" strokeLinejoin="round" opacity={.65+.25*beat}/>
      <polyline points={pathString(EP004_STANDBY_ROUTE)} fill="none"
        stroke="#1D415D" strokeWidth={10} strokeLinecap="round"
        strokeLinejoin="round" opacity={state.showWorld*.72}/>
      <polyline points={pathString(EP004_STANDBY_ROUTE)} fill="none"
        stroke={C.mint} strokeWidth={3.2} strokeLinecap="round"
        strokeLinejoin="round" opacity={state.failover*.28}/>
    </svg>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0,zIndex:12,pointerEvents:'none'}}>
      <circle cx={state.request.x} cy={state.request.y} r={19}
        stroke={routeColor} strokeWidth={2.2} fill="none"
        opacity={.10+.25*beat}/>
      <circle cx={state.request.x} cy={state.request.y} r={8}
        fill={routeColor} stroke="#C7FBFF" strokeWidth={1.2}
        style={{filter:'drop-shadow(0 0 10px '+routeColor+')'}}/>
      {state.blocked>.01&&<circle cx={L.gateway.x} cy={EP004_MAIL_ROUTE[EP004_MAIL_ROUTE.length-1].y} r={33}
        stroke={C.amber} strokeWidth={2.2} fill="none"
        opacity={state.blocked*(.16+.22*beat)}/>}
    </svg>
  </>;
};

export const Ep004Shot01OrdinaryWorkday:React.FC<Ep004Shot01Props>=props=>{
  const frame=useCurrentFrame();
  const cfg=useVideoConfig();
  if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30
    ||cfg.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT01_REQUIRES_1080P_30FPS_MEASURED_DURATION');
  ep004Shot01Validate(props);
  const state=ep004Shot01Phase(frame,props);
  const press=clamp((state.routeProgress-.04)/.19);
  return <ATBackground>
    <ATControlledRealismLayer frame={state.worldFrame} realism={.85}
      architectureReveal={.96}/>
    <AbsoluteFill style={{pointerEvents:'none',
      background:'radial-gradient(ellipse at 39% 52%,rgba(21,82,121,.13),transparent 70%)'}}/>
    <ATCameraRig x={state.cameraX} y={0} scale={state.cameraScale}>
      <Routes state={state}/>
      <OutlookClient worldFrame={state.worldFrame} press={press}
        blocked={state.blocked}/>
      <Gateway worldFrame={state.worldFrame} blocked={state.blocked}
        reveal={.32+.68*state.showWorld}/>
      <ServerFleet worldFrame={state.worldFrame} show={state.showWorld}
        failover={state.failover}/>
    </ATCameraRig>
    {props.previewOnly&&<div style={{
      position:'absolute',right:54,bottom:42,pointerEvents:'none',
      fontFamily:AT_FONT,fontSize:18,fontWeight:720,color:C.soft,opacity:.76
    }}>EP004 SHOT01 / VISUAL PREVIEW / NOT DIRECTOR LOCKED</div>}
  </ATBackground>;
