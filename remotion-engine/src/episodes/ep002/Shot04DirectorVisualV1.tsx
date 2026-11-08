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
  shot04QueueDepth,shot04ReplicaPhase,
} from './Shot04VisualContract';
import {
  SHOT03_PRE_DB_WAIT_ZONE,shot03ApproachPosition,
  shot03BlendHex,shot03CongestionColor,
} from './Shot03VisualContract';

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
  const original=shot02DatabaseColors(.9);
  const red=shot03CongestionColor(1);
  const pal={
    border:red,
    glow:shot03BlendHex(original.glow,red,.94),
    core:shot03BlendHex(original.core,'#47202A',.92),
  };
  const heartbeat=.80+.20*Math.sin(frame*.06)**2;
  return <div style={{...fixed(n),...panel(pal.border,'rgba(255,59,48,.5)'),
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
      background:'rgba(6,25,43,.79)',color:'#FFE1DA',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:16,fontWeight:820}}>SATURATED · RUNNING</div>
    <div style={{position:'absolute',bottom:8,left:0,right:0,
      color:MINT,fontWeight:750,fontSize:12,textAlign:'center'}}>● STILL COMPLETING</div>
  </div>;
};

const HealthSemantics:React.FC<{
  liveness:number;readiness:number;endToEnd:number;
}>=({liveness,readiness,endToEnd})=>{
  const items=[
    {id:'LIVENESS',description:'Does this application need restarting?',visible:liveness},
    {id:'READINESS',description:'Should this instance receive new requests?',visible:readiness},
  ];
  return <div style={{position:'absolute',...SHOT04_TEXT_AREAS.semantics,
    zIndex:24,display:'flex',gap:18,pointerEvents:'none',
    fontFamily:AT_FONT}}>
    {items.map(item=><div key={item.id} style={{
      flex:1,minWidth:0,boxSizing:'border-box',
      padding:'19px 18px 17px',height:138,
      borderLeft:'3px solid '+MINT,borderRadius:'0 14px 14px 0',
      background:'linear-gradient(90deg,rgba(12,49,59,.77),rgba(6,23,36,.31))',
      boxShadow:'inset 0 1px 0 rgba(145,255,227,.1)',
      opacity:item.visible,
      transform:'translateY('+((1-item.visible)*11)+'px)',
    }}>
      <div style={{color:'#8FFFE0',fontWeight:850,
        letterSpacing:'.10em',fontSize:16}}>{item.id}</div>
      <div style={{color:WHITE,fontSize:19,lineHeight:1.4,
        fontWeight:700,marginTop:12}}>
        {item.description}
      </div>
      <div style={{width:70,height:2,marginTop:13,
        background:MINT,transformOrigin:'left',
        transform:'scaleX('+(0.65+.35*endToEnd)+')',
        opacity:.42+.32*endToEnd}}/>
    </div>)}
  </div>;
};

