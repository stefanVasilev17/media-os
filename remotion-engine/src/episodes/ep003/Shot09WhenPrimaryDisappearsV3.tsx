import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot08CleanArchitectureWorldV1} from '../ep002/Shot08CleanArchitectureWorldV1';
import {SHOT02_NODES,shot02Intersects} from '../ep002/Shot02PremiumLayout';
import {shot10TextWidth} from '../../../shot10-content-fit-layout.mjs';
import {PREMIUM_ROUTES,PREMIUM_ROUTE_STYLE,PREMIUM_OWNER_HEADER,premiumRouteD,
 premiumRouteEnd,premiumRoutePoint,validatePremiumRoutes}
 from '../../../ep003-premium-routing-v2.mjs';
import type {PremiumRoute} from '../../../ep003-premium-routing.mjs';
import {ep003CardIsReadable,ep003CardOpacity} from '../../../ep003-readable-card-policy.mjs';

const WHITE='#F5FCFF',SOFT='#B5D2E6',MINT='#6FECD4',CYAN='#68E5FF',AMBER='#F5A55A';
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const ease=(frame:number,start:number,duration:number)=>{
  const t=clamp((frame-start)/Math.max(1,duration));return t*t*(3-2*t);
};
const focusHold=(f:number,cue:number,duration=116)=>
  ease(f,cue,16)*(1-ease(f,cue+duration-19,19));
