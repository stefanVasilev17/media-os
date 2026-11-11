import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {shot09PolicyPanelSize,shot09AdmissionStatusSize}
  from '../../../shot09-adaptive-panel-layout.mjs';
import {shot10Ease,assertShot10SafeLayout,validateShot10Source,
  type Shot10SceneProps,type Shot10TermId} from './Shot10VisualContract';

const WHITE='#F5FCFF',SOFT='#B5D2E6',AMBER='#F5A55A',
  MINT='#6FECD4',CYAN='#68E5FF',RED='#F06F58';
const panel=(accent:string)=>({
  background:'linear-gradient(153deg,rgba(8,32,53,.965),rgba(5,19,37,.985))',
  border:'1.5px solid '+accent,borderRadius:15,
  boxShadow:'0 9px 34px rgba(0,0,0,.35),0 0 20px rgba(72,195,223,.09)',
  boxSizing:'border-box' as const,
});
const fadeAfter=(frame:number,cue:number,duration=26)=>
  shot10Ease(frame,cue,duration);
const min=(a:number,b:number)=>Math.min(a,b);

const DirectorLockedShot09Closing:React.FC<{opacity:number}>=({opacity})=>{
  const closingPanel=shot09PolicyPanelSize({
    heading:'CAPACITY DID NOT INCREASE',
    line:'SOME REJECTED · ACCEPTED WORK HAS A CHANCE',
  });
  const badge=shot09AdmissionStatusSize(1);
  return <AbsoluteFill style={{zIndex:25,pointerEvents:'none',opacity}}>
    <div style={{position:'absolute',left:560,top:78,fontFamily:AT_FONT,color:WHITE,zIndex:25}}>
      <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em'}}>
        PROTECT THE SHARED DATABASE
      </div>
      <div style={{marginTop:15,width:690,height:2,
        background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
    </div>
    <div style={{position:'absolute',left:560,top:695,width:448,height:148,
      padding:'15px 19px',zIndex:24,pointerEvents:'none',fontFamily:AT_FONT,...panel(AMBER)}}>
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
        color:MINT,fontWeight:860,fontSize:12}}>
        LIMIT: 450 TOTAL DB ATTEMPTS/S
      </div>
    </div>
    <div style={{position:'absolute',left:1090,top:695,
      width:closingPanel.width,height:closingPanel.height,
      padding:'14px 20px 12px',overflow:'hidden',
      zIndex:24,pointerEvents:'none',fontFamily:AT_FONT,...panel(MINT)}}>
      <div style={{color:WHITE,fontSize:20,fontWeight:890,
        whiteSpace:'nowrap'}}>CAPACITY DID NOT INCREASE</div>
      <div style={{height:2,width:'100%',marginTop:10,
        background:'linear-gradient(90deg,'+MINT+',transparent)'}}/>
      <div style={{color:SOFT,fontSize:15,fontWeight:790,
        marginTop:11,whiteSpace:'nowrap',letterSpacing:'-.015em'}}>
        SOME REJECTED · ACCEPTED WORK HAS A CHANCE
      </div>
    </div>
    <div style={{position:'absolute',left:1092,top:446,width:4,height:201,
      borderRadius:3,background:RED,boxShadow:'0 0 17px rgba(245,165,90,.23)'}}/>
    <div style={{position:'absolute',left:1101-badge.width/2,
      top:674-badge.height/2,width:badge.width,height:badge.height,
      display:'flex',justifyContent:'center',alignItems:'center',
      padding:'0 9px',boxSizing:'border-box',whiteSpace:'nowrap',
      color:RED,fontFamily:AT_FONT,fontWeight:880,fontSize:12,
      borderRadius:7,background:'rgba(8,26,45,.94)',
      border:'1px solid rgba(245,165,90,.64)'}}>PROBE ONLY</div>
    <div style={{position:'absolute',left:560,top:983,width:1220,
      height:54,fontFamily:AT_FONT,fontSize:20,fontWeight:825,
      color:'#E7D8C6',letterSpacing:'.017em'}}>
      SOME LOGINS FAIL FAST · ACCEPTED WORK MUST FIT THE SAME DATABASE LIMIT
    </div>
  </AbsoluteFill>;
};

