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

export const EP003_SHOT03_V3_PREDECESSOR={
  renderId:'78db6f85-ba05-4714-ba4f-fc70d64def88',
  sha256:'5eceeb39954b9a5b6d755d136b3dd29fe04b5fc9e30992fcc65464f40bc2914e',
  frames:3443,worldStartFrame:14491+3443-1,
  fps:30,width:1920,height:1080,
} as const;

export const EP003_SHOT03_CUES=[
  'INTRO','PRIMARY','INTRO_REPLICAS','REPLICA_A','REPLICA_B',
  'REPLICATION','COPY','WRITE','ASYNC','LAG','READS','SCALE','QUESTION'
] as const;
export type Ep003Shot03Cue=typeof EP003_SHOT03_CUES[number];
export type Ep003Shot03Props={
  durationInFrames:number;
  voiceTakeId:string;
  previousRenderId:string;
  previousLastFrameSha256:string;
  previousLastFrameDataUri:string;
  worldStartFrame:number;
  cueFrames:Record<Ep003Shot03Cue,number>;
};

const REPLICAS=[
  {key:'A',title:'REPLICA A',left:1578,top:709,width:225,height:116,stroke:CYAN,
    start:{x:1674,y:649},c1:{x:1660,y:690},c2:{x:1690,y:697},end:{x:1690,y:727}},
  {key:'B',title:'REPLICA B',left:1578,top:852,width:225,height:116,stroke:MINT,
    start:{x:1720,y:649},c1:{x:1850,y:719},c2:{x:1830,y:842},end:{x:1690,y:870}},
] as const;
const glossary=[
  {cue:'PRIMARY',title:'PRIMARY DATABASE',meaning:'Accepts writes; replicas copy changes',color:CYAN},
  {cue:'COPY',title:'REPLICA',meaning:'A copy of the same account data',color:MINT},
  {cue:'ASYNC',title:'ASYNCHRONOUS REPLICATION',meaning:'Primary commits before replica updates',color:AMBER},
  {cue:'SCALE',title:'HORIZONTAL SCALING',meaning:'More machines share suitable read work',color:MINT},
] as const;
const CARD_LEFT=560,CARD_TOP=742,CARD_HEIGHT=131;
const rectangle=(r:{left:number;top:number;width:number;height:number})=>r;

export function shot03CardDimensions(title:string,meaning:string){
  const width=Math.ceil(Math.max(shot10TextWidth(title,23),shot10TextWidth(meaning,29))+80);
  if(width<320||width>900||CARD_LEFT+width>1480)
    throw Error('EP003_SHOT03_GLOSSARY_TEXT_OVERFLOW');
  return {width,height:CARD_HEIGHT};
}
export function validateEp003Shot03Props(p:Ep003Shot03Props){
  if(!p||p.previousRenderId!==EP003_SHOT03_V3_PREDECESSOR.renderId||
      p.worldStartFrame!==EP003_SHOT03_V3_PREDECESSOR.worldStartFrame||
      !/^[a-f0-9]{64}$/.test(p.previousLastFrameSha256)||
      !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||
      !/^[0-9a-f-]{36}$/i.test(p.voiceTakeId)||
      !Number.isInteger(p.durationInFrames)||p.durationInFrames<200||
      p.durationInFrames>18000)
    throw Error('EP003_SHOT03_EXACT_V4_FRAME_AND_REAL_AUDIO_REQUIRED');
  let prev=-1;
  for(const cue of EP003_SHOT03_CUES){
    const f=p.cueFrames?.[cue];
    if(!Number.isInteger(f)||f<prev||f>=p.durationInFrames)
      throw Error('EP003_SHOT03_REAL_VOICE_CUE_MISSING_OR_OUT_OF_ORDER_'+cue);
    prev=f;
  }
  if(p.cueFrames.INTRO<60)throw Error('EP003_SHOT03_EXACT_TWO_SECOND_NARRATION_PRELUDE_REQUIRED');
  const all=Object.values(SHOT02_NODES).map(n=>rectangle({
    left:n.x-n.width/2,top:n.y,width:n.width,height:n.height,
  }));
  const phone=rectangle({left:55,top:160,width:445,height:800});
  for(const r of REPLICAS){
    const rect=rectangle({left:r.left,top:r.top,width:r.width,height:r.height});
    if(rect.left<40||rect.top<40||rect.left+rect.width>1870||
       rect.top+rect.height>1020)throw Error('EP003_SHOT03_REPLICA_OUT_OF_FRAME');
    for(const known of [...all,phone])if(shot02Intersects(rect,known,20))
      throw Error('EP003_SHOT03_REPLICA_OVERLAPS_ORIGINAL_WORLD');
  }
  if(shot02Intersects(REPLICAS[0],REPLICAS[1],20))
    throw Error('EP003_SHOT03_REPLICA_NESTING_OR_OVERLAP');
  const primaryLabel=rectangle({
    left:SHOT02_NODES.database.x-153,
    top:SHOT02_NODES.database.y-57,width:306,height:38,
  });
  if(primaryLabel.left<40||primaryLabel.top<40||
     primaryLabel.left+primaryLabel.width>1880||
     shot10TextWidth('PRIMARY DATABASE',23)+20>primaryLabel.width)
    throw Error('EP003_SHOT03_PRIMARY_DATABASE_LABEL_OUT_OF_FRAME');
  for(const known of [...all,phone,...REPLICAS])
    if(shot02Intersects(primaryLabel,known,12))
      throw Error('EP003_SHOT03_PRIMARY_DATABASE_LABEL_OVERLAPS_ARCHITECTURE');
  for(const g of glossary){
    const sz=shot03CardDimensions(g.title,g.meaning);
    const card=rectangle({left:CARD_LEFT,top:CARD_TOP,...sz});
    if(card.top+card.height>1020)throw Error('EP003_SHOT03_GLOSSARY_OUTSIDE_SAFE_AREA');
    for(const r of [...REPLICAS,...all,phone])
      if(shot02Intersects(card,r,20))
        throw Error('EP003_SHOT03_GLOSSARY_OVERLAPS_ARCHITECTURE');
  }
  return true;
}
const bezier=(t:number,r:typeof REPLICAS[number])=>{
  const q=1-t;
  return {
    x:q*q*q*r.start.x+3*q*q*t*r.c1.x+3*q*t*t*r.c2.x+t*t*t*r.end.x,
    y:q*q*q*r.start.y+3*q*q*t*r.c1.y+3*q*t*t*r.c2.y+t*t*t*r.end.y,
  };
};
const replicaPath=(r:typeof REPLICAS[number])=>
  'M'+r.start.x+' '+r.start.y+' C'+r.c1.x+' '+r.c1.y+' '+r.c2.x+' '+r.c2.y+
  ' '+r.end.x+' '+r.end.y;