export const EP003_SHOT09_V2_PREDECESSOR={
 sourceRenderKey:'EP003_SHOT08_SHARDING_V3',
 sourceComposition:'EP003-SHOT08-SHARDING-V3-DIRECTOR-CANDIDATE',
 frames:5372,lastWorldFrame:34927+5372-1,fps:30,width:1920,height:1080
} as const;
const SELECTED_SLOW_NATURAL_TAKE='7510815a-d096-415f-b4f0-52ae8398ce45';
export const EP003_SHOT09_CUES=[
 'INTRO',
 'PRIMARY_AND_REPLICA',
 'PRIMARY_OWNS',
 'PRIMARY_FAIL',
 'REQUEST_FAILURE',
 'OTHER_SHARD',
 'RECOVERY_PATH',
 'PROMOTE',
 'FAILOVER',
 'LEGITIMATE_OWNER',
 'OLD_RETURN',
 'TWO_WRITERS',
 'SPLIT_BRAIN',
 'FENCING',
 'FENCE_MEANING',
 'DATA_RISK',
 'ASYNC',
 'LAG',
 'DATA_LOSS',
 'GREEN_ARROW',
 'CORRECTNESS',
 'INSTANCES',
 'WRONG_STATE',
 'TEST_FAILURES'
] as const;
export type Shot09Cue=typeof EP003_SHOT09_CUES[number];
export type Shot09Props={
 durationInFrames:number;voiceTakeId:string;
 previousRenderId:string;previousLastFrameSha256:string;
 previousLastFrameDataUri:string;worldStartFrame:number;
 cueFrames:Record<Shot09Cue,number>;
};
type Rect={left:number;top:number;width:number;height:number};
const bounds=(n:{x:number;y:number;width:number;height:number}):Rect=>({
 left:n.x-n.width/2,top:n.y,width:n.width,height:n.height
});
const REPLICA_ORIGIN={frames:3601,previousWriteCueFrame:1199};
const REPLICA_TITLE_BASELINE_OFFSET=98;
const REPLICA_TITLE_FONT_SIZE=20;
const REPLICA_ICON_SCALE=.92;
const REPLICAS=[
 {key:'A',title:'REPLICA A',left:1578,top:709,width:225,height:116,stroke:CYAN,route:PREMIUM_ROUTES.REPLICA_A},
 {key:'B',title:'REPLICA B',left:1578,top:852,width:225,height:116,stroke:MINT,route:PREMIUM_ROUTES.REPLICA_B}
] as const;
const QUERY_PATHS=[
 {key:'PRIMARY',color:CYAN,d:'M1497 523 C1520 523 1550 538 1572 550'},
 {key:'A',color:MINT,d:'M1425 660 C1510 707 1550 749 1650 757'},
 {key:'B',color:MINT,d:'M1444 660 C1546 708 1510 915 1650 906'}
] as const;
const replicaPath=(r:typeof REPLICAS[number])=>premiumRouteD(r.route);
const ROUTES=[
 {key:'A',color:CYAN,route:PREMIUM_ROUTES.AUTH_A,
  start:PREMIUM_ROUTES.AUTH_A.start,end:premiumRouteEnd(PREMIUM_ROUTES.AUTH_A)},
 {key:'B',color:MINT,route:PREMIUM_ROUTES.AUTH_B,
  start:PREMIUM_ROUTES.AUTH_B.start,end:premiumRouteEnd(PREMIUM_ROUTES.AUTH_B)}
] as const;
type RouteCarrier={route:PremiumRoute};
const routePath=(r:RouteCarrier)=>premiumRouteD(r.route);
const routePoint=(t:number,r:RouteCarrier)=>premiumRoutePoint(t,r.route);
const SHARD_NODES=[
 {key:'A',center:1606,top:410,color:CYAN},
 {key:'B',center:1771,top:410,color:MINT}
] as const;
const CALLOUTS=[
 {cue:'FAILOVER',endCue:'OLD_RETURN',title:'FAILOVER',
  meaning:'An eligible replica becomes\nthe new Primary.',color:MINT},
 {cue:'TWO_WRITERS',endCue:'FENCING',title:'SPLIT-BRAIN RISK',
  meaning:'Two machines may write\nto the same shard.',color:AMBER},
 {cue:'FENCING',endCue:'DATA_RISK',title:'FENCING',
  meaning:'Stop the former Primary\nfrom accepting writes.',color:CYAN},
 {cue:'ASYNC',endCue:'DATA_LOSS',title:'ASYNCHRONOUS REPLICATION',
  meaning:'A replica may lag behind recent writes.',color:CYAN},
 {cue:'DATA_LOSS',endCue:'TEST_FAILURES',title:'RECOVERY TRADE-OFF',
  meaning:'Failover may lose recent\ncommitted changes.',color:AMBER}
] as const;
const CARD_LEFT=560,CARD_TOP=771,CARD_HEIGHT=133;
export function shot09CardSize(title:string,meaning:string){
 const lines=meaning.split('\n');
 const fontSize=lines.length>1?26:29;
 const width=Math.ceil(Math.max(shot10TextWidth(title,23),
  ...lines.map(line=>shot10TextWidth(line,fontSize)))+80);
 const height=lines.length>1?165:CARD_HEIGHT;
 if(width<330||width>900||CARD_LEFT+width>1480||lines.length>2||
    lines.some(line=>line.trim().length===0))
  throw Error('EP003_SHOT09_CARD_TEXT_OUTSIDE_SAFE_AREA');
 return {width,height};
}
export function validateShot09(p:Shot09Props){
 validatePremiumRoutes();
 if(!p||!/^[0-9a-f-]{36}$/.test(p.previousRenderId)||
    p.worldStartFrame!==EP003_SHOT09_V2_PREDECESSOR.lastWorldFrame||
    p.voiceTakeId!==SELECTED_SLOW_NATURAL_TAKE||
    !/^[0-9a-f]{64}$/.test(p.previousLastFrameSha256)||
    !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||
    !Number.isInteger(p.durationInFrames)||p.durationInFrames<200||
    p.durationInFrames>18000)
    throw Error('EP003_SHOT09_REQUIRES_EXACT_LOCKED_SHOT08_V2_FRAME_AND_SELECTED_VOICE');
 let last=-1;
 for(const key of EP003_SHOT09_CUES){
  const f=p.cueFrames?.[key];
  if(!Number.isInteger(f)||f<last||f>=p.durationInFrames)
   throw Error('EP003_SHOT09_REAL_VOICE_CUE_INVALID_'+key);
  last=f;
 }
 if(p.cueFrames.INTRO<60)throw Error('EP003_SHOT09_TWO_SECOND_LIVING_WORLD_PRELUDE_REQUIRED');
 const existing=Object.entries(SHOT02_NODES)
  .filter(([key])=>key!=='database').map(([,node])=>bounds(node));
 const phone={left:55,top:160,width:445,height:800};
 const shards:Rect[]=[
  {left:1551,top:410,width:110,height:242},
  {left:1716,top:410,width:110,height:242}
 ];
 const iconBottom=8+(65+11)*REPLICA_ICON_SCALE;
 if(REPLICA_TITLE_BASELINE_OFFSET-16-iconBottom<3)
  throw Error('EP003_SHOT09_V2_REPLICA_ICON_AND_TITLE_COLLIDE');
 for(const r of REPLICAS){
  if(REPLICA_TITLE_BASELINE_OFFSET+5>r.height-10||
     shot10TextWidth(r.title,REPLICA_TITLE_FONT_SIZE)>r.width-36)
   throw Error('EP003_SHOT09_V2_REPLICA_TITLE_OUTSIDE_BORDER');
 }
 const leftLabel=Math.max(shot10TextWidth('SHARD A',23),
    shot10TextWidth('OWNER A',20));
 const rightLabel=Math.max(shot10TextWidth('SHARD B',23),
    shot10TextWidth('OWNER B',20));
 if(SHARD_NODES[1].center-SHARD_NODES[0].center <
    (leftLabel+rightLabel)/2+30)
   throw Error('EP003_SHOT09_V2_SHARD_LABEL_COLLISION');
 for(const node of shards){
  if(node.left<1500||node.top<350||node.left+node.width>1830||
     node.top+node.height>670)
   throw Error('EP003_SHOT09_SHARD_OUTSIDE_DATABASE_REPLACEMENT_REGION');
  for(const original of [...existing,phone,...REPLICAS])
   if(shot02Intersects(node,original,12))
    throw Error('EP003_SHOT09_SHARD_OVERLAPS_AN_UNRELATED_EXISTING_CONTAINER');
 }
 if(shot02Intersects(shards[0],shards[1],8))
  throw Error('EP003_SHOT09_NESTED_OR_OVERLAPPING_SHARD_CONTAINERS');
 for(const card of CALLOUTS){
  const s=shot09CardSize(card.title,card.meaning);
  const box={left:CARD_LEFT,top:CARD_TOP,...s};
  if(box.top+box.height>1020)
   throw Error('EP003_SHOT09_CARD_OUTSIDE_FRAME');
  for(const n of [...existing,phone,...REPLICAS,...shards])
   if(shot02Intersects(box,n,20))
    throw Error('EP003_SHOT09_CARD_OVERLAPS_ARCHITECTURE');
 }
 for(const r of ROUTES){
  if(r.start.x!==1460||r.end.x<=1500||r.end.x>=1820||
     r.end.y<400||r.end.y>650)
   throw Error('EP003_SHOT09_ROUTE_IS_NOT_ATTACHED_TO_AUTH_AND_SHARD');
 }
 return true;
}

