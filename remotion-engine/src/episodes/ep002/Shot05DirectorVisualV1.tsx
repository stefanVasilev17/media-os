import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATBackground,AT_FONT} from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {shot04StatusPalette} from './Shot04VisualContract';
import {shot03BlendHex,shot03CongestionColor} from './Shot03VisualContract';
import {Shot05Shot04WorldV2,SHOT05_LOCKED_PANEL} from './Shot05Shot04WorldV2';
import {shot05Ease,shot05QueueDepth,shot05ReplayBusy,shot05SlotFill,
  shot05WaitingForConnection,validateShot05Source,assertShot05SafeLayout,
  type Shot05SceneProps,type Shot05TermId} from './Shot05VisualContract';

const WHITE='#F5FCFF',MINT=shot04StatusPalette.healthy;
const CYAN='#68E5FF',RED=shot03CongestionColor(1);
const AMBER=shot04StatusPalette.waiting,SOFT='#B5D2E6';
const box=SHOT05_LOCKED_PANEL;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));

const Slot:React.FC<{index:number;frame:number;fill:number}>=
({index,frame,fill})=>{
  const occupied=clamp(fill);
  const accent=shot03BlendHex('#74E7D2','#F6AF80',occupied);
  const border=shot03BlendHex('#397FAD','#C77B5F',occupied);
  const sweep=shot05Ease(frame,0,16);
  return <div style={{height:126,borderRadius:12,
    border:'2px solid '+border,
    background:'linear-gradient(145deg,rgba(10,47,71,.99),rgba(5,26,48,.99))',
    boxShadow:'0 0 '+(8+occupied*19)+'px '+
      (occupied>.25?'rgba(252,141,87,.30)':'rgba(55,202,252,.18)'),
    padding:'15px 17px',boxSizing:'border-box',
    position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,
      width:(occupied*100)+'%',pointerEvents:'none',
      borderRight:'2px solid '+accent,
      background:'linear-gradient(100deg,rgba(243,142,93,.08),rgba(238,127,76,.26))',
      boxShadow:'0 0 '+(22*occupied)+'px rgba(246,157,96,.32)',
      opacity:occupied}}/>
    <div style={{position:'relative',display:'flex',
      justifyContent:'space-between',alignItems:'center'}}>
      <span style={{fontSize:16,color:SOFT,fontWeight:730}}>
        CONN {String(index+1).padStart(2,'0')}
      </span>
      <span style={{width:11,height:11,borderRadius:12,
        background:accent,boxShadow:'0 0 '+(8+occupied*12)+'px '+accent,
        opacity:.78+.2*Math.sin(frame*.05+index)**2}}/>
    </div>
    <div style={{height:32,marginTop:18,position:'relative',
      transform:'translateY('+(1-occupied)*1.5+'px)'}}>
      <div style={{position:'absolute',left:0,top:0,
        fontSize:21,fontWeight:820,color:'#A2FFE7',
        opacity:1-occupied,transform:'translateY('+(occupied*-6)+'px)'}}>
        AVAILABLE
      </div>
      <div style={{position:'absolute',left:0,top:0,
        fontSize:21,fontWeight:850,color:'#FFCEAB',
        opacity:occupied,transform:'translateY('+((1-occupied)*7)+'px)'}}>
        IN USE
      </div>
    </div>
    <div style={{height:5,width:'90%',marginTop:7,borderRadius:5,
      background:'#1D344B',overflow:'hidden',position:'relative'}}>
      <div style={{height:'100%',width:(14+86*occupied)+'%',
        background:'linear-gradient(90deg,#77F4DB,'+accent+')',
        boxShadow:'0 0 '+(9*sweep)+'px '+accent}}/>
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
    <div style={{...box('#9184FF','rgba(125,111,255,.29)'),
      width:'100%',height:'100%',padding:'22px 27px 26px',
      background:'linear-gradient(150deg,rgba(11,22,50,.99),rgba(4,13,34,.998))'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{color:WHITE,fontSize:30,fontWeight:850,marginTop:4}}>
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
            fill={shot05SlotFill(frame,index,terms)}/>)}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:22,
        alignItems:'center',gap:20}}>
        <div style={{fontSize:17,fontWeight:760,color:'#A8CADF'}}>
          {replay?'EARLIER MOMENTS':null}
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

