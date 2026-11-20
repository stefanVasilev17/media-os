import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {ATStableServiceNodes} from '../../components/architectural-thinking/ATStableServiceNodes';
import {ATOutlookMailClient} from '../../components/architectural-thinking/ATOutlookMailClient';
import {
  EP004_MAIL_ROUTE,
  EP004_STANDBY_ROUTE,
  EP004_HANDOFF_ROUTE,
  EP004_SPILLOVER_ROUTE,
  EP004_DEGRADED_ROUTE,
  EP004_LOCKED_EP003_SERVICE_PORTS,
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
        <polyline points={ep004RoutePolyline(EP004_HANDOFF_ROUTE)}
          fill="none" stroke="#2E657F"
          strokeWidth={10} strokeLinecap="round" opacity={ambient*.72}/>
        <polyline points={ep004RoutePolyline(EP004_HANDOFF_ROUTE)}
          fill="none" stroke={CYAN}
          strokeWidth={3.6} strokeLinecap="round"
          opacity={ambient*(.17+.62*failover)}/>
        {EP004_LOCKED_EP003_SERVICE_PORTS.slice(0,2).map((portY,i)=><path
          key={portY}
          d={i===1?ep004BezierPath(EP004_SPILLOVER_ROUTE):
            ep004BezierPath([
              {x:1050,y:535},{x:1090,y:535},
              {x:1137,y:portY},{x:1192,y:portY}
            ])}
          fill="none" stroke={i===0?CYAN:MINT}
          strokeWidth={3.1} strokeLinecap="round"
          opacity={ambient*(i===0?.16*(1-.65*failover):
            .10+.72*state.spillover)}/>)}
        <path d={ep004BezierPath(EP004_DEGRADED_ROUTE)}
          fill="none" stroke={AMBER} strokeLinecap="round"
          strokeWidth={3.2+state.tension*1.9}
          opacity={ambient*state.tension*(.70-.45*failover)}/>
        <path d={ep004BezierPath(EP004_STANDBY_ROUTE)}
          fill="none" stroke={MINT} strokeLinecap="round"
          strokeWidth={7.0} pathLength={1}
          strokeDasharray={String(.001+.72*failover)+' 1'}
          opacity={ambient*.82*failover}
          style={{filter:'drop-shadow(0 0 6px rgba(111,236,212,.56))'}}/>
        <path d={ep004BezierPath(EP004_SPILLOVER_ROUTE)}
          fill="none" stroke={MINT} strokeLinecap="round"
          strokeWidth={6.0} pathLength={1}
          strokeDasharray={String(.001+.72*state.spillover)+' 1'}
          opacity={ambient*.77*state.spillover}
          style={{filter:'drop-shadow(0 0 6px rgba(111,236,212,.48))'}}/>
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
          tension={state.tension}
          failover={failover}
          spillover={state.spillover}
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
          actionProgress={state.mailAttempt}
          blocked={waiting} frame={state.worldFrame}/>
        {state.diagnostics.map(signal=><g key={signal.id}
          opacity={signal.opacity}>
          <circle cx={signal.x} cy={signal.y} r={5.7}
            fill="none" stroke={AMBER} strokeWidth={2.3}
            style={{filter:'drop-shadow(0 0 7px rgba(245,165,90,.75))'}}/>
          <circle cx={signal.x} cy={signal.y} r={1.8}
            fill={AMBER}/>
        </g>)}
        {state.traffic.map(token=>{
          const color=token.status==='QUEUED'||token.status==='WAITING'
            ?AMBER:token.lane==='STANDBY'||token.lane==='SPILLOVER'
              ?MINT:CYAN;
          return <g key={token.id} opacity={token.opacity}>
            <circle cx={token.x} cy={token.y}
              r={token.radius} fill={color}
              style={{filter:'drop-shadow(0 0 5px '+color+')'}}/>
            {token.status==='ROUTED'&&<circle
              cx={token.x} cy={token.y}
              r={token.radius+5.5} fill="none" stroke={MINT}
              strokeWidth={1.25} opacity={.17+.24*failover}/>}
            {token.id==='mail-primary'&&<circle
              cx={token.x} cy={token.y} r={token.radius+8}
              fill="none" stroke={color} strokeWidth={1.4}
              opacity={.18+.19*pathPulse}/>}
          </g>;
        })}
        {waiting>.03&&<circle cx={521} cy={532} r={17}
          stroke={AMBER} strokeWidth={1.5} fill="none"
          opacity={waiting*(.12+.10*pathPulse)}/>}
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