const OriginalReplicas:React.FC<{frame:number;introFrame:number;failA:number;promote:number;focusLevels:readonly [number,number]}>=({frame,introFrame,failA,promote,focusLevels})=><svg
  width="1920" height="1080" viewBox="0 0 1920 1080"
  style={{position:'absolute',inset:0,zIndex:13,pointerEvents:'none',overflow:'hidden'}}>
 {REPLICAS.map((r,i)=>{
    const age=3080-1+3841-1+3001-1+REPLICA_ORIGIN.frames-1+frame-
      REPLICA_ORIGIN.previousWriteCueFrame;
    const phase=((age*.0055+i*.44)%1);
    const point=premiumRoutePoint(phase,r.route);
    const center=r.left+r.width/2;
    const focus=clamp(focusLevels[i]);
    const layout=1;
    const iconScale=1+(REPLICA_ICON_SCALE-1)*layout;
    const titleBaseline=r.top+111+(REPLICA_TITLE_BASELINE_OFFSET-111)*layout;
    const titleFont=22+(REPLICA_TITLE_FONT_SIZE-22)*layout;
    return <g key={r.key} opacity={i===0?1-clamp(failA)*(1-clamp(promote))*.86:1}>
      <path d={replicaPath(r)} fill="none" stroke="#1D526C"
        strokeWidth={PREMIUM_ROUTE_STYLE.railWidth} opacity={.3}/>
      <path d={replicaPath(r)} fill="none" stroke={r.stroke}
        strokeWidth={PREMIUM_ROUTE_STYLE.activeWidth} opacity={PREMIUM_ROUTE_STYLE.activeOpacity}/>
      <circle cx={point.x} cy={point.y} r={PREMIUM_ROUTE_STYLE.packetRadius} fill={r.stroke}
        opacity={Math.min(1,phase*11,(1-phase)*11)}
        style={{filter:'drop-shadow(0 0 '+PREMIUM_ROUTE_STYLE.packetGlow+'px '+r.stroke+')'}}/>
      <g transform={'translate('+center+' '+(r.top+58)+') scale('+(1+.012*focus).toFixed(3)+') translate('+(-center)+' '+(-(r.top+58))+')'}>
       <rect x={r.left+5} y={r.top+5} width={r.width-10} height={r.height-10}
         rx={13} fill={r.stroke} fillOpacity={.045*focus}
         stroke={r.stroke} strokeWidth={2.2} strokeOpacity={.88*focus}
         style={{filter:focus>.03?'drop-shadow(0 0 '+(9+12*focus)+'px '+r.stroke+')':'none'}}/>
       <g transform={'translate('+(center-45+3*layout)+' '+(r.top+5+3*layout)+') scale('+iconScale.toFixed(4)+')'}
        style={{filter:'drop-shadow(0 0 11px '+r.stroke+')'}}>
        <ellipse cx="45" cy="17" rx="29" ry="11"
          fill="rgba(16,60,78,.55)" stroke={r.stroke} strokeWidth={4}/>
        <path d="M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40"
          fill="none" stroke={r.stroke} strokeWidth={4}/>
        <ellipse cx="45" cy="65" rx="29" ry="11"
          fill="rgba(8,32,53,.32)" stroke={r.stroke} strokeWidth={4}/>
      </g>
      <text x={center} y={titleBaseline} fill={WHITE}
        fontFamily={AT_FONT} fontSize={titleFont} fontWeight={850} textAnchor="middle"
        letterSpacing=".02em" style={{filter:'drop-shadow(0 1px 7px #071829)'}}>
        {i===0&&promote>.75?'PRIMARY A':r.title}
      </text>
       </g>
    </g>;
  })}
 </svg>;


