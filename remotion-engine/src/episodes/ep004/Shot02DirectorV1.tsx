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
} from '../../components/architectural-thinking/EP004Shot01World.mjs';
import {ep004Shot02ProductionWorld,validateEp004Shot02Render}
  from '../../components/architectural-thinking/EP004Shot02ProductionWorld.mjs';
import type {Ep004Shot02RenderProps}
  from '../../components/architectural-thinking/EP004Shot02ProductionWorld.mjs';
import {
  atGlossaryTextWidth as shot10TextWidth,
  atGlossaryCardIsReadable as ep003CardIsReadable,
  atGlossaryCardOpacity as ep003CardOpacity
} from '../../components/architectural-thinking/ATReadableTermCardPolicy.mjs';

const CYAN='#68E5FF';
const MINT='#6FECD4';
const AMBER='#F5A55A';
const WHITE='#F5FCFF';

const FAILOVER_TITLE='FAILOVER';
const FAILOVER_LINES=[
  'Moving work to an alternative path',
  'when the original path cannot serve it'
] as const;
const FAILOVER_HOLD_FRAMES=240;
const FAILOVER_LEFT=560;
const FAILOVER_TOP=742;
const FAILOVER_HEIGHT=178;
const FAILOVER_PADDING=34;

const FailoverGlossaryCard:React.FC<{frame:number;start:number;duration:number}>=
  ({frame,start,duration})=>{
    const until=start+FAILOVER_HOLD_FRAMES;
    const definition=FAILOVER_LINES.join(' ');
    if(start<60||until>duration-45
        ||!ep003CardIsReadable(FAILOVER_TITLE,definition,start,until,30))
      throw Error('EP004_SHOT02_FAILOVER_GLOSSARY_TIMING_UNSAFE');
    if(frame<start||frame>=until)return null;
    const width=Math.ceil(Math.max(
      shot10TextWidth(FAILOVER_TITLE,23),
      ...FAILOVER_LINES.map(line=>shot10TextWidth(line,29))
    )+FAILOVER_PADDING*2+12);
    if(width<320||width>950||FAILOVER_LEFT+width>1510
        ||FAILOVER_TOP+FAILOVER_HEIGHT>1020)
      throw Error('EP004_SHOT02_FAILOVER_GLOSSARY_TEXT_OVERFLOW');
    const alpha=ep003CardOpacity(frame,start,until);
    return <div style={{position:'absolute',left:FAILOVER_LEFT,top:FAILOVER_TOP,
      width,height:FAILOVER_HEIGHT,boxSizing:'border-box',
      padding:'20px 34px',zIndex:23,
      borderRadius:17,border:'2px solid '+AMBER,
      background:'linear-gradient(120deg,rgba(10,32,50,.977),rgba(5,19,37,.988))',
      boxShadow:'0 13px 36px rgba(0,0,0,.33),0 0 18px rgba(89,202,232,.08)',
      opacity:alpha,pointerEvents:'none',fontFamily:AT_FONT,
      transform:'translateY('+((1-alpha)*5)+'px)'}}>
      <div style={{color:AMBER,fontSize:23,lineHeight:'29px',
        letterSpacing:'.015em',fontWeight:850,whiteSpace:'nowrap'}}>
        {FAILOVER_TITLE}
      </div>
      <div style={{color:WHITE,fontSize:29,lineHeight:'39px',fontWeight:900,
        marginTop:11,whiteSpace:'nowrap',letterSpacing:'-.01em'}}>
        {FAILOVER_LINES.map(line=><div key={line}>{line}</div>)}
      </div>
    </div>;
  };

export const Ep004Shot02DirectorV1:React.FC<Ep004Shot02RenderProps>=props=>{
  const frame=useCurrentFrame();
  const config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
      ||config.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT02_REQUIRES_1080P_30FPS_MEASURED_DURATION');
  validateEp004Shot02Render(props);
  const state=ep004Shot02ProductionWorld(frame,props);
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
          letterSpacing="-.02em" fill={WHITE}
          opacity={1-state.headerProgress}>
          AN ORDINARY WORKDAY STOPS
        </text>
        <text x={560} y={116} fontFamily={AT_FONT}
          fontSize={36} fontWeight={890}
          letterSpacing="-.02em" fill={WHITE}
          opacity={state.headerProgress}>
          {props.shotTitle.slice(0,58).toUpperCase()}
        </text>
        <path d="M 560 143 H 1260" stroke={CYAN}
          strokeWidth={2} opacity={.55}/>
      </svg>
    </div>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:25}}>
      <FailoverGlossaryCard frame={frame}
        start={props.failoverTermStartFrame} duration={props.durationInFrames}/>
    </AbsoluteFill>
    <div style={{position:'absolute',right:50,
      bottom:39,zIndex:90,color:'#9CBAC9',fontSize:15,
      opacity:state.headerProgress*.54,fontFamily:AT_FONT,fontWeight:740}}>
      EP004 / SHOT02 · DIRECTOR REVIEW CANDIDATE
    </div>
  </ATBackground>;
};