type Phase='DRAIN'|'PROOF'|'PHONE'|'MEASURE'|'REJECT';
const phaseAt=(frame:number,cue:Record<Shot10TermId,number>):Phase=>
  frame>=cue.REJECTIONS?'REJECT':
  frame>=cue.EVIDENCE?'MEASURE':
  frame>=cue.OLD_TIMEOUT?'PHONE':
  frame>=cue.CONNECTIONS_RETURN?'PROOF':'DRAIN';

const RecoveryReadouts:React.FC<{frame:number;cue:Record<Shot10TermId,number>;
  phase:Phase}>=({frame,cue,phase})=>{
  const appear=fadeAfter(frame,cue.LOOK_DATABASE,32);
  const shrink=fadeAfter(frame,cue.QUEUE_SHRINK,96);
  const example=fadeAfter(frame,cue.DB_COMPLETIONS,28);
  const pool=fadeAfter(frame,cue.CONNECTIONS_RETURN,45);
  const old=fadeAfter(frame,cue.OLD_TIMEOUT,22);
  const fresh=fadeAfter(frame,cue.NEW_LOGIN,32);
  const evidence=fadeAfter(frame,cue.EVIDENCE,34);
  const tail=fadeAfter(frame,cue.REJECTIONS,30);
  const meter=.82-.58*shrink;
  const left=phase==='PHONE'?
    {heading:'OLD LOGIN · A',accent:RED,primary:'TIMED OUT · FINISHED',
      detail:'NEVER RESUMES OR CREATES A SESSION'}:
    phase==='MEASURE'?
    {heading:'REAL USER OUTCOMES',accent:CYAN,primary:'VALID LOGIN SUCCESS RATE',
      detail:'SYSTEM ERRORS ≠ WRONG PASSWORD'}:
    phase==='REJECT'?
    {heading:'COUNT ALL USER FAILURES',accent:AMBER,primary:'REJECTED LOGINS ARE FAILURES',
      detail:'FAST REJECTION IS NOT A SUCCESS'}:
    phase==='PROOF'?
    {heading:'AUTH POOLS · RECOVERING',accent:MINT,primary:'CONNECTIONS RETURN SOONER',
      detail:'ACCEPTED LOGINS FINISH BEFORE DEADLINES'}:
    {heading:'DATABASE QUEUE · DRAINING',accent:AMBER,primary:'COMPLETED > ADMITTED',
      detail:'ILLUSTRATIVE 500/s > 450/s · NOT LIVE'};
  const right=phase==='PHONE'?
    {heading:'NEW LOGIN · B',accent:MINT,primary:'DIFFERENT REQUEST · ACCEPTED',
      detail:'SUCCEEDS ONLY AFTER A NEW LOOKUP'}:
    phase==='MEASURE'?
    {heading:'TAIL LATENCY · TRACE',accent:CYAN,primary:'P95 / P99 · VALID LOGINS',
      detail:'TRACE: POOL WAIT → DATABASE WORK'}:
    phase==='REJECT'?
    {heading:'RECOVERY · VERIFIED',accent:MINT,primary:'SMALLER QUEUE · ON-TIME WORK',
      detail:'NO EXTRA DATABASE CAPACITY'}:
    phase==='PROOF'?
    {heading:'DATABASE · PRESSURE',accent:AMBER,primary:'RED → AMBER · WHEN MEASURED',
      detail:'THE SAME FINITE DATABASE'}:
    {heading:'ONE SHARED DB BUDGET',accent:CYAN,primary:'~500/s COMPLETED',
      detail:'450/s TOTAL ADMITTED · EXAMPLE'};
  const showNew=phase==='PHONE'?fresh:
    phase==='MEASURE'?evidence:phase==='REJECT'?tail:example;
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:24,opacity:appear}}>
    <div style={{position:'absolute',left:560,top:695,width:448,height:148,
      padding:'16px 19px',fontFamily:AT_FONT,...panel(left.accent)}}>
      <div style={{fontSize:17,fontWeight:870,color:WHITE}}>{left.heading}</div>
      <div style={{marginTop:17,fontSize:20,fontWeight:870,color:left.accent}}>
        {left.primary}
      </div>
      <div style={{marginTop:12,fontSize:13,fontWeight:800,color:SOFT}}>
        {left.detail}
      </div>
      <div style={{position:'absolute',bottom:8,right:12,fontSize:11,
        color:SOFT,fontWeight:780,opacity:phase==='DRAIN'?shrink:1}}>
        {phase==='DRAIN'?'QUEUE SHRINKS ONLY IF COMPLETIONS WIN':'REQUEST-LEVEL EVIDENCE'}
      </div>
    </div>
    <div style={{position:'absolute',left:1090,top:695,width:445,height:148,
      padding:'16px 18px',fontFamily:AT_FONT,opacity:showNew,...panel(right.accent)}}>
      <div style={{fontSize:17,fontWeight:870,color:WHITE}}>{right.heading}</div>
      <div style={{marginTop:17,fontSize:20,fontWeight:870,color:right.accent}}>
        {right.primary}
      </div>
      <div style={{marginTop:12,fontSize:13,fontWeight:800,color:SOFT}}>
        {right.detail}
      </div>
    </div>
    <div style={{position:'absolute',left:1573,top:685,width:256,height:143,
      padding:'15px 14px',zIndex:25,fontFamily:AT_FONT,...panel(AMBER)}}>
      <div style={{fontSize:16,fontWeight:900,color:WHITE}}>USER DATABASE</div>
      <div style={{height:8,marginTop:15,borderRadius:5,
        background:'rgba(237,103,82,.24)'}}>
        <div style={{height:8,borderRadius:5,width:(meter*100)+'%',
          background:shrink>.7?AMBER:RED,
          boxShadow:'0 0 11px rgba(242,105,76,.35)'}}/>
      </div>
      <div style={{fontSize:12,fontWeight:840,marginTop:11,color:pool>.7?MINT:AMBER}}>
        {shrink>.6?'BACKLOG · DECREASING':'BACKLOG · STILL HIGH'}
      </div>
      <div style={{fontSize:12,marginTop:7,fontWeight:840,color:AMBER}}>
        CAPACITY · UNCHANGED
      </div>
    </div>
  </AbsoluteFill>;
};

