import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {shot09Ease,assertShot09SafeLayout,validateShot09Source,
  type Shot09SceneProps,type Shot09TermId} from './Shot09VisualContract';

const WHITE='#F5FCFF',SOFT='#B5D2E6',AMBER='#F5A55A';
const MINT='#6FECD4',CYAN='#68E5FF',RED='#F06F58';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const panel=(accent:string)=>({
  background:'linear-gradient(153deg,rgba(8,32,53,.965),rgba(5,19,37,.985))',
  border:'1.5px solid '+accent,borderRadius:15,
  boxShadow:'0 9px 34px rgba(0,0,0,.35),0 0 20px rgba(72,195,223,.09)',
  boxSizing:'border-box' as const,
});

const OrangeCue:React.FC<{frame:number;cue:Record<Shot09TermId,number>;
  duration:number}>=({frame,cue,duration})=>{
  const events=[
    {at:cue.NINE_HUNDRED,label:'DEMAND EXCEEDS CAPACITY',
      detail:'THE WAITING QUEUE KEEPS GROWING'},
    {at:cue.FOUR_FIFTY,label:'ONE SHARED LIMIT',
      detail:'450 DB LOOKUPS/S ACROSS ALL THREE AUTH SERVERS'},
    {at:cue.SHEDDING,label:'REJECT EARLY',
      detail:'FAST FAILURE IS STILL A FAILED LOGIN'},
    {at:cue.CONCURRENCY,label:'BOUND CONCURRENCY',
      detail:'LIMIT DATABASE WORK ACROSS THE THREE POOLS'},
    {at:cue.BULKHEAD,label:'ISOLATE RETRIES',
      detail:'SAVE ROOM FOR NEW LOGIN LOOKUPS'},
    {at:cue.BREAKER_OPEN,label:'CIRCUIT BREAKER',
      detail:'STOP DB CALLS WHEN TIMEOUTS KEEP HAPPENING'},
    {at:cue.TEST_PROBES,label:'CHECK CAREFULLY',
      detail:'ONLY A FEW TEST REQUESTS MAY PASS'},
    {at:cue.TRADEOFF,label:'THE REAL TRADE-OFF',
      detail:'SOME LOGINS FAIL SO OTHERS CAN FINISH'},
  ];
  const index=events.reduce((last,entry,i)=>frame>=entry.at?i:last,-1);
  if(index<0)return null;
  const entry=events[index],next=index+1<events.length?events[index+1].at:duration;
  const fadeIn=shot09Ease(frame,entry.at,25);
  const fadeOut=1-shot09Ease(frame,Math.max(entry.at+80,next-32),29);
  return <div style={{position:'absolute',left:565,top:875,
    width:'max-content',maxWidth:1060,height:69,zIndex:26,pointerEvents:'none',
    display:'inline-flex',alignItems:'center',whiteSpace:'nowrap',
    padding:'0 19px',boxSizing:'border-box',fontFamily:AT_FONT,
    border:'2px solid rgba(245,165,90,.92)',borderRadius:13,
    background:'linear-gradient(110deg,rgba(8,25,44,.97),rgba(6,19,36,.95))',
    boxShadow:'0 0 19px rgba(245,165,90,.19),inset 0 0 0 1px rgba(245,165,90,.10)',
    fontSize:23,fontWeight:860,letterSpacing:'.008em',
    textShadow:'0 0 18px rgba(245,165,90,.26)',
    opacity:fadeIn*fadeOut,
    transform:'translateY('+((1-fadeIn)*6)+'px)'}}>
    <span style={{color:AMBER}}>{entry.label}</span>
    <span style={{color:'#C4D7E4'}}> · </span>
    <span style={{color:'#F5F8ED'}}>{entry.detail}</span>
  </div>;
};

const PreviousDbReadout:React.FC<{fade:number}>=({fade})=>
  <div style={{position:'absolute',left:1573,top:685,width:256,height:143,
    padding:'15px 14px',zIndex:25,pointerEvents:'none',fontFamily:AT_FONT,
    opacity:fade,...panel(AMBER)}}>
    <div style={{fontSize:16,fontWeight:900,color:WHITE}}>USER DATABASE</div>
    <div style={{height:8,marginTop:15,borderRadius:5,
      background:'rgba(237,103,82,.24)'}}>
      <div style={{height:8,borderRadius:5,width:'55%',background:RED,
        boxShadow:'0 0 11px rgba(242,105,76,.45)'}}/>
    </div>
    <div style={{fontSize:12,fontWeight:840,marginTop:11,color:MINT}}>
      FEWER DUPLICATE ATTEMPTS
    </div>
    <div style={{fontSize:12,marginTop:7,fontWeight:840,color:AMBER}}>
      CAPACITY · UNCHANGED
    </div>
  </div>;

