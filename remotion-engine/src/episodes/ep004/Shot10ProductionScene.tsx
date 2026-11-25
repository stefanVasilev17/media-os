import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATOutlookMailClient} from '../../components/architectural-thinking/ATOutlookMailClient';
import {shot06Path} from '../../components/architectural-thinking/EP004Shot06FleetPreview.mjs';
import {OUTCOME_MAIL,OUTCOME_OTHER} from '../../components/architectural-thinking/EP004Shot08ProductionWorld.mjs';
import type {RegionState,Dot} from '../../components/architectural-thinking/EP004Shot08ProductionWorld.mjs';
import {PROBE_ROUTE,WORK_ROUTE,WORK_QUEUE,CUT_PROBE_ROUTE,CUT_WORK_ROUTE,shot09State,validateEp004Shot09Production} from '../../components/architectural-thinking/EP004Shot09ProductionWorld.mjs';
import type {Ep004Shot09RenderProps,RecoveryState,Dot as RecoveryDot} from '../../components/architectural-thinking/EP004Shot09ProductionWorld.mjs';
import {WIDE_ROUTE,REPLAY_ROUTE,FLEET_ROUTES,shot10State,validateEp004Shot10Production} from '../../components/architectural-thinking/EP004Shot10ProductionWorld.mjs';
import type {Ep004Shot10RenderProps,State} from '../../components/architectural-thinking/EP004Shot10ProductionWorld.mjs';
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

const Dots:React.FC<{items:readonly Dot[]}>=({items})=><g>{items.map((p,i)=>{
 const tone=p.tone==='red'?RED:p.tone==='green'?GREEN:CYAN;
 return <g key={i}><circle cx={p.x} cy={p.y} r="18" fill={tone} opacity=".14"/><circle cx={p.x} cy={p.y} r="8" fill={tone}/></g>;
})}</g>;
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
const AppMark:React.FC<{name:string;index:number}>=({name,index})=><g>
 <rect width="52" height="52" rx="11" fill={['#247DB9','#6B5FBA','#287DB0','#2C8D87','#B96346'][index]} stroke="#C6DFEF" strokeOpacity=".22"/>
 <text x="26" y="35" textAnchor="middle" fontSize="29" fontWeight="700" fill="white">{['E','T','O','S','M'][index]}</text>
 <text x="72" y="35" fontSize="29" fontWeight="650" fill={WHITE}>{name}</text>
 </g>;
const Outcome:React.FC<{s:RegionState;frame:number}>=({s,frame})=><g>
 <Header title="WHAT THE USER ACTUALLY EXPERIENCES"/>
 <Route d={shot06Path(OUTCOME_MAIL)} tone={RED}/>
 <Route d={shot06Path(OUTCOME_OTHER)} tone={GREEN} active={s.user}/>
 <g transform="translate(89 75)"><ATOutlookMailClient openProgress={1} actionProgress={1} blocked={1} frame={frame}/></g>
 <text x="360" y="214" textAnchor="middle" fontSize="29" fontWeight="700" fill={RED}>Inbox unavailable</text>
 {s.user&&<g transform="translate(600 650)">
  <rect width="230" height="108" rx="14" fill="url(#s6Metal)" stroke={GREEN} strokeWidth="2"/>
  <g transform="translate(15 13)"><AppMark name="Teams" index={1}/></g>
  <circle cx="23" cy="83" r="6" fill={GREEN}/><text x="40" y="90" fontSize="21" fill={GREEN}>Feature responding</text>
 </g>}
 <Gateway x={1160} y={308} w={385} h={144} failed/>
 <text x="1352" y="263" textAnchor="middle" fontSize="34" fontWeight="700" fill={WHITE}>Primary gateway</text>
 <text x="1352" y="506" textAnchor="middle" fontSize="29" fill={RED}>Exchange Online</text>
 <Gateway x={1160} y={658} w={385} h={144} quiet={!s.user}/>
 <text x="1352" y="613" textAnchor="middle" fontSize="34" fontWeight="700" fill={WHITE}>Alternative gateway</text>
 <text x="1352" y="856" textAnchor="middle" fontSize="29" fill={GREEN}>Other capability</text>
 <Dots items={s.outcome}/>
 </g>;

