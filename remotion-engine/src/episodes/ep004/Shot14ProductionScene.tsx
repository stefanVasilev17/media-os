import React from 'react';
import {CLIENT_ROUTE,TEAMS_ROUTE,FLEET_ROUTES,shot14State,validateEp004Shot14Production} from '../../components/architectural-thinking/EP004Shot14ProductionWorld.mjs';
import type {Ep004Shot14RenderProps,ParadoxState} from '../../components/architectural-thinking/EP004Shot14ProductionWorld.mjs';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {shot06Path} from '../../components/architectural-thinking/EP004Shot06FleetPreview.mjs';
import type {RestoreState} from '../../components/architectural-thinking/EP004Shot12ProductionWorld.mjs';
import {DESIGN_ROUTES,ISOLATED_ROUTE} from '../../components/architectural-thinking/EP004Shot13ProductionWorld.mjs';
import type {DesignState} from '../../components/architectural-thinking/EP004Shot13ProductionWorld.mjs';
const CYAN='#81D6E8',VIOLET='#BAA2F3',AMBER='#EDB65C',GREEN='#85D4A7',RED='#E87378',WHITE='#E4EBF2';
const FONT='Arial, sans-serif';
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
const Router:React.FC<{showLabels?:boolean}>=({showLabels=true})=> <g transform="translate(685 440)">
  <ellipse cx="165" cy="204" rx="173" ry="18" fill="#000" opacity=".32"/>
  <path d="M0 0L24 -26H307L330 0Z" fill="url(#s6Top)" stroke="#788B9C" strokeWidth="2"/>
  <rect width="330" height="190" rx="15" fill="url(#s6Metal)" stroke="#7D8E9E" strokeWidth="2"/>
  <rect x="17" y="16" width="296" height="155" rx="13" fill="url(#s6Face)" stroke="#667B8D"/>
  <g transform="translate(165 92)" stroke="#BBCDD8" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M0 -48V48M-48 0H48M0 -48L-11 -35M0 -48L11 -35M0 48L-11 35M0 48L11 35M-48 0L-35 -11M-48 0L-35 11M48 0L35 -11M48 0L35 11"/></g>
  <circle cx="286" cy="134" r="7" fill={GREEN}/>
  {showLabels&&<text x="165" y="242" fontFamily={FONT} fontSize="32" textAnchor="middle" fill={WHITE} fontWeight="650">Router</text>}
</g>;

const Header:React.FC<{title:string;sub?:string}>=({title,sub})=><g>
 <text x="98" y="119" fontSize="52" fontWeight="700" fill={WHITE}>{title}</text>
 {sub&&<text x="102" y="166" fontSize="27" fill="#B4C6D3">{sub}</text>}
 <path d="M101 190H204" stroke={CYAN} strokeWidth="5" strokeLinecap="round"/>
</g>;
const Gateway:React.FC<{x:number;y:number;w:number;h:number;failed?:boolean;quiet?:boolean;activity?:number}>=({x,y,w,h,failed=false,quiet=false,activity})=><g transform={'translate('+x+' '+y+')'} opacity={quiet?.48:1}>
 <ellipse cx={w/2} cy={h+14} rx={w*.51} ry="12" fill="#000" opacity=".3"/>
 <path d={'M0 0L18 -19H'+(w-18)+'L'+w+' 0Z'} fill="url(#s6Top)" stroke="#8395A6" strokeWidth="1.8"/>
 <rect width={w} height={h} rx="9" fill="url(#s6Metal)" stroke={failed?RED:'#8197A7'} strokeWidth="2"/>
 <rect x="11" y="10" width={w-22} height={h-20} rx="6" fill="url(#s6Face)" stroke="#546B80"/>
 <rect x="23" y="21" width={Math.min(54,w*.26)} height={h-42} rx="3" fill="url(#s6Vent)"/>
 {activity!==undefined&&<g><path d={'M9 3H'+(w-10)} stroke="#B8CAD8" strokeWidth="1.8" opacity=".55"/><path d={'M13 '+(h-8)+'H'+(w-13)} stroke="#060C13" strokeWidth="3"/>{[8,w-8].map(px=><g key={px}><circle cx={px} cy="15" r="2.5" fill="#A3AEB9"/><circle cx={px} cy={h-15} r="2.5" fill="#A3AEB9"/></g>)}<rect x={w*.36} y={h*.77} width={w*.39} height="5" rx="2.5" fill="#101923"/><rect x={w*.36} y={h*.77} width={w*.39*(failed?.18:.48+activity*.32)} height="5" rx="2.5" fill={failed?RED:GREEN} opacity={.72+activity*.22}/></g>}
 {[0,1].map(i=><g key={i}><path d={'M'+w*.36+' '+(h*.33+i*h*.29)+'H'+w*.75} stroke="#758A9D" strokeWidth="8" strokeLinecap="round"/><circle cx={w*.88} cy={h*.33+i*h*.29} r="5" fill={failed?RED:GREEN} opacity={activity===undefined?1:.64+activity*.36}/>{activity!==undefined&&<circle cx={w*.88} cy={h*.33+i*h*.29} r="10" fill={failed?RED:GREEN} opacity={.08+activity*.13}/>}</g>)}
