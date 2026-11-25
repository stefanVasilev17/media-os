import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {SHOT06_FLEET,SHOT06_INPUTS,SHOT06_OUTPUTS,shot06Path} from '../../components/architectural-thinking/EP004Shot06FleetPreview.mjs';
import {REEL_INPUT,REEL_OUTPUTS,shot07State,validateEp004Shot07Production} from '../../components/architectural-thinking/EP004Shot07ProductionWorld.mjs';
import type {Ep004Shot07RenderProps,CascadeState} from '../../components/architectural-thinking/EP004Shot07ProductionWorld.mjs';

const CYAN='#81D6E8',VIOLET='#BAA2F3',AMBER='#EDB65C',GREEN='#85D4A7',RED='#E87378',WHITE='#E4EBF2';
const FONT='Arial, sans-serif';
const color=(lane:number)=>lane===0?CYAN:VIOLET;
const Defs=()=> <defs>
  <radialGradient id="s6Bg"><stop stopColor="#294052"/><stop offset="1" stopColor="#090F18"/></radialGradient>
  <linearGradient id="s6Floor" x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#172633"/><stop offset="1" stopColor="#0B131D"/></linearGradient>
  <linearGradient id="s6Metal" x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#6A7B8C"/><stop offset=".11" stopColor="#435466"/><stop offset=".55" stopColor="#26333F"/><stop offset="1" stopColor="#111A25"/></linearGradient>
  <linearGradient id="s6Top" x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#778B9C"/><stop offset="1" stopColor="#303F4E"/></linearGradient>
  <linearGradient id="s6Face" x1="0%" y1="0%" x2="0%" y2="100%"><stop stopColor="#1A2835"/><stop offset="1" stopColor="#080F18"/></linearGradient>
  <pattern id="s6Vent" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="6.5" cy="6.5" r="3.8" fill="#050A10"/><path d="M3 11H10" stroke="#788A9D" strokeOpacity=".2"/></pattern>
  <filter id="s6Glow" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feGaussianBlur stdDeviation="10"/></filter>
</defs>;
const Route:React.FC<{d:string;tone:string;active?:boolean}>=({d,tone,active=true})=><g fill="none" strokeLinecap="round" strokeLinejoin="round">
  {active&&<path d={d} stroke={tone} strokeWidth={27} opacity=".22" filter="url(#s6Glow)"/>}
  <path d={d} stroke={active?tone:'#617080'} strokeWidth={8} opacity={active?.9:.42}/>
</g>;
const Server:React.FC<{x:number;y:number;id:string;status:string;load:number;showLabels?:boolean}>=({x,y,id,status,load,showLabels=true})=>{
 const tint=status==='Unresponsive'?RED:status==='Waiting'||status==='Higher load'?AMBER:GREEN;
 return <g transform={'translate('+x+' '+y+')'}>
   <ellipse cx="190" cy="158" rx="188" ry="16" fill="#000" opacity=".30"/>
   <path d="M0 0 L31 -32 H355 L385 0Z" fill="url(#s6Top)" stroke="#8292A0" strokeWidth="2"/>
   <path d="M0 0 H385 V140 H0Z" fill="url(#s6Metal)" stroke="#8192A1" strokeWidth="2"/>
   <rect x="14" y="14" width="357" height="112" rx="9" fill="url(#s6Face)" stroke="#627688" strokeWidth="2"/>
   <rect x="27" y="27" width="117" height="84" rx="4" fill="url(#s6Vent)"/>
   {[0,1].map(i=><g key={i}><rect x="159" y={28+i*44} width="159" height="31" rx="5" fill="#303E4C" stroke="#6A7D8E"/><path d={'M172 '+(39+i*44)+' H291'} stroke="#101822" strokeWidth="6" strokeLinecap="round"/></g>)}
   <circle cx="345" cy="38" r="10" fill={status==='Higher load'?GREEN:tint}/>
   <rect x="171" y="87" width={133*load} height="10" rx="5" fill={tint}/>
   <rect x="0" y="0" width="385" height="140" rx="6" fill="none" stroke={tint} strokeWidth="2" strokeOpacity={status==='Unresponsive'?.8:.19}/>
   {[9,376].map(px=><g key={px}><circle cx={px} cy="17" r="4" fill="#A3AEB9"/><circle cx={px} cy="121" r="4" fill="#A3AEB9"/></g>)}
   {showLabels&&<><text x="0" y="-53" fontFamily={FONT} fontSize="29" fontWeight="700" fill={WHITE}>Server {id}</text>
   <text x="385" y="-53" textAnchor="end" fontFamily={FONT} fontSize="24" fill={tint}>{status}</text></>}
 </g>;
};
const Client:React.FC<{y:number;mail:boolean;showLabels?:boolean}>=({y,mail,showLabels=true})=><g transform={'translate(100 '+y+')'}>
  <rect width="250" height="114" rx="24" fill={mail?'#1A344D':'#2A2845'} stroke={mail?CYAN:VIOLET} strokeOpacity=".45" strokeWidth="2"/>
  {mail?<g><rect x="24" y="29" width="77" height="55" rx="5" fill="#BCE0F3"/><path d="M24 30L62 57 101 30" stroke="#477C9B" strokeWidth="5" fill="none"/><rect x="12" y="41" width="43" height="43" rx="6" fill="#247DB9"/><text x="33" y="72" fontSize="29" fontWeight="700" textAnchor="middle" fill="white">O</text></g>:<g><circle cx="79" cy="32" r="15" fill="#B3A8EE"/><rect x="61" y="50" width="38" height="40" rx="11" fill="#8376C7"/><rect x="13" y="39" width="54" height="54" rx="8" fill="#6B5FBA"/><text x="40" y="77" fontSize="37" fontWeight="700" textAnchor="middle" fill="white">T</text></g>}
  {showLabels&&<text x="117" y="65" fontFamily={FONT} fontSize="27" fontWeight="650" fill={WHITE}>{mail?'Outlook':'Teams'}</text>}
