import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {ATOutlookMailClient} from '../../components/architectural-thinking/ATOutlookMailClient';
import {shot06Path} from '../../components/architectural-thinking/EP004Shot06FleetPreview.mjs';
import {REEL_INPUT,REEL_OUTPUTS} from '../../components/architectural-thinking/EP004Shot07ProductionWorld.mjs';
import type {CascadeState} from '../../components/architectural-thinking/EP004Shot07ProductionWorld.mjs';
import {REGION_X,REGION_ROUTES,PRODUCT_NAMES,PRODUCT_Y,PRIMARY_ROUTES,ALT_ROUTES,OUTCOME_MAIL,OUTCOME_OTHER,shot08State,validateEp004Shot08Production} from '../../components/architectural-thinking/EP004Shot08ProductionWorld.mjs';
import type {Ep004Shot08RenderProps,RegionState,Dot} from '../../components/architectural-thinking/EP004Shot08ProductionWorld.mjs';

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
const Regions:React.FC<{s:RegionState;frame:number}>=({s,frame})=><g>
 <Header title={s.incident?'REGIONAL CONTAINMENT FAILED':'ISOLATION LIMITS THE BLAST RADIUS'} sub={!s.incident?'Capacity units organized into regions':undefined}/>
 {REGION_X.map((x,i)=>{
   const level=s.levels[i],bad=level>.5,tone=bad?RED:'#789CAF';
   return <g key={x}>
     <path d={'M'+(x-252)+' 280L'+(x-218)+' 244H'+(x+218)+'L'+(x+252)+' 280V780L'+(x+218)+' 813H'+(x-218)+'L'+(x-252)+' 780Z'} fill={bad?'#492B36':'#203849'} fillOpacity={.37+level*.18} stroke={tone} strokeOpacity=".76" strokeWidth="2.4"/>
     <path d={'M'+(x-252)+' 780L'+(x-218)+' 813H'+(x+218)+'L'+(x+252)+' 780V798L'+(x+218)+' 832H'+(x-218)+'L'+(x-252)+' 798Z'} fill="#09131E" stroke={tone} strokeOpacity=".4"/>
     <text x={x} y="225" textAnchor="middle" fontSize="33" fontWeight="700" fill={WHITE}>Region {String.fromCharCode(65+i)}</text>
     <g transform={'translate('+(x-218-685*.36)+' '+(470-440*.36)+') scale(.36)'}><Router showLabels={false}/></g>
     <text x={x-159} y="562" textAnchor="middle" fontSize="22" fontWeight="650" fill={WHITE}>Router</text>
     <path d={'M'+(x-240)+' 504H'+(x-218)} stroke={CYAN} strokeWidth="5" strokeLinecap="round"/>
     {[0,1].map(j=>{
       const y=346+j*214,activity=.5+.5*Math.sin((frame+i*13+j*23)*.087);
       return <g key={j}>
         <Route d={shot06Path(REGION_ROUTES[i*2+j])} tone={bad?RED:CYAN}/>
         <Gateway x={x+30} y={y} w={190} h={112} failed={bad} activity={activity}/>
         <text x={x+125} y={y+143} textAnchor="middle" fontSize="24" fill={WHITE}>Capacity unit</text>
       </g>;
     })}
     <path d={'M'+(x-210)+' 715H'+(x+210)} stroke={tone} strokeOpacity=".45" strokeWidth="1"/>
     <circle cx={x-138} cy="755" r="7" fill={bad?RED:GREEN}/>
     <text x={x-117} y="764" fontSize="28" fill={bad?RED:GREEN}>{bad?'Affected':'Contained / available'}</text>
   </g>;
 })}
 <Dots items={s.regions}/>
 {[675,1245].map(x=><g key={x}><path d={'M'+x+' 275V799'} stroke={s.lost?RED:s.bulkhead?CYAN:'#63849A'} strokeWidth={s.bulkhead?7:3} strokeDasharray={s.lost?'12 15':undefined} opacity={s.bulkhead||s.lost?.85:.4}/></g>)}
 {s.bulkhead&&<g><text x="960" y="910" fontSize="43" fontWeight="700" textAnchor="middle" fill={CYAN}>Bulkhead</text><text x="960" y="952" fontSize="27" textAnchor="middle" fill={WHITE}>A fault stays inside its own partition.</text></g>}
 {s.lost&&<g><path d="M148 875V898H1772V875" stroke={RED} strokeWidth="4" fill="none" strokeLinecap="round"/><text x="960" y="953" textAnchor="middle" fontSize="35" fontWeight="700" fill={RED}>Separate issue: containment ineffective</text></g>}
 {!s.incident&&!s.bulkhead&&<text x="960" y="948" textAnchor="middle" fontSize="31" fill="#C1D5E0">One affected region. Other partitions remain available.</text>}
 {s.incident&&!s.lost&&<text x="960" y="948" textAnchor="middle" fontSize="30" fill="#C1D5E0">Regions and partitions existed.</text>}
 </g>;
