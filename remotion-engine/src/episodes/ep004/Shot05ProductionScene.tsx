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
({title,accent,opacity})=>{
  if(opacity<=0)return null;
  const box=ep004Shot05TextBox(title);
  return <g opacity={opacity}>
    <rect x={box.x} y={box.y} width={box.width} height={box.height}
      rx={28} fill="#0A1A29" stroke={accent} strokeOpacity={.27}
      strokeWidth={1.4}/>
    <text x={960} y={box.y+box.height/2+16}
      fontFamily={FONT} fontSize={box.font}
      textAnchor="middle" fill={WHITE} fontWeight={760}
      letterSpacing="-.012em">{title}</text>
  </g>;
};


const Endpoint:React.FC<{nodeId:NodeId;tone:string;intensity:number}>=({nodeId,tone,intensity})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.w)throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  return <g opacity={intensity}>
    <rect x={n.x-7} y={n.y+8} width={n.w+14} height={n.h+9} rx={32} fill="#02070F" opacity={.44}/>
    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={27} fill="url(#shot05V6Panel)" stroke="#7892AB" strokeOpacity={.23} strokeWidth={1.3}/>
    <rect x={n.x+1.5} y={n.y+1.5} width={n.w-3} height={n.h-3} rx={26} fill="none" stroke={tone} strokeOpacity={.12} strokeWidth={1}/>
    <rect x={n.x+18} y={n.y+24} width={4} height={n.h-48} rx={2} fill={tone} opacity={.65}/>
    <text x={n.x+n.w/2+6} y={n.y+n.h/2+n.font*.35} fontFamily={FONT} fontSize={n.font} fontWeight={760} textAnchor="middle" fill={WHITE}>{n.title}</text>
  </g>;
};
const Gateway:React.FC<{nodeId:'primary'|'alternative';mail:number;teams:number;pressure:number;exact14:boolean;coreReveal:number;processing:number}>=({nodeId,mail,teams,pressure,exact14,coreReveal,processing})=>{
  const n=EP004_SHOT05_NODES[nodeId];
  const main=nodeId==='primary';
  const tone=main?CYAN:VIOLET;
  const activity=Math.max(mail,teams);
  const center=n.x+n.w/2;
  const meterX=n.x+43,meterWidth=n.w-86,meterY=n.y+n.h-29;
  const loss=exact14?pressure*.14:0;
  if(ep004Shot05MeasuredTextWidth(n.title,n.font)+54>n.w)throw Error('SHOT05_LABEL_CLIP_'+nodeId);
  const lanes=main?[{y:404,tone:CYAN,weight:mail,reveal:1},{y:495,tone:VIOLET,weight:teams,reveal:coreReveal}]:[{y:745,tone:VIOLET,weight:teams,reveal:1}];
  return <g>
    <ellipse cx={center} cy={n.y+n.h/2} rx={n.w*.65} ry={n.h*.70} fill={tone} opacity={.026+.018*activity}/>
    <rect x={n.x-8} y={n.y+10} width={n.w+16} height={n.h+9} rx={40} fill="#000610" opacity={.53}/>
    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={34} fill="url(#shot05V6Gateway)" stroke="#7994A9" strokeOpacity={.32} strokeWidth={1.5}/>
    <rect x={n.x+2} y={n.y+2} width={n.w-4} height={n.h-4} rx={32} fill="none" stroke={tone} strokeOpacity={.14+.18*activity} strokeWidth={1.4}/>
    <rect x={n.x+2} y={n.y+2} width={n.w-4} height={n.h-4} rx={32} fill="none" stroke={color('AMBER')} strokeOpacity={pressure*.65} strokeWidth={2.1}/>
    <path d={'M '+(n.x+34)+' '+(n.y+3)+' H '+(n.x+n.w-34)} fill="none" stroke="#D6E8F4" strokeOpacity={.20} strokeWidth={1.5} strokeLinecap="round"/>
    <text x={center} y={n.y+47} fill={WHITE} fontFamily={FONT} fontSize={n.font} textAnchor="middle" fontWeight={760} letterSpacing="-.012em">{n.title}</text>
    <rect x={center-79} y={n.y+63} width={158} height={130} rx={27} fill="url(#shot05V6Core)" stroke="#A3BBCD" strokeOpacity={.20+.12*processing} strokeWidth={1.3}/>
    <ellipse cx={center} cy={n.y+128} rx={77} ry={62} fill={tone} opacity={.035+.12*processing}/>
    {[0,1,2].map(i=><rect key={i} x={center-32+i*23} y={n.y+120} width={14} height={14} rx={7} fill={tone} opacity={.15+processing*(.42+i*.12)}/>)}
    {lanes.map(l=>{
      if(l.reveal<=0)return null;
      const live=.22+.55*l.weight;
      const end=n.x+n.w*l.reveal;
      return <g key={l.y} opacity={Math.min(1,l.reveal*12)}>
        <path d={'M '+n.x+' '+l.y+' H '+end} stroke={l.tone} strokeWidth={14} opacity={.06+.08*l.weight} strokeLinecap="round"/>
        <path d={'M '+n.x+' '+l.y+' H '+end} stroke={l.tone} strokeWidth={3.1} opacity={live} strokeLinecap="round"/>
        <circle cx={n.x} cy={l.y} r={6.5} fill="#132A3C" stroke={l.tone} strokeOpacity={.55} strokeWidth={1.8}/>
        {l.reveal>=1&&<circle cx={n.x+n.w} cy={l.y} r={6.5} fill="#132A3C" stroke={l.tone} strokeOpacity={.55} strokeWidth={1.8}/>}
      </g>;
    })}
    <rect x={meterX} y={meterY} width={meterWidth} height={8} rx={4} fill="#24384B" opacity={.72}/>
    <rect x={meterX} y={meterY} width={meterWidth*(1-loss)} height={8} rx={4} fill={MINT} opacity={.28+.42*activity}/>
    {exact14&&pressure>.01&&<rect x={meterX+meterWidth*(1-loss)} y={meterY} width={meterWidth*loss} height={8} rx={4} fill={AMBER} opacity={.82}/>}
    {!exact14&&pressure>.01&&<rect x={meterX} y={meterY} width={meterWidth} height={8} rx={4} fill={AMBER} opacity={pressure*.72}/>}
  </g>;
};
const Track:React.FC<{id:TrackId;tone:string;strength:number;reveal:number}>=({id,tone,strength,reveal})=>{
  // Hidden means not mounted, not an inactive ghost or a faint placeholder.
  if(reveal<=0)return null;
  const path=EP004_SHOT05_TRACKS[id].path;
  const dash=reveal<1?reveal+' 1':undefined;
  const opacity=Math.min(1,reveal*12);
  return <g opacity={opacity}>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke={tone} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" opacity={.025+.07*strength}/>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke="#7893A9" strokeWidth={5.5} strokeLinejoin="round" strokeLinecap="round" opacity={.13+.23*strength}/>
    <path d={path} pathLength={1} strokeDasharray={dash} fill="none" stroke={tone} strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" opacity={.14+.60*strength}/>
  </g>;
};
const FlowWorld:React.FC<{scene:Ep004Shot05ClarityState}>=({scene})=>{
  const m=scene.migration;
  const focus=scene.stage.key;
  const previous=scene.previousStage?.key??focus;
  const mailFocus=(k:string)=>k!=='TEAMS'&&k!=='ALTERNATIVE';
  const teamsFocus=(k:string)=>k!=='MAIL'&&k!=='PRIMARY';
  const emphasis=(a:boolean,b:boolean)=>mix(a?.98:.73,b?.98:.73,scene.stageTransition);
  const mailStrength=mix(mailFocus(previous)?1:.72,mailFocus(focus)?1:.72,scene.stageTransition);
  const weights:Record<TrackId,number>={
    OUTLOOK_PRIMARY:mailStrength,PRIMARY_MAILBOX:mailStrength,
    TEAMS_ALTERNATIVE:m.oldStrength,ALTERNATIVE_TEAMS:m.oldStrength,
    TEAMS_FAILOVER:m.newStrength,PRIMARY_TEAMS:m.newStrength
  };
  const reveals:Record<TrackId,number>={OUTLOOK_PRIMARY:1,PRIMARY_MAILBOX:1,TEAMS_ALTERNATIVE:1,ALTERNATIVE_TEAMS:1,TEAMS_FAILOVER:m.ingressReveal,PRIMARY_TEAMS:m.egressReveal};
  const processing=(id:'primary'|'alternative')=>{
    const n=EP004_SHOT05_NODES[id];
    return m.packets.reduce((v,p)=>{
      if(p.x<n.x||p.x>n.x+n.w||p.y<n.y||p.y>n.y+n.h)return v;
      const d=Math.abs(p.x-(n.x+n.w/2))/90;
      const t=Math.max(0,1-d);
      return Math.max(v,t*t*(3-2*t)*p.opacity);
    },0);
  };
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="shot05V6Depth"><stop offset="0%" stopColor="#18384E" stopOpacity={.50}/><stop offset="100%" stopColor={BG} stopOpacity={0}/></radialGradient>
      <linearGradient id="shot05V6Gateway" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1A3449"/><stop offset="45%" stopColor="#102537"/><stop offset="100%" stopColor="#0A1928"/></linearGradient>
      <radialGradient id="shot05V6Core"><stop offset="0%" stopColor="#28475B"/><stop offset="100%" stopColor="#122637"/></radialGradient>
      <linearGradient id="shot05V6Panel" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#11283C"/><stop offset="100%" stopColor="#071522"/></linearGradient>
    </defs>
    <ellipse cx={960} cy={558} rx={825} ry={520} fill="url(#shot05V6Depth)"/>
    <g stroke="#20374A" strokeWidth={1} opacity={.25}><path d="M 143 249 H 1788 M 143 942 H 1788" fill="none"/></g>
    {(Object.keys(EP004_SHOT05_TRACKS) as TrackId[]).map(id=><Track key={id} id={id} tone={id==='OUTLOOK_PRIMARY'||id==='PRIMARY_MAILBOX'?CYAN:VIOLET} strength={weights[id]} reveal={reveals[id]}/>)}
    <Endpoint nodeId="outlook" tone={CYAN} intensity={emphasis(mailFocus(previous),mailFocus(focus))}/>
    <Endpoint nodeId="exchange" tone={CYAN} intensity={emphasis(mailFocus(previous),mailFocus(focus))}/>
    <Endpoint nodeId="teams" tone={VIOLET} intensity={emphasis(teamsFocus(previous),teamsFocus(focus))}/>
    <Endpoint nodeId="teamsService" tone={VIOLET} intensity={emphasis(teamsFocus(previous),teamsFocus(focus))}/>
    <Gateway nodeId="primary" mail={mailStrength} teams={m.newStrength} pressure={m.pressure} exact14={m.explicit14} coreReveal={m.coreReveal} processing={processing('primary')}/>
    <Gateway nodeId="alternative" mail={0} teams={m.oldStrength} pressure={0} exact14={false} coreReveal={1} processing={processing('alternative')}/>
    {m.packets.map(p=>{
      const tone=p.route==='MAIL'?CYAN:VIOLET;
      return <g key={p.id} transform={'translate('+p.x+' '+p.y+') rotate('+p.angle+')'} opacity={p.opacity}>
        <ellipse cx={-4} cy={0} rx={20} ry={8} fill={tone} opacity={.09}/>
        <ellipse cx={-3} cy={0} rx={14} ry={5.5} fill={tone} opacity={.20}/>
        <rect x={-9} y={-3.5} width={18} height={7} rx={3.5} fill={tone} opacity={.96}/>
        <circle cx={5} cy={0} r={2.5} fill={WHITE} opacity={.78}/>
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
