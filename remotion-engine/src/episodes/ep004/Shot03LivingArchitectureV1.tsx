import React from 'react';
import {useCurrentFrame,useVideoConfig,AbsoluteFill} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {ATStableServiceNodes} from '../../components/architectural-thinking/ATStableServiceNodes';
import {ATOutlookMailClient} from '../../components/architectural-thinking/ATOutlookMailClient';
import {atGlossaryTextWidth} from '../../components/architectural-thinking/ATReadableTermCardPolicy.mjs';
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
const GATEWAY_TEXT_CONTENT_FIT=[
  ['Primary',22,206],['Gateway',22,206],['Entry and routing',16,206],
  ['Alternative',22,212],['Independent route',16,212],
  ['WORKLOAD MIX',16,206],['JULY',17,206],['GATEWAY UPDATE',19,206],
  ['Exchange',20,173],['Online',20,173],
  ['Teams',21,132],['Microsoft',15,132]
] as const;
for(const [label,size,availableWidth] of GATEWAY_TEXT_CONTENT_FIT)
  if(atGlossaryTextWidth(label,size)>availableWidth)
    throw Error('SHOT03_GATEWAY_TEXT_MUST_FIT_INSIDE_NODE: '+label);

const TeamsAppIcon:React.FC<{x:number;y:number;size:number}>=({x,y,size})=>
  <g transform={'translate('+x+' '+y+') scale('+(size/64)+')'}
    aria-label="Microsoft Teams app icon">
    <circle cx="50" cy="18" r="11" fill="#7B83EB"/>
    <path d="M39 30 H61 V42 C61 51 56 56 49 56 C42 56 38 52 38 45 Z"
      fill="#7B83EB"/>
    <circle cx="37" cy="16" r="13" fill="#5059C9"/>
    <path d="M21 29 H51 V44 C51 54 44 60 35 60 C26 60 20 54 20 44 Z"
      fill="#5059C9"/>
    <rect x="3" y="19" width="35" height="36" rx="5" fill="#464EB8"
      style={{filter:'drop-shadow(0 3px 4px rgba(0,0,0,.22))'}}/>
    <path d="M12 28 H30 V33 H24 V47 H18 V33 H12 Z" fill={WHITE}/>
  </g>;

const GatewayShapes:React.FC<{
  reveal:number;redirect:number;sharedLoad:number;julyCallout:number;worldFrame:number;
  primaryFocus:number;alternativeFocus:number;
}>=({reveal,redirect,sharedLoad,julyCallout,worldFrame,
    primaryFocus,alternativeFocus})=>{
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
    <path d={primaryOutline} fill="#071E32" stroke={CYAN}
      strokeWidth={2.5+1.35*primaryFocus} opacity={.64+.36*primaryFocus}
      style={{filter:'drop-shadow(0 0 '+(9+12*primaryFocus)+'px rgba(75,195,248,.39))'}}/>
    <path d={'M '+(p.left+25)+' '+(p.top+12)+' H '+(p.left+p.width-25)}
      stroke={CYAN} strokeWidth={1.7} opacity={.30+.19*primaryGlow}/>
    <text x={p.left+27} y={p.top+45} fontSize={22} fontWeight={850}
      fill={WHITE}>Primary</text>
    <text x={p.left+27} y={p.top+72} fontSize={22} fontWeight={850}
      fill={WHITE}>Gateway</text>
    <g opacity={1-.89*julyCallout}>
      <text x={p.left+27} y={p.top+96} fontSize={16} fontWeight={750}
        fill={SECONDARY}>WORKLOAD MIX</text>
      <rect x={p.left+27} y={p.top+112} width={204} height={10}
        rx={5} fill="#1E3A57"/>
      <rect x={p.left+27} y={p.top+112} width={204-67*sharedLoad}
        height={10} rx={5} fill={CYAN}/>
      <rect x={p.left+231-67*sharedLoad} y={p.top+112}
        width={67*sharedLoad} height={10} rx={5} fill={VIOLET}/>
      <circle cx={p.left+236} cy={p.top+35} r={5} fill={MINT}
        opacity={.5+.5*primaryGlow}/>
    </g>
    <g opacity={julyCallout}>
      <text x={p.left+27} y={p.top+94} fontSize={17}
        fontWeight={850} fill={AMBER}>JULY</text>
      <text x={p.left+27} y={p.top+119} fontSize={19}
        fontWeight={850} fill={AMBER}>GATEWAY UPDATE</text>
    </g>
    <path d={alternativeOutline} fill="#151D3A"
      stroke={VIOLET} strokeWidth={2.5+1.2*alternativeFocus}
      opacity={.62+.38*alternativeFocus}
      style={{filter:'drop-shadow(0 0 '+(7+11*alternativeFocus)+'px rgba(180,155,255,.32))'}}/>
    <path d={'M '+(a.left+30)+' '+(a.top+14)+' H '+(a.left+a.width-30)}
      stroke={VIOLET} strokeWidth={1.5} opacity={.38}/>
    <text x={a.left+24} y={a.top+44} fontSize={22} fontWeight={850}
      fill={WHITE}>Alternative</text>
    <text x={a.left+24} y={a.top+71} fontSize={22} fontWeight={850}
      fill={WHITE}>Gateway</text>
    <text x={a.left+24} y={a.top+99} fontSize={16} fontWeight={670}
      fill={SECONDARY}>Independent route</text>
    <circle cx={a.left+a.width-25} cy={a.top+96} r={4.5}
      fill={MINT} opacity={.85-.25*redirect}/>
    <g>
      {[
        {key:'mailbox',color:CYAN},
        {key:'teams',color:VIOLET},
      ].map(({key,color})=>{
        const n=EP004_SHOT03_NODES[key];
        return <rect key={key} x={n.left} y={n.top}
          width={n.width} height={n.height} rx={16}
          stroke={color} strokeWidth={2} fill="#081C31" opacity={.94}/>;
      })}
      <text x={EP004_SHOT03_NODES.mailbox.left+18}
        y={EP004_SHOT03_NODES.mailbox.top+47}
        fontSize={20} fontWeight={840} fill={WHITE}>Exchange</text>
      <text x={EP004_SHOT03_NODES.mailbox.left+18}
        y={EP004_SHOT03_NODES.mailbox.top+74}
        fontSize={20} fontWeight={840} fill={WHITE}>Online</text>
      <TeamsAppIcon x={EP004_SHOT03_NODES.teams.left+18}
        y={EP004_SHOT03_NODES.teams.top+26} size={43}/>
      <text x={EP004_SHOT03_NODES.teams.left+70}
        y={EP004_SHOT03_NODES.teams.top+49}
        fontSize={21} fill={WHITE} fontWeight={850}>Teams</text>
      <text x={EP004_SHOT03_NODES.teams.left+70}
        y={EP004_SHOT03_NODES.teams.top+75}
        fontSize={15} fill={SECONDARY} fontWeight={650}>Microsoft</text>
    </g>
  </g>;
};

