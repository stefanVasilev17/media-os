import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {Shot06LockedSlot,SHOT06_LOCKED_PANEL} from './Shot06Shot05LockedEnd';
import {shot04StatusPalette} from './Shot04VisualContract';

import {assertShot07SafeLayout,shot07Ease,validateShot07Source,
  type Shot07SceneProps,type Shot07TermId} from './Shot07VisualContract';

const WHITE='#F5FCFF';
const MINT=shot04StatusPalette.healthy,AMBER=shot04StatusPalette.waiting;
const RED='#F06F58';
const panel=(accent:string)=>({
  border:'2px solid '+accent,borderRadius:16,
  background:'linear-gradient(150deg,rgba(11,29,53,.98),rgba(4,14,31,.99))',
  boxShadow:'0 8px 33px rgba(0,0,0,.43),0 0 23px rgba(55,149,215,.14)',
  boxSizing:'border-box' as const,
});

const FrozenShot06End:React.FC<{frame:number;fade:number}>=({frame,fade})=>
  <AbsoluteFill style={{opacity:1-fade,pointerEvents:'none'}}>
    <div style={{position:'absolute',left:271,top:106,fontFamily:AT_FONT,
      color:WHITE,fontWeight:890,fontSize:38}}>THE DEADLINE EXPIRES</div>
    <div style={{position:'absolute',left:280,top:218,width:1240,height:535,
      ...SHOT06_LOCKED_PANEL('#9184FF','rgba(125,111,255,.29)'),
      padding:'22px 27px 26px',fontFamily:AT_FONT,
      background:'linear-gradient(150deg,rgba(11,22,50,.99),rgba(4,13,34,.998))'}}>
      <div style={{display:'flex',justifyContent:'space-between',
        alignItems:'center',height:58}}>
        <b style={{fontSize:30,color:WHITE}}>Database Connection Pool</b>
        <span style={{fontSize:23,color:WHITE,fontWeight:880}}>8 SLOTS</span>
      </div>
      <div style={{borderTop:'1px solid #35516F',margin:'16px 0 21px'}}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',
        gap:'16px 18px'}}>
        {Array.from({length:8},(_,index)=>
          <Shot06LockedSlot key={index} index={index} frame={2779+2095+frame} fill={1}/>)}
      </div>
      <div style={{marginTop:22,display:'flex',alignItems:'center',
        justifyContent:'space-between',color:'#FFBCA9',fontSize:18,fontWeight:830}}>
        <span>REQUEST A · TIMED OUT</span>
        <span>EXPIRED</span>
        <span>8/8 BUSY</span>
      </div>
      <div style={{position:'absolute',bottom:21,left:30,right:30,
        height:63,display:'flex',justifyContent:'space-between',
        alignItems:'center',gap:14,padding:'8px 13px',fontSize:15,
        fontWeight:840,border:'1px solid #567D85',borderRadius:10,
        background:'linear-gradient(90deg,rgba(10,43,44,.98),rgba(49,35,43,.97))'}}>
        <span style={{color:MINT}}>IF CANCELLATION HONORED → SLOT FREED SOONER</span>
        <span style={{color:AMBER}}>OTHERWISE → LOOKUP MAY CONTINUE</span>
      </div>
    </div>
    <div style={{position:'absolute',left:1550,top:476,width:302,height:92,
      ...panel(MINT),display:'flex',alignItems:'center',gap:10,
      color:'#B9EEEA',fontFamily:AT_FONT,fontSize:16,fontWeight:850,padding:15}}>
      REQUEST B · DB LOOKUP MAY STILL RUN
    </div>
    <div style={{position:'absolute',left:282,top:795,width:1236,height:96,
      display:'flex',alignItems:'center',gap:17,fontFamily:AT_FONT,color:WHITE}}>
      <b style={{width:225,fontSize:16}}>REQUEST QUEUE</b>
      <div style={{...panel(AMBER),flex:1,padding:19,color:'#FFBCAD',
        fontSize:18,fontWeight:850}}>REQUEST A · TIMED OUT
        <span style={{float:'right',fontSize:15}}>NO DB LOOKUP STARTED</span></div>
      <b style={{width:60,color:AMBER}}>7 WAIT</b>
    </div>
    <div style={{position:'absolute',left:282,top:910,width:1236,height:100,
      fontFamily:AT_FONT,display:'flex',flexDirection:'column',gap:9,
      fontSize:16,color:WHITE}}>
      <div style={{padding:'12px 17px',borderLeft:'3px solid '+RED,
        background:'rgba(8,32,53,.96)'}}>REQUEST TIMEOUT · The caller stops waiting; its database lookup never started.</div>
      <div style={{padding:'12px 17px',borderLeft:'3px solid '+MINT,
        background:'rgba(8,32,53,.96)'}}>REQUEST B · Cancellation may free a connection early, if honored.</div>
    </div>
    <AbsoluteFill style={{zIndex:28,transform:'translate3d(1320px,590px,0) scale(.35)',
      transformOrigin:'top left',pointerEvents:'none'}}>
      <Shot02PressurePhone frame={2779+2095+frame} reveal={1}
        credential={.22} ui={0} emailValue="user@example.com"
        passwordDots="••••••••" emailFocus={0} passwordFocus={0} localUi={0}
        press={0} pressStartFrame={Number.POSITIVE_INFINITY}
        waiting={0} spinner={0} pressure={.70} realism={1} heroPush={0}/>
      <div style={{position:'absolute',left:735,top:690,width:447,height:75,
        ...panel(RED),display:'flex',alignItems:'center',justifyContent:'center',
        color:'#FFE5E0',fontFamily:AT_FONT,fontSize:33,fontWeight:850}}>
        Please try again.
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;

