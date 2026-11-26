import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {shot06Path} from '../../components/architectural-thinking/EP004Shot06FleetPreview.mjs';
import {CONNECTION_ROUTE} from '../../components/architectural-thinking/EP004Shot11ProductionWorld.mjs';
import type {ClockState} from '../../components/architectural-thinking/EP004Shot11ProductionWorld.mjs';
import {ADMISSION_ROUTE,GROUP_ROUTES,DELAYED_ROUTE,MAIL_ROUTE,shot12State,validateEp004Shot12Production} from '../../components/architectural-thinking/EP004Shot12ProductionWorld.mjs';
import type {Ep004Shot12RenderProps,RestoreState} from '../../components/architectural-thinking/EP004Shot12ProductionWorld.mjs';
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
const ClockPackets:React.FC<{s:ClockState}>=({s})=><g>{s.traffic.map((p,i)=>{const c=p.tone==='violet'?VIOLET:p.tone==='green'?GREEN:p.tone==='amber'?AMBER:p.tone==='red'?RED:CYAN;return <g key={i}><circle cx={p.x} cy={p.y} r={p.direction==='waiting'?15:12} fill={c} opacity=".14"/>{p.direction==='waiting'?<g><circle cx={p.x} cy={p.y} r="9" fill="none" stroke={c} strokeWidth="2"/><circle cx={p.x} cy={p.y} r="3.5" fill={c}/></g>:<rect x={p.x-9} y={p.y-4} width="18" height="8" rx="3" fill={c}/>}</g>})}</g>;
const SourceNode:React.FC<{y:number;teams?:boolean;health?:boolean}>=({y,teams=false,health=false})=><g transform={'translate(100 '+y+')'}>
 <rect width="250" height="104" rx="16" fill="url(#s6Metal)" stroke={teams?VIOLET:CYAN} strokeWidth="2"/>
 <rect x="11" y="11" width="228" height="82" rx="11" fill="url(#s6Face)"/>
 <rect x="23" y="24" width="48" height="48" rx="10" fill={teams?'#6B5FBA':health?'#326D75':'#287DB0'}/>
 {health?<path d="M30 48H39L45 35L52 59L58 48H65" fill="none" stroke={GREEN} strokeWidth="3"/>:<text x="47" y="57" textAnchor="middle" fontSize="27" fontWeight="700" fill={WHITE}>{teams?'T':'O'}</text>}
 <text x="83" y="56" fontSize={health?20:24} fontWeight="650" fill={WHITE}>{health?'Health check':teams?'Teams':'Outlook'}</text>
</g>;
const ConnectionView:React.FC<{s:ClockState;frame:number;focus?:number}>=({s,frame,focus=0})=>{const tone=s.phase==='failed'?RED:s.phase==='booting'?AMBER:GREEN;const route=CONNECTION_ROUTE;return <g>
 <Header title="RECOVERY RECREATES THE FAILURE"/>
 <g transform={'translate(960 640) scale('+(1+.06*focus)+') translate(-960 -640)'}>
 <SourceNode y={493}/><Route d={shot06Path(route)} tone={tone}/><Router/>
 <Gateway x={1190} y={474} w={455} h={142} failed={s.phase==='failed'} activity={s.activity}/>
 <text x="1417" y="422" textAnchor="middle" fontSize="30" fontWeight="700" fill={WHITE}>Primary gateway</text>
 <circle cx="1200" cy="652" r="7" fill={tone}/><text x="1222" y="662" fontSize="28" fill={tone} fontWeight="700">{s.phase==='failed'?'UNRESPONSIVE':s.phase==='booting'?'STARTING':'RUNNING'}</text>
 <ClockPackets s={s}/>
 <g opacity={s.defect?1:.45}><path d="M1645 585H1688V715" fill="none" stroke={s.defect?RED:AMBER} strokeWidth="3" strokeDasharray="7 6"/><rect x="1130" y="715" width="600" height="122" rx="16" fill="#101E2B" stroke={s.defect?RED:'#587286'} strokeWidth="2"/><path d="M1168 798H1260L1300 774L1340 818L1380 798H1690" stroke={s.defect?RED:AMBER} strokeWidth="4" fill="none"/>{s.defect&&<circle cx="1340" cy="818" r={7+2*Math.sin(frame*.1)} stroke={RED} strokeWidth="2" fill="#101E2B"/>}<text x="1160" y="750" fontSize="27" fontWeight="650" fill={WHITE}>Connection handling</text></g>
 </g>
 <text x="960" y="965" textAnchor="middle" fontSize="34" fontWeight="700" fill={WHITE}>{s.end?'Break the conditions that expose the defect.':'Restoring a process is not restoring a service.'}</text>
</g>};

