import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,ATControlledRealismLayer,AT_FONT}
  from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {SHOT02_NODES} from './Shot02PremiumLayout';
import {SHOT02_AUTH_REPLICA_PORTS,SHOT02_BALANCER_EXIT,
  SHOT02_AUTH_CARD_LEFT,SHOT02_AUTH_CARD_RIGHT,SHOT02_DATABASE_ENTRY,
  shot02CubicPoint,SHOT02_LOGIN_PARTICLE} from './Shot02PressureVisuals';
import {shot03CongestionColor} from './Shot03VisualContract';
import {shot05Ease,shot05QueueDepth,shot05ReplayBusy,shot05WaitingForConnection,
  validateShot05Source,assertShot05SafeLayout,type Shot05SceneProps,
  type Shot05TermId} from './Shot05VisualContract';

const WHITE='#F1FAFF',MINT='#73FFD0',CYAN='#68E5FF',RED=shot03CongestionColor(1);
const AMBER='#F2B46F',SOFT='#ABCBDD';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const box=(stroke:string,shadow:string)=>({
  border:'2px solid '+stroke,borderRadius:19,
  background:'linear-gradient(155deg,rgba(9,28,49,.98),rgba(3,14,29,.995))',
  boxShadow:'0 0 23px '+shadow+',inset 0 1px 0 rgba(219,248,255,.12)',
  boxSizing:'border-box' as const,
});
const move=(phase:number)=>{
  const t=((phase%1)+1)%1;
  return t;
};

