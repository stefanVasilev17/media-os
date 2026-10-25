import React from 'react';
import {Html5Audio,Sequence,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {AuthServiceTier2Shot08BridgeV8} from './AuthServiceTier2Shot08BridgeV8';

const W=1920,H=1080,FPS=30;
const P={navy:'#06182C',panel:'#0C2F49',panelHi:'#123F55',white:'#F0FBFF',dim:'#A8CDDF',mint:'#62EDBF',cyan:'#61DEF5',violet:'#BAAFFF',amber:'#EAC493',line:'#3E7691'};
const limit=(x:number)=>Math.min(1,Math.max(0,x));
const ease=(t:number,a:number,b:number)=>{const x=limit((t-a)/(b-a));return x*x*(3-2*x)};
const oscillate=(t:number)=>.5+.5*Math.sin(t*2.1);
type VoiceClip={src:string;fromFrame:number;durationInFrames:number;trimBeforeFrames?:number};
type Props={durationInFrames:number;audioClips?:VoiceClip[]};
const Text:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;weight?:number;color?:string;anchor?:'start'|'middle'|'end';opacity?:number}>=({x,y,children,size=27,weight=720,color=P.white,anchor='start',opacity=1})=><text x={x} y={y} fontFamily={AT_FONT} fontSize={size} fontWeight={weight} textAnchor={anchor} opacity={opacity} fill={color}>{children}</text>;
const Card:React.FC<{x:number;y:number;w:number;h:number;color?:string;glow?:boolean;children:React.ReactNode}>=({x,y,w,h,color=P.cyan,glow=false,children})=><g><rect x={x-5} y={y-5} width={w+10} height={h+10} rx={27} fill={color} opacity={glow?.045:.012}/><rect x={x} y={y} width={w} height={h} rx={23} fill={glow?P.panelHi:P.panel} stroke={color} strokeOpacity={glow?.86:.48} strokeWidth={glow?2.5:1.7}/><path d={`M ${x+24} ${y+17} H ${x+w-24}`} stroke={color} strokeOpacity=".25" strokeWidth={2}/>{children}</g>;
const Pill:React.FC<{x:number;y:number;w:number;label:string;color?:string;size?:number}>=({x,y,w,label,color=P.cyan,size=24})=><g><rect x={x} y={y} width={w} height={51} rx={14} fill="#153F57" stroke={color} strokeOpacity=".66" strokeWidth={1.6}/><Text x={x+w/2} y={y+34} color={color} size={size} weight={820} anchor="middle">{label}</Text></g>;
const Flow:React.FC<{x1:number;y1:number;x2:number;y2:number;t:number;color?:string;speed?:number}>=({x1,y1,x2,y2,t,color=P.mint,speed=.35})=><g><path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity=".37" strokeWidth={3} strokeDasharray="12 11"/>{[0,1,2].map(i=>{const f=((t*speed+i/3)%1+1)%1;return <g key={i}><circle cx={x1+(x2-x1)*f} cy={y1+(y2-y1)*f} r={11} fill={color} opacity={.32+.54*Math.sin(f*Math.PI)}/><circle cx={x1+(x2-x1)*f} cy={y1+(y2-y1)*f} r={25} fill={color} opacity=".055"/></g>})}</g>;
const Back:React.FC<{t:number;children:React.ReactNode;headline:string}>=({t,children,headline})=><svg width={W} height={H} viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}><defs><radialGradient id="s10night" cx=".43" cy=".21" r=".96"><stop offset="0" stopColor="#123B58"/><stop offset=".65" stopColor="#0A2945"/><stop offset="1" stopColor="#06182C"/></radialGradient></defs><rect width={W} height={H} fill="url(#s10night)"/><g stroke={P.cyan} strokeOpacity=".063" strokeWidth={1}>{Array.from({length:15},(_,i)=><path key={'a'+i} d={`M ${90+i*123} 0 V 1080`}/>)}{Array.from({length:10},(_,i)=><path key={'b'+i} d={`M 0 ${70+i*118} H 1920`}/>)}</g><circle cx={1580} cy={230} r={190+15*oscillate(t)} fill={P.cyan} opacity=".018"/><rect x={138} y={65} width={1644} height={130} rx={24} fill="#0A2B46" stroke="#4A7B99" strokeWidth={1.8}/><circle cx={183} cy={130} r={12} fill={P.mint}/><Text x={224} y={141} size={40} weight={880}>{headline}</Text>{children}<path d="M 195 1011 H 1725" stroke={P.cyan} opacity=".17" strokeWidth={3}/><path d={`M 195 1011 H ${195+1530*limit(t/72)}`} stroke={P.mint} opacity=".8" strokeWidth={4}/></svg>;
const ANCHORS:Record<string,number>={
 GET_FACTS:120.4,INBOX_OPEN:31.8,INSTANCE_B:4.433333333333334,EMAIL_CLAIM:112.13333333333334,FORMAT_PREP:57.5,LOOKUP_BORN:125.36666666666666,
 SECRET_ROLE:46.6,AUTH_ARRIVAL:.8666666666666667,FIND_ACCOUNT:117.23333333333333,
 INPUT_FIELDS:37.6,LIMITS_CHECK:82.93333333333334,CHECKS_PASSED:98.4,
 FORMAT_EXAMPLE:68.13333333333334,LOOKUP_ACCOUNT:155.83333333333334,
 LOOKUP_TRAVELS:142.96666666666667,ORIGINAL_STAYS:132.43333333333334,
 PROOF_QUESTION:25.966666666666665,REQUIRED_CHECK:76.63333333333334,
 AUTH_DEFINITION:20.833333333333332,IDENTIFIER_ROLE:43.5,NOT_YET_CORRECT:50.566666666666666,
 STRUCTURE_CHECK:79.9,VALIDATION_NAME:60.766666666666666,VALID_NOT_LOGIN:87.03333333333333,
 NOT_SECOND_LOGIN:146.66666666666666,PASSWORD_UNKNOWN:104.63333333333334,
 SERVICE_QUESTION:150.03333333333333,ROUTING_NOT_TRUST:10.666666666666666,
 EMPTY_FIELD_EXAMPLE:65.56666666666666,INFORMATION_FOR_VERIFY:158.66666666666666
};
const OriginalMap:React.FC<{t:number}>=({t})=>{
 const k=ease(t,1.5,9);return <div style={{position:'absolute',width:W,height:H,overflow:'hidden',background:P.navy}}>
  <div style={{position:'absolute',width:W,height:H,transform:`translate(${-245*k}px,${-75*k}px) scale(${1+.28*k})`,transformOrigin:'50% 50%'}}>
   <Sequence from={-4881}><AuthServiceTier2Shot08BridgeV8 durationInFrames={4882} anchors={ANCHORS} clipStarts={[24,952,1821,2940,3915]} showFoundAccountRecord={true}/></Sequence>
  </div>
  <svg width={W} height={H} viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
   <g opacity={ease(t,4.5,7.5)}><rect x={660} y={858} width={600} height={91} rx={20} fill="#123F58" stroke={P.mint} strokeOpacity=".8" strokeWidth={2}/><Text x={960} y={914} anchor="middle" size={31} color={P.mint} weight={850}>IDENTITY VERIFIED</Text></g>
  </svg>
 </div>;
};
const EnterState:React.FC<{t:number}>=({t})=><Back t={t} headline="AUTHENTICATION STATE">
 <g opacity={ease(t,8,11)}>
  <Card x={152} y={304} w={510} h={522} color={P.mint} glow><Text x={206} y={383} size={33} weight={860}>AUTH SERVICE</Text><circle cx={404} cy={535} r={74} fill="#164C50" stroke={P.mint} strokeWidth={3}/><path d="M 360 539 l 31 32 l 57 -74" stroke={P.mint} strokeWidth={9} fill="none" strokeLinecap="round"/><Text x={408} y={676} anchor="middle" size={36} color={P.mint} weight={870}>VERIFIED</Text></Card>
  <g opacity={ease(t,11,13)}><Flow x1={663} y1={554} x2={771} y2={554} t={t}/></g>
  <Card x={785} y={304} w={982} h={522} color={P.cyan} glow={t>18}><Text x={842} y={385} size={36} weight={860}>SESSION CREATION</Text><Pill x={842} y={433} w={419} label="VERIFIED IDENTITY" color={P.mint}/><Flow x1={1265} y1={461} x2={1339} y2={461} t={t} color={P.cyan}/><Pill x={1350} y={433} w={345} label="TRUSTED PROOF" color={P.cyan}/><g opacity={ease(t,16,20)}><circle cx={1280} cy={643} r={61} fill="#174B55" stroke={P.mint} strokeWidth={3}/><path d="M 1250 643 l 23 24 l 45 -49" fill="none" stroke={P.mint} strokeWidth={7} strokeLinecap="round"/><Text x={1280} y={759} anchor="middle" size={33} color={P.mint}>STATE CREATED</Text></g></Card>
 </g>
 </Back>;
