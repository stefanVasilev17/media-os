import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,ATControlledRealismLayer,AT_FONT}
  from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {SHOT02_NODES} from './Shot02PremiumLayout';
import {
  SHOT02_AUTH_REPLICA_PORTS,SHOT02_AUTH_CARD_LEFT,SHOT02_AUTH_CARD_RIGHT,
  SHOT02_DATABASE_ENTRY,SHOT02_BALANCER_EXIT,
  SHOT02_LOGIN_PARTICLE,shot02CubicPoint,
  shot02DatabaseColors,
} from './Shot02PressureVisuals';
import {
  SHOT04_TEXT_AREAS,shot04Ease,validateShot04Source,
  assertShot04SafeLayout,type Shot04SceneProps,shot04StatusPalette,
} from './Shot04VisualContract';

const WHITE='#F5FCFF';
const CYAN='#68E5FF';
const MINT=shot04StatusPalette.healthy;
const AMBER=shot04StatusPalette.waiting;
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const fixed=(n:{x:number;y:number;width:number;height:number})=>({
  position:'absolute' as const,left:n.x-n.width/2,top:n.y,
  width:n.width,height:n.height,boxSizing:'border-box' as const,
});
const panel=(border:string,glow:string)=>({
  border:'2px solid '+border,borderRadius:21,
  background:'linear-gradient(145deg,rgba(8,32,53,.99),rgba(3,15,30,.998))',
  boxShadow:'0 0 28px '+glow+',inset 0 1px 0 rgba(255,255,255,.12)',
  boxSizing:'border-box' as const,
});
const nodeLabel=(text:string)=>(
  <div style={{fontWeight:830,fontSize:25,color:WHITE}}>{text}</div>
);

const Gateway:React.FC<{active:number}>=({active})=>{
  const n=SHOT02_NODES.gateway;
  return <div style={{...fixed(n),...panel('#64DFFF','rgba(52,205,248,.27)'),
    zIndex:8,padding:'25px 20px',fontFamily:AT_FONT}}>
    {nodeLabel('API Gateway')}
    <div style={{marginTop:18,fontSize:16,color:MINT,fontWeight:760}}>
      ● ONLINE
    </div>
    <div style={{marginTop:32,paddingTop:13,borderTop:'1px solid #397A9B',
      display:'flex',justifyContent:'space-between',fontSize:21,color:WHITE,
      fontWeight:730}}>
      REQUEST ENTRY <span style={{fontSize:26,color:CYAN}}>→</span>
    </div>
    <div style={{fontSize:14,color:'#A9D5E8',marginTop:14,
      opacity:.7+.3*active}}>Requests continue to arrive</div>
  </div>;
};

const Balancer:React.FC=()=>{
  const n=SHOT02_NODES.balancer;
  return <div style={{...fixed(n),...panel('#64DFFF','rgba(52,205,248,.23)'),
    zIndex:8,padding:'25px 18px',fontFamily:AT_FONT}}>
    {nodeLabel('Load Balancer')}
    <div style={{marginTop:19,color:MINT,fontSize:16,fontWeight:730}}>● ROUTING</div>
    <div style={{borderTop:'1px solid #397A9B',marginTop:24,
      paddingTop:12,fontSize:20,color:WHITE}}>3 Auth replicas</div>
    <div style={{display:'flex',gap:7,marginTop:18}}>
      {[0,1,2].map(i=><div key={i} style={{width:61,height:12,
        background:CYAN,borderRadius:9,boxShadow:'0 0 9px rgba(88,230,250,.32)'}}/>)}
    </div>
    <div style={{marginTop:12,fontSize:14,color:'#A9D5E8'}}>Traffic stays routed</div>
  </div>;
};

