import React from 'react';
import {FLEET_ROUTES,EXCHANGE_ROUTES,TEAMS_ROUTE} from '../../components/architectural-thinking/EP004Shot14ProductionWorld.mjs';
import {inboxPort,shot15State,validateEp004Shot15Production} from '../../components/architectural-thinking/EP004Shot15ProductionWorld.mjs';
import type {Ep004Shot15RenderProps,FinaleState} from '../../components/architectural-thinking/EP004Shot15ProductionWorld.mjs';
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


const FinaleWorld:React.FC<{s:FinaleState;frame:number;e:Ep004Shot15RenderProps['eventFrames']}>=({s,frame,e})=>{
 const inherited=s.focus==='inherited',close=s.focus==='behind',final=s.focus==='final';
 const {scale,tx,ty}=s.camera,zoom=s.zoom,ix=100-100*zoom,iy=545-(313+194)*zoom+1.208*(1-s.person);
 const gate={...s.prior.prior.prior,controlled:false,admission:.94};
 const primary=s.packet!==null||s.focus==='resolution',question=s.question;
 const accent=s.packet?.direction==='response'?GREEN:CYAN;
 const heading=inherited?'THE SYSTEM IS THE RELATIONSHIPS':final?'DESIGN FOR UNCERTAINTY':s.focus==='person'||close?'ONE MESSAGE. ONE PERSON.':s.focus==='question'?'WHAT HAPPENS TO THE REST?':'BEYOND ONE SYSTEM';
 const packet=(p:{x:number;y:number;tone:string},key:string,hero=false)=>{
   const c=p.tone==='violet'?VIOLET:p.tone==='green'?GREEN:p.tone==='amber'?AMBER:CYAN;
   if(!inherited&&((p.x>685&&p.x<1015&&Math.abs(p.y-545)<30)||(p.x>1190&&p.x<1645&&p.y>=286&&p.y<=804)||(p.x>430&&p.x<650&&p.y>=282&&p.y<=368)))return null;
   return <g key={key}><circle cx={p.x} cy={p.y} r={hero?22:13} fill={c} opacity={hero?.22:.14}/>{hero&&<circle cx={p.x} cy={p.y} r="13" stroke={c} strokeWidth="2" fill="none" opacity=".8"/>}<rect x={p.x-(hero?13:9)} y={p.y-(hero?6:4)} width={hero?26:18} height={hero?12:8} rx="3" fill={c}/></g>;
 };
 return <g data-shot15-world="persistent"><Header title={heading}/>
 <g transform={'translate('+tx+' '+ty+') scale('+scale+')'}>
 <Route d={shot06Path([inherited?[350,545]:inboxPort(zoom),[685,545]])} tone={primary?accent:CYAN} active={true}/>
 {FLEET_ROUTES.map((r,i)=><Route key={i} d={shot06Path(r)} tone={i===1&&primary?accent:i===0&&question?AMBER:CYAN} active={inherited||i===1||question&&i===0}/>)}
 <g opacity={inherited?1:1-.49*s.person+.16*s.pullback}>
 <rect x="100" y="270" width="250" height="110" rx="14" fill="url(#s6Metal)" stroke={VIOLET} strokeWidth="2"/>
 <rect x="112" y="282" width="226" height="86" rx="10" fill="url(#s6Face)"/><rect x="126" y="300" width="48" height="48" rx="9" fill="#6854B5"/><text x="150" y="333" fontSize="28" textAnchor="middle" fill={WHITE} fontWeight="700">T</text><text x="191" y="333" fontSize="28" fill={WHITE} fontWeight="650">Teams</text>
 <Route d={shot06Path(TEAMS_ROUTE)} tone={VIOLET} active={false}/>
 <Gateway x={430} y={282} w={220} h={86} activity={s.activity}/>
 <text x="540" y="252" fontSize="23" textAnchor="middle" fill={WHITE} fontWeight="650">Teams gateway</text></g>
 <g>
 {EXCHANGE_ROUTES.map((r,i)=><Route key={i} d={shot06Path(r)} tone={primary&&i===1?accent:CYAN} active={inherited||i===1||question&&i===0}/>)}
 <rect x="1850" y="487" width="238" height="116" rx="14" fill="url(#s6Metal)" stroke={primary?accent:CYAN} strokeWidth={primary?3:2}/>
 <rect x="1862" y="499" width="214" height="92" rx="10" fill="url(#s6Face)"/>
 <rect x="1880" y="519" width="47" height="47" rx="8" fill="#287DB0"/><path d="M1887 532H1920V555H1887Z M1887 532L1903.5 544L1920 532" stroke={WHITE} strokeWidth="2" fill="none"/>
 <text x="1940" y="551" fontSize="24" fontWeight="650" fill={WHITE}>Exchange</text>
 <text x="1969" y="471" textAnchor="middle" fontSize="25" fill={WHITE} fontWeight="650">Mailbox service</text></g>
 <Router/><Gate s={gate}/>
 <g transform={'translate('+ix+' '+iy+') scale('+zoom+')'}>
 <Inbox message={inherited||s.delivered} reply={inherited}/>
 {!inherited&&s.delivered&&<g><rect x="130" y="407" width="410" height="53" rx="7" fill="#234638" stroke={GREEN} strokeWidth="2"/><circle cx="151" cy="433" r="5" fill={GREEN}/><text x="170" y="441" fill={WHITE} fontSize="25" fontWeight="650">Message received</text><rect x="132" y="604" width="400" height="51" rx="7" fill="#10202D"/><path d="M146 629l9 9 18 -21" stroke={GREEN} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><text x="188" y="637" fill={GREEN} fontSize="24" fontWeight="650">Inbox updated</text></g>}
 </g>
 {[0,1,2].map(i=>{const y=[286,474,672][i],quiet=!inherited&&i!==1&&!question;return <g key={i}><Gateway x={1190} y={y} w={455} h={i===1?142:132} activity={s.activity} quiet={quiet}/><text x="1417" y={i===1?422:y-29} fontSize={i===1?30:27} textAnchor="middle" fill={WHITE} opacity={quiet?.75:1} fontWeight="650">{i===0?'Alternative gateway':i===1?'Primary gateway':'Remaining gateway'}</text>{i!==1&&<circle cx="1205" cy={y+105} r="6" fill={GREEN} opacity={quiet?.65:1}/>}</g>})}
 {s.capacity&&<g transform="translate(1210 840)"><text fontSize="24" fill={question?AMBER:WHITE} fontWeight="650">Available capacity</text><rect y="18" width="410" height="12" rx="6" fill="#263645"/><rect y="18" width={410*s.headroom} height="12" rx="6" fill={question?AMBER:CYAN}/></g>}
 {question&&<g><path d="M1100 545V352H1190" stroke={AMBER} strokeWidth="5" fill="none" strokeDasharray="12 10" opacity=".8"/><circle cx="1100" cy="545" r={12+3*Math.sin(frame*.08)} fill="#152331" stroke={AMBER} strokeWidth="3"/><rect x="1190" y="214" width="455" height="16" rx="8" fill="#172533" stroke="#607583"/><rect x="1190" y="214" width={455*s.headroom} height="16" rx="8" fill={AMBER} opacity=".85"/></g>}
 {s.traffic.map((p,i)=>packet(p,'ambient'+i))}
 {s.packet&&packet(s.packet,'hero',true)}
 </g>
 {inherited?<text x="960" y="965" fontSize="34" fontWeight="700" fill={WHITE} textAnchor="middle">The architecture is in the relationships.</text>:question?<text x="960" y="965" fontSize="34" fontWeight="700" fill={WHITE} textAnchor="middle">Protect the rest — or create the next failure?</text>:final?<g><path d="M770 921H1150" stroke={CYAN} strokeWidth="2" opacity=".48"/><text x="960" y="978" fontSize="30" fill="#B5C9D8" fontWeight="650" textAnchor="middle">ARCHITECTURAL THINKING</text></g>:null}
 </g>;
};
export const Shot15ProductionScene:React.FC<Ep004Shot15RenderProps>=props=>{
 validateEp004Shot15Production(props,true);const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||cfg.durationInFrames!==props.durationInFrames)throw Error('SHOT15_EXACT_VIDEO_CONTRACT_REQUIRED');
 const s=shot15State(frame,props);
 return <AbsoluteFill style={{background:'#0A1019',overflow:'hidden'}}><svg width="1920" height="1080" viewBox="0 0 1920 1080" fontFamily={FONT}>
 <Defs/><rect width="1920" height="1080" fill="url(#s6Bg)"/><rect y="905" width="1920" height="175" fill="url(#s6Floor)"/>
 <FinaleWorld s={s} frame={frame} e={props.eventFrames}/>
 </svg>{frame===0&&props.previousLastFrameDataUri&&<AbsoluteFill style={{pointerEvents:'none'}}><Img src={props.previousLastFrameDataUri} style={{width:1920,height:1080}}/></AbsoluteFill>}</AbsoluteFill>;
};
