import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {AT_FONT} from '../../components/architectural-thinking';
import {Ep003Shot09FinalWorldForShot10V2} from './Shot09FinalWorldForShot10V2';
import {PREMIUM_ROUTES,premiumRouteD,validatePremiumRoutes} from '../../../ep003-premium-routing-v2.mjs';
import {shot10TextWidth} from '../../../shot10-content-fit-layout.mjs';
import {ep003CardIsReadable,ep003CardOpacity} from '../../../ep003-readable-card-policy.mjs';

const WHITE='#F5FCFF',CYAN='#68E5FF',MINT='#6FECD4',AMBER='#F5A55A';
const SELECTED_TAKE='5c3435f6-ae66-4ec3-a6b0-bf1cc8207486';
const SHOT10_LAST_WORLD_FRAME=47457;
const RENDER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(f:number,start:number,length:number)=>{
 const t=clamp((f-start)/Math.max(1,length));return t*t*(3-2*t);
};
export const EP003_SHOT11_CUES=[
 'BEGIN','ONE_PERSON','FOLLOWED','AUTH_STATE','PRESSURE','HEALTHY',
 'BOTTLENECK','PROTECTED','CAPACITY','CHOICES','REPLICATION','CONSISTENCY',
 'SHARDING','FAILOVER','RESPONSIBILITY','MORE_CAPACITY','MORE_COPIES',
 'MORE_OWNERS','SYSTEM_DESIGN','NOT_COMPONENTS','TRADEOFF','HUMAN','LOGIN','SUCCESS'
] as const;
export type Shot11Cue=typeof EP003_SHOT11_CUES[number];
export type Shot11Props={
 durationInFrames:number;voiceTakeId:string;previousRenderId:string;
 previousLastFrameSha256:string;previousLastFrameDataUri:string;
 worldStartFrame:number;cueFrames:Record<Shot11Cue,number>;
};
const OLD_SHOT09_TAKE='7510815a-d096-415f-b4f0-52ae8398ce45';
const OLD_SHOT09_CUES={
 INTRO:62,PRIMARY_AND_REPLICA:162,PRIMARY_OWNS:260,PRIMARY_FAIL:377,
 REQUEST_FAILURE:492,OTHER_SHARD:632,RECOVERY_PATH:751,PROMOTE:857,
 FAILOVER:977,LEGITIMATE_OWNER:1065,OLD_RETURN:1291,TWO_WRITERS:1380,
 SPLIT_BRAIN:1670,FENCING:1738,FENCE_MEANING:1836,DATA_RISK:2018,
 ASYNC:2078,LAG:2157,DATA_LOSS:2328,GREEN_ARROW:2434,
 CORRECTNESS:2585,INSTANCES:2712,WRONG_STATE:2825,TEST_FAILURES:2969
} as const;
type Card={
 start:Shot11Cue;end:Shot11Cue;title:string;lines:readonly [string,string];
 accent:string;
};
export const SHOT11_CARDS:readonly Card[]=[
 {start:'ONE_PERSON',end:'PRESSURE',title:'ONE HUMAN ACTION',
  lines:['One password. One click. One Login.','A request crosses an entire system.'],accent:CYAN},
 {start:'PRESSURE',end:'CHOICES',title:'HEALTHY IS NOT ENOUGH',
  lines:['One shared database sets the limit.','Protection alone cannot add capacity.'],accent:AMBER},
 {start:'REPLICATION',end:'RESPONSIBILITY',title:'CAPACITY AND CORRECTNESS',
  lines:['Replication gives suitable read options.','Sharding divides ownership and work.'],accent:MINT},
 {start:'RESPONSIBILITY',end:'SYSTEM_DESIGN',title:'EVERY GAIN HAS A COST',
  lines:['More capacity needs better routing.','More owners need stronger recovery.'],accent:AMBER},
 {start:'SYSTEM_DESIGN',end:'HUMAN',title:'SYSTEM DESIGN IS A TRADE-OFF',
  lines:['Give each responsibility a clear owner.','Measure what happens when systems fail.'],accent:CYAN},
 {start:'HUMAN',end:'SUCCESS',title:'THE HUMAN JOURNEY',
  lines:['A person presses Login and expects trust.','The architecture must deliver that result.'],accent:MINT}
] as const;
export function shot11CardSize(card:Card){
 const width=Math.ceil(Math.max(shot10TextWidth(card.title,23),
  ...card.lines.map(x=>shot10TextWidth(x,26)))+76);
 const height=149;
 if(width<340||width>830||560+width>1480||777+height>1020
  ||card.lines.some(x=>!x.trim()))
  throw Error('EP003_SHOT11_CARD_TEXT_EXCEEDS_SAFE_NONOVERLAPPING_BOUNDS_'+card.title);
 return {width,height};
}
export function validateShot11(p:Shot11Props){
 validatePremiumRoutes();
 if(!p||p.voiceTakeId!==SELECTED_TAKE||!RENDER_ID.test(p.previousRenderId)
   ||!/^[a-f0-9]{64}$/.test(p.previousLastFrameSha256)
   ||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)
   ||p.worldStartFrame!==SHOT10_LAST_WORLD_FRAME
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<2600
   ||p.durationInFrames>5200)throw Error('EP003_SHOT11_EXACT_LOCKED_SHOT10_V2_SEAM_OR_VOICE_MISSING');
 let prev=-1;
 for(const key of EP003_SHOT11_CUES){
  const f=p.cueFrames?.[key];
  if(!Number.isInteger(f)||f<prev||f>=p.durationInFrames)
   throw Error('EP003_SHOT11_REAL_WORD_LEVEL_CUE_INVALID_'+key);
  prev=f;
 }
 if(p.cueFrames.BEGIN<60)throw Error('EP003_SHOT11_2_SECOND_BREATH_MISSING');
 if(premiumRouteD(PREMIUM_ROUTES.REPLICA_B).includes('C'))
  throw Error('EP003_SHOT11_REQUEST_RAIL_MUST_NOT_REVERT_TO_CUBIC_PATH');
 for(const card of SHOT11_CARDS)shot11CardSize(card);
 return true;
}
const Cards:React.FC<{frame:number;cues:Shot11Props['cueFrames']}> =({frame,cues})=><>{SHOT11_CARDS.map(c=>{
 const start=cues[c.start],end=cues[c.end];
 if(frame<start||frame>=end||end-start<90
   ||!ep003CardIsReadable(c.title,c.lines.join(' '),start,end,30))return null;
 const dim=shot11CardSize(c);
 return <div key={c.title} style={{position:'absolute',
   left:560,top:777,width:dim.width,height:dim.height,boxSizing:'border-box',
   borderRadius:16,border:'2px solid '+c.accent,
   padding:'15px 32px',pointerEvents:'none',
   background:'linear-gradient(120deg,rgba(10,32,50,.978),rgba(5,19,37,.990))',
   boxShadow:'0 13px 34px rgba(0,0,0,.33)',
   opacity:ep003CardOpacity(frame,start,end),fontFamily:AT_FONT,zIndex:34}}>
    <div style={{color:c.accent,fontSize:23,fontWeight:850,lineHeight:'29px',whiteSpace:'nowrap'}}>{c.title}</div>
    <div style={{marginTop:12,color:WHITE,fontSize:26,fontWeight:860,lineHeight:'37px'}}>
     {c.lines.map(line=><div key={line} style={{whiteSpace:'nowrap'}}>{line}</div>)}
    </div>
 </div>;
 })}</>;