const ease=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const PacketLayer:React.FC<{s:RestoreState}>=({s})=><g>{s.traffic.map((p,i)=>{const c=p.tone==='green'?GREEN:p.tone==='amber'?AMBER:CYAN;return <g key={i}><circle cx={p.x} cy={p.y} r="13" fill={c} opacity=".14"/><rect x={p.x-9} y={p.y-4} width="18" height="8" rx="3" fill={c}/></g>})}</g>;
const Gate:React.FC<{s:RestoreState;x?:number;y?:number}>=({s,x=1090,y=545})=><g transform={'translate('+x+' '+y+')'}>
 <rect x="-34" y="-48" width="68" height="96" rx="12" fill="url(#s6Metal)" stroke={s.controlled?CYAN:AMBER} strokeWidth="2"/>
 <rect x="-20" y="-34" width="40" height="68" rx="7" fill="#0A131D"/>
 <rect x="-17" y={-31} width="34" height={29*(1-s.admission)} rx="3" fill={s.controlled?CYAN:AMBER}/>
 <rect x="-17" y={31-29*(1-s.admission)} width="34" height={29*(1-s.admission)} rx="3" fill={s.controlled?CYAN:AMBER}/>
 <text x="0" y="-68" fill={WHITE} textAnchor="middle" fontSize="22" fontWeight="700">Traffic admission</text>
 </g>;
const RepairView:React.FC<{s:RestoreState;frame:number}>=({s,frame})=><g>
 <Header title={s.stage==='controls'?'RECOVERY HAS TWO JOBS':'REPAIR THE CONNECTION PATH'}/>
 <SourceNode y={493}/><Route d={shot06Path(ADMISSION_ROUTE)} tone={s.controlled?CYAN:AMBER}/><Router/><Gate s={s}/>
 <Gateway x={1190} y={474} w={455} h={142} failed={!s.codeFixed} activity={s.activity}/>
 <text x="1417" y="422" textAnchor="middle" fontSize="30" fontWeight="700" fill={WHITE}>Primary gateway</text>
 <rect x="1200" y="646" width="430" height="9" rx="4" fill="#0B1420"/>
 <rect x="1200" y="646" width={430*s.pressure} height="9" rx="4" fill={s.pressure>.65?AMBER:GREEN}/>
 <text x="1200" y="690" fill={s.pressure>.65?AMBER:GREEN} fontSize="24" fontWeight="650">{s.pressure>.65?'Crowded recovery':'Controlled workload'}</text>
 <path d="M1645 585H1688V715" fill="none" stroke={s.codeFixed?CYAN:RED} strokeWidth="3" strokeDasharray="7 6"/>
 <rect x="1130" y="715" width="600" height="122" rx="16" fill="#101E2B" stroke={s.codeFixed?CYAN:RED} strokeWidth="2"/>
 <text x="1160" y="750" fontSize="27" fontWeight="650" fill={WHITE}>{s.codeFixed?'Known-good code path':'Connection handling'}</text>
 <path d={s.codeFixed?'M1168 798H1690':'M1168 798H1260L1300 774L1340 818L1380 798H1690'} stroke={s.codeFixed?CYAN:RED} strokeWidth="4" fill="none"/>
 <circle cx={s.codeFixed?1168+((frame*7)%522):1340} cy={s.codeFixed?798:818} r="7" fill={s.codeFixed?CYAN:RED}/>
 <PacketLayer s={s}/>
 <g transform="translate(106 760)"><text fill={s.codeFixed?GREEN:AMBER} fontSize="28" fontWeight="700">{s.codeFixed?'01  Fixed connection handling':'01  Defective connection handling'}</text><text y="57" fill={s.controlled?GREEN:AMBER} fontSize="28" fontWeight="700">{s.controlled?'02  Controlled traffic return':'02  Workload still needs control'}</text></g>
 {s.illustrative&&<text x="960" y="961" textAnchor="middle" fill="#9FB4C4" fontSize="23">Illustrative comparison · one control alone is not enough</text>}
 </g>;
