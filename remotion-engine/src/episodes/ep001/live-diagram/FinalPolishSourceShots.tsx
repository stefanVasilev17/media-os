import React from 'react';
import {Html5Video, Html5Audio, useCurrentFrame, interpolate, Easing} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {LoadBalancerFinalPolish} from './LoadBalancerFinalPolish';
import {NetworkTransitFinalPolish} from './NetworkTransitFinalPolish';
import {AuthServiceTier2FinalPolish} from './AuthServiceTier2FinalPolish';

const BASE='https://media-os-backend-production.up.railway.app/api/v1/remotion/renders';
const ORIGINAL_SHOT04=BASE+'/3309d525-8890-4e25-aad3-a3261cc50f92/video';
const ORIGINAL_SHOT06=BASE+'/86d0edad-6efd-46c7-b041-627f3ac78333/video';
const ORIGINAL_SHOT07=BASE+'/dc31f24e-ea31-462a-8398-457f780e7f6a/video';
const fade=(frame:number,a:number,b:number)=>interpolate(frame,[a,b],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const sourceVideoStyle:React.CSSProperties={
  position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill'};

export const Shot04FinalPolish:React.FC=()=>(
 <div style={{position:'absolute',inset:0,background:'#05101D'}}>
  <Html5Audio src={ORIGINAL_SHOT04}/>
  <NetworkTransitFinalPolish showGuides={false} anchors={{}}/>
 </div>
);

export const Shot06FinalPolish:React.FC=()=>{
 const frame=useCurrentFrame();
 return <div style={{position:'absolute',inset:0,background:'#05101D'}}>
  <Html5Audio src={ORIGINAL_SHOT06}/>
  <LoadBalancerFinalPolish durationInFrames={5137}
    clipStarts={[0,497,990,1617,2326,3154,4103]}
    anchors={{}}/>
 </div>;
};

export const Shot07FinalPolish:React.FC=()=>(
 <div style={{position:'absolute',inset:0,background:'#081B34'}}>
  <Html5Audio src={ORIGINAL_SHOT07}/>
  <AuthServiceTier2FinalPolish durationInFrames={4882}
    clipStarts={[24,952,1821,2940,3915]} anchors={{}}/>
 </div>
);
