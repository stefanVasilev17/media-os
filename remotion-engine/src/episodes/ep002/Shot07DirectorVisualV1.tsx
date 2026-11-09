import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {Shot05Shot04WorldV2} from './Shot05Shot04WorldV2';
import {Shot06LockedSlot,SHOT06_LOCKED_PANEL} from './Shot06Shot05LockedEnd';
import {shot04StatusPalette} from './Shot04VisualContract';
import {shot03CongestionColor} from './Shot03VisualContract';
import {assertShot07SafeLayout,shot07Ease,validateShot07Source,
  type Shot07SceneProps,type Shot07TermId} from './Shot07VisualContract';

const WHITE='#F5FCFF',SOFT='#B5D2E6',NAVY='#061324';
const MINT=shot04StatusPalette.healthy,AMBER=shot04StatusPalette.waiting;
const RED=shot03CongestionColor(1),CYAN='#68E5FF';
const panel=(accent:string)=>({
  border:'2px solid '+accent,borderRadius:16,
  background:'linear-gradient(150deg,rgba(11,29,53,.98),rgba(4,14,31,.99))',
  boxShadow:'0 8px 33px rgba(0,0,0,.43),0 0 23px rgba(55,149,215,.14)',
  boxSizing:'border-box' as const,
});
const clamp=(value:number)=>Math.max(0,Math.min(1,value));

const FrozenShot06End:React.FC<{frame:number;fade:number}>=({frame,fade})=>
  <AbsoluteFill style={{opacity:1-fade,pointerEvents:'none'}}>
    <div style={{position:'absolute',left:271,top:106,fontFamily:AT_FONT,
      color:WHITE,fontWeight:890,fontSize:38}}>THE DEADLINE EXPIRES</div>
    <div style={{position:'absolute',left:280,top:218,width:1240,height:535,
      ...SHOT06_LOCKED_PANEL('#9184FF','rgba(125,111,255,.29)'),
      padding:'22px 27px 26px',fontFamily:AT_FONT,
      background:'linear-gradient(150deg,rgba(11,22,50,.99),rgba(4,13,34,.998))'}}>
      <div style={{display:'flex',justifyContent:'space-between',
        alignItems:'center',height:58}}>
        <b style={{fontSize:30,color:WHITE}}>Database Connection Pool</b>
        <span style={{fontSize:23,color:WHITE,fontWeight:880}}>8 SLOTS</span>
      </div>
      <div style={{borderTop:'1px solid #35516F',margin:'16px 0 21px'}}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',
        gap:'16px 18px'}}>
        {Array.from({length:8},(_,index)=>
          <Shot06LockedSlot key={index} index={index} frame={2779+2095+frame} fill={1}/>)}
      </div>
      <div style={{marginTop:22,display:'flex',alignItems:'center',
        justifyContent:'space-between',color:'#FFBCA9',fontSize:18,fontWeight:830}}>
        <span>REQUEST A · TIMED OUT</span>
        <span>EXPIRED</span>
        <span>8/8 BUSY</span>
      </div>
      <div style={{position:'absolute',bottom:21,left:30,right:30,
        height:63,display:'flex',justifyContent:'space-between',
        alignItems:'center',gap:14,padding:'8px 13px',fontSize:15,
        fontWeight:840,border:'1px solid #567D85',borderRadius:10,
        background:'linear-gradient(90deg,rgba(10,43,44,.98),rgba(49,35,43,.97))'}}>
        <span style={{color:MINT}}>IF CANCELLATION HONORED → SLOT FREED SOONER</span>
        <span style={{color:AMBER}}>OTHERWISE → LOOKUP MAY CONTINUE</span>
      </div>
    </div>
    <div style={{position:'absolute',left:1550,top:476,width:302,height:92,
      ...panel(MINT),display:'flex',alignItems:'center',gap:10,
      color:'#B9EEEA',fontFamily:AT_FONT,fontSize:16,fontWeight:850,padding:15}}>
      REQUEST B · DB LOOKUP MAY STILL RUN
    </div>
    <div style={{position:'absolute',left:282,top:795,width:1236,height:96,
      display:'flex',alignItems:'center',gap:17,fontFamily:AT_FONT,color:WHITE}}>
      <b style={{width:225,fontSize:16}}>REQUEST QUEUE</b>
      <div style={{...panel(AMBER),flex:1,padding:19,color:'#FFBCAD',
        fontSize:18,fontWeight:850}}>REQUEST A · TIMED OUT
        <span style={{float:'right',fontSize:15}}>NO DB LOOKUP STARTED</span></div>
      <b style={{width:60,color:AMBER}}>7 WAIT</b>
    </div>
    <div style={{position:'absolute',left:282,top:910,width:1236,height:100,
      fontFamily:AT_FONT,display:'flex',flexDirection:'column',gap:9,
      fontSize:16,color:WHITE}}>
      <div style={{padding:'12px 17px',borderLeft:'3px solid '+RED,
        background:'rgba(8,32,53,.96)'}}>REQUEST TIMEOUT · The caller stops waiting; its database lookup never started.</div>
      <div style={{padding:'12px 17px',borderLeft:'3px solid '+MINT,
        background:'rgba(8,32,53,.96)'}}>REQUEST B · Cancellation may free a connection early, if honored.</div>
    </div>
    <AbsoluteFill style={{zIndex:28,transform:'translate3d(1320px,590px,0) scale(.35)',
      transformOrigin:'top left',pointerEvents:'none'}}>
      <Shot02PressurePhone frame={2779+2095+frame} reveal={1}
        credential={.22} ui={0} emailValue="user@example.com"
        passwordDots="••••••••" emailFocus={0} passwordFocus={0} localUi={0}
        press={0} pressStartFrame={Number.POSITIVE_INFINITY}
        waiting={0} spinner={0} pressure={.70} realism={1} heroPush={0}/>
      <div style={{position:'absolute',left:735,top:690,width:447,height:75,
        ...panel(RED),display:'flex',alignItems:'center',justifyContent:'center',
        color:'#FFE5E0',fontFamily:AT_FONT,fontSize:33,fontWeight:850}}>
        Please try again.
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;