const Auth:React.FC<{frame:number;probe:number}>=({frame,probe})=>{
  const n=SHOT02_NODES.auth;
  return <div style={{...fixed(n),...panel('#9184FF','rgba(125,111,255,.29)'),
    zIndex:8,fontFamily:AT_FONT,
    background:'linear-gradient(150deg,rgba(11,22,50,.99),rgba(4,13,34,.998))'}}>
    <div style={{position:'absolute',top:18,left:0,right:0,textAlign:'center',
      fontSize:27,fontWeight:840,color:WHITE}}>Auth Service</div>
    {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>(
      <div key={replica.id} style={{position:'absolute',
        left:SHOT02_AUTH_CARD_LEFT-(n.x-n.width/2),top:replica.y-n.y-35,
        width:SHOT02_AUTH_CARD_RIGHT-SHOT02_AUTH_CARD_LEFT,height:70,
        border:'2px solid #498CB7',borderRadius:12,
        background:'linear-gradient(140deg,rgba(10,47,71,.99),rgba(5,26,48,.99))',
        boxShadow:'0 0 9px rgba(55,202,252,.18)',
        display:'flex',justifyContent:'space-between',alignItems:'center',
        padding:'0 16px',boxSizing:'border-box'}}>
        <div style={{display:'flex',gap:11,alignItems:'center'}}>
          <span style={{height:12,width:12,borderRadius:3,
            background:MINT,boxShadow:'0 0 11px rgba(115,255,208,.5)'}}/>
          <span style={{fontSize:24,fontWeight:810,color:WHITE}}>{replica.id}</span>
        </div>
        <div style={{display:'flex',gap:5}}>
          {[0,1,2].map(k=><span key={k} style={{width:5,height:12,borderRadius:3,
            background:k<2?'#68E5FF':'#30516D',
            opacity:.82+.18*Math.sin(frame*.03+i+k)}}/>)}
        </div>
      </div>
    ))}
    <div style={{position:'absolute',right:14,top:15,height:9,width:9,
      borderRadius:9,background:MINT,opacity:.72+.28*probe,
      boxShadow:'0 0 12px '+MINT}}/>
  </div>;
};

const Database:React.FC<{frame:number}>=({frame})=>{
  const n=SHOT02_NODES.database;
  const pal=shot02DatabaseColors(.77);
  const heartbeat=.80+.20*Math.sin(frame*.06)**2;
  return <div style={{...fixed(n),...panel(pal.border,'rgba(241,144,68,.43)'),
    borderWidth:3,zIndex:9,fontFamily:AT_FONT,
    background:'linear-gradient(150deg,rgba(9,26,44,.995),'+pal.core+')'}}>
    <div style={{marginTop:21,fontSize:27,fontWeight:840,color:WHITE,
      textAlign:'center'}}>User Database</div>
    <svg width="88" height="80" viewBox="0 0 88 79" fill="none"
      style={{display:'block',margin:'17px auto 0',
        filter:'drop-shadow(0 0 '+(7*heartbeat)+'px '+pal.glow+')'}}>
      <ellipse cx="44" cy="16" rx="27" ry="11" stroke={pal.border} strokeWidth="3.8"/>
      <path d="M17 16V60Q44 78 71 60V16M17 37Q44 55 71 37"
        stroke={pal.border} strokeWidth="3.8"/>
      <ellipse cx="44" cy="60" rx="27" ry="11" stroke={pal.border} strokeWidth="3.8"/>
    </svg>
    <div style={{margin:'17px 13px 0',height:44,borderRadius:10,
      border:'1.7px solid '+pal.border,
      background:'rgba(6,25,43,.79)',color:'#FFD8AB',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:16,fontWeight:820}}>SATURATED · RUNNING</div>
    <div style={{position:'absolute',bottom:8,left:0,right:0,
      color:MINT,fontWeight:750,fontSize:12,textAlign:'center'}}>● STILL COMPLETING</div>
  </div>;
};

const Probe:React.FC<{
  left:number;label:string;focus:number;visible:number;
}>=({left,label,focus,visible})=><div style={{
    position:'absolute',left,top:680,width:193,height:40,
    border:'2px solid '+MINT,borderRadius:11,
    background:'linear-gradient(135deg,rgba(13,61,55,.98),rgba(7,31,39,.98))',
    boxShadow:'0 0 '+(10+15*focus)+'px rgba(90,255,173,'+(.19+.23*focus)+')',
    display:'flex',alignItems:'center',justifyContent:'center',gap:8,
    zIndex:22,opacity:visible,
    fontFamily:AT_FONT,fontSize:15,fontWeight:850,color:'#CEFFE5',
    transform:'translateY('+((1-visible)*9)+'px)',
  }}>
    <span style={{fontSize:20,color:MINT}}>✓</span>{label}
  </div>;

