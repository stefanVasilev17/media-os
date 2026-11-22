import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {Shot03LivingArchitectureWorldView} from './Shot03LivingArchitectureV1';
import {AT_FONT} from '../../components/architectural-thinking';
import {EP004_SHOT03_NODES,EP004_SHOT03_ROUTES}
  from '../../components/architectural-thinking/EP004Shot03LivingWorld.mjs';
import {ep004BezierPath,ep004BezierPosition}
  from '../../components/architectural-thinking/EP004Shot01World.mjs';
import {ep004Shot05ProductionWorld,validateEp004Shot05Production}
  from '../../components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
import type {Ep004Shot05RenderProps}
  from '../../components/architectural-thinking/EP004Shot05ProductionWorld.mjs';

const CYAN='#68E5FF',VIOLET='#B49BFF',MINT='#6FECD4';
const AMBER='#F5A55A',WHITE='#F5FCFF',SECONDARY='#B1CDDF';
const nodeCenters=Object.fromEntries(
  Object.entries(EP004_SHOT03_NODES).map(([key,n])=>
    [key,{x:n.left+n.width/2,y:n.top+n.height/2}])
);
const primary=EP004_SHOT03_NODES.primary;
const alternative=EP004_SHOT03_NODES.alternative;
const primaryBorder=[
  'M',primary.left+20,primary.top,'H',primary.left+primary.width-20,
  'L',primary.left+primary.width,primary.top+21,
  'V',primary.top+primary.height-21,
  'L',primary.left+primary.width-20,primary.top+primary.height,
  'H',primary.left+20,'L',primary.left,primary.top+primary.height-21,
  'V',primary.top+21,'Z'
].join(' ');
const alternativeBorder=[
  'M',alternative.left+30,alternative.top,'H',alternative.left+alternative.width-30,
  'Q',alternative.left+alternative.width,alternative.top,
    alternative.left+alternative.width,alternative.top+29,
  'V',alternative.top+alternative.height-29,
  'Q',alternative.left+alternative.width,alternative.top+alternative.height,
    alternative.left+alternative.width-30,alternative.top+alternative.height,
  'H',alternative.left+30,
  'Q',alternative.left,alternative.top+alternative.height,
    alternative.left,alternative.top+alternative.height-29,
  'V',alternative.top+29,
  'Q',alternative.left,alternative.top,alternative.left+30,alternative.top,'Z'
].join(' ');

const GatewayHighlight:React.FC<{nodeKey:string;color:string;opacity:number}>=
({nodeKey,color,opacity})=>{
  const node=EP004_SHOT03_NODES[nodeKey as keyof typeof EP004_SHOT03_NODES];
  if(!node||opacity<=0)return null;
  return <g opacity={opacity}>
    {nodeKey==='primary'?<path d={primaryBorder} fill={color}
        fillOpacity={0.10} stroke={color} strokeWidth={3}/>:
     nodeKey==='alternative'?<path d={alternativeBorder} fill={color}
        fillOpacity={0.10} stroke={color} strokeWidth={3}/>:
      <rect x={node.left} y={node.top} width={node.width} height={node.height}
        rx={16} fill={color} fillOpacity={0.10}
        stroke={color} strokeWidth={3}/>}
  </g>;
};

function PacketStreams({worldFrame,elapsed,routeKeys,opacity,kind}:{
  worldFrame:number;elapsed:number;routeKeys:string[];
  opacity:number;kind:string;
}){
  if(opacity<=0||!routeKeys.length)return null;
  return <g opacity={opacity}>
    {routeKeys.map((routeKey,ri)=>{
      const points=EP004_SHOT03_ROUTES[
        routeKey as keyof typeof EP004_SHOT03_ROUTES];
      if(!points)return null;
      const violet=routeKey.includes('TEAMS')||routeKey.includes('ALTERNATIVE');
      const color=kind==='DEGRADED'?AMBER:violet?VIOLET:CYAN;
      const count=kind==='SHARED'?6:4;
      const speed=kind==='DEGRADED'?0.003:kind==='SHARED'?0.008:0.0058;
      const phaseOffset=worldFrame*speed+ri*.19+elapsed*.00025;
      return <g key={routeKey}>
        <path d={ep004BezierPath(points)} fill="none"
          stroke={color} strokeWidth={6} strokeLinecap="round"
          opacity={kind==='DEGRADED'?.23:.43}/>
        {Array.from({length:count},(_,index)=>{
          const phase=((phaseOffset+index/count)%1+1)%1;
          const at=ep004BezierPosition(points,phase);
          const before=ep004BezierPosition(points,Math.max(0,phase-.038));
          const arrival=Math.min(1,phase*15,(1-phase)*15);
          return <g key={index} opacity={Math.max(0,arrival)}>
            <path d={'M '+before.x+' '+before.y+' L '+at.x+' '+at.y}
              fill="none" stroke={color}
              strokeLinecap="round" strokeWidth={3.2} opacity={.61}/>
            <circle cx={at.x} cy={at.y} r={5.6} fill={color}
              stroke={WHITE} strokeWidth={1.0}/>
          </g>;
        })}
      </g>;
    })}
  </g>;
}

