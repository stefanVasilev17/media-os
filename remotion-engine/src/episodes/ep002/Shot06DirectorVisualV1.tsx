import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {shot03CongestionColor} from './Shot03VisualContract';
import {shot04StatusPalette} from './Shot04VisualContract';
import {Shot06LockedSlot,SHOT06_LOCKED_PANEL,Shot06Shot05LockedEnd}
  from './Shot06Shot05LockedEnd';
import {validateShot06Source,assertShot06SafeLayout,shot06Ease,
  shot06DeadlineRemaining,shot06CallerTimedOut,shot06LookupBMayStillRun,
  shot06CancellationIsConditional,type Shot06SceneProps,type Shot06TermId}
  from './Shot06VisualContract';

const WHITE='#F5FCFF',SOFT='#B5D2E6';
const MINT=shot04StatusPalette.healthy,AMBER=shot04StatusPalette.waiting;
const RED=shot03CongestionColor(1),CYAN='#68E5FF';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));

const RequestWindow:React.FC<{
  frame:number;cue:Record<Shot06TermId,number>;
}>=({frame,cue})=>{
  const deadline=shot06DeadlineRemaining(frame,cue);
  const timedOut=shot06CallerTimedOut(frame,cue);
  const firstA=shot06Ease(frame,cue.WAIT_FOR_CONNECTION,20);
  const notStarted=shot06Ease(frame,cue.LOOKUP_NOT_STARTED,20);
  const B=shot06Ease(frame,cue.REQUEST_B,23);
  const inFlight=shot06Ease(frame,cue.LOOKUP_RUNNING,25);
  const cancellation=shot06Ease(frame,cue.CANCELLATION,24);
  const conditional=shot06CancellationIsConditional(frame,cue)
    ?shot06Ease(frame,cue.STOP_IF_POSSIBLE,22):0;
  return <>
    <div style={{position:'absolute',left:280,top:218,width:1240,
      height:535,zIndex:21,fontFamily:AT_FONT,
      ...SHOT06_LOCKED_PANEL('#9184FF','rgba(125,111,255,.29)'),
      padding:'22px 27px 26px',
      background:'linear-gradient(150deg,rgba(11,22,50,.99),rgba(4,13,34,.998))'}}>
      <div style={{display:'flex',justifyContent:'space-between',
        alignItems:'center',height:58}}>
        <div style={{fontSize:30,fontWeight:850,color:WHITE}}>
          Database Connection Pool
        </div>
        <div style={{display:'flex',alignItems:'center',gap:15}}>
          <span style={{color:'#D3E9F3',fontSize:16}}>CONFIGURED MAXIMUM</span>
          <b style={{color:WHITE,fontSize:27}}>8 SLOTS</b>
        </div>
      </div>
      <div style={{borderTop:'1px solid #35516F',margin:'16px 0 21px'}}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',
        gap:'16px 18px',position:'relative'}}>
        {Array.from({length:8},(_,index)=>
          <Shot06LockedSlot key={index} index={index} frame={frame+2779} fill={1}/>)}
        <div style={{position:'absolute',left:'25.35%',top:0,
          width:'23.6%',height:126,border:'2px solid '+MINT,
          borderRadius:12,pointerEvents:'none',opacity:B*.96,
          boxShadow:'0 0 '+(9+18*inFlight)+'px rgba(115,255,208,.40)',
          boxSizing:'border-box'}}>
          <div style={{position:'absolute',bottom:-17,left:11,
            padding:'4px 12px',fontSize:13,fontWeight:850,
            borderRadius:6,color:'#C6FFEC',background:'#164537',
            border:'1px solid #3BAF89'}}>
            REQUEST B
          </div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:19,
        marginTop:21,height:56}}>
        <div style={{width:230,flex:'0 0 230px',fontWeight:830,
          fontSize:16,color:timedOut?'#FFBCA9':AMBER}}>
          REQUEST A · {timedOut?'TIMED OUT':'DEADLINE'}
        </div>
        <div style={{height:11,flex:1,borderRadius:12,
          background:'#243A50',border:'1px solid #3C5669',
          overflow:'hidden'}}>
          <div style={{height:'100%',width:(deadline*100)+'%',
            borderRadius:12,background:timedOut?RED:
              'linear-gradient(90deg,#76EFCD,#F4B47A)',
            boxShadow:'0 0 14px rgba(244,180,122,.40)'}}/>
        </div>
        <div style={{fontSize:20,fontWeight:900,minWidth:95,
          textAlign:'right',color:timedOut?'#FFADAA':MINT}}>
          {timedOut?'EXPIRED':Math.round(deadline*100)+'%'}
        </div>
        <div style={{fontSize:25,fontWeight:900,color:'#FFB68A'}}>
          8/8 BUSY
        </div>
      </div>
      {conditional>0&&<div style={{position:'absolute',left:30,right:30,
        bottom:21,height:63,padding:'8px 13px',
        background:'linear-gradient(90deg,rgba(10,43,44,.98),rgba(49,35,43,.97))',
        border:'1px solid #567D85',borderRadius:10,
        display:'flex',justifyContent:'space-between',alignItems:'center',
        gap:21,opacity:conditional}}>
        <span style={{fontSize:15,fontWeight:840,color:MINT}}>
          IF CANCELLATION HONORED → SLOT FREED SOONER
        </span>
        <span style={{fontSize:15,fontWeight:840,color:AMBER}}>
          OTHERWISE → LOOKUP MAY CONTINUE
        </span>
      </div>}
      {cancellation>0&&conditional===0&&<div style={{
        position:'absolute',right:27,bottom:23,
        color:CYAN,fontSize:16,fontWeight:840,
        opacity:cancellation}}>
        CANCELLATION SIGNAL · REQUEST B
      </div>}
    </div>
    <div style={{position:'absolute',left:1550,top:476,
      width:302,height:92,zIndex:25,fontFamily:AT_FONT,
      pointerEvents:'none'}}>
      <div style={{position:'absolute',inset:0,
        opacity:notStarted*(1-B),
        transform:'translateY('+(1-notStarted)*9+'px)',
        background:'linear-gradient(135deg,rgba(62,32,35,.97),rgba(27,22,38,.98))',
        border:'1px solid #C5685D',borderLeft:'3px solid '+AMBER,
        borderRadius:11,padding:'13px 15px',
        boxSizing:'border-box',display:'flex',alignItems:'center',
        color:'#FFD6CA',fontSize:16,lineHeight:1.35,
        fontWeight:790}}>
        REQUEST A · DB LOOKUP NOT STARTED
      </div>
      <div style={{position:'absolute',inset:0,
        opacity:B,transform:'translateY('+((1-B)*9)+'px)',
        background:'linear-gradient(135deg,rgba(7,45,53,.98),rgba(9,29,46,.99))',
        border:'1px solid #3BAF95',borderLeft:'3px solid '+MINT,
        borderRadius:11,padding:'13px 15px',
        boxSizing:'border-box',display:'flex',gap:9,alignItems:'center',
        color:'#B9EEEA',fontSize:16,lineHeight:1.35,fontWeight:850}}>
        <span>REQUEST B · DB LOOKUP MAY STILL RUN</span>
        <span style={{width:8,height:8,flexShrink:0,borderRadius:10,
          background:MINT,boxShadow:'0 0 12px '+MINT}}/>
      </div>
    </div>
    <div style={{position:'absolute',left:282,top:795,width:1236,
      height:96,zIndex:23,fontFamily:AT_FONT,
      display:'flex',gap:16,alignItems:'center'}}>
      <div style={{fontSize:16,color:WHITE,fontWeight:790,
        minWidth:230}}>REQUEST QUEUE
        <div style={{marginTop:8,fontSize:12,fontWeight:750,
          color:timedOut?'#FFB3A9':AMBER}}>
          {timedOut?'CALLER TIMED OUT':'WAITING FOR CONNECTION'}
        </div>
      </div>
      <div style={{flex:1,display:'flex',gap:11,alignItems:'center',
        height:63,padding:'0 15px',
        border:'2px solid rgba(238,171,95,.53)',
        borderRadius:13,background:'rgba(40,27,34,.76)'}}>
        <div style={{width:45,height:28,borderRadius:7,
          background:timedOut?RED:AMBER,
          opacity:.72+.28*firstA,
          boxShadow:'0 0 17px rgba(245,151,102,.40)',
          transform:'translateX('+(timedOut?-13:0)+'px)'}}/>
        <span style={{fontSize:17,fontWeight:870,
          color:timedOut?'#FFB9AD':'#FFE4C5'}}>
          {timedOut?'REQUEST A · TIMED OUT':'REQUEST A · WAITING'}
        </span>
        {timedOut&&<span style={{marginLeft:'auto',fontSize:15,
          fontWeight:740,color:SOFT}}>NO DB LOOKUP STARTED</span>}
      </div>
      <div style={{fontSize:18,fontWeight:870,color:AMBER,
        textAlign:'right',minWidth:70}}>7 WAIT</div>
    </div>
    <div style={{position:'absolute',left:282,top:904,width:1236,
      height:108,zIndex:24,fontFamily:AT_FONT,
      display:'flex',flexDirection:'column',gap:8}}>
      <div style={{height:49,width:'100%',display:'flex',
        alignItems:'center',gap:18,borderRadius:'0 11px 11px 0',
        borderLeft:'3px solid '+(timedOut?RED:AMBER),
        background:'linear-gradient(90deg,rgba(8,32,53,.96),rgba(3,15,30,.86))',
        padding:'9px 17px',boxSizing:'border-box'}}>
        <span style={{fontSize:15,fontWeight:870,
          color:timedOut?'#FFAEA3':AMBER,minWidth:199}}>
          {timedOut?'REQUEST TIMEOUT':'REQUEST A'}
        </span>
        <span style={{fontSize:17,fontWeight:650,color:WHITE}}>
          {timedOut?'The caller stops waiting; its database lookup never started.':
            'Waiting for a connection does not pause the request deadline.'}
        </span>
      </div>
      <div style={{height:49,width:'100%',display:'flex',
        alignItems:'center',gap:18,borderRadius:'0 11px 11px 0',
        borderLeft:'3px solid '+MINT,
        background:'linear-gradient(90deg,rgba(8,32,53,.96),rgba(3,15,30,.86))',
        opacity:B,padding:'9px 17px',boxSizing:'border-box'}}>
        <span style={{fontSize:15,fontWeight:870,color:MINT,
          minWidth:199}}>REQUEST B</span>
        <span style={{fontSize:17,fontWeight:650,color:WHITE}}>
          {conditional>0?'Cancellation may free a connection early, if honored.':
            'The caller may time out while its database lookup still runs.'}
        </span>
      </div>
    </div>
  </>;
};

