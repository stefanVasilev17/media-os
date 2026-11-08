import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,ATControlledRealismLayer,AT_FONT} from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {
  SHOT02_NODES,
} from './Shot02PremiumLayout';
import {
  SHOT02_AUTH_REPLICA_PORTS,SHOT02_AUTH_CARD_LEFT,SHOT02_AUTH_CARD_RIGHT,
  SHOT02_DATABASE_ENTRY,SHOT02_BALANCER_EXIT,
  SHOT02_GATEWAY_ENTRY,SHOT02_GATEWAY_EXIT,SHOT02_BALANCER_ENTRY,SHOT02_PHONE_PIPE,
  SHOT02_LOGIN_PARTICLE,shot02CubicPoint,shot02DatabaseColors,
} from './Shot02PressureVisuals';
import {
  SHOT03_TEXT_AREAS,SHOT03_OUTPUT_PORT,SHOT03_OUTPUT_END,
  shot03Ease,shot03ArrivalRate,shot03CompletionRate,
  shot03DatabasePressure,shot03WaitingDepth,shot03LatencyBar,shot03FlowClock,
  validateShot03Source,assertShot03SafeLayout,type Shot03SceneProps,
} from './Shot03VisualContract';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const WHITE='#F5FCFF';
const CYAN='#68E5FF';
const MINT='#73FFD0';
const AMBER='#F8BB75';
const NODE_BG='linear-gradient(145deg,rgba(8,32,53,.99),rgba(3,15,30,.998))';
const fixed=(n:{x:number;y:number;width:number;height:number})=>({
  position:'absolute' as const,left:n.x-n.width/2,top:n.y,
  width:n.width,height:n.height,boxSizing:'border-box' as const,
});
const panel=(border:string,glow:string)=>({
  border:'2px solid '+border,borderRadius:21,
  background:NODE_BG,
  boxShadow:'0 0 27px '+glow+',inset 0 1px 0 rgba(255,255,255,.12)',
  boxSizing:'border-box' as const,
});

const GatewayCard:React.FC=()=> {
  const n=SHOT02_NODES.gateway;
  return <div style={{...fixed(n),...panel('#64DFFF','rgba(52,205,248,.28)'),
    zIndex:8,padding:'25px 20px',fontFamily:AT_FONT}}>
    <div style={{fontSize:26,fontWeight:840,color:WHITE}}>API Gateway</div>
    <div style={{marginTop:16,fontSize:17,color:MINT,fontWeight:780}}>● ONLINE</div>
    <div style={{marginTop:26,paddingTop:16,borderTop:'1px solid #397A9B',
      display:'flex',justifyContent:'space-between',fontSize:22,fontWeight:790,
      color:WHITE}}>REQUEST ENTRY <span style={{color:CYAN,fontSize:28}}>→</span></div>
    <div style={{marginTop:12,fontSize:15,color:'#B0D4E8'}}>Login traffic entering</div>
  </div>;
};

const BalancerCard:React.FC=()=>{
  const n=SHOT02_NODES.balancer;
  return <div style={{...fixed(n),...panel('#65DFFF','rgba(60,213,250,.27)'),
    zIndex:8,padding:'26px 19px',fontFamily:AT_FONT}}>
    <div style={{fontSize:24,fontWeight:840,color:WHITE}}>Load Balancer</div>
    <div style={{marginTop:17,fontSize:17,color:MINT,fontWeight:760}}>● ROUTING</div>
    <div style={{marginTop:23,paddingTop:13,borderTop:'1px solid #397A9B',
      fontSize:21,fontWeight:690,color:WHITE}}>3 Auth replicas</div>
    <div style={{display:'flex',gap:7,marginTop:15}}>
      {[0,1,2].map(i=><div key={i} style={{width:60,height:12,
        borderRadius:7,background:CYAN,boxShadow:'0 0 9px rgba(88,230,250,.4)'}}/>)}
    </div>
    <div style={{marginTop:11,fontSize:14,color:'#A9D5E8'}}>Distributed traffic</div>
  </div>;
};

