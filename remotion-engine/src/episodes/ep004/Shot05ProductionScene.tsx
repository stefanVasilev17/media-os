import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {AT_FONT} from '../../components/architectural-thinking';
import {
  EP004_SHOT05_NODES,EP004_SHOT05_TRACKS,
  ep004Shot05MeasuredTextWidth,ep004Shot05TextBox,ep004Shot05PacketTrail
} from '../../components/architectural-thinking/EP004Shot05ClarityWorld.mjs';
import {
  ep004Shot05ProductionWorld,validateEp004Shot05Production
} from '../../components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
import type {Ep004Shot05RenderProps}
  from '../../components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
import type {Ep004Shot05ClarityStage,Ep004Shot05ClarityState}
  from '../../components/architectural-thinking/EP004Shot05ClarityWorld.mjs';

const BG='#0A101A';
const WHITE='#F1FAFF';
const CYAN='#75D3E9';
const VIOLET='#B89AF2';
const MINT='#82CDB6';
const AMBER='#E9B77E';
const QUIET='#405B73';
const PANEL='#071B2D';
const BOUNDARY='#29455B';
const FONT=AT_FONT;
const color=(name:string)=>name==='AMBER'?AMBER:
  name==='VIOLET'?VIOLET:name==='MINT'?MINT:CYAN;
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const mix=(a:number,b:number,t:number)=>a+(b-a)*clamp(t);

type NodeId=keyof typeof EP004_SHOT05_NODES;
type TrackId=keyof typeof EP004_SHOT05_TRACKS;

const Title:React.FC<{title:string;accent:string;opacity:number}>=
({title,opacity})=>{
  if(opacity<=0)return null;
  const box=ep004Shot05TextBox(title,43);
  return <text x={960} y={112} fontFamily={FONT} fontSize={box.font}
    textAnchor="middle" fill="#DBE7EF" fontWeight={720} opacity={opacity}
    letterSpacing=".025em">{title}</text>;
};

const Endpoint:React.FC<{nodeId:NodeId;tone:string;intensity:number}>=({nodeId,tone,intensity})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.labelWidth)throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  const app=nodeId==='outlook'||nodeId==='teams';
  const outlook=nodeId==='outlook';
  const x=n.x,y=n.y;
  return <g opacity={intensity}>
    <rect x={x} y={y} width={n.w} height={n.h} rx={app?42:30}
      fill={app?(outlook?'#16314D':'#2A2545'):'url(#shot05V10Service)'}
      stroke={tone} strokeOpacity={.66} strokeWidth={2.6}/>
    {outlook&&<g transform={'translate('+(x+23)+' '+(y+39)+')'}>
      <rect x={35} y={4} width={150} height={94} rx={6} fill="#C0E2F6"/>
      <path d="M35 5 L110 59 L185 5" fill="none" stroke="#376684" strokeWidth={7} strokeLinejoin="round"/>
      <rect x={0} y={22} width={79} height={79} rx={10} fill="#1978B8"/>
      <text x={39.5} y={80} textAnchor="middle" fontFamily={FONT} fontSize={52} fontWeight={850} fill={WHITE}>O</text>
    </g>}
    {nodeId==='teams'&&<g transform={'translate('+(x+27)+' '+(y+23)+')'}>
      <circle cx={121} cy={29} r={28} fill="#ADA2ED"/>
      <path d="M86 67 Q121 54 162 69 V116 Q160 140 124 140 Q88 140 86 116Z" fill="#8176C8"/>
      <rect x={0} y={42} width={92} height={92} rx={12} fill="#6959B7"/>
      <text x={46} y={110} textAnchor="middle" fontFamily={FONT} fontSize={62} fontWeight={830} fill={WHITE}>T</text>
    </g>}
    {!app&&[0,1,2].map(i=><g key={i}>
      <rect x={x+29} y={y+29+i*44} width={n.w-58} height={32} rx={9} fill="#0B1420" stroke="#607588" strokeOpacity={.62} strokeWidth={2}/>
      <circle cx={x+52} cy={y+45+i*44} r={7} fill={tone}/>
      <path d={'M '+(x+n.w-87)+' '+(y+45+i*44)+' H '+(x+n.w-49)} stroke="#74889C" strokeWidth={6} strokeLinecap="round"/>
    </g>)}
    <text x={x+n.w/2} y={y+n.h+n.font+10} fontFamily={FONT} fontSize={n.font} fontWeight={650} textAnchor="middle" fill="#DCE5F0">{n.title}</text>
  </g>;
};

