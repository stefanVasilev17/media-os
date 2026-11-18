import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {
  EP004_MAIL_ROUTE,EP004_STANDBY_ROUTE,ep004RoutePolyline,
  ep004Shot01Phase,ep004Shot01Validate
} from '../../components/architectural-thinking/EP004Shot01World.mjs';
import type {Ep004Shot01Props} from '../../components/architectural-thinking/EP004Shot01World.mjs';

const C={
  cyan:'#68E5FF',mint:'#68EDCA',white:'#F4F9FF',muted:'#A6C2D7',
  amber:'#F7BB78',dark:'#071727',line:'#3C6388'
};
const pct=(v:number)=>Math.max(0,Math.min(1,v));
const glow=(color:string,strength:number)=>`0 0 ${10+25*strength}px ${color}`;
const points=(route:typeof EP004_MAIL_ROUTE)=>ep004RoutePolyline(route);

const Mailbox:React.FC<{frame:number;blocked:number;reveal:number}>=
({frame,blocked,reveal})=>{
  const focus=.7+.3*Math.sin(frame*.05);
  const buttonActive=pct((frame-70)/35);
  return <g opacity={.98}>
    <rect x={170} y={283} width={424} height={476} rx={30}
      fill="#061725" stroke="#477EA7" strokeWidth={2}
      style={{filter:'drop-shadow(0 12px 24px rgba(0,0,0,.4))'}}/>
    <rect x={194} y={307} width={376} height={64} rx={13}
      fill="#123853"/>
    <text x={225} y={351} fill={C.white} fontFamily={AT_FONT}
      fontSize={34} fontWeight={790}>Outlook</text>
    <path d="M 194 396 H 568" stroke="#274F70" strokeWidth={2}/>
    <text x={225} y={428} fill={C.white} fontFamily={AT_FONT}
      fontSize={26} fontWeight={760}>Inbox</text>
    {[0,1,2,3].map(i=><g key={i} opacity={i===0?1:.65}>
      <rect x={211} y={461+i*57} width={340} height={48} rx={9}
        fill={i===0?'#11344F':'#0C2338'}
        stroke={i===0?'#39769C':'#1F435C'} strokeWidth={1.2}/>
      <circle cx={236} cy={485+i*57} r={5.5}
        fill={i===0?C.mint:'#7095B5'}/>
      <path d={`M 254 ${477+i*57} H ${i===2?427:495}`}
        stroke="#AACCE2" strokeWidth={5} strokeLinecap="round"/>
      <path d={`M 254 ${491+i*57} H ${i===1?395:456}`}
        stroke="#416A8A" strokeWidth={4} strokeLinecap="round"/>
    </g>)}
    <rect x={214} y={697} width={154} height={43} rx={12}
      fill={buttonActive>.2?'#126E73':'#18506D'}
      stroke={buttonActive>.2?C.mint:C.cyan} strokeWidth={1.7}/>
    <text x={258} y={725} fill={C.white} fontFamily={AT_FONT}
      fontSize={22} fontWeight={730}>Open</text>
    <path d={`M ${370+7*focus} ${721-buttonActive*14}
       l 0 26 l 8 -8 l 9 14 l 5 -4 l -9 -13 l 10 0 Z`}
      fill={C.white} opacity={.9} stroke="#081C2B" strokeWidth={1.2}/>
    <rect x={170} y={283} width={424} height={476} rx={30}
      stroke={blocked>.4?C.amber:C.cyan}
      strokeWidth={2.5} fill="none" opacity={.18+.19*reveal}/>
    <text x={205} y={794} fill={C.muted} fontFamily={AT_FONT}
      fontSize={21} opacity={.72}>One mailbox request</text>
  </g>;
};

const Gateway:React.FC<{reveal:number;blocked:number;worldFrame:number}>=
({reveal,blocked,worldFrame})=>{
  const pulse=(Math.sin(worldFrame*.029)+1)*.5;
  return <g opacity={.22+.78*reveal}>
    <rect x={1076} y={396} width={290} height={275} rx={27}
      fill="#081D30" stroke={blocked>.18?C.amber:C.cyan}
      strokeWidth={2.4} opacity={.95}/>
    <text x={1102} y={458} fill={C.white} fontFamily={AT_FONT}
      fontSize={28} fontWeight={770}>Gateway</text>
    <text x={1102} y={491} fill={C.muted} fontFamily={AT_FONT}
      fontSize={20}>Connection boundary</text>
    <path d="M 1102 517 H 1336" stroke="#416782" strokeWidth={2}/>
    <circle cx={1220} cy={579} r={26}
      fill="none" stroke={blocked>.2?C.amber:C.cyan}
      strokeWidth={4} opacity={.55+.35*pulse}/>
    <path d="M 1207 579 H 1233 M 1220 566 V 592"
      stroke={blocked>.2?C.amber:C.cyan} strokeWidth={3.4}
      strokeLinecap="round" opacity={.7}/>
    <text x={1118} y={639} fill={C.muted} fontFamily={AT_FONT}
      fontSize={20}>Routing decision</text>
  </g>;
};