const AuthCluster:React.FC<{frame:number;waiting:number}>=({frame,waiting})=>{
  const n=SHOT02_NODES.auth;
  return <div style={{...fixed(n),...panel('#9184FF','rgba(125,111,255,.25)'),
    zIndex:8,fontFamily:AT_FONT,
    background:'linear-gradient(150deg,rgba(11,22,50,.99),rgba(4,13,34,.998))'}}>
    <div style={{position:'absolute',top:18,left:0,right:0,textAlign:'center',
      fontSize:28,fontWeight:840,color:WHITE}}>Auth Service</div>
    {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>{
      const left=SHOT02_AUTH_CARD_LEFT-(n.x-n.width/2);
      const busy=waiting>3?2:1;
      return <div key={replica.id} style={{position:'absolute',
        left,top:replica.y-n.y-35,width:SHOT02_AUTH_CARD_RIGHT-SHOT02_AUTH_CARD_LEFT,
        height:70,padding:'0 16px',boxSizing:'border-box',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        border:'2px solid #498CB7',borderRadius:12,
        background:'linear-gradient(140deg,rgba(10,47,71,.99),rgba(5,26,48,.99))',
        boxShadow:'0 0 9px rgba(55,202,252,.18)'}}>
        <div style={{display:'flex',alignItems:'center',gap:11}}>
          <span style={{width:12,height:12,borderRadius:3,background:MINT,
            boxShadow:'0 0 10px rgba(115,255,208,.55)'}}/>
          <span style={{fontSize:24,color:WHITE,fontWeight:800}}>{replica.id}</span>
        </div>
        <div style={{display:'flex',gap:5}}>
          {[0,1,2].map(k=><span key={k} style={{width:4,height:12,borderRadius:3,
            background:k<busy?'#68E5FF':'#315875',opacity:.88+.12*Math.sin(frame*.03+i)}}/>)}
        </div>
      </div>;
    })}
  </div>;
};

const DatabaseCard:React.FC<{frame:number;pressure:number;workRate:number;saturated:boolean}>=
({frame,pressure,workRate,saturated})=>{
  const n=SHOT02_NODES.database,pal=shot02DatabaseColors(pressure);
  const heartbeat=.8+.2*Math.sin(frame*.075)**2;
  return <div style={{...fixed(n),...panel(pal.border,pal.glow+'75'),
    zIndex:9,fontFamily:AT_FONT,borderWidth:3,
    background:'linear-gradient(150deg,rgba(9,26,44,.995),'+pal.core+')',
    boxShadow:'0 0 '+(28+27*pressure)+'px '+pal.glow+'90,inset 0 0 18px '+pal.glow+'22'}}>
    <div style={{marginTop:21,textAlign:'center',fontSize:27,fontWeight:840,
      color:WHITE}}>User Database</div>
    <svg width="88" height="80" viewBox="0 0 88 79" fill="none"
      style={{display:'block',margin:'17px auto 0',
        filter:'drop-shadow(0 0 '+(6*heartbeat)+'px '+pal.glow+')'}}>
      <ellipse cx="44" cy="16" rx="27" ry="11" stroke={pal.border} strokeWidth="3.8"/>
      <path d="M17 16V60Q44 78 71 60V16M17 37Q44 55 71 37"
        stroke={pal.border} strokeWidth="3.8"/>
      <ellipse cx="44" cy="60" rx="27" ry="11" stroke={pal.border} strokeWidth="3.8"/>
    </svg>
    <div style={{margin:'16px 12px 0',height:44,borderRadius:9,
      border:'1.7px solid '+pal.border,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:16,fontWeight:800,color:pressure>.45?'#FFD7A2':'#BFE9FF',
      background:'rgba(6,25,43,.79)'}}>
      {saturated?'SATURATED · RUNNING':pressure>.45?'PRESSURE RISING':'SHARED LOOKUP'}
    </div>
    <div style={{position:'absolute',right:13,top:7,width:8,height:8,borderRadius:8,
      background:MINT,boxShadow:'0 0 11px '+MINT,opacity:.72+.28*heartbeat}}/>
    {workRate>0&&<div style={{position:'absolute',bottom:7,left:0,right:0,
      textAlign:'center',fontSize:12,fontWeight:720,color:'#8DDCCA'}}>
      COMPLETING WORK
    </div>}
  </div>;
};

const RequestParticle:React.FC<{x:number;y:number;opacity:number}>=
({x,y,opacity})=><circle cx={x} cy={y}
  r={SHOT02_LOGIN_PARTICLE.radius}
  fill={SHOT02_LOGIN_PARTICLE.fill}
  opacity={clamp(opacity)}
  style={{filter:SHOT02_LOGIN_PARTICLE.glow}}/>;