const VoiceMarkers:React.FC<{frame:number;cue:Record<Shot10TermId,number>;
  duration:number}>=({frame,cue,duration})=>{
  const entries=[
    {at:cue.QUEUE_SHRINK,main:'QUEUE DRAINS',detail:'ONLY WHEN COMPLETIONS EXCEED ADMISSIONS'},
    {at:cue.DB_COMPLETIONS,main:'~500/s FINISHED',detail:'450/s ADMITTED · ILLUSTRATIVE'},
    {at:cue.CONNECTIONS_RETURN,main:'POOL SLOTS RETURN',detail:'LESS WAIT FOR ACCEPTED LOGINS'},
    {at:cue.OLD_TIMEOUT,main:'OLD LOGIN · OVER',detail:'A TIMED-OUT REQUEST NEVER REVIVES'},
    {at:cue.NEW_LOGIN,main:'NEW LOGIN · B',detail:'A DIFFERENT ACCEPTED REQUEST MAY SUCCEED'},
    {at:cue.P95_P99,main:'P95 / P99',detail:'THE TAIL AN AVERAGE CAN HIDE'},
    {at:cue.TRACING,main:'DISTRIBUTED TRACE',detail:'POOL WAIT ≠ DATABASE EXECUTION'},
    {at:cue.REJECTIONS,main:'REJECTIONS COUNT',detail:'FAST FAILURES STILL AFFECT USERS'},
  ];
  const index=entries.reduce((last,e,i)=>frame>=e.at?i:last,-1);
  if(index<0)return null;
  const e=entries[index],next=index+1<entries.length?entries[index+1].at:duration;
  const fadeIn=shot10Ease(frame,e.at,19);
  const fadeOut=1-shot10Ease(frame,Math.max(e.at+54,next-28),25);
  return <div style={{position:'absolute',left:565,top:875,zIndex:26,
    width:'max-content',maxWidth:1060,height:69,
    padding:'0 19px',display:'inline-flex',alignItems:'center',
    boxSizing:'border-box',pointerEvents:'none',
    border:'2px solid rgba(245,165,90,.92)',borderRadius:13,
    background:'linear-gradient(110deg,rgba(8,25,44,.97),rgba(6,19,36,.95))',
    boxShadow:'0 0 19px rgba(245,165,90,.19)',
    fontSize:22,fontFamily:AT_FONT,fontWeight:860,whiteSpace:'nowrap',
    opacity:fadeIn*fadeOut,
    transform:'translateY('+((1-fadeIn)*6)+'px)'}}>
    <span style={{color:AMBER}}>{e.main}</span>
    <span style={{color:SOFT}}> · </span>
    <span style={{color:WHITE}}>{e.detail}</span>
  </div>;
};

