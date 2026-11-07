import React from 'react';
import {AbsoluteFill,interpolate,Easing,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,ATControlledRealismLayer,AT_FONT} from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {
  requireShot02VerifiedCues,requireShot02SpokenTerms,
  type Shot02GeneratedSceneProps,
} from './Shot02GeneratedScene';
import {
  SHOT02_NODES,SHOT02_REQUEST_MARKER,SHOT02_TEXT_LANES,
  assertShot02TextLanes,
} from './Shot02PremiumLayout';
import {
  SHOT02_AUTH_REPLICA_PORTS,SHOT02_AUTH_CARD_LEFT,SHOT02_AUTH_CARD_RIGHT,
  SHOT02_DATABASE_ENTRY,SHOT02_BALANCER_EXIT,SHOT02_GATEWAY_ENTRY,
  SHOT02_GATEWAY_EXIT,SHOT02_BALANCER_ENTRY,SHOT02_PHONE_PIPE,
  shot02CubicPoint,shot02UserRequestPressure,shot02SharedDbPressure,
  shot02DatabaseColors,shot02RequestStreamActivation,shot02CounterLift,
} from './Shot02PressureVisuals';
import {shot02FlowClock} from './Shot02DirectorPacing';

const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const ease=(frame:number,start:number,end:number)=>interpolate(
  frame,[start,Math.max(start+1,end)],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',
    easing:Easing.inOut(Easing.cubic),
  });
const fixed=(node:{x:number;y:number;width:number;height:number})=>({
  position:'absolute' as const,left:node.x-node.width/2,top:node.y,
  width:node.width,height:node.height,boxSizing:'border-box' as const,
});

const GatewayCard:React.FC<{activity:number}>=({activity})=>{
  const n=SHOT02_NODES.gateway;
  return <div style={{...fixed(n),zIndex:8,
    borderRadius:22,border:'2.5px solid #64DFFF',
    background:'linear-gradient(150deg,rgba(9,35,57,.995),rgba(2,16,32,.998))',
    boxShadow:'0 0 '+(21+18*activity)+'px rgba(58,215,254,.33),inset 0 1px 0 rgba(255,255,255,.15)',
    padding:'26px 21px',fontFamily:AT_FONT}}>
    <div style={{fontSize:26,fontWeight:840,color:'#F8FDFF',letterSpacing:'-.025em'}}>API Gateway</div>
    <div style={{fontSize:16,color:'#7AFFD0',fontWeight:770,
      marginTop:15,display:'flex',alignItems:'center',gap:9}}>
      <span style={{width:11,height:11,borderRadius:11,background:'#65FFD3',
        boxShadow:'0 0 10px rgba(75,255,190,.7)'}}/>ONLINE
    </div>
    <div style={{marginTop:27,paddingTop:15,borderTop:'1px solid rgba(104,223,244,.35)',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      fontSize:23,fontWeight:830,color:'#EBFCFF'}}>
      REQUEST ENTRY <span style={{fontSize:31,color:'#7EF6FF'}}>→</span>
    </div>
    <div style={{marginTop:13,fontSize:15,color:'#C1E0F0'}}>Accepting login traffic</div>
  </div>;
};

const BalancerCard:React.FC<{activity:number}>=({activity})=>{
  const n=SHOT02_NODES.balancer;
  return <div style={{...fixed(n),zIndex:8,
    borderRadius:22,border:'2.5px solid #63DEFF',
    background:'linear-gradient(155deg,rgba(8,31,53,.995),rgba(3,16,31,.998))',
    boxShadow:'0 0 '+(19+16*activity)+'px rgba(61,209,248,.33),inset 0 1px 0 rgba(255,255,255,.13)',
    padding:'26px 19px',fontFamily:AT_FONT}}>
    <div style={{fontSize:24,fontWeight:820,color:'#F8FDFF',letterSpacing:'-.025em'}}>Load Balancer</div>
    <div style={{display:'flex',gap:9,alignItems:'center',fontSize:16,
      fontWeight:750,color:'#79FFD3',marginTop:16}}>
      <span style={{width:11,height:11,borderRadius:11,background:'#69FFD0',
        boxShadow:'0 0 10px rgba(75,255,190,.7)'}}/>ROUTING
    </div>
    <div style={{borderTop:'1px solid rgba(107,207,243,.35)',
      marginTop:21,paddingTop:13,fontSize:20,fontWeight:690,color:'#E9F8FF'}}>
      3 Auth replicas
    </div>
    <div style={{display:'flex',gap:7,marginTop:15}}>
      {[0,1,2].map(i=><div key={i} style={{width:60,height:12,
        borderRadius:8,background:'#6AEFFF',
        boxShadow:'0 0 9px rgba(74,217,250,.45)',
        opacity:.45+.55*activity}}/>)}
    </div>
    <div style={{fontSize:14,color:'#A9D5E8',marginTop:12}}>Traffic distribution</div>
  </div>;
};

