import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';
import {LoadBalancerCenter,ModeNavigation} from './LoadBalancerCleanDirectorVisual';

type Props={
  durationInFrames:number;
  anchors?:Record<string,number>;
  clipStarts?:number[];
};
const FPS=30;
const PANEL_REVEAL_START=225;
const PANEL_REVEAL_END=285;
const DEFAULT_SECONDS=[0,16.581,33.002,53.902,77.522,105.143,136.763];
const ease=(f:number,a:number,b:number)=>interpolate(
  f,[a,Math.max(a+1,b)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const clamp=(v:number)=>Math.max(0,Math.min(1,v));

export const LoadBalancerYoutubePreview:React.FC<Props>=({
  durationInFrames,anchors={},clipStarts=[]
})=>{
  const frame=useCurrentFrame();
  const total=Math.max(1,durationInFrames);
  const starts=DEFAULT_SECONDS.map((sec,i)=>
    Number.isFinite(clipStarts[i])?Math.min(total-1,clipStarts[i]):Math.min(total-1,Math.round(sec*FPS)));
  const phase=starts.reduce((n,start,i)=>frame>=start?i:n,0);
  const livePhase=Math.min(phase,5);
  const prior=Math.max(0,livePhase-1);
  const entrance=ease(frame,PANEL_REVEAL_START-4,PANEL_REVEAL_END);
  const panelIn=ease(frame,PANEL_REVEAL_START,PANEL_REVEAL_END);
  const finalStart=starts[6];
  const exit=ease(frame,finalStart-7,finalStart+19);
  const opacity=clamp(panelIn*(1-exit));
  const navBlend=phase>=2&&phase<=5?ease(frame,starts[phase],starts[phase]+20):1;
  const centerBlend=phase>=1&&phase<=5?ease(frame,starts[phase]+6,starts[phase]+25):1;
  const openingCamera=ease(frame,7,118)*
    (1-ease(frame,PANEL_REVEAL_START+1,PANEL_REVEAL_END+10));
  const finalCamera=ease(frame,finalStart-15,finalStart+32)*
    (1-ease(frame,finalStart+65,finalStart+166));
  const balancerCinema=Math.max(openingCamera,finalCamera);
  const selectedOnMap=ease(frame,Math.round((anchors.SELECT_B??116.6)*FPS),
    Math.round((anchors.SELECT_B??116.6)*FPS)+26);
  const greenMoves=Math.round((anchors.GREEN_MOVES??133.863)*FPS);
  const handoff=300*ease(frame,greenMoves,Math.min(total-1,finalStart+38));
  const authFocus=ease(frame,finalStart,Math.min(total-1,finalStart+70));
  const refOpacity=1-.24*opacity;
  const lookPhase=livePhase;
  const zoneCue=Math.round((anchors.ZONE_EXPLAIN??121.463)*FPS);
  const greenCue=Math.round((anchors.GREEN_MOVES??133.863)*FPS);
  const zoneFocus=lookPhase===5?
    ease(frame,zoneCue-8,zoneCue+22)*(1-ease(frame,greenCue-26,greenCue+7)):0;
  const showNav=clamp(ease(frame,PANEL_REVEAL_START+10,PANEL_REVEAL_END)*(1-exit));

  return <div style={{position:'absolute',inset:0,overflow:'hidden',
    color:'#F2F7FF',fontFamily:AT_FONT,background:'#05101D'}}>
    <div style={{position:'absolute',inset:0,opacity:refOpacity}}>
      <NetworkTransitYoutubePreview showGuides={false}
        frameOverride={SHOT04_DURATION_FRAMES-1}
        gatewayHandoff={315}
        balancerCinema={balancerCinema}
        balancerActive={1-.68*authFocus}
        balancerIntroArrival={ease(frame,2,45)}
        balancerIntroSelected={selectedOnMap}
        balancerIntroFlow={ease(frame,24,210)}
        balancerIntroFrame={frame}
        balancerIntroHandoff={phase===6?ease(frame,finalStart-4,finalStart+57):0}
        balancerIntroUnhealthy={ease(frame,Math.round((anchors.MARK_UNHEALTHY??90)*FPS),
          Math.round((anchors.ROUTE_REMOVED??93)*FPS)+15)}
        balancerHandoff={handoff}
        authActive={authFocus}
        networkActiveMultiplier={0}/>
    </div>
    <div style={{position:'absolute',inset:0,pointerEvents:'none',
      background:'radial-gradient(ellipse at 49% 46%,rgba(4,12,27,.94),rgba(2,7,18,.99))',
      opacity:.94*opacity}}/>
    <div style={{
      position:'absolute',top:100,left:125,width:1670,height:880,
      opacity,transformOrigin:'center center',
      transform:'translateY('+((1-entrance)*48)+'px) scale('+(0.92+.08*entrance)+')',
      pointerEvents:'none',zIndex:10,
      border:'2px solid rgba(139,167,252,.72)',borderRadius:30,
      background:'linear-gradient(155deg,rgba(11,26,50,.985),rgba(5,14,30,.985))',
      boxShadow:'0 0 80px rgba(103,125,226,.20),0 32px 124px rgba(0,0,0,.68)',
      overflow:'hidden'
    }}>
      <div style={{position:'absolute',left:51,top:28,right:46,
        fontSize:51,fontWeight:885,color:'#F3F7FF'}}>
        Load Balancer
      </div>
      <div style={{position:'absolute',left:46,right:46,top:127,bottom:34,
        display:'grid',gridTemplateColumns:'365px 1fr',gap:21}}>
        <div style={{opacity:showNav}}>
          <ModeNavigation phase={lookPhase} previous={prior} blend={navBlend}
            zoneFocus={zoneFocus}/>
        </div>
        <div style={{position:'relative',overflow:'hidden',borderRadius:22,
          border:'1px solid rgba(112,154,223,.30)',
          padding:'25px 21px',
          background:'linear-gradient(149deg,rgba(9,27,53,.97),rgba(6,16,34,.99))'}}>
          {phase>=1&&phase<=5&&centerBlend<1&&<div style={{
            position:'absolute',inset:'25px 21px',
            opacity:1-centerBlend,pointerEvents:'none'}}>
            <LoadBalancerCenter phase={prior}
              frame={Math.max(0,starts[phase]-1)}
              anchors={anchors} frozen/>
          </div>}
          <div style={{width:'100%',height:'100%',
            opacity:centerBlend,pointerEvents:'none'}}>
            <LoadBalancerCenter phase={lookPhase} frame={frame} anchors={anchors}/>
          </div>
        </div>
      </div>
    </div>
  </div>;
};
