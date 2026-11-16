import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot08CleanArchitectureWorldV1} from '../ep002/Shot08CleanArchitectureWorldV1';
import {SHOT02_NODES,shot02Intersects} from '../ep002/Shot02PremiumLayout';
import {shot10TextWidth} from '../../../shot10-content-fit-layout.mjs';
import {PREMIUM_ROUTES,PREMIUM_ROUTE_STYLE,premiumRouteD,
 premiumRouteEnd,premiumRoutePoint,validatePremiumRoutes}
 from '../../../ep003-premium-routing.mjs';
import type {PremiumRoute} from '../../../ep003-premium-routing.mjs';
import {ep003CardIsReadable,ep003CardOpacity} from '../../../ep003-readable-card-policy.mjs';

const WHITE='#F5FCFF',SOFT='#B5D2E6',MINT='#6FECD4',CYAN='#68E5FF',AMBER='#F5A55A';
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const ease=(frame:number,start:number,duration:number)=>{
  const t=clamp((frame-start)/Math.max(1,duration));return t*t*(3-2*t);
};
const focusHold=(f:number,cue:number,duration=116)=>
  ease(f,cue,16)*(1-ease(f,cue+duration-19,19));
export const EP003_SHOT08_V3_PREDECESSOR={
 renderId:'09457c3c-32d9-432c-aa92-67f0e7b13f60',
 sha256:'7f7429a6a4117c49b4338dec256eae72fbe5e269728729dfdb23ab63e6ba27f8',
 frames:3476,lastWorldFrame:31452+3476-1,
 fps:30,width:1920,height:1080
} as const;
const SELECTED_SLOW_NATURAL_TAKE='368c239c-a93b-437e-a833-2f955fa51803';
export const EP003_SHOT08_CUES=[
 'INTRO','ONE_PRIMARY','DIVIDE','OWNER_A','OWNER_B','SHARDING',
 'SHARD_DEF','INDEPENDENT_PRIMARY','CRITICAL_LOOKUPS','SHARD_A','SHARD_B',
 'AUTHORITATIVE','SHARD_KEY_QUESTION','SHARD_KEY','SHARD_KEY_DEF',
 'MAPPING','ROUTING','IDENTIFIER_CHANGE','MISSING_KEY',
 'HOT_SHARD_QUESTION','HOT_SHARD','HOT_WARNING','CROSS_SHARD',
 'EACH_REPLICAS','COMPARE','COMPARE_DEF','CAPACITY',
 'HYPOTHESIS','FAILURE'
] as const;
export type Shot08Cue=typeof EP003_SHOT08_CUES[number];
export type Shot08Props={
 durationInFrames:number;voiceTakeId:string;
 previousRenderId:string;previousLastFrameSha256:string;
 previousLastFrameDataUri:string;worldStartFrame:number;
 cueFrames:Record<Shot08Cue,number>;
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
 {cue:'SHARD_DEF',endCue:'CRITICAL_LOOKUPS',title:'SHARD',
  meaning:'One partition with its own Primary owner.',color:CYAN},
 {cue:'SHARD_KEY_DEF',endCue:'IDENTIFIER_CHANGE',title:'SHARD KEY',
  meaning:'The rule that finds the account owner.',color:MINT},
 {cue:'HOT_SHARD',endCue:'CROSS_SHARD',title:'HOT SHARD',
  meaning:'One owner receives most of the traffic.',color:AMBER},
 {cue:'COMPARE_DEF',endCue:'HYPOTHESIS',title:'REPLICATION VS SHARDING',
  meaning:'Replication copies the same data.\nSharding splits data between owners.',color:CYAN}
] as const;
const CARD_LEFT=560,CARD_TOP=771,CARD_HEIGHT=133;
export function shot08CardSize(title:string,meaning:string){
 const lines=meaning.split('\n');
 const fontSize=lines.length>1?26:29;
 const width=Math.ceil(Math.max(shot10TextWidth(title,23),
  ...lines.map(line=>shot10TextWidth(line,fontSize)))+80);
 const height=lines.length>1?165:CARD_HEIGHT;
 if(width<330||width>900||CARD_LEFT+width>1480||lines.length>2||
    lines.some(line=>line.trim().length===0))
  throw Error('EP003_SHOT08_CARD_TEXT_OUTSIDE_SAFE_AREA');
 return {width,height};
}
export function validateShot08(p:Shot08Props){
 validatePremiumRoutes();
 if(!p||p.previousRenderId!==EP003_SHOT08_V3_PREDECESSOR.renderId||
    p.worldStartFrame!==EP003_SHOT08_V3_PREDECESSOR.lastWorldFrame||
    p.voiceTakeId!==SELECTED_SLOW_NATURAL_TAKE||
    !/^[0-9a-f]{64}$/.test(p.previousLastFrameSha256)||
    !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||
    !Number.isInteger(p.durationInFrames)||p.durationInFrames<200||
    p.durationInFrames>18000)
    throw Error('EP003_SHOT08_REQUIRES_EXACT_LOCKED_SHOT07_V3_FRAME_AND_SELECTED_VOICE');
 let last=-1;
 for(const key of EP003_SHOT08_CUES){
  const f=p.cueFrames?.[key];
  if(!Number.isInteger(f)||f<last||f>=p.durationInFrames)
   throw Error('EP003_SHOT08_REAL_VOICE_CUE_INVALID_'+key);
  last=f;
 }
 if(p.cueFrames.INTRO<60)throw Error('EP003_SHOT08_TWO_SECOND_LIVING_WORLD_PRELUDE_REQUIRED');
 const existing=Object.entries(SHOT02_NODES)
  .filter(([key])=>key!=='database').map(([,node])=>bounds(node));
 const phone={left:55,top:160,width:445,height:800};
 const shards:Rect[]=[
  {left:1551,top:410,width:110,height:242},
  {left:1716,top:410,width:110,height:242}
 ];
 const iconBottom=8+(65+11)*REPLICA_ICON_SCALE;
 if(REPLICA_TITLE_BASELINE_OFFSET-16-iconBottom<3)
  throw Error('EP003_SHOT08_V2_REPLICA_ICON_AND_TITLE_COLLIDE');
 for(const r of REPLICAS){
  if(REPLICA_TITLE_BASELINE_OFFSET+5>r.height-10||
     shot10TextWidth(r.title,REPLICA_TITLE_FONT_SIZE)>r.width-36)
   throw Error('EP003_SHOT08_V2_REPLICA_TITLE_OUTSIDE_BORDER');
 }
 const leftLabel=Math.max(shot10TextWidth('SHARD A',23),
    shot10TextWidth('OWNER A',20));
 const rightLabel=Math.max(shot10TextWidth('SHARD B',23),
    shot10TextWidth('OWNER B',20));
 if(SHARD_NODES[1].center-SHARD_NODES[0].center <
    (leftLabel+rightLabel)/2+30)
   throw Error('EP003_SHOT08_V2_SHARD_LABEL_COLLISION');
 for(const node of shards){
  if(node.left<1500||node.top<350||node.left+node.width>1830||
     node.top+node.height>670)
   throw Error('EP003_SHOT08_SHARD_OUTSIDE_DATABASE_REPLACEMENT_REGION');
  for(const original of [...existing,phone,...REPLICAS])
   if(shot02Intersects(node,original,12))
    throw Error('EP003_SHOT08_SHARD_OVERLAPS_AN_UNRELATED_EXISTING_CONTAINER');
 }
 if(shot02Intersects(shards[0],shards[1],8))
  throw Error('EP003_SHOT08_NESTED_OR_OVERLAPPING_SHARD_CONTAINERS');
 for(const card of CALLOUTS){
  const s=shot08CardSize(card.title,card.meaning);
  const box={left:CARD_LEFT,top:CARD_TOP,...s};
  if(box.top+box.height>1020)
   throw Error('EP003_SHOT08_CARD_OUTSIDE_FRAME');
  for(const n of [...existing,phone,...REPLICAS,...shards])
   if(shot02Intersects(box,n,20))
    throw Error('EP003_SHOT08_CARD_OVERLAPS_ARCHITECTURE');
 }
 for(const r of ROUTES){
  if(r.start.x!==1460||r.end.x<=1500||r.end.x>=1820||
     r.end.y<400||r.end.y>650)
   throw Error('EP003_SHOT08_ROUTE_IS_NOT_ATTACHED_TO_AUTH_AND_SHARD');
 }
 return true;
}

