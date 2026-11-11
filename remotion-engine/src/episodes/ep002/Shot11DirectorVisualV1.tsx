import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {SHOT02_NODES} from './Shot02PremiumLayout';
import {shot10ContentCardSize,shot10DbMeterSize,shot10TweenSize}
  from '../../../shot10-content-fit-layout.mjs';
import {SHOT11_LARGE_AMBER_STORY,shot11LargeAmberSize,shot11LargeAmberIndex}
  from '../../../shot11-large-amber-story.mjs';
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

const LargeAmberStory:React.FC<{frame:number;cue:Shot11Positions}>=
  ({frame,cue})=>{
    const index=shot11LargeAmberIndex(frame,cue);
    if(index<0)return null;
    const story=SHOT11_LARGE_AMBER_STORY[index];
    const start=cue[story.cue];
    const target=shot11LargeAmberSize(story);
    const previous=index===0
      ?{width:Math.max(530,target.width-46),height:146}
      :shot11LargeAmberSize(SHOT11_LARGE_AMBER_STORY[index-1]);
    const size=shot10TweenSize(previous,target,shot11Ease(frame,start,34));
    const reveal=shot11Ease(frame,start+20,19);
    const appear=index===0?shot11Ease(frame,start,22):1;
    const nextStoryGlow=story.featured?shot11Ease(frame,cue.NEXT_STORY,30):0;
    return <div style={{position:'absolute',left:560,top:742,
      zIndex:25,pointerEvents:'none',
      width:size.width,height:size.height,
      padding:'24px 38px',overflow:'hidden',boxSizing:'border-box',
      fontFamily:AT_FONT,borderRadius:18,
      background:'linear-gradient(112deg,rgba(78,42,22,.97),rgba(31,25,25,.98))',
      border:'3px solid '+AMBER,
      boxShadow:'0 12px 45px rgba(0,0,0,.44),0 0 '+
        Math.round(22+nextStoryGlow*28)+'px rgba(245,165,90,.32)',
      opacity:appear,
      transform:'translateY('+Math.round((1-appear)*7)+'px)'}}>
      <div style={{opacity:reveal,whiteSpace:'nowrap'}}>
        <div style={{fontSize:target.headingFont,lineHeight:'37px',
          letterSpacing:'.01em',fontWeight:820,color:AMBER}}>
          {story.eyebrow}
        </div>
        <div style={{marginTop:15,fontSize:target.headlineFont,
          lineHeight:'51px',fontWeight:910,letterSpacing:'-.015em',
          color:WHITE}}>
          {story.headline}
        </div>
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
      border:'3px solid '+AMBER,
      boxShadow:'0 0 '+Math.round(30+17*pulse)+'px rgba(245,165,90,.33)',
      boxSizing:'border-box',opacity:begin*.83}}/>;
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
    <AbsoluteFill style={{zIndex:25,pointerEvents:'none',opacity:first}}>
      <LargeAmberStory frame={frame} cue={cue}/>
    </AbsoluteFill>
  </ATBackground>;
};
