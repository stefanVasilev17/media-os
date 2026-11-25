import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {SHOT06_FLEET,SHOT06_INPUTS,SHOT06_OUTPUTS,SHOT06_LOCAL_INPUTS,shot06Path,shot06PreviewState} from '../../components/architectural-thinking/EP004Shot06FleetPreview.mjs';
import type {Cue} from '../../components/architectural-thinking/EP004Shot06FleetPreview.mjs';

type Props={previewOnly:true;verifiedCues:readonly Cue[];durationInFrames:number;previousLastFrameDataUri?:string};
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
const Server:React.FC<{x:number;y:number;id:string;status:string;load:number}>=({x,y,id,status,load})=>{
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
   <text x="0" y="-53" fontFamily={FONT} fontSize="29" fontWeight="700" fill={WHITE}>Server {id}</text>
   <text x="385" y="-53" textAnchor="end" fontFamily={FONT} fontSize="24" fill={tint}>{status}</text>
 </g>;
};
const Client:React.FC<{y:number;mail:boolean}>=({y,mail})=><g transform={'translate(100 '+y+')'}>
  <rect width="250" height="114" rx="24" fill={mail?'#1A344D':'#2A2845'} stroke={mail?CYAN:VIOLET} strokeOpacity=".45" strokeWidth="2"/>
  {mail?<g><rect x="24" y="29" width="77" height="55" rx="5" fill="#BCE0F3"/><path d="M24 30L62 57 101 30" stroke="#477C9B" strokeWidth="5" fill="none"/><rect x="12" y="41" width="43" height="43" rx="6" fill="#247DB9"/><text x="33" y="72" fontSize="29" fontWeight="700" textAnchor="middle" fill="white">O</text></g>:<g><circle cx="79" cy="32" r="15" fill="#B3A8EE"/><rect x="61" y="50" width="38" height="40" rx="11" fill="#8376C7"/><rect x="13" y="39" width="54" height="54" rx="8" fill="#6B5FBA"/><text x="40" y="77" fontSize="37" fontWeight="700" textAnchor="middle" fill="white">T</text></g>}
  <text x="117" y="65" fontFamily={FONT} fontSize="27" fontWeight="650" fill={WHITE}>{mail?'Outlook':'Teams'}</text>
</g>;
const Router=()=> <g transform="translate(685 440)">
  <ellipse cx="165" cy="204" rx="173" ry="18" fill="#000" opacity=".32"/>
  <path d="M0 0L24 -26H307L330 0Z" fill="url(#s6Top)" stroke="#788B9C" strokeWidth="2"/>
  <rect width="330" height="190" rx="15" fill="url(#s6Metal)" stroke="#7D8E9E" strokeWidth="2"/>
  <rect x="17" y="16" width="296" height="155" rx="13" fill="url(#s6Face)" stroke="#667B8D"/>
  <g transform="translate(165 92)" stroke="#BBCDD8" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M0 -48V48M-48 0H48M0 -48L-11 -35M0 -48L11 -35M0 48L-11 35M0 48L11 35M-48 0L-35 -11M-48 0L-35 11M48 0L35 -11M48 0L35 11"/></g>
  <circle cx="286" cy="134" r="7" fill={GREEN}/>
  <text x="165" y="242" fontFamily={FONT} fontSize="32" textAnchor="middle" fill={WHITE} fontWeight="650">Router</text>