const FleetView:React.FC<{s:RestoreState;frame:number}>=({s,frame})=><g>
 <Header title={s.stage==='regions'?'RECOVERY, REGION BY REGION':'RESTORE CAPACITY IN GROUPS'} sub={s.stage==='regions'?'Conceptual region recovery':'Known-good update · staged restart · controlled return'}/>
 <SourceNode y={493}/><Route d="M350 545H685" tone={CYAN}/><Router/>
 {GROUP_ROUTES.map((r,i)=><Route key={i} d={shot06Path(r)} tone={s.groups[i]==='running'?CYAN:AMBER} active={s.groups[i]!=='failed'}/>)}
 <Gate s={s} x={1100} y={545}/>
 {s.groups.map((g,i)=>{const y=278+i*155,t=g==='failed'?RED:g==='booting'?AMBER:GREEN;return <g key={i}>
 <Gateway x={1260} y={y} w={410} h={104} failed={g==='failed'} activity={s.activity}/>
 <circle cx="1274" cy={y+125} r="5" fill={t}/>
 <text x="1290" y={y+133} fill={t} fontSize="22" fontWeight="650">{(s.stage==='regions'?'Region ':'Group ')+String.fromCharCode(65+i)+' · '+(g==='failed'?'WAITING':g==='booting'?'RESTARTING':'AVAILABLE')}</text>
 {g==='booting'&&<path d={'M1280 '+(y+90)+'H'+(1280+370*s.activity)} stroke={AMBER} strokeWidth="5" strokeLinecap="round"/>}
 </g>})}
 <PacketLayer s={s}/>
 <g transform="translate(100 735)"><text fontSize="27" fill={WHITE} fontWeight="650">Available capacity</text>{s.groups.map((g,i)=><rect key={i} x={i*75} y="23" width="64" height="14" rx="5" fill={g==='running'?GREEN:g==='booting'?AMBER:'#344451'}/>)}</g>
 {s.delayed&&<g><Route d={shot06Path(DELAYED_ROUTE)} tone={AMBER}/><text x="101" y="899" fontSize="23" fill={AMBER}>Delayed-message processing continues</text></g>}
 {s.impactEnded&&<g><text x="960" y="955" textAnchor="middle" fontSize="34" fontWeight="700" fill={WHITE}>13 Nov — 16:10 UTC</text><text x="960" y="1002" textAnchor="middle" fontSize="27" fill={GREEN}>Active customer impact ended</text></g>}
 </g>;