const ConceptExplainers:React.FC<{
  frame:number;terms:Record<Shot05TermId,number>;
}>=({frame,terms})=>{
  const lines=[
    {name:'REQUEST QUEUEING',color:AMBER,
      explanation:'Requests lining up until a connection becomes available.',
      start:terms.REQUEST_QUEUEING},
    {name:'IN-FLIGHT REQUESTS',color:MINT,
      explanation:"Requests that have started but haven't finished.",
      start:terms.IN_FLIGHT},
  ];
  return <div style={{position:'absolute',left:282,top:903,
    width:1236,height:109,zIndex:26,fontFamily:AT_FONT,
    display:'flex',flexDirection:'column',gap:8}}>
    {lines.map(item=>{
      const visible=shot05Ease(frame,item.start,20);
      return <div key={item.name} style={{
        width:'100%',height:49,borderLeft:'3px solid '+item.color,
        background:'linear-gradient(90deg,rgba(8,32,53,.94),rgba(3,15,30,.86))',
        borderRadius:'0 11px 11px 0',boxSizing:'border-box',
        padding:'9px 18px',display:'flex',gap:21,alignItems:'center',
        opacity:visible,transform:'translateY('+((1-visible)*9)+'px)'}}>
        <span style={{color:item.color,fontSize:15,fontWeight:860,
          minWidth:204,letterSpacing:'.035em'}}>{item.name}</span>
        <span style={{fontSize:17,color:WHITE,fontWeight:650}}>
          {item.explanation}
        </span>
      </div>;
    })}
  </div>;
};

export const Shot05DirectorVisualV1:React.FC<Shot05SceneProps>=(props)=>{
  const frame=useCurrentFrame(),video=useVideoConfig();
  if(video.width!==1920||video.height!==1080||video.fps!==30
    ||video.durationInFrames!==props.durationInFrames)
    throw Error('SHOT05_REQUIRES_REAL_1080P_30FPS_VOICE_DURATION');
  const {terms}=validateShot05Source(props);
  assertShot05SafeLayout();
  const cue=Object.fromEntries(terms.map(t=>[t.id,t.startFrame])) as
    Record<Shot05TermId,number>;
  const phoneFade=shot05Ease(frame,12,38);
  const cleanup=shot05Ease(frame,18,29);
  const push=shot05Ease(frame,61,99);
  const mapExit=shot05Ease(frame,167,36);
  const interior=shot05Ease(frame,156,43);
  const busy=shot05ReplayBusy(frame,cue);
  const queue=shot05QueueDepth(frame,cue);
  const phone=shot05Ease(frame,cue.SPINNER,26);
  const final=shot05Ease(frame,cue.TIME_RUNNING_OUT,25);
  const queueEntry=shot05Ease(frame,cue.ANOTHER_LOGIN,24);
  const highlight=shot05Ease(frame,cue.CONNECTION_POOL,18);
  return <ATBackground>
    <Shot05Shot04WorldV2 frame={frame} cleanup={cleanup}
      phoneFade={phoneFade} push={push} mapExit={mapExit}/>
    <AbsoluteFill style={{zIndex:20,opacity:interior,pointerEvents:'none'}}>
      <div style={{position:'absolute',left:278,top:110,fontFamily:AT_FONT}}>
        <div style={{fontSize:38,fontWeight:890,color:WHITE,
          letterSpacing:'-.03em'}}>THE HIDDEN CONNECTION QUEUE</div>
        <div style={{width:470,height:2,marginTop:15,
          background:'linear-gradient(90deg,#64CDE9,transparent)'}}/>
      </div>
      <Connections frame={frame} active={highlight}
        busy={busy} terms={cue} intro={interior}/>
      <RequestQueue frame={frame} terms={cue} depth={queue}
        reveal={queueEntry}/>
      <ConceptExplainers frame={frame} terms={cue}/>
      <AbsoluteFill style={{zIndex:28,opacity:phone,
        transform:'translate3d(1320px,590px,0) scale(.35)',
        transformOrigin:'top left',pointerEvents:'none'}}>
        <Shot02PressurePhone frame={frame} reveal={1} credential={.22} ui={0}
          emailValue="user@example.com" passwordDots="••••••••"
          emailFocus={0} passwordFocus={0} localUi={0}
          press={0} pressStartFrame={Number.POSITIVE_INFINITY}
          waiting={1} spinner={1} pressure={.70} realism={1} heroPush={0}/>
      </AbsoluteFill>
      <div style={{position:'absolute',left:1555,top:995,zIndex:30,
        fontFamily:AT_FONT,fontSize:15,fontWeight:830,
        color:AMBER,letterSpacing:'.035em',opacity:final}}>
        PHONE · TIME RUNNING OUT
      </div>
    </AbsoluteFill>
  </ATBackground>;
};
