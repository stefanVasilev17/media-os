import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {shot09PolicyPanelSize,shot09AdmissionStatusSize}
  from '../../../shot09-adaptive-panel-layout.mjs';
import {shot10ContentCardSize,shot10CaptionSize,shot10DbMeterSize,shot10TweenSize}
  from '../../../shot10-content-fit-layout.mjs';
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

const DirectorLockedShot09Closing:React.FC<{opacity:number;frame:number}>=({opacity,frame})=>{
  const smallCopyFade=1-shot10Ease(frame,0,12);
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
        color:MINT,fontWeight:860,fontSize:12,opacity:smallCopyFade}}> 
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


type CardCopy={at:number;heading:string;primary:string;accent:string};
const VoiceDrivenCard:React.FC<{frame:number;left:number;
  states:CardCopy[]}>=({frame,left,states})=>{
  const index=states.reduce((last,value,i)=>frame>=value.at?i:last,-1);
  if(index<0)return null;
  const current=states[index];
  const target=shot10ContentCardSize(current);
  const previous=index===0
    ?{width:Math.max(244,target.width-24),height:74}
    :shot10ContentCardSize(states[index-1]);
  const size=shot10TweenSize(previous,target,shot10Ease(frame,current.at,28));
  const reveal=shot10Ease(frame,current.at+7,20);
  const panelOpacity=shot10Ease(frame,current.at,19);
  return <div style={{position:'absolute',left,top:695,
    width:size.width,height:size.height,padding:'13px 20px',
    overflow:'hidden',pointerEvents:'none',zIndex:24,
    fontFamily:AT_FONT,opacity:panelOpacity,...panel(current.accent)}}>
    <div style={{opacity:reveal,whiteSpace:'nowrap'}}>
      <div style={{fontSize:18,lineHeight:'22px',fontWeight:870,color:WHITE}}>
        {current.heading}
      </div>
      <div style={{marginTop:9,fontSize:20,lineHeight:'25px',
        fontWeight:870,color:current.accent}}>
        {current.primary}
      </div>
    </div>
  </div>;
};

const RecoveryReadouts:React.FC<{frame:number;
  cue:Record<Shot10TermId,number>}>=({frame,cue})=>{
  const appear=fadeAfter(frame,cue.LOOK_DATABASE,30);
  const backlog=fadeAfter(frame,cue.QUEUE_SHRINK,96);
  const dbSize=shot10DbMeterSize();
  const left:CardCopy[]=[
    {at:cue.CONNECTIONS_RETURN,heading:'AUTH POOLS',
      primary:'CONNECTIONS RETURN',accent:MINT},
    {at:cue.OLD_TIMEOUT,heading:'OLD LOGIN · A',
      primary:'TIMED OUT · ENDED',accent:RED},
    {at:cue.EVIDENCE,heading:'VALID LOGIN OUTCOMES',
      primary:'SUCCESS ≠ SYSTEM ERROR',accent:CYAN},
    {at:cue.REJECTIONS,heading:'REJECTED LOGINS',
      primary:'FAILURES COUNT TOO',accent:AMBER},
  ];
  const right:CardCopy[]=[
    {at:cue.DB_COMPLETIONS,heading:'EXAMPLE · SHARED DB BUDGET',
      primary:'450/s IN · ~500/s OUT',accent:CYAN},
    {at:cue.MEASUREMENT,heading:'DATABASE PRESSURE',
      primary:'RED → AMBER · IF MEASURED',accent:AMBER},
    {at:cue.NEW_LOGIN,heading:'NEW LOGIN · B',
      primary:'NEW REQUEST · ACCEPTED',accent:MINT},
    {at:cue.EVIDENCE,heading:'LOGIN QUALITY',
      primary:'SUCCESS RATE · ERRORS',accent:CYAN},
    {at:cue.P95_P99,heading:'TAIL LATENCY',
      primary:'P95 / P99 · VALID LOGINS',accent:CYAN},
    {at:cue.TRACING,heading:'SINGLE REQUEST TRACE',
      primary:'POOL WAIT → DB WORK',accent:CYAN},
    {at:cue.REJECTIONS,heading:'RECOVERY CHECK',
      primary:'REJECTIONS ARE FAILURES',accent:AMBER},
    {at:cue.RECOVERY,heading:'RECOVERY MEASURED',
      primary:'ON-TIME WORK · SAME DB',accent:MINT},
  ];
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:24,opacity:appear}}>
    <VoiceDrivenCard frame={frame} left={560} states={left}/>
    <VoiceDrivenCard frame={frame} left={1090} states={right}/>
    <div style={{position:'absolute',left:1573,top:685,
      width:dbSize.width,height:dbSize.height,
      padding:'13px 15px',fontFamily:AT_FONT,zIndex:25,...panel(AMBER)}}>
      <div style={{fontSize:18,lineHeight:'23px',fontWeight:900,color:WHITE}}>
        USER DATABASE
      </div>
      <div style={{height:10,marginTop:11,borderRadius:5,
        background:'rgba(237,103,82,.24)',overflow:'hidden'}}>
        <div style={{height:10,borderRadius:5,
          width:((.82-.58*backlog)*100)+'%',background:backlog>.7?AMBER:RED,
          boxShadow:'0 0 11px rgba(242,105,76,.35)'}}/>
      </div>
    </div>
  </AbsoluteFill>;
};