const Paths:React.FC<{frame:number;focus:number;blocked:number}>=
({frame,focus,blocked})=>{
  const link=['M485 532 L521 532','M779 532 L804 532',
    'M1050 535 C1094 535 1128 412 1192 412',
    'M1050 535 C1108 535 1150 498 1192 498',
    'M1050 535 C1094 535 1128 584 1192 584',
    'M1460 412 C1504 412 1530 509 1582 509',
    'M1460 498 C1515 498 1539 509 1582 509',
    'M1460 584 C1504 584 1530 509 1582 509'];
  const t=frame*.023;
  const requestProgress=clamp(((frame%120)+120)%120/120);
  const entering=shot02CubicPoint(requestProgress,
    SHOT02_BALANCER_EXIT,{x:1090,y:535},{x:1136,y:498},
    {x:SHOT02_AUTH_CARD_LEFT,y:498});
  const stalled=shot02CubicPoint(
    Math.min(.77,.5+.27*shot04Ease(frame,blocked,35)),
    {x:SHOT02_AUTH_CARD_RIGHT,y:498},{x:1506,y:498},
    {x:1540,y:509},SHOT02_DATABASE_ENTRY);
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,zIndex:4,pointerEvents:'none'}}>
    <defs>
      <filter id="shot04Glow"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    {link.map((d,i)=><path key={i} d={d} fill="none"
      stroke={i>4?'#F2A15D':'#3F8AA6'} strokeWidth={i>4?4:3.6}
      strokeLinecap="round" opacity={i>4?.65:.63}/>)}
    {[0,1,2].map(i=><circle key={i}
      cx={entering.x-((i*45)%85)} cy={entering.y}
      r={SHOT02_LOGIN_PARTICLE.radius}
      fill={SHOT02_LOGIN_PARTICLE.fill}
      opacity={.50+.45*focus}
      style={{filter:SHOT02_LOGIN_PARTICLE.glow}}/>)}
    {[0,1,2,3].map(i=><circle key={i}
      cx={stalled.x-i*15} cy={stalled.y+(i%2?4:-4)}
      r={SHOT02_LOGIN_PARTICLE.radius*.84}
      fill={i>=2?'#F4A45A':'#F4BC76'}
      opacity={.5+.46*shot04Ease(frame,blocked,28)}
      style={{filter:'drop-shadow(0 0 8px rgba(246,145,73,.66))'}}/>)}
    <path d="M1552 509 L1569 509" stroke="#F7B66C"
      strokeWidth="4" strokeLinecap="round" opacity={.3+.7*focus}
      strokeDasharray="5 6"/>
    <circle cx="1829" cy="509" r="6" fill={MINT}
      opacity={.52+.25*Math.sin(t*4)}
      style={{filter:'drop-shadow(0 0 7px '+MINT+')'}}/>
  </svg>;
};

const Journey:React.FC<{show:number}>=
({show})=>{
  const d=SHOT04_TEXT_AREAS.journey;
  const sequence=['PHONE','GATEWAY','BALANCER','AUTH','DATABASE','RESPONSE'];
  return <div style={{position:'absolute',...d,zIndex:24,
    ...panel('#E7A365','rgba(237,148,85,.21)'),fontFamily:AT_FONT,
    padding:'15px 23px',opacity:show,
    transform:'translateY('+((1-show)*13)+'px)'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{fontSize:17,fontWeight:850,color:WHITE,letterSpacing:'.07em'}}>
        LOGIN JOURNEY
      </div>
      <div style={{fontSize:15,fontWeight:850,color:'#FFD09B',
        textShadow:'0 0 12px rgba(236,132,81,.34)'}}>NOT COMPLETED</div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      marginTop:15,gap:5}}>
      {sequence.map((step,i)=><React.Fragment key={step}>
        <span style={{fontSize:14,fontWeight:770,letterSpacing:'.03em',
          color:i>=4?'#F7C58E':'#C0EDF6',
          opacity:i===5?.45:1}}>{step}</span>
        {i<5?<span style={{fontSize:17,fontWeight:800,
          color:i>=4?AMBER:CYAN,opacity:i===4?.55:1}}>
          {i===4?'×':'→'}
        </span>:null}
      </React.Fragment>)}
    </div>
  </div>;
};