const MiniWorld:React.FC<{frame:number;opacity:number;focus:number}>=
({frame,opacity,focus})=>{
  const auth=SHOT02_NODES.auth,db=SHOT02_NODES.database;
  const scale=1+1.76*focus;
  const x=-466*focus,y=110*focus;
  return <AbsoluteFill style={{zIndex:5,pointerEvents:'none',opacity,
    transform:'translate3d('+x+'px,'+y+'px,0) scale('+scale+')',
    transformOrigin:'1326px 412px'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0}}>
      <path d="M485 532H521 M779 532H804" stroke={CYAN}
        strokeWidth="3" opacity=".69"/>
      {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>{
        const first=SHOT02_BALANCER_EXIT;
        const p1={x:1090,y:first.y},p2={x:1137,y:replica.y};
        const end={x:SHOT02_AUTH_CARD_LEFT,y:replica.y};
        return <g key={replica.id}>
          <path d={'M'+first.x+' '+first.y+' C'+p1.x+' '+p1.y+' '+
            p2.x+' '+p2.y+' '+end.x+' '+end.y} fill="none"
            stroke="#4FACC6" strokeWidth="4" opacity=".8"/>
          <path d={'M'+SHOT02_AUTH_CARD_RIGHT+' '+replica.y+' C1512 '+
            replica.y+' 1546 509 '+SHOT02_DATABASE_ENTRY.x+' 509'}
            fill="none" stroke={RED} strokeWidth="3.7" opacity=".68"/>
          {[0,1,2].map(k=>{
            const t=move(frame*.013+i*.21+k*.33);
            const point=shot02CubicPoint(t,first,p1,p2,end);
            return <circle key={k} cx={point.x} cy={point.y}
              r={SHOT02_LOGIN_PARTICLE.radius}
              fill={MINT} opacity={Math.min(1,(1-t)*5,t*5)}
              style={{filter:SHOT02_LOGIN_PARTICLE.glow}}/>;
          })}
        </g>;
      })}
    </svg>
    {[
      {n:SHOT02_NODES.gateway,label:'API Gateway',sub:'ONLINE',color:CYAN},
      {n:SHOT02_NODES.balancer,label:'Load Balancer',sub:'ROUTING',color:CYAN},
    ].map(({n,label,sub,color})=>
      <div key={label} style={{position:'absolute',
        left:n.x-n.width/2,top:n.y,width:n.width,height:n.height,
        ...box(color,'rgba(29,187,230,.22)'),padding:22}}>
        <div style={{fontSize:25,fontWeight:840}}>{label}</div>
        <div style={{fontSize:16,marginTop:18,color:MINT}}>● {sub}</div>
        <div style={{height:1,background:'#315E7B',marginTop:32}}/>
      </div>)}
    <div style={{position:'absolute',left:auth.x-auth.width/2,top:auth.y,
      width:auth.width,height:auth.height,...box('#9087FF','rgba(125,111,255,.38)'),
      background:'linear-gradient(135deg,#101B41,#070E22)'}}>
      <div style={{textAlign:'center',fontSize:27,marginTop:17,fontWeight:840}}>
        Auth Service
      </div>
      {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>
        <div key={replica.id} style={{position:'absolute',
          left:SHOT02_AUTH_CARD_LEFT-(auth.x-auth.width/2),
          top:replica.y-auth.y-35,
          width:SHOT02_AUTH_CARD_RIGHT-SHOT02_AUTH_CARD_LEFT,height:70,
          border:'2px solid '+(i===0?'#8DFFE4':'#4484AD'),
          background:'rgba(6,35,59,.98)',borderRadius:11,
          display:'flex',alignItems:'center',padding:'0 16px',
          fontSize:23,fontWeight:790,color:WHITE,
          boxShadow:i===0?'0 0 '+(19+12*focus)+'px rgba(115,255,208,.43)':'none'}}>
          <span style={{fontSize:14,color:MINT,marginRight:12}}>◆</span>
          {replica.id}
          {i===0&&<span style={{marginLeft:'auto',fontSize:12,color:MINT}}>FOCUS</span>}
        </div>)}
    </div>
    <div style={{position:'absolute',left:db.x-db.width/2,top:db.y,
      width:db.width,height:db.height,...box(RED,'rgba(255,59,48,.49)'),
      textAlign:'center',paddingTop:18}}>
      <div style={{fontWeight:830,fontSize:25}}>User Database</div>
      <svg width="80" height="85" viewBox="0 0 80 85"
        style={{display:'block',margin:'12px auto'}}>
        <ellipse cx="40" cy="16" rx="25" ry="10" stroke={RED} strokeWidth="4" fill="none"/>
        <path d="M15 16V67Q40 80 65 67V16M15 40Q40 55 65 40"
          stroke={RED} strokeWidth="4" fill="none"/>
        <ellipse cx="40" cy="67" rx="25" ry="10" stroke={RED} strokeWidth="4" fill="none"/>
      </svg>
      <div style={{fontWeight:800,fontSize:16,color:'#FFB8AA'}}>SATURATED · RUNNING</div>
      <div style={{fontSize:12,color:MINT,marginTop:13}}>● STILL COMPLETING</div>
    </div>
    <div style={{position:'absolute',left:auth.x-160,top:auth.y+95,
      width:320,height:80,borderRadius:16,border:'3px solid '+MINT,
      opacity:focus*.65,boxShadow:'0 0 37px rgba(111,255,219,.7)'}}/>
  </AbsoluteFill>;
};