const LegacyRouting:React.FC<{frame:number;opacity:number}>=({frame,opacity})=>{
 const dashOffset=-(3080+3841-1+3001-1+REPLICA_ORIGIN.frames-1+frame)*.74;
 return <>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,zIndex:19,pointerEvents:'none',
      opacity:clamp(opacity)}}>
   {QUERY_PATHS.map((r,i)=><g key={r.key} opacity={i===0?.86:.55}>
      <path d={r.d} stroke="#15394C" strokeWidth={9}
       fill="none" strokeLinecap="round"/>
      <path d={r.d} stroke={i===0?AMBER:r.color}
       strokeWidth={i===0?5.2:3.7}
       fill="none" strokeLinecap="round" strokeDasharray="10 14"
       strokeDashoffset={dashOffset}
       style={{filter:'drop-shadow(0 0 5px '+(i===0?AMBER:r.color)+')'}}/>
   </g>)}
  </svg>
  <div style={{position:'absolute',left:SHOT02_NODES.database.x-153,
    top:SHOT02_NODES.database.y-57,width:306,height:38,zIndex:17,
    color:CYAN,fontFamily:AT_FONT,textAlign:'center',
    fontSize:23,lineHeight:'38px',fontWeight:860,
    letterSpacing:'.025em',whiteSpace:'nowrap',pointerEvents:'none',
    opacity:clamp(opacity),
    textShadow:'0 2px 10px #04131E,0 0 12px rgba(104,229,255,.25)'}}>
    PRIMARY DATABASE
  </div>
 </>;
};
const Shards:React.FC<{
 frame:number;reveal:number;focusA:number;focusB:number;hotA:number;
}>=({frame,reveal,focusA,focusB,hotA})=>
 <svg width="1920" height="1080" viewBox="0 0 1920 1080"
  style={{position:'absolute',inset:0,zIndex:18,pointerEvents:'none',
   overflow:'visible',opacity:clamp(reveal)}}>
  {PREMIUM_OWNER_HEADER.textLines.map((line,index)=>
    <text key={line} x={PREMIUM_OWNER_HEADER.centerX}
      y={index===0?PREMIUM_OWNER_HEADER.firstBaseline:PREMIUM_OWNER_HEADER.secondBaseline}
      fill={WHITE} fontFamily={AT_FONT}
      fontSize={PREMIUM_OWNER_HEADER.fontSize} fontWeight="850"
      textAnchor="middle" letterSpacing=".015em">{line}</text>)}
  {SHARD_NODES.map((n,i)=>{
   const f=i===0?focusA:focusB;
   const warning=i===0?hotA:0;
   const color=i===0&&warning>.08?'#FF727C':n.color;
   const glow=10+f*19+warning*20;
   const center=n.center,cy=520;
   const scale=1+.012*Math.max(f,warning);
   return <g key={n.key} transform={'translate('+center+' '+cy+') scale('+scale.toFixed(3)+') translate('+(-center)+' '+(-cy)+')'}>
    <text x={center} y={n.top+35} fill={WHITE}
      fontFamily={AT_FONT} fontSize={23} fontWeight={870}
      textAnchor="middle">SHARD {n.key}</text>
    <text x={center} y={n.top+63} fill={color}
      fontFamily={AT_FONT} fontSize={19} fontWeight={790}
      textAnchor="middle">{i===0&&warning>.72?"OFFLINE":"PRIMARY"}</text>
    <g style={{filter:'drop-shadow(0 0 '+glow+'px '+color+')'}}>
      <ellipse cx={center} cy={503} rx={32} ry={12}
        fill="rgba(12,43,63,.70)" stroke={color} strokeWidth="4"/>
      <path d={'M'+(center-32)+' 503 V576 Q'+center+' 596 '+(center+32)+' 576 V503 M'+(center-32)+' 540 Q'+center+' 559 '+(center+32)+' 540'}
        fill="none" stroke={color} strokeWidth={4}/>
      <ellipse cx={center} cy={576} rx={32} ry={12}
        fill="rgba(8,32,53,.36)" stroke={color} strokeWidth="4"/>
    </g>
    <text x={center} y="644" fill={SOFT} fontFamily={AT_FONT}
      fontSize="20" fontWeight="820" textAnchor="middle">OWNER {n.key}</text>
   </g>;
  })}
 </svg>;
