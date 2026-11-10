import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {SHOT02_NODES} from './Shot02PremiumLayout';
import {shot08Ease,assertShot08SafeLayout,validateShot08Source,
  type Shot08SceneProps,type Shot08TermId} from './Shot08VisualContract';

const WHITE='#F5FCFF',SOFT='#B5D2E6',ORANGE='#F5A55A';
const MINT='#6FECD4',CYAN='#68E5FF',RED='#F06F58';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const shell=(accent:string)=>({
  background:'linear-gradient(153deg,rgba(8,32,53,.965),rgba(5,19,37,.985))',
  border:'1.5px solid '+accent,
  borderRadius:15,
  boxShadow:'0 9px 34px rgba(0,0,0,.35),0 0 20px rgba(72,195,223,.09)',
  boxSizing:'border-box' as const,
});

const OrangeCue:React.FC<{frame:number;cue:Record<Shot08TermId,number>;
  duration:number}>=({frame,cue,duration})=>{
  const events=[
    {at:cue.AFTER_STORM,label:'THE RETRY STORM',detail:'THE SHARED DATABASE IS STILL OVERLOADED'},
    {at:cue.DEADLINE_CHECK,label:'CHECK THE LOGIN DEADLINE',detail:'STOP WHEN THERE IS NO USEFUL TIME'},
    {at:cue.SHARED_BUDGET,label:'ONE SHARED RETRY BUDGET',detail:'ONLY SAFE READ-ONLY LOOKUP RETRIES'},
    {at:cue.JITTER,label:'BACKOFF + JITTER',detail:'AUTH RETRIES DO NOT ARRIVE TOGETHER'},
    {at:cue.FEWER_ATTEMPTS,label:'FEWER DUPLICATE DATABASE LOOKUPS',detail:'LESS SELF-INFLICTED WORK'},
  ];
  const index=events.reduce((last,event,i)=>frame>=event.at?i:last,-1);
  if(index<0)return null;
  const event=events[index],next=index+1<events.length?events[index+1].at:duration;
  const enter=shot08Ease(frame,event.at,27);
  const leave=1-shot08Ease(frame,Math.max(event.at+100,next-36),32);
  return <div style={{
    position:'absolute',left:565,top:875,
    width:'max-content',maxWidth:1060,height:69,
    zIndex:26,pointerEvents:'none',fontFamily:AT_FONT,
    display:'inline-flex',alignItems:'center',whiteSpace:'nowrap',
    padding:'0 19px',boxSizing:'border-box',
    border:'2px solid rgba(245,165,90,.92)',borderRadius:13,
    background:'linear-gradient(110deg,rgba(8,25,44,.97),rgba(6,19,36,.95))',
    boxShadow:'0 0 19px rgba(245,165,90,.19),inset 0 0 0 1px rgba(245,165,90,.10)',
    fontSize:24,fontWeight:860,letterSpacing:'.012em',
    textShadow:'0 0 18px rgba(245,165,90,.26)',
    opacity:enter*leave,transform:'translateY('+((1-enter)*6)+'px)',
  }}>
    <span style={{color:ORANGE}}>{event.label}</span>
    <span style={{color:'#C4D7E4'}}> · </span>
    <span style={{color:'#F5F8ED'}}>{event.detail}</span>
  </div>;
};