export const Shot05ProductionScene:React.FC<Ep004Shot05RenderProps>=props=>{
  const frame=useCurrentFrame(),config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
    ||config.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT05_REQUIRES_APPROVED_1080P_30FPS_DURATION');
  validateEp004Shot05Production(props);
  const state=ep004Shot05ProductionWorld(frame,props);
  const current=props.shotTitle.length>54
    ?props.shotTitle.slice(0,51).trimEnd()+'…':props.shotTitle;
  const old=props.previousShot04Props.shotTitle.length>54
    ?props.previousShot04Props.shotTitle.slice(0,51).trimEnd()+'…'
    :props.previousShot04Props.shotTitle;
  const oldKey=Object.keys(nodeCenters).find(key=>
    Math.abs(nodeCenters[key].x-state.previous.focusX)<16&&
    Math.abs(nodeCenters[key].y-state.previous.focusY)<16)??'primary';
  const active=state.route?.focus??oldKey;
  const color=state.activeColor==='AMBER'?AMBER:
    state.activeColor==='VIOLET'?VIOLET:MINT;
  return <AbsoluteFill style={{background:'#030B17',overflow:'hidden'}}>
    <AbsoluteFill style={{
      transform:'translate3d('+state.panX+'px,0,0) scale('+state.cameraScale+')',
      transformOrigin:'1360px 535px'
    }}>
      <Shot03LivingArchitectureWorldView state={state.storyboard}
        showStoryboardFooter={false} headingOpacity={0}/>
      <AbsoluteFill style={{pointerEvents:'none',zIndex:40,
        transform:'translate3d('+state.storyboard.cameraX+'px,0,0) scale('+
          state.storyboard.cameraScale+')',
        transformOrigin:'960px 540px'}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080"
          style={{overflow:'visible'}}>
          <GatewayHighlight nodeKey={oldKey} color={MINT}
            opacity={state.oldOpacity*state.previous.focusAlpha}/>
          <GatewayHighlight nodeKey={active} color={color}
            opacity={state.routeOpacity}/>
          <PacketStreams worldFrame={state.worldFrame} elapsed={state.cueAge}
            routeKeys={state.route?.routes??[]}
            kind={state.route?.key??''} opacity={state.routeOpacity}/>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:45}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080"
        style={{fontFamily:AT_FONT}}>
        <g opacity={state.oldOpacity}>
          <rect x={542} y={61} rx={7} width={1175} height={103}
            fill="#061A2D" fillOpacity={.89}/>
          <text x={560} y={118} fill={WHITE} fontWeight={870}
            fontSize={old.length>41?27:33} letterSpacing="-.015em">
            {old.toUpperCase()}
          </text>
          <path d="M 560 142 H 1530" stroke={CYAN}
            strokeWidth={2} opacity={.62}/>
        </g>
        <g opacity={state.titleOpacity}>
          <rect x={542} y={61} rx={7} width={1175} height={103}
            fill="#061A2D" fillOpacity={.89}/>
          <text x={560} y={118} fill={WHITE} fontWeight={870}
            fontSize={current.length>41?27:33} letterSpacing="-.015em">
            {current.toUpperCase()}
          </text>
          <path d="M 560 142 H 1530" stroke={CYAN}
            strokeWidth={2} opacity={.62}/>
        </g>
      </svg>
    </AbsoluteFill>
    {frame===0&&props.previousLastFrameDataUri&&
      <AbsoluteFill style={{zIndex:99,pointerEvents:'none'}}>
        <Img src={props.previousLastFrameDataUri}
          style={{width:1920,height:1080,objectFit:'fill'}}/>
      </AbsoluteFill>}
  </AbsoluteFill>;
};