</g>;
const Router:React.FC<{showLabels?:boolean}>=({showLabels=true})=> <g transform="translate(685 440)">
  <ellipse cx="165" cy="204" rx="173" ry="18" fill="#000" opacity=".32"/>
  <path d="M0 0L24 -26H307L330 0Z" fill="url(#s6Top)" stroke="#788B9C" strokeWidth="2"/>
  <rect width="330" height="190" rx="15" fill="url(#s6Metal)" stroke="#7D8E9E" strokeWidth="2"/>
  <rect x="17" y="16" width="296" height="155" rx="13" fill="url(#s6Face)" stroke="#667B8D"/>
  <g transform="translate(165 92)" stroke="#BBCDD8" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M0 -48V48M-48 0H48M0 -48L-11 -35M0 -48L11 -35M0 48L-11 35M0 48L11 35M-48 0L-35 -11M-48 0L-35 11M48 0L35 -11M48 0L35 11"/></g>
  <circle cx="286" cy="134" r="7" fill={GREEN}/>
  {showLabels&&<text x="165" y="242" fontFamily={FONT} fontSize="32" textAnchor="middle" fill={WHITE} fontWeight="650">Router</text>}
</g>;

const PacketLayer:React.FC<{s:CascadeState;reel?:boolean}>=({s,reel=false})=><g>{s.packets.map(p=><g key={p.id+'-'+p.phase}><circle cx={p.x} cy={p.y} r={reel?13:17} fill={p.phase==='RESPONSE'?RED:p.phase==='STOPPED'?AMBER:color(p.lane)} opacity={p.phase==='STOPPED'?.12:.09}/><circle cx={p.x} cy={p.y} r={reel?8:10} fill={p.phase==='RESPONSE'?RED:p.phase==='STOPPED'?AMBER:color(p.lane)} opacity={p.phase==='STOPPED'?.65:1}/></g>)}</g>;
const Fleet:React.FC<{s:CascadeState;compact?:boolean}>=({s,compact=false})=><g>
 {SHOT06_INPUTS.map((p,i)=><Route key={i} d={shot06Path(p)} tone={color(i)}/>)}
 {SHOT06_OUTPUTS.map((p,i)=><Route key={i} d={shot06Path(p)} tone={i===2?VIOLET:CYAN} active={s.states[i].status!=='Unresponsive'}/>)}
 <Client y={383} mail showLabels={!compact}/><Client y={593} mail={false} showLabels={!compact}/><Router showLabels={!compact}/>
 {SHOT06_FLEET.map((n,i)=><Server key={n.id} x={n.x} y={n.y} id={n.id} status={s.states[i].status} load={s.states[i].load} showLabels={!compact}/>)}
 <PacketLayer s={s}/>
 </g>;