const Slot:React.FC<{index:number;busy:boolean;frame:number;highlight:number}>=
({index,busy,frame,highlight})=>{
  const glow=busy?'rgba(252,138,87,.30)':'rgba(76,218,207,.12)';
  const red=busy?AMBER:MINT;
  return <div style={{height:126,borderRadius:14,
    border:'2px solid '+(busy?'#C57A59':'#277F91'),
    background:busy
      ?'linear-gradient(150deg,rgba(82,40,41,.83),rgba(22,23,44,.98))'
      :'linear-gradient(150deg,rgba(6,48,60,.83),rgba(3,25,43,.99))',
    boxShadow:'0 0 '+(10+highlight*16)+'px '+glow,
    padding:'15px 17px',boxSizing:'border-box',
    position:'relative',overflow:'hidden'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <span style={{fontSize:16,color:SOFT,fontWeight:730}}>CONN {String(index+1).padStart(2,'0')}</span>
      <span style={{width:11,height:11,borderRadius:12,background:red,
        boxShadow:'0 0 13px '+red,opacity:.76+.24*Math.sin(frame*.05+index)**2}}/>
    </div>
    <div style={{fontSize:22,fontWeight:860,color:busy?'#FFCEAB':'#A2FFE7',marginTop:19}}>
      {busy?'IN USE':'AVAILABLE'}
    </div>
    <div style={{height:5,width:'90%',marginTop:11,borderRadius:5,
      background:'#1D344B',overflow:'hidden'}}>
      <div style={{height:'100%',width:busy?'100%':'18%',background:red,
        boxShadow:'0 0 9px '+red}}/>
    </div>
  </div>;
};

const Connections:React.FC<{frame:number;active:number;busy:number;
  terms:Record<Shot05TermId,number>;intro:number}>=
({frame,active,busy,terms,intro})=>{
  const replay=frame>=terms.REPLAY&&frame<terms.POOL_EXHAUSTION;
  const maxLabel=shot05Ease(frame,terms.EIGHT_MAX,19);
  const exhaustion=shot05Ease(frame,terms.POOL_EXHAUSTION,20);
  const pool={left:280,top:218,width:1240,height:535};
  return <div style={{position:'absolute',...pool,zIndex:21,
    transform:'translateY('+((1-intro)*22)+'px)',
    opacity:intro,pointerEvents:'none',fontFamily:AT_FONT}}>
    <div style={{...box('#5679C8','rgba(70,122,235,.33)'),
      width:'100%',height:'100%',padding:'22px 27px 26px',
      background:'linear-gradient(160deg,rgba(13,27,58,.965),rgba(4,15,33,.987))'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{color:'#A3BED9',fontSize:14,fontWeight:800,
            letterSpacing:'.17em'}}>AUTH 01 / INTERNAL VIEW</div>
          <div style={{color:WHITE,fontSize:29,fontWeight:880,marginTop:7}}>
            Database Connection Pool
          </div>
        </div>
        <div style={{textAlign:'right',opacity:.62+.38*maxLabel}}>
          <div style={{fontSize:16,color:SOFT}}>CONFIGURED MAXIMUM</div>
          <div style={{fontSize:34,fontWeight:880,color:WHITE}}>8 SLOTS</div>
        </div>
      </div>
      <div style={{borderTop:'1px solid #35516F',margin:'16px 0 21px'}}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',
        gap:'16px 18px'}}>
        {Array.from({length:8},(_,index)=>
          <Slot key={index} index={index} frame={frame}
            busy={index<busy} highlight={index===busy-1?active:0}/>)}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:22,
        alignItems:'center',gap:20}}>
        <div style={{fontSize:17,fontWeight:760,color:'#A8CADF'}}>
          {replay?'REPLAY · EARLIER MOMENTS':
            frame>=terms.ANOTHER_LOGIN?'CONNECTIONS UNAVAILABLE':'BORROW → LOOKUP → RETURN'}
        </div>
        <div style={{fontSize:28,fontWeight:900,color:busy===8?'#FFAF87':MINT,
          textShadow:busy===8?'0 0 15px rgba(255,87,71,.5)':'none'}}>
          {busy}/8 BUSY
        </div>
      </div>
    </div>
    {replay&&<div style={{position:'absolute',top:-25,left:440,
      padding:'10px 23px',border:'2px solid #F6C178',borderRadius:11,
      background:'#473020',fontWeight:900,fontSize:18,color:'#FFE2A5',
      boxShadow:'0 0 23px rgba(246,186,96,.4)'}}>↶ REPLAY · EARLIER MOMENTS</div>}
    {exhaustion>.1&&<div style={{position:'absolute',right:30,bottom:-24,
      padding:'10px 24px',border:'2px solid '+RED,borderRadius:12,
      background:'#431D27',fontWeight:880,fontSize:19,color:'#FFE4DA',
      opacity:exhaustion,boxShadow:'0 0 24px rgba(255,59,48,.33)'}}>
      CONNECTION POOL EXHAUSTED
    </div>}
  </div>;
};

