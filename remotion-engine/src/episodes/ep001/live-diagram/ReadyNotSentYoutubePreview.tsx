import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  ATBackground,
  ATCameraRig,
  ATFlowArrow,
  ATMiniWorld,
  ATPhone,
  ATPrimaryNode,
  ATSecondaryStack,
  AT_FONT,
} from '../../../components/architectural-thinking';
import {SHOT01_DURATION_FRAMES} from './shot01Timing';
import {SHOT02_DURATION_FRAMES} from './shot02Timing';
import {SHOT03} from './shot03Timing';

export const readyNotSentYoutubePreviewSchema = z.object({showGuides:z.boolean(),anchors:z.record(z.string(),z.number()).optional()});
type Props = z.infer<typeof readyNotSentYoutubePreviewSchema>;

const ease = (frame:number,from:number,to:number) => interpolate(frame,[from,to],[0,1],{
  extrapolateLeft:'clamp',
  extrapolateRight:'clamp',
  easing:Easing.inOut(Easing.cubic),
});
const enter = (frame:number,from:number,to:number) => interpolate(frame,[from,to],[0,1],{
  extrapolateLeft:'clamp',
  extrapolateRight:'clamp',
  easing:Easing.out(Easing.cubic),
});
const focus = (frame:number,start:number,hold=46) => {
  const appear=enter(frame,start,start+8);
  const leave=1-enter(frame,start+hold,start+hold+12);
  return Math.max(0,Math.min(appear,leave));
};

type SilentNodeProps = {title:string;x:number;y:number;width:number;reveal:number;note?:string};
const SilentNode:React.FC<SilentNodeProps> = ({title,x,y,width,reveal,note}) => (
  <div style={{
    position:'absolute',left:x,top:y,width,transform:'translateX(-50%) translateY('+(1-reveal)*8+'px)',
    border:'1.5px solid rgba(87,131,188,.43)',borderRadius:17,padding:'14px 10px 12px',
    background:'linear-gradient(180deg,rgba(7,19,34,.94),rgba(3,9,19,.97))',
    boxShadow:'0 14px 32px rgba(0,0,0,.2)',textAlign:'center',zIndex:4,
    opacity:reveal*.58,filter:'saturate(.55)',fontFamily:AT_FONT
  }}>
    <div style={{color:'#DCEAF9',fontSize:17,fontWeight:740,lineHeight:1.15}}>{title}</div>
    {note?<div style={{color:'#7893B0',fontSize:11,marginTop:8,letterSpacing:'.065em'}}>{note}</div>:null}
  </div>
);