</g>;
const ease=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const PacketLayer:React.FC<{s:RestoreState}>=({s})=><g>{s.traffic.map((p,i)=>{const c=p.tone==='green'?GREEN:p.tone==='amber'?AMBER:CYAN;return <g key={i}><circle cx={p.x} cy={p.y} r="13" fill={c} opacity=".14"/><rect x={p.x-9} y={p.y-4} width="18" height="8" rx="3" fill={c}/></g>})}</g>;
const Gate:React.FC<{s:RestoreState;x?:number;y?:number}>=({s,x=1090,y=545})=><g transform={'translate('+x+' '+y+')'}>
 <rect x="-34" y="-48" width="68" height="96" rx="12" fill="url(#s6Metal)" stroke={s.controlled?CYAN:AMBER} strokeWidth="2"/>
 <rect x="-20" y="-34" width="40" height="68" rx="7" fill="#0A131D"/>
 <rect x="-17" y={-31} width="34" height={29*(1-s.admission)} rx="3" fill={s.controlled?CYAN:AMBER}/>
 <rect x="-17" y={31-29*(1-s.admission)} width="34" height={29*(1-s.admission)} rx="3" fill={s.controlled?CYAN:AMBER}/>
 <text x="0" y="-68" fill={WHITE} textAnchor="middle" fontSize="22" fontWeight="700">Traffic admission</text>
 </g>;

const DesignPackets:React.FC<{s:DesignState}>=({s})=><g>{s.traffic.map((p,i)=>{const c=p.tone==='green'?GREEN:p.tone==='amber'?AMBER:CYAN;return <g key={i}><circle cx={p.x} cy={p.y} r="13" fill={c} opacity=".14"/><rect x={p.x-9} y={p.y-4} width="18" height="8" rx="3" fill={c}/></g>})}</g>;
const Inbox:React.FC<{message:boolean;reply:boolean}>=({message,reply})=><g>
 <rect x="100" y="313" width="470" height="388" rx="20" fill="url(#s6Metal)" stroke="#7099AC" strokeWidth="2"/>
 <rect x="112" y="325" width="446" height="364" rx="14" fill="#10202D"/>
 <rect x="112" y="325" width="446" height="61" rx="12" fill="#1E4564"/>
 <text x="136" y="365" fontSize="28" fontWeight="700" fill={WHITE}>Outlook · Inbox</text>
 {[0,1,2].map(i=><g key={i}><rect x="130" y={407+i*63} width="410" height="53" rx="7" fill={i===0&&message?'#234638':'#1C2D3B'}/><circle cx="151" cy={433+i*63} r="5" fill={i===0&&message?GREEN:'#566D7D'}/><path d={'M170 '+(425+i*63)+'H'+(i===0?397:343)} stroke="#A1B7C6" strokeWidth="5" strokeLinecap="round"/><path d={'M170 '+(441+i*63)+'H300'} stroke="#526B7C" strokeWidth="4" strokeLinecap="round"/></g>)}
 <text x="143" y="637" fill={reply?GREEN:CYAN} fontSize="24" fontWeight="650">{reply?'Reply sent':'Service request'}</text>
 </g>;