const PremiumRouteFocus:React.FC<{frame:number;cues:Shot11Props['cueFrames']}>=({frame,cues})=>{
 const amount=ease(frame,cues.FOLLOWED,44)*(1-ease(frame,cues.RESPONSIBILITY,44));
 if(amount<=.01)return null;
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
   style={{position:'absolute',inset:0,opacity:amount*.20,zIndex:27,pointerEvents:'none'}}>
   {[PREMIUM_ROUTES.AUTH_A,PREMIUM_ROUTES.AUTH_B,PREMIUM_ROUTES.REPLICA_A,PREMIUM_ROUTES.REPLICA_B].map((route,i)=>
    <path key={i} d={premiumRouteD(route)} fill="none" stroke={i%2?MINT:CYAN}
     strokeWidth={3} strokeLinecap="round"/>)}
 </svg>;
};
export const Ep003Shot11HumanFirstFinaleV1:React.FC<Shot11Props>=props=>{
 const f=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||
  cfg.durationInFrames!==props.durationInFrames)
  throw Error('EP003_SHOT11_FORMAT_OR_DURATION_NOT_EXACT');
 validateShot11(props);
 const titleChange=ease(f,props.cueFrames.ONE_PERSON+10,72);
 return <AbsoluteFill style={{fontFamily:AT_FONT}}>
   <Ep003Shot09FinalWorldForShot10V2
    durationInFrames={props.durationInFrames}
    voiceTakeId={OLD_SHOT09_TAKE}
    previousRenderId={props.previousRenderId}
    previousLastFrameSha256={props.previousLastFrameSha256}
    previousLastFrameDataUri={props.previousLastFrameDataUri}
    worldStartFrame={40298}
    continuationFrameOffset={7159}
    titleHandoffFrame={3144}
    cueFrames={OLD_SHOT09_CUES}/>
   <AbsoluteFill style={{zIndex:31,pointerEvents:'none'}}>
    <div style={{position:'absolute',left:560,top:78,fontSize:38,
     fontWeight:890,letterSpacing:'-.02em',color:WHITE,opacity:1-titleChange}}>
     PROVE THE ARCHITECTURE WORKS
     <div style={{marginTop:15,width:690,height:2,
      background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
    </div>
    <div style={{position:'absolute',left:560,top:78,fontSize:38,
     fontWeight:890,letterSpacing:'-.02em',color:WHITE,opacity:titleChange}}>
     WHAT ONE LOGIN TEACHES US
     <div style={{marginTop:15,width:690,height:2,
      background:'linear-gradient(90deg,#68E5FF,transparent)'}}/>
    </div>
    <PremiumRouteFocus frame={f} cues={props.cueFrames}/>
    <Cards frame={f} cues={props.cueFrames}/>
   </AbsoluteFill>
   {f<8&&<AbsoluteFill style={{zIndex:50,pointerEvents:'none',
    opacity:1-f/8}}>
    <Img src={props.previousLastFrameDataUri}
     style={{width:1920,height:1080,objectFit:'cover'}}/>
   </AbsoluteFill>}
 </AbsoluteFill>;
};