const PrimaryReplicaFlow:React.FC<{frame:number;cues:Ep003Shot03Props['cueFrames']}>=
({frame,cues})=><>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,zIndex:13,pointerEvents:'none',overflow:'hidden'}}>
    {REPLICAS.map((r,i)=>{
    const appear=ease(frame,i===0?cues.REPLICA_A:cues.REPLICA_B,65);
    const sync=ease(frame,cues.WRITE,50);
    const age=frame-cues.WRITE;
    const phase=age>=0?((age*.0055+i*.44)%1):0;
    const point=bezier(phase,r);
    const moving=age>=0?sync*appear*Math.min(1,phase*11,(1-phase)*11):0;
    const center=r.left+r.width/2;
    const glyphX=center-45;
    const glyphY=r.top+5;
    return <g key={r.key}>
      <path d={replicaPath(r)} fill="none" stroke="#1D526C"
        strokeWidth={7} opacity={appear*.57}/>
      <path d={replicaPath(r)} fill="none" stroke={r.stroke}
        strokeWidth={3.2} opacity={appear*(.32+.40*sync)}/>
      {age>=0&&<circle cx={point.x} cy={point.y} r={5.4}
        fill={r.stroke} opacity={moving}
        style={{filter:'drop-shadow(0 0 8px '+r.stroke+')'}}/>}
      <g transform={'translate('+glyphX+' '+glyphY+')'}
        opacity={appear} style={{filter:'drop-shadow(0 0 11px '+r.stroke+')'}}>
        <ellipse cx="45" cy="17" rx="29" ry="11"
          fill="rgba(16,60,78,.55)" stroke={r.stroke} strokeWidth={4}/>
        <path d="M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40"
          fill="none" stroke={r.stroke} strokeWidth={4}/>
        <ellipse cx="45" cy="65" rx="29" ry="11"
          fill="rgba(8,32,53,.32)" stroke={r.stroke} strokeWidth={4}/>
      </g>
      <text x={center} y={r.top+111} fill={WHITE} opacity={appear}
        fontFamily={AT_FONT} fontSize={22} fontWeight={850} textAnchor="middle"
        letterSpacing=".02em" style={{filter:'drop-shadow(0 1px 7px #071829)'}}>
        {r.title}
      </text>
    </g>;
  })}
  </svg>
  <div style={{position:'absolute',
    left:SHOT02_NODES.database.x-153,
    top:SHOT02_NODES.database.y-57,
    width:306,height:38,zIndex:17,
    fontFamily:AT_FONT,color:CYAN,textAlign:'center',fontSize:23,lineHeight:'38px',
    fontWeight:860,letterSpacing:'.025em',whiteSpace:'nowrap',
    textShadow:'0 2px 10px #04131E,0 0 12px rgba(104,229,255,.25)',
    opacity:ease(frame,cues.PRIMARY,70),pointerEvents:'none'}}>PRIMARY DATABASE</div>
