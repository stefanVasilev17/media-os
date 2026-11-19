import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {
  ATBackground,ATCameraRig,ATControlledRealismLayer,
  ATPrimaryNode,ATBackendNode,AT_FONT
} from '../../components/architectural-thinking';
import {SHOT02_NODES} from '../ep002/Shot02PremiumLayout';
import {
  EP004_V3_LAYOUT,EP004_V3_ROUTES,EP004_V3_ROUTE_STYLE,
  ep004V3Phase,ep004V3Path,ep004V3ValidateLayout
} from '../../../ep004-shot01-inherited-world-v3.mjs';
import {ep004Shot01Validate} from '../../components/architectural-thinking/EP004Shot01World.mjs';
import type {Ep004Shot01Props} from '../../components/architectural-thinking/EP004Shot01World.mjs';
import type {V3State} from '../../../ep004-shot01-inherited-world-v3.mjs';

const CYAN='#68E5FF',MINT='#6FECD4',AMBER='#F5A55A';
const WHITE='#F5FCFF',SOFT='#B5D2E6';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

const NodeRichness:React.FC<{state:V3State}>=({state})=>{
  const s=state;
  const gateway=SHOT02_NODES.gateway;
  const router=SHOT02_NODES.balancer;
  const pulse=.5+.5*Math.sin(state.worldFrame*.035);
  const echo=state.endpointEcho;
  const serviceLight=echo>.12?
    Math.sin(state.worldFrame*.05)>0?AMBER:'#CD7378':MINT;
  return <>
    <ATBackendNode
      title="Gateway" x={gateway.x} y={gateway.y} width={gateway.width}
      height={gateway.height} reveal={s.revealGateway}
      active={0} quiet={.06} sections={[]}
      gatewayIntro={{
        frame:s.worldFrame,arrival:0,
        inspection:.15+.42*s.wait
      }}
    />
    <ATBackendNode
      title="Traffic Router" x={router.x} y={router.y}
      width={router.width} height={router.height}
      reveal={s.revealRouter} active={0} quiet={.10} sections={[]}
      balancerIntro={{
        frame:s.worldFrame,arrival:0,selected:0,
        flow:0,handoff:0,unhealthy:0
      }}
    />
    <ATPrimaryNode
      title="Mail Services" left={EP004_V3_LAYOUT.mailboxFleet.x}
      top={EP004_V3_LAYOUT.mailboxFleet.y}
      width={EP004_V3_LAYOUT.mailboxFleet.width}
      height={EP004_V3_LAYOUT.mailboxFleet.height}
      compact reveal={s.revealFleet} active={0} quiet={.18} zIndex={8}>
      <div style={{
        display:'flex',alignItems:'center',gap:12,
        fontFamily:AT_FONT,fontSize:20,fontWeight:720,color:SOFT,
        marginBottom:13
      }}>
        <span style={{width:11,height:11,borderRadius:11,
          background:CYAN,boxShadow:'0 0 11px rgba(104,229,255,.42)'}}/>
        Schematic endpoints
      </div>
      {[0,1,2].map(i=><div key={i} style={{
        display:'flex',alignItems:'center',gap:16,
        minHeight:61,borderBottom:'1px solid rgba(96,150,190,.24)',
        opacity:i===2?.64:.90
      }}>
        <svg viewBox="0 0 43 34" width={43} height={34}
          style={{flexShrink:0,overflow:'visible'}}>
          <rect x={2} y={3} width={38} height={27} rx={6}
            fill="rgba(11,33,57,.97)"
            stroke={i===0?serviceLight:'#5285A8'} strokeWidth={2}/>
          <path d="M 12 12 H 30 M 12 20 H 25" fill="none"
            stroke={i===0?serviceLight:CYAN} strokeWidth={2.5}
            strokeLinecap="round" opacity={.4+.44*pulse}/>
        </svg>
        <div style={{color:WHITE,fontWeight:760,fontSize:20,
          letterSpacing:'-.01em',fontFamily:AT_FONT}}>
          {'Endpoint '+String.fromCharCode(65+i)}
        </div>
        <span style={{marginLeft:'auto',width:8,height:8,
          borderRadius:'50%',background:i===0?serviceLight:CYAN,
          opacity:i===0?.42+.45*echo:.40,
          boxShadow:i===0?'0 0 7px '+serviceLight:'none'}}/>
      </div>)}
      <div style={{fontFamily:AT_FONT,fontSize:18,color:SOFT,
        marginTop:13}}>Illustrative topology</div>
    </ATPrimaryNode>
    <ATPrimaryNode
      title="Services" left={EP004_V3_LAYOUT.otherServices.x}
      top={EP004_V3_LAYOUT.otherServices.y}
      width={EP004_V3_LAYOUT.otherServices.width}
      height={EP004_V3_LAYOUT.otherServices.height}
      compact reveal={.32+.55*s.revealFleet}
      active={0} quiet={.67} zIndex={7}>
      <div style={{fontFamily:AT_FONT,color:SOFT,
        fontSize:19,fontWeight:670,marginTop:17}}>Other M365 apps</div>
      <div style={{display:'flex',gap:12,marginTop:29,
        alignItems:'center'}}>
        {[0,1,2].map(i=><span key={i} style={{
          display:'block',width:40,height:24,borderRadius:5,
          border:'1.5px solid rgba(84,149,201,.65)',
          background:'rgba(9,36,58,.87)',opacity:.40+.09*i
        }}/>)}
      </div>
      <div style={{fontFamily:AT_FONT,color:SOFT,
        fontSize:18,marginTop:24}}>Not all offline</div>
    </ATPrimaryNode>
  </>;
};