export const Shot04DirectorVisualV1:React.FC<Shot04SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT04_REQUIRES_1920X1080_30FPS_MEASURED_VOICE_FRAMES');
  const {terms}=validateShot04Source(props);
  assertShot04SafeLayout();
  const cues=Object.fromEntries(terms.map(t=>[t.id,t.startFrame])) as
    Record<(typeof terms)[number]['id'],number>;
  const title=shot04Ease(frame,8,20);
  const probes=shot04Ease(frame,cues.HEALTH_CHECKS,22);
  const live=shot04Ease(frame,cues.LIVENESS_PROBE,17);
  const ready=shot04Ease(frame,cues.READINESS_PROBE,17);
  const real=shot04Ease(frame,cues.REAL_LOGIN,30);
  const availability=shot04Ease(frame,cues.SERVICE_AVAILABILITY,22);
  const journey=shot04Ease(frame,cues.END_TO_END_CHECK,25);
  const conclusion=shot04Ease(frame,cues.ALIVE_NOT_AVAILABLE,18);
  const cameraShift=5*shot04Ease(frame,cues.REAL_LOGIN,40)
    -4*shot04Ease(frame,cues.SPINNER,40);
  return <ATBackground>
    <ATControlledRealismLayer frame={frame} realism={.96}
      architectureReveal={.96}/>
    <div style={{position:'absolute',...SHOT04_TEXT_AREAS.brand,
      zIndex:28,color:'#A6D6F3',fontFamily:AT_FONT,
      fontSize:17,fontWeight:710,letterSpacing:'.20em'}}>
      ARCHITECTURAL THINKING
    </div>
    <div style={{position:'absolute',left:66,top:86,width:340,height:1,
      zIndex:25,background:'linear-gradient(90deg,rgba(95,204,255,.66),transparent)'}}/>
    <div style={{position:'absolute',...SHOT04_TEXT_AREAS.heading,
      zIndex:27,fontFamily:AT_FONT,
      opacity:title,transform:'translateX('+((1-title)*-22)+'px)'}}>
      <div style={{fontSize:15,color:'#91BDE0',fontWeight:760,
        letterSpacing:'.17em'}}>COMPONENT HEALTH · USER AVAILABILITY</div>
      <div style={{fontSize:36,color:WHITE,fontWeight:870,
        marginTop:10,lineHeight:1.2}}>ALIVE IS NOT AVAILABLE</div>
      <div style={{width:385,height:2,marginTop:17,
        background:'linear-gradient(90deg,#68D9F5,transparent)',
        transform:'scaleX('+title+')',transformOrigin:'left center'}}/>
    </div>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:5,
      transform:'translate3d('+cameraShift+'px,0,0) scale(1.0)',
      transformOrigin:'58% 45%'}}>
      <Paths frame={frame} focus={Math.max(real,.3)} blocked={cues.REAL_LOGIN}/>
      <Gateway active={real}/>
      <Balancer/>
      <Auth frame={frame} probe={Math.max(live,ready)}/>
      <Database frame={frame}/>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:12,
      transform:'translate3d(-680px,-150px,0) scale(1.11)',
      transformOrigin:'50% 50%'}}>
      <Shot02PressurePhone frame={frame} reveal={1} credential={.22} ui={0}
        emailValue="user@example.com" passwordDots="••••••••"
        emailFocus={0} passwordFocus={0} localUi={0}
        press={0} pressStartFrame={Number.POSITIVE_INFINITY}
        waiting={1} spinner={1} pressure={.70} realism={1} heroPush={0}/>
    </AbsoluteFill>
    <Probe left={1138} label="LIVENESS PASS" focus={live} visible={probes}/>
    <Probe left={1341} label="READINESS PASS" focus={ready} visible={probes}/>
    <div style={{position:'absolute',...SHOT04_TEXT_AREAS.shallowNote,
      zIndex:25,textAlign:'center',fontFamily:AT_FONT,
      fontSize:14,fontWeight:780,letterSpacing:'.025em',
      color:'#E6C8A1',opacity:Math.max(live,ready)}}>
      Illustrative shallow probes · Database not checked
    </div>
    <div style={{position:'absolute',left:1417,top:649,width:218,
      zIndex:25,fontFamily:AT_FONT,fontSize:14,fontWeight:850,
      color:AMBER,opacity:real,textAlign:'center'}}>
      USER LOOKUP WAITING
    </div>
    <div style={{position:'absolute',left:575,top:731,width:452,height:44,
      zIndex:24,opacity:availability,fontFamily:AT_FONT,
      color:AMBER,fontSize:17,fontWeight:830,letterSpacing:'.045em'}}>
      SERVICE AVAILABILITY · NOT PROVEN
    </div>
    <Journey show={journey}/>
    <div style={{position:'absolute',...SHOT04_TEXT_AREAS.conclusion,zIndex:30,
      ...panel('#E6AA64','rgba(236,154,81,.23)'),fontFamily:AT_FONT,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:33,fontWeight:850,color:'#FFE1B8',whiteSpace:'nowrap',
      opacity:conclusion,
      transform:'translateY('+((1-conclusion)*14)+'px)'}}>
      Being alive is not the same as being available.
    </div>
  </ATBackground>;
};