const DemandPanel:React.FC<{frame:number;cue:Record<Shot09TermId,number>}>=
({frame,cue})=>{
  const open=shot09Ease(frame,cue.NINE_HUNDRED,26);
  const budget=shot09Ease(frame,cue.FOUR_FIFTY,36);
  return <div style={{position:'absolute',left:560,top:695,width:448,
    height:148,padding:'15px 19px',zIndex:24,pointerEvents:'none',
    opacity:open,fontFamily:AT_FONT,...panel(AMBER)}}>
    <div style={{fontSize:17,fontWeight:850,color:WHITE}}>DEMAND VS. DATABASE LIMIT</div>
    <div style={{display:'flex',gap:9,marginTop:14,alignItems:'center'}}>
      <div style={{color:AMBER,fontSize:26,fontWeight:920}}>900/s</div>
      <div style={{color:SOFT,fontSize:15,fontWeight:800}}>NEW LOGIN REQUESTS</div>
    </div>
    <div style={{display:'flex',gap:10,alignItems:'center',marginTop:6}}>
      <div style={{color:RED,fontSize:22,fontWeight:900}}>~500/s</div>
      <div style={{color:SOFT,fontSize:14,fontWeight:810}}>DB LOOKUPS FINISHED</div>
    </div>
    <div style={{position:'absolute',right:12,bottom:9,
      color:budget>.5?MINT:AMBER,fontWeight:860,fontSize:12}}>
      {budget>.5?'LIMIT: 450 TOTAL DB ATTEMPTS/S':'ILLUSTRATIVE LOAD · NOT LIVE METRICS'}
    </div>
  </div>;
};

const InterventionPanel:React.FC<{frame:number;cue:Record<Shot09TermId,number>}>=
({frame,cue})=>{
  const events=[
    {at:cue.ADMISSION_CONTROL,heading:'ADMISSION CONTROL',
      line:'POLICY ON THE EXISTING LOGIN PATH',accent:CYAN},
    {at:cue.SHARED_BUDGET,heading:'ONE BUDGET · THREE AUTH',
      line:'450 TOTAL DB ATTEMPTS/S · EXAMPLE',accent:AMBER},
    {at:cue.SHEDDING,heading:'EARLY LOAD SHEDDING',
      line:'REJECTED LOGIN · NO SESSION CREATED',accent:RED},
    {at:cue.CONCURRENCY,heading:'LIMIT ACTIVE DB LOOKUPS',
      line:'ONE GLOBAL LIMIT ACROSS 3 AUTH POOLS',accent:CYAN},
    {at:cue.BULKHEAD,heading:'RETRY BULKHEAD',
      line:'RESERVE ROOM FOR NEW LOGIN LOOKUPS',accent:MINT},
    {at:cue.BREAKER_OPEN,heading:'CIRCUIT BREAKER · OPEN',
      line:'NEW DB CALLS FAIL FAST TEMPORARILY',accent:RED},
    {at:cue.TEST_PROBES,heading:'HALF-OPEN · SMALL TEST',
      line:'ONLY LIMITED PROBES · DO NOT REOPEN YET',accent:AMBER},
    {at:cue.TRADEOFF,heading:'CAPACITY DID NOT INCREASE',
      line:'SOME REJECTED · ACCEPTED WORK HAS A CHANCE',accent:MINT},
  ];
  const index=events.reduce((last,entry,i)=>frame>=entry.at?i:last,-1);
  if(index<0)return null;
  const entry=events[index],next=index+1<events.length?events[index+1].at
    :Number.POSITIVE_INFINITY;
  const appear=shot09Ease(frame,entry.at,21);
  const leave=Number.isFinite(next)?1-shot09Ease(frame,Math.max(entry.at+60,next-26),22):1;
  return <div style={{position:'absolute',left:1090,top:695,width:445,
    height:148,padding:'17px 20px',zIndex:24,pointerEvents:'none',
    opacity:appear*leave,fontFamily:AT_FONT,...panel(entry.accent)}}>
    <div style={{color:WHITE,fontSize:20,fontWeight:890}}>{entry.heading}</div>
    <div style={{height:2,width:300,marginTop:15,
      background:'linear-gradient(90deg,'+entry.accent+',transparent)'}}/>
    <div style={{color:SOFT,fontSize:15,fontWeight:790,marginTop:17}}>
      {entry.line}
    </div>
    {index===4&&<div style={{display:'flex',gap:6,marginTop:10}}>
      {['NEW LOGIN','READ RETRY'].map((label,i)=>
        <span key={label} style={{fontSize:11,color:i?AMBER:MINT,fontWeight:850}}>
          {i?'RETRY IS LIMITED':'NEW LOGIN PROTECTED'}
        </span>)}
    </div>}
  </div>;
};