const RequestQueue:React.FC<{frame:number;terms:Record<Shot05TermId,number>;
  reveal:number;depth:number}>=({frame,terms,reveal,depth})=>{
  const waiting=shot05WaitingForConnection(frame,terms);
  return <div style={{position:'absolute',left:282,top:795,width:1236,
    height:96,zIndex:25,fontFamily:AT_FONT,opacity:reveal,
    display:'flex',alignItems:'center',gap:16,
    transform:'translateY('+((1-reveal)*13)+'px)'}}>
    <div style={{fontSize:16,color:WHITE,fontWeight:790,minWidth:230}}>
      REQUEST QUEUE
      <div style={{marginTop:8,color:AMBER,fontSize:12,
        fontWeight:730,letterSpacing:'.04em'}}>
        {waiting?'WAITING FOR CONNECTION':'NEW LOGIN ARRIVES'}
      </div>
    </div>
    <div style={{display:'flex',gap:10,alignItems:'center',flex:1,
      border:'2px solid rgba(238,171,95,.53)',borderRadius:13,
      padding:'14px 17px',minHeight:61,boxSizing:'border-box',
      background:'rgba(40,27,34,.76)'}}>
      {Array.from({length:depth},(_,i)=>
        <div key={i} style={{width:46,height:27,borderRadius:7,
          background:i===0?AMBER:'#6A7185',
          boxShadow:i===0?'0 0 18px rgba(243,179,102,.5)':'none',
          opacity:.75+.25*Math.sin(frame*.038+i)**2}}/>)}
      {depth>0&&<span style={{color:'#FFE3BC',fontSize:16,fontWeight:790}}>
        REQUEST A
      </span>}
      {depth===0&&<span style={{fontSize:16,color:'#AFB6C4'}}>
        No request waiting yet
      </span>}
    </div>
    <div style={{fontWeight:870,fontSize:18,color:AMBER,minWidth:70,
      textAlign:'right'}}>{depth} WAIT</div>
  </div>;
};

const WorldBreadcrumb:React.FC<{frame:number;reveal:number}>=({frame,reveal})=>
  <div style={{position:'absolute',top:92,right:88,width:330,zIndex:26,
    opacity:reveal,fontFamily:AT_FONT,padding:'15px 18px',
    ...box('#466786','rgba(20,127,181,.13)')}}>
    <div style={{color:SOFT,fontSize:14,fontWeight:780,
      letterSpacing:'.09em'}}>SAME LIVING ARCHITECTURE</div>
    <div style={{display:'flex',gap:8,alignItems:'center',marginTop:15,
      color:'#D2E8F3',fontSize:14,fontWeight:790}}>
      <span>GATEWAY</span><span style={{color:CYAN}}>→</span>
      <span style={{color:MINT}}>AUTH 01</span><span style={{color:RED}}>→ DB</span>
    </div>
    <div style={{height:3,background:'#324A60',marginTop:12,borderRadius:5}}>
      <div style={{background:RED,width:'77%',height:'100%',
        opacity:.7+.3*Math.sin(frame*.036)**2}}/>
    </div>
  </div>;