const ParadoxWorld:React.FC<{s:ParadoxState;frame:number;e:Ep004Shot14RenderProps['eventFrames']}>=({s,frame,e})=>{
 const q=s.openingMix,inherited=q===0,scale=.96-.14*s.wide+.035*s.home,tx=32+98*s.wide-30*s.home,ty=22+54*s.wide-9*s.home;
 const headline=inherited?'USEFUL WORK COMPLETED':s.focus==='local'||s.focus==='global'?'THE ARCHITECTURE PARADOX':s.focus==='relationships'?'THE SYSTEM IS THE RELATIONSHIPS':'THE CHAIN OF FAILURE';
 const gate={...s.prior.prior,controlled:inherited?s.prior.safe:s.controlled,admission:inherited?s.prior.aperture:s.controlled?.38:.94};
 const phases=inherited?s.prior.phases:s.phases;
 const routeTone=s.local?GREEN:s.focus==='cascade'||s.focus==='relapse'?AMBER:CYAN;
 const inset=.532,zoom=1-(1-inset)*q,ix=100-100*zoom,iy=(313+130*q)-313*zoom;
 return <g data-shot14-world="persistent"><Header title={headline}/>
 {inherited&&<g transform="translate(1400 90)"><rect width="375" height="42" rx="8" fill="#101E2B" stroke="#4E6B7B"/><text x="187.5" y="27" fontSize="19" fontWeight="650" fill="#B4C6D3" textAnchor="middle">GENERAL DESIGN PRINCIPLES</text></g>}
 <g transform={'translate('+tx+' '+ty+') scale('+scale+')'}>
 <Route d={shot06Path(CLIENT_ROUTE)} tone={CYAN}/>
 {(inherited?DESIGN_ROUTES:FLEET_ROUTES).map((r,i)=><Route key={i} d={shot06Path(r)} tone={phases[i]==='failed'?RED:routeTone} active={inherited?phases[i]!=='failed'&&i!==2:phases[i]!=='failed'&&(i===1||frame>=e.REDIRECT)}/>)}
 {q<1&&<g transform={'translate(1190 738) scale('+(1-q)+') translate(-1190 -738)'}><Route d={shot06Path(ISOLATED_ROUTE)} tone={GREEN}/><rect x="1170" y="630" width="505" height="199" rx="15" fill="none" stroke={GREEN} strokeWidth="2" strokeDasharray="9 6"/><text x="1650" y="815" textAnchor="end" fontSize="20" fill={GREEN}>Isolated</text></g>}
 {s.teams>0&&<g transform={'translate(650 325) scale('+s.teams+') translate(-650 -325)'}>
 <rect x="100" y="270" width="250" height="110" rx="14" fill="url(#s6Metal)" stroke={VIOLET} strokeWidth="2"/>
 <rect x="112" y="282" width="226" height="86" rx="10" fill="url(#s6Face)"/><rect x="126" y="300" width="48" height="48" rx="9" fill="#6854B5"/><text x="150" y="333" fontSize="28" textAnchor="middle" fill={WHITE} fontWeight="700">T</text><text x="191" y="333" fontSize="28" fill={WHITE} fontWeight="650">Teams</text>
 <Route d={shot06Path(TEAMS_ROUTE)} tone={VIOLET} active={s.focus==='teams'||s.focus==='peak'||s.focus==='cascade'}/>
 <Gateway x={430} y={282} w={220} h={86} activity={s.activity}/>
 <text x="540" y="252" fontSize="23" textAnchor="middle" fill={WHITE} fontWeight="650">Teams gateway</text>
 </g>}
 <Router/><Gate s={gate}/>
 <g transform={'translate('+ix+' '+iy+') scale('+zoom+')'}><Inbox message={inherited||s.controlled||s.focus==='relationships'} reply={inherited||s.controlled||s.focus==='relationships'}/></g>
 {[0,1,2].map(i=>{const y=[286,474,672][i],t=phases[i]==='failed'?RED:phases[i]==='booting'?AMBER:GREEN;return <g key={i}><Gateway x={1190} y={y} w={455} h={i===1?142:132} failed={phases[i]==='failed'} activity={s.activity}/><text x="1417" y={i===1?422:y-29} fontSize={i===1?30:27} textAnchor="middle" fill={WHITE} fontWeight="650">{i===0?'Alternative gateway':i===1?'Primary gateway':inherited?'Isolated gateway':'Remaining gateway'}</text>{i!==1&&<circle cx="1205" cy={y+105} r="6" fill={t}/>}</g>})}
 {inherited&&<g transform="translate(125 750)"><text fontSize="25" fill={WHITE} fontWeight="650">Available headroom</text><rect y="20" width="375" height="12" rx="6" fill="#142331"/><rect y="20" width={375*(1-s.prior.pressure)} height="12" rx="6" fill={GREEN}/></g>}
 {(s.latent||s.controlled)&&<g><path d="M1645 545H1745V454" fill="none" stroke={s.controlled?GREEN:s.contention?RED:AMBER} strokeWidth="3"/><rect x="1660" y="365" width="240" height="89" rx="12" fill="#101E2B" stroke={s.controlled?GREEN:s.contention?RED:AMBER} strokeWidth="2"/><text x="1780" y="396" textAnchor="middle" fill={WHITE} fontSize="23" fontWeight="650">{s.controlled?'Code repaired':s.contention?'Lock contention':'July change'}</text><path d={s.contention?'M1680 425H1740L1770 410L1800 440L1830 425H1880':'M1680 425H1880'} stroke={s.controlled?GREEN:s.contention?RED:AMBER} strokeWidth="4" fill="none"/></g>}
 {s.constrained&&<g transform="translate(1210 840)"><text fontSize="24" fill={AMBER} fontWeight="650">Reduced capacity</text><rect y="18" width="410" height="10" rx="5" fill="#263645"/><rect y="18" width="350" height="10" rx="5" fill={AMBER}/></g>}
 {s.controlled&&<g transform="translate(1210 840)"><text fontSize="24" fill={GREEN} fontWeight="650">Controlled restoration</text><rect y="18" width="410" height="10" rx="5" fill="#263645"/><rect y="18" width={410*ease((frame-e.RECOVERY)/90)} height="10" rx="5" fill={GREEN}/></g>}
 {s.local&&<g><rect x="690" y="710" width="320" height="51" rx="10" fill="#152B27" stroke={GREEN}/><text x="850" y="743" textAnchor="middle" fontSize="25" fontWeight="700" fill={GREEN}>VALID LOCAL ACTION</text></g>}
 {s.global&&<g><rect x="92" y="665" width="360" height="51" rx="10" fill="#321B26" stroke={RED}/><text x="272" y="698" textAnchor="middle" fontSize="25" fontWeight="700" fill={RED}>SYSTEM UNAVAILABLE</text></g>}
 {s.traffic.map((p,i)=>{const c=p.tone==='violet'?VIOLET:p.tone==='green'?GREEN:p.tone==='amber'?AMBER:CYAN;return <g key={i}><circle cx={p.x} cy={p.y} r="13" fill={c} opacity=".14"/><rect x={p.x-9} y={p.y-4} width="18" height="8" rx="3" fill={c}/></g>})}
 </g>
 {inherited?<text x="960" y="965" fontSize="34" fontWeight="700" fill={WHITE} textAnchor="middle">Availability = useful work completed</text>:s.global?<text x="960" y="965" fontSize="34" textAnchor="middle" fontWeight="700" fill={WHITE}>Local success ≠ global stability</text>:s.focus==='relationships'?<text x="960" y="965" fontSize="34" textAnchor="middle" fontWeight="700" fill={WHITE}>The architecture is in the relationships.</text>:null}
 </g>;
};
export const Shot14ProductionScene:React.FC<Ep004Shot14RenderProps>=props=>{
 validateEp004Shot14Production(props,true);const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||cfg.durationInFrames!==props.durationInFrames)throw Error('SHOT14_EXACT_VIDEO_CONTRACT_REQUIRED');
 const s=shot14State(frame,props);
 return <AbsoluteFill style={{background:'#0A1019',overflow:'hidden'}}><svg width="1920" height="1080" viewBox="0 0 1920 1080" fontFamily={FONT}>
 <Defs/><rect width="1920" height="1080" fill="url(#s6Bg)"/><rect y="905" width="1920" height="175" fill="url(#s6Floor)"/>
 <ParadoxWorld s={s} frame={frame} e={props.eventFrames}/>
 </svg>{frame===0&&props.previousLastFrameDataUri&&<AbsoluteFill style={{pointerEvents:'none'}}><Img src={props.previousLastFrameDataUri} style={{width:1920,height:1080}}/></AbsoluteFill>}</AbsoluteFill>;
};