const HumanMailAnchor:React.FC<{state:V3State}>=({state:s})=>{
  const pulse=.5+.5*Math.sin(s.worldFrame*.047);
  return <ATPrimaryNode
    title="Outlook" subtitle="PERSONAL MAILBOX"
    left={EP004_V3_LAYOUT.client.x}
    top={EP004_V3_LAYOUT.client.y}
    width={EP004_V3_LAYOUT.client.width}
    height={EP004_V3_LAYOUT.client.height}
    reveal={1} active={0} quiet={0} zIndex={9}>
    <div style={{
      display:'flex',alignItems:'center',gap:15,
      paddingBottom:20,borderBottom:'1.4px solid rgba(92,160,213,.38)'
    }}>
      <svg width={54} height={54} viewBox="0 0 54 54"
        style={{flexShrink:0}}>
        <rect x={3} y={7} width={48} height={40} rx={10}
          fill="rgba(15,70,109,.60)" stroke={CYAN} strokeWidth={2.5}/>
        <path d="M 11 17 L 27 29 L 43 17 M 11 38 L 23 28 M 43 38 L 31 28"
          fill="none" stroke={MINT} strokeWidth={2.4}
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{fontFamily:AT_FONT}}>
        <div style={{fontSize:28,fontWeight:820,color:WHITE}}>Inbox</div>
        <div style={{fontSize:18,fontWeight:670,color:SOFT}}>
          Everyday work
        </div>
      </div>
    </div>
    <div style={{paddingTop:12}}>
      {[0,1,2,3].map(i=><div key={i} style={{
        height:55,display:'flex',alignItems:'center',gap:14,
        borderBottom:'1px solid rgba(77,139,179,.22)'
      }}>
        <span style={{width:8,height:8,borderRadius:5,
          background:i===0?MINT:'#5B86A8',
          opacity:i===0?.70+.25*pulse:.40}}/>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:9}}>
          <div style={{height:6,width:[206,153,183,165][i],
            borderRadius:5,background:i===0?
            'rgba(185,226,246,.87)':'rgba(122,173,205,.48)'}}/>
          <div style={{height:5,width:[163,190,153,175][i],
            borderRadius:5,background:'rgba(74,129,167,.50)'}}/>
        </div>
      </div>)}
    </div>
    <div style={{display:'flex',justifyContent:'space-between',
      alignItems:'center',marginTop:21}}>
      <div style={{fontFamily:AT_FONT,color:s.wait>.25?AMBER:MINT,
        fontSize:19,fontWeight:840,letterSpacing:'.02em',
        textShadow:s.wait>.25?'0 0 12px rgba(245,165,90,.26)':'none'}}>
        {s.wait>.25?'WAITING…':'OPEN MAILBOX'}
      </div>
      <div style={{width:13,height:13,borderRadius:8,
        background:s.wait>.25?AMBER:CYAN,opacity:.65+.30*pulse,
        boxShadow:'0 0 10px rgba(104,229,255,.43)'}}/>
    </div>
  </ATPrimaryNode>;
};