const UserView:React.FC<{s:RestoreState;frame:number;e:Ep004Shot12RenderProps['eventFrames']}>=({s,frame,e})=>{
 const pull=ease((frame-e.LESSON)/75);
 return <g><Header title="USEFUL WORK RETURNS"/>
 <g transform={'translate('+(pull*75)+' '+(pull*20)+') scale('+(1-pull*.08)+')'}>
 <Route d={shot06Path(MAIL_ROUTE)} tone={CYAN}/><Router/><Gate s={s}/>
 <Gateway x={1190} y={474} w={455} h={142} activity={s.activity}/>
 <text x="1417" y="422" textAnchor="middle" fontSize="30" fontWeight="700" fill={WHITE}>Primary gateway</text>
 <rect x="100" y="313" width="470" height="388" rx="20" fill="url(#s6Metal)" stroke="#7099AC" strokeWidth="2"/>
 <rect x="112" y="325" width="446" height="364" rx="14" fill="#10202D"/>
 <rect x="112" y="325" width="446" height="61" rx="12" fill="#1E4564"/>
 <text x="136" y="365" fontSize="28" fontWeight="700" fill={WHITE}>Outlook · Inbox</text>
 {[0,1,2].map(i=><g key={i}><rect x="130" y={407+i*63} width="410" height="53" rx="7" fill={i===0&&s.message?'#234638':'#1C2D3B'}/><circle cx="151" cy={433+i*63} r="5" fill={i===0&&s.message?GREEN:'#566D7D'}/><path d={'M170 '+(425+i*63)+'H'+(i===0?397:343)} stroke="#A1B7C6" strokeWidth="5" strokeLinecap="round"/><path d={'M170 '+(441+i*63)+'H300'} stroke="#526B7C" strokeWidth="4" strokeLinecap="round"/></g>)}
 <text x="143" y="637" fill={s.reply?GREEN:s.message?CYAN:'#9FB4C4'} fontSize="24" fontWeight="650">{s.reply?'Reply sent':frame>=e.REPLY?'Sending reply…':s.message?'Delayed message received':'Opening inbox…'}</text>
 <PacketLayer s={s}/>
 <g transform="translate(1210 700)"><text fontSize="25" fill={GREEN} fontWeight="650">Service available</text><text y="43" fontSize="23" fill={AMBER}>Residual mail processing</text></g></g>
 {s.lesson&&<text x="960" y="965" fontSize="34" fontWeight="700" fill={WHITE} textAnchor="middle">Recovery is more than a green status.</text>}
 </g>
};
export const Shot12ProductionScene:React.FC<Ep004Shot12RenderProps>=props=>{
 validateEp004Shot12Production(props,true);const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||cfg.durationInFrames!==props.durationInFrames)throw Error('SHOT12_EXACT_VIDEO_CONTRACT_REQUIRED');
 const s=shot12State(frame,props),e=props.eventFrames;
 const stageStart=s.stage==='rollout'?e.ROLLOUT:s.stage==='controls'?e.TWO_JOBS:s.stage==='regions'?e.MORNING:s.stage==='user'?e.USER:e.IDENTIFY;
 const stageMix=s.stage==='repair'?1:ease((frame-stageStart)/24);
 const prev=stageMix<1?shot12State(Math.max(0,stageStart-1),props):null;
 const view=(v:RestoreState)=>(v.stage==='rollout'||v.stage==='regions')?<FleetView s={v} frame={frame}/>:v.stage==='user'?<UserView s={v} frame={frame} e={e}/>:<RepairView s={v} frame={frame}/>;
 return <AbsoluteFill style={{background:'#0A1019',overflow:'hidden'}}><svg width="1920" height="1080" viewBox="0 0 1920 1080" fontFamily={FONT}>
 <Defs/><rect width="1920" height="1080" fill="url(#s6Bg)"/><rect y="905" width="1920" height="175" fill="url(#s6Floor)"/>
 {s.openingMix<1&&<g opacity={1-s.openingMix}><ConnectionView s={s.prior} frame={props.previousFrameCount-1+frame} focus={1+Math.min(frame,48)*.001}/></g>}
 {s.openingMix>0&&<g opacity={s.openingMix}>{prev&&<g opacity={1-stageMix}>{view(prev)}</g>}<g opacity={stageMix}>{view(s)}</g></g>}
 </svg>{frame===0&&props.previousLastFrameDataUri&&<AbsoluteFill style={{pointerEvents:'none'}}><Img src={props.previousLastFrameDataUri} style={{width:1920,height:1080}}/></AbsoluteFill>}</AbsoluteFill>;
};