const Server:React.FC<{show:number;failover:number;worldFrame:number}>=
({show,failover,worldFrame})=>{
  const pulse=(1+Math.sin(worldFrame*.016))*.5;
  const light=pct(failover*(.54+.45*pulse));
  return <g opacity={show}>
    <rect x={1520} y={397} width={250} height={204} rx={24}
      fill="#091E30" stroke={light>.6?C.mint:C.line} strokeWidth={2}/>
    <text x={1548} y={456} fill={C.white}
      fontFamily={AT_FONT} fontSize={25} fontWeight={760}>
      Server fleet
    </text>
    {[0,1,2].map(i=><g key={i}>
      <rect x={1546} y={478+i*31} width={198} height={23} rx={7}
        fill="#0E2A40" stroke="#285373" strokeWidth={1.2}/>
      <circle cx={1570} cy={489+i*31} r={4.5}
        fill={i===1&&light>.30?C.amber:C.mint}
        opacity={i===1?light*.75:.30}/>
      <path d={`M 1588 ${489+i*31} H 1707`} stroke="#537B9C"
        strokeWidth={3} strokeLinecap="round"/>
    </g>)}
    <rect x={1520} y={686} width={250} height={121} rx={21}
      fill="#081725" stroke="#274B66" strokeWidth={1.7}/>
    <text x={1546} y={734} fill={C.muted} fontFamily={AT_FONT}
      fontSize={22} fontWeight={700}>Other services</text>
    <text x={1546} y={768} fill="#7698B0"
      fontFamily={AT_FONT} fontSize={20}>Not all unavailable</text>
  </g>;
};

export const Ep004Shot01OrdinaryWorkday:React.FC<Ep004Shot01Props>=props=>{
  const frame=useCurrentFrame();
  const cfg=useVideoConfig();
  if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30
     ||cfg.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT01_REQUIRES_1080P_30FPS_MEASURED_DURATION');
  ep004Shot01Validate(props);
  const state=ep004Shot01Phase(frame,props);
  const camera=`translate(${state.cameraX} 0) translate(960 540)
    scale(${state.cameraScale}) translate(-960 -540)`;
  const blocked=state.blocked;
  const pulse=.53+.47*Math.sin(state.worldFrame*.055)**2;
  return <ATBackground>
    <AbsoluteFill style={{pointerEvents:'none',
      background:'radial-gradient(ellipse at 44% 49%,rgba(25,71,116,.16),transparent 68%)'}}/>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0,overflow:'hidden',
        fontFamily:AT_FONT}}>
      <defs>
        <linearGradient id="ep004MainPath" x1="0" x2="1">
          <stop stopColor={C.cyan} stopOpacity={.46}/>
          <stop offset="1" stopColor={blocked>.15?C.amber:C.cyan}
            stopOpacity={.78}/>
        </linearGradient>
        <radialGradient id="ep004Halo">
          <stop stopColor={C.cyan} stopOpacity={.14}/>
          <stop offset="1" stopColor={C.cyan} stopOpacity={0}/>
        </radialGradient>
      </defs>
      <g transform={camera}>
        <ellipse cx={925} cy={518} rx={720} ry={310} fill="url(#ep004Halo)"
          opacity={.25+.20*state.showWorld}/>
        <polyline points={points(EP004_MAIL_ROUTE)} fill="none"
          stroke="#163953" strokeWidth={13} strokeLinecap="round"
          strokeLinejoin="round"/>
        <polyline points={points(EP004_MAIL_ROUTE)} fill="none"
          stroke="url(#ep004MainPath)" strokeWidth={3.6}
          strokeLinecap="round" strokeLinejoin="round"
          opacity={.54+.30*pulse}/>
        <polyline points={points(EP004_STANDBY_ROUTE)} fill="none"
          stroke="#1D415D" strokeWidth={11} strokeLinecap="round"
          strokeLinejoin="round" opacity={state.showWorld*.7}/>
        <polyline points={points(EP004_STANDBY_ROUTE)} fill="none"
          stroke={C.mint} strokeWidth={3.1} strokeLinecap="round"
          strokeLinejoin="round"
          opacity={state.failover*.37+.06*state.showWorld}/>
        <Mailbox frame={frame} blocked={blocked} reveal={state.showWorld}/>
        <Gateway reveal={.35+.65*state.showWorld}
          blocked={blocked} worldFrame={state.worldFrame}/>
        <Server show={state.showWorld} failover={state.failover}
          worldFrame={state.worldFrame}/>
        <circle cx={state.request.x} cy={state.request.y}
          r={8} fill={state.requestStatus==='WAITING'?C.amber:C.cyan}
          style={{filter:`drop-shadow(${glow(state.requestStatus==='WAITING'?C.amber:C.cyan,.55)})`}}/>
        <circle cx={state.request.x} cy={state.request.y} r={17}
          fill="none" stroke={state.requestStatus==='WAITING'?C.amber:C.cyan}
          strokeWidth={2} opacity={.18+.24*pulse}/>
        {state.secondaryVisible&&<circle cx={state.secondary.x}
          cy={state.secondary.y} r={6} fill={C.mint}
          opacity={state.failover*.75}/>}
        {blocked>.01&&<circle cx={1076} cy={536} r={30}
          fill="none" stroke={C.amber} strokeWidth={2.5}
          opacity={blocked*(.24+.19*pulse)}/>}
      </g>
    </svg>
    {props.previewOnly&&<div style={{
      position:'absolute',bottom:45,right:57,
      fontFamily:AT_FONT,fontWeight:750,fontSize:20,
      color:'#AFCBE0',letterSpacing:'.05em',opacity:.8}}>
      EP004 / SHOT01 · VISUAL-ONLY STORYBOARD · NOT DIRECTOR LOCKED
    </div>}
  </ATBackground>;
};
