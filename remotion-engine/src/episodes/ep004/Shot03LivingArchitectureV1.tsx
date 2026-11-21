import React from 'react';
import {useCurrentFrame,useVideoConfig,AbsoluteFill} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {ATStableServiceNodes} from '../../components/architectural-thinking/ATStableServiceNodes';
import {ATOutlookMailClient} from '../../components/architectural-thinking/ATOutlookMailClient';
import {
  EP004_MAIL_ROUTE,EP004_HANDOFF_ROUTE,EP004_STANDBY_ROUTE,
  EP004_SPILLOVER_ROUTE,EP004_DEGRADED_ROUTE,
  ep004RoutePolyline,ep004BezierPath
} from '../../components/architectural-thinking/EP004Shot01World.mjs';
import {
  EP004_SHOT03_ROUTES,EP004_SHOT03_NODES,
  validateEp004Shot03Storyboard,ep004Shot03StoryboardWorld
} from '../../components/architectural-thinking/EP004Shot03LivingWorld.mjs';
import type {Ep004Shot03StoryboardProps,Ep004Shot03StoryboardState}
  from '../../components/architectural-thinking/EP004Shot03LivingWorld.mjs';

const CYAN='#68E5FF',VIOLET='#B49BFF',MINT='#6FECD4';
const AMBER='#F5A55A',WHITE='#F5FCFF',SECONDARY='#B1CDDF';
const GatewayShapes:React.FC<{
  reveal:number;redirect:number;sharedLoad:number;july:number;worldFrame:number;
}>=({reveal,redirect,sharedLoad,july,worldFrame})=>{
  const p=EP004_SHOT03_NODES.primary,a=EP004_SHOT03_NODES.alternative;
  const primaryGlow=.35+.65*Math.sin(worldFrame*.029)**2;
  const primaryOutline=['M',p.left+20,p.top,'H',p.left+p.width-20,
    'L',p.left+p.width,p.top+21,'V',p.top+p.height-21,
    'L',p.left+p.width-20,p.top+p.height,'H',p.left+20,
    'L',p.left,p.top+p.height-21,'V',p.top+21,'Z'].join(' ');
  const alternativeOutline=['M',a.left+30,a.top,'H',a.left+a.width-30,
    'Q',a.left+a.width,a.top,a.left+a.width,a.top+29,
    'V',a.top+a.height-29,'Q',a.left+a.width,a.top+a.height,
    a.left+a.width-30,a.top+a.height,'H',a.left+30,
    'Q',a.left,a.top+a.height,a.left,a.top+a.height-29,
    'V',a.top+29,'Q',a.left,a.top,a.left+30,a.top,'Z'].join(' ');
  return <g opacity={reveal} fontFamily={AT_FONT}>
    <path d={primaryOutline} fill="#071E32" stroke={CYAN} strokeWidth={2.7}
      style={{filter:'drop-shadow(0 0 13px rgba(75,195,248,.18))'}}/>
    <path d={'M '+(p.left+25)+' '+(p.top+12)+' H '+(p.left+p.width-25)}
      stroke={CYAN} strokeWidth={1.7} opacity={.30+.19*primaryGlow}/>
    <text x={p.left+27} y={p.top+46} fontSize={24} fontWeight={850}
      fill={WHITE}>Primary Gateway</text>
    <text x={p.left+27} y={p.top+73} fontSize={17} fontWeight={650}
      fill={SECONDARY}>Connection entry layer</text>
    <g opacity={1-july}>
      <text x={p.left+27} y={p.top+96} fontSize={14} fontWeight={750}
        fill={SECONDARY}>WORKLOAD MIX</text>
      <rect x={p.left+27} y={p.top+106} width={204} height={10}
        rx={5} fill="#1E3A57"/>
      <rect x={p.left+27} y={p.top+106} width={204-67*sharedLoad}
        height={10} rx={5} fill={CYAN}/>
      <rect x={p.left+231-67*sharedLoad} y={p.top+106}
        width={67*sharedLoad} height={10} rx={5} fill={VIOLET}/>
      <circle cx={p.left+236} cy={p.top+35} r={5} fill={MINT}
        opacity={.5+.5*primaryGlow}/>
    </g>
    <g opacity={july}>
      <path d={'M '+(p.left+27)+' '+(p.top+99)+' H '+(p.left+230)}
        stroke={AMBER} strokeWidth={1.3} opacity={.7}/>
      <text x={p.left+29} y={p.top+125} fontSize={19}
        fontWeight={850} fill={AMBER}>JULY GATEWAY UPDATE</text>
    </g>
    <path d={alternativeOutline} fill="#151D3A"
      stroke={VIOLET} strokeWidth={2.6} opacity={1-.30*redirect}/>
    <path d={'M '+(a.left+30)+' '+(a.top+14)+' H '+(a.left+a.width-30)}
      stroke={VIOLET} strokeWidth={1.5} opacity={.38}/>
    <text x={a.left+24} y={a.top+47} fontSize={23} fontWeight={850}
      fill={WHITE}>Alternative Gateway</text>
    <text x={a.left+24} y={a.top+76} fontSize={17} fontWeight={670}
      fill={SECONDARY}>Separate gateway system</text>
    <circle cx={a.left+a.width-25} cy={a.top+96} r={4.5}
      fill={MINT} opacity={.85-.25*redirect}/>
    {[
      {key:'mailbox',label:'Exchange Online',detail:'Mailbox service',color:CYAN},
      {key:'teams',label:'Microsoft Teams',detail:'Teams service',color:VIOLET},
    ].map(({key,label,detail,color})=>{
      const n=EP004_SHOT03_NODES[key];
      return <g key={key}>
        <rect x={n.left} y={n.top} width={n.width} height={n.height}
          rx={16} stroke={color} strokeWidth={2} fill="#081C31" opacity={.94}/>
        <path d={'M '+(n.left+18)+' '+(n.top+17)+' H '+(n.left+58)}
          stroke={color} strokeWidth={3} strokeLinecap="round"/>
        <text x={n.left+18} y={n.top+51} fontSize={22}
          fill={WHITE} fontWeight={840}>{label}</text>
        <text x={n.left+18} y={n.top+77} fontSize={16}
          fill={SECONDARY} fontWeight={620}>{detail}</text>
      </g>;
    })}
  </g>;
};

