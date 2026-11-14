import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from '../ep002/Shot07CleanArchitectureWorld';
import {SHOT02_NODES,shot02Intersects} from '../ep002/Shot02PremiumLayout';
import {shot10TextWidth} from '../../../shot10-content-fit-layout.mjs';
import {ep003CardIsReadable,ep003CardOpacity} from '../../../ep003-readable-card-policy.mjs';

const WHITE='#F5FCFF',SOFT='#B5D2E6',MINT='#6FECD4',CYAN='#68E5FF',AMBER='#F5A55A';
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const ease=(f:number,s:number,d:number)=>{const t=clamp((f-s)/Math.max(1,d));return t*t*(3-2*t);};
export const EP003_SHOT05_PREDECESSOR={
  renderId:'4079729b-c1b3-405c-9a83-1ace0ef25641',
  sha256:'61fd35dc6662b259818b6d29379b39948a7239fa6588f7c23a010b97a7a5a5f3',
  frames:3841,previousWorldLastFrame:21012+3841-1,
  fps:30,width:1920,height:1080,
  previousWriteCueFrame:1199,
} as const;
export const EP003_SHOT05_CUES=[
 'INTRO','ACCOUNT_LOCKED','PRIMARY_WRITE','LOCK_COMMITTED','REPLICA_LAG',
 'VERSION_SPLIT','LAG_DEFINITION','ANOTHER_LOGIN','SAFE_PRIMARY',
 'HYPOTHETICAL','STALE_ACTIVE','STALE_READ','UNSAFE','EVENTUAL',
 'CATCH_UP','DISPLAY_PREFERENCE','SECURITY','FAST_UNSAFE','CONCLUSION'
] as const;
export type Shot05Cue=typeof EP003_SHOT05_CUES[number];
export type Shot05Props={
  durationInFrames:number;voiceTakeId:string;
  previousRenderId:string;previousLastFrameSha256:string;
  previousLastFrameDataUri:string;worldStartFrame:number;
  cueFrames:Record<Shot05Cue,number>;
};

type Rect={left:number;top:number;width:number;height:number};
const REPLICAS=[
 {key:'A',title:'REPLICA A',left:1578,top:709,width:225,height:116,stroke:CYAN,
   start:{x:1674,y:649},c1:{x:1660,y:690},c2:{x:1690,y:697},end:{x:1690,y:727}},
 {key:'B',title:'REPLICA B',left:1578,top:852,width:225,height:116,stroke:MINT,
   start:{x:1720,y:649},c1:{x:1850,y:719},c2:{x:1830,y:842},end:{x:1690,y:870}},
] as const;
const QUERY_PATHS=[
  {key:'PRIMARY',color:CYAN,kind:'WRITE / CRITICAL READ',
    d:'M1497 523 C1520 523 1550 538 1572 550', 
    start:{x:1497,y:523},c1:{x:1520,y:523},c2:{x:1550,y:538},end:{x:1572,y:550}},
  {key:'A',color:MINT,kind:'SAFE READ A',
    d:'M1425 660 C1510 707 1550 749 1650 757',
    start:{x:1425,y:660},c1:{x:1510,y:707},c2:{x:1550,y:749},end:{x:1650,y:757}},
  {key:'B',color:MINT,kind:'SAFE READ B',
    d:'M1444 660 C1546 708 1510 915 1650 906',
    start:{x:1444,y:660},c1:{x:1546,y:708},c2:{x:1510,y:915},end:{x:1650,y:906}},
] as const;
const CALLOUTS=[
 {cue:'PRIMARY_WRITE',title:'ACCOUNT STATUS CHANGE',
  meaning:'Primary records the account lock',color:AMBER},
 {cue:'REPLICA_LAG',title:'REPLICATION LAG',
  meaning:'Replica A still has the older status',color:AMBER},
 {cue:'STALE_READ',title:'STALE READ',
  meaning:'An outdated account status is not safe',color:AMBER},
 {cue:'EVENTUAL',title:'EVENTUAL CONSISTENCY',
  meaning:'Replica copies may temporarily disagree',color:CYAN},
 {cue:'SECURITY',title:'SECURITY FIRST',
  meaning:'Critical Login checks need current data',color:AMBER},
 {cue:'FAST_UNSAFE',title:'FAST DOES NOT MEAN CORRECT',
  meaning:'A fast answer can still be unsafe',color:MINT},
] as const;
const CARD_LEFT=560,CARD_TOP=771,CARD_HEIGHT=133;
const bounds=(n:{x:number;y:number;width:number;height:number}):Rect=>({
  left:n.x-n.width/2,top:n.y,width:n.width,height:n.height
});
export function shot05CardSize(title:string,meaning:string){
  const width=Math.ceil(Math.max(shot10TextWidth(title,23),shot10TextWidth(meaning,29))+80);
  if(width<320||width>900||CARD_LEFT+width>1480)
    throw Error('EP003_SHOT05_CARD_TEXT_OVERFLOW');
  return {width,height:CARD_HEIGHT};
}
const bezier=(t:number,r:typeof REPLICAS[number])=>{
  const q=1-t;return {
    x:q*q*q*r.start.x+3*q*q*t*r.c1.x+3*q*t*t*r.c2.x+t*t*t*r.end.x,
    y:q*q*q*r.start.y+3*q*q*t*r.c1.y+3*q*t*t*r.c2.y+t*t*t*r.end.y
  };
};
const replicaPath=(r:typeof REPLICAS[number])=>
  'M'+r.start.x+' '+r.start.y+' C'+r.c1.x+' '+r.c1.y+' '+r.c2.x+' '+r.c2.y+' '+r.end.x+' '+r.end.y;