</g>;
export const Shot06ServerFleetPreview:React.FC<Props>=props=>{
 const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(props.previewOnly!==true||cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||cfg.durationInFrames!==props.durationInFrames)throw Error('SHOT06_NOT_REGISTERED_PRODUCTION_PREVIEW_ONLY');
 const s=shot06PreviewState(frame,props.verifiedCues,props.durationInFrames);
 const seam=props.previousLastFrameDataUri&&frame===0?1:0;
 return <AbsoluteFill style={{background:'#0A1019',overflow:'hidden'}}>
 <svg width="1920" height="1080" viewBox="0 0 1920 1080" fontFamily={FONT}>
   <Defs/>
   <rect width="1920" height="1080" fill="url(#s6Bg)"/><rect y="905" width="1920" height="175" fill="url(#s6Floor)"/>
   <g opacity={1-s.interior} transform={'translate('+(-s.close*1046)+' '+(s.close*139)+') scale('+(1+s.close*.28)+')'}>
     {SHOT06_INPUTS.map((p,i)=><Route key={i} d={shot06Path(p)} tone={color(i)}/>)}
     {SHOT06_OUTPUTS.map((p,i)=><Route key={i} d={shot06Path(p)} tone={i===2?VIOLET:CYAN} active={i!==0||!s.failed}/>)}
     <Client y={383} mail/><Client y={593} mail={false}/><Router/>
     {SHOT06_FLEET.map((n,i)=><Server key={n.id} x={n.x} y={n.y} id={n.id} status={s.serverStates[i].status} load={s.serverStates[i].load}/>)}
     {s.packets.map(p=><circle key={p.id} cx={p.x} cy={p.y} r={10} fill={color(p.lane)} opacity={p.phase==='STOPPED'?.55:1}/>)}
   </g>
   <g opacity={s.interior}>
     <ellipse cx="960" cy="819" rx="780" ry="37" fill="#000" opacity=".32"/>
     <path d="M150 320L220 260H1700L1770 320Z" fill="url(#s6Top)" stroke="#8394A5" strokeWidth="3"/>
     <rect x="150" y="320" width="1620" height="472" rx="25" fill="url(#s6Metal)" stroke="#71869B" strokeWidth="3"/>
     <rect x="180" y="348" width="1560" height="414" rx="20" fill="url(#s6Face)" stroke="#526A80" strokeWidth="2"/>
     <rect x="203" y="380" width="92" height="346" rx="8" fill="url(#s6Vent)"/><rect x="1625" y="380" width="92" height="346" rx="8" fill="url(#s6Vent)"/>
     <text x="960" y="408" textAnchor="middle" fontSize="36" fontWeight="700" fill={WHITE}>Connection Handling</text>
     {SHOT06_LOCAL_INPUTS.map((p,i)=><Route key={i} d={shot06Path(p)} tone={color(i)}/>)}<Route d="M700 540H1070" tone={s.pressure>.32?AMBER:CYAN}/>
     <Route d="M1160 540H1760" tone={GREEN} active={!s.failed}/>
     <rect x="1070" y="486" width="90" height="108" rx="13" fill="#192A36" stroke={s.failed?RED:s.pressure>.32?AMBER:'#61798D'} strokeWidth="4"/>
     <path d="M1100 511V569M1130 511V569" stroke="#CAD6DE" strokeWidth="7" strokeLinecap="round"/>
     {s.local.map(p=><circle key={p.id} cx={p.x} cy={p.y} r="12" fill={p.phase==='OUT'?GREEN:color(p.lane)}/>)}
     {s.localWaiting.map(p=><circle key={p.id} cx={p.x} cy={p.y} r="12" fill={s.failed?RED:AMBER}/>)}
     <text x="850" y="684" textAnchor="middle" fontSize="29" fill={AMBER}>Waiting work</text>
     <text x="1430" y="684" textAnchor="middle" fontSize="29" fill={s.failed?RED:GREEN}>{s.failed?'No response':'Connections completing'}</text>
   </g>
   <text x="100" y="161" fontSize="46" fontWeight="720" fill={WHITE}>{s.headline}</text>
   <path d="M100 191H191" stroke={CYAN} strokeWidth="6" strokeLinecap="round"/>
 </svg>
 {seam>0&&props.previousLastFrameDataUri&&<AbsoluteFill style={{opacity:seam,pointerEvents:'none'}}><Img src={props.previousLastFrameDataUri} style={{width:1920,height:1080}}/></AbsoluteFill>}
 </AbsoluteFill>;
};