const BudgetMeter:React.FC<{frame:number;cue:Record<Shot08TermId,number>}>=({frame,cue})=>{
  const progress=clamp((frame-cue.SHARED_BUDGET)/Math.max(35,cue.BUDGET_EXHAUSTED-cue.SHARED_BUDGET));
  const exhausted=frame>=cue.BUDGET_EXHAUSTED;
  const reveal=shot08Ease(frame,cue.SHARED_BUDGET,22)*
    (1-shot08Ease(frame,cue.EXP_BACKOFF,24));
  return <div style={{position:'absolute',left:1120,top:686,width:416,
    height:142,padding:'15px 17px',zIndex:24,fontFamily:AT_FONT,
    opacity:reveal,pointerEvents:'none',...shell(exhausted?ORANGE:CYAN)}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
      <span style={{fontSize:17,fontWeight:880,color:WHITE}}>SHARED RETRY BUDGET</span>
      <span style={{fontSize:13,fontWeight:840,color:exhausted?ORANGE:MINT}}>
        {exhausted?'LIMIT REACHED':'GUARDED'}</span>
    </div>
    <div style={{display:'flex',gap:5,marginTop:18}}>
      {Array.from({length:9},(_,i)=>{
        const filled=(i+1)/9<=progress;
        return <div key={i} style={{flex:1,height:17,borderRadius:5,
          background:filled?ORANGE:'rgba(53,133,153,.28)',
          border:'1px solid '+(filled?'#FFD29B':'#346A7D'),
          boxShadow:filled?'0 0 9px rgba(245,165,90,.37)':'none'}}/>;
      })}
    </div>
    <div style={{fontSize:13,marginTop:17,color:SOFT,fontWeight:790}}>
      ONE BUDGET · SAFE READ-ONLY LOOKUP RETRIES ONLY
    </div>
  </div>;
};

const BackoffMeter:React.FC<{frame:number;cue:Record<Shot08TermId,number>}>=({frame,cue})=>{
  const show=shot08Ease(frame,cue.EXP_BACKOFF,23)*
    (1-shot08Ease(frame,cue.WATCH_DB,22));
  const jitter=shot08Ease(frame,cue.JITTER,20);
  const duration=Math.max(1,cue.WATCH_DB-cue.EXP_BACKOFF);
  const t=clamp((frame-cue.EXP_BACKOFF)/duration);
  return <div style={{position:'absolute',left:1120,top:686,
    width:416,height:142,zIndex:25,fontFamily:AT_FONT,
    padding:'12px 16px',pointerEvents:'none',opacity:show,
    ...shell('#68E5FF')}} >
    <div style={{color:WHITE,fontSize:16,fontWeight:875,marginBottom:12}}>
      BACKOFF <span style={{color:ORANGE}}>+ JITTER</span>
    </div>
    {['AUTH 01','AUTH 02','AUTH 03'].map((name,i)=>{
      const delay=14+i*9+24*Math.pow(t,2);
      const shifted=jitter*(i===0?0:i===1?12:23);
      return <div key={name} style={{display:'flex',alignItems:'center',
        gap:8,height:27,fontSize:12,color:SOFT,fontWeight:840}}>
        <span style={{width:57}}>{name}</span>
        <div style={{height:8,width:282,position:'relative',
          borderRadius:6,background:'rgba(72,126,160,.22)'}}>
          <div style={{position:'absolute',left:shifted+12,
            width:Math.min(210,delay*2.6),height:8,
            borderRadius:6,background:i===0?CYAN:i===1?MINT:ORANGE,
            boxShadow:'0 0 10px rgba(92,230,218,.23)'}}/>
        </div>
      </div>;
    })}
  </div>;
};

const DBReadout:React.FC<{frame:number;cue:Record<Shot08TermId,number>}>=({frame,cue})=>{
  const show=shot08Ease(frame,cue.WATCH_DB,27);
  const reduce=shot08Ease(frame,cue.FEWER_ATTEMPTS,47);
  const hold=shot08Ease(frame,cue.CAPACITY_UNCHANGED,28);
  return <div style={{position:'absolute',left:1573,top:685,width:256,
    height:143,padding:'15px 14px',zIndex:25,pointerEvents:'none',
    opacity:show,fontFamily:AT_FONT,...shell(ORANGE)}}>
    <div style={{fontSize:16,fontWeight:900,color:WHITE}}>USER DATABASE</div>
    <div style={{height:8,marginTop:15,borderRadius:5,
      background:'rgba(237,103,82,.24)'}}>
      <div style={{height:8,borderRadius:5,
        width:(100-45*reduce)+'%',background:RED,
        boxShadow:'0 0 11px rgba(242,105,76,.45)'}}/>
    </div>
    <div style={{fontSize:12,fontWeight:840,marginTop:11,
      color:reduce>.5?MINT:ORANGE}}>
      {reduce>.5?'FEWER DUPLICATE ATTEMPTS':'DUPLICATE WORK HIGH'}
    </div>
    <div style={{fontSize:12,marginTop:7,fontWeight:840,
      color:hold>.4?ORANGE:SOFT}}>
      CAPACITY · UNCHANGED
    </div>
  </div>;
};

const AuthFocus:React.FC<{frame:number;cue:Record<Shot08TermId,number>}>=({frame,cue})=>{
  const focus=shot08Ease(frame,cue.AUTH01,22)*
    (1-shot08Ease(frame,cue.SHARED_BUDGET,23));
  const stop=shot08Ease(frame,cue.STOP_EXPIRED,19);
  const all=shot08Ease(frame,cue.THREE_AUTH,20)*
    (1-shot08Ease(frame,cue.AUTH01,20));
  const stagger=shot08Ease(frame,cue.JITTER,20)*
    (1-shot08Ease(frame,cue.WATCH_DB,24));
  const card=SHOT02_NODES.auth;
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:20}}>
    {[0,1,2].map(i=>{
      const glow=all*(.44+.56*Math.sin(Math.max(0,frame-cue.THREE_AUTH)*.10-i*1.25)**2)
        +focus*(i===0?1:.08)+stagger*(.48+.52*Math.sin(frame*.075-i*1.6)**2);
      return <div key={i} style={{
        position:'absolute',left:card.x-card.width/2+35,top:card.y+69+i*87,
        width:278,height:82,borderRadius:12,
        border:'2px solid '+(focus>.4&&i===0?ORANGE:CYAN),
        boxShadow:'0 0 '+(8+18*glow)+'px rgba(90,217,252,'+(glow*.34)+')',
        opacity:clamp(glow*.86),
      }}/>;
    })}
    {focus>.04&&<div style={{position:'absolute',left:1157,top:216,
      width:338,height:73,zIndex:25,opacity:focus,fontFamily:AT_FONT,
      padding:'10px 14px',...shell(stop>.5?ORANGE:CYAN)}}>
      <div style={{fontSize:17,fontWeight:880,color:WHITE}}>AUTH 01 · DEADLINE CHECK</div>
      <div style={{fontSize:14,marginTop:9,color:stop>.5?ORANGE:SOFT,fontWeight:820}}>
        {stop>.5?'NO TIME LEFT · STOP':'LOOKUP TIMED OUT · VERIFY TIME LEFT'}
      </div>
    </div>}
  </AbsoluteFill>;
};