const NewAttemptPath:React.FC<{frame:number;cue:Record<Shot07TermId,number>}>=
({frame,cue})=>{
  const retry=shot07Ease(frame,cue.AUTH_RETRY,31);
  const first=shot07Ease(frame,cue.ACCOUNT_LOOKUP,28);
  const concurrent=shot07Ease(frame,cue.FIRST_LOOKUP_RUNNING,30);
  const storm=shot07Ease(frame,cue.RETRY_STORM,75);
  const other=shot07Ease(frame,cue.OTHER_AUTH_RETRIES,80);
  const flow=frame*.042;
  const progress=clamp((frame-cue.AUTH_RETRY)/69);
  const p1x=1140+250*((frame*.48)%125)/125;
  const p2x=1140+250*progress;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,zIndex:12,pointerEvents:'none'}}>
    <g opacity={.38+.45*retry}>
      <path d="M1190 449 C1310 434 1400 445 1515 469"
        stroke={MINT} strokeWidth="4" strokeDasharray="15 15" fill="none"
        opacity={first}/>
      <path d="M1190 449 C1320 354 1420 364 1515 469"
        stroke={CYAN} strokeWidth="4" strokeDasharray="14 14" fill="none"
        opacity={retry}/>
      <circle cx={p1x} cy={450} r={7} fill={MINT}
        opacity={first} style={{filter:'drop-shadow(0 0 9px #6BECCB)'}}/>
      <circle cx={p2x} cy={369} r={7} fill={CYAN}
        opacity={retry} style={{filter:'drop-shadow(0 0 10px #68E5FF)'}}/>
      {[0,1,2].map(i=><path key={i}
        d={`M${720+i*123} ${520+i*25} Q${1160+i*60} ${375-i*32} 1515 469`}
        stroke={RED} strokeWidth={3+i*.5} strokeDasharray="8 14"
        opacity={other*(.23+storm*.45)} fill="none"/>)}
      {Array.from({length:8},(_,i)=>{
        const x=940+((flow+i*.19)%1)*510;
        const y=442-23*Math.sin(((flow+i*.19)%1)*Math.PI);
        return <circle key={i} cx={x} cy={y} r={4.3}
          fill={i%2?RED:MINT} opacity={storm*(.45+.35*Math.sin(frame*.04+i)**2)}
          style={{filter:'drop-shadow(0 0 6px rgba(240,88,81,.8))'}}/>;
      })}
    </g>
    <circle cx={1515} cy={469} r={10} fill={RED}
      opacity={concurrent} style={{filter:'drop-shadow(0 0 18px #E94C4C)'}}/>
  </svg>;
};

