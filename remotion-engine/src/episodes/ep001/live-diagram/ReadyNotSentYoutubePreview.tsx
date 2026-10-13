import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  ATBackground,
  ATBackendNode,
  ATCameraRig,
  AT_FONT,
} from '../../../components/architectural-thinking';
import {RequestAssemblyYoutubePreview} from './RequestAssemblyYoutubePreview';
import {SHOT02_DURATION_FRAMES} from './shot02Timing';
import {SHOT03} from './shot03Timing';

export const readyNotSentYoutubePreviewSchema=z.object({
  showGuides:z.boolean(),
  anchors:z.record(z.string(),z.number()).optional(),
  frameOverride:z.number().optional(),
  captionOpacity:z.number().optional(),
  worldMotion:z.object({
    packetOffsetX:z.number(),
    packetOffsetY:z.number().optional(),
    networkActive:z.number().optional(),
    dnsReveal:z.number().optional(),
    latencyReveal:z.number().optional(),
    resolve:z.number().optional(),
    cache:z.number().optional(),
    rtt:z.number().optional(),
    jitter:z.number().optional(),
  }).optional(),
});
type Props=z.infer<typeof readyNotSentYoutubePreviewSchema>;

const ease=(frame:number,from:number,to:number)=>interpolate(frame,[from,to],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});
const enter=(frame:number,from:number,to:number)=>interpolate(frame,[from,to],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic),
});
const focus=(frame:number,start:number,hold=50)=>{
  const appear=enter(frame,start,start+8);
  const leave=1-enter(frame,start+hold,start+hold+12);
  return Math.max(0,Math.min(appear,leave));
};

const BACKEND_NODES=[
  {title:'Network / Transit',x:1360,anchor:'NETWORK_TRANSIT',sections:[
    {title:'DNS Resolution',items:[{label:'Resolve'},{label:'Cache'}]},
    {title:'Network Latency',items:[{label:'RTT'},{label:'Jitter'}]},
  ]},
  {title:'API Gateway',x:1660,anchor:'API_GATEWAY',sections:[
    {title:'Routing',items:[{label:'Path'},{label:'Method'}]},
    {title:'Rate Limit',items:[{label:'Burst'},{label:'Quota'}]},
    {title:'Request Filter',items:[{label:'WAF'},{label:'Schema'}]},
  ]},
  {title:'Load Balancer',x:1960,anchor:'LOAD_BALANCER',sections:[
    {title:'Traffic Distribution',items:[{label:'Route Mode'},{label:'Hash Key'}]},
    {title:'Health Checks',items:[{label:'Healthy'},{label:'Timeout'}]},
    {title:'Target Choice',items:[{label:'Instance'},{label:'Zone'}]},
  ]},
  {title:'Auth Service',x:2260,anchor:'AUTH_SERVICE',sections:[
    {title:'Validation Steps',items:[{label:'Token Status'},{label:'User Lookup'}]},
  ]},
  {title:'User Database',x:2560,anchor:'USER_DATABASE',sections:[
    {title:'User Data',items:[{label:'Profile'},{label:'Settings'}]},
    {title:'Access Rights',items:[{label:'Role'},{label:'Scopes'}]},
    {title:'Session Management',items:[{label:'Create'},{label:'Refresh'}]},
  ]},
] as const;