const Traffic:React.FC<{items:readonly RecoveryDot[]}>=({items})=><g>{items.map((p,i)=>{
 const tone=p.tone==='green'?GREEN:p.tone==='amber'?AMBER:CYAN;
 return <g key={i}><circle cx={p.x} cy={p.y} r="16" fill={tone} opacity=".14"/><circle cx={p.x} cy={p.y} r={p.direction==='waiting'?6:8} fill={tone}/></g>;
})}</g>;
const Status:React.FC<{x:number;y:number;label:string;value:string;tone:string}>=({x,y,label,value,tone})=><g transform={'translate('+x+' '+y+')'}>
 <text y="0" fontSize="25" fill="#9FB4C4">{label}</text><circle cy="36" r="8" fill={tone}/><text x="24" y="45" fontSize="33" fontWeight="700" fill={tone}>{value}</text>
</g>;
const Recovery:React.FC<{s:RecoveryState;frame:number}>=({s,frame})=>{
 const running=s.processState==='running',tone=s.processState==='failed'?RED:running?GREEN:AMBER;
 const showProbe=s.probeStarted||s.stage!=='recovery',showWork=s.waiting||s.stage!=='recovery';
 const inside=s.stage==='contention';
 return <g>
  <Header title={s.stage==='recovery'?'GATEWAY RECOVERY':inside?'THE PROBLEM CAN RETURN':s.stage==='proof'?'ALIVE DOES NOT MEAN READY':'HEALTH CHECK VS. PRODUCTION WORKLOAD'}/>
  {showProbe&&<g opacity={s.incident?.52:1}>
    <g transform="translate(100 226)"><rect width="240" height="116" rx="14" fill="url(#s6Metal)" stroke="#6C889D" strokeWidth="2"/><rect x="13" y="13" width="214" height="90" rx="9" fill="url(#s6Face)"/><path d="M29 65H65L77 36L94 81L106 55H144" stroke={s.health?GREEN:CYAN} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="199" cy="35" r="7" fill={s.health?GREEN:'#526575'}/></g>
    <text x="220" y="382" textAnchor="middle" fontSize="27" fill={WHITE}>Health check</text>
    <Route d={shot06Path(PROBE_ROUTE)} tone={CYAN} active={s.probeStarted}/><Traffic items={s.probes}/>
   </g>}
  {showWork&&<g>
   <g transform="translate(100 488)"><rect width="250" height="114" rx="18" fill="url(#s6Metal)" stroke="#8197A7" strokeWidth="2"/><rect x="13" y="13" width="224" height="88" rx="9" fill="url(#s6Face)"/><g transform="translate(24 20)"><AppMark name="Outlook" index={2}/></g><path d="M28 86H207" stroke={CYAN} strokeWidth="3" opacity=".5"/></g>
   <text x="225" y="650" textAnchor="middle" fontSize="27" fill={WHITE}>Waiting users</text>
   <Route d={shot06Path(WORK_QUEUE)} tone={AMBER}/><Route d={shot06Path(WORK_ROUTE.slice(2))} tone={s.load>0?CYAN:AMBER} active={s.load>0}/>
   <Router/><Traffic items={s.queued}/><Traffic items={s.work.filter(p=>p.x<=685||p.x>=1015)}/>
  </g>}
  <Gateway x={1160} y={308} w={385} h={144} failed={!running} activity={s.activity}/>
  {s.processState==='booting'&&<g><rect x="1160" y="308" width="385" height="144" rx="9" fill="#14202B" stroke={AMBER} strokeWidth="3" opacity=".7"/><rect x="1181" y="425" height="8" rx="4" width={80+260*s.activity} fill={AMBER}/></g>}
  <text x="1352" y="263" textAnchor="middle" fontSize="34" fontWeight="700" fill={WHITE}>Primary gateway</text>
  <Status x={1160} y={515} label="Process" value={running?'RUNNING':s.processState==='booting'?'STARTING':'UNRESPONSIVE'} tone={tone}/>
  {s.health&&<Status x={1160} y={633} label="Basic health" value="RESPONDING" tone={GREEN}/>}
  {s.stage!=='recovery'&&<g>
   <Status x={1160} y={751} label="Readiness under load" value="NOT YET PROVEN" tone={AMBER}/>
   <rect x="1160" y="824" width="385" height="12" rx="6" fill="#0C1720" stroke="#596C7C"/>
   <rect x="1160" y="824" width={Math.max(0,385*s.load)} height="12" rx="6" fill={AMBER}/>
  </g>}
  {inside&&<g>
   <rect x="102" y="739" width="909" height="230" rx="20" fill="#101E2B" stroke="#668297" strokeWidth="2"/>
   <path d="M102 780L140 740H971L1011 780" fill="none" stroke="#8C9DAC" opacity=".5"/>
   <text x="136" y="785" fontSize="27" fontWeight="700" fill={WHITE}>Illustrative contention</text>
   <path d="M145 862H955" stroke="#40586B" strokeWidth="4"/>
   {Array.from({length:8},(_,i)=><g key={i}><rect x={150+i*102} y="829" width="78" height="72" rx="10" fill="url(#s6Face)" stroke={i<Math.floor(s.load*8)?AMBER:'#516578'} strokeWidth="2"/><rect x={164+i*102} y="846" width="50" height="37" rx="5" fill={i<Math.floor(s.load*8)?AMBER:'#253847'} opacity=".65"/></g>)}
   <text x="136" y="945" fontSize="23" fill="#AFC3D1">Useful work can slow as contention returns.</text>
  </g>}
  {!inside&&s.stage!=='recovery'&&<text x="960" y="985" textAnchor="middle" fontSize="35" fontWeight="700" fill={WHITE}>{s.stage==='proof'?(s.capacity?'A green endpoint is not proof of spare capacity.':'Can it keep doing useful work?'):'One small check. A very different workload.'}</text>}
 </g>;
};