export const Shot03LivingArchitectureWorldView:React.FC<{
  state:Ep004Shot03StoryboardState;showStoryboardFooter:boolean
}>=({state,showStoryboardFooter})=>{
  const previous=state.originalState;
  const zoom='translate3d('+state.cameraX+'px,0,0) scale('+state.cameraScale+')';
  const phaseGlow=.68+.32*Math.sin(state.worldFrame*.048)**2;
  return <ATBackground>
    <AbsoluteFill style={{pointerEvents:'none',
      background:'radial-gradient(ellipse at 52% 45%,rgba(20,65,110,.13),transparent 69%)'}}/>
    <div style={{position:'absolute',inset:0,overflow:'hidden',
      transform:zoom,transformOrigin:'960px 540px',pointerEvents:'none'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080"
        style={{position:'absolute',inset:0,zIndex:3,overflow:'visible'}}>
        <g opacity={state.originalOpacity}>
          <polyline points={ep004RoutePolyline(EP004_MAIL_ROUTE)}
            fill="none" stroke="#204A63" strokeWidth={11} strokeLinecap="round"/>
          <polyline points={ep004RoutePolyline(EP004_MAIL_ROUTE)}
            fill="none" stroke={AMBER} strokeWidth={3.8} opacity={.8}/>
          <polyline points={ep004RoutePolyline(EP004_HANDOFF_ROUTE)}
            fill="none" stroke={CYAN} strokeWidth={3.6} opacity={.6}/>
          <path d={ep004BezierPath(EP004_DEGRADED_ROUTE)}
            fill="none" stroke={AMBER} strokeWidth={4} opacity={.6}/>
          <path d={ep004BezierPath(EP004_STANDBY_ROUTE)}
            fill="none" stroke={MINT} strokeWidth={3.5} opacity={.8}/>
          <path d={ep004BezierPath(EP004_SPILLOVER_ROUTE)}
            fill="none" stroke={MINT} strokeWidth={3.5} opacity={.63}/>
        </g>
        <g opacity={state.gatewayReveal}>
          {Object.entries(EP004_SHOT03_ROUTES).map(([key,points])=>{
            const redirected=key==='TEAMS_FAILOVER'||key==='PRIMARY_TEAMS';
            const alternative=key==='TEAMS_ALTERNATIVE'||key==='ALTERNATIVE_TEAMS';
            const violet=key!=='OUTLOOK_PRIMARY'&&key!=='PRIMARY_MAILBOX';
            const opacity=redirected ? .13+.82*state.redirect :
              alternative ? .85*(1-state.redirect):.75;
            return <g key={key} opacity={opacity}>
              <path d={ep004BezierPath(points)} fill="none"
                stroke={violet?'#253454':'#1B4A60'}
                strokeWidth={10} strokeLinecap="round"/>
              <path d={ep004BezierPath(points)} fill="none"
                stroke={violet?VIOLET:CYAN}
                strokeWidth={redirected?4.5:3.8} strokeLinecap="round"
                opacity={.62+.28*phaseGlow}
                style={redirected?{filter:'drop-shadow(0 0 6px rgba(180,155,255,.36))'}:{}}/>
            </g>;
          })}
        </g>
      </svg>
      <div style={{position:'absolute',inset:0,zIndex:9,
        opacity:state.originalOpacity,pointerEvents:'none'}}>
        <ATStableServiceNodes frame={state.worldFrame}
          blocked={previous.blocked} tension={previous.tension}
          failover={previous.failover} spillover={previous.spillover}
          serviceTitle="Outlook Service" requestLabel="MAIL REQUESTS"
          instanceLabel="SERVER" showOtherServices={previous.question}/>
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080"
        style={{position:'absolute',inset:0,zIndex:13,
          pointerEvents:'none',overflow:'visible',fontFamily:AT_FONT}}>
        <ATOutlookMailClient frame={state.worldFrame}
          openProgress={previous.mailOpen} actionProgress={previous.mailAttempt}
          blocked={previous.blocked*state.originalOpacity}/>
        <g opacity={state.originalOpacity}>
          {previous.traffic.map(token=><circle key={token.id}
            cx={token.x} cy={token.y} r={token.radius}
            fill={token.status==='QUEUED'||token.status==='WAITING'?AMBER:
              token.lane==='STANDBY'||token.lane==='SPILLOVER'?MINT:CYAN}
            opacity={token.opacity}/>)}
          {previous.diagnostics.map(s=><circle key={s.id}
            cx={s.x} cy={s.y} r={5} stroke={AMBER}
            strokeWidth={2.4} fill="none" opacity={s.opacity}/>)}
        </g>
        <GatewayShapes reveal={state.gatewayReveal}
          redirect={state.redirect} sharedLoad={state.sharedLoad}
          july={state.julyMarker} worldFrame={state.worldFrame}/>
        <g opacity={state.gatewayReveal}>
          <path d="M 572 696 L 589 686 L 606 696 L 589 706 Z"
            fill={VIOLET} stroke="#DDD0FF" strokeWidth={1.7}/>
          <text x={589} y={730} textAnchor="middle" fill={VIOLET}
            fontSize={18} fontWeight={790}>TEAMS</text>
          {state.tokens.map(t=><g key={t.id} opacity={t.opacity}>
            <circle cx={t.x} cy={t.y} r={t.radius}
              fill={t.color==='VIOLET'?VIOLET:CYAN}
              style={{filter:'drop-shadow(0 0 6px '+(t.color==='VIOLET'?VIOLET:CYAN)+')'}}/>
          </g>)}
          <text x={560} y={210} fill={SECONDARY}
            fontSize={18} fontWeight={650} opacity={.73}>
            CONCEPTUAL ARCHITECTURE
          </text>
          <text x={900} y={590} fill={VIOLET}
            fontSize={20} fontWeight={860} opacity={state.utcStamp}>
            01:07 UTC · TEAMS ROUTE CHANGE
          </text>
        </g>
        <text x={560} y={116} fill={WHITE} fontSize={35}
          fontWeight={890} letterSpacing="-.02em" opacity={state.originalOpacity}>
          THE PROMISE OF FAILOVER
        </text>
        <text x={560} y={116} fill={WHITE} fontSize={32}
          fontWeight={890} letterSpacing="-.02em" opacity={state.gatewayReveal}>
          TWO GATEWAY SYSTEMS, ONE SHARED PRESSURE
        </text>
        <path d="M 560 143 H 1260" stroke={CYAN} strokeWidth={2} opacity={.55}/>
      </svg>
    </div>
    {showStoryboardFooter&&<div style={{position:'absolute',right:49,bottom:38,zIndex:80,
      color:'#9CBAC9',fontSize:14,fontWeight:720,fontFamily:AT_FONT,opacity:.78}}>
      EP004 / SHOT03 · MOVING STORYBOARD · NO APPROVED VOICE OR SEAM QA
    </div>}
  </ATBackground>;
};

export const Shot03LivingArchitectureV1:React.FC<Ep004Shot03StoryboardProps>=props=>{
  const frame=useCurrentFrame(),config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
      ||config.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT03_REQUIRES_1080P_30FPS_PREVIEW');
  validateEp004Shot03Storyboard(props);
  const state=ep004Shot03StoryboardWorld(frame,props);
  return <Shot03LivingArchitectureWorldView state={state} showStoryboardFooter/>;
};