const FlowPaths:React.FC<{
  frame:number;flowClock:number;pressure:number;throughput:boolean;arrival:number;
}>=({frame,flowClock,pressure,throughput,arrival})=>{
  const phase=(slot:number,count:number)=>((flowClock+slot/count)%1+1)%1;
  const fade=(t:number)=>clamp(Math.min(t,1-t)*9);
  const db=SHOT02_DATABASE_ENTRY;
  const pal=shot02DatabaseColors(pressure);
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none',overflow:'visible'}}>
    <defs>
      <marker id="s03-request-arrow" markerWidth="12" markerHeight="12"
        refX="9" refY="6" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M1 2L9 6L1 10" fill="none" stroke="#7FEFFD"
          strokeWidth="3" strokeLinecap="round"/>
      </marker>
      <marker id="s03-lookup-arrow" markerWidth="12" markerHeight="12"
        refX="9" refY="6" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M1 2L9 6L1 10" fill="none" stroke={pal.border}
          strokeWidth="3" strokeLinecap="round"/>
      </marker>
    </defs>
    {[[SHOT02_PHONE_PIPE,SHOT02_GATEWAY_ENTRY],
      [SHOT02_GATEWAY_EXIT,SHOT02_BALANCER_ENTRY]].map(([from,to],i)=>{
      const t=phase(i,2);
      return <g key={i}>
        <path d={'M'+from.x+' '+from.y+' L'+to.x+' '+to.y}
          stroke="#6BD8F7" strokeWidth="4"
          markerEnd="url(#s03-request-arrow)" opacity=".75"/>
        <RequestParticle x={from.x+(to.x-from.x)*t}
          y={from.y+(to.y-from.y)*t} opacity={fade(t)}/>
      </g>;
    })}
    {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>{
      const a=SHOT02_BALANCER_EXIT;
      const b={x:SHOT02_AUTH_CARD_LEFT+6,y:replica.y};
      const c={x:SHOT02_AUTH_CARD_RIGHT,y:replica.y};
      const target={x:db.x+5,y:db.y};
      const m1={x:1090,y:a.y},m2={x:1137,y:replica.y};
      const m3={x:1505,y:replica.y},m4={x:1540,y:db.y};
      const branch='M'+a.x+' '+a.y+' C'+m1.x+' '+m1.y+' '+m2.x+' '+m2.y+' '+b.x+' '+b.y;
      const lookup='M'+c.x+' '+c.y+' C'+m3.x+' '+m3.y+' '+m4.x+' '+m4.y+' '+target.x+' '+target.y;
      const tokenCount=arrival>=900?4:arrival>=650?3:2;
      return <g key={replica.id}>
        <path d={branch} fill="none" stroke="#326F93" strokeWidth="9" opacity=".52"/>
        <path d={branch} fill="none" stroke="#83F0FF" strokeWidth="3.8"
          markerEnd="url(#s03-request-arrow)" opacity=".88"/>
        <path d={lookup} fill="none" stroke="#2F7197" strokeWidth="8" opacity=".47"/>
        <path d={lookup} fill="none" stroke={pal.border} strokeWidth="3.8"
          markerEnd="url(#s03-lookup-arrow)" opacity=".87"/>
        {Array.from({length:tokenCount},(_,k)=>{
          const t=phase(i*4+k,12),p=shot02CubicPoint(t,a,m1,m2,b);
          const t2=phase(i*4+k+3,13),q=shot02CubicPoint(t2,c,m3,m4,target);
          return <g key={k}>
            <RequestParticle x={p.x} y={p.y} opacity={fade(t)}/>
            <RequestParticle x={q.x} y={q.y} opacity={fade(t2)}/>
          </g>;
        })}
      </g>;
    })}
    {throughput&&<g>
      <path d={'M'+SHOT03_OUTPUT_PORT.x+' '+SHOT03_OUTPUT_PORT.y
        +' L'+SHOT03_OUTPUT_END.x+' '+SHOT03_OUTPUT_END.y}
        fill="none" stroke="#6FECD4" strokeWidth="4.5" opacity=".94"/>
      {Array.from({length:2},(_,k)=>{
        const t=phase(k,2);
        return <rect key={k}
          x={SHOT03_OUTPUT_PORT.x+(SHOT03_OUTPUT_END.x-SHOT03_OUTPUT_PORT.x)*t-5}
          y={SHOT03_OUTPUT_PORT.y-5} width="10" height="10" rx="2"
          fill="#9AFFF3" opacity={fade(t)}
          style={{filter:'drop-shadow(0 0 7px rgba(109,255,212,.85))'}}/>;
      })}
    </g>}
  </svg>;
};