export const ReadyNotSentYoutubePreview:React.FC<Props> = ({showGuides,anchors={}}) => {
  const frame=useCurrentFrame();
  const continuationFrame=SHOT01_DURATION_FRAMES+SHOT02_DURATION_FRAMES+frame;
  const at=(key:string,fallbackFrame:number) => Number.isFinite(anchors[key])
    ? Math.max(0,Math.round(anchors[key]*30)) : fallbackFrame;
  const cue={
    request:at('REQUEST_ASSEMBLY',SHOT03.reaffirm.request),
    payload:at('PAYLOAD',SHOT03.reaffirm.payload),
    headers:at('HEADERS',SHOT03.reaffirm.headers),
    context:at('REQUEST_CONTEXT',SHOT03.reaffirm.context),
    messageReady:at('MESSAGE_READY',SHOT03.insight.readyNotReceived),
    clientSide:at('YOUR_SIDE',SHOT03.insight.clientSide),
    spinner:at('SPINNER',SHOT03.insight.spinner),
    disabled:at('DISABLED',SHOT03.insight.disabled),
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
  const cameraScale=1-.18*overview;
  const cameraX=205*(1-overview);
  const cameraY=14*(1-overview);
  const payloadActivity=focus(frame,cue.payload,50);
  const headersActivity=focus(frame,cue.headers,50);
  const contextActivity=focus(frame,cue.context,54);
  const phoneFocus=focus(frame,cue.spinner,126);
  const networkReveal=enter(frame,cue.network,cue.network+26);
  const gatewayReveal=enter(frame,cue.gateway,cue.gateway+19);
  const balancerReveal=enter(frame,cue.balancer,cue.balancer+19);
  const authReveal=enter(frame,cue.auth,cue.auth+19);
  const databaseReveal=enter(frame,cue.database,cue.database+19);
  const insight=enter(frame,cue.conclusion,cue.conclusion+17);
  const quiet=Math.min(.6,overview*.46);
  const requestActivity=.17+Math.max(payloadActivity,headersActivity,contextActivity)*.28;

  return (
    <ATBackground>
      <ATCameraRig x={cameraX} y={cameraY} scale={cameraScale} zIndex={4}>
        <ATCameraRig x={-590} y={-20} scale={.73} opacity={.78-overview*.12} zIndex={2}>
          <ATSecondaryStack
            frame={continuationFrame}
            intent={1}
            height={565}
            panelTop={30}
            connectorHeight={20}
            sections={[
              {title:'Login Intent',items:[
                {label:'Validate',activity:0,activationStart:0,activationEnd:1},
                {label:'Submit',activity:0,activationStart:0,activationEnd:1},
              ],reveal:1,divider:1},
              {title:'Credential Input',items:[
                {label:'Identifier',activity:0,activationStart:0,activationEnd:1},
                {label:'Secret',activity:0,activationStart:0,activationEnd:1},
              ],reveal:1,divider:1},
              {title:'Local UI State',items:[
                {label:'Submitting',activity:0,activationStart:0,activationEnd:1},
                {label:'Waiting',activity:0.2,activationStart:0,activationEnd:1},
              ],reveal:1,divider:0},
            ]}
          />
        </ATCameraRig>

        <div style={{
          position:'absolute',left:380,top:730,width:230,height:300,transform:'translate(-50%,-50%)',
          borderRadius:'50%',background:'radial-gradient(ellipse,rgba(20,201,193,'+(.065+phoneFocus*.17)+'),transparent 70%)',
          filter:'blur(15px)',pointerEvents:'none',zIndex:2
        }}/>
        <ATCameraRig x={-580} y={-20} scale={.68} zIndex={4}>
          <ATPhone
            frame={continuationFrame} reveal={1} credential={1} ui={1}
            emailValue="user@example.com" passwordDots={'•'.repeat(8)}
            emailFocus={0} passwordFocus={0} localUi={1} press={0} waiting={1} spinner={1}
          />
        </ATCameraRig>

        <ATFlowArrow
          frame={0} reveal={1} activity={.18}
          startX={506} startY={780} endX={675} endY={780}
        />

        <ATPrimaryNode
          title="Request Assembly" reveal={1} active={requestActivity}
          left={820} top={579} width={270} height={240} visualScale={1.0}
          quiet={quiet} micro
        >
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <ATMiniWorld
              title="Payload" reveal={1} activity={payloadActivity}
              micro tags={['JSON','Form']}
              items={[{label:'Identity',activity:payloadActivity*.38},{label:'Secret',activity:payloadActivity*.38}]}
            />
            <ATMiniWorld
              title="Headers" reveal={1} activity={headersActivity}
              micro items={[{label:'User-Agent',activity:headersActivity*.38},{label:'Accept',activity:headersActivity*.38}]}
            />
            <ATMiniWorld
              title="Request Context" reveal={1} activity={contextActivity}
              micro items={[{label:'Timestamp',activity:contextActivity*.38},{label:'Source',activity:contextActivity*.38}]}
            />
          </div>
        </ATPrimaryNode>

        <div style={{
          position:'absolute',left:961,top:705,width:52,height:48,zIndex:9,
          opacity:enter(frame,cue.messageReady,cue.messageReady+18),
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>
          <div style={{
            width:23,height:16,background:'rgba(23,168,138,.85)',
            border:'1px solid rgba(104,255,213,.8)',borderRadius:4,
            boxShadow:'0 0 16px rgba(25,220,173,.25)',
          }}/>
        </div>

        <div style={{
          position:'absolute',left:994,top:727,width:142,height:0,
          borderTop:'2px dashed rgba(76,112,145,.34)',opacity:networkReveal*.8,zIndex:3,
        }}/>
        <div style={{
          position:'absolute',left:1040,top:748,fontFamily:AT_FONT,fontSize:11,
          letterSpacing:'.09em',fontWeight:740,color:'#728EA9',opacity:networkReveal*.8,
        }}>NO TRANSIT YET</div>

        <SilentNode title="Network / Transit" x={1194} y={674} width={164} reveal={networkReveal} note="WAITING"/>
        <div style={{
          position:'absolute',left:1278,top:717,width:55,height:0,
          borderTop:'1.5px dashed rgba(91,129,158,.29)',opacity:gatewayReveal,
        }}/>
        <SilentNode title="API Gateway" x={1396} y={678} width={134} reveal={gatewayReveal} note="NO REQUEST"/>
        <div style={{
          position:'absolute',left:1464,top:718,width:29,height:0,
          borderTop:'1.5px dashed rgba(91,129,158,.27)',opacity:balancerReveal,
        }}/>
        <SilentNode title="Load Balancer" x={1564} y={678} width={144} reveal={balancerReveal} note="NO REQUEST"/>
        <div style={{
          position:'absolute',left:1637,top:718,width:25,height:0,
          borderTop:'1.5px dashed rgba(91,129,158,.27)',opacity:authReveal,
        }}/>
        <SilentNode title="Auth Service" x={1740} y={678} width={128} reveal={authReveal} note="NO REQUEST"/>
        <div style={{
          position:'absolute',left:1806,top:718,width:23,height:0,
          borderTop:'1.5px dashed rgba(91,129,158,.27)',opacity:databaseReveal,
        }}/>
        <SilentNode title="User Database" x={1906} y={678} width={145} reveal={databaseReveal} note="NO REQUEST"/>
      </ATCameraRig>

      <div style={{
        position:'absolute',left:0,right:0,bottom:100,textAlign:'center',
        fontFamily:AT_FONT,fontSize:26,fontWeight:760,letterSpacing:'.04em',
        color:'#D9E8FA',opacity:insight*.94,
        textShadow:'0 0 24px rgba(107,159,211,.16)',zIndex:12,
      }}>READY ≠ SENT</div>
      <div style={{
        position:'absolute',left:0,right:0,bottom:74,textAlign:'center',
        fontFamily:AT_FONT,fontSize:13,fontWeight:650,letterSpacing:'.12em',
        color:'#7897B5',opacity:insight*.7,zIndex:12,
      }}>THE BACKEND HAS NOT RECEIVED THE REQUEST</div>

      {showGuides?<div style={{
        position:'absolute',inset:40,border:'1px dashed rgba(255,255,255,.2)',pointerEvents:'none',zIndex:30,
      }}/>:null}
    </ATBackground>
  );
};
