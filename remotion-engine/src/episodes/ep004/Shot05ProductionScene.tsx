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
  status:string|null;capacity:boolean;motion:number;frame:number;
}>=({nodeId,intensity,tone,status,capacity,motion,frame})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  if(intensity<=0)return null;
  const active=intensity>.38;
  const accent=active?tone:QUIET;
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.w)
    throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  if(nodeId!=='primary')return <g opacity={intensity}>
    <rect x={n.x+8} y={n.y+10} width={n.w} height={n.h}
      rx={20} fill="#000713" opacity={.68}/>
    <rect x={n.x} y={n.y} width={n.w} height={n.h}
      rx={20} fill={active?PANEL:'#071320'}
      stroke={accent} strokeOpacity={active?.8:.48}
      strokeWidth={active?2.6:1.7}/>
    <rect x={n.x+18} y={n.y+17} width={4} height={n.h-34}
      rx={2} fill={accent} opacity={active?.82:.42}/>
    <text x={n.x+n.w/2+5} y={n.y+n.h/2+n.font*.35}
      fontFamily={FONT} fontSize={n.font} fontWeight={820}
      textAnchor="middle" fill={WHITE}>{n.title}</text>
  </g>;
  const portY=[n.y+76,n.y+167];
  const speed=capacity?1.35:3.15;
  const progress=frame*speed;
  const left=n.x+32;
  const width=n.w-64;
  return <g opacity={intensity}>
    <rect x={n.x+13} y={n.y+16} width={n.w} height={n.h}
      rx={25} fill="#010713" opacity={.76}/>
    <path d={'M '+(n.x+30)+' '+n.y+' H '+(n.x+n.w-31)+
      ' L '+(n.x+n.w)+' '+(n.y+31)+' V '+(n.y+n.h-31)+
      ' L '+(n.x+n.w-31)+' '+(n.y+n.h)+' H '+(n.x+30)+
      ' L '+n.x+' '+(n.y+n.h-31)+' V '+(n.y+30)+' Z'}
      fill="#071C2C" stroke={accent} strokeWidth={3.5}
      strokeLinejoin="round" strokeOpacity={.95}/>
    <path d={'M '+(n.x+42)+' '+(n.y+72)+' H '+(n.x+n.w-42)}
      stroke="#27445C" strokeWidth={1.8} opacity={.75}/>
    <text x={n.x+n.w/2} y={n.y+55} fill={WHITE}
      fontSize={n.font} fontFamily={FONT} textAnchor="middle"
      fontWeight={850} letterSpacing="-.018em">{n.title}</text>
    {portY.map((y,i)=><g key={'lane-'+i}>
      <path d={'M '+left+' '+y+' H '+(left+width)}
        fill="none" stroke={i===1?VIOLET:CYAN} strokeWidth={5}
        strokeLinecap="round" opacity={.27+.36*motion}/>
      <path d={'M '+left+' '+y+' H '+(left+width)}
        fill="none" stroke={i===1?VIOLET:CYAN} strokeWidth={1.6}
        strokeDasharray="5 12" opacity={.34+.3*motion}/>
      {motion>.04&&[0,1,2].map(packet=><rect
        key={'packet-'+packet}
        x={left+((progress+packet*125+i*52)%width)}
        y={y-4.5} width={19} height={9} rx={4.5}
        fill={i===1?VIOLET:CYAN}
        opacity={capacity?(packet===0 ? .7 : .2):(.7+.3*motion)}
      />)}
      <rect x={n.x-5} y={y-10} width={12} height={20} rx={4}
        fill="#12334A" stroke={i===1?VIOLET:CYAN} strokeWidth={2}/>
      <rect x={n.x+n.w-7} y={y-10} width={12} height={20} rx={4}
        fill="#12334A" stroke={i===1?VIOLET:CYAN} strokeWidth={2}/>
    </g>)}
    <rect x={n.x+n.w/2-39} y={n.y+88} width={78} height={105}
      rx={12} fill="#0A2539" stroke={accent} strokeWidth={2.3}/>
    <path d={'M '+(n.x+n.w/2-17)+' '+(n.y+113)+
      ' H '+(n.x+n.w/2+17)+' M '+(n.x+n.w/2-17)+
      ' '+(n.y+133)+' H '+(n.x+n.w/2+17)+' M '+
      (n.x+n.w/2-17)+' '+(n.y+153)+' H '+(n.x+n.w/2+17)}
      fill="none" stroke={accent} strokeWidth={3.2}
      strokeLinecap="round" opacity={.82}/>
    {status!=null&&<g>
      <rect x={n.x+n.w/2-134} y={n.y+202} width={268}
        height={29} rx={12} fill="#392919"
        stroke={color('AMBER')} strokeOpacity={.65}/>
      <text x={n.x+n.w/2} y={n.y+223} textAnchor="middle"
        fontFamily={FONT} fontSize={22} fontWeight={850} fill={AMBER}>
        {status==='14%'?'14% CAPACITY LOST':status}
      </text>
    </g>}
    {status==null&&<rect x={n.x+n.w/2-51} y={n.y+214}
      width={102} height={5} rx={2.5} fill={accent} opacity={.48}/>}
  </g>;
};