const AdmissionPolicy:React.FC<{frame:number;cue:Record<Shot09TermId,number>}>=
({frame,cue})=>{
  const show=shot09Ease(frame,cue.ADMISSION_CONTROL,24);
  const shed=shot09Ease(frame,cue.SHEDDING,28);
  const breaker=shot09Ease(frame,cue.BREAKER_OPEN,25);
  const probe=shot09Ease(frame,cue.TEST_PROBES,31);
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:17,opacity:show}}>
    <div style={{position:'absolute',left:1092,top:446,width:4,height:201,
      borderRadius:3,background:breaker>.5?RED:shed>.5?AMBER:CYAN,
      boxShadow:'0 0 17px rgba(245,165,90,.23)'}}/>
    <div style={{position:'absolute',left:1060,top:662,width:82,height:23,
      display:'flex',justifyContent:'center',alignItems:'center',
      color:breaker>.5?RED:AMBER,fontFamily:AT_FONT,fontWeight:880,fontSize:12,
      borderRadius:7,background:'rgba(8,26,45,.94)',
      border:'1px solid rgba(245,165,90,.64)'}}>
      {breaker>.5?(probe>.5?'PROBE ONLY':'OPEN'):shed>.5?'SHEDDING':'ADMIT'}
    </div>
  </AbsoluteFill>;
};

export const Shot09DirectorVisualV1:React.FC<Shot09SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
      ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT09_REQUIRES_REAL_APPROVED_VOICE_1080P30');
  const {positions:cue}=validateShot09Source(props);
  assertShot09SafeLayout();
  const handoff=props.lockedShot08Handoff;
  const worldFrame=handoff.worldLastFrame+frame;
  const titleChange=shot09Ease(frame,cue.ADMISSION_CONTROL,60);
  const oldFooter=1-shot09Ease(frame,cue.NINE_HUNDRED,36);
  const oldDbPanel=1-shot09Ease(frame,cue.FIVE_HUNDRED,45);
  const admission=1-.5*shot09Ease(frame,cue.SHEDDING,66);
  const breaker=shot09Ease(frame,cue.BREAKER_OPEN,32);
  const probe=shot09Ease(frame,cue.TEST_PROBES,38);
  const final=shot09Ease(frame,cue.TRADEOFF,28);
  return <ATBackground>
    <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
      transformOrigin:'50% 50%'}}>
      <Shot07CleanArchitectureWorld frame={worldFrame}
        replicaGrowth={0} dbStress={.82}
        cascadeStartFrame={handoff.cascadeStartFrame}
        criticalPulseStartFrame={handoff.criticalPulseStartFrame}
        recoveryLevel={1}
        showPhone={1} showPools={0}
        initialPressure showLoginBadge={0}
        showRetryAttempts={0}
        flowRetryLevel={.16} flowJitterLevel={1}
        admissionLevel={admission} breakerLevel={breaker}
        probeLevel={probe}/>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:22}}>
      <div style={{position:'absolute',left:560,top:78,
        fontFamily:AT_FONT,color:WHITE,zIndex:25}}>
        <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em',
          opacity:1-titleChange}}>STOP THE RETRY STORM</div>
        <div style={{position:'absolute',left:0,top:0,fontSize:39,
          fontWeight:890,letterSpacing:'-.02em',
          opacity:titleChange}}>PROTECT THE SHARED DATABASE</div>
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <AdmissionPolicy frame={frame} cue={cue}/>
      <DemandPanel frame={frame} cue={cue}/>
      <InterventionPanel frame={frame} cue={cue}/>
      <PreviousDbReadout fade={oldDbPanel}/>
      <OrangeCue frame={frame} cue={cue} duration={props.durationInFrames}/>
      <div style={{position:'absolute',left:560,top:983,width:1220,
        height:54,fontFamily:AT_FONT,fontSize:20,fontWeight:825,
        color:'#E7D8C6',opacity:oldFooter,letterSpacing:'.017em'}}>
        RETRIES ARE BOUNDED · THE SHARED DATABASE STILL HAS FINITE CAPACITY
      </div>
      <div style={{position:'absolute',left:560,top:983,width:1220,
        height:54,fontFamily:AT_FONT,fontSize:20,fontWeight:825,
        color:'#E7D8C6',opacity:final,letterSpacing:'.017em'}}>
        SOME LOGINS FAIL FAST · ACCEPTED WORK MUST FIT THE SAME DATABASE LIMIT
      </div>
    </AbsoluteFill>
  </ATBackground>;
};