const RateCard:React.FC<{
  area:{left:number;top:number;width:number;height:number};
  label:string;value:number;accent:string;subline:string;visible:number;
}>=({area,label,value,accent,subline,visible})=>
  <div style={{position:'absolute',...area,...panel(accent,accent+'40'),
    zIndex:25,opacity:visible,transform:'translateY('+((1-visible)*9)+'px)',
    padding:'15px 21px',fontFamily:AT_FONT}}>
    <div style={{fontSize:16,fontWeight:760,color:'#C2DCEE',letterSpacing:'.025em'}}>
      {label}
    </div>
    <div style={{fontSize:56,fontWeight:850,color:WHITE,lineHeight:1.15,
      fontVariantNumeric:'tabular-nums',textShadow:'0 0 15px '+accent+'55'}}>
      {value.toLocaleString('en-US')}
      <span style={{fontSize:20,color:accent,marginLeft:9,fontWeight:720}}>/ s</span>
    </div>
    <div style={{fontSize:14,color:accent,fontWeight:740,marginTop:1}}>{subline}</div>
  </div>;

const StateBoard:React.FC<{frame:number;waiting:number;show:number;pressure:number}>=
({frame,waiting,show,pressure})=>{
  const area=SHOT03_TEXT_AREAS.work;
  return <div style={{position:'absolute',...area,...panel('#4685B1','rgba(52,126,195,.18)'),
    zIndex:24,opacity:show,fontFamily:AT_FONT,padding:'17px 20px'}}>
    <div style={{fontSize:17,color:'#E7F7FF',fontWeight:830,marginBottom:12}}>
      AUTH RESOURCE WORK
    </div>
    {[
      {label:'PROCESSING',value:3,color:'#77D9FF'},
      {label:'WAITING FOR RESOURCES',value:waiting,color:pressure>.46?AMBER:'#75DACC'},
      {label:'COMPLETED',value:5,color:'#9CFFE6'},
    ].map((lane,i)=><div key={lane.label} style={{display:'flex',
      justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
      <div style={{fontSize:i===1?14:16,color:lane.color,fontWeight:760}}>{lane.label}</div>
      <div style={{display:'flex',gap:5,alignItems:'center',height:16}}>
        {Array.from({length:Math.min(11,lane.value)},(_,k)=><span key={k}
          style={{width:9,height:9,borderRadius:i===1?3:9,
            background:lane.color,opacity:.60+.4*Math.sin(frame*.025+k)**2,
            boxShadow:'0 0 5px '+lane.color+'55'}}/>)}
      </div>
    </div>)}
  </div>;
};

const LatencyRail:React.FC<{frame:number;latencyStart:number;show:number}>=
({frame,latencyStart,show})=>{
  const bar=shot03LatencyBar(frame,latencyStart);
  return <div style={{position:'absolute',...SHOT03_TEXT_AREAS.latency,
    ...panel('#4B8EB7','rgba(48,132,202,.20)'),zIndex:24,
    fontFamily:AT_FONT,padding:'16px 20px',opacity:show}}>
    <div style={{fontSize:18,fontWeight:830,color:WHITE}}>RESPONSE LATENCY</div>
    <div style={{marginTop:12,fontSize:14,color:'#AAC8DC'}}>
      Time to get an answer
    </div>
    <div style={{height:16,borderRadius:9,background:'#14364C',
      marginTop:15,overflow:'hidden'}}>
      <div style={{height:16,width:bar,
        borderRadius:9,background:'linear-gradient(90deg,#54DED4,#F1B96B)',
        boxShadow:'0 0 15px rgba(255,182,102,.31)'}}/>
    </div>
    <div style={{marginTop:15,color:frame>=latencyStart?AMBER:'#8FDDCC',
      fontSize:16,fontWeight:750}}>
      {frame>=latencyStart?'INCREASING · RESPONSES DELAYED':'LOOKUPS STILL COMPLETING'}
    </div>
  </div>;
};

export const Shot03DirectorVisualV1:React.FC<Shot03SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.fps!==30||video.width!==1920||video.height!==1080
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT03_MUST_RENDER_1920X1080_30FPS_MEASURED_VOICE_FRAMES');
  const {terms}=validateShot03Source(props);
  assertShot03SafeLayout();
  const starts=Object.fromEntries(terms.map(t=>[t.id,t.startFrame])) as
    Record<(typeof terms)[number]['id'],number>;
  const arrival=shot03ArrivalRate(frame,starts.SIX_FIFTY,starts.NINE_HUNDRED);
  const completed=shot03CompletionRate(frame,starts.FIVE_HUNDRED);
  const pressure=shot03DatabasePressure(frame,starts.BOTTLENECK,starts.SATURATION);
  const waiting=shot03WaitingDepth(frame,starts.UNFINISHED_WORK,starts.NINE_HUNDRED);
  const clock=shot03FlowClock(frame,starts.SIX_FIFTY,starts.NINE_HUNDRED);
  const throughputShow=shot03Ease(frame,starts.FIVE_HUNDRED,24);
  const arrivalFocus=shot03Ease(frame,starts.SIX_FIFTY,24);
  const boardsShow=shot03Ease(frame,starts.UNFINISHED_WORK,32);
  const caption=shot03Ease(frame,starts.STILL_WORKING,22);
  return <ATBackground>
    <ATControlledRealismLayer frame={frame} realism={.96}
      architectureReveal={.96}/>
    <div style={{position:'absolute',...SHOT03_TEXT_AREAS.brand,zIndex:26,
      fontFamily:AT_FONT,fontSize:17,fontWeight:710,letterSpacing:'.20em',
      color:'#A6D6F3'}}>ARCHITECTURAL THINKING</div>
    <div style={{position:'absolute',left:66,top:86,width:340,height:1,zIndex:25,
      background:'linear-gradient(90deg,rgba(95,204,255,.66),transparent)'}}/>
    <div style={{position:'absolute',...SHOT03_TEXT_AREAS.context,zIndex:24,
      display:'flex',flexDirection:'column',justifyContent:'center',
      fontFamily:AT_FONT}}>
      <div style={{fontSize:15,letterSpacing:'.17em',color:'#91BDE0',fontWeight:730}}>
        SHARED DEPENDENCY
      </div>
      <div style={{fontSize:32,lineHeight:1.2,fontWeight:850,color:WHITE,marginTop:9}}>
        THE CAPACITY LIMIT
      </div>
      <div style={{height:2,width:298,marginTop:12,
        background:'linear-gradient(90deg,#68D9F5,transparent)'}}/>
    </div>
    <FlowPaths frame={frame} flowClock={clock} arrival={arrival}
      pressure={pressure} throughput={completed===500}/>
    <GatewayCard/>
    <BalancerCard/>
    <AuthCluster frame={frame} waiting={waiting}/>
    <DatabaseCard frame={frame} pressure={pressure} workRate={completed}
      saturated={frame>=starts.SATURATION}/>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:12,
      transform:'translate3d(-680px,-150px,0) scale(1.11)',
      transformOrigin:'50% 50%'}}>
      <Shot02PressurePhone frame={frame} reveal={1} credential={.22} ui={0}
        emailValue="user@example.com" passwordDots="••••••••"
        emailFocus={0} passwordFocus={0} localUi={0}
        press={0} pressStartFrame={0} waiting={1} spinner={1}
        pressure={pressure} realism={1} heroPush={0}/>
    </AbsoluteFill>
    <RateCard area={SHOT03_TEXT_AREAS.completed} label="COMPLETED ACCOUNT LOOKUPS"
      value={completed} accent={MINT} subline={frame>=starts.THROUGHPUT?
      'THROUGHPUT · WORK FINISHED':'DATABASE OUTPUT'}
      visible={throughputShow}/>
    <RateCard area={SHOT03_TEXT_AREAS.arrivals} label="NEW LOGIN ARRIVALS"
      value={arrival} accent={arrival>=650?AMBER:MINT}
      subline={frame>=starts.ARRIVAL_RATE?'ARRIVAL RATE · NEW REQUESTS':'REQUESTS ENTERING'}
      visible={arrivalFocus}/>
    <StateBoard frame={frame} waiting={waiting} show={boardsShow} pressure={pressure}/>
    <LatencyRail frame={frame} latencyStart={starts.LATENCY} show={boardsShow}/>
    <div style={{position:'absolute',...SHOT03_TEXT_AREAS.conclusion,zIndex:30,
      fontFamily:AT_FONT,opacity:caption,
      transform:'translateY('+((1-caption)*14)+'px)',
      ...panel('#E6AA64','rgba(236,154,81,.25)'),
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:29,fontWeight:840,letterSpacing:'.01em',color:'#FFE4C2',
      whiteSpace:'nowrap'}}>
      THE DATABASE IS WORKING. IT JUST CAN&apos;T KEEP UP.
    </div>
  </ATBackground>;
};
