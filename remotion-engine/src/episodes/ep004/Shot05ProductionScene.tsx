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


const Endpoint:React.FC<{nodeId:NodeId;tone:string;intensity:number}>=({nodeId,tone,intensity})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.w)
    throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  return <g opacity={intensity}>
    <rect x={n.x+7} y={n.y+10} width={n.w} height={n.h} rx={18} fill="#000713" opacity={.72}/>
    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={18} fill="url(#shot05V5Panel)" stroke={tone} strokeOpacity={.64} strokeWidth={2.2}/>
    <path d={'M '+(n.x+16)+' '+(n.y+17)+' V '+(n.y+n.h-17)} stroke={tone} strokeWidth={4} strokeLinecap="round" opacity={.8}/>
    <text x={n.x+n.w/2+6} y={n.y+n.h/2+n.font*.35} fontFamily={FONT} fontSize={n.font} fontWeight={810} textAnchor="middle" fill={WHITE}>{n.title}</text>
  </g>;
};
const Gateway:React.FC<{nodeId:'primary'|'alternative';mail:number;teams:number;pressure:number;exact14:boolean}>=({nodeId,mail,teams,pressure,exact14})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  const main=nodeId==='primary';
  const tone=main?CYAN:VIOLET;
  const accent=pressure>.01?AMBER:tone;
  const activity=Math.max(mail,teams);
  const shape='M '+(n.x+26)+' '+n.y+' H '+(n.x+n.w-26)+' L '+(n.x+n.w)+' '+(n.y+26)+' V '+(n.y+n.h-26)+' L '+(n.x+n.w-26)+' '+(n.y+n.h)+' H '+(n.x+26)+' L '+n.x+' '+(n.y+n.h-26)+' V '+(n.y+26)+' Z';
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.w)throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  const lanes=main?[{y:404,tone:CYAN,weight:mail},{y:495,tone:VIOLET,weight:teams}]:[{y:745,tone:VIOLET,weight:teams}];
  const center=n.x+n.w/2;
  const meterX=n.x+43,meterWidth=n.w-86,meterY=n.y+n.h-30;
  // Qualitative indicator except where the original cue explicitly states 14%.
  const loss=pressure*(exact14?.14:.26);
  return <g>
    <path d={shape} transform="translate(0 11)" fill="#01050D" opacity={.85}/>
    <path d={shape} fill="url(#shot05V5Gateway)" stroke={tone} strokeOpacity={.45+.45*activity} strokeWidth={3} strokeLinejoin="round"/>
    <path d={shape} fill="none" stroke={color('AMBER')} strokeOpacity={pressure*.95} strokeWidth={3.2} strokeLinejoin="round"/>
    <text x={center} y={n.y+48} fill={WHITE} fontFamily={FONT} fontSize={n.font} textAnchor="middle" fontWeight={850} letterSpacing="-.012em">{n.title}</text>
    {lanes.map(l=><g key={l.y}>
      <rect x={n.x+19} y={l.y-15} width={n.w-38} height={30} rx={12} fill="#061320" stroke="#29465C" strokeWidth={1.5}/>
      <path d={'M '+n.x+' '+l.y+' H '+(n.x+n.w)} stroke={l.tone} strokeWidth={3.5} opacity={.19+.62*l.weight} fill="none"/>
      <rect x={center-54} y={l.y-14} width={108} height={28} rx={9} fill="#132C41" stroke={l.tone} strokeOpacity={.25+.55*l.weight} strokeWidth={1.8}/>
      <path d={'M '+(center-54)+' '+l.y+' H '+(center+54)} stroke={l.tone} strokeWidth={3.5} opacity={.22+.65*l.weight}/>
      {[n.x,n.x+n.w].map(x=><rect key={x} x={x-5} y={l.y-12} width={10} height={24} rx={4} fill="#132C41" stroke={l.tone} strokeOpacity={.4+.5*l.weight} strokeWidth={2}/>)}
    </g>)}
    {!main&&<g opacity={.55+.35*activity}>
      <path d={'M '+(center-60)+' '+(n.y+134)+' H '+(center+60)+' M '+(center-60)+' '+(n.y+151)+' H '+(center+60)} stroke={VIOLET} strokeWidth={3} strokeLinecap="round" opacity={.42}/>
      <rect x={center-90} y={n.y+119} width={180} height={48} rx={12} fill="none" stroke="#29465C" strokeWidth={1.6}/>
    </g>}
    <rect x={meterX} y={meterY} width={meterWidth} height={10} rx={5} fill="#203247"/>
    <rect x={meterX} y={meterY} width={meterWidth*(1-loss)} height={10} rx={5} fill={MINT} opacity={.28+.45*activity}/>
    {pressure>.01&&<rect x={meterX+meterWidth*(1-loss)} y={meterY} width={meterWidth*loss} height={10} rx={5} fill={accent} opacity={.9}/>}
  </g>;
};
const Track:React.FC<{id:TrackId;tone:string;strength:number}>=({id,tone,strength})=>{
  const path=EP004_SHOT05_TRACKS[id].path;
  return <g>
    <path d={path} fill="none" stroke="#20364B" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" opacity={.36+.5*strength}/>
    <path d={path} fill="none" stroke={tone} strokeWidth={3.4} strokeLinejoin="round" strokeLinecap="round" opacity={.12+.72*strength}/>
  </g>;
};
const FlowWorld:React.FC<{scene:Ep004Shot05ClarityState}>=({scene})=>{
  const m=scene.migration;
  const focus=scene.stage.key;
  const emphasis=(isRelevant:boolean)=>isRelevant?.98:.73;
  const mailFocus=focus!=='TEAMS'&&focus!=='ALTERNATIVE';
  const teamsFocus=focus!=='MAIL'&&focus!=='PRIMARY';
  const mailStrength=mailFocus?1:.72;
  const weights:Record<TrackId,number>={
    OUTLOOK_PRIMARY:mailStrength,PRIMARY_MAILBOX:mailStrength,
    TEAMS_ALTERNATIVE:m.oldStrength,ALTERNATIVE_TEAMS:m.oldStrength,
    TEAMS_FAILOVER:m.newStrength,PRIMARY_TEAMS:m.newStrength
  };
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="shot05V5Depth"><stop offset="0%" stopColor="#18384E" stopOpacity={.50}/><stop offset="100%" stopColor={BG} stopOpacity={0}/></radialGradient>
      <linearGradient id="shot05V5Gateway" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#102B40"/><stop offset="100%" stopColor="#071725"/></linearGradient>
      <linearGradient id="shot05V5Panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#11283C"/><stop offset="100%" stopColor="#071522"/></linearGradient>
    </defs>
    <ellipse cx={960} cy={558} rx={825} ry={520} fill="url(#shot05V5Depth)"/>
    <g stroke="#20374A" strokeWidth={1} opacity={.25}><path d="M 143 249 H 1788 M 143 942 H 1788" fill="none"/></g>
    {(Object.keys(EP004_SHOT05_TRACKS) as TrackId[]).map(id=><Track key={id} id={id} tone={id==='OUTLOOK_PRIMARY'||id==='PRIMARY_MAILBOX'?CYAN:VIOLET} strength={weights[id]}/>)}
    <Endpoint nodeId="outlook" tone={CYAN} intensity={emphasis(mailFocus)}/>
    <Endpoint nodeId="exchange" tone={CYAN} intensity={emphasis(mailFocus)}/>
    <Endpoint nodeId="teams" tone={VIOLET} intensity={emphasis(teamsFocus)}/>
    <Endpoint nodeId="teamsService" tone={VIOLET} intensity={emphasis(teamsFocus)}/>
    <Gateway nodeId="primary" mail={mailStrength} teams={m.newStrength} pressure={m.pressure} exact14={m.explicit14}/>
    <Gateway nodeId="alternative" mail={0} teams={m.oldStrength} pressure={0} exact14={false}/>
    {m.packets.map(p=>{
      const tone=p.route==='MAIL'?CYAN:VIOLET;
      return <g key={p.id} transform={'translate('+p.x+' '+p.y+') rotate('+p.angle+')'} opacity={p.opacity}>
        <rect x={-15} y={-6} width={30} height={12} rx={6} fill={tone} opacity={.18}/>
        <rect x={-10} y={-3.5} width={20} height={7} rx={3.5} fill={tone}/>
        <rect x={4} y={-2.5} width={5} height={5} rx={2.5} fill={WHITE}/>
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
