import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {AT_FONT} from '../../components/architectural-thinking';
import {Ep003Shot09FinalWorldForShot10V2} from './Shot09FinalWorldForShot10V2';
import {PREMIUM_ROUTES,premiumRouteD,validatePremiumRoutes}
 from '../../../ep003-premium-routing-v2.mjs';
import {shot10TextWidth} from '../../../shot10-content-fit-layout.mjs';
import {ep003CardIsReadable,ep003CardOpacity} from '../../../ep003-readable-card-policy.mjs';
import {SHOT10_PREMIUM_ROUTES,shot10PremiumPathPosition,
 shot10PremiumRouteD} from './Shot10PremiumRoutingContractV2';

const CYAN='#68E5FF',MINT='#6FECD4',AMBER='#F5A55A',
 WHITE='#F5FCFF',SOFT='#B5D2E6';
const LAST_SHOT09_FRAME=3144;
const SHOT09_LAST_WORLD_FRAME=40298+LAST_SHOT09_FRAME;
const RENDER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAKE='0168eb87-538f-49d8-9c79-132d822bdb60';
const OLD_SHOT09_TAKE='7510815a-d096-415f-b4f0-52ae8398ce45';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(f:number,start:number,duration:number)=>{
 const t=clamp((f-start)/Math.max(1,duration));return t*t*(3-2*t);
};
export const EP003_SHOT10_CUES=[
 'RETURN',
 'ORIGINAL_DB',
 'EXPLORED',
 'PROVE',
 'OUTCOME',
 'SUCCESS',
 'SLI',
 'SLI_DEFINITION',
 'SLO',
 'TWO_SECONDS',
 'REJECTED',
 'LATENCY',
 'P95',
 'SUCCESS_BIAS',
 'HALF_USERS',
 'DATABASE_METRICS',
 'SHARD_OVERLOAD',
 'TEST_FAILOVER',
 'RECOVERY',
 'RTO_RPO',
 'COMPARE',
 'MORE_LOGINS',
 'PRESSURE',
 'COMPLEXITY',
 'PURPOSE'
] as const;
export type Shot10Cue=typeof EP003_SHOT10_CUES[number];
export type Shot10Props={
 durationInFrames:number;voiceTakeId:string;
 previousRenderId:string;previousLastFrameSha256:string;
 previousLastFrameDataUri:string;worldStartFrame:number;
 cueFrames:Record<Shot10Cue,number>;
};
const OLD_CUES={
 INTRO:62,PRIMARY_AND_REPLICA:162,PRIMARY_OWNS:260,PRIMARY_FAIL:377,
 REQUEST_FAILURE:492,OTHER_SHARD:632,RECOVERY_PATH:751,PROMOTE:857,
 FAILOVER:977,LEGITIMATE_OWNER:1065,OLD_RETURN:1291,TWO_WRITERS:1380,
 SPLIT_BRAIN:1670,FENCING:1738,FENCE_MEANING:1836,DATA_RISK:2018,
 ASYNC:2078,LAG:2157,DATA_LOSS:2328,GREEN_ARROW:2434,
 CORRECTNESS:2585,INSTANCES:2712,WRONG_STATE:2825,TEST_FAILURES:2969
} as const;
type Card={
 start:Shot10Cue;end:Shot10Cue;title:string;
 lines:readonly string[];accent:string;tag:string;
};
const CARDS:readonly Card[]=[
 {start:'SUCCESS',end:'SLO',title:'SERVICE LEVEL INDICATOR',
   lines:['Measure correct, completed Logins.','Count all legitimate attempts.'],
   accent:CYAN,tag:'SLI'},
 {start:'SLO',end:'REJECTED',title:'SERVICE LEVEL OBJECTIVE',
   lines:['Set a target for successful Logins.','Example. Correct within 2 seconds.'],
   accent:MINT,tag:'SLO'},
 {start:'REJECTED',end:'LATENCY',title:'COUNT REJECTED REQUESTS',
   lines:['Overload protection can reject users.','Do not hide them from the SLI.'],
   accent:AMBER,tag:'CORRECTNESS'},
 {start:'P95',end:'SUCCESS_BIAS',title:'P95 LATENCY',
   lines:['95% finish within this measured time.','Check the full request population.'],
   accent:CYAN,tag:'P95'},
 {start:'HALF_USERS',end:'DATABASE_METRICS',title:'FAST IS NOT ALWAYS HEALTHY',
   lines:['Fast answers mean little if many fail.','Measure the real Login outcome.'],
   accent:AMBER,tag:'OUTCOME'},
 {start:'DATABASE_METRICS',end:'SHARD_OVERLOAD',title:'DATABASE TELEMETRY',
   lines:['Throughput. Queue depth. Primary load.','Replication lag. Shard distribution.'],
   accent:CYAN,tag:'OBSERVE'},
 {start:'SHARD_OVERLOAD',end:'RECOVERY',title:'FAILURE TESTING',
   lines:['Overload a shard. Trigger failover.','Measure correct Logins and recovery.'],
   accent:AMBER,tag:'VERIFY'},
 {start:'RTO_RPO',end:'COMPARE',title:'RECOVERY OBJECTIVES',
   lines:['RTO. Acceptable recovery time.','RPO. Acceptable recent data loss.'],
   accent:MINT,tag:'RTO / RPO'},
 {start:'MORE_LOGINS',end:'COMPLEXITY',title:'PROVE THE IMPROVEMENT',
   lines:['More correct Logins under pressure.','Measured from the user journey.'],
   accent:CYAN,tag:'VALIDATE'},
 {start:'COMPLEXITY',end:'PURPOSE',title:'THE ARCHITECTURE TRADE-OFF',
   lines:['Improvement must justify complexity.','Measure the cost of resilience.'],
   accent:AMBER,tag:'TRADE-OFF'}
];
export function shot10CardDimensions(card:Card){
 const width=Math.ceil(Math.max(shot10TextWidth(card.title,23),
  ...card.lines.map(line=>shot10TextWidth(line,26)))+76);
 const height=75+card.lines.length*37;
 if(width<330||width>850||560+width>1480||
    height>180||card.lines.length!==2||card.lines.some(x=>!x||x.includes(';')))
  throw Error('EP003_SHOT10_CARD_TEXT_OR_CONTAINER_INVALID_'+card.title);
 return {width,height};
}
export function validateShot10(p:Shot10Props){
 validatePremiumRoutes();
 if(!p||!RENDER_ID.test(p.previousRenderId)||
   p.voiceTakeId!==TAKE||
   !/^[0-9a-f]{64}$/.test(p.previousLastFrameSha256)||
   !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||
   p.worldStartFrame!==SHOT09_LAST_WORLD_FRAME||
   !Number.isInteger(p.durationInFrames)||p.durationInFrames<3600||
   p.durationInFrames>7000)
  throw Error('EP003_SHOT10_REQUIRES_VERIFIED_SHOT09_V3_SEAM_AND_SELECTED_TAKE');
 let previous=-1;
 for(const key of EP003_SHOT10_CUES){
  const f=p.cueFrames?.[key];
  if(!Number.isInteger(f)||f<previous||f>=p.durationInFrames)
   throw Error('EP003_SHOT10_REAL_AUDIO_CUE_INVALID_'+key);
  previous=f;
 }
 if(p.cueFrames.RETURN<60)
  throw Error('EP003_SHOT10_TWO_SECOND_BREATH_MISSING');
 for(const c of CARDS)shot10CardDimensions(c);
 if(shot10PremiumRouteD(SHOT10_PREMIUM_ROUTES.AUTH_A)!==
   premiumRouteD(PREMIUM_ROUTES.AUTH_A))
  throw Error('EP003_SHOT10_ROUTE_CHANGED_FROM_PREMIUM_STANDARD');
 const dot=shot10PremiumPathPosition(SHOT10_PREMIUM_ROUTES.REPLICA_B,.5);
 if(!Number.isFinite(dot.x)||!Number.isFinite(dot.y))
  throw Error('EP003_SHOT10_PACKET_NOT_ON_VISIBLE_ROUTE');
 return true;
}
const CardLayer:React.FC<{frame:number;cues:Shot10Props['cueFrames']}>=
 ({frame,cues})=><>{CARDS.map(c=>{
   const start=cues[c.start],end=cues[c.end];
   if(frame<start||frame>=end||end-start<92||
     !ep003CardIsReadable(c.title,c.lines.join(' '),start,end,30))
    return null;
   const dim=shot10CardDimensions(c);
   return <div key={c.title} style={{
     position:'absolute',left:560,top:777,width:dim.width,height:dim.height,
     boxSizing:'border-box',padding:'15px 32px',
     borderRadius:16,border:'2px solid '+c.accent,
     background:'linear-gradient(120deg,rgba(10,32,50,.978),rgba(5,19,37,.990))',
     boxShadow:'0 13px 34px rgba(0,0,0,.33)',
     opacity:ep003CardOpacity(frame,start,end),fontFamily:AT_FONT,
     pointerEvents:'none',zIndex:34}}>
      <div style={{display:'flex',alignItems:'center',gap:20,
       fontWeight:850,fontSize:23,lineHeight:'29px',
       color:c.accent,whiteSpace:'nowrap'}}>{c.title}</div>
      <div style={{marginTop:12,color:WHITE,fontSize:26,fontWeight:860,
       lineHeight:'37px'}}>
        {c.lines.map(line=><div key={line} style={{whiteSpace:'nowrap'}}>{line}</div>)}
      </div>
   </div>;
 })}</>;