const AuthCluster:React.FC<{activity:number;frame:number}>=({activity,frame})=>{
  const n=SHOT02_NODES.auth;
  return <div style={{...fixed(n),zIndex:7,fontFamily:AT_FONT,
    borderRadius:25,border:'2.5px solid #9184FF',
    background:'linear-gradient(145deg,rgba(10,22,50,.99),rgba(4,12,32,.995))',
    boxShadow:'0 0 30px rgba(126,107,255,.27),inset 0 1px 0 rgba(255,255,255,.14)'}}>
    <div style={{position:'absolute',left:0,right:0,top:18,textAlign:'center',
      fontSize:28,fontWeight:830,color:'#F5F8FF'}}>Auth Service</div>
    {SHOT02_AUTH_REPLICA_PORTS.map((r,i)=>{
      const heat=clamp(activity*(.88+.12*Math.sin(frame*.035+i)));
      const left=SHOT02_AUTH_CARD_LEFT-(n.x-n.width/2);
      return <div key={r.id} style={{
        position:'absolute',left,top:r.y-n.y-35,
        width:SHOT02_AUTH_CARD_RIGHT-SHOT02_AUTH_CARD_LEFT,height:70,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        borderRadius:12,border:'2px solid #438FC3',
        background:'linear-gradient(140deg,rgba(10,47,71,.99),rgba(5,26,48,.99))',
        boxShadow:'0 0 '+(8+10*heat)+'px rgba(44,197,255,.2)',
        boxSizing:'border-box',padding:'0 17px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{width:12,height:12,borderRadius:3,background:'#68F4CA',
            boxShadow:'0 0 10px rgba(93,255,193,.54)'}}/>
          <span style={{fontSize:25,fontWeight:810,color:'#F5FCFF'}}>{r.id}</span>
        </div>
        <div style={{display:'flex',gap:5}}>
          {[0,1,2].map(k=><div key={k} style={{width:4,height:12,
            borderRadius:3,background:k<1+Math.floor(heat*2)?'#64DFFF':'#336182'}}/>)}
        </div>
      </div>;
    })}
  </div>;
};

const DatabaseCard:React.FC<{pressure:number;reveal:number;frame:number}>=
({pressure,reveal,frame})=>{
  const n=SHOT02_NODES.database;
  const pal=shot02DatabaseColors(pressure);
  return <div style={{...fixed(n),zIndex:8,fontFamily:AT_FONT,
    borderRadius:25,border:'3px solid '+pal.border,
    opacity:.50+.50*reveal,
    background:'linear-gradient(150deg,rgba(10,25,38,.99),'+pal.core+')',
    boxShadow:'0 0 '+(24+25*pressure)+'px '+pal.glow+'77,inset 0 0 18px '+pal.glow+'20'}}>
    <div style={{fontSize:27,fontWeight:830,color:'#F9FCFF',
      textAlign:'center',marginTop:22}}>User Database</div>
    <svg width="88" height="79" viewBox="0 0 88 79" fill="none"
      style={{display:'block',margin:'17px auto 0'}}>
      <ellipse cx="44" cy="16" rx="27" ry="11" stroke={pal.border} strokeWidth="3.8"/>
      <path d="M17 16V60Q44 78 71 60V16M17 37Q44 55 71 37"
        stroke={pal.border} strokeWidth="3.8"/>
      <ellipse cx="44" cy="60" rx="27" ry="11" stroke={pal.border} strokeWidth="3.8"/>
    </svg>
    <div style={{margin:'16px 13px 0',height:44,borderRadius:9,
      border:'1.8px solid '+pal.border,
      display:'flex',justifyContent:'center',gap:10,alignItems:'center',
      color:'#FFD59B',fontSize:15,fontWeight:800,
      background:'rgba(109,53,21,.34)'}}>
      <span style={{fontSize:25}}>▥</span>PRESSURE RISING
    </div>
  </div>;
};

