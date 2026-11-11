import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {SHOT02_NODES} from './Shot02PremiumLayout';
import {shot10ContentCardSize,shot10CaptionSize,shot10DbMeterSize,shot10TweenSize}
  from '../../../shot10-content-fit-layout.mjs';
import {shot11Ease,assertShot11SafeLayout,validateShot11Source,
  type Shot11SceneProps,type Shot11TermId} from './Shot11VisualContract';

const WHITE='#F5FCFF',SOFT='#B5D2E6',AMBER='#F5A55A',
  MINT='#6FECD4',CYAN='#68E5FF',RED='#F06F58';
const panel=(accent:string)=>({
  background:'linear-gradient(153deg,rgba(8,32,53,.965),rgba(5,19,37,.985))',
  border:'1.5px solid '+accent,
  borderRadius:15,
  boxShadow:'0 9px 34px rgba(0,0,0,.35),0 0 20px rgba(72,195,223,.09)',
  boxSizing:'border-box' as const,
});
type PanelState={at:number;heading:string;primary:string;accent:string};
type CaptionState={at:number;main:string;detail:string};
type Shot11Positions=Record<Shot11TermId,number>;

const LockedShot10LastFrame:React.FC<{opacity:number}>=({opacity})=>{
  const left={heading:'REJECTED LOGINS',primary:'FAILURES COUNT TOO'};
  const right={heading:'RECOVERY MEASURED',primary:'ON-TIME WORK · SAME DB'};
  const leftSize=shot10ContentCardSize(left);
  const rightSize=shot10ContentCardSize(right);
  const database=shot10DbMeterSize();
  return <AbsoluteFill style={{zIndex:26,opacity,pointerEvents:'none'}}>
    <div style={{position:'absolute',left:560,top:78,
      color:WHITE,fontFamily:AT_FONT}}>
      <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em'}}>
        RECOVERY IS A USER OUTCOME
      </div>
      <div style={{marginTop:15,width:690,height:2,
        background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
    </div>
    <div style={{position:'absolute',left:560,top:695,
      width:leftSize.width,height:leftSize.height,
      padding:'13px 20px',fontFamily:AT_FONT,...panel(AMBER)}}>
      <div style={{fontSize:18,lineHeight:'22px',fontWeight:870,color:WHITE}}>
        {left.heading}
      </div>
      <div style={{marginTop:9,fontSize:20,lineHeight:'25px',
        fontWeight:870,color:AMBER}}>{left.primary}</div>
    </div>
    <div style={{position:'absolute',left:1090,top:695,
      width:rightSize.width,height:rightSize.height,
      padding:'13px 20px',fontFamily:AT_FONT,...panel(MINT)}}>
      <div style={{fontSize:18,lineHeight:'22px',
        fontWeight:870,color:WHITE}}>{right.heading}</div>
      <div style={{marginTop:9,fontSize:20,lineHeight:'25px',
        fontWeight:870,color:MINT}}>{right.primary}</div>
    </div>
    <div style={{position:'absolute',left:1573,top:685,
      width:database.width,height:database.height,
      padding:'13px 15px',fontFamily:AT_FONT,...panel(AMBER)}}>
      <div style={{fontSize:18,lineHeight:'23px',fontWeight:900,color:WHITE}}>
        USER DATABASE
      </div>
      <div style={{height:10,marginTop:11,borderRadius:5,
        background:'rgba(237,103,82,.24)',overflow:'hidden'}}>
        <div style={{height:10,width:'24%',borderRadius:5,
          background:AMBER,boxShadow:'0 0 11px rgba(242,105,76,.35)'}}/>
      </div>
    </div>
    <div style={{position:'absolute',left:560,top:983,
      fontFamily:AT_FONT,fontWeight:825,fontSize:20,
      color:'#E7D8C6',letterSpacing:'.017em'}}>
      COUNT REJECTIONS · MEASURE VALID LOGIN COMPLETION · CAPACITY IS STILL FINITE
    </div>
  </AbsoluteFill>;
};

const ResponsiveCard:React.FC<{frame:number;left:number;states:PanelState[]}>=
  ({frame,left,states})=>{
    const index=states.reduce((last,state,i)=>frame>=state.at?i:last,-1);
    if(index<0)return null;
    const state=states[index],target=shot10ContentCardSize(state);
    const previous=index===0?{width:Math.max(244,target.width-30),height:72}:
      shot10ContentCardSize(states[index-1]);
    const size=shot10TweenSize(previous,target,shot11Ease(frame,state.at,29));
    const reveal=shot11Ease(frame,state.at+21,14);
    return <div style={{position:'absolute',top:695,left,zIndex:24,
      width:size.width,height:size.height,
      padding:'13px 20px',overflow:'hidden',whiteSpace:'nowrap',
      fontFamily:AT_FONT,pointerEvents:'none',
      opacity:shot11Ease(frame,state.at,20),...panel(state.accent)}}>
      <div style={{opacity:reveal}}>
        <div style={{fontSize:18,lineHeight:'22px',
          fontWeight:870,color:WHITE}}>{state.heading}</div>
        <div style={{fontSize:20,lineHeight:'25px',
          fontWeight:870,marginTop:9,color:state.accent}}>{state.primary}</div>
      </div>
    </div>;
};

const ResponsiveCaption:React.FC<{frame:number;duration:number;
  captions:CaptionState[]}>=({frame,duration,captions})=>{
  const index=captions.reduce((last,state,i)=>frame>=state.at?i:last,-1);
  if(index<0)return null;
  const state=captions[index],next=index+1<captions.length
    ?captions[index+1].at:duration;
  const target=shot10CaptionSize(state);
  const previous=index===0?{width:Math.max(265,target.width-32),height:46}:
    shot10CaptionSize(captions[index-1]);
  const size=shot10TweenSize(previous,target,shot11Ease(frame,state.at,28));
  const appear=shot11Ease(frame,state.at,18);
  const disappear=1-shot11Ease(frame,Math.max(state.at+59,next-26),24);
  const text=shot11Ease(frame,state.at+19,15);
  return <div style={{position:'absolute',left:565,top:875,
    width:size.width,height:size.height,overflow:'hidden',
    padding:'0 19px',boxSizing:'border-box',
    display:'inline-flex',alignItems:'center',zIndex:25,
    border:'2px solid rgba(245,165,90,.92)',borderRadius:13,
    background:'linear-gradient(110deg,rgba(8,25,44,.97),rgba(6,19,36,.95))',
    boxShadow:'0 0 19px rgba(245,165,90,.19)',
    whiteSpace:'nowrap',fontFamily:AT_FONT,fontWeight:860,
    pointerEvents:'none',opacity:appear*disappear}}>
    <div style={{display:'inline-flex',alignItems:'center',gap:9,opacity:text,
      whiteSpace:'nowrap'}}>
      <span style={{color:AMBER,fontSize:22}}>{state.main}</span>
      <span style={{color:SOFT,fontSize:19}}>·</span>
      <span style={{color:WHITE,fontSize:19}}>{state.detail}</span>
    </div>
  </div>;
};

const OneDatabaseFocus:React.FC<{frame:number;cue:Shot11Positions}>=
  ({frame,cue})=>{
    const begin=shot11Ease(frame,cue.ONE_DB_QUESTION,72);
    const pulse=.52+.48*Math.sin(Math.max(0,frame-cue.ONE_DB_QUESTION)*.09)**2;
    const n=SHOT02_NODES.database;
    return <div style={{position:'absolute',zIndex:18,
      left:n.x-n.width/2-11,top:n.y-11,
      width:n.width+22,height:n.height+22,
      pointerEvents:'none',borderRadius:24,
      border:'3px solid '+MINT,
      boxShadow:'0 0 '+Math.round(30+17*pulse)+'px rgba(111,236,212,.33)',
      boxSizing:'border-box',opacity:begin*.83}}/>;
  };

const LastStory:React.FC<{frame:number;cue:Shot11Positions;
  duration:number}>=({frame,cue,duration})=>{
    const lesson=shot11Ease(frame,cue.LESSON,42);
    const finalQuestion=shot11Ease(frame,cue.ONE_DB_QUESTION,55);
    const left:PanelState[]=[
      {at:cue.NO_NEW_SERVERS,heading:'THREE AUTH SERVERS',
        primary:'NO EXTRA SERVERS',accent:CYAN},
      {at:cue.LIMIT_RETRIES,heading:'DUPLICATE RETRIES',
        primary:'LIMITED',accent:MINT},
      {at:cue.REJECT_EXCESS,heading:'EXCESS LOGIN ATTEMPTS',
        primary:'REJECTED EARLY',accent:AMBER},
      {at:cue.FAST_FAILURE,heading:'ONE USER',
        primary:'FAST FAILURE',accent:AMBER},
      {at:cue.LESSON,heading:'HEALTHY SERVERS',
        primary:'DO NOT GUARANTEE LOGIN',accent:CYAN},
    ];
    const right:PanelState[]=[
      {at:cue.NO_FASTER_DB,heading:'ONE SHARED DATABASE',
        primary:'SAME FINITE CAPACITY',accent:AMBER},
      {at:cue.CONCURRENT_LOOKUPS,heading:'CONCURRENT LOOKUPS',
        primary:'BOUNDED',accent:MINT},
      {at:cue.ON_TIME_LOGINS,heading:'ANOTHER USER',
        primary:'LOGIN FINISHES ON TIME',accent:MINT},
      {at:cue.LESSON,heading:'END-TO-END RELIABILITY',
        primary:'THE USER JOURNEY MATTERS',accent:MINT},
    ];
    const captions:CaptionState[]=[
      {at:cue.FULL_JOURNEY,main:'ONE LOGIN JOURNEY',
        detail:'PHONE → GATEWAY → AUTH → DATABASE'},
      {at:cue.THREE_AUTH,main:'SAME ARCHITECTURE',
        detail:'THREE AUTH · ONE SHARED DATABASE'},
      {at:cue.LIMIT_RETRIES,main:'STOP THE AMPLIFICATION',
        detail:'RETRIES AND LOOKUPS BOUNDED'},
      {at:cue.REJECT_EXCESS,main:'SOME LOGINS FAIL FAST',
        detail:'THE DATABASE STAYS FINITE'},
      {at:cue.QUEUE_SHRINK,main:'QUEUE GETS SHORTER',
        detail:'IF COMPLETIONS EXCEED ATTEMPTS'},
      {at:cue.FAST_FAILURE,main:'TWO DIFFERENT REQUESTS',
        detail:'ONE REJECTED · ONE COMPLETES'},
      {at:cue.HEALTHY_NOT_AVAILABLE,main:'HEALTHY ≠ AVAILABLE',
        detail:'THE FULL LOGIN MUST COMPLETE'},
      {at:cue.ONE_DB_QUESTION,main:'WHAT IF ONE DATABASE',
        detail:'IS NOT ENOUGH?'},
    ];
    const overlayOpacity=1-shot11Ease(frame,cue.ONE_DB_QUESTION,48);
    return <AbsoluteFill style={{zIndex:23,pointerEvents:'none'}}>
      <div style={{position:'absolute',left:560,top:78,
        fontFamily:AT_FONT,color:WHITE}}>
        <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em'}}>
          {lesson>.55?'HEALTHY ≠ AVAILABLE':'HEALTHY SERVERS, REAL USERS'}
        </div>
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <div style={{opacity:overlayOpacity}}>
        <ResponsiveCard frame={frame} left={560} states={left}/>
        <ResponsiveCard frame={frame} left={1090} states={right}/>
      </div>
      <ResponsiveCaption frame={frame} duration={duration} captions={captions}/>
      <div style={{position:'absolute',left:560,top:983,
        fontFamily:AT_FONT,fontSize:20,fontWeight:825,
        color:'#E7D8C6',letterSpacing:'.017em'}}>
        {finalQuestion>.5?'NEXT QUESTION: CAN ONE DATABASE BE ENOUGH?':
          lesson>.5?'RELIABILITY IS A SUCCESSFUL LOGIN — NOT JUST HEALTHY SERVERS':
          'ONE PHONE · ONE GATEWAY · ONE BALANCER · THREE AUTH · ONE DATABASE'}
      </div>
    </AbsoluteFill>;
};

export const Shot11DirectorVisualV1:React.FC<Shot11SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT11_REQUIRES_REAL_TAKE_1920X1080_30FPS');
  const {positions:cue}=validateShot11Source(props);
  assertShot11SafeLayout();
  const h=props.lockedShot10Handoff;
  const worldFrame=h.worldLastFrame+frame;
  const first=shot11Ease(frame,cue.FULL_JOURNEY,42);
  const lens=shot11Ease(frame,cue.ONE_DB_QUESTION,80);
  const loop=shot11Ease(frame,cue.REJECT_EXCESS,60);
  const recovery=shot11Ease(frame,cue.QUEUE_SHRINK,130);
  return <ATBackground>
    <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
      transformOrigin:'50% 50%'}}>
      <Shot07CleanArchitectureWorld
        frame={worldFrame} replicaGrowth={0}
        dbStress={.33-.10*recovery}
        cascadeStartFrame={h.cascadeStartFrame}
        criticalPulseStartFrame={h.criticalPulseStartFrame}
        recoveryLevel={1} showPhone={1} showPools={.25}
        initialPressure showLoginBadge={0}
        showRetryAttempts={0}
        flowRetryLevel={.16-.08*loop}
        flowJitterLevel={1-.25*recovery}
        admissionLevel={.5}
        breakerLevel={.18-.07*loop}
        probeLevel={1}/>
      <OneDatabaseFocus frame={frame} cue={cue}/>
    </AbsoluteFill>
    <LockedShot10LastFrame opacity={1-first}/>
    <AbsoluteFill style={{zIndex:25,pointerEvents:'none',
      opacity:first*(1-.0*lens)}}>
      <LastStory frame={frame} cue={cue} duration={props.durationInFrames}/>
    </AbsoluteFill>
  </ATBackground>;
};
