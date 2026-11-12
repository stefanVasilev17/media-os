import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {shot09PolicyPanelSize,shot09AdmissionStatusSize}
  from '../../../shot09-adaptive-panel-layout.mjs';
import {shot10Ease,assertShot10SafeLayout,validateShot10Source,
  type Shot10SceneProps} from './Shot10VisualContract';

const WHITE='#F5FCFF',SOFT='#B5D2E6',AMBER='#F5A55A',
  MINT='#6FECD4',RED='#F06F58';
const panel=(accent:string)=>({
  background:'linear-gradient(153deg,rgba(8,32,53,.965),rgba(5,19,37,.985))',
  border:'1.5px solid '+accent,borderRadius:15,
  boxShadow:'0 9px 34px rgba(0,0,0,.35),0 0 20px rgba(72,195,223,.09)',
  boxSizing:'border-box' as const,
});
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
      <div style={{position:'absolute',left:560,top:983,width:1220,height:54,
        fontFamily:AT_FONT,fontSize:20,fontWeight:825,
        color:'#E7D8C6',letterSpacing:'.017em'}}>
        PROVE RECOVERY: COMPLETED NEW LOGINS · ERRORS · REJECTIONS · P95 / P99
      </div>
    </AbsoluteFill>
  </ATBackground>;
};