const WorldRails:React.FC<{state:V3State}>=({state:s})=>{
  const wait=clamp(s.wait);
  const entries=[
    {key:'gatewayToRouter',stroke:CYAN,opacity:.08+.27*s.revealRouter},
    {key:'routerToFleet',stroke:CYAN,opacity:.07+.26*s.revealFleet},
    {key:'standby',stroke:MINT,opacity:.10+.20*s.standbyHighlight}
  ] as const;
  return <>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none'}}>
      <defs>
        <linearGradient id="ep004-v3-mail-line" x1="0" y1="0" x2="1">
          <stop offset="0" stopColor={CYAN}/>
          <stop offset="1" stopColor={wait>.1?AMBER:MINT}/>
        </linearGradient>
      </defs>
      {Object.entries(EP004_V3_ROUTES).map(([key,route])=>
        <path key={'rail'+key} d={ep004V3Path(route)}
          fill="none" stroke="#255574"
          strokeWidth={EP004_V3_ROUTE_STYLE.railWidth+3}
          strokeLinecap="round" opacity={key==='mailbox'?.8:.38}/>)}
      <path d={ep004V3Path(EP004_V3_ROUTES.mailbox)}
        fill="none" stroke="url(#ep004-v3-mail-line)"
        strokeWidth={EP004_V3_ROUTE_STYLE.activeWidth+1.5}
        strokeLinecap="round" opacity={.58+.27*(1-wait)}/>
      {entries.map(e=><path key={'lit'+e.key}
        d={ep004V3Path(EP004_V3_ROUTES[e.key])}
        fill="none" stroke={e.stroke}
        strokeWidth={EP004_V3_ROUTE_STYLE.activeWidth}
        strokeLinecap="round" opacity={e.opacity}/>)}
      <path d={ep004V3Path(EP004_V3_ROUTES.standby)}
        fill="none" stroke={MINT}
        strokeWidth={3} strokeLinecap="round"
        pathLength={1}
        strokeDasharray={String(s.choiceLightProgress)+' 1'}
        opacity={.42*s.standbyHighlight}/>
    </svg>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0,zIndex:15,pointerEvents:'none'}}>
      <circle cx={s.request.x} cy={s.request.y}
        r={EP004_V3_ROUTE_STYLE.packetRadius+3}
        fill={s.requestStatus==='WAITING'?AMBER:CYAN}
        stroke="#D5FBFF" strokeWidth={1.4}
        style={{filter:'drop-shadow(0 0 9px '+(s.requestStatus==='WAITING'?AMBER:CYAN)+')'}}/>
      <circle cx={s.request.x} cy={s.request.y}
        r={18+3*Math.sin(s.worldFrame*.039)**2}
        fill="none" stroke={s.requestStatus==='WAITING'?AMBER:CYAN}
        strokeWidth={1.9} opacity={.14+.20*clamp(s.wait)}/>
    </svg>
  </>;
};

const Ep002PremiumGrid:React.FC=()=>{
  if(SHOT02_NODES.gateway.x!==EP004_V3_LAYOUT.gateway.x
    ||SHOT02_NODES.gateway.y!==EP004_V3_LAYOUT.gateway.y
    ||SHOT02_NODES.balancer.x!==EP004_V3_LAYOUT.router.x
    ||SHOT02_NODES.auth.x!==EP004_V3_LAYOUT.mailboxFleet.x
    ||SHOT02_NODES.database.x!==EP004_V3_LAYOUT.otherServices.x)
    throw Error('EP004_V3_CANONICAL_EP002_COORDINATES_HAVE_DIVERGED');
  return null;
};

export const Ep004Shot01InheritedWorldV3:React.FC<Ep004Shot01Props>=props=>{
  const frame=useCurrentFrame();
  const config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
    ||config.durationInFrames!==props.durationInFrames)
    throw Error('EP004_V3_REQUIRES_EXACT_1080P_30FPS_AND_MEASURED_DURATION');
  ep004Shot01Validate(props);
  ep004V3ValidateLayout();
  const state=ep004V3Phase(frame,props);
  return <ATBackground>
    <ATControlledRealismLayer frame={state.worldFrame}
      realism={.96} architectureReveal={.46}/>
    <Ep002PremiumGrid/>
    <div style={{position:'absolute',left:66,top:40,width:400,
      fontSize:17,fontWeight:710,letterSpacing:'.20em',
      color:'#A6D6F3',zIndex:28,fontFamily:AT_FONT}}>
      ARCHITECTURAL THINKING
    </div>
    <div style={{position:'absolute',left:66,top:86,width:340,height:1,
      background:'linear-gradient(90deg,rgba(95,204,255,.66),transparent)',
      zIndex:28}}/>
    <ATCameraRig x={state.camera.x} y={state.camera.y}
      scale={state.camera.scale}>
      <WorldRails state={state}/>
      <HumanMailAnchor state={state}/>
      <NodeRichness state={state}/>
    </ATCameraRig>
    {props.previewOnly&&<div style={{position:'absolute',bottom:26,
      right:45,zIndex:30,color:SOFT,fontSize:17,
      fontWeight:690,fontFamily:AT_FONT,opacity:.66}}>
      EP004 SHOT01 / TIMING PREVIEW ONLY
    </div>}
  </ATBackground>;
};