export const Shot08DirectorVisualV1:React.FC<Shot08SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT08_REQUIRES_REAL_1080P_30FPS_SELECTED_TAKE');
  const {positions:cue}=validateShot08Source(props);
  assertShot08SafeLayout();
  const handoff=props.lockedShot07Handoff;
  const worldFrame=handoff.lastFrame+frame;
  const titleChange=shot08Ease(frame,Math.max(36,cue.CONTROL_FIRST-24),65);
  const stressReduction=shot08Ease(frame,cue.FEWER_ATTEMPTS,100);
  const gentlePush=shot08Ease(frame,cue.WATCH_DB,130);
  const showBadge=1-shot08Ease(frame,cue.AUTH01,32);
  const endMessage=shot08Ease(frame,cue.STORM_CONTAINED,34);
  const boundedRetries=1-.84*shot08Ease(frame,cue.BUDGET_EXHAUSTED,120);
  const staggered=shot08Ease(frame,cue.JITTER,75);
  return <ATBackground>
    <AbsoluteFill style={{transform:'translate3d('+(-7*gentlePush)+'px,0,0) scale('+
      (1+.007*gentlePush)+')',transformOrigin:'50% 50%'}}>
      <Shot07CleanArchitectureWorld frame={worldFrame}
        replicaGrowth={0} dbStress={1-.18*stressReduction}
        cascadeStartFrame={handoff.cascadeStartFrame}
        criticalPulseStartFrame={handoff.criticalPulseStartFrame}
        recoveryLevel={stressReduction}
        showPhone={1} showPools={0}
        initialPressure showLoginBadge={showBadge}
        showRetryAttempts={showBadge}
        flowRetryLevel={boundedRetries}
        flowJitterLevel={staggered}/>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:22}}>
      <div style={{position:'absolute',left:560,top:78,
        fontFamily:AT_FONT,color:WHITE,zIndex:25}}>
        <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em',
          opacity:1-titleChange}}>WHEN RETRYING CREATES MORE FAILURE</div>
        <div style={{position:'absolute',left:0,top:0,
          fontSize:39,fontWeight:890,letterSpacing:'-.02em',
          opacity:titleChange}}>STOP THE RETRY STORM</div>
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <AuthFocus frame={frame} cue={cue}/>
      <BudgetMeter frame={frame} cue={cue}/>
      <BackoffMeter frame={frame} cue={cue}/>
      <DBReadout frame={frame} cue={cue}/>
      <OrangeCue frame={frame} cue={cue} duration={props.durationInFrames}/>
      <div style={{position:'absolute',left:560,top:983,width:1220,
        height:54,fontFamily:AT_FONT,fontSize:20,fontWeight:825,
        color:'#E7D8C6',opacity:endMessage,letterSpacing:'.017em'}}>
        RETRIES ARE BOUNDED · THE SHARED DATABASE STILL HAS FINITE CAPACITY
      </div>
    </AbsoluteFill>
  </ATBackground>;
};