export const Shot03LivingArchitectureWorldView:React.FC<{
  state:Ep004Shot03StoryboardState;showStoryboardFooter:boolean;
  headingOpacity?:number;
}>=({state,showStoryboardFooter,headingOpacity=1})=>{
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
            const violet=key!=='OUTLOOK_PRIMARY'&&key!=='PRIMARY_MAILBOX';
            const opacity=state.clarity.routes[key]??.15;
            return <g key={key} opacity={opacity}>
              <path d={ep004BezierPath(points)} fill="none"
                stroke={violet?'#253454':'#1B4A60'}
                strokeWidth={10} strokeLinecap="round"/>
              <path d={ep004BezierPath(points)} fill="none"
                stroke={violet?VIOLET:CYAN}
                strokeWidth={3.1+1.65*opacity} strokeLinecap="round"
                opacity={.25+.70*opacity*phaseGlow}
                style={opacity>.64?{filter:'drop-shadow(0 0 6px rgba(180,155,255,.30))'}:{}}/>
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
          julyCallout={state.clarity.julyCallout} worldFrame={state.worldFrame}
          primaryFocus={state.clarity.primaryFocus}
          alternativeFocus={state.clarity.alternativeFocus}/>
        <g opacity={state.gatewayReveal}>
          <TeamsAppIcon x={565} y={668} size={48}/>
          <text x={589} y={732} textAnchor="middle" fill={VIOLET}
            fontSize={18} fontWeight={790}>TEAMS</text>
          {state.tokens.map(t=><g key={t.id} opacity={t.opacity}>
            <circle cx={t.x} cy={t.y} r={t.radius+1.2}
              fill={t.color==='VIOLET'?VIOLET:CYAN}
              style={{filter:'drop-shadow(0 0 7px '+(t.color==='VIOLET'?VIOLET:CYAN)+')'}}/>
            {t.id.endsWith('-0')&&<circle cx={t.x} cy={t.y}
              r={t.radius+5} fill="none" stroke={WHITE}
              strokeWidth={1.3} opacity={.54}/>}
          </g>)}
          <text x={560} y={204} fill={SECONDARY}
            fontSize={23} fontWeight={750}
            opacity={state.gatewayReveal*state.clarity.noteOpacity}>
            {state.clarity.note}
          </text>
        </g>
        <g opacity={headingOpacity}>
        <text x={560} y={116} fill={WHITE} fontSize={35}
          fontWeight={890} letterSpacing="-.02em" opacity={state.originalOpacity}>
          THE PROMISE OF FAILOVER
        </text>
        <text x={560} y={116} fill={WHITE} fontSize={32}
          fontWeight={890} letterSpacing="-.02em" opacity={state.gatewayReveal}>
          TWO GATEWAY SYSTEMS, ONE SHARED PRESSURE
        </text>
        <path d="M 560 143 H 1260" stroke={CYAN} strokeWidth={2} opacity={.55}/>
        </g>
      </svg>
    </div>
    {showStoryboardFooter&&<div style={{position:'absolute',right:49,bottom:38,zIndex:80,
      color:'#9CBAC9',fontSize:18,fontWeight:720,fontFamily:AT_FONT,opacity:.78}}>
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
