import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {ATBackground,ATCameraRig,AT_FONT} from '../../../components/architectural-thinking';
import {ReadyNotSentYoutubePreview} from './ReadyNotSentYoutubePreview';
import {SHOT03_DURATION_FRAMES} from './shot03Timing';
import {SHOT04} from './shot04Timing';

export const networkTransitYoutubePreviewSchema=z.object({
  showGuides:z.boolean(),
  anchors:z.record(z.string(),z.number()).optional(),
});
type Props=z.infer<typeof networkTransitYoutubePreviewSchema>;

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const progress=(frame:number,start:number,end:number)=>interpolate(frame,[start,Math.max(start+1,end)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});
const cue=(anchors:Record<string,number>,key:string,fallback:number)=>Number.isFinite(anchors[key])
  ?Math.max(0,anchors[key]*30):fallback;

export const NetworkTransitYoutubePreview:React.FC<Props>=({showGuides,anchors={}})=>{
  const frame=useCurrentFrame();
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

  const dnsStart=progress(frame,t.destinationQuestion,t.dns+15);
  const followNetwork=progress(frame,t.release,Math.max(t.release+20,t.dns+30));
  const followGateway=progress(frame,t.network,Math.max(t.network+50,t.destinationKnown+25));
  const cameraScale=1+.10*followNetwork+.02*followGateway;
  const cameraX=160*followNetwork-220*followGateway;
  const cameraY=-10*followGateway;
  const captionOpacity=1-progress(frame,0,28);

  const release=progress(frame,t.release,t.destinationQuestion-12);
  const approachNetwork=progress(frame,t.dns+22,t.cache+35);
  const enterTransit=progress(frame,t.network,t.latency+46);
  const towardGateway=progress(frame,t.jitter+5,t.destinationKnown+22);
  const packetOffsetX=45*release+12*approachNetwork+160*enterTransit+103*towardGateway;
  const dnsReveal=progress(frame,t.dns,t.resolve+14);
  const resolve=progress(frame,t.resolve,t.resolve+18);
  const cache=progress(frame,t.cache,t.cache+16);
  const latencyReveal=progress(frame,t.latency,t.latency+22);
  const rtt=progress(frame,t.rtt,t.rtt+12);
  const jitter=progress(frame,t.jitter,t.jitter+12);
  const networkActive=clamp(Math.max(dnsReveal*.64,enterTransit*.8,latencyReveal*.9));
  const packetX=590+packetOffsetX*.86;
  const packetY=627;

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
          frameOverride={SHOT03_DURATION_FRAMES+1}
          captionOpacity={captionOpacity}
          worldMotion={{
            packetOffsetX,
            networkActive,
            dnsReveal,
            resolve,
            cache,
            latencyReveal,
            rtt,
            jitter,
          }}
        />
        <div style={{
          position:'absolute',left:590,top:packetY,
          width:Math.max(0,packetX-590),height:2,borderRadius:99,
          background:'linear-gradient(90deg,rgba(27,159,128,.32),rgba(66,236,190,.83))',
          boxShadow:'0 0 11px rgba(45,214,169,.2)',
          opacity:release*.85,zIndex:8,
        }}/>
        <div style={{
          position:'absolute',left:756,top:810,width:282,
          transform:'translateX(-50%)',
          fontFamily:AT_FONT,fontSize:14,color:'#A8D4F1',fontWeight:670,
          textAlign:'center',letterSpacing:'.01em',
          opacity:addressNote*.82,zIndex:12,
        }}>DNS lookup complete · destination found</div>
        <div style={{
          position:'absolute',left:756,top:852,width:270,
          transform:'translateX(-50%)',
          fontSize:15,fontWeight:650,fontFamily:AT_FONT,
          textAlign:'center',color:'rgba(90,242,188,.93)',
          opacity:cacheNote,zIndex:12,
        }}>Cached answer can skip a lookup</div>
        <div style={{
          position:'absolute',left:755,top:851,width:300,
          transform:'translateX(-50%)',display:'flex',justifyContent:'space-around',
          fontFamily:AT_FONT,fontSize:15,fontWeight:690,
          color:'rgba(176,216,244,.88)',opacity:latencyNote,zIndex:12,
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