const Alternatives:React.FC<{t:number}>=({t})=><Back t={t} headline="ONE LOGIN PROOF · TWO POSSIBLE DESIGNS">
 <g opacity={ease(t,24,27)}>
  <Card x={160} y={308} w={734} h={522} color={P.cyan} glow={t<37}><Pill x={211} y={365} w={427} label="SERVER SESSION"/><Text x={525} y={515} anchor="middle" size={39} weight={870}>SESSION ID</Text><Flow x1={356} y1={582} x2={703} y2={582} t={t} color={P.cyan}/><Card x={262} y={638} w={524} h={117} color={P.cyan}><Text x={524} y={711} anchor="middle" size={31}>SERVER REMEMBERS STATE</Text></Card></Card>
  <g opacity=".92"><circle cx={959} cy={557} r={56} fill="#0A2C46" stroke={P.line} strokeWidth={1.7}/><Text x={959} y={572} anchor="middle" size={34} color={P.dim}>OR</Text></g>
  <Card x={1025} y={308} w={734} h={522} color={P.violet} glow={t>=37}><Pill x={1077} y={365} w={396} label="SIGNED TOKEN" color={P.violet}/><Text x={1395} y={515} anchor="middle" size={39} weight={870}>TOKEN</Text><Flow x1={1210} y1={582} x2={1580} y2={582} t={t} color={P.violet}/><Card x={1130} y={638} w={524} h={117} color={P.violet}><Text x={1392} y={711} anchor="middle" size={31}>CLIENT PRESENTS PROOF</Text></Card></Card>
 </g>
 </Back>;