const PathSystem:React.FC<{
  frame:number;clock:number;load:number;arrival:number;lookup:number;
  firstTapFrame:number;firstTapActive:number;
}>=({frame,clock,load,arrival,lookup,firstTapFrame,firstTapActive})=>{
  const a=SHOT02_BALANCER_EXIT,db=SHOT02_DATABASE_ENTRY;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none',overflow:'visible'}}>
    <defs>
      <marker id="s02v5-arrow-cyan" markerWidth="12" markerHeight="12"
        refX="8" refY="6" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M1 2L9 6L1 10" stroke="#83F0FF" strokeWidth="3" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
      </marker>
      <marker id="s02v5-arrow-amber" markerWidth="12" markerHeight="12"
        refX="8" refY="6" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M1 2L9 6L1 10" stroke="#FFBD77" strokeWidth="3" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
      </marker>
    </defs>
    <path d={`M ${SHOT02_PHONE_PIPE.x} ${SHOT02_PHONE_PIPE.y}
      L ${SHOT02_GATEWAY_ENTRY.x} ${SHOT02_GATEWAY_ENTRY.y}`}
      stroke="#7EEFFF" strokeWidth="4" fill="none" markerEnd="url(#s02v5-arrow-cyan)"
      opacity={.55+.45*load}/>
    <path d={`M ${SHOT02_GATEWAY_EXIT.x} ${SHOT02_GATEWAY_EXIT.y}
      L ${SHOT02_BALANCER_ENTRY.x} ${SHOT02_BALANCER_ENTRY.y}`}
      stroke="#7EEFFF" strokeWidth="4" fill="none" markerEnd="url(#s02v5-arrow-cyan)"
      opacity={.38+.62*load}/>
    {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>{
      const b={x:SHOT02_AUTH_CARD_LEFT+6,y:replica.y};
      const c={x:SHOT02_AUTH_CARD_RIGHT,y:replica.y};
      const target={x:db.x+5,y:db.y};
      const m1={x:1090,y:a.y},m2={x:1137,y:replica.y};
      const m3={x:1505,y:replica.y},m4={x:1540,y:db.y};
      const branch=`M ${a.x} ${a.y} C ${m1.x} ${m1.y} ${m2.x} ${m2.y} ${b.x} ${b.y}`;
      const lookupPath=`M ${c.x} ${c.y} C ${m3.x} ${m3.y} ${m4.x} ${m4.y} ${target.x} ${target.y}`;
      return <g key={replica.id}>
        <path d={branch} fill="none" stroke="#2F7197" strokeWidth="9" opacity=".5"/>
        <path d={branch} fill="none" stroke="#84EEFF" strokeWidth="3.8"
          markerEnd="url(#s02v5-arrow-cyan)" opacity={.17+.83*load}/>
        <path d={lookupPath} fill="none" stroke="#B26C37" strokeWidth="8"
          opacity={.40*lookup}/>
        <path d={lookupPath} fill="none" stroke="#FFBD7C" strokeWidth="3.8"
          markerEnd="url(#s02v5-arrow-amber)" opacity={.15+.85*lookup}/>
        {Array.from({length:4},(_,k)=>{
          const t=((clock*.75+i/3+k/4)%1+1)%1;
          const f=shot02CubicPoint(t,a,m1,m2,b);
          const g=shot02CubicPoint(t,c,m3,m4,target);
          const fade=clamp(Math.min(t,1-t)*11);
          return <g key={k}>
            <circle cx={f.x} cy={f.y} r={7+2*arrival} fill="#77FFD4"
              opacity={load*fade} style={{filter:'drop-shadow(0 0 11px #67FFD0)'}}/>
            <circle cx={g.x} cy={g.y} r={7+3*arrival} fill="#FFC079"
              opacity={lookup*fade} style={{filter:'drop-shadow(0 0 9px #FFA54B)'}}/>
          </g>;
        })}
      </g>;
    })}
    {Array.from({length:11},(_,i)=>{
      const t=((clock*.8+i/11)%1+1)%1;
      const x=SHOT02_PHONE_PIPE.x+
        (SHOT02_BALANCER_ENTRY.x-SHOT02_PHONE_PIPE.x)*t;
      return <circle key={i} cx={x} cy={SHOT02_PHONE_PIPE.y} r={7+2*arrival}
        fill="#73FFD0" opacity={load*clamp(Math.min(t,1-t)*10)}
        style={{filter:'drop-shadow(0 0 10px rgba(104,255,190,.9))'}}/>;
    })}
    {frame>=firstTapFrame&&<g>
      <circle
        cx={SHOT02_PHONE_PIPE.x+(SHOT02_GATEWAY_ENTRY.x-SHOT02_PHONE_PIPE.x)*
          Math.min(1,((frame-firstTapFrame)%40)/18)}
        cy={SHOT02_PHONE_PIPE.y}
        r={9+2*firstTapActive}
        fill="#73FFD0" opacity={.35+.65*firstTapActive}
        style={{filter:'drop-shadow(0 0 13px rgba(94,255,182,.94))'}}
      />
      <circle cx={SHOT02_PHONE_PIPE.x+12} cy={SHOT02_PHONE_PIPE.y}
        r={5+2*firstTapActive} fill="#D5FFF1"
        opacity={firstTapActive*(.7+.3*Math.sin(frame*.23)**2)}/>
    </g>}
  </svg>;
};

