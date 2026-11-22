import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {AT_FONT} from '../../components/architectural-thinking';
import {
  EP004_SHOT05_XRAY_ROUTES,
  ep004Shot05XrayPath,
  ep004Shot05XrayPosition
} from '../../components/architectural-thinking/EP004Shot05CinematicWorld.mjs';
import {
  ep004Shot05ProductionWorld,validateEp004Shot05Production
} from '../../components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
import type {Ep004Shot05RenderProps}
  from '../../components/architectural-thinking/EP004Shot05ProductionWorld.mjs';

const NAVY='#020811';
const WHITE='#F2FBFF';
const INACTIVE='#6C8196';
const CYAN='#72DFFF';
const MINT='#6FEBD2';
const VIOLET='#B9A1FF';
const AMBER='#E8AD69';
const PANEL='#071626';
const BORDER='#25405A';
const HEAD='#9EC3D9';
const ease=(n:number)=>{
  const t=Math.max(0,Math.min(1,n));
  return t*t*(3-2*t);
};
const palette=(name:string)=>name==='AMBER'?AMBER:
  name==='VIOLET'?VIOLET:name==='CYAN'?CYAN:MINT;

type NodeKey='outlookClient'|'teamsClient'|'primary'|
  'alternative'|'mailbox'|'teamsService';

const NodeShell:React.FC<{
  x:number;y:number;w:number;h:number;label:string;
  caption:string;tone:string;active:boolean
}>=({x,y,w,h,label,caption,tone,active})=>{
  return <g opacity={active?1:.51}>
    <rect x={x+12} y={y+13} width={w} height={h} rx={19}
      fill="#000A13" opacity={.7}/>
    <rect x={x} y={y} width={w} height={h} rx={19}
      fill={PANEL} stroke={active?tone:BORDER}
      strokeWidth={active?3:2}/>
    <rect x={x+18} y={y+19} width={5} height={h-38} rx={2.5}
      fill={tone} opacity={active?1:.35}/>
    <text x={x+40} y={y+46} fontSize={25} fontWeight={850}
      fill={WHITE} fontFamily={AT_FONT}>{label}</text>
    <text x={x+40} y={y+76} fontSize={17} fontWeight={600}
      fill={HEAD} fontFamily={AT_FONT}>{caption}</text>
  </g>;
};

const XRayGateway:React.FC<{
  active:boolean;accent:string;routeProgress:number;
  switchProgress:number;degraded:boolean
}>=({active,accent,routeProgress,switchProgress,degraded})=>{
  return <g>
    <rect x={777} y={340} width={401} height={337} rx={26}
      fill="#00070F" opacity={.72}/>
    <rect x={760} y={324} width={401} height={337} rx={26}
      fill="#071A2B" stroke={active?accent:'#31506B'}
      strokeWidth={active?3.5:2}/>
    <rect x={781} y={345} width={8} height={296} rx={4}
      fill={active?accent:INACTIVE} opacity={active?.9:.4}/>
    <text x={809} y={374} fill={WHITE} fontFamily={AT_FONT}
      fontSize={31} fontWeight={900}>PRIMARY GATEWAY</text>
    <text x={809} y={407} fill={HEAD} fontFamily={AT_FONT}
      fontSize={17} fontWeight={650}>SHARED ROUTING BOUNDARY</text>
    <rect x={808} y={430} width={322} height={204} rx={18}
      fill="#04121F" stroke={BORDER} strokeWidth={1.6}/>
    <path d="M 808 466 H 869 M 808 571 H 869 M 1069 466 H 1130 M 1069 571 H 1130"
      fill="none" stroke={active?accent:INACTIVE} strokeWidth={3.5}
      opacity={active?.75:.35}/>
    <rect x={871} y={452} width={195} height={132} rx={16}
      fill="#0A2237" stroke={active?accent:'#33526B'}
      strokeWidth={active?2.6:1.4}/>
    <text x={969} y={490} fill={WHITE} fontFamily={AT_FONT}
      textAnchor="middle" fontSize={23} fontWeight={800}>ROUTE POLICY</text>
    <text x={969} y={518} fill={HEAD} fontFamily={AT_FONT}
      textAnchor="middle" fontSize={17} fontWeight={650}>MATCH → FORWARD</text>
    <path d="M 910 548 H 1028" fill="none"
      stroke={degraded?AMBER:accent} strokeWidth={5}
      opacity={active?.27+.7*routeProgress:.22}/>
    <rect x={915+83*switchProgress} y={544}
      width={17} height={9} rx={4.5} fill={degraded?AMBER:accent}
      opacity={active?routeProgress:0}/>
    <text x={807} y={615} fill={degraded?AMBER:HEAD}
      fontFamily={AT_FONT} fontSize={16} fontWeight={750}>
      {degraded?'DEPENDENCY CONSTRAINED':'TRAFFIC ROUTING'}
    </text>
  </g>;
};