const RateMeters:React.FC<{frame:number;cue:Record<Shot07TermId,number>}>=
({frame,cue})=>{
  const show=shot07Ease(frame,cue.TRAFFIC_STABLE,35);
  const attempts=shot07Ease(frame,cue.ATTEMPTS_GROW,98);
  const storm=shot07Ease(frame,cue.RETRY_STORM,85);
  const extra=clamp(.23+.43*attempts+.25*storm);
  return <div style={{position:'absolute',left:80,top:626,width:1120,
    height:187,opacity:show,display:'flex',flexDirection:'column',gap:12,
    fontFamily:AT_FONT}}>
    {[
      {title:'NEW LOGIN ARRIVALS',sub:'unchanged in this example',
        strength:.31,color:MINT},
      {title:'ACCOUNT LOOKUP ATTEMPTS',sub:'more attempts from the same Logins',
        strength:extra,color:AMBER},
    ].map((item,i)=><div key={item.title} style={{
      ...panel(i===0?'#387F9D':'#946543'),height:84,display:'flex',
      alignItems:'center',gap:16,padding:'14px 21px'}}>
      <div style={{width:288}}>
        <div style={{fontSize:16,fontWeight:880,color:WHITE}}>{item.title}</div>
        <div style={{fontSize:12,color:SOFT,marginTop:7}}>{item.sub}</div>
      </div>
      <div style={{background:'#142C43',borderRadius:11,height:19,
        flex:1,border:'1px solid #315771',overflow:'hidden'}}>
        <div style={{height:'100%',width:(item.strength*100)+'%',
          background:i===0?MINT:
            'linear-gradient(90deg,#6CE7C7,#F4B77C,#F26962)',
          boxShadow:'0 0 18px '+item.color,
          transition:'none'}}/>
      </div>
      <div style={{width:124,textAlign:'right',fontWeight:890,
        fontSize:19,color:item.color}}>
        {i===0?'STABLE':attempts>.9?'RISING':'BUILDING'}
      </div>
    </div>)}
  </div>;
};

const Explain:React.FC<{frame:number;cue:Record<Shot07TermId,number>}>=
({frame,cue})=>{
  const stages=[
    {start:cue.RETRY_MECHANISM,title:'RETRY MECHANISM',
      body:'An active Login repeats a safe, read-only account lookup.'},
    {start:cue.FIRST_LOOKUP_RUNNING,title:'TWO POSSIBLE LOOKUPS',
      body:'The first lookup may still run when the retry begins.'},
    {start:cue.RETRY_AMPLIFICATION,title:'RETRY AMPLIFICATION',
      body:'One Login can create multiple database attempts.'},
    {start:cue.RETRY_STORM,title:'RETRY STORM',
      body:'Many extra attempts reach the same overloaded database.'},
    {start:cue.CASCADING_FAILURE,title:'CASCADING FAILURE',
      body:'Database pressure spreads to Auth waiting and Phone timeouts.'},
    {start:cue.READ_ONLY_LOOKUP,title:'SAFE RETRY BOUNDARY',
      body:'Read-only account lookup only; the entire Login is not retried.'},
  ];
  const chosen=stages.reduce((a,b)=>frame>=b.start?b:a,stages[0]);
  const active=shot07Ease(frame,chosen.start,26);
  return <div style={{position:'absolute',left:80,top:847,width:1185,height:105,
    ...panel(AMBER),padding:'17px 23px',fontFamily:AT_FONT,
    display:'flex',flexDirection:'column',gap:8,opacity:active}}>
    <div style={{fontSize:18,fontWeight:870,color:AMBER}}>{chosen.title}</div>
    <div style={{fontSize:19,fontWeight:670,color:WHITE}}>{chosen.body}</div>
  </div>;
};