const ShardRoutes:React.FC<{frame:number;reveal:number;hotA:number}>=
 ({frame,reveal,hotA})=><svg width="1920" height="1080" viewBox="0 0 1920 1080"
 style={{position:'absolute',inset:0,zIndex:20,pointerEvents:'none',
   overflow:'visible',opacity:clamp(reveal)}}>
 {ROUTES.map((r,i)=>{
  const path=routePath(r);
  const speed=i===0?.010:.009;
  return <g key={r.key} opacity={i===0?1-clamp(hotA)*.92:1}>
   <path d={path} stroke="#214459" strokeWidth={PREMIUM_ROUTE_STYLE.railWidth} opacity={.3}
     fill="none" strokeLinecap="round"/>
   <path d={path} stroke={r.color} strokeWidth={PREMIUM_ROUTE_STYLE.activeWidth} opacity={PREMIUM_ROUTE_STYLE.activeOpacity}
     fill="none" strokeLinecap="round"/>
   {Array.from({length:i===0?3:2},(_,j)=>{
    const phase=((frame*speed+(j/(i===0?3:2))+(i*.25))%1+1)%1;
    const p=routePoint(phase,r);
    const alpha=clamp(Math.min(phase,1-phase)*10);
    return <circle key={j} cx={p.x} cy={p.y} r={PREMIUM_ROUTE_STYLE.packetRadius}
      fill={i===0&&hotA>.1?AMBER:r.color} opacity={alpha}
      style={{filter:'drop-shadow(0 0 '+PREMIUM_ROUTE_STYLE.packetGlow+'px '+r.color+')'}}/>;
   })}
  </g>;
 })}
 </svg>;