const RouteLine:React.FC<{
  routeKey:keyof typeof EP004_SHOT05_XRAY_ROUTES;
  age:number;intensity:number;degraded:boolean
}>=({routeKey,age,intensity,degraded})=>{
  const points=EP004_SHOT05_XRAY_ROUTES[routeKey];
  const violet=routeKey.includes('TEAMS')||routeKey.includes('ALTERNATIVE');
  const tone=violet?VIOLET:CYAN;
  if(intensity<=0)return null;
  const path=ep004Shot05XrayPath(points);
  const packetNodes=Array.from({length:3},(_,i)=>{
    const local=(Math.max(0,age)-i*49);
    const phase=((local%240)+240)%240;
    const t=phase/164;
    if(local<0||t>1||degraded)return null;
    const pos=ep004Shot05XrayPosition(points,t);
    const trail=ep004Shot05XrayPosition(points,Math.max(0,t-.06));
    const visibility=ease(t*14)*ease((1-t)*14);
    return <g key={i} opacity={intensity*visibility}>
      <path d={'M '+trail.x+' '+trail.y+' L '+pos.x+' '+pos.y}
        stroke={tone} strokeWidth={4} strokeLinecap="round"
        fill="none"/>
      <rect x={pos.x-7} y={pos.y-4} width={14} height={8} rx={4}
        fill={tone} stroke={WHITE} strokeWidth={.75}/>
    </g>;
  });
  return <g>
    <path d={path} fill="none" stroke={tone} strokeWidth={4}
      strokeLinecap="round" opacity={.75*intensity}/>
    {packetNodes}
  </g>;
};

const ActivityWorld:React.FC<{
  stageKey:string;age:number;opacity:number;
  progress:number;switchProgress:number;routeKeys:readonly string[];
  activeNodes:readonly string[];accent:string
}>=({stageKey,age,opacity,progress,switchProgress,routeKeys,activeNodes,accent})=>{
  const known=Object.keys(EP004_SHOT05_XRAY_ROUTES) as Array<
    keyof typeof EP004_SHOT05_XRAY_ROUTES>;
  const impaired=stageKey==='DEGRADED';
  const switching=stageKey==='SWITCH'||stageKey==='CONFIG';
  const on=(key:NodeKey)=>activeNodes.includes(key);
  const strength=(key:string)=>{
    if(!routeKeys.includes(key))return 0;
    if(!switching)return progress;
    return progress*(key==='TEAMS_ALTERNATIVE'||key==='ALTERNATIVE_TEAMS'
      ?1-switchProgress:switchProgress);
  };
  const main=on('primary');
  const alt=on('alternative');
  return <g opacity={opacity}>
    <defs>
      <radialGradient id="shot05GatewayDepth">
        <stop offset="0%" stopColor="#12283A" stopOpacity={.58}/>
        <stop offset="100%" stopColor={NAVY} stopOpacity={0}/>
      </radialGradient>
    </defs>
    <ellipse cx={1000} cy={560} rx={780} ry={520}
      fill="url(#shot05GatewayDepth)"/>
    <g stroke="#254056" strokeWidth={1} opacity={.28}>
      <path d="M 80 265 H 1830 M 80 980 H 1830"/>
      <path d="M 710 280 V 960 M 1215 280 V 960"/>
    </g>
    <g>
      {known.map(key=><path key={key}
        d={ep004Shot05XrayPath(EP004_SHOT05_XRAY_ROUTES[key])}
        fill="none" stroke={BORDER} strokeWidth={3}
        strokeLinecap="round" opacity={.7}/>)}
    </g>
    <NodeShell x={115} y={339} w={270} h={107}
      label="OUTLOOK" caption="MAIL REQUEST" tone={CYAN} active={on('outlookClient')}/>
    <NodeShell x={115} y={680} w={270} h={107}
      label="TEAMS" caption="COLLABORATION REQUEST" tone={VIOLET}
      active={on('teamsClient')}/>
    <NodeShell x={1451} y={338} w={342} h={126}
      label="EXCHANGE ONLINE" caption="MAILBOX DESTINATION" tone={CYAN}
      active={on('mailbox')}/>
    <NodeShell x={1451} y={643} w={342} h={126}
      label="MICROSOFT TEAMS" caption="COLLABORATION SERVICE"
      tone={VIOLET} active={on('teamsService')}/>
    <XRayGateway active={main} accent={accent}
      routeProgress={progress} switchProgress={switchProgress}
      degraded={impaired}/>
    <NodeShell x={787} y={784} w={350} h={127}
      label="ALTERNATIVE GATEWAY" caption="SEPARATE ROUTING BOUNDARY"
      tone={VIOLET} active={alt}/>
    <g>
      {known.map(key=><RouteLine key={key}
        routeKey={key} age={age}
        intensity={strength(key)}
        degraded={impaired}/>)}
    </g>
    {impaired&&<g opacity={progress}>
      <rect x={742} y={519} width={18} height={93} rx={9}
        fill={AMBER} opacity={.65}/>
      <text x={653} y={638} fill={AMBER} fontSize={23}
        fontFamily={AT_FONT} fontWeight={800}>BLOCKED</text>
    </g>}
    {switching&&<g opacity={progress}>
      <path d="M 720 933 H 1210" stroke={VIOLET} strokeWidth={3}
        opacity={.58} fill="none"/>
      <text x={963} y={956} textAnchor="middle" fill={VIOLET}
        fontFamily={AT_FONT} fontSize={23} fontWeight={800}>
        {switchProgress<.5?'PREVIOUS ROUTE':'ROUTE SHIFTED'}
      </text>
    </g>}
  </g>;
};

