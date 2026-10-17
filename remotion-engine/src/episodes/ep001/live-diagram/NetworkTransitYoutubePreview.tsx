import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {ATBackground,ATCameraRig,AT_FONT} from '../../../components/architectural-thinking';
import {ReadyNotSentYoutubePreview} from './ReadyNotSentYoutubePreview';
import {SHOT03_DURATION_FRAMES} from './shot03Timing';
import {SHOT04} from './shot04Timing';

export const networkTransitYoutubePreviewSchema=z.object({
  showGuides:z.boolean(),
  frameOverride:z.number().optional(),
  anchors:z.record(z.string(),z.number()).optional(),
  gatewayHandoff:z.number().optional(),
  gatewayActive:z.number().optional(),
  balancerActive:z.number().optional(),
});
type Props=z.infer<typeof networkTransitYoutubePreviewSchema>;

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const progress=(frame:number,start:number,end:number)=>interpolate(frame,[start,Math.max(start+1,end)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});
const cue=(anchors:Record<string,number>,key:string,fallback:number)=>Number.isFinite(anchors[key])
  ?Math.max(0,anchors[key]*30):fallback;

export const NetworkTransitYoutubePreview:React.FC<Props>=({showGuides,anchors={},frameOverride,gatewayHandoff=0,gatewayActive=0,balancerActive=0})=>{
  const currentFrame=useCurrentFrame();
  const frame=frameOverride??currentFrame;
  const t={
    release:cue(anchors,'PREPARED_LOGIN',SHOT04.release),
    destinationQuestion:cue(anchors,'WHERE_SENT',SHOT04.destinationQuestion),
    dns:cue(anchors,'DNS_RESOLUTION',SHOT04.dns),
    resolve:cue(anchors,'RESOLVE',SHOT04.resolve),
    cache:cue(anchors,'CACHE',SHOT04.cache),
    network:cue(anchors,'NETWORK_TRANSIT',SHOT04.network),
    latency:cue(anchors,'NETWORK_LATENCY',SHOT04.latency),
    rtt:cue(anchors,'RTT',SHOT04.rtt),
    jitter:cue(anchors,'JITTER',SHOT04.jitter),
    destinationKnown:cue(anchors,'DESTINATION_KNOWN',SHOT04.destinationKnown),
    journeyHealth:cue(anchors,'JOURNEY_HEALTH',SHOT04.journeyHealth),
  };

  const packetMorph=progress(frame,2,16);
  const dnsIn=progress(frame,Math.max(15,t.dns-33),t.dns+35);
  const focusOut=progress(frame,Math.max(t.jitter+32,t.destinationKnown-100),t.destinationKnown+26);
  const focus=clamp(dnsIn*(1-focusOut));
  const latencyPan=progress(frame,Math.max(t.cache+22,t.latency-25),t.latency+30);
  const cameraScale=1+1.55*focus;
  const cameraX=207*cameraScale*focus-48*focusOut;
  const cameraY=(-83+18*latencyPan)*cameraScale*focus-12*focusOut;
  const captionOpacity=1-progress(frame,0,30);

  const entry=progress(frame,t.release,Math.max(t.release+18,t.dns+12));
  const rise=progress(frame,t.network,Math.max(t.network+15,t.latency));
  const traverse=progress(frame,t.latency,Math.max(t.latency+18,t.jitter+14));
  const exit=progress(frame,Math.max(t.jitter+14,t.destinationKnown-35),t.journeyHealth+15);
  const packetWorldX=1178+32*entry+300*traverse;
  const packetWorldY=706-162*rise+162*exit;
  const traveled=32*entry+162*rise+300*traverse+162*exit;
  const sceneX=(x:number)=>960+(x-960)*.86-552;
  const sceneY=(y:number)=>540+(y-540)*.86-48;
  const dnsReveal=progress(frame,t.dns,t.resolve+14);
  const resolve=progress(frame,t.resolve,t.resolve+18);
  const cache=progress(frame,t.cache,t.cache+16);
  const latencyReveal=progress(frame,t.latency,t.latency+22);
  const rtt=progress(frame,t.rtt,t.rtt+12);
  const jitter=progress(frame,t.jitter,t.jitter+12);
  const networkActive=clamp(Math.max(dnsReveal*.64,traverse*.8,latencyReveal*.9));

  const addressNote=progress(frame,t.resolve,t.resolve+22)
    *(1-progress(frame,t.network,t.network+24));
  const cacheNote=progress(frame,t.cache,t.cache+14)
    *(1-progress(frame,t.network,t.network+12));
  const latencyNote=progress(frame,t.latency,t.latency+14)
    *(1-progress(frame,t.destinationKnown,t.destinationKnown+20));

  return (
    <ATBackground>
      <ATCameraRig x={cameraX} y={cameraY} scale={cameraScale} zIndex={4}>
        <ReadyNotSentYoutubePreview
          showGuides={false}
          frameOverride={SHOT03_DURATION_FRAMES-1}
          captionOpacity={captionOpacity}
          worldMotion={{
            packetOffsetX:packetWorldX-1178+Math.max(0,gatewayHandoff),
            gatewayActive,
            balancerActive,
            packetOffsetY:packetWorldY-706,
            packetMorph,
            focusIntensity:focus,
            networkActive,
            dnsReveal,
            resolve,
            cache,
            latencyReveal,
            rtt,
            jitter,
          }}
        />
        {gatewayHandoff>0&&<svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{
          position:'absolute',inset:0,zIndex:7,pointerEvents:'none',overflow:'visible',opacity:.93,
        }}>
          <path d={`M ${sceneX(1510)} ${sceneY(706)} H ${sceneX(1510+Math.max(0,gatewayHandoff))}`}
            fill="none" stroke="rgba(57,228,176,.86)" strokeWidth={3}
            strokeLinecap="round" style={{filter:'drop-shadow(0 0 5px rgba(44,229,169,.29))'}}/>
        </svg>}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{
          position:'absolute',inset:0,zIndex:8,pointerEvents:'none',overflow:'visible',
          opacity:Math.min(1,.64*entry),
        }}>
          <path
            d={`M ${sceneX(1178)} ${sceneY(706)} H ${sceneX(1210)} V ${sceneY(544)} H ${sceneX(1510)} V ${sceneY(706)}`}
            fill="none"
            stroke="rgba(55,226,174,.73)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={656}
            strokeDasharray={`${Math.max(0,traveled)} 656`}
            style={{filter:'drop-shadow(0 0 5px rgba(34,229,169,.24))'}}
          />
        </svg>
        <div style={{
          position:'absolute',left:756,top:810,width:282,
          transform:'translateX(-50%)',
          fontFamily:AT_FONT,fontSize:14,color:'#A8D4F1',fontWeight:670,
          textAlign:'center',letterSpacing:'.01em',
          opacity:addressNote*.82*(.25+.75*focus),zIndex:13,
        }}>DNS lookup complete · destination found</div>
        <div style={{
          position:'absolute',left:756,top:852,width:270,
          transform:'translateX(-50%)',
          fontSize:15,fontWeight:650,fontFamily:AT_FONT,
          textAlign:'center',color:'rgba(90,242,188,.93)',
          opacity:cacheNote*(.25+.75*focus),zIndex:13,
        }}>Cached answer can skip a lookup</div>
        <div style={{
          position:'absolute',left:755,top:851,width:360,
          transform:'translateX(-50%)',display:'flex',justifyContent:'space-between',
          fontFamily:AT_FONT,fontSize:15,fontWeight:690,
          color:'rgba(176,216,244,.88)',
          opacity:latencyNote*(.25+.75*focus),zIndex:13,
        }}>
          <span style={{opacity:.28+.72*rtt}}>RTT · out and back</span>
          <span style={{opacity:.28+.72*jitter}}>Jitter · variation</span>
        </div>
      </ATCameraRig>
      {showGuides?<div style={{
        position:'absolute',inset:40,border:'1px dashed rgba(255,255,255,.22)',
        pointerEvents:'none',zIndex:30,
      }}/>:null}
    </ATBackground>
  );
};