const FleetSilhouette:React.FC<{x:number;y:number;tone:string}>=({x,y,tone})=><g transform={'translate('+x+' '+y+')'} opacity=".32">
  <path d="M0 0L15 -13H103L118 0Z" fill="#708394" stroke="#8293A0" strokeWidth="1.5"/>
  <rect width="118" height="46" rx="4" fill="url(#s6Metal)" stroke={tone} strokeWidth="1.4"/>
  <rect x="8" y="8" width="102" height="30" rx="3" fill="url(#s6Face)"/>
  <path d="M17 17H76M17 29H76" stroke="#53677A" strokeWidth="3"/>
  <circle cx="96" cy="17" r="4" fill={tone}/>
 </g>;
const FleetOverview:React.FC<{s:CascadeState}>=({s})=><g>
  {Array.from({length:24},(_,i)=><FleetSilhouette key={i} x={170+(i%8)*218} y={257+Math.floor(i/8)*205} tone={s.percentage?(i%7===0?'#67798A':RED):'#7D8790'}/>)}
  <rect x="0" y="0" width="1920" height="1080" fill="url(#s6Bg)" opacity=".32"/>
  <g transform="translate(100 414) scale(.48)"><Fleet s={s} compact/></g>
  {s.percentage&&<g>
    <text x="1360" y="400" fontSize="148" fontWeight="760" letterSpacing="-5" fill={RED} textAnchor="middle">&gt;80%</text>
    <text x="1360" y="462" textAnchor="middle" fontSize="31" fontWeight="650" fill={WHITE}>Affected gateway servers</text>
    <text x="1360" y="508" textAnchor="middle" fontSize="30" fill={WHITE}>unresponsive at the worst point</text>
    <text x="1360" y="556" textAnchor="middle" fontSize="22" fill="#A9B9C7">Microsoft preliminary report</text>
  </g>}
  {s.elapsed&&<g transform="translate(1136 644)">
    <circle cx="38" cy="38" r="31" fill="#142432" stroke={AMBER} strokeWidth="3"/>
    <path d="M38 20V38L53 45" stroke={AMBER} strokeWidth="4" fill="none" strokeLinecap="round"/>
    <text x="90" y="47" fontSize="32" fontWeight="650" fill={AMBER}>Less than two hours</text>
  </g>}
 </g>;