const VoiceMarkers:React.FC<{frame:number;cue:Record<Shot10TermId,number>;
  duration:number}>=({frame,cue,duration})=>{
  const entries=[
    {at:cue.QUEUE_SHRINK,main:'QUEUE DRAINS',
      detail:'COMPLETIONS > ADMISSIONS'},
    {at:cue.DB_COMPLETIONS,main:'~500/s FINISHED',
      detail:'450/s ADMITTED · EXAMPLE'},
    {at:cue.CONNECTIONS_RETURN,main:'POOL SLOTS RETURN',
      detail:'ACCEPTED LOGINS WAIT LESS'},
    {at:cue.OLD_TIMEOUT,main:'OLD LOGIN · OVER',
      detail:'TIMED-OUT REQUEST NEVER REVIVES'},
    {at:cue.NEW_LOGIN,main:'NEW LOGIN · B',
      detail:'DIFFERENT ACCEPTED REQUEST'},
    {at:cue.P95_P99,main:'P95 / P99',
      detail:'TAIL LATENCY, NOT THE AVERAGE'},
    {at:cue.TRACING,main:'DISTRIBUTED TRACE',
      detail:'POOL WAIT ≠ DB EXECUTION'},
    {at:cue.REJECTIONS,main:'REJECTIONS COUNT',
      detail:'FAST FAILURE IS STILL FAILURE'},
  ];
  const index=entries.reduce((last,e,i)=>frame>=e.at?i:last,-1);
  if(index<0)return null;
  const entry=entries[index],next=index+1<entries.length
    ?entries[index+1].at:duration;
  const target=shot10CaptionSize(entry);
  const previous=index===0
    ?{width:Math.max(265,target.width-36),height:48}
    :shot10CaptionSize(entries[index-1]);
  const size=shot10TweenSize(previous,target,shot10Ease(frame,entry.at,26));
  const contentOpacity=shot10Ease(frame,entry.at+7,18);
  const fadeIn=shot10Ease(frame,entry.at,19);
  const fadeOut=1-shot10Ease(frame,Math.max(entry.at+54,next-28),25);
  return <div style={{position:'absolute',left:565,top:875,zIndex:26,
    width:size.width,height:size.height,
    padding:'0 19px',display:'inline-flex',alignItems:'center',
    boxSizing:'border-box',pointerEvents:'none',overflow:'hidden',
    border:'2px solid rgba(245,165,90,.92)',borderRadius:13,
    background:'linear-gradient(110deg,rgba(8,25,44,.97),rgba(6,19,36,.95))',
    boxShadow:'0 0 19px rgba(245,165,90,.19)',
    fontFamily:AT_FONT,fontWeight:860,whiteSpace:'nowrap',
    opacity:fadeIn*fadeOut,
    transform:'translateY('+((1-fadeIn)*6)+'px)'}}>
    <div style={{display:'inline-flex',alignItems:'center',gap:9,
      opacity:contentOpacity,whiteSpace:'nowrap'}}>
      <span style={{color:AMBER,fontSize:22}}>{entry.main}</span>
      <span style={{color:SOFT,fontSize:19}}>·</span>
      <span style={{color:WHITE,fontSize:19}}>{entry.detail}</span>
    </div>
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
    <DirectorLockedShot09Closing opacity={1-takeover} frame={frame}/>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:22,opacity:titleFade}}>
      <div style={{position:'absolute',left:560,top:78,
        fontFamily:AT_FONT,color:WHITE,zIndex:26}}>
        <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em'}}>
          {chapter>.5?'RECOVERY IS A USER OUTCOME':'PROVE THE RECOVERY'}
        </div>
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <RecoveryReadouts frame={frame} cue={cue}/>
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