export const Shot07DirectorVisualV1:React.FC<Shot07SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT07_REQUIRES_REAL_1080P_30FPS_SELECTED_TAKE');
  const {positions:cue}=validateShot07Source(props);
  assertShot07SafeLayout();
  const transition=shot07Ease(frame,36,102);
  const reveal=shot07Ease(frame,75,95);
  const focus=shot07Ease(frame,cue.AUTH_RETRY,84);
  const retry=shot07Ease(frame,cue.AUTH_RETRY,27);
  const firstMaybe=shot07Ease(frame,cue.FIRST_LOOKUP_RUNNING,25);
  const amplification=shot07Ease(frame,cue.RETRY_AMPLIFICATION,30);
  const storm=shot07Ease(frame,cue.RETRY_STORM,72);
  const cascade=shot07Ease(frame,cue.CASCADING_FAILURE,73);
  const boundary=shot07Ease(frame,cue.READ_ONLY_LOOKUP,33);
  return <ATBackground>
    <FrozenShot06End frame={frame} fade={transition}/>
    <AbsoluteFill style={{opacity:transition,pointerEvents:'none'}}>
      <AbsoluteFill style={{opacity:.67,
        transform:'translate3d('+(90-175*reveal)+'px,'+(62*reveal)+
          'px,0) scale('+(1+.08*(1-reveal))+')',
        transformOrigin:'1160px 480px'}}>
        <Shot05Shot04WorldV2 frame={2095+frame} cleanup={1}
          phoneFade={1} push={0} mapExit={0}/>
      </AbsoluteFill>
      <div style={{position:'absolute',left:80,top:78,
        fontFamily:AT_FONT,color:WHITE,zIndex:23,
        opacity:reveal}}>
        <div style={{fontSize:39,fontWeight:890,letterSpacing:'-.02em'}}>
          WHEN RETRYING CREATES MORE FAILURE
        </div>
        <div style={{marginTop:15,width:690,height:2,
          background:'linear-gradient(90deg,#6FECD4,transparent)'}}/>
      </div>
      <NewAttemptPath frame={frame} cue={cue}/>
      <div style={{position:'absolute',left:995,top:515,width:322,
        height:88,opacity:retry,transform:'translateY('+((1-focus)*8)+'px)',
        ...panel(CYAN),padding:'14px 18px',fontFamily:AT_FONT,zIndex:26}}>
        <div style={{color:WHITE,fontSize:18,fontWeight:890}}>
          SAME ACTIVE LOGIN
        </div>
        <div style={{display:'flex',marginTop:12,gap:16,alignItems:'center',
          fontSize:16,fontWeight:850}}>
          <span style={{color:MINT}}>ATTEMPT 1</span>
          <span style={{color:CYAN}}>ATTEMPT 2</span>
        </div>
      </div>
      <div style={{position:'absolute',left:1506,top:240,width:322,height:93,
        opacity:shot07Ease(frame,cue.DB_OVERLOADED,30),
        ...panel(RED),fontFamily:AT_FONT,
        display:'flex',flexDirection:'column',justifyContent:'center',
        padding:'15px 20px',gap:10,zIndex:24}}>
        <b style={{color:'#FFD1CA',fontSize:19}}>USER DATABASE</b>
        <span style={{color:'#FFC0A1',fontSize:16}}>
          RUNNING · {storm>.4?'RETRY PRESSURE RISING':'ALREADY OVERLOADED'}
        </span>
      </div>
      <div style={{position:'absolute',left:995,top:612,width:330,
        fontFamily:AT_FONT,opacity:firstMaybe,
        color:'#C9EAE8',fontSize:14,fontWeight:790}}>
        ATTEMPT 1 MAY STILL BE RUNNING
      </div>
      <RateMeters frame={frame} cue={cue}/>
      <Explain frame={frame} cue={cue}/>
      <AbsoluteFill style={{zIndex:29,
        transform:'translate3d(1520px,690px,0) scale(.265)',
        transformOrigin:'top left',pointerEvents:'none'}}>
        <Shot02PressurePhone frame={4874+frame} reveal={1}
          credential={.22} ui={0}
          emailValue="user@example.com" passwordDots="••••••••"
          emailFocus={0} passwordFocus={0} localUi={0}
          press={0} pressStartFrame={Number.POSITIVE_INFINITY}
          waiting={0} spinner={0} pressure={.70}
          realism={1} heroPush={0}/>
        <div style={{position:'absolute',left:735,top:690,width:447,height:75,
          ...panel(RED),color:'#FFE5E0',fontFamily:AT_FONT,
          fontSize:33,fontWeight:850,display:'flex',
          alignItems:'center',justifyContent:'center',opacity:cascade}}>
          Please try again.
        </div>
      </AbsoluteFill>
      {amplification>0&&<div style={{position:'absolute',left:80,top:578,
        fontFamily:AT_FONT,color:'#FFE0BD',fontSize:15,fontWeight:810,
        opacity:amplification}}>ONE USER REQUEST · MULTIPLE LOOKUP ATTEMPTS</div>}
      {boundary>0&&<div style={{position:'absolute',left:80,top:986,
        fontFamily:AT_FONT,color:'#BAF2DF',fontSize:16,
        fontWeight:820,opacity:boundary}}>
        READ-ONLY LOOKUP RETRY ONLY · ACTIVE LOGIN
      </div>}
    </AbsoluteFill>
  </ATBackground>;
};