const Channel:React.FC<{path:string;tone:string;strength:number;reveal:number}>=({path,tone,strength,reveal})=>{
  if(reveal<=0)return null;
  const dash=reveal<1?reveal+' 1':undefined;
  const opacity=Math.min(1,reveal*15);
  const violet=tone===VIOLET;
  return <g opacity={opacity}>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke={tone} strokeWidth={42} strokeLinejoin="round" strokeLinecap="round" opacity={(violet?.32:.10)*strength} filter="url(#shot05V10RouteGlow)"/>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke={tone} strokeWidth={17} strokeLinejoin="round" strokeLinecap="round" opacity={(violet?.22:.075)*strength}/>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke="#627387" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" opacity={.36*(1-strength)}/>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke={tone} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" opacity={strength}/>
  </g>;
};
const Gateway:React.FC<{nodeId:'primary'|'alternative';mail:number;teams:number;pressure:number;exact14:boolean;capacity14Reveal:number;amberPulse:number;coreReveal:number}>=({nodeId,mail,teams,pressure,exact14,capacity14Reveal,amberPulse,coreReveal})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  const main=nodeId==='primary';
  const activity=Math.max(mail,teams);
  const center=n.x+n.w/2;
  const loss=exact14?capacity14Reveal*.14:0;
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.labelWidth)throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  const lanes=main?[{y:330,tone:CYAN,weight:mail,reveal:1},{y:430,tone:VIOLET,weight:teams,reveal:coreReveal}]:[{y:745,tone:VIOLET,weight:teams,reveal:1}];
  const meterX=n.x+68,meterWidth=n.w-136,meterY=n.y+n.h-44;
  return <g>
    <g opacity={main?1:mix(.43,1,activity)}>
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={main?60:44} fill="url(#shot05V10Gateway)" stroke="#8EA3B8" strokeOpacity={.65} strokeWidth={2.8}/>
      {main&&<path d={'M '+(n.x+112)+' 380 H '+(n.x+n.w-112)} fill="none" stroke="#698198" strokeOpacity={.42} strokeWidth={4} strokeDasharray="13 14"/>}
      {main&&<g>
        <rect x={meterX} y={meterY} width={meterWidth} height={12} rx={6} fill="#263A4E"/>
        <rect x={meterX} y={meterY} width={meterWidth*(1-loss)} height={12} rx={6} fill={CYAN} opacity={.85}/>
        {!exact14&&pressure>0&&<rect x={meterX} y={meterY} width={meterWidth} height={12} rx={6} fill={AMBER} opacity={pressure*.68}/>}
        {exact14&&loss>0&&<g>
          <rect x={meterX+meterWidth*(1-loss)} y={meterY-5} width={meterWidth*loss} height={22} rx={11} fill="#FFD36A" opacity={amberPulse*.7} filter="url(#shot05V10RouteGlow)"/>
          <rect x={meterX+meterWidth*(1-loss)} y={meterY} width={meterWidth*loss} height={12} rx={6} fill="#FFD36A" opacity={.96}/>
          <rect x={meterX+meterWidth*(1-loss)} y={meterY} width={meterWidth*loss} height={12} rx={6} fill="#FFF1A4" opacity={amberPulse*.94}/>
        </g>}
      </g>}
      <text x={center} y={n.y+n.h+n.font+10} fontFamily={FONT} fontSize={n.font} fontWeight={main?730:650} textAnchor="middle" fill="#DCE5F0">{n.title}</text>
    </g>
    {lanes.map(l=>{
      if(l.reveal<=0)return null;
      return <g key={l.y}>
        <Channel path={'M '+n.x+' '+l.y+' H '+(n.x+n.w)} tone={l.tone} strength={l.weight} reveal={l.reveal}/>
        {[{x:n.x+17,opacity:Math.min(1,l.reveal*15)},{x:n.x+n.w-17,opacity:clamp((l.reveal-.91)/.09)}].map(port=><rect key={port.x} x={port.x-18} y={l.y-18} width={36} height={36} rx={8} fill="#102031" stroke={l.weight>.03?l.tone:'#8293A8'} strokeOpacity={.22+.78*l.weight} strokeWidth={5} opacity={port.opacity}/>)}
      </g>;
    })}
  </g>;
};
const Track:React.FC<{id:TrackId;tone:string;strength:number;reveal:number}>=({id,tone,strength,reveal})=>{
  if(reveal<=0)return null;
  return <Channel path={EP004_SHOT05_TRACKS[id].path} tone={tone} strength={strength} reveal={reveal}/>;
};
const FlowWorld:React.FC<{scene:Ep004Shot05ClarityState}>=({scene})=>{
  const m=scene.migration;
  const weights:Record<TrackId,number>={
    OUTLOOK_PRIMARY:1,PRIMARY_MAILBOX:1,
    TEAMS_ALTERNATIVE:m.oldStrength,ALTERNATIVE_TEAMS:m.oldStrength,
    TEAMS_FAILOVER:m.newStrength,PRIMARY_TEAMS:m.newStrength
  };
  const reveals:Record<TrackId,number>={OUTLOOK_PRIMARY:1,PRIMARY_MAILBOX:1,TEAMS_ALTERNATIVE:1,ALTERNATIVE_TEAMS:1,TEAMS_FAILOVER:m.ingressReveal,PRIMARY_TEAMS:m.egressReveal};
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="shot05V10Depth"><stop offset="0%" stopColor="#1A3048" stopOpacity={.65}/><stop offset="100%" stopColor={BG} stopOpacity={0}/></radialGradient>
      <linearGradient id="shot05V10Gateway" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#233747"/><stop offset="100%" stopColor="#111C2A"/></linearGradient>
      <linearGradient id="shot05V10Service" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#203342"/><stop offset="100%" stopColor="#111D2C"/></linearGradient>
      <pattern id="shot05V10Grid" width={80} height={80} patternUnits="userSpaceOnUse"><path d="M80 0 H0 V80" fill="none" stroke="#8C9EB7" strokeOpacity={.065} strokeWidth={1.5}/></pattern>
      <filter id="shot05V10RouteGlow" filterUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080} colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={13}/></filter>
    </defs>
    <rect width={1920} height={1080} fill={BG}/>
    <ellipse cx={960} cy={535} rx={900} ry={670} fill="url(#shot05V10Depth)"/>
    <rect width={1920} height={1080} fill="url(#shot05V10Grid)"/>
    {(Object.keys(EP004_SHOT05_TRACKS) as TrackId[]).map(id=><Track key={id} id={id} tone={id==='OUTLOOK_PRIMARY'||id==='PRIMARY_MAILBOX'?CYAN:VIOLET} strength={weights[id]} reveal={reveals[id]}/>)}
    <Endpoint nodeId="outlook" tone={CYAN} intensity={1}/>
    <Endpoint nodeId="exchange" tone={CYAN} intensity={1}/>
    <Endpoint nodeId="teams" tone={VIOLET} intensity={1}/>
    <Endpoint nodeId="teamsService" tone={VIOLET} intensity={1}/>
    <Gateway nodeId="primary" mail={1} teams={m.newStrength} pressure={m.pressure} exact14={m.explicit14} capacity14Reveal={m.capacity14Reveal} amberPulse={m.amberPulse} coreReveal={m.coreReveal}/>
    <Gateway nodeId="alternative" mail={0} teams={m.oldStrength} pressure={0} exact14={false} capacity14Reveal={0} amberPulse={0} coreReveal={1}/>
    {m.packets.map(p=>{
      const tone=p.route==='MAIL'?'#9CE9F8':'#D4C2FF';
      const pilot=p.route==='NEW'&&p.born===m.firstNewEmission;
      const tail=ep004Shot05PacketTrail(p.route,p.travel,pilot?92:62);
      return <g key={p.id} opacity={p.opacity}>
        {pilot&&tail.map((s,i)=><line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={tone} strokeWidth={12} opacity={s.alpha*.34} strokeLinecap="round"/>)}
        <circle cx={p.x} cy={p.y} r={pilot?19:13} fill={tone} opacity={pilot?.36:.13} filter="url(#shot05V10RouteGlow)"/>
        <circle cx={p.x} cy={p.y} r={pilot?14:11} fill={tone}/>
      </g>;
    })}
  </svg>;
};