const RECOVERY_ROUTE={key:'RECOVERY_A',color:MINT,route:PREMIUM_ROUTES.RECOVERY_A} as const;
const RecoveryRoute:React.FC<{frame:number;visibility:number;fenced:number}>=({frame,visibility,fenced})=>
 <svg width="1920" height="1080" viewBox="0 0 1920 1080"
   style={{position:'absolute',inset:0,zIndex:21,pointerEvents:'none',opacity:clamp(visibility)}}>
   <path d={routePath(RECOVERY_ROUTE)} fill="none" stroke="#1B4958" strokeWidth={PREMIUM_ROUTE_STYLE.railWidth} strokeLinecap="round"/>
   <path d={routePath(RECOVERY_ROUTE)} fill="none" stroke={MINT} strokeWidth={PREMIUM_ROUTE_STYLE.activeWidth}
     strokeLinecap="round" style={{filter:'drop-shadow(0 0 5px '+MINT+')'}}/>
   {[0,1].map(i=>{
     const phase=((frame*.008+i*.5)%1+1)%1;
     const point=routePoint(phase,RECOVERY_ROUTE);
     return <circle key={i} cx={point.x} cy={point.y} r={PREMIUM_ROUTE_STYLE.packetRadius}
       fill={MINT} opacity={clamp(Math.min(phase,1-phase)*10)}
       style={{filter:'drop-shadow(0 0 '+PREMIUM_ROUTE_STYLE.packetGlow+'px '+MINT+')'}}/>;
   })}
   <g opacity={clamp(fenced)}>
     <path d="M1568 490 L1642 582 M1642 490 L1568 582" stroke="#FF737C" strokeWidth={4}
       strokeLinecap="round"/>
   </g>
 </svg>;
const Callouts:React.FC<{frame:number;cues:Shot09Props['cueFrames']}>=
 ({frame,cues})=><>{CALLOUTS.map(c=>{
 const start=cues[c.cue],end=Math.min(cues[c.endCue],start+450);
 if(frame<start||frame>=end||!ep003CardIsReadable(c.title,c.meaning,start,end,30))
  return null;
 const s=shot09CardSize(c.title,c.meaning);
 return <div key={c.cue} style={{position:'absolute',
  left:CARD_LEFT,top:CARD_TOP,width:s.width,height:s.height,
  borderRadius:17,boxSizing:'border-box',padding:'19px 34px',
  background:'linear-gradient(120deg,rgba(10,32,50,.977),rgba(5,19,37,.988))',
  border:'2px solid '+c.color,boxShadow:'0 13px 36px rgba(0,0,0,.33)',
  pointerEvents:'none',opacity:ep003CardOpacity(frame,start,end),zIndex:24,
  fontFamily:AT_FONT}}>
   <div style={{fontWeight:850,color:c.color,fontSize:23,
    lineHeight:'29px',whiteSpace:'nowrap'}}>{c.title}</div>
   <div style={{fontWeight:900,color:WHITE,
     fontSize:c.meaning.includes('\n')?26:29,
     lineHeight:c.meaning.includes('\n')?'35px':'39px',
     marginTop:11}}>
     {c.meaning.split('\n').map(line=>
       <div key={line} style={{whiteSpace:'nowrap'}}>{line}</div>)}
   </div>
 </div>;
 })}</>;