const TicketHero:React.FC<{frame:number;reveal:number}>=({frame,reveal})=>
  <div style={{position:'absolute',...SHOT02_TEXT_LANES.time,zIndex:30,
    display:'flex',gap:20,alignItems:'center',justifyContent:'center',
    fontFamily:AT_FONT,opacity:reveal,
    transform:'translateY('+((1-reveal)*12)+'px)',whiteSpace:'nowrap'}}>
    <div aria-label="09 : 00" style={{display:'flex',alignItems:'center',
      gap:8,fontVariantNumeric:'tabular-nums',lineHeight:1,
      color:'#FFE4B2',textShadow:'0 0 9px rgba(255,176,80,.22)'}}>
      <span style={{fontSize:68,fontWeight:840,letterSpacing:'.008em'}}>09</span>
      <span style={{fontSize:62,fontWeight:650,margin:'0 3px',
        transform:'translateY(-3px)',color:'#FFD08B'}}>:</span>
      <span style={{fontSize:68,fontWeight:840,letterSpacing:'.008em'}}>00</span>
    </div>
    <span style={{width:2,height:60,background:'rgba(255,202,144,.83)'}}/>
    <span style={{fontSize:36,fontWeight:790,letterSpacing:'.085em',
      color:'#FFF9F2'}}>TICKETS ON SALE</span>
    <div style={{position:'absolute',bottom:0,left:76,right:62,height:2,
      background:'linear-gradient(90deg,transparent,#FFB96B,transparent)',
      boxShadow:'0 0 '+(8+9*Math.abs(Math.sin(frame*.015)))+'px rgba(255,160,61,.72)'}}/>
  </div>;