</>;
const Glossary:React.FC<{frame:number;cues:Ep003Shot03Props['cueFrames'];duration:number}>=
({frame,cues,duration})=>{
  const sorted=glossary.map((g,i)=>({
    ...g,start:cues[g.cue],end:i+1<glossary.length?
      cues[glossary[i+1].cue]:duration,
  }));
  return <>{sorted.map(g=>{
    const end=Math.min(g.end,g.start+270);
    if(frame<g.start||frame>=end||!ep003CardIsReadable(g.title,g.meaning,g.start,end,30))
      return null;
    const alpha=ep003CardOpacity(frame,g.start,end);
    const size=shot03CardDimensions(g.title,g.meaning);
    return <div key={g.cue} style={{position:'absolute',left:CARD_LEFT,top:CARD_TOP,
      width:size.width,height:size.height,borderRadius:17,
      boxSizing:'border-box',padding:'20px 34px',opacity:alpha,zIndex:23,
      background:'linear-gradient(120deg,rgba(10,32,50,.977),rgba(5,19,37,.988))',
      border:'2px solid '+g.color,
      boxShadow:'0 13px 36px rgba(0,0,0,.33),0 0 18px rgba(89,202,232,.08)',
      fontFamily:AT_FONT,pointerEvents:'none'}}>
      <div style={{color:g.color,fontSize:23,lineHeight:'29px',fontWeight:850,
        whiteSpace:'nowrap'}}>{g.title}</div>
      <div style={{color:WHITE,fontSize:29,lineHeight:'39px',fontWeight:900,
        marginTop:11,whiteSpace:'nowrap'}}>{g.meaning}</div>
    </div>;
  })}</>;
};

export const Ep003Shot03PrimaryClarityV3:React.FC<Ep003Shot03Props>=(props)=>{
  const frame=useCurrentFrame(),cfg=useVideoConfig();
  if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||
      cfg.durationInFrames!==props.durationInFrames)
    throw Error('EP003_SHOT03_REQUIRES_1920X1080_30FPS_REAL_TAKE');
  validateEp003Shot03Props(props);
  const cues=props.cueFrames,worldFrame=props.worldStartFrame+frame;
  const growth=ease(frame,cues.PRIMARY,140);
  const oldHeadingOpacity=1-ease(frame,65,75);
  const newHeadingOpacity=ease(frame,65,75);
  return <ATBackground>
    <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
      transformOrigin:'50% 50%',pointerEvents:'none'}}>
      <Shot07CleanArchitectureWorld frame={worldFrame} replicaGrowth={0}
        dbStress={.56-.36*growth}
        cascadeStartFrame={1} criticalPulseStartFrame={0}
        recoveryLevel={1} showPhone={1} showPools={.25}
        initialPressure showLoginBadge={0} showRetryAttempts={0}
        flowRetryLevel={.08} flowJitterLevel={.76}
        admissionLevel={.5} breakerLevel={.11} probeLevel={1}/>
      <div style={{position:'absolute',
        left:SHOT02_NODES.database.x-SHOT02_NODES.database.width/2-11,
        top:SHOT02_NODES.database.y-11,
        width:SHOT02_NODES.database.width+22,
        height:SHOT02_NODES.database.height+22,
        border:'3px solid '+AMBER,borderRadius:24,boxSizing:'border-box',
        boxShadow:'0 0 38px rgba(245,165,90,.29)',
        opacity:.98*(1-ease(frame,20,120)),pointerEvents:'none',zIndex:18}}/>
      <PrimaryReplicaFlow frame={frame} cues={cues}/>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:25}}>
      <div style={{position:'absolute',left:560,top:78,
        opacity:oldHeadingOpacity,color:WHITE,fontFamily:AT_FONT,
        fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
        FIND THE REAL BOTTLENECK.
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
      </div>
      <div style={{position:'absolute',left:560,top:78,
        opacity:newHeadingOpacity,color:WHITE,fontFamily:AT_FONT,
        fontSize:38,fontWeight:890,letterSpacing:'-.02em'}}>
        ONE PRIMARY. TWO REPLICAS.
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <Glossary frame={frame} cues={cues} duration={props.durationInFrames}/>
    </AbsoluteFill>
    {frame===0&&<AbsoluteFill style={{zIndex:30,pointerEvents:'none'}}>
      <Img src={props.previousLastFrameDataUri}
        style={{width:1920,height:1080,objectFit:'cover'}}/>
    </AbsoluteFill>}
  </ATBackground>;
};