const Paths:React.FC<{frame:number;focus:number;blocked:number}>=
({frame,focus,blocked})=>{
  const db=SHOT02_DATABASE_ENTRY;
  const red=shot03CongestionColor(1);
  const queueDepth=shot04QueueDepth(frame);
  const fade=(t:number)=>clamp(Math.min(t,1-t)*10);
  const queueFocus=.81+.19*shot04Ease(frame,blocked,70);
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,zIndex:4,
      overflow:'visible',pointerEvents:'none'}}>
    <path d="M485 532 L521 532 M779 532 L804 532"
      fill="none" stroke="#4FC5E7" strokeWidth="3.6" opacity=".69"
      strokeLinecap="round"/>
    {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>{
      const entry=SHOT02_BALANCER_EXIT;
      const authStart={x:SHOT02_AUTH_CARD_LEFT,y:replica.y};
      const authEnd={x:SHOT02_AUTH_CARD_RIGHT,y:replica.y};
      const branchControl1={x:1090,y:entry.y};
      const branchControl2={x:1137,y:replica.y};
      const lookupControl1={x:1505,y:replica.y};
      const lookupControl2={x:1540,y:db.y};
      const branch='M'+entry.x+' '+entry.y+' C'+branchControl1.x+' '+
        branchControl1.y+' '+branchControl2.x+' '+branchControl2.y+
        ' '+authStart.x+' '+authStart.y;
      const lookup='M'+authEnd.x+' '+authEnd.y+' C'+
        lookupControl1.x+' '+lookupControl1.y+' '+
        lookupControl2.x+' '+lookupControl2.y+' '+db.x+' '+db.y;
      return <g key={replica.id}>
        <path d={branch} fill="none" stroke="#3A7797"
          strokeWidth="8" opacity=".45"/>
        <path d={branch} fill="none" stroke="#6BE6F0"
          strokeWidth="3.8" opacity=".85"/>
        <path d={lookup} fill="none" stroke="#7E343B"
          strokeWidth="8" opacity=".34"/>
        <path d={lookup} fill="none" stroke={red}
          strokeWidth="3.8" opacity=".72"/>
        {Array.from({length:4},(_,packet)=>{
          const t=shot04ReplicaPhase(frame,i,packet);
          const at=shot02CubicPoint(t,entry,branchControl1,branchControl2,authStart);
          const tx=shot04ReplicaPhase(frame*.64,i,packet+1);
          const approach=shot03ApproachPosition(tx,.88);
          const to=shot02CubicPoint(
            approach,authEnd,lookupControl1,lookupControl2,db);
          return <g key={packet}>
            <circle cx={at.x} cy={at.y}
              r={SHOT02_LOGIN_PARTICLE.radius}
              fill={SHOT02_LOGIN_PARTICLE.fill}
              opacity={fade(t)*(.75+.25*focus)}
              style={{filter:SHOT02_LOGIN_PARTICLE.glow}}/>
            <circle cx={to.x} cy={to.y}
              r={SHOT02_LOGIN_PARTICLE.radius*.84}
              fill={red} opacity={fade(tx)*queueFocus}
              style={{filter:'drop-shadow(0 0 8px rgba(255,59,48,.8))'}}/>
          </g>;
        })}
      </g>;
    })}
    <rect x={SHOT03_PRE_DB_WAIT_ZONE.left}
      y={SHOT03_PRE_DB_WAIT_ZONE.top}
      width={SHOT03_PRE_DB_WAIT_ZONE.width}
      height={SHOT03_PRE_DB_WAIT_ZONE.height}
      rx="23" fill={red} fillOpacity=".13"
      stroke={red} strokeWidth="2.8" strokeOpacity=".7"
      style={{filter:'drop-shadow(0 0 20px rgba(255,59,48,.48))'}}/>
    {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>
      Array.from({length:queueDepth},(_,packet)=>{
        const x=SHOT03_PRE_DB_WAIT_ZONE.left+53-(packet%6)*8.3+
          Math.sin(frame*.041+packet*1.7+i)*.7;
        const y=replica.y-9+Math.floor(packet/6)*11.5;
        return <circle key={i+'-'+packet}
          cx={x} cy={y} r={5.1}
          fill={red} opacity={.74+.22*Math.sin(frame*.031+packet)**2}
          style={{filter:'drop-shadow(0 0 6px '+red+')'}}/>;
      })
    )}
    <path d="M1823 509 L1856 509" fill="none"
      stroke="#6FECD4" strokeWidth="3.6" opacity=".84"/>
    {[0,1].map(i=>{
      const t=shot04ReplicaPhase(frame*.55,0,i);
      return <circle key={i} cx={1823+33*t} cy={509}
        r={SHOT02_LOGIN_PARTICLE.radius*.74}
        fill={MINT} opacity={fade(t)*.83}
        style={{filter:'drop-shadow(0 0 7px '+MINT+')'}}/>;
    })}
  </svg>;
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
  const healthStart=shot04Ease(frame,cues.HEALTH_CHECKS,22);
  const live=shot04Ease(frame,cues.LIVENESS_PROBE,19);
  const ready=shot04Ease(frame,cues.READINESS_PROBE,19);
  const real=shot04Ease(frame,cues.REAL_LOGIN,30);
  const availability=shot04Ease(frame,cues.SERVICE_AVAILABILITY,22);
  const endToEnd=shot04Ease(frame,cues.END_TO_END_CHECK,25);
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
      <Auth frame={frame} probe={Math.max(healthStart,live,ready)}/>
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
    <HealthSemantics liveness={live} readiness={ready} endToEnd={endToEnd}/>
    <div style={{position:'absolute',left:575,top:744,width:422,height:44,
      zIndex:24,opacity:availability,fontFamily:AT_FONT,
      color:AMBER,fontSize:17,fontWeight:830,letterSpacing:'.045em'}}>
      SERVICE AVAILABILITY · NOT PROVEN
    </div>
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
