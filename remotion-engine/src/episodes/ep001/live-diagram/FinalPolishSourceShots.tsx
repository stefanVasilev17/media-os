import React from 'react';
import {Html5Video, useCurrentFrame, interpolate, Easing} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {LoadBalancerFinalPolish} from './LoadBalancerFinalPolish';
import {AuthServiceTier2FinalPolish} from './AuthServiceTier2FinalPolish';

const BASE='https://media-os-backend-production.up.railway.app/api/v1/remotion/renders';
const ORIGINAL_SHOT04=BASE+'/3309d525-8890-4e25-aad3-a3261cc50f92/video';
const ORIGINAL_SHOT06=BASE+'/86d0edad-6efd-46c7-b041-627f3ac78333/video';
const ORIGINAL_SHOT07=BASE+'/dc31f24e-ea31-462a-8398-457f780e7f6a/video';
const fade=(frame:number,a:number,b:number)=>interpolate(frame,[a,b],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const sourceVideoStyle:React.CSSProperties={
  position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill'};

export const Shot04FinalPolish:React.FC=()=>{
 const frame=useCurrentFrame();
 const cue=fade(frame,555,590)*(1-fade(frame,1050,1095));
 return <div style={{position:'absolute',inset:0,background:'#05101D'}}>
  <Html5Video src={ORIGINAL_SHOT04} style={sourceVideoStyle}/>
  <div style={{position:'absolute',bottom:0,left:'17%',width:'66%',height:'16%',
    background:'linear-gradient(0deg,#05101D 40%,rgba(5,16,29,.93) 65%,transparent)',
    opacity:cue,pointerEvents:'none'}}/>
  <div style={{position:'absolute',left:'27%',width:'46%',top:'75.5%',
    boxSizing:'border-box',padding:'14px 22px',borderRadius:17,
    border:'2px solid rgba(76,202,235,.72)',background:'rgba(4,18,35,.97)',
    color:'#E6F8FF',fontSize:27,fontWeight:800,lineHeight:1.2,
    fontFamily:AT_FONT,letterSpacing:'.01em',textAlign:'center',
    textShadow:'0 0 18px rgba(76,202,235,.38)',
    opacity:cue,pointerEvents:'none'}}>
    DNS lookup complete · destination found
  </div>
 </div>;
};

export const Shot06FinalPolish:React.FC=()=>{
 const frame=useCurrentFrame();
 return <div style={{position:'absolute',inset:0,background:'#05101D'}}>
  <Html5Video src={ORIGINAL_SHOT06} style={{...sourceVideoStyle,opacity:0}}/>
  <LoadBalancerFinalPolish durationInFrames={5137}
    clipStarts={[0,497,990,1617,2326,3154,4103]}
    anchors={{}}/>
 </div>;
};

export const Shot07FinalPolish:React.FC=()=>(
 <div style={{position:'absolute',inset:0,background:'#081B34'}}>
  <Html5Video src={ORIGINAL_SHOT07} style={{...sourceVideoStyle,opacity:0}}/>
  <AuthServiceTier2FinalPolish durationInFrames={4882}
    clipStarts={[24,952,1821,2940,3915]} anchors={{}}/>
 </div>
);