export function validateShot05(p:Shot05Props){
  if(!p||p.previousRenderId!==EP003_SHOT05_PREDECESSOR.renderId||
      p.worldStartFrame!==EP003_SHOT05_PREDECESSOR.previousWorldLastFrame||
      !/^[a-f0-9]{64}$/.test(p.previousLastFrameSha256)||
      !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||
      !/^[a-f0-9-]{36}$/i.test(p.voiceTakeId)||
      !Number.isInteger(p.durationInFrames)||p.durationInFrames<200||
      p.durationInFrames>18000)
    throw Error('EP003_SHOT05_EXACT_LOCKED_SHOT04_LAST_FRAME_AND_SELECTED_VOICE_REQUIRED');
  let prev=-1;
  for(const cue of EP003_SHOT05_CUES){
    const f=p.cueFrames?.[cue];
    if(!Number.isInteger(f)||f<prev||f>=p.durationInFrames)
      throw Error('EP003_SHOT05_REAL_VOICE_CUE_INVALID_'+cue);
    prev=f;
  }
  if(p.cueFrames.INTRO<60)
    throw Error('EP003_SHOT05_NARRATION_PRELUDE_TOO_SHORT');
  const existing=Object.values(SHOT02_NODES).map(bounds);
  const phone:Rect={left:55,top:160,width:445,height:800};
  if(shot02Intersects({left:SHOT02_NODES.database.x-153,
      top:SHOT02_NODES.database.y-57,width:306,height:38},phone,8))
    throw Error('EP003_SHOT05_PRIMARY_LABEL_COLLIDES_WITH_PHONE');
  for(const r of REPLICAS){
    const box:Rect={left:r.left,top:r.top,width:r.width,height:r.height};
    if(box.left<40||box.top<40||box.left+box.width>1870||
      box.top+box.height>1020)
      throw Error('EP003_SHOT05_REPLICA_OUTSIDE_16_9_SAFE_AREA');
    for(const orig of [...existing,phone])
      if(shot02Intersects(box,orig,20))
        throw Error('EP003_SHOT05_REPLICA_OVERLAPS_EXISTING_ARCHITECTURE');
  }
  if(shot02Intersects(REPLICAS[0],REPLICAS[1],20))
    throw Error('EP003_SHOT05_REPLICA_CONTAINER_NESTING_OR_COLLISION');
  const legendA:Rect={left:560,top:707,width:325,height:36};
  const legendB:Rect={left:915,top:707,width:445,height:36};
  if(shot02Intersects(legendA,legendB,24))
    throw Error('EP003_SHOT05_LEGEND_COLLISION');
  for(const callout of CALLOUTS){
    const s=shot05CardSize(callout.title,callout.meaning);
    const card={left:CARD_LEFT,top:CARD_TOP,...s};
    if(card.top+card.height>1020)
      throw Error('EP003_SHOT05_CARD_OUTSIDE_FRAME');
    for(const node of [...existing,phone,...REPLICAS]){
      if(shot02Intersects(card,node,20))
        throw Error('EP003_SHOT05_CARD_OVERLAPS_NODE');
    }
    if(shot02Intersects(card,legendA,14)||shot02Intersects(card,legendB,14))
      throw Error('EP003_SHOT05_CARD_OVERLAPS_LEGEND');
  }
  for(const route of QUERY_PATHS){
    if(route.start.x<500||route.end.x>1870||route.end.y>1000)
      throw Error('EP003_SHOT05_DATABASE_QUERY_PATH_OUTSIDE_WORLD');
    if(!/^M\d+ \d+ C\d+ \d+ \d+ \d+ \d+ \d+$/.test(route.d))
      throw Error('EP003_SHOT05_QUERY_LINE_MUST_BE_PHYSICAL_BEZIER');
  }
  return true;
}