const ReturnProof:React.FC<{t:number}>=({t})=><Back t={t} headline="AUTHENTICATION STATE">
 <g opacity={ease(t,44,47)}>
 <Card x={126} y={332} w={590} h={434} color={P.mint} glow><Text x={173} y={406} size={37} weight={855}>TRUSTED PROOF</Text><Pill x={173} y={475} w={490} label="LIMITED LIFETIME" color={P.amber}/><g><rect x={173} y={571} width={490} height={14} rx={7} fill="#2A5365"/><rect x={173} y={571} width={490*(1-.5*ease(t,48,68))} height={14} rx={7} fill={P.mint}/></g><Text x={173} y={668} size={29} color={P.dim}>EXPIRES BY DESIGN</Text></Card>
 <Flow x1={719} y1={551} x2={843} y2={551} t={t} color={P.cyan}/>
 <Card x={861} y={332} w={502} h={434} color={P.cyan} glow={t>55}><Text x={914} y={409} size={36} weight={860}>RESPONSE PREP</Text><Pill x={914} y={494} w={398} label="SUCCESS" color={P.mint}/><g opacity={ease(t,53,57)}><Pill x={914} y={593} w={398} label="PROOF ATTACHED" color={P.cyan}/></g></Card>
 <g opacity={ease(t,57,60)}><Flow x1={1367} y1={551} x2={1470} y2={551} t={t} color={P.cyan}/></g>
 <Card x={1485} y={332} w={313} h={434} color={P.cyan}><Text x={1642} y={414} size={35} anchor="middle" weight={860}>PHONE</Text><rect x={1556} y={478} width={176} height={214} rx={28} fill="#0A253F" stroke={P.cyan} strokeOpacity=".6" strokeWidth={3}/><circle cx={1644} cy={584} r={37} fill="none" stroke={P.cyan} strokeWidth={6} strokeOpacity=".3"/><path d="M 1644 547 A 37 37 0 0 1 1681 584" fill="none" stroke={P.cyan} strokeWidth={6} strokeLinecap="round"/></Card>
 </g>
 <g opacity={ease(t,60,64)}><Text x={962} y={903} size={33} anchor="middle" color={P.mint} weight={850}>RESPONSE READY · PHONE STILL WAITING</Text></g>
 </Back>;
export const Shot10SessionCreationShortV1:React.FC<Props>=({audioClips=[]})=>{
 const t=useCurrentFrame()/FPS;
 return <div style={{position:'absolute',inset:0,width:W,height:H,background:P.navy,overflow:'hidden',fontFamily:AT_FONT}}>
  {t<11.5&&<div style={{position:'absolute',inset:0,opacity:1-ease(t,9,11.5)}}><OriginalMap t={t}/></div>}
  {t>=8&&t<27.5&&<div style={{position:'absolute',inset:0,opacity:ease(t,8,11.5)*(1-ease(t,24,27.5))}}><EnterState t={t}/></div>}
  {t>=24&&t<47.5&&<div style={{position:'absolute',inset:0,opacity:ease(t,24,27.5)*(1-ease(t,44,47.5))}}><Alternatives t={t}/></div>}
  {t>=44&&<div style={{position:'absolute',inset:0,opacity:ease(t,44,47.5)}}><ReturnProof t={t}/></div>}
  {audioClips.map((clip,i)=><Sequence key={i} from={clip.fromFrame} durationInFrames={clip.durationInFrames}><Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames??0}/></Sequence>)}
 </div>;
};
export const SHOT10_SHORT_DRAFT_FRAMES=2160;
