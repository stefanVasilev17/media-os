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

const BG='#020A14';
const WHITE='#F1FAFF';
const CYAN='#77CDE5';
const VIOLET='#B1A4E9';
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
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.w)throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  return <g opacity={intensity}>
    <rect x={n.x} y={n.y+11} width={n.w} height={n.h} rx={30} fill="#02070E" opacity={.72}/>
    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={30} fill="url(#shot05V7Panel)" stroke={tone} strokeOpacity={.26} strokeWidth={2}/>
    <path d={'M '+(n.x+30)+' '+(n.y+2)+' H '+(n.x+n.w-30)} stroke="#D2E8F4" strokeOpacity={.12} strokeWidth={1.6} strokeLinecap="round"/>
    <text x={n.x+n.w/2} y={n.y+n.h/2+n.font*.35} fontFamily={FONT} fontSize={n.font} fontWeight={720} textAnchor="middle" fill={WHITE}>{n.title}</text>
  </g>;
};

const Channel:React.FC<{path:string;tone:string;strength:number;reveal:number}>=({path,tone,strength,reveal})=>{
  if(reveal<=0)return null;
  const dash=reveal<1?reveal+' 1':undefined;
  const opacity=Math.min(1,reveal*15);
  return <g opacity={opacity}>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke={tone} strokeWidth={25} strokeLinejoin="round" strokeLinecap="round" opacity={.025+.10*strength}/>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke={tone} strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" opacity={.035+.15*strength}/>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke={tone} strokeWidth={5.5} strokeLinejoin="round" strokeLinecap="round" opacity={.13+.72*strength}/>
  </g>;
};
const Gateway:React.FC<{nodeId:'primary'|'alternative';mail:number;teams:number;pressure:number;exact14:boolean;capacity14Reveal:number;amberPulse:number;coreReveal:number}>=({nodeId,mail,teams,pressure,exact14,capacity14Reveal,amberPulse,coreReveal})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  const main=nodeId==='primary';
  const tone=main?CYAN:VIOLET;
  const activity=Math.max(mail,teams);
  const center=n.x+n.w/2;
  const loss=exact14?capacity14Reveal*.14:0;
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.w)throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  const lanes=main?[{y:330,tone:CYAN,weight:mail,reveal:1},{y:430,tone:VIOLET,weight:teams,reveal:coreReveal}]:[{y:745,tone:VIOLET,weight:teams,reveal:1}];
  const meterX=n.x+48,meterWidth=n.w-96,meterY=n.y+n.h-27;
  return <g>
    <g opacity={main?1:mix(.46,1,activity)}>
      <rect x={n.x} y={n.y+15} width={n.w} height={n.h} rx={45} fill="#00050B" opacity={.78}/>
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={44} fill="url(#shot05V7Gateway)" stroke={tone} strokeOpacity={.27} strokeWidth={2.5}/>
      <path d={'M '+(n.x+44)+' '+(n.y+2)+' H '+(n.x+n.w-44)} stroke="#BED8E9" strokeOpacity={.19} strokeWidth={2} strokeLinecap="round"/>
      <text x={center} y={n.y+60} fill={WHITE} fontFamily={FONT} fontSize={n.font} textAnchor="middle" fontWeight={730}>{n.title}</text>
      <rect x={n.x+38} y={n.y+79} width={n.w-76} height={n.h-132} rx={31} fill="#071521" fillOpacity={.88} stroke="#526F85" strokeOpacity={.14} strokeWidth={1.8}/>
      <rect x={meterX} y={meterY} width={meterWidth} height={8} rx={4} fill="#213749"/>
      <rect x={meterX} y={meterY} width={meterWidth*(1-loss)} height={8} rx={4} fill={tone} opacity={.33+.26*activity}/>
      {!exact14&&pressure>0&&<rect x={meterX} y={meterY} width={meterWidth} height={8} rx={4} fill={AMBER} opacity={pressure*.68}/>}
      {exact14&&loss>0&&<g>
        <rect x={meterX+meterWidth*(1-loss)} y={meterY-5} width={meterWidth*loss} height={18} rx={9} fill="#FFD36A" opacity={amberPulse*.24}/>
        <rect x={meterX+meterWidth*(1-loss)} y={meterY} width={meterWidth*loss} height={8} rx={4} fill={AMBER} opacity={.9}/>
        <rect x={meterX+meterWidth*(1-loss)} y={meterY} width={meterWidth*loss} height={8} rx={4} fill="#FFF1A4" opacity={amberPulse*.94}/>
      </g>}
    </g>
    {lanes.map(l=>{
      if(l.reveal<=0)return null;
      return <Channel key={l.y} path={'M '+n.x+' '+l.y+' H '+(n.x+n.w)} tone={l.tone} strength={l.weight} reveal={l.reveal}/>;
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
      <radialGradient id="shot05V7Depth"><stop offset="0%" stopColor="#183044" stopOpacity={.44}/><stop offset="100%" stopColor={BG} stopOpacity={0}/></radialGradient>
      <linearGradient id="shot05V7Gateway" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#203C4E"/><stop offset="48%" stopColor="#11293B"/><stop offset="100%" stopColor="#0B1927"/></linearGradient>
      <linearGradient id="shot05V7Panel" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1B384B"/><stop offset="100%" stopColor="#0C1C2B"/></linearGradient>
    </defs>
    <ellipse cx={960} cy={575} rx={720} ry={490} fill="url(#shot05V7Depth)"/>
    {(Object.keys(EP004_SHOT05_TRACKS) as TrackId[]).map(id=><Track key={id} id={id} tone={id==='OUTLOOK_PRIMARY'||id==='PRIMARY_MAILBOX'?CYAN:VIOLET} strength={weights[id]} reveal={reveals[id]}/>)}
    <Endpoint nodeId="outlook" tone={CYAN} intensity={1}/>
    <Endpoint nodeId="exchange" tone={CYAN} intensity={1}/>
    <Endpoint nodeId="teams" tone={VIOLET} intensity={1}/>
    <Endpoint nodeId="teamsService" tone={VIOLET} intensity={1}/>
    <Gateway nodeId="primary" mail={1} teams={m.newStrength} pressure={m.pressure} exact14={m.explicit14} capacity14Reveal={m.capacity14Reveal} amberPulse={m.amberPulse} coreReveal={m.coreReveal}/>
    <Gateway nodeId="alternative" mail={0} teams={m.oldStrength} pressure={0} exact14={false} capacity14Reveal={0} amberPulse={0} coreReveal={1}/>
    {m.packets.map(p=>{
      const tone=p.route==='MAIL'?CYAN:p.route==='NEW'?'#D4C3FF':VIOLET;
      const pilot=p.route==='NEW'&&p.born===m.firstNewEmission;
      const tail=ep004Shot05PacketTrail(p.route,p.travel,pilot?92:62);
      return <g key={p.id} opacity={p.opacity}>
        {tail.map((s,i)=><g key={i}>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={tone} strokeWidth={pilot?24:16} opacity={s.alpha*.075} strokeLinecap="round"/>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={tone} strokeWidth={pilot?11:6.5} opacity={s.alpha*.92} strokeLinecap="round"/>
        </g>)}
        <circle cx={p.x} cy={p.y} r={pilot?5:3.8} fill={WHITE} opacity={.88}/>
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
  const routeFocus=routeAge<0?0:clamp(routeAge/18)*(1-clamp((routeAge-365)/24));
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