const EditorialOverlay:React.FC<{
  shotTitle:string;chapter:string;detail:string;
  opacity:number;accent:string;progress:number;stageKey:string
}>=({shotTitle,chapter,detail,opacity,accent,progress,stageKey})=>{
  const displayTitle=shotTitle.length>66?
    shotTitle.slice(0,63).trimEnd()+'…':shotTitle;
  return <svg width={1920} height={1080} viewBox="0 0 1920 1080"
    style={{fontFamily:AT_FONT}} aria-label="Cinematic routing cutaway narration captions">
    <g opacity={opacity}>
      <rect x={115} y={55} width={1390} height={155} rx={20}
        fill="#041321" fillOpacity={.94}/>
      <path d="M 139 83 H 255" stroke={accent} strokeWidth={4}
        strokeLinecap="round"/>
      <text x={143} y={113} fill={HEAD} fontSize={18}
        fontWeight={750} letterSpacing="0.11em">INSIDE THE ARCHITECTURE</text>
      <text x={143} y={159} fill={WHITE} fontSize={42}
        fontWeight={900} letterSpacing="-.025em">{chapter}</text>
      <text x={764} y={158} fill={HEAD} fontSize={24}
        fontWeight={650}>{detail}</text>
      <text x={140} y={191} fill={INACTIVE} fontSize={15}
        fontWeight={700}>{displayTitle.toUpperCase()}</text>
    </g>
    <g opacity={opacity*.88}>
      <rect x={352} y={978} width={1216} height={69} rx={15}
        fill="#041321" fillOpacity={.96}/>
      <text x={394} y={1021} fill={progress<.32?accent:HEAD}
        fontWeight={800} fontSize={21}>REQUEST</text>
      <text x={707} y={1021} fill={progress>=.32&&progress<.78?accent:HEAD}
        fontWeight={800} fontSize={21}>ROUTE DECISION</text>
      <text x={1195} y={1021} fill={progress>=.78&&stageKey!=='DEGRADED'?accent:HEAD}
        fontWeight={800} fontSize={21}>
        {stageKey==='DEGRADED'?'DEPENDENCY IMPACT':'DESTINATION'}
      </text>
      <path d="M 526 1015 H 666 M 955 1015 H 1150"
        fill="none" stroke={accent} strokeWidth={2.5}
        opacity={.55}/>
      <circle cx={526+140*ease(progress/.48)} cy={1015} r={4.5}
        fill={accent} opacity={.8}/>
      <circle cx={955+195*ease((progress-.45)/.55)} cy={1015} r={4.5}
        fill={accent} opacity={.8}/>
    </g>
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
  const state=ep004Shot05ProductionWorld(frame,props);
  const shot=state.cinematic;
  const stage=shot.stage;
  const color=palette(stage.accent);
  const focusRoutes=stage.paths;
  const cam=shot.camera;
  const worldTransform='translate3d('+cam.x+'px,'+cam.y+
    'px,0) scale('+cam.scale+')';
  return <AbsoluteFill style={{background:NAVY,overflow:'hidden'}}>
    <AbsoluteFill style={{opacity:shot.interiorOpacity,
      transform:worldTransform,transformOrigin:'960px 548px',
      pointerEvents:'none'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <ActivityWorld
          stageKey={stage.key} age={shot.beatAge}
          opacity={1} progress={shot.routeProgress}
          switchProgress={shot.actionProgress}
          routeKeys={focusRoutes} activeNodes={stage.nodes}
          accent={color}/>
      </svg>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:40}}>
      <EditorialOverlay
        shotTitle={props.shotTitle} chapter={stage.title}
        detail={stage.subtitle} opacity={shot.captionOpacity*shot.interiorOpacity}
        accent={color} progress={shot.actionProgress}
        stageKey={stage.key}/>
    </AbsoluteFill>
    {frame<112&&props.previousLastFrameDataUri&&
      <AbsoluteFill style={{pointerEvents:'none',zIndex:85,
        opacity:shot.sourceOpacity,
        transform:'scale('+shot.sourcePush+')',
        transformOrigin:'69% 49%'}}>
        <Img src={props.previousLastFrameDataUri}
          style={{width:1920,height:1080,objectFit:'fill'}}/>
      </AbsoluteFill>}
  </AbsoluteFill>;
};