const AppMark:React.FC<{name:string;index:number}>=({name,index})=><g>
 <rect width="52" height="52" rx="11" fill={['#247DB9','#6B5FBA','#287DB0','#2C8D87','#B96346'][index]} stroke="#C6DFEF" strokeOpacity=".22"/>
 <text x="26" y="35" textAnchor="middle" fontSize="29" fontWeight="700" fill="white">{['E','T','O','S','M'][index]}</text>
 <text x="72" y="35" fontSize="29" fontWeight="650" fill={WHITE}>{name}</text>
 </g>;
const Dependencies:React.FC<{s:RegionState}>=({s})=><g>
 <Header title="ONE PLATFORM. DIFFERENT DEPENDENCIES." sub="Recovery depends on which gateway a workload can use."/>
 {PRIMARY_ROUTES.map((path,i)=><g key={'p'+i} opacity={i===0||!s.moved?1:.24}><Route d={shot06Path(path)} tone={RED}/></g>)}
 {ALT_ROUTES.map((path,i)=>i>0&&s.serviceNames?<Route key={'a'+i} d={shot06Path(path)} tone={GREEN} active={s.moved}/>:null)}
 {s.exchange&&<path d={shot06Path(ALT_ROUTES[0])} stroke="#80929D" strokeWidth="5" strokeDasharray="9 13" strokeOpacity=".48" fill="none"/>}
 {PRODUCT_NAMES.map((name,i)=><g key={name} transform={'translate(105 '+(PRODUCT_Y[i]-26)+')'} opacity={i===0||s.serviceNames?1:.22}>
  <AppMark name={i===0||s.serviceNames?name:'Other workload'} index={i}/>
 </g>)}
 <Gateway x={875} y={318} w={338} h={144} failed/>
 <text x="1044" y="276" textAnchor="middle" fontSize="34" fontWeight="700" fill={WHITE}>Primary gateway</text>
 <text x="1044" y="505" textAnchor="middle" fontSize="25" fill={RED}>Affected</text>
 <Gateway x={875} y={663} w={338} h={144} quiet={!s.moved}/>
 <text x="1044" y="619" textAnchor="middle" fontSize="34" fontWeight="700" fill={WHITE}>Alternative gateway</text>
 <text x="1044" y="854" textAnchor="middle" fontSize="25" fill={s.moved?GREEN:'#91A4B6'}>{s.moved?'Available path':'Quiet path'}</text>
 <Dots items={s.primary}/><Dots items={s.alternate}/>
 <path d="M1280 286V860" stroke="#546D80" strokeWidth="1.5"/>
 <g transform="translate(1340 324)">
   <circle cx="12" cy="13" r="8" fill={RED}/><text x="38" y="23" fontSize="30" fontWeight="700" fill={WHITE}>Exchange Online</text>
   <text x="38" y="69" fontSize="26" fill={RED}>Remains impacted</text>
   {s.exchange&&<text x="38" y="107" fontSize="23" fill="#B6C6D2">Scale constraint</text>}
 </g>
 {s.moved&&<g transform="translate(1340 677)">
   <circle cx="12" cy="13" r="8" fill={GREEN}/><text x="38" y="23" fontSize="30" fontWeight="700" fill={WHITE}>Other workloads</text>
   <text x="38" y="69" fontSize="26" fill={GREEN}>Partial recovery</text>
 </g>}
 <text x="960" y="974" textAnchor="middle" fontSize="30" fontWeight="650" fill={WHITE}>{s.exchange?'Same platform. Different paths.':'A shared gateway does not mean identical impact.'}</text>
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
export const Shot08ProductionScene:React.FC<Ep004Shot08RenderProps>=props=>{
 validateEp004Shot08Production(props,true);
 const frame=useCurrentFrame(),cfg=useVideoConfig();
 if(cfg.width!==1920||cfg.height!==1080||cfg.fps!==30||cfg.durationInFrames!==props.durationInFrames)throw Error('SHOT08_EXACT_VIDEO_CONTRACT_REQUIRED');
 const s=shot08State(frame,props);
 return <AbsoluteFill style={{background:'#0A1019',overflow:'hidden'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" fontFamily={FONT}>
   <Defs/><rect width="1920" height="1080" fill="url(#s6Bg)"/><rect y="905" width="1920" height="175" fill="url(#s6Floor)"/>
   {s.stage==='regions'&&<g opacity={s.openingMix}><Regions s={s} frame={frame}/></g>}
   {s.inherited&&<g opacity={1-s.openingMix}><Reel s={s.inherited} rescue/></g>}
   {s.stage==='dependencies'&&<Dependencies s={s}/>}
   {s.stage==='outcome'&&<g transform={'translate('+(-s.focus*75)+' '+(-s.focus*18)+') scale('+(1+s.focus*.12)+')'}><Outcome s={s} frame={frame}/></g>}
  </svg>
  {frame===0&&props.previousLastFrameDataUri&&<AbsoluteFill style={{pointerEvents:'none'}}><Img src={props.previousLastFrameDataUri} style={{width:1920,height:1080}}/></AbsoluteFill>}
 </AbsoluteFill>;
};