const Replicas:React.FC<{frame:number}>=({frame})=><svg
  width="1920" height="1080" viewBox="0 0 1920 1080"
  style={{position:'absolute',inset:0,zIndex:13,pointerEvents:'none',overflow:'hidden'}}>
 {REPLICAS.map((r,i)=>{
    const age=3080-1+EP003_SHOT05_PREDECESSOR.frames-1+frame-
      EP003_SHOT05_PREDECESSOR.previousWriteCueFrame;
    const phase=((age*.0055+i*.44)%1);
    const point=bezier(phase,r);
    const center=r.left+r.width/2;
    return <g key={r.key}>
      <path d={replicaPath(r)} fill="none" stroke="#1D526C"
        strokeWidth={7} opacity={.57}/>
      <path d={replicaPath(r)} fill="none" stroke={r.stroke}
        strokeWidth={3.2} opacity={.72}/>
      <circle cx={point.x} cy={point.y} r={5.4} fill={r.stroke}
        opacity={Math.min(1,phase*11,(1-phase)*11)}
        style={{filter:'drop-shadow(0 0 8px '+r.stroke+')'}}/>
      <g transform={'translate('+(center-45)+' '+(r.top+5)+')'}
        style={{filter:'drop-shadow(0 0 11px '+r.stroke+')'}}>
        <ellipse cx="45" cy="17" rx="29" ry="11"
          fill="rgba(16,60,78,.55)" stroke={r.stroke} strokeWidth={4}/>
        <path d="M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40"
          fill="none" stroke={r.stroke} strokeWidth={4}/>
        <ellipse cx="45" cy="65" rx="29" ry="11"
          fill="rgba(8,32,53,.32)" stroke={r.stroke} strokeWidth={4}/>
      </g>
      <text x={center} y={r.top+111} fill={WHITE}
        fontFamily={AT_FONT} fontSize={22} fontWeight={850} textAnchor="middle"
        letterSpacing=".02em" style={{filter:'drop-shadow(0 1px 7px #071829)'}}>
        {r.title}
      </text>
    </g>;
  })}
 </svg>;

const QueryRouting:React.FC<{frame:number;cues:Shot05Props['cueFrames']}>=
({frame,cues})=>{
 const primaryLocked=frame>=cues.LOCK_COMMITTED;
 const replicaStale=frame>=cues.REPLICA_LAG&&frame<cues.CATCH_UP;
 const hypothetical=frame>=cues.HYPOTHETICAL&&frame<cues.EVENTUAL;
 const primaryWarning=frame>=cues.SAFE_PRIMARY&&frame<cues.HYPOTHETICAL;
 const dashOffset=-(3080+EP003_SHOT05_PREDECESSOR.frames-1+frame)*.74;
 return <>
   <svg width="1920" height="1080" viewBox="0 0 1920 1080"
     style={{position:'absolute',inset:0,zIndex:19,pointerEvents:'none'}}>
     {QUERY_PATHS.map((r,i)=>{
       const warning=(i===0&&(primaryLocked||primaryWarning))||(i===1&&hypothetical);
       return <g key={r.key} opacity={1}>
         <path d={r.d} stroke="#15394C" strokeWidth={9} fill="none"
           strokeLinecap="round"/>
         <path d={r.d} stroke={warning?AMBER:r.color}
           strokeWidth={i===1&&hypothetical?5:3.7}
           fill="none" strokeLinecap="round" strokeDasharray="10 14"
           strokeDashoffset={dashOffset}
           style={{filter:'drop-shadow(0 0 5px '+(warning?AMBER:r.color)+')'}}/>
       </g>;
     })}
   </svg>
   <div style={{position:'absolute',left:560,top:707,width:325,height:36,
      color:primaryLocked?AMBER:CYAN,opacity:1,zIndex:22,fontSize:21,
      fontFamily:AT_FONT,fontWeight:850,whiteSpace:'nowrap'}}>
      {primaryLocked?'PRIMARY STATUS: LOCKED':'WRITE → PRIMARY'}
   </div>
   <div style={{position:'absolute',left:915,top:707,width:445,height:36,
      color:replicaStale?AMBER:MINT,opacity:1,zIndex:22,fontSize:21,
      fontFamily:AT_FONT,fontWeight:850,whiteSpace:'nowrap'}}>
      {frame<cues.REPLICA_LAG?'SUITABLE READ → REPLICA':
        frame>=cues.CATCH_UP?'REPLICA A: MAY CATCH UP':'REPLICA A: OLDER STATUS'}
   </div>
   <div style={{position:'absolute',
      left:SHOT02_NODES.database.x-153,top:SHOT02_NODES.database.y-57,
      width:306,height:38,zIndex:17,color:CYAN,
      fontFamily:AT_FONT,textAlign:'center',fontSize:23,lineHeight:'38px',
      fontWeight:860,letterSpacing:'.025em',whiteSpace:'nowrap',
      textShadow:'0 2px 10px #04131E,0 0 12px rgba(104,229,255,.25)',
      pointerEvents:'none'}}>PRIMARY DATABASE</div>
 </>;
};