const RouteEmphasis:React.FC<{frame:number;cues:Shot10Props['cueFrames']}>=
 ({frame,cues})=>{
 const start=cues.DATABASE_METRICS,end=cues.RECOVERY;
 const show=ease(frame,start,36)*(1-ease(frame,end,36));
 if(show<=.01)return null;
 return <svg viewBox="0 0 1920 1080" width="1920" height="1080"
  style={{position:'absolute',inset:0,zIndex:27,
   opacity:show*.33,pointerEvents:'none'}}>
  {[PREMIUM_ROUTES.AUTH_A,PREMIUM_ROUTES.AUTH_B,
   PREMIUM_ROUTES.REPLICA_A,PREMIUM_ROUTES.REPLICA_B].map((route,i)=>
   <path key={i} d={shot10PremiumRouteD(route)} fill="none"
    stroke={i%2===0?CYAN:MINT} strokeWidth={3}
    strokeLinecap="round"/>)}
 </svg>;
};
export const Ep003Shot10ProveArchitectureV2:React.FC<Shot10Props>=props=>{
 const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||
   cfg.durationInFrames!==props.durationInFrames)
  throw Error('EP003_SHOT10_FORMAT_OR_DURATION_NOT_EXACT');
 validateShot10(props);
 const heading=ease(frame,props.cueFrames.RETURN+40,78);
 return <AbsoluteFill style={{fontFamily:AT_FONT}}>
  <Ep003Shot09FinalWorldForShot10V2
   durationInFrames={props.durationInFrames}
   voiceTakeId={OLD_SHOT09_TAKE}
   previousRenderId={props.previousRenderId}
   previousLastFrameSha256={props.previousLastFrameSha256}
   previousLastFrameDataUri={props.previousLastFrameDataUri}
   worldStartFrame={40298}
   continuationFrameOffset={LAST_SHOT09_FRAME}
   titleHandoffFrame={LAST_SHOT09_FRAME}
   cueFrames={OLD_CUES}/>
  <AbsoluteFill style={{zIndex:31,pointerEvents:'none'}}>
   <div style={{position:'absolute',left:560,top:78,
    fontSize:38,fontWeight:890,letterSpacing:'-.02em',
    color:WHITE,opacity:heading}}>
     PROVE THE ARCHITECTURE WORKS
     <div style={{marginTop:15,width:690,height:2,
       background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
   </div>
   <RouteEmphasis frame={frame} cues={props.cueFrames}/>
   <CardLayer frame={frame} cues={props.cueFrames}/>
  </AbsoluteFill>
  {frame<8&&<AbsoluteFill style={{zIndex:50,pointerEvents:'none',
   opacity:1-frame/8}}>
    <Img src={props.previousLastFrameDataUri}
     style={{width:1920,height:1080,objectFit:'cover'}}/>
  </AbsoluteFill>}
 </AbsoluteFill>;
};