export const Shot05ProductionScene:React.FC<Ep004Shot05RenderProps>=props=>{
  const frame=useCurrentFrame();
  const config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
    ||config.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT05_REQUIRES_APPROVED_1080P_30FPS_DURATION');
  validateEp004Shot05Production(props);
  if(frame===0&&!props.previousLastFrameDataUri)
    throw Error('EP004_SHOT05_AUTHENTIC_LOCKED_SHOT04_LAST_FRAME_REQUIRED');
  const world=ep004Shot05ProductionWorld(frame,props);
  const scene=world.cinematic;
  const pose=scene.camera;
  const m=scene.migration;
  const routeBeat=(s:Ep004Shot05ClarityStage)=>s.key==='SWITCH'||s.key==='SHARED';
  const routeHeadline=(s:Ep004Shot05ClarityStage)=>{
    if(routeBeat(s))return m.firstNewEmission!==null&&frame>=m.firstNewEmission?'TEAMS TRAFFIC REROUTES':'FOLLOW THE TEAMS REQUEST';
    return s.headline;
  };
  const settled=1-clamp(m.oldStrength/.52);
  const sharedTitleOpacity=routeBeat(scene.stage)&&m.egressReveal===1?settled:0;
  const routeAge=m.firstNewEmission===null?-1:frame-m.firstNewEmission;
  const routeFocus=routeAge<0?0:clamp(routeAge/18);
  const migrationTitle=m.egressReveal===1&&m.oldStrength<.04?'SHARED GATEWAY':'TEAMS TRAFFIC REROUTES';
  const transform='translate3d('+pose.x+'px,'+pose.y+
    'px,0) scale('+pose.scale+')';
  return <AbsoluteFill style={{background:BG,overflow:'hidden'}}>
    <AbsoluteFill style={{opacity:scene.interiorOpacity,
      transform,transformOrigin:'960px 550px',
      pointerEvents:'none'}}>
      <FlowWorld scene={scene}/>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:42}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {scene.previousStage&&
          <Title title={routeHeadline(scene.previousStage)}
            accent={color(scene.previousStage.accent)}
            opacity={scene.previousHeadlineOpacity*(scene.previousStage&&routeBeat(scene.previousStage)?1-sharedTitleOpacity:1)*(1-routeFocus)}/>}
        {scene.beatIndex>=0&&
          <Title title={routeHeadline(scene.stage)}
            accent={color(scene.stage.accent)}
            opacity={scene.headlineOpacity*(1-sharedTitleOpacity)*(1-routeFocus)}/>}
        {sharedTitleOpacity>0&&<Title title="SHARED GATEWAY" accent={CYAN} opacity={sharedTitleOpacity*scene.headlineOpacity*(1-routeFocus)}/>}
        {routeFocus>0&&<Title title={migrationTitle} accent={VIOLET} opacity={routeFocus*scene.interiorOpacity}/>} 
      </svg>
    </AbsoluteFill>
    {frame<110&&props.previousLastFrameDataUri&&
      <AbsoluteFill style={{zIndex:90,pointerEvents:'none',
        opacity:scene.sourceOpacity,
        transform:'scale('+scene.sourcePush+')',
        transformOrigin:'69% 49%'}}>
        <Img src={props.previousLastFrameDataUri}
          style={{width:1920,height:1080,objectFit:'fill'}}/>
      </AbsoluteFill>}
  </AbsoluteFill>;
};
