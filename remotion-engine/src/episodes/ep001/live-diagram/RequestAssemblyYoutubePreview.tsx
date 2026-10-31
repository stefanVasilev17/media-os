import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  ATBackground,
  AT_FONT,
  ATPhone,
  ATRequestAssemblyPanel,
  ATRequestPacket,
  ATSecondaryStack,
} from '../../../components/architectural-thinking';
import {SHOT02, SHOT02_FPS} from './shot02Timing';
import {SHOT01_DURATION_FRAMES} from './shot01Timing';

export const requestAssemblyYoutubePreviewSchema = z.object({showGuides:z.boolean()});
type Props = z.infer<typeof requestAssemblyYoutubePreviewSchema>;

const clamp = (v:number)=>Math.max(0,Math.min(1,v));
const ease = (frame:number,from:number,to:number)=>interpolate(frame,[from,to],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const out = (frame:number,from:number,to:number)=>interpolate(frame,[from,to],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
const pulse = (frame:number,start:number,end:number,fade=14)=>Math.min(out(frame,start,Math.min(start+fade,end)),1-out(frame,Math.max(start,end-fade),end));

export const RequestAssemblyYoutubePreview: React.FC<Props> = ({showGuides}) => {
  const frame = useCurrentFrame();
  const continuityFrame = frame + SHOT01_DURATION_FRAMES;
  const requestHintCarry = (1-out(frame,0,90))*.20;
  const originShift = ease(frame,SHOT02.origin.shiftStart,SHOT02.origin.shiftEnd);
  const validate = pulse(frame,SHOT02.origin.validateStart,SHOT02.origin.validateEnd);
  const submit = pulse(frame,SHOT02.origin.submitStart,SHOT02.origin.submitEnd);
  const assemblyReveal = ease(frame,SHOT02.assembly.revealStart,SHOT02.assembly.revealEnd);
  const payloadReveal = ease(frame,SHOT02.payload.revealStart,SHOT02.payload.revealEnd);
  const headersReveal = ease(frame,SHOT02.headers.revealStart,SHOT02.headers.revealEnd);
  const contextReveal = ease(frame,SHOT02.context.revealStart,SHOT02.context.revealEnd);
  const payloadActivity = pulse(frame,SHOT02.payload.activeStart,SHOT02.payload.activeEnd,18);
  const headersActivity = pulse(frame,SHOT02.headers.activeStart,SHOT02.headers.activeEnd,18);
  const contextActivity = pulse(frame,SHOT02.context.activeStart,SHOT02.context.activeEnd,18);
  const networkHint = ease(frame,SHOT02.packet.networkHintStart,SHOT02.packet.networkHintEnd);
  const formation = ease(frame,SHOT02.packet.formStart,SHOT02.packet.formEnd);
  const collapse = ease(frame,SHOT02.packet.panelCollapseStart,SHOT02.packet.panelCollapseEnd);
  const travel = ease(frame,SHOT02.packet.travelStart,SHOT02.packet.travelEnd);
  const sourceLink = contextReveal*(1-collapse);
  const originScale = 1-originShift*.28;
  const originOpacity = 1-originShift*.50;
  const assemblyHero = clamp(assemblyReveal*(1-collapse*.75));
  const panelTop = 30;
  const panelHeight = 565;
  const phoneTop = 592;
  const connectorHeight = Math.max(20,phoneTop-(panelTop+panelHeight));

  return (
    <ATBackground>
      <div style={{position:'absolute',inset:0,opacity:originOpacity,transform:`translateX(${-590*originShift}px) scale(${originScale})`,transformOrigin:'50% 48%',zIndex:3}}>
        <ATSecondaryStack
          frame={continuityFrame}
          intent={1}
          height={panelHeight}
          panelTop={panelTop}
          connectorHeight={connectorHeight}
          sections={[
            {title:'Login Intent',items:[{label:'Validate',activity:validate},{label:'Submit',activity:submit}],reveal:1,divider:1},
            {title:'Credential Input',items:[{label:'Identifier',activity:0},{label:'Secret',activity:0}],reveal:1,divider:1},
            {title:'Local UI State',items:[{label:'Submitting',activity:0},{label:'Waiting',activity:0}],reveal:1,divider:0},
          ]}
        />
        <ATPhone
          frame={continuityFrame}
          reveal={1}
          credential={1}
          ui={1}
          emailValue="user@example.com"
          passwordDots="••••••••"
          emailFocus={0}
          passwordFocus={0}
          localUi={1}
          press={0}
          waiting={1}
          spinner={1}
        />
      </div>

      <div style={{position:'absolute',right:84,bottom:58,opacity:requestHintCarry,fontFamily:AT_FONT,fontSize:17,fontWeight:650,letterSpacing:'.06em',color:'#8AA9C8',zIndex:9}}>REQUEST ASSEMBLY →</div>

      <div style={{opacity:assemblyHero}}>
        <ATRequestAssemblyPanel
          frame={frame}
          reveal={assemblyReveal}
          collapse={collapse}
          sections={[
            {title:'Payload',items:['Identity','Secret'],tags:['JSON','FORM'],reveal:payloadReveal,activity:payloadActivity},
            {title:'Headers',items:['User-Agent','Accept'],reveal:headersReveal,activity:headersActivity},
            {title:'Request Context',items:['Timestamp','Source'],reveal:contextReveal,activity:contextActivity},
          ]}
        />
      </div>

      <svg width="1920" height="1080" style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none',opacity:sourceLink*.55}}>
        <path d="M 420 790 C 620 810, 780 780, 1030 748" fill="none" stroke="rgba(75,220,224,.65)" strokeWidth="2" strokeDasharray="6 9"/>
        <circle cx="420" cy="790" r="5" fill="#60EDE8"/>
        <circle cx="1030" cy="748" r="5" fill="#60EDE8"/>
      </svg>

      <div style={{position:'absolute',left:1642,top:258,width:190,height:455,opacity:networkHint*.48,zIndex:4}}>
        <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:'linear-gradient(180deg,transparent,#4B7A9E 16%,#6DA7C7 50%,#4B7A9E 84%,transparent)',boxShadow:'0 0 18px rgba(86,157,196,.20)'}}/>
        <div style={{position:'absolute',left:22,top:188,fontFamily:AT_FONT,fontSize:17,fontWeight:740,letterSpacing:'.12em',color:'#7FA3BD',writingMode:'vertical-rl'}}>NETWORK / TRANSIT</div>
        <div style={{position:'absolute',left:0,top:84,width:112,height:1,background:'linear-gradient(90deg,#5A8BA8,transparent)'}}/>
        <div style={{position:'absolute',left:0,bottom:84,width:112,height:1,background:'linear-gradient(90deg,#5A8BA8,transparent)'}}/>
      </div>

      <ATRequestPacket frame={frame} formation={formation} travel={travel}/>

      <div style={{position:'absolute',left:1188,top:894,opacity:formation*(1-travel*.65),fontFamily:AT_FONT,fontSize:15,fontWeight:700,letterSpacing:'.10em',color:'rgba(117,229,224,.68)'}}>STRUCTURED MESSAGE</div>

      {showGuides?<div style={{position:'absolute',inset:40,border:'1px dashed rgba(255,255,255,.20)',pointerEvents:'none',zIndex:30}}/>:null}
    </ATBackground>
  );
};
