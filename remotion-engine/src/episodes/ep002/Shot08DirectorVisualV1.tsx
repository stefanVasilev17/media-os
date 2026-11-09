import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot07CleanArchitectureWorld} from './Shot07CleanArchitectureWorld';
import {shot08Ease,assertShot08SafeLayout,validateShot08Source,
  type Shot08SceneProps,type Shot08TermId} from './Shot08VisualContract';

const WHITE='#F5FCFF',ORANGE='#F5A55A';
const orangeText=(title:string)=>({
  fontSize:25,fontWeight:880,color:ORANGE,
  letterSpacing:'.028em',textShadow:'0 0 23px rgba(246,154,77,.26)',
  fontFamily:AT_FONT,
});
const Captions:React.FC<{frame:number;cue:Record<Shot08TermId,number>;
  duration:number}>=({frame,cue,duration})=>{
  const cards=[
    {at:cue.HORIZONTAL_SCALING,text:'HORIZONTAL SCALING · MORE AUTH INSTANCES'},
    {at:cue.THREE_TO_SIX,text:'THREE AUTH INSTANCES → SIX'},
    {at:cue.EIGHT_CONNECTIONS,text:'EACH INSTANCE · UP TO 8 DATABASE CONNECTIONS'},
    {at:cue.FOLLOW_CONNECTIONS,text:'WHERE DO ALL THOSE CONNECTIONS LEAD?'},
    {at:cue.SAME_USER_DATABASE,text:'SIX AUTH INSTANCES · ONE USER DATABASE'},
    {at:cue.DB_NOT_FASTER,text:'MORE AUTH SERVERS ≠ FASTER DATABASE'},
    {at:cue.SHARED_BOTTLENECK,text:'SHARED BOTTLENECK · ONE LIMITED RESOURCE'},
    {at:cue.BRIDGE_ANALOGY,text:'WIDER ROAD · SAME ONE-LANE BRIDGE'},
    {at:cue.APP_NOT_LIMIT,text:'SCALING HELPS ONLY WHEN AUTH IS THE LIMIT'},
    {at:cue.SCALED_NOT_BOTTLENECK,text:'WE SCALED AUTH · NOT THE BOTTLENECK'},
  ];
  let active=-1;
  for(let i=0;i<cards.length;i++)if(frame>=cards[i].at)active=i;
  if(active<0)return null;
  const chosen=cards[active],next=active+1<cards.length
    ?cards[active+1].at:duration;
  const enter=shot08Ease(frame,chosen.at,24);
  const exit=1-shot08Ease(frame,Math.min(next-27,duration-55),24);
  return <div style={{position:'absolute',left:560,top:851,width:1220,
    height:92,pointerEvents:'none',zIndex:25,
    opacity:enter*exit,transform:'translateY('+((1-enter)*8)+'px)',
    ...orangeText(chosen.text)}}>
      {chosen.text}
  </div>;
};
export const Shot08DirectorVisualV1:React.FC<Shot08SceneProps>=(props)=>{
  const frame=useCurrentFrame(),config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
    ||config.durationInFrames!==props.durationInFrames)
    throw Error('SHOT08_REQUIRES_REAL_1080P_30FPS_SELECTED_TAKE');
  const {positions:cue}=validateShot08Source(props);
  assertShot08SafeLayout();
  const titleFade=shot08Ease(frame,26,92);
  const replicaGrowth=shot08Ease(frame,cue.THREE_TO_SIX,135);
  const showPools=shot08Ease(frame,cue.EIGHT_CONNECTIONS,56);
  const attention=shot08Ease(frame,cue.SAME_USER_DATABASE,31);
  const conclusion=shot08Ease(frame,cue.SCALED_NOT_BOTTLENECK,28);
  return <ATBackground>
    <Shot07CleanArchitectureWorld
      frame={frame} replicaGrowth={replicaGrowth}
      dbStress={.87+.13*attention}
      cascadeStartFrame={-1}
      showPhone={1} showPools={showPools}
      showLoginBadge={1-shot08Ease(frame,22,63)}
      showRetryAttempts={1}/>
    <AbsoluteFill style={{pointerEvents:'none'}}>
      <div style={{position:'absolute',left:80,top:76,zIndex:27,
        width:1120,height:123,fontFamily:AT_FONT}}>
        <div style={{position:'absolute',left:0,top:0,
          fontSize:39,fontWeight:880,color:WHITE,
          opacity:1-titleFade}}>
          WHEN RETRYING CREATES MORE FAILURE
        </div>
        <div style={{position:'absolute',left:0,top:0,
          fontSize:39,fontWeight:900,color:WHITE,
          opacity:titleFade}}>
          MORE SERVERS, SAME BOTTLENECK
        </div>
        <div style={{position:'absolute',left:0,top:68,height:2,width:690,
          background:'linear-gradient(90deg,#6FECD4,transparent)',
          opacity:.8}}/>
      </div>
      <Captions frame={frame} cue={cue} duration={props.durationInFrames}/>
      {conclusion>.03&&<div style={{position:'absolute',
        left:560,top:960,width:1200,height:54,zIndex:25,
        fontFamily:AT_FONT,fontSize:21,fontWeight:780,
        color:'#F8DDBB',opacity:conclusion}}>
        SIX AUTH REPLICAS CAN SHARE WORK · THEY CANNOT INCREASE DATABASE CAPACITY
      </div>}
    </AbsoluteFill>
  </ATBackground>;
};
