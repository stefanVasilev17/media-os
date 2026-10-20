import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';
import {LoadBalancerCenter,ModeNavigation} from './LoadBalancerCleanDirectorVisual';

type Props={durationInFrames:number;anchors?:Record<string,number>;clipStarts?:number[]};
const FPS=30;
const DEFAULT_SECONDS=[0,22,42,65,92,126,151];
const ease=(frame:number,start:number,end:number)=>interpolate(
  frame,[start,Math.max(start+1,end)],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const clamp=(v:number)=>Math.max(0,Math.min(1,v));

export const LoadBalancerYoutubePreview:React.FC<Props>=({
  durationInFrames,anchors={},clipStarts=[]
})=>{
  const frame=useCurrentFrame();
  const total=Math.max(1,durationInFrames);
  const starts=DEFAULT_SECONDS.map((second,index)=>{
    const value=clipStarts[index];
    return Number.isFinite(value)?Math.max(0,Math.min(total-1,value)):
      Math.max(0,Math.min(total-1,second*FPS));
  });
  const phase=starts.reduce((selected,start,index)=>frame>=start?index:selected,0);
  const selected=Math.min(5,phase);
  const previous=Math.max(0,selected-1);
  const local=Math.max(0,frame-starts[phase]);
  const frames=Math.max(1,(starts[phase+1]??total)-starts[phase]);
  const previousFrames=Math.max(1,starts[previous+1]-starts[previous]);
  const entrance=ease(frame,76,146);
  const departure=phase===6?ease(frame,starts[6],starts[6]+35):0;
  const panelOpacity=clamp(entrance*(1-departure));
  const navBlend=phase>=2&&phase<=5?ease(frame,starts[phase],starts[phase]+24):1;
  const centerBlend=phase>=1&&phase<=5?ease(frame,starts[phase]+7,starts[phase]+29):1;
  const introCamera=ease(frame,17,114);
  const pullBack=phase===6?ease(frame,starts[6]+10,starts[6]+123):0;
  const mapZoom=introCamera*(1-pullBack);
  const selectedMap=phase===6?ease(frame,starts[6]+28,starts[6]+95):0;
  const handoff=phase===6?300*ease(frame,starts[6]+90,
    Math.min(total-1,starts[6]+260)):0;
  const healthEnd=phase>=5;
  return <div style={{position:'absolute',inset:0,overflow:'hidden',
    background:'#050E1D',color:'#F2F7FF',fontFamily:AT_FONT}}>
    <div style={{position:'absolute',inset:0}}>
      <NetworkTransitYoutubePreview showGuides={false}
        frameOverride={SHOT04_DURATION_FRAMES-1}
        gatewayHandoff={315}
        balancerCinema={mapZoom}
        balancerActive={1-pullBack*.65}
        balancerIntroArrival={ease(frame,7,56)}
        balancerIntroSelected={selectedMap}
        balancerHandoff={handoff}
        authActive={phase===6?ease(frame,starts[6]+115,
          Math.min(total-1,starts[6]+246)):0}
        networkActiveMultiplier={0}/>
    </div>
    <div style={{position:'absolute',inset:0,
      background:'radial-gradient(ellipse at 50% 49%,rgba(3,10,25,.97),rgba(2,7,18,.99))',
      opacity:panelOpacity*.91,pointerEvents:'none'}}/>
    <div style={{position:'absolute',top:101,left:151,width:1618,height:880,
      border:'3px solid rgba(153,143,255,.76)',borderRadius:30,
      overflow:'hidden',zIndex:11,
      background:'linear-gradient(140deg,rgba(10,30,56,.98),rgba(5,14,30,.99))',
      boxShadow:'0 0 80px rgba(132,125,236,.25),0 35px 125px rgba(0,0,0,.67)',
      opacity:panelOpacity,pointerEvents:'none',
      transformOrigin:'center center',
      transform:'translateY('+((1-entrance)*46)+'px) scale('+(0.93+.07*entrance)+')'}}>
      <div style={{position:'absolute',left:48,top:31,fontSize:48,
        fontWeight:890,color:'#F1F5FF'}}>Load Balancer</div>
      <div style={{position:'absolute',left:46,right:46,top:132,bottom:43,
        display:'grid',gridTemplateColumns:'365px 1fr',gap:24}}>
        <ModeNavigation phase={selected} previous={previous} blend={navBlend}/>
        <div style={{position:'relative',borderRadius:22,
          border:'1px solid rgba(119,154,222,.33)',
          background:'linear-gradient(154deg,rgba(13,32,59,.97),rgba(8,20,39,.96))',
          padding:'28px 26px',overflow:'hidden'}}>
          {phase>=1&&phase<=5&&centerBlend<1&&<div style={{
            position:'absolute',inset:'28px 26px',
            opacity:1-centerBlend,pointerEvents:'none'}}>
            <LoadBalancerCenter phase={previous} local={previousFrames-1}
              frames={previousFrames} frozen/>
          </div>}
          <div style={{width:'100%',height:'100%',opacity:centerBlend}}>
            <LoadBalancerCenter phase={selected}
              local={phase===6?Math.max(0,starts[6]-starts[5]-1):local}
              frames={phase===6?Math.max(1,starts[6]-starts[5]):frames}/>
          </div>
        </div>
      </div>
    </div>
  </div>;
};