const Track:React.FC<{
  id:TrackId;intensity:number;frame:number;tone:string;slow:boolean
}>=({id,intensity,frame,tone,slow})=>{
  if(intensity<=.025)return null;
  const path=EP004_SHOT05_TRACKS[id].path;
  const speed=slow ? .25 : .57;
  const offset=-(frame*speed)%100;
  return <g opacity={intensity}>
    <path d={path} fill="none" stroke="#1B4057"
      strokeWidth={7} strokeLinejoin="round" strokeLinecap="round"/>
    <path d={path} fill="none" stroke={tone}
      strokeWidth={3.2} strokeOpacity={.67} strokeLinecap="round"
      strokeLinejoin="round"/>
    {Array.from({length:slow?2:3},(_,i)=>
      <path key={i} d={path} pathLength={100}
        fill="none" stroke={tone} strokeWidth={10.5}
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="3.3 96.7" strokeDashoffset={offset-i*31.3}
        opacity={slow ? .73 : 1}/>)}
  </g>;
};

const FlowWorld:React.FC<{scene:Ep004Shot05ClarityState}>=({scene})=>{
  const now=scene.stage;
  const prev=scene.previousStage;
  const changing=scene.stageTransition;
  const seen=new Set(scene.visibleHistory);
  const capacity=now.key==='CAPACITY'||now.key==='CAPACITY_14'
    ||now.key==='DEGRADED';
  const switching=now.key==='SWITCH';
  const oldLanes=prev?.lanes??[];
  const activeLanes=now.lanes;
  const strength=(id:TrackId)=>{
    const old=oldLanes.includes(id) ? .78 : 0;
    let next=activeLanes.includes(id)?scene.flowActivation:0;
    if(now.key==='SHARED'||now.key==='CONSEQUENCE'){
      if(id==='TEAMS_FAILOVER'||id==='PRIMARY_TEAMS')
        next*=scene.secondLaneActivation;
    }
    if(switching)next*=id==='TEAMS_ALTERNATIVE'||id==='ALTERNATIVE_TEAMS'
      ?1-scene.switchActivation:scene.switchActivation;
    if(capacity)next=activeLanes.includes(id) ? .58 : 0;
    return mix(old,next,changing);
  };
  const opacity=(id:NodeId)=>{
    const old=prev?.visible.includes(id)?1:(seen.has(id)?.25:0);
    const next=now.visible.includes(id)
      ?(capacity&&id!=='primary' ? .42 : 1)
      :(seen.has(id)?.25:0);
    return mix(old,next,changing);
  };
  const laneColor=(key:TrackId)=>key.includes('TEAMS')||
    key.includes('ALTERNATIVE')?VIOLET:CYAN;
  const traffic=Math.max(strength('OUTLOOK_PRIMARY'),
    strength('TEAMS_FAILOVER'));
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="shot05V4WorldDepth">
        <stop offset="0%" stopColor="#12314A" stopOpacity={.42}/>
        <stop offset="100%" stopColor={BG} stopOpacity={0}/>
      </radialGradient>
    </defs>
    <ellipse cx={957} cy={554} rx={810} ry={520}
      fill="url(#shot05V4WorldDepth)"/>
    <g stroke="#1F3447" strokeWidth={1} opacity={.26}>
      <path d="M 143 249 H 1788 M 143 916 H 1788" fill="none"/>
    </g>
    {(Object.keys(EP004_SHOT05_TRACKS) as TrackId[]).map(key=>
      <Track key={key} id={key} intensity={strength(key)}
        frame={scene.frame} tone={laneColor(key)} slow={capacity}/>)}
    <Node nodeId="outlook" intensity={opacity('outlook')}
      tone={CYAN} status={null} capacity={false}
      motion={scene.flowActivation} frame={scene.frame}/>
    <Node nodeId="teams" intensity={opacity('teams')}
      tone={VIOLET} status={null} capacity={false}
      motion={scene.flowActivation} frame={scene.frame}/>
    <Node nodeId="exchange" intensity={opacity('exchange')}
      tone={CYAN} status={null} capacity={false}
      motion={scene.flowActivation} frame={scene.frame}/>
    <Node nodeId="teamsService" intensity={opacity('teamsService')}
      tone={VIOLET} status={null} capacity={false}
      motion={scene.flowActivation} frame={scene.frame}/>
    <Node nodeId="alternative" intensity={opacity('alternative')}
      tone={VIOLET} status={null} capacity={false}
      motion={scene.switchActivation} frame={scene.frame}/>
    <Node nodeId="primary" intensity={opacity('primary')}
      tone={now.visible.includes('primary')?color(now.accent):CYAN}
      status={now.primaryStatus} capacity={capacity}
      motion={Math.max(traffic,scene.flowActivation*.45)}
      frame={scene.frame}/>
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