export const Ep003Shot09WhenPrimaryDisappearsV3:React.FC<Shot09Props>=(props)=>{
 const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||
    cfg.durationInFrames!==props.durationInFrames)
  throw Error('EP003_SHOT09_EXPECTS_1080P_30FPS_REAL_SELECTED_VOICE');
 validateShot09(props);
 const cues=props.cueFrames;
 const worldFrame=props.worldStartFrame+frame;
 const loss=ease(frame,cues.PRIMARY_FAIL,42);
 const promote=ease(frame,cues.PROMOTE,52);
 const legitimate=ease(frame,cues.LEGITIMATE_OWNER,45);
 const fenced=ease(frame,cues.FENCING,48);
 const recovery=promote*legitimate;
 const focusA=Math.max(focusHold(frame,cues.INTRO,156),
  focusHold(frame,cues.PRIMARY_OWNS,130),focusHold(frame,cues.PRIMARY_FAIL,130));
 const focusB=Math.max(focusHold(frame,cues.OTHER_SHARD,132),
  focusHold(frame,cues.INSTANCES,148));
 const replicaFocus=Math.max(focusHold(frame,cues.RECOVERY_PATH,132),
  focusHold(frame,cues.PROMOTE,180),focusHold(frame,cues.ASYNC,135),
  focusHold(frame,cues.LAG,145),focusHold(frame,cues.DATA_LOSS,145));
 const splitBrain=focusHold(frame,cues.SPLIT_BRAIN,206);
 const heading=ease(frame,cues.INTRO+5,72);
 return <ATBackground>
  <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
    transformOrigin:'50% 50%',pointerEvents:'none'}}>
   <Shot08CleanArchitectureWorldV1 frame={worldFrame}
    authFocusLevels={[0,0,0]} primaryFocusLevel={0}
    primaryOpacity={0} legacyDatabaseFlowOpacity={0}
    replicaGrowth={0} dbStress={.2}
    cascadeStartFrame={1} criticalPulseStartFrame={0}
    recoveryLevel={1} showPhone={1} showPools={.25}
    initialPressure showLoginBadge={0} showRetryAttempts={0}
    flowRetryLevel={.08} flowJitterLevel={.76}
    admissionLevel={.5} breakerLevel={.11} probeLevel={1}/>
   <OriginalReplicas frame={frame+3475+5372} introFrame={frame}
     failA={loss} promote={recovery} focusLevels={[replicaFocus,focusB]}/>
   <Shards frame={frame} reveal={1} focusA={focusA} focusB={focusB}
     hotA={Math.max(loss,splitBrain)}/>
   <ShardRoutes frame={worldFrame} reveal={1} hotA={loss}/>
   <RecoveryRoute frame={worldFrame} visibility={recovery} fenced={fenced}/>
  </AbsoluteFill>
  <AbsoluteFill style={{zIndex:25,pointerEvents:'none'}}>
   <div style={{position:'absolute',left:560,top:78,
    opacity:1-heading,color:WHITE,fontFamily:AT_FONT,
    fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
     WHEN COPIES ARE NOT ENOUGH
     <div style={{marginTop:15,width:690,height:2,
       background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
   </div>
   <div style={{position:'absolute',left:560,top:78,
    opacity:heading,color:WHITE,fontFamily:AT_FONT,
    fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
     WHEN THE PRIMARY DISAPPEARS
     <div style={{marginTop:15,width:690,height:2,
       background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
   </div>
   <Callouts frame={frame} cues={cues}/>
  </AbsoluteFill>
  {frame===0&&<AbsoluteFill style={{zIndex:30,pointerEvents:'none'}}>
   <Img src={props.previousLastFrameDataUri}
     style={{width:1920,height:1080,objectFit:'cover'}}/>
  </AbsoluteFill>}
 </ATBackground>;
};