const PhoneOutcome:React.FC<{
  frame:number;cue:Record<Shot06TermId,number>;
}>=({frame,cue})=>{
  const error=shot06Ease(frame,cue.PHONE_ERROR,22);
  const warning=shot06Ease(frame,cue.TIME_RUNS_OUT,19);
  return <>
    <AbsoluteFill style={{zIndex:28,
      transform:'translate3d(1320px,590px,0) scale(.35)',
      transformOrigin:'top left',pointerEvents:'none'}}>
      <Shot02PressurePhone frame={2779+frame} reveal={1}
        credential={.22} ui={0}
        emailValue="user@example.com" passwordDots="••••••••"
        emailFocus={0} passwordFocus={0} localUi={0}
        press={0} pressStartFrame={Number.POSITIVE_INFINITY}
        waiting={1-error} spinner={1-error}
        pressure={.70} realism={1} heroPush={0}/>
      <div style={{position:'absolute',left:735,top:690,
        width:447,height:75,border:'2px solid #FF9C91',
        borderRadius:18,display:'flex',alignItems:'center',
        justifyContent:'center',background:'rgba(74,31,37,.96)',
        boxShadow:'0 0 30px rgba(252,93,76,.35)',
        color:'#FFE5E0',fontFamily:AT_FONT,fontSize:33,fontWeight:850,
        opacity:error,transform:'translateY('+((1-error)*12)+'px)'}}>
        Please try again.
      </div>
    </AbsoluteFill>
    <div style={{position:'absolute',left:1532,top:995,zIndex:30,
      color:error?'#FFB2A6':AMBER,fontFamily:AT_FONT,
      fontSize:15,fontWeight:830,letterSpacing:'.035em'}}>
      PHONE · {error?'PLEASE TRY AGAIN':'WAITING'} 
    </div>
    <div style={{position:'absolute',left:1585,top:734,
      width:13,height:13,borderRadius:10,opacity:warning,
      background:RED,boxShadow:'0 0 17px '+RED}}/>
  </>;
};