const ReelServer:React.FC<{x:number;id:string;status:string;load:number}>=({x,id,status,load})=>{
 const tint=status==='Unresponsive'?RED:status==='Higher load'?AMBER:GREEN;
 return <g transform={'translate('+x+' 650)'}>
  <g transform="scale(.46)"><Server x={0} y={0} id={id} status={status} load={load} showLabels={false}/></g>
  <text x="88" y="91" fontSize="22" fontWeight="700" fill={WHITE} textAnchor="middle">Server {id}</text>
  <circle cx="88" cy="-8" r="5.5" fill={tint} stroke="#0A1019" strokeWidth="1.5"/>
  <text x="88" y="121" fontSize="19" fill={tint} textAnchor="middle">{status==='Unresponsive'?'No response':status==='Higher load'?'High load':'Responsive'}</text>
 </g>;
};
const Reel:React.FC<{s:CascadeState;rescue:boolean}>=({s,rescue})=><g>
  {s.headline==='A BACKUP IS NOT AUTOMATICALLY A RESCUE'?<>
     <text x="960" y="120" fontSize="31" textAnchor="middle" fontWeight="700" fill={WHITE}>A backup server is not</text>
     <text x="960" y="157" fontSize="31" textAnchor="middle" fontWeight="700" fill={WHITE}>automatically a rescue.</text>
   </>:<text x="960" y="132" fontSize="23" textAnchor="middle" fontWeight="700" fill={WHITE}>{s.headline}</text>}
  <g transform="translate(845 181)">
   <rect width="230" height="65" rx="17" fill="#203D53" stroke={CYAN} strokeWidth="2"/>
   <rect x="19" y="19" width="47" height="29" rx="4" fill="#BCE0F3"/><path d="M19 19L42.5 35 66 19" fill="none" stroke="#477C9B" strokeWidth="3"/>
   <text x="82" y="42" fontSize="27" fontWeight="650" fill={WHITE}>Outlook</text>
  </g>
  <Route d={shot06Path(REEL_INPUT)} tone={CYAN}/>
  {REEL_OUTPUTS.map((p,i)=><Route key={i} d={shot06Path(p)} tone={i===2?AMBER:CYAN} active={i===1?s.states[1].status!=='Unresponsive':i===2&&!!s.redirect}/>)}
  <g transform="translate(828 330)">
    <ellipse cx="132" cy="145" rx="141" ry="13" fill="#000" opacity=".33"/>
    <path d="M0 0L19 -20H245L264 0Z" fill="url(#s6Top)" stroke="#8294A5" strokeWidth="2"/>
    <rect width="264" height="158" rx="13" fill="url(#s6Metal)" stroke="#8194A5" strokeWidth="2"/>
    <rect x="13" y="12" width="238" height="134" rx="11" fill="url(#s6Face)" stroke="#617789"/>
    <g transform="translate(132 73)" fill="none" stroke="#C7D7E1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><path d="M0 -35V35M-35 0H35M0 -35L-9 -24M0 -35L9 -24M0 35L-9 24M0 35L9 24M-35 0L-24 -9M-35 0L-24 9M35 0L24 -9M35 0L24 9"/></g>
    <circle cx="230" cy="114" r="7" fill={GREEN}/>
    <text x="132" y="131" textAnchor="middle" fontSize="23" fontWeight="650" fill={WHITE}>Router</text>
  </g>
  {s.states.map((n,i)=><ReelServer key={n.id} x={676+i*196} id={n.id} status={n.status} load={n.load}/>)}
  <PacketLayer s={s} reel/>
  <g transform="translate(695 831)">
    <path d="M0 0H530" stroke="#526575" strokeWidth="1"/>
    <circle cx="10" cy="42" r="7" fill={GREEN}/>
    <text x="30" y="51" fontSize="23" fill={WHITE}>Routing decision</text>
    <text x="530" y="51" fontSize="25" fontWeight="700" textAnchor="end" fill={GREEN}>{rescue?'Valid':'Ready'}</text>
    {s.globalBad&&<>
      <circle cx="10" cy="94" r="7" fill={RED}/>
      <text x="30" y="103" fontSize="23" fill={WHITE}>Shared availability</text>
      <text x="530" y="103" fontSize="25" fontWeight="700" fill={RED} textAnchor="end">Degrading</text>
    </>}
  </g>
  {s.payoff&&<text x="960" y="1020" fontSize="24" fontWeight="700" textAnchor="middle" fill={RED}>FAILOVER CAN SPREAD THE FAILURE</text>}
 </g>;
export const Shot07ProductionScene:React.FC<Ep004Shot07RenderProps>=props=>{
 validateEp004Shot07Production(props,true);
 const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||cfg.durationInFrames!==props.durationInFrames)throw Error('SHOT07_EXACT_VIDEO_CONTRACT_REQUIRED');
 const s=shot07State(frame,props),e=props.eventFrames;
 const overviewStart=props.verifiedCues[3].startFrame;
 const mix=Math.max(0,Math.min(1,(frame-overviewStart)/42));
 const blend=mix*mix*(3-2*mix);
 const reel=s.stage==='reel';
 // The Reel cut is intentional and independently comprehensible. It is a
 // teaching reconstruction, not a claim that the actual outage restarts.
 return <AbsoluteFill style={{background:'#0A1019',overflow:'hidden'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" fontFamily={FONT}>
   <Defs/>
   <rect width="1920" height="1080" fill="url(#s6Bg)"/><rect y="905" width="1920" height="175" fill="url(#s6Floor)"/>
   {!reel&&<>
     <g opacity={1-blend} transform={'translate('+(-s.focus*90)+' '+(-s.focus*20)+') scale('+(1+s.focus*.06)+')'}><Fleet s={s}/></g>
     {s.stage==='overview'&&<g opacity={blend}><FleetOverview s={s}/></g>}
     <text x="100" y="161" fontSize="46" fontWeight="720" fill={WHITE}>{s.stage==='overview'?'CASCADE AT FLEET SCALE':s.headline}</text>
     <path d="M100 191H191" stroke={CYAN} strokeWidth="6" strokeLinecap="round"/>
   </>}
   {reel&&<Reel s={s} rescue={frame>=e.REEL_RESCUE}/>}
  </svg>
  {frame===0&&props.previousLastFrameDataUri&&<AbsoluteFill style={{pointerEvents:'none'}}><Img src={props.previousLastFrameDataUri} style={{width:1920,height:1080}}/></AbsoluteFill>}
 </AbsoluteFill>;
};