const OrangeCue:React.FC<{frame:number;cue:Record<Shot07TermId,number>;
  duration:number}>=({frame,cue,duration})=>{
  const messages=[
    {at:cue.RETRY_MECHANISM,text:'RETRY MECHANISM · A SECOND READ-ONLY LOOKUP'},
    {at:cue.RETRY_AMPLIFICATION,text:'RETRY AMPLIFICATION · EXTRA DATABASE WORK'},
    {at:cue.RETRY_STORM,text:'RETRY STORM · PRESSURE IS MULTIPLYING'},
    {at:cue.CASCADING_FAILURE,text:'CASCADING FAILURE · DATABASE → AUTH WAITING'},
    {at:cue.READ_ONLY_LOOKUP,text:'ONLY THE ACCOUNT LOOKUP IS RETRIED'},
  ];
  const index=messages.reduce((a,b,i)=>frame>=b.at?i:a,-1);
  if(index<0)return null;
  const chosen=messages[index];
  const nextAt=index<messages.length-1?messages[index+1].at:duration;
  const inMotion=shot07Ease(frame,chosen.at,22);
  const outMotion=1-shot07Ease(frame,Math.min(nextAt-26,duration-54),23);
  return <div style={{position:'absolute',left:565,top:875,
    width:1060,height:69,zIndex:23,pointerEvents:'none',
    display:'flex',alignItems:'center',padding:'0 23px',boxSizing:'border-box',
    border:'2px solid rgba(245,165,90,.92)',borderRadius:13,
    background:'linear-gradient(110deg,rgba(8,25,44,.97),rgba(6,19,36,.95))',
    boxShadow:'0 0 19px rgba(245,165,90,.19),inset 0 0 0 1px rgba(245,165,90,.10)',
    fontFamily:AT_FONT,fontSize:25,fontWeight:860,letterSpacing:'.025em',
    color:AMBER,textShadow:'0 0 18px rgba(245,165,90,.26)',
    opacity:inMotion*outMotion,
    transform:'translateY('+((1-inMotion)*9)+'px)'}}>
    {chosen.text}
  </div>;
};

export const Shot07DirectorVisualV1:React.FC<Shot07SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT07_REQUIRES_REAL_1080P_30FPS_SELECTED_TAKE');
  const {positions:cue}=validateShot07Source(props);
  assertShot07SafeLayout();
  const transition=shot07Ease(frame,36,102);
  const reveal=shot07Ease(frame,75,92);
  return <ATBackground>
    <FrozenShot06End frame={frame} fade={transition}/>
    <AbsoluteFill style={{opacity:transition,pointerEvents:'none'}}>
      <Shot07CleanArchitectureWorld frame={frame}
        replicaGrowth={0} dbStress={1}
        cascadeStartFrame={cue.CASCADING_FAILURE}
        showPhone={1} showPools={0} initialPressure
        showLoginBadge={shot07Ease(frame,cue.ACCOUNT_LOOKUP,30)}
        showRetryAttempts={shot07Ease(frame,cue.AUTH_RETRY,27)}/>
      <div style={{position:'absolute',left:560,top:78,
        fontFamily:AT_FONT,color:WHITE,zIndex:23,opacity:reveal}}>
        <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em'}}>
          WHEN RETRYING CREATES MORE FAILURE
        </div>
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <OrangeCue frame={frame} cue={cue} duration={props.durationInFrames}/>
    </AbsoluteFill>
  </ATBackground>;
};