const Client:React.FC<{x:number;y:number;w:number}>=({x,y,w})=><g transform={'translate('+x+' '+y+')'}>
 <rect width={w} height="112" rx="15" fill="url(#s6Metal)" stroke="#8197A7" strokeWidth="2"/>
 <rect x="10" y="10" width={w-20} height="92" rx="10" fill="url(#s6Face)"/>
 <rect x="20" y="24" width="48" height="48" rx="9" fill="#287CA8"/><text x="44" y="57" textAnchor="middle" fontSize="27" fontWeight="700" fill={WHITE}>O</text>
 <path d={'M22 88H'+(w-22)} stroke={CYAN} opacity=".45" strokeWidth="3"/>
 <text x={w/2} y="150" textAnchor="middle" fontSize="27" fontWeight="650" fill={WHITE}>Outlook</text>
</g>;
const Device:React.FC<{x:number;y:number;w:number;h:number;s:State;label:string}>=({x,y,w,h,s,label})=>{
 const tone=s.phase==='failed'?RED:s.phase==='booting'?AMBER:s.load>.65?AMBER:GREEN;
 return <g>
 <Gateway x={x} y={y} w={w} h={h} failed={s.phase==='failed'} activity={s.activity}/>
 <rect x={x+12} y={y+h-12} width={w-24} height="5" rx="2.5" fill="#071019"/>
 <rect x={x+12} y={y+h-12} width={(w-24)*s.load} height="5" rx="2.5" fill={tone}/>
 <text x={x+w/2} y={y-42} textAnchor="middle" fontSize="29" fontWeight="700" fill={WHITE}>{label}</text>
 <circle cx={x+14} cy={y+h+39} r="7" fill={tone}/><text x={x+31} y={y+h+48} fontSize="26" fontWeight="700" fill={tone}>{s.phase==='failed'?'UNRESPONSIVE':s.phase==='booting'?'STARTING':s.load>.65?'UNDER LOAD':'RUNNING'}</text>
 </g>;
};
const ReturnView:React.FC<{s:State}>=({s})=><g>
 <Header title="RECOVERY CAN REPEAT THE FAILURE"/>
 <Client x={100} y={488} w={250}/><Route d={shot06Path(WIDE_ROUTE)} tone={s.load>.65?AMBER:CYAN}/><Router/>
 <Device x={1160} y={308} w={385} h={144} s={s} label="Primary gateway"/>
 <Traffic items={s.queue}/><Traffic items={s.traffic.filter(p=>p.x<=685||p.x>=1015)}/>
 <text x="225" y="716" textAnchor="middle" fontSize="25" fill="#A4B8C8">Pending demand</text>
 <text x="1160" y="650" fontSize="28" fill="#A4B8C8">Returning workload</text>
 <rect x="1160" y="676" width="385" height="14" rx="7" fill="#0B1420" stroke="#536B7D"/><rect x="1160" y="676" width={385*s.load} height="14" rx="7" fill={s.load>.65?AMBER:GREEN}/>
 <text x="960" y="985" textAnchor="middle" fontSize="35" fontWeight="700" fill={WHITE}>Waiting connections have not disappeared.</text>