export const Shot02DirectorVisualV5:React.FC<Shot02GeneratedSceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  const total=props.durationInFrames;
  const hold=props.postVoiceHoldFrames??0;
  if(hold!==0&&hold!==60)throw Error('SHOT02_HOLD_MUST_BE_EXACTLY_60_FRAMES');
  const spokenFrames=total-hold;
  if(video.fps!==30||video.durationInFrames!==total)
    throw Error('SHOT02_REQUIRES_30FPS_EXACT_VOICE_DURATION');
  const beats=requireShot02VerifiedCues(spokenFrames,props.voiceTakeId,props.timingMode,props.verifiedCues);
  const terms=requireShot02SpokenTerms(spokenFrames,beats,props.termCues);
  assertShot02TextLanes({x:0,y:0,scale:1});
  const start=beats.map(c=>c.startFrame);
  const firstTapFrame=start[0]+15;
  const firstTapActive=shot02RequestStreamActivation(frame,firstTapFrame);
  const counterLift=shot02CounterLift(frame,spokenFrames);
  const context=ease(frame,start[0],start[0]+35);
  const gateway=ease(frame,terms[1].startFrame,terms[1].startFrame+42);
  const balancer=ease(frame,terms[2].startFrame,terms[2].startFrame+38);
  const auth=ease(frame,terms[3].startFrame,terms[3].startFrame+42);
  const arrival=ease(frame,terms[4].startFrame,terms[4].startFrame+60);
  const lookup=ease(frame,start[4],start[4]+49);
  const database=ease(frame,terms[5].startFrame-35,terms[6].startFrame+33);
  const visualHold=ease(frame,spokenFrames,spokenFrames+60);
  const pressure=shot02UserRequestPressure(context,gateway,balancer,auth,arrival);
  const dbPressure=shot02SharedDbPressure(lookup,database,arrival);
  const flowClock=shot02FlowClock(frame,firstTapFrame);
  return <ATBackground>
    <ATControlledRealismLayer frame={frame} realism={.96}
      architectureReveal={.3+.4*context+.25*database}/>
    <div style={{position:'absolute',...SHOT02_TEXT_LANES.brand,
      fontFamily:AT_FONT,fontSize:17,fontWeight:710,
      letterSpacing:'.20em',color:'#A6D6F3',zIndex:28}}>
      ARCHITECTURAL THINKING
    </div>
    <div style={{position:'absolute',left:66,top:86,width:340,height:1,
      background:'linear-gradient(90deg,rgba(95,204,255,.66),transparent)',zIndex:28}}/>
    <PathSystem frame={frame} clock={flowClock}
      load={Math.max(.72*firstTapActive,clamp(.40*gateway+.60*balancer))}
      arrival={arrival} lookup={lookup}
      firstTapFrame={firstTapFrame} firstTapActive={firstTapActive}/>
    <GatewayCard activity={gateway}/>
    <BalancerCard activity={balancer}/>
    <AuthCluster activity={auth} frame={frame}/>
    <DatabaseCard pressure={dbPressure} reveal={database} frame={frame}/>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:12,
      transform:'translate3d(-680px,-150px,0) scale(1.11)',
      transformOrigin:'50% 50%'}}>
      <Shot02PressurePhone frame={frame} reveal={1} credential={.22} ui={0}
        emailValue="user@example.com" passwordDots="••••••••"
        emailFocus={0} passwordFocus={0} localUi={0}
        press={0} pressStartFrame={firstTapFrame} waiting={0} spinner={0}
        pressure={pressure} realism={1} heroPush={0}/>
    </AbsoluteFill>
    <TicketHero frame={frame} reveal={context}/>
    <div style={{position:'absolute',...SHOT02_REQUEST_MARKER,zIndex:20,
      borderRadius:13,border:'2px solid #80E9FF',
      background:'linear-gradient(150deg,rgba(8,34,54,.98),rgba(4,20,37,.99))',
      boxShadow:'0 0 21px rgba(77,217,255,.3)',
      display:'flex',alignItems:'center',justifyContent:'center',
      gap:14,fontFamily:AT_FONT,fontSize:27,fontWeight:820,
      color:'#F8FDFF',opacity:ease(frame,terms[0].startFrame,terms[0].startFrame+21)}}>
      <span style={{fontSize:32,color:'#80F4FF'}}>↪</span>
      <span style={{width:1,height:31,background:'#5EB7D0'}}/>
      LOGIN REQUEST
    </div>
    <div style={{position:'absolute',...SHOT02_TEXT_LANES.metric,zIndex:24,
      opacity:arrival,fontFamily:AT_FONT,
      transform:`translateY(-${counterLift}px) scale(${1+.027*Math.sin(Math.PI*Math.min(1,counterLift/110))})`,
      transformOrigin:'50% 100%',
      background:'linear-gradient(90deg,rgba(3,15,32,.95),transparent)',
      borderLeft:'3px solid #5EECCE',padding:'12px 22px'}}>
      <div style={{fontSize:17,color:'#C1E2F3',letterSpacing:'.035em',fontWeight:710}}>
        ARRIVAL RATE · LOGIN REQUESTS / SECOND
      </div>
      <div style={{fontSize:46,fontWeight:840,color:'#F7FCFF',
        textShadow:'0 0 17px rgba(96,239,210,.4)'}}>
        {Math.round((100+250*arrival)/10)*10}
      </div>
    </div>
    {hold===60&&<div style={{position:'absolute',right:80,bottom:72,zIndex:25,
      width:790,padding:'18px 18px',borderRadius:12,
      border:'1.7px solid rgba(255,173,92,.57)',
      background:'linear-gradient(90deg,rgba(44,22,13,.65),rgba(10,15,29,.86))',
      fontFamily:AT_FONT,fontSize:21,fontWeight:750,color:'#FFD6A0',
      textAlign:'center',letterSpacing:'.003em',whiteSpace:'nowrap',
      transform:`translateY(${(1-visualHold)*15}px)`,
      opacity:visualHold}}>
      ONE DATABASE. THREE AUTH INSTANCES. RISING PRESSURE →
    </div>}
  </ATBackground>;
};
