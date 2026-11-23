import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {AT_FONT} from '../../components/architectural-thinking';
import {
  EP004_SHOT05_NODES,EP004_SHOT05_TRACKS,
  ep004Shot05MeasuredTextWidth,ep004Shot05TextBox
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
const CYAN='#6BE5FC';
const VIOLET='#ACA0FC';
const MINT='#62E8C9';
const AMBER='#F0B66C';
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
({title,accent,opacity})=>{
  if(opacity<=0)return null;
  const box=ep004Shot05TextBox(title);
  return <g opacity={opacity}>
    <rect x={box.x} y={box.y} width={box.width} height={box.height}
      rx={20} fill="#071A2B" stroke={accent} strokeOpacity={.55}
      strokeWidth={2}/>
    <text x={960} y={box.y+box.height/2+16}
      fontFamily={FONT} fontSize={box.font}
      textAnchor="middle" fill={WHITE} fontWeight={850}
      letterSpacing="-.02em">{title}</text>
  </g>;
};

const Node:React.FC<{
  nodeId:NodeId;intensity:number;tone:string;
  status:string|null;capacity:boolean;motion:number;
}>=({nodeId,intensity,tone,status,capacity,motion})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  if(intensity<=0)return null;
  const active=intensity>.40;
  const isPrimary=nodeId==='primary';
  const isCapacity=isPrimary&&status!=null;
  const iconColor=active?tone:QUIET;
  const titleY=isPrimary?n.y+65:n.y+n.h/2+n.font*.37;
  const labelWidth=ep004Shot05MeasuredTextWidth(n.title,n.font);
  if(labelWidth+54>n.w)throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  return <g opacity={intensity}>
    <rect x={n.x+9} y={n.y+11} width={n.w} height={n.h} rx={21}
      fill="#010814" opacity={.66}/>
    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={21}
      fill={active?PANEL:'#071320'}
      stroke={active?iconColor:BOUNDARY}
      strokeWidth={active?3.2:1.8}/>
    <rect x={n.x+19} y={n.y+20} width={5} height={n.h-40}
      rx={2.5} fill={iconColor} opacity={active?.9:.55}/>
    <text x={n.x+n.w/2+9} y={titleY}
      fontFamily={FONT} fontSize={n.font}
      fontWeight={850} textAnchor="middle" fill={WHITE}
      letterSpacing="-.018em">{n.title}</text>
    {isPrimary&&isCapacity&&status==='14%'&&
      <g>
        <text x={n.x+112} y={n.y+171} fill={AMBER}
          fontFamily={FONT} fontSize={65} fontWeight={900}
          textAnchor="middle">14%</text>
        <text x={n.x+307} y={n.y+161} fill={WHITE}
          fontFamily={FONT} fontSize={26} fontWeight={800}
          textAnchor="middle">CAPACITY LOST</text>
        <rect x={n.x+36} y={n.y+203} width={n.w-72} height={13}
          rx={6.5} fill={MINT} opacity={.78}/>
        <rect x={n.x+n.w-36-(n.w-72)*.14} y={n.y+203}
          width={(n.w-72)*.14} height={13} rx={6.5}
          fill={AMBER}/>
      </g>}
    {isPrimary&&isCapacity&&status!=='14%'&&
      <text x={n.x+n.w/2} y={n.y+160}
        textAnchor="middle" fontFamily={FONT} fontSize={31}
        fontWeight={850} fill={AMBER}>{status}</text>}
    {isPrimary&&!isCapacity&&
      <g opacity={Math.max(.30,motion)}>
        <path d={'M '+(n.x+60)+' '+(n.y+164)+' H '+(n.x+n.w-59)}
          fill="none" stroke={iconColor} strokeWidth={4}
          strokeLinecap="round" opacity={.65}/>
        <rect x={n.x+65+mix(0,n.w-146,motion)}
          y={n.y+159} width={17} height={10}
          rx={5} fill={iconColor}/>
      </g>}
  </g>;
};

const Track:React.FC<{
  id:TrackId;intensity:number;age:number;
  tone:string;slow:boolean
}>=({id,intensity,age,tone,slow})=>{
  if(intensity<=.01)return null;
  const path=EP004_SHOT05_TRACKS[id].path;
  const offset=-Math.max(0,age)*(slow?1.1:2.4);
  return <g opacity={intensity}>
    <path d={path} fill="none" stroke={tone}
      strokeWidth={4.8} strokeLinecap="round"
      strokeLinejoin="round" opacity={.55}/>
    <path d={path} fill="none" stroke={tone}
      strokeWidth={7} strokeLinecap="round"
      strokeLinejoin="round" opacity={.88}
      strokeDasharray="10 230" strokeDashoffset={offset}/>
  </g>;
};