export const Shot10DirectorVisualV1:React.FC<Shot10SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT10_REQUIRES_CURRENT_APPROVED_REAL_VOICE_FULL_HD_30FPS');
  const {positions:cue}=validateShot10Source(props);
  assertShot10SafeLayout();
  const handoff=props.lockedShot09Handoff;
  const worldFrame=handoff.worldLastFrame+frame;
  const recovery=shot10Ease(frame,cue.QUEUE_SHRINK,130);
  const measured=shot10Ease(frame,cue.MEASUREMENT,75);
  const evidence=shot10Ease(frame,cue.EVIDENCE,42);
  const takeover=shot10Ease(frame,cue.LOOK_DATABASE,40);
  const titleFade=shot10Ease(frame,cue.LOOK_DATABASE,48);
  const chapter=shot10Ease(frame,cue.RECOVERY,30);
  const phase=phaseAt(frame,cue);
  return <ATBackground>
    <AbsoluteFill style={{transform:'translate3d(-7px,0,0) scale(1.007)',
      transformOrigin:'50% 50%'}}>
      <Shot07CleanArchitectureWorld frame={worldFrame}
        replicaGrowth={0} dbStress={.82-.49*recovery*measured}
        cascadeStartFrame={handoff.cascadeStartFrame}
        criticalPulseStartFrame={handoff.criticalPulseStartFrame}
        recoveryLevel={1}
        showPhone={1} showPools={.25*shot10Ease(frame,cue.CONNECTIONS_RETURN,65)}
        initialPressure showLoginBadge={0}
        showRetryAttempts={0}
        flowRetryLevel={.16} flowJitterLevel={1}
        admissionLevel={.5}
        breakerLevel={1-.82*measured} probeLevel={1}/>
    </AbsoluteFill>
    <DirectorLockedShot09Closing opacity={1-takeover}/>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:22,opacity:titleFade}}>
      <div style={{position:'absolute',left:560,top:78,
        fontFamily:AT_FONT,color:WHITE,zIndex:26}}>
        <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em'}}>
          {chapter>.5?'RECOVERY IS A USER OUTCOME':'PROVE THE RECOVERY'}
        </div>
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <RecoveryReadouts frame={frame} cue={cue} phase={phase}/>
      <VoiceMarkers frame={frame} cue={cue} duration={props.durationInFrames}/>
      <div style={{position:'absolute',left:560,top:983,width:1220,height:54,
        fontFamily:AT_FONT,fontSize:20,fontWeight:825,
        color:'#E7D8C6',letterSpacing:'.017em'}}>
        {chapter>.5
          ?'COUNT REJECTIONS · MEASURE VALID LOGIN COMPLETION · CAPACITY IS STILL FINITE'
          :evidence>.5
            ?'SUCCESS RATE · SYSTEM ERRORS · P95 / P99 · TRACE THE USER JOURNEY'
            :'FEWER QUEUED LOOKUPS · ONLY ADMITTED NEW LOGINS CAN FINISH'}
      </div>
    </AbsoluteFill>
  </ATBackground>;
};