</g>;
const FleetView:React.FC<{s:State}>=({s})=><g>
 <Header title="FLEET-SCALE RECOVERY" sub="Conceptual fleet view"/>
 <Client x={100} y={488} w={250}/>{FLEET_ROUTES.map((r,i)=><Route key={i} d={shot06Path(r)} tone={RED}/>)}
 <Router/><Traffic items={s.fleet.filter(p=>p.x<=685||p.x>=1015)}/>
 {[0,1,2].map(i=><g key={i}><Gateway x={1240} y={285+i*195} w={340} h={130} failed activity={s.activity}/><text x="1410" y={270+i*195} textAnchor="middle" fontSize="26" fill={WHITE}>{'Gateway '+String.fromCharCode(65+i)}</text></g>)}
 <text x="960" y="985" textAnchor="middle" fontSize="35" fontWeight="700" fill={WHITE}>Normal automated recovery was not designed for this scale.</text>
</g>;
const ReplayView:React.FC<{s:State}>=({s})=>{
 const control=s.stage==='controlled',tone=s.phase==='failed'?RED:s.phase==='booting'?AMBER:s.load>.65?AMBER:GREEN;
 return <g>
 <Header title={control?'CONTROLLED TRAFFIC ADMISSION':'RESTARTING IS NOT RECOVERING'} sub={control?'Design principle · illustrative alternative': 'Illustrative recovery mechanism'}/>
 <Client x={440} y={479} w={200}/><Route d={shot06Path(REPLAY_ROUTE)} tone={control?GREEN:s.phase==='failed'?RED:AMBER}/>
 <g transform="translate(800 469) scale(.64) translate(-685 -440)"><Router showLabels={false}/></g>
 <text x="906" y="630" textAnchor="middle" fontSize="27" fill={WHITE}>Router</text>
 <Device x={1170} y={470} w={330} h={130} s={s} label="Primary gateway"/>
 {control&&<g><rect x="1050" y="491" width="36" height="88" rx="9" fill="url(#s6Metal)" stroke={s.gateOpen?GREEN:AMBER} strokeWidth="2"/><path d={s.gateOpen?'M1060 514H1076M1060 553H1076':'M1068 507V564'} stroke={s.gateOpen?GREEN:AMBER} strokeWidth="5" strokeLinecap="round"/><text x="1068" y="448" textAnchor="middle" fontSize="24" fill={WHITE}>Admission</text></g>}
 <Traffic items={s.queue}/><Traffic items={s.traffic.filter(p=>p.x<=800||p.x>=1012)}/>
 <text x="540" y="696" textAnchor="middle" fontSize="25" fill="#A4B8C8">{control?'Held demand':'Pending demand'}</text>
 <rect x="1170" y="695" width="330" height="12" rx="6" fill="#0B1420" stroke="#536B7D"/><rect x="1170" y="695" width={330*s.load} height="12" rx="6" fill={tone}/>
 <text x="960" y="985" textAnchor="middle" fontSize="35" fontWeight="700" fill={control?GREEN:WHITE}>{control?(s.goal?'Keep serving real users.':'Admit work at a sustainable rate.'):s.secondFailure?'Recover twice.':s.phase==='failed'?'The same failure can return.':'Restart. Return traffic. Observe useful work.'}</text>
 {control&&s.goal&&<g opacity=".65"><path d="M590 830H1330" stroke="#567586" strokeWidth="2"/>{[590,960,1330].map((x,i)=><circle key={i} cx={x} cy="830" r="6" fill={i===2?GREEN:'#8AA2B4'}/>)}</g>}
 </g>;
};
export const Shot10ProductionScene:React.FC<Ep004Shot10RenderProps>=props=>{
 validateEp004Shot10Production(props,true);
 const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||cfg.durationInFrames!==props.durationInFrames)throw Error('SHOT10_EXACT_VIDEO_CONTRACT_REQUIRED');
 const s=shot10State(frame,props);
 return <AbsoluteFill style={{background:'#0A1019',overflow:'hidden'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" fontFamily={FONT}>
   <Defs/><rect width="1920" height="1080" fill="url(#s6Bg)"/><rect y="905" width="1920" height="175" fill="url(#s6Floor)"/>
   {s.openingMix>0&&<g opacity={s.openingMix}>{s.stage==='return'?<ReturnView s={s}/>:s.stage==='fleet'?<FleetView s={s}/>:<ReplayView s={s}/>}</g>}
   {s.prior&&<g opacity={1-s.openingMix}><Recovery s={s.prior} frame={props.previousShot09Props.durationInFrames-1+frame}/></g>}
  </svg>
  {frame===0&&props.previousLastFrameDataUri&&<AbsoluteFill style={{pointerEvents:'none'}}><Img src={props.previousLastFrameDataUri} style={{width:1920,height:1080}}/></AbsoluteFill>}
 </AbsoluteFill>;
};