export const ReadyNotSentYoutubePreview:React.FC<Props>=({showGuides,anchors={},frameOverride,captionOpacity=1,worldMotion})=>{
  const frame=frameOverride ?? useCurrentFrame();
  const at=(key:string,fallbackFrame:number)=>Number.isFinite(anchors[key])
    ?Math.max(0,anchors[key]*30):fallbackFrame;

  const cue={
    payload:at('PAYLOAD',SHOT03.reaffirm.payload),
    headers:at('HEADERS',SHOT03.reaffirm.headers),
    context:at('REQUEST_CONTEXT',SHOT03.reaffirm.context),
    messageReady:at('MESSAGE_READY',SHOT03.insight.readyNotReceived),
    spinner:at('SPINNER',SHOT03.insight.spinner),
    network:at('NETWORK_TRANSIT',SHOT03.insight.network),
    gateway:at('API_GATEWAY',SHOT03.insight.gateway),
    balancer:at('LOAD_BALANCER',SHOT03.insight.balancer),
    auth:at('AUTH_SERVICE',SHOT03.insight.auth),
    database:at('USER_DATABASE',SHOT03.insight.database),
    conclusion:at('READY_NOT_SENT',SHOT03.insight.conclusion),
  };

  const zoomStart=Math.max(0,cue.messageReady-(SHOT03.insight.readyNotReceived-SHOT03.camera.widenStart));
  const zoomEnd=Math.max(zoomStart+1,cue.network);
  const overview=ease(frame,zoomStart,zoomEnd);
  const cameraScale=1-.14*overview;
  const cameraX=-552*overview;
  const cameraY=-48*overview;
  const oldLabelOpacity=1-ease(frame,zoomStart,zoomStart+26);
  const oldNetworkHintOpacity=1-ease(frame,zoomStart,zoomStart+72);
  const packetReveal=enter(frame,cue.messageReady,cue.messageReady+18);
  const networkReveal=enter(frame,cue.network,cue.network+26);
  const insight=enter(frame,cue.conclusion,cue.conclusion+17);
  const extraFocus={
    payload:focus(frame,cue.payload,38),
    headers:focus(frame,cue.headers,38),
    context:focus(frame,cue.context,38),
  };
  const nodeReveals=[
    networkReveal,
    enter(frame,cue.gateway,cue.gateway+19),
    enter(frame,cue.balancer,cue.balancer+19),
    enter(frame,cue.auth,cue.auth+19),
    enter(frame,cue.database,cue.database+19),
  ];

  return (
    <ATBackground>
      <ATCameraRig x={cameraX} y={cameraY} scale={cameraScale} zIndex={4}>
        <RequestAssemblyYoutubePreview
          showGuides={false}
          embedded
          frameOverride={SHOT02_DURATION_FRAMES-1}
          ambientFrameOverride={SHOT02_DURATION_FRAMES+frame}
          readyStampOpacity={oldLabelOpacity}
          networkHintOpacity={oldNetworkHintOpacity}
          extraFocus={extraFocus}
        />

        <div style={{
          position:'absolute',left:1155+(worldMotion?.packetOffsetX??0),top:689+(worldMotion?.packetOffsetY??0),width:46,height:34,
          display:'flex',alignItems:'center',justifyContent:'center',
          opacity:packetReveal,zIndex:10,
        }}>
          <div style={{
            width:23,height:16,borderRadius:4,
            background:worldMotion?.networkActive?'rgba(23,207,157,.93)':'rgba(23,168,138,.85)',
            border:'1px solid rgba(104,255,213,.8)',
            boxShadow:'0 0 16px rgba(25,220,173,.25)',
          }}/>
        </div>

        <div style={{
          position:'absolute',left:1175,top:692,width:50,
          borderTop:'2px dashed rgba(78,120,158,.42)',
          opacity:networkReveal*.65,zIndex:3,
        }}/>

        {BACKEND_NODES.map((node,index)=>(
          <React.Fragment key={node.anchor}>
            {index>0 && (
              <div style={{
                position:'absolute',left:BACKEND_NODES[index-1].x+135,
                top:692,width:30,borderTop:'1.5px dashed rgba(91,129,158,.36)',
                opacity:nodeReveals[index]*.55,zIndex:3,
              }}/>
            )}
            <ATBackendNode
              title={node.title}
              x={node.x}
              y={570}
              reveal={nodeReveals[index]}
              width={270}
              height={244}
              quiet={index===0?.55*(1-.75*(worldMotion?.networkActive??0)):.55}
              active={index===0?(worldMotion?.networkActive??0):0}
              secondaryReveal={index===0?Math.max(worldMotion?.dnsReveal??0,worldMotion?.latencyReveal??0):0}
              sections={node.sections.map(section=>({
                title:section.title,
                items:section.items.map(item=>({
                  label:item.label,
                  activity:index!==0?0:item.label==='Resolve'?worldMotion?.resolve??0
                    :item.label==='Cache'?worldMotion?.cache??0
                    :item.label==='RTT'?worldMotion?.rtt??0
                    :item.label==='Jitter'?worldMotion?.jitter??0:0,
                })),
              }))}
            />
          </React.Fragment>
        ))}
      </ATCameraRig>

      <div style={{
        position:'absolute',left:0,right:0,bottom:100,
        textAlign:'center',fontFamily:AT_FONT,fontSize:26,
        fontWeight:760,letterSpacing:'.04em',color:'#D9E8FA',
        opacity:insight*.94*captionOpacity,textShadow:'0 0 24px rgba(107,159,211,.16)',zIndex:12,
      }}>READY ≠ SENT</div>
      <div style={{
        position:'absolute',left:0,right:0,bottom:74,
        textAlign:'center',fontFamily:AT_FONT,fontSize:13,
        fontWeight:650,letterSpacing:'.12em',color:'#7897B5',
        opacity:insight*.7*captionOpacity,zIndex:12,
      }}>THE BACKEND HAS NOT RECEIVED THE REQUEST</div>

      {showGuides?<div style={{
        position:'absolute',inset:40,border:'1px dashed rgba(255,255,255,.2)',
        pointerEvents:'none',zIndex:30,
      }}/>:null}
    </ATBackground>
  );
};