const OriginalReplicas:React.FC<{frame:number;introFrame:number;focusLevels:readonly [number,number]}>=({frame,introFrame,focusLevels})=><svg
  width="1920" height="1080" viewBox="0 0 1920 1080"
  style={{position:'absolute',inset:0,zIndex:13,pointerEvents:'none',overflow:'hidden'}}>
 {REPLICAS.map((r,i)=>{
    const age=3080-1+3841-1+3001-1+REPLICA_ORIGIN.frames-1+frame-
      REPLICA_ORIGIN.previousWriteCueFrame;
    const phase=((age*.0055+i*.44)%1);
    const point=premiumRoutePoint(phase,r.route);
    const center=r.left+r.width/2;
    const focus=clamp(focusLevels[i]);
    const layout=ease(introFrame,15,45);
    const iconScale=1+(REPLICA_ICON_SCALE-1)*layout;
    const titleBaseline=r.top+111+(REPLICA_TITLE_BASELINE_OFFSET-111)*layout;
    const titleFont=22+(REPLICA_TITLE_FONT_SIZE-22)*layout;
    return <g key={r.key}>
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
        {r.title}
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
  <text x="1696" y="342" fill={WHITE} fontFamily={AT_FONT}
   fontSize="23" fontWeight="850" textAnchor="middle" letterSpacing=".015em">
   INDEPENDENT PRIMARY OWNERS
  </text>
  {SHARD_NODES.map((n,i)=>{
   const f=i===0?focusA:focusB;
   const warning=i===0?hotA:0;
   const color=warning>.08?AMBER:n.color;
   const glow=10+f*19+warning*20;
   const center=n.center,cy=520;
   const scale=1+.012*Math.max(f,warning);
   return <g key={n.key} transform={'translate('+center+' '+cy+') scale('+scale.toFixed(3)+') translate('+(-center)+' '+(-cy)+')'}>
    <text x={center} y={n.top+35} fill={WHITE}
      fontFamily={AT_FONT} fontSize={23} fontWeight={870}
      textAnchor="middle">SHARD {n.key}</text>
    <text x={center} y={n.top+63} fill={color}
      fontFamily={AT_FONT} fontSize={19} fontWeight={790}
      textAnchor="middle">PRIMARY</text>
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
  const speed=i===0?.010+hotA*.009:.009;
  return <g key={r.key}>
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
const Callouts:React.FC<{frame:number;cues:Shot08Props['cueFrames']}>=
 ({frame,cues})=><>{CALLOUTS.map(c=>{
 const start=cues[c.cue],end=Math.min(cues[c.endCue],start+450);
 if(frame<start||frame>=end||!ep003CardIsReadable(c.title,c.meaning,start,end,30))
  return null;
 const s=shot08CardSize(c.title,c.meaning);
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
export const Ep003Shot08WhenCopiesAreNotEnoughV3:React.FC<Shot08Props>=(props)=>{
 const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||
    cfg.durationInFrames!==props.durationInFrames)
  throw Error('EP003_SHOT08_EXPECTS_1080P_30FPS_REAL_SELECTED_VOICE');
 validateShot08(props);
 const cues=props.cueFrames;
 const worldFrame=props.worldStartFrame+frame;
 const shardReveal=ease(frame,cues.DIVIDE,60);
 const ownerA=Math.max(
  focusHold(frame,cues.OWNER_A),
  focusHold(frame,cues.SHARD_A,130),
  focusHold(frame,cues.CRITICAL_LOOKUPS,120),
  focusHold(frame,cues.CAPACITY,115));
 const ownerB=Math.max(
  focusHold(frame,cues.OWNER_B),
  focusHold(frame,cues.SHARD_B,130),
  focusHold(frame,cues.CRITICAL_LOOKUPS+26,120),
  focusHold(frame,cues.CAPACITY+24,115));
 const hotA=Math.max(focusHold(frame,cues.HOT_SHARD,140),
  focusHold(frame,cues.FAILURE,85));
 const comparison=Math.max(focusHold(frame,cues.COMPARE_DEF,120),
  focusHold(frame,cues.EACH_REPLICAS,120));
 const heading=ease(frame,cues.INTRO+5,72);
 return <ATBackground>
  <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
    transformOrigin:'50% 50%',pointerEvents:'none'}}>
   <Shot08CleanArchitectureWorldV1 frame={worldFrame}
    authFocusLevels={[0,0,0]} primaryFocusLevel={0}
    primaryOpacity={1-shardReveal}
    legacyDatabaseFlowOpacity={1-shardReveal}
    replicaGrowth={0} dbStress={.2}
    cascadeStartFrame={1} criticalPulseStartFrame={0}
    recoveryLevel={1} showPhone={1} showPools={.25}
    initialPressure showLoginBadge={0} showRetryAttempts={0}
    flowRetryLevel={.08} flowJitterLevel={.76}
    admissionLevel={.5} breakerLevel={.11} probeLevel={1}/>
   <OriginalReplicas frame={frame+3475} introFrame={frame} focusLevels={[comparison,comparison]}/>
   <LegacyRouting frame={frame+3475} opacity={1-shardReveal}/>
   <Shards frame={frame} reveal={shardReveal}
     focusA={ownerA} focusB={ownerB} hotA={hotA}/>
   <ShardRoutes frame={worldFrame} reveal={shardReveal} hotA={hotA}/>
  </AbsoluteFill>
  <AbsoluteFill style={{zIndex:25,pointerEvents:'none'}}>
    <div style={{position:'absolute',left:560,top:78,
     opacity:1-heading,color:WHITE,fontFamily:AT_FONT,
     fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
     DID WE FIX THE BOTTLENECK?
     <div style={{marginTop:15,width:690,height:2,
       background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
    </div>
    <div style={{position:'absolute',left:560,top:78,
     opacity:heading,color:WHITE,fontFamily:AT_FONT,
     fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
     WHEN COPIES ARE NOT ENOUGH
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