const FlowWorld:React.FC<{scene:Ep004Shot05ClarityState}>=({scene})=>{
  const now=scene.stage;
  const prev=scene.previousStage;
  const changing=scene.stageTransition;
  const seen=new Set(scene.visibleHistory);
  const capacity=now.key==='CAPACITY'||now.key==='CAPACITY_14'
    ||now.key==='DEGRADED';
  const activeColor=color(now.accent);
  const switching=now.key==='SWITCH';
  const oldLanes=prev?.lanes??[];
  const activeLanes=now.lanes;
  const strength=(id:TrackId)=>{
    const old=oldLanes.includes(id)?0.82:0;
    let next=activeLanes.includes(id)?scene.flowActivation:0;
    if(now.key==='SHARED'||now.key==='CONSEQUENCE'){
      if(id==='TEAMS_FAILOVER'||id==='PRIMARY_TEAMS')
        next*=scene.secondLaneActivation;
    }
    if(switching){
      next*=id==='TEAMS_ALTERNATIVE'||id==='ALTERNATIVE_TEAMS'
        ?1-scene.switchActivation:scene.switchActivation;
    }
    if(capacity&&oldLanes.includes(id))next=.22;
    return mix(old,next,changing);
  };
  const opacity=(id:NodeId)=>{
    const old=prev?.visible.includes(id)?1:(seen.has(id)?0.18:0);
    const next=now.visible.includes(id)?1:(seen.has(id)?0.19:0);
    return mix(old,next,changing);
  };
  const laneColor=(key:TrackId)=>key.includes('TEAMS')||key.includes('ALTERNATIVE')
    ?VIOLET:CYAN;
  const primaryActive=now.visible.includes('primary');
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="shot05V3WorldDepth">
        <stop offset="0%" stopColor="#12314A" stopOpacity={.45}/>
        <stop offset="100%" stopColor={BG} stopOpacity={0}/>
      </radialGradient>
    </defs>
    <ellipse cx={957} cy={554} rx={810} ry={520}
      fill="url(#shot05V3WorldDepth)"/>
    <g stroke="#1F3447" strokeWidth={1} opacity={.28}>
      <path d="M 143 249 H 1788 M 143 916 H 1788" fill="none"/>
    </g>
    <g>
      {(Object.keys(EP004_SHOT05_TRACKS) as TrackId[]).map(key=>
        <Track key={key} id={key}
          intensity={strength(key)} age={scene.age}
          tone={laneColor(key)} slow={capacity}/>)}
    </g>
    <Node nodeId="outlook" intensity={opacity('outlook')}
      tone={CYAN} status={null} capacity={false}
      motion={scene.flowActivation}/>
    <Node nodeId="teams" intensity={opacity('teams')}
      tone={VIOLET} status={null} capacity={false}
      motion={scene.flowActivation}/>
    <Node nodeId="exchange" intensity={opacity('exchange')}
      tone={CYAN} status={null} capacity={false}
      motion={scene.flowActivation}/>
    <Node nodeId="teamsService" intensity={opacity('teamsService')}
      tone={VIOLET} status={null} capacity={false}
      motion={scene.flowActivation}/>
    <Node nodeId="alternative" intensity={opacity('alternative')}
      tone={VIOLET} status={null} capacity={false}
      motion={scene.switchActivation}/>
    <Node nodeId="primary" intensity={opacity('primary')}
      tone={primaryActive?activeColor:CYAN} status={now.primaryStatus}
      capacity={capacity} motion={scene.flowActivation}/>
    {capacity&&
      <g opacity={scene.flowActivation*.78}>
        <rect x={648} y={394} width={15} height={19} rx={5}
          fill={CYAN}/>
        <rect x={678} y={394} width={15} height={19} rx={5}
          fill={CYAN} opacity={.75}/>
        <rect x={708} y={394} width={15} height={19} rx={5}
          fill={AMBER} opacity={.55}/>
      </g>}
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
          <Title title={scene.previousStage.headline}
            accent={color(scene.previousStage.accent)}
            opacity={scene.previousHeadlineOpacity}/>}
        {scene.beatIndex>=0&&
          <Title title={scene.stage.headline}
            accent={color(scene.stage.accent)}
            opacity={scene.headlineOpacity}/>}
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