export const Shot05DirectorVisualV1:React.FC<Shot05SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT05_REQUIRES_REAL_1080P_30FPS_VOICE_DURATION');
  const {terms}=validateShot05Source(props);
  assertShot05SafeLayout();
  const cue=Object.fromEntries(terms.map(t=>[t.id,t.startFrame])) as
    Record<Shot05TermId,number>;
  const carryOver=1-shot05Ease(frame,8,27);
  const zoom=shot05Ease(frame,14,93);
  const mapExit=shot05Ease(frame,62,42);
  const interior=shot05Ease(frame,55,42);
  const busy=shot05ReplayBusy(frame,cue);
  const queue=shot05QueueDepth(frame,cue);
  const status=shot05Ease(frame,cue.IN_FLIGHT,22);
  const phone=shot05Ease(frame,cue.SPINNER,27);
  const final=shot05Ease(frame,cue.TIME_RUNNING_OUT,25);
  const queueEntry=shot05Ease(frame,cue.ANOTHER_LOGIN,24);
  const highlight=shot05Ease(frame,cue.CONNECTION_POOL,18);
  return <ATBackground>
    <ATControlledRealismLayer frame={frame} realism={.96}
      architectureReveal={.97}/>
    <div style={{position:'absolute',left:75,top:38,zIndex:39,
      color:'#A6D6F3',fontFamily:AT_FONT,
      fontSize:17,fontWeight:740,letterSpacing:'.18em'}}>
      ARCHITECTURAL THINKING
    </div>
    <div style={{position:'absolute',left:75,top:83,width:338,height:1,
      background:'linear-gradient(90deg,rgba(97,212,243,.68),transparent)',zIndex:39}}/>
    <MiniWorld frame={frame} opacity={1-mapExit} focus={zoom}/>
    <AbsoluteFill style={{zIndex:7,transform:'translate3d(-680px,-150px,0) scale(1.11)',
      transformOrigin:'50% 50%',pointerEvents:'none',
      opacity:1-shot05Ease(frame,58,54)}}>
      <Shot02PressurePhone frame={frame} reveal={1} credential={.22} ui={0}
        emailValue="user@example.com" passwordDots="••••••••"
        emailFocus={0} passwordFocus={0} localUi={0}
        press={0} pressStartFrame={Number.POSITIVE_INFINITY}
        waiting={1} spinner={1} pressure={.95} realism={1} heroPush={0}/>
    </AbsoluteFill>
    <div style={{position:'absolute',left:557,top:115,zIndex:32,
      fontFamily:AT_FONT,opacity:1-shot05Ease(frame,70,24),
      transform:'translateX('+(-15*zoom)+'px)'}}>
      <div style={{fontSize:15,color:'#91BDE0',
        letterSpacing:'.17em',fontWeight:760}}>
        COMPONENT HEALTH · USER AVAILABILITY
      </div>
      <div style={{fontSize:36,color:WHITE,fontWeight:870,marginTop:10}}>
        ALIVE IS NOT AVAILABLE
      </div>
      <div style={{width:385,height:2,marginTop:17,
        background:'linear-gradient(90deg,#68D9F5,transparent)'}}/>
    </div>
    <div style={{position:'absolute',left:1035,top:719,
      width:782,height:160,zIndex:31,opacity:carryOver,
      display:'flex',gap:18,fontFamily:AT_FONT,pointerEvents:'none'}}>
      {[
        ['LIVENESS','Does this application need restarting?'],
        ['READINESS','Should this instance receive new requests?'],
      ].map(([name,description])=><div key={name} style={{
        flex:1,padding:'19px 18px 17px',
        height:138,boxSizing:'border-box',
        borderLeft:'3px solid '+MINT,borderRadius:'0 14px 14px 0',
        background:'linear-gradient(90deg,rgba(12,49,59,.77),rgba(6,23,36,.31))'}}>
        <div style={{fontSize:16,color:MINT,fontWeight:850,
          letterSpacing:'.1em'}}>{name}</div>
        <div style={{fontSize:19,color:WHITE,lineHeight:1.4,
          fontWeight:700,marginTop:12}}>{description}</div>
      </div>)}
    </div>
    <div style={{position:'absolute',left:575,top:744,width:422,height:44,
      zIndex:31,opacity:carryOver,fontFamily:AT_FONT,
      color:AMBER,fontSize:17,fontWeight:830,letterSpacing:'.045em'}}>
      SERVICE AVAILABILITY · NOT PROVEN
    </div>
    <div style={{position:'absolute',left:543,top:930,width:1280,
      height:76,zIndex:31,opacity:carryOver,
      border:'2px solid #E6AA64',borderRadius:21,
      background:'linear-gradient(145deg,rgba(8,32,53,.99),rgba(3,15,30,.998))',
      boxShadow:'0 0 28px rgba(236,154,81,.23)',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:AT_FONT,fontWeight:850,fontSize:33,color:'#FFE1B8'}}>
      Being alive is not the same as being available.
    </div>
    <AbsoluteFill style={{zIndex:20,opacity:interior,pointerEvents:'none'}}>
      <div style={{position:'absolute',left:278,top:111,fontFamily:AT_FONT}}>
        <div style={{fontSize:14,fontWeight:810,color:'#9DC7E6',
          letterSpacing:'.18em'}}>INSIDE AUTH 01</div>
        <div style={{fontSize:38,fontWeight:890,color:WHITE,
          marginTop:7,letterSpacing:'-.03em'}}>THE HIDDEN CONNECTION QUEUE</div>
        <div style={{width:470,height:2,marginTop:15,
          background:'linear-gradient(90deg,#64CDE9,transparent)'}}/>
      </div>
      <WorldBreadcrumb frame={frame} reveal={interior}/>
      <Connections frame={frame} active={highlight}
        busy={busy} terms={cue} intro={interior}/>
      <RequestQueue frame={frame} terms={cue} depth={queue}
        reveal={queueEntry}/>
      <div style={{position:'absolute',left:284,top:920,width:850,height:76,
        borderLeft:'3px solid '+(status?AMBER:MINT),
        borderRadius:9,background:'rgba(6,26,43,.77)',
        fontFamily:AT_FONT,padding:'11px 17px',boxSizing:'border-box',
        display:'flex',alignItems:'center',gap:32}}>
        <div style={{fontSize:20,color:WHITE,fontWeight:840}}>
          {status>0.5?'IN-FLIGHT ≠ WAITING':'DATABASE LOOKUP IS SLOW'}
        </div>
        <div style={{fontSize:15,color:'#BED5E4',fontWeight:680}}>
          {status>0.5?'8 busy connections · request queue outside pool':
            'Database remains running · work takes longer'}
        </div>
      </div>
      <div style={{position:'absolute',right:83,bottom:88,width:254,height:172,
        ...box('#2D718C','rgba(45,132,173,.25)'),
        fontFamily:AT_FONT,padding:16,opacity:.75+.25*phone,
        display:'flex',alignItems:'center',gap:13}}>
        <div style={{width:81,height:134,border:'3px solid #86A6BA',
          borderRadius:17,background:'linear-gradient(140deg,#071F3C,#020B22)',
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:29,color:'#F3A567',
            display:'inline-block',transform:'rotate('+(frame*7.3)+'deg)'}}>◌</span>
          <span style={{fontSize:9,color:'#E2EDF5',marginTop:10}}>Logging in ...</span>
        </div>
        <div style={{fontSize:15,fontWeight:800,color:WHITE,
          lineHeight:1.5}}>PHONE
          <div style={{fontSize:13,color:'#F9B57B'}}>STILL WAITING</div>
          <div style={{fontSize:12,color:SOFT,marginTop:11,
            opacity:final}}>TIME RUNNING OUT</div>
        </div>
      </div>
      {final>0&&<div style={{position:'absolute',left:357,top:879,zIndex:30,
        color:'#FFE8CE',fontFamily:AT_FONT,fontSize:17,fontWeight:800,
        opacity:final,letterSpacing:'.05em'}}>
        REQUEST A → NEXT: THE DEADLINE EXPIRES
      </div>}
    </AbsoluteFill>
  </ATBackground>;
};
