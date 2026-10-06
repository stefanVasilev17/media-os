import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  ATBackground,
  ATCameraRig,
  ATConnectionPath,
  ATFlowArrow,
  ATMiniWorld,
  ATPhone,
  ATPrimaryNode,
  ATSecondaryStack,
  AT_FONT,
} from '../../../components/architectural-thinking';
import {SHOT01_DURATION_FRAMES} from './shot01Timing';
import {SHOT02} from './shot02Timing';

export const requestAssemblyYoutubePreviewSchema = z.object({showGuides:z.boolean()});
type Props = z.infer<typeof requestAssemblyYoutubePreviewSchema>;

const EMAIL='user@example.com';
const out=(frame:number,from:number,to:number)=>interpolate(frame,[from,to],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
const ease=(frame:number,from:number,to:number)=>interpolate(frame,[from,to],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const pulse=(frame:number,start:number,end:number,fade=10)=>Math.min(out(frame,start,Math.min(start+fade,end)),1-out(frame,Math.max(start,end-fade),end));

export const RequestAssemblyYoutubePreview:React.FC<Props>=({showGuides})=>{
  const frame=useCurrentFrame();
  const continuationFrame=SHOT01_DURATION_FRAMES+frame;

  const contextQuiet=ease(frame,SHOT02.handoff.contextQuietStart,SHOT02.handoff.contextQuietEnd);
  const phoneShift=ease(frame,SHOT02.handoff.phoneShiftStart,SHOT02.handoff.phoneShiftEnd);
  const legacyWaiting=.12+.88*(1-out(frame,0,18));
  const requestHintCarry=1-out(frame,0,SHOT02.handoff.hintEnd);
  const flowReveal=out(frame,SHOT02.handoff.flowStart,SHOT02.handoff.flowEnd);
  const requestReveal=out(frame,SHOT02.requestAssembly.revealStart,SHOT02.requestAssembly.revealEnd);
  const requestSettle=ease(frame,SHOT02.requestAssembly.settleStart,SHOT02.requestAssembly.settleEnd);
  const overview=ease(frame,SHOT02.camera.overviewStart,SHOT02.camera.overviewEnd);
  const requestQuiet=ease(frame,SHOT02.requestAssembly.defocusStart,SHOT02.requestAssembly.defocusEnd);

  const requestLeft=860+(1-requestSettle)*64;
  const requestTop=703;
  const requestWidth=270;
  const requestHeight=240;
  const requestVisualScale=1.333-requestQuiet*.333;

  const phoneRigX=-500*phoneShift;
  const phoneRigY=18*phoneShift;
  const phoneRigScale=1-.26*phoneShift;
  const stackRigX=-520*contextQuiet;
  const stackRigY=22*contextQuiet;
  const stackRigScale=1-.28*contextQuiet;
  const stackOpacity=1-.78*contextQuiet;

  const phoneCenterX=460;
  const phoneVisibleHalfWidth=250*.53*phoneRigScale;
  const flowStartX=phoneCenterX+phoneVisibleHalfWidth;
  const flowStartY=823;
  const flowEndX=requestLeft-(requestWidth*requestVisualScale)/2-8;
  const flowEndY=requestTop+requestHeight*.5;

  const payloadReveal=out(frame,SHOT02.payload.start,SHOT02.payload.revealEnd);
  const headersReveal=out(frame,SHOT02.headers.start,SHOT02.headers.revealEnd);
  const contextReveal=out(frame,SHOT02.context.start,SHOT02.context.revealEnd);

  const payloadAssemblyFocus=pulse(frame,SHOT02.assembly.payloadFocusStart,SHOT02.assembly.payloadFocusEnd,10);
  const headersAssemblyFocus=pulse(frame,SHOT02.assembly.headersFocusStart,SHOT02.assembly.headersFocusEnd,10);
  const contextAssemblyFocus=pulse(frame,SHOT02.assembly.contextFocusStart,SHOT02.assembly.contextFocusEnd,10);

  const identity=Math.max(pulse(frame,SHOT02.payload.identityStart,SHOT02.payload.identityEnd,12),payloadAssemblyFocus);
  const secret=Math.max(pulse(frame,SHOT02.payload.secretStart,SHOT02.payload.secretEnd,12),payloadAssemblyFocus);
  const userAgent=Math.max(pulse(frame,SHOT02.headers.userAgentStart,SHOT02.headers.userAgentEnd,12),headersAssemblyFocus);
  const accept=Math.max(pulse(frame,SHOT02.headers.acceptStart,SHOT02.headers.acceptEnd,12),headersAssemblyFocus);
  const timestamp=Math.max(pulse(frame,SHOT02.context.timestampStart,SHOT02.context.timestampEnd,12),contextAssemblyFocus);
  const source=Math.max(pulse(frame,SHOT02.context.sourceStart,SHOT02.context.sourceEnd,12),contextAssemblyFocus);

  const payloadActivity=Math.max(identity,secret,payloadAssemblyFocus);
  const headersActivity=Math.max(userAgent,accept,headersAssemblyFocus);
  const contextActivity=Math.max(timestamp,source,contextAssemblyFocus);

  const settle=ease(frame,SHOT02.assembly.settleStart,SHOT02.assembly.settleEnd);
  const ready=out(frame,SHOT02.assembly.readyStart,SHOT02.assembly.readyEnd);
  const networkReveal=Math.max(ready,requestQuiet*.78);
  const requestScale=1-overview*.015;
  const requestActive=.62*(1-requestQuiet)+.08;

  return (
    <ATBackground>
      <ATCameraRig x={stackRigX} y={stackRigY} scale={stackRigScale} opacity={stackOpacity} zIndex={3}>
        <ATSecondaryStack
          frame={continuationFrame}
          intent={1}
          height={565}
          panelTop={30}
          connectorHeight={20}
          sections={[
            {title:'Login Intent',items:[{label:'Validate',activity:0},{label:'Submit',activity:0}],reveal:1,divider:1},
            {title:'Credential Input',items:[{label:'Identifier',activity:0},{label:'Secret',activity:0}],reveal:1,divider:1},
            {title:'Local UI State',items:[{label:'Submitting',activity:0},{label:'Waiting',activity:legacyWaiting}],reveal:1,divider:0},
          ]}
        />
      </ATCameraRig>

      <ATCameraRig x={phoneRigX} y={phoneRigY} scale={phoneRigScale} opacity={1} zIndex={4}>
        <ATPhone
          frame={continuationFrame}
          reveal={1}
          credential={1}
          ui={1}
          emailValue={EMAIL}
          passwordDots={'•'.repeat(8)}
          emailFocus={0}
          passwordFocus={0}
          localUi={1}
          press={0}
          waiting={1}
          spinner={1}
        />
      </ATCameraRig>

      <div style={{position:'absolute',right:84,bottom:58,opacity:requestHintCarry*.20,fontFamily:AT_FONT,fontSize:17,fontWeight:650,letterSpacing:'.06em',color:'#8AA9C8',zIndex:4}}>REQUEST ASSEMBLY →</div>

      <ATFlowArrow
        frame={continuationFrame}
        reveal={flowReveal}
        activity={.82}
        startX={flowStartX}
        startY={flowStartY}
        endX={flowEndX}
        endY={flowEndY}
      />

      <ATCameraRig scale={requestScale} zIndex={6}>
        <ATPrimaryNode
          title="Request Assembly"
          reveal={requestReveal}
          active={requestActive}
          left={requestLeft}
          top={requestTop}
          width={requestWidth}
          height={requestHeight}
          visualScale={requestVisualScale}
          quiet={requestQuiet}
          micro
        >
          <div style={{display:'flex',flexDirection:'column',gap:5,opacity:1,transform:`scale(${1-settle*.006})`,transformOrigin:'50% 50%'}}>
            <ATMiniWorld
              title="Payload"
              reveal={payloadReveal}
              activity={payloadActivity}
              tags={['JSON','Form']}
              micro
              items={[
                {label:'Identity',activity:identity},
                {label:'Secret',activity:secret},
              ]}
            />
            <ATMiniWorld
              title="Headers"
              reveal={headersReveal}
              activity={headersActivity}
              micro
              items={[
                {label:'User-Agent',activity:userAgent},
                {label:'Accept',activity:accept},
              ]}
            />
            <ATMiniWorld
              title="Request Context"
              reveal={contextReveal}
              activity={contextActivity}
              micro
              items={[
                {label:'Timestamp',activity:timestamp},
                {label:'Source',activity:source},
              ]}
            />
          </div>
        </ATPrimaryNode>
      </ATCameraRig>

      <ATConnectionPath
        reveal={networkReveal}
        left={requestLeft+requestWidth/2-4}
        top={requestTop+requestHeight*.5-54}
        width={650-requestQuiet*40}
        label="NETWORK"
        nodeOpacity={.34}
      />

      <div style={{position:'absolute',right:70,bottom:48,opacity:networkReveal*.55,fontFamily:AT_FONT,fontSize:13,fontWeight:720,letterSpacing:'.11em',color:'rgba(128,162,192,.62)'}}>READY ≠ SENT</div>
      {showGuides?<div style={{position:'absolute',inset:40,border:'1px dashed rgba(255,255,255,.20)',pointerEvents:'none',zIndex:30}}/>:null}
    </ATBackground>
  );
};
