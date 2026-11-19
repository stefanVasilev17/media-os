import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {ATStableServiceNodes} from '../../components/architectural-thinking/ATStableServiceNodes';
import {ATOutlookMailClient} from '../../components/architectural-thinking/ATOutlookMailClient';
import {SHOT02_AUTH_REPLICA_PORTS} from '../ep002/Shot02PressureVisuals';
import {
  EP004_MAIL_ROUTE,
  EP004_STANDBY_ROUTE,
  ep004RoutePolyline,
  ep004BezierPath,
  ep004Shot01Phase,
  ep004Shot01Validate
} from '../../components/architectural-thinking/EP004Shot01World.mjs';
import type {Ep004Shot01Props}
  from '../../components/architectural-thinking/EP004Shot01World.mjs';

const CYAN='#68E5FF';
const MINT='#6FECD4';
const AMBER='#F5A55A';
const WHITE='#F5FCFF';

export const Ep004Shot01OrdinaryWorkday:React.FC<Ep004Shot01Props>=props=>{
  const frame=useCurrentFrame();
  const config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
      ||config.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT01_REQUIRES_1080P_30FPS_MEASURED_DURATION');
  ep004Shot01Validate(props);
  const state=ep004Shot01Phase(frame,props);
  const camera='translate3d('+state.cameraX+'px,0,0) scale('+state.cameraScale+')';
  const pathPulse=.55+.45*Math.sin(state.worldFrame*.052)**2;
  const ambient=.2+.8*state.showWorld;
  const waiting=state.blocked;
  const failover=state.failover;
  return <ATBackground>
    <AbsoluteFill style={{pointerEvents:'none',
      background:'radial-gradient(ellipse at 53% 42%,rgba(20,65,110,.13),transparent 70%)'}}/>
    <div style={{position:'absolute',inset:0,
      transform:camera,transformOrigin:'960px 540px',
      overflow:'hidden',pointerEvents:'none'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080"
        style={{position:'absolute',inset:0,zIndex:3,
          overflow:'visible',pointerEvents:'none'}}>
        <path d="M 779 532 L 804 532" stroke="#2E657F"
          strokeWidth={10} strokeLinecap="round" opacity={ambient*.72}/>
        <path d="M 779 532 L 804 532" stroke={CYAN}
          strokeWidth={3.6} strokeLinecap="round" opacity={ambient*.72}/>
        {SHOT02_AUTH_REPLICA_PORTS.slice(0,2).map((port,i)=><path
          key={port.id}
          d={ep004BezierPath([
            {x:1050,y:535},{x:1090,y:535},
            {x:1137,y:port.y},{x:1192,y:port.y}
          ])}
          fill="none" stroke={i===0?CYAN:MINT}
          strokeWidth={3.1} strokeLinecap="round"
          opacity={ambient*(.18+.16*failover)}/>)}
        <polyline points={ep004RoutePolyline(EP004_MAIL_ROUTE)}
          fill="none" stroke="#204A63" strokeWidth={11}
          strokeLinejoin="round" strokeLinecap="round"/>
        <polyline points={ep004RoutePolyline(EP004_MAIL_ROUTE)}
          fill="none" stroke={waiting>.3?AMBER:CYAN}
          strokeWidth={3.8} strokeLinejoin="round"
          strokeLinecap="round" opacity={.7+.20*pathPulse}/>
        <path d={ep004BezierPath(EP004_STANDBY_ROUTE)}
          fill="none" stroke="#1B405E" strokeWidth={10}
          strokeLinecap="round"
          opacity={ambient*.8}/>
        <path d={ep004BezierPath(EP004_STANDBY_ROUTE)}
          fill="none" stroke={MINT} strokeWidth={3.4}
          strokeLinecap="round"
          opacity={ambient*(.07+.77*failover)}/>
      </svg>
      <div style={{
        position:'absolute',inset:0,zIndex:9,
        opacity:ambient,transition:'none'
      }}>
        <ATStableServiceNodes
          frame={state.worldFrame}
          blocked={waiting}
          failover={failover}
          serviceTitle="Outlook Service"
          requestLabel="MAIL REQUESTS"
          instanceLabel="SERVER"
          showOtherServices={state.question}/>
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080"
        style={{position:'absolute',inset:0,zIndex:13,
          pointerEvents:'none',overflow:'visible',fontFamily:AT_FONT}}>
        <ATOutlookMailClient
          openProgress={state.mailOpen}
          blocked={waiting} frame={state.worldFrame}/>
        <circle cx={state.request.x} cy={state.request.y}
          r={8} fill={state.requestStatus==='WAITING'?AMBER:CYAN}
          opacity={.7+.3*pathPulse}
          style={{filter:'drop-shadow(0 0 10px rgba(104,229,255,.72))'}}/>
        <circle cx={state.request.x} cy={state.request.y}
          r={17} fill="none"
          stroke={state.requestStatus==='WAITING'?AMBER:CYAN}
          strokeWidth={2} opacity={.13+.32*pathPulse}/>
        {state.secondaryVisible&&<g opacity={state.secondaryOpacity}>
          <circle cx={state.secondary.x} cy={state.secondary.y}
            r={6} fill={MINT}
            style={{filter:'drop-shadow(0 0 9px rgba(111,236,212,.76))'}}/>
        </g>}
        {waiting>.03&&<circle cx={521} cy={532} r={24}
          stroke={AMBER} strokeWidth={2.4} fill="none"
          opacity={waiting*(.13+.27*pathPulse)}/>}
        <text x={560} y={116} fontFamily={AT_FONT}
          fontSize={38} fontWeight={890}
          letterSpacing="-.02em" fill={WHITE}>
          AN ORDINARY WORKDAY STOPS
        </text>
        <path d="M 560 143 H 1260" stroke={CYAN}
          strokeWidth={2} opacity={.55}/>
      </svg>
    </div>
    {props.previewOnly&&<div style={{position:'absolute',right:50,
      bottom:39,zIndex:90,color:'#ACC7D9',fontSize:18,
      fontFamily:AT_FONT,fontWeight:740}}>
      EP004 / SHOT01 · VISUAL-ONLY STORYBOARD · NOT DIRECTOR LOCKED
    </div>}
  </ATBackground>;
};