export const Shot06DirectorVisualV1:React.FC<Shot06SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT06_REQUIRES_REAL_1080P_30FPS_SELECTED_TAKE');
  const {terms}=validateShot06Source(props);
  assertShot06SafeLayout();
  const cue=Object.fromEntries(terms.map(t=>[t.id,t.startFrame])) as
    Record<Shot06TermId,number>;
  const reveal=shot06Ease(frame,18,82);
  const focus=shot06Ease(frame,40,112);
  const B=shot06Ease(frame,cue.REQUEST_B,22);
  return <ATBackground>
    <Shot06Shot05LockedEnd frame={frame} fade={reveal}/>
    <AbsoluteFill style={{zIndex:17,opacity:reveal,
      pointerEvents:'none'}}>
      <div style={{position:'absolute',left:278,top:110,
        fontFamily:AT_FONT,transform:'translateX('+(-7*focus)+'px)'}}>
        <div style={{fontSize:38,fontWeight:890,color:WHITE,
          letterSpacing:'-.03em'}}>THE DEADLINE EXPIRES</div>
        <div style={{width:470,height:2,marginTop:15,
          background:'linear-gradient(90deg,#64CDE9,transparent)'}}/>
      </div>
      <AbsoluteFill style={{transform:'translate3d('+(-5*focus)+
        'px,'+(-4*focus)+'px,0) scale('+(1+.012*focus)+')',
        transformOrigin:'720px 530px',pointerEvents:'none'}}>
        <RequestWindow frame={frame} cue={cue}/>
      </AbsoluteFill>
      <PhoneOutcome frame={frame} cue={cue}/>
      {B>0&&<svg width="1920" height="1080" viewBox="0 0 1920 1080"
        style={{position:'absolute',inset:0,opacity:B,
          pointerEvents:'none',zIndex:18}}>
        <path d="M735 361 C900 309 1228 296 1394 322"
          stroke={MINT} strokeWidth="3" fill="none"
          strokeDasharray="13 15" opacity=".63"/>
        <circle cx={1394} cy={322} r={8} fill={RED}
          style={{filter:'drop-shadow(0 0 12px rgba(255,89,80,.55))'}}/>
      </svg>}
    </AbsoluteFill>
  </ATBackground>;
};
