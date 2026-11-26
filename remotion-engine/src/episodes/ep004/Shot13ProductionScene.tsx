import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {shot06Path} from '../../components/architectural-thinking/EP004Shot06FleetPreview.mjs';
import {MAIL_ROUTE} from '../../components/architectural-thinking/EP004Shot12ProductionWorld.mjs';
import type {RestoreState} from '../../components/architectural-thinking/EP004Shot12ProductionWorld.mjs';
import {DESIGN_INPUT,DESIGN_ROUTES,ISOLATED_ROUTE,shot13State,validateEp004Shot13Production} from '../../components/architectural-thinking/EP004Shot13ProductionWorld.mjs';
import type {Ep004Shot13RenderProps,DesignState} from '../../components/architectural-thinking/EP004Shot13ProductionWorld.mjs';
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
const DesignWorld:React.FC<{s:DesignState;frame:number;e:Ep004Shot13RenderProps['eventFrames']}>=({s,frame,e})=>{
 const inherited=!s.general,initial=s.fleet===0;
 const labelMove=ease((frame-(e.NO-12))/12);
 const scale=.92+.08*s.openingMix-.04*s.compact,tx=75*(1-s.openingMix)+32*s.compact,ty=20*(1-s.openingMix)+22*s.compact;
 const gate={...s.prior,controlled:initial?s.prior.controlled:s.safe,admission:initial?s.prior.admission:s.aperture};
 const heading=inherited?'USEFUL WORK RETURNS':frame<e.HOOK?'FAILOVER IS STILL USEFUL':frame<e.CAPACITY?'AVAILABILITY ON PAPER':frame<e.ISOLATE?'SAFE CAPACITY':frame<e.STAGED?'FAILURE ISOLATION':frame<e.OUTPUT?'CONTROLLED RETURN':'USEFUL WORK COMPLETED';
 return <g data-shot13-world="persistent"><Header title={heading}/>
 {s.general&&<g transform="translate(1400 90)"><rect width="375" height="42" rx="8" fill="#101E2B" stroke="#4E6B7B"/><text x="187.5" y="27" fontSize="19" fontWeight="650" fill="#B4C6D3" textAnchor="middle">GENERAL DESIGN PRINCIPLES</text></g>}
 <g transform={'translate('+tx+' '+ty+') scale('+scale+')'}>
 {initial?<Route d={shot06Path(MAIL_ROUTE)} tone={CYAN}/>:<><Route d={shot06Path(DESIGN_INPUT)} tone={CYAN}/>{DESIGN_ROUTES.map((r,i)=><Route key={i} d={shot06Path(r)} tone={s.phases[i]==='failed'?RED:s.weak?AMBER:CYAN} active={s.phases[i]!=='failed'&&!(s.isolated&&i===2)}/>)}{s.isolated&&<Route d={shot06Path(ISOLATED_ROUTE)} tone={GREEN}/>}</>}
 <Router/><Gate s={gate}/>
 <Gateway x={1190} y={474} w={455} h={142} failed={!initial&&s.phases[1]==='failed'} activity={s.activity}/>
 <text x="1417" y={422+25*labelMove} textAnchor="middle" fontSize={30-3*labelMove} fontWeight="700" fill={WHITE}>Primary gateway</text>
 <Inbox message={true} reply={true}/>
 {initial?<g transform="translate(1210 700)"><text fontSize="25" fill={GREEN} fontWeight="650">Service available</text><text y="43" fontSize="23" fill={AMBER}>Residual mail processing</text></g>:<>
 {[0,2].map(i=>{const y=i===0?286:672,t=s.phases[i]==='failed'?RED:s.phases[i]==='booting'?AMBER:GREEN;return <g key={i} transform={'translate(1417 '+(y+66)+') scale('+s.fleet+') translate(-1417 -'+(y+66)+')'}><Gateway x={1190} y={y} w={455} h={132} failed={s.phases[i]==='failed'} activity={s.activity}/><text x="1417" y={y-29} fontSize="27" textAnchor="middle" fill={WHITE} fontWeight="650">{i===0?'Alternative gateway':'Isolated gateway'}</text><circle cx="1205" cy={y+105} r="6" fill={t}/></g>})}
 {s.weak&&[0,1,2].map(i=><g key={i} transform={'translate(1670 '+[352,545,738][i]+')'}><circle r="15" fill="#13202A" stroke={AMBER} strokeWidth="3"/><path d="M-6 0H6M0 -6V6" stroke={AMBER} strokeWidth="3"/></g>)}
 {s.isolated&&<g><rect x="1170" y="630" width="505" height="199" rx="15" fill="none" stroke={GREEN} strokeWidth="2" strokeDasharray="9 6"/><text x="1650" y="815" textAnchor="end" fontSize="20" fill={GREEN}>Isolated</text></g>}
 {s.safe&&<g transform="translate(125 750)"><text fontSize="25" fill={WHITE} fontWeight="650">Available headroom</text><rect y="20" width="375" height="12" rx="6" fill="#142331"/><rect y="20" width={375*(1-s.pressure)} height="12" rx="6" fill={GREEN}/></g>}
 </>}
 <DesignPackets s={s}/>
 </g>
 {inherited?<text x="960" y="965" fontSize="34" fontWeight="700" fill={WHITE} textAnchor="middle">Recovery is more than a green status.</text>:s.output?<text x="960" y="965" fontSize="34" fontWeight="700" fill={WHITE} textAnchor="middle">Availability = useful work completed</text>:null}
 </g>
};
export const Shot13ProductionScene:React.FC<Ep004Shot13RenderProps>=props=>{
 validateEp004Shot13Production(props,true);const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||cfg.durationInFrames!==props.durationInFrames)throw Error('SHOT13_EXACT_VIDEO_CONTRACT_REQUIRED');
 const s=shot13State(frame,props);
 return <AbsoluteFill style={{background:'#0A1019',overflow:'hidden'}}><svg width="1920" height="1080" viewBox="0 0 1920 1080" fontFamily={FONT}>
 <Defs/><rect width="1920" height="1080" fill="url(#s6Bg)"/><rect y="905" width="1920" height="175" fill="url(#s6Floor)"/>
 <DesignWorld s={s} frame={frame} e={props.eventFrames}/>
 </svg>{frame===0&&props.previousLastFrameDataUri&&<AbsoluteFill style={{pointerEvents:'none'}}><Img src={props.previousLastFrameDataUri} style={{width:1920,height:1080}}/></AbsoluteFill>}</AbsoluteFill>;
};