const Callouts:React.FC<{frame:number;cues:Shot05Props['cueFrames'];duration:number}>=
({frame,cues,duration})=><>{CALLOUTS.map((c,i)=>{
 const start=cues[c.cue],next=i+1<CALLOUTS.length?
   cues[CALLOUTS[i+1].cue]:duration;
 const end=Math.min(next,start+250);
 if(frame<start||frame>=end||!ep003CardIsReadable(c.title,c.meaning,start,end,30))
   return null;
 const sz=shot05CardSize(c.title,c.meaning);
 return <div key={c.cue} style={{position:'absolute',
   left:CARD_LEFT,top:CARD_TOP,width:sz.width,height:sz.height,
   borderRadius:17,boxSizing:'border-box',padding:'19px 34px',
   background:'linear-gradient(120deg,rgba(10,32,50,.977),rgba(5,19,37,.988))',
   border:'2px solid '+c.color,boxShadow:'0 13px 36px rgba(0,0,0,.33)',
   pointerEvents:'none',opacity:ep003CardOpacity(frame,start,end),zIndex:24,
   fontFamily:AT_FONT}}>
    <div style={{fontWeight:850,color:c.color,fontSize:23,lineHeight:'29px',
      whiteSpace:'nowrap'}}>{c.title}</div>
    <div style={{fontWeight:900,color:WHITE,fontSize:29,lineHeight:'39px',
      marginTop:11,whiteSpace:'nowrap'}}>{c.meaning}</div>
 </div>;
})}</>;

export const Ep003Shot05StaleReadV1:React.FC<Shot05Props>=(props)=>{
 const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||
     cfg.durationInFrames!==props.durationInFrames)
   throw Error('EP003_SHOT05_EXPECTS_1920x1080_30FPS_SELECTED_VOICE');
 validateShot05(props);
 const worldFrame=props.worldStartFrame+frame;
 const heading=ease(frame,65,75);
 return <ATBackground>
   <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
      transformOrigin:'50% 50%',pointerEvents:'none'}}>
     <Shot07CleanArchitectureWorld frame={worldFrame} replicaGrowth={0}
       dbStress={.2} cascadeStartFrame={1} criticalPulseStartFrame={0}
       recoveryLevel={1} showPhone={1} showPools={.25}
       initialPressure showLoginBadge={0} showRetryAttempts={0}
       flowRetryLevel={.08} flowJitterLevel={.76}
       admissionLevel={.5} breakerLevel={.11} probeLevel={1}/>
     <Replicas frame={frame}/>
     <QueryRouting frame={frame} cues={props.cueFrames}/>
   </AbsoluteFill>
   <AbsoluteFill style={{zIndex:25,pointerEvents:'none'}}>
     <div style={{position:'absolute',left:560,top:78,
       opacity:1-heading,color:WHITE,fontFamily:AT_FONT,fontSize:38,
       fontWeight:890,letterSpacing:'-.02em'}}>
        WHO CHOOSES THE DATABASE?
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
     </div>
     <div style={{position:'absolute',left:560,top:78,
       opacity:heading,color:WHITE,fontFamily:AT_FONT,fontSize:38,
       fontWeight:890,letterSpacing:'-.02em'}}>
        THE REPLICA GIVES A WRONG ANSWER
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
     </div>
     <Callouts frame={frame} cues={props.cueFrames} duration={props.durationInFrames}/>
   </AbsoluteFill>
   {frame===0&&<AbsoluteFill style={{zIndex:30,pointerEvents:'none'}}>
      <Img src={props.previousLastFrameDataUri}
        style={{width:1920,height:1080,objectFit:'cover'}}/>
   </AbsoluteFill>}
 </ATBackground>;
};
