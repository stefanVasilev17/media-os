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


const Slate:React.FC<{t:number;title:string;eyebrow:string;children:React.ReactNode}>=({t,title,eyebrow,children})=><svg width={W} height={H} viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
 <defs><radialGradient id="s10v7bg" cx=".5" cy=".41" r=".85"><stop offset="0" stopColor="#133B57"/><stop offset=".62" stopColor="#0A2945"/><stop offset="1" stopColor="#061526"/></radialGradient></defs>
 <rect width={W} height={H} fill="url(#s10v7bg)"/>
 <g stroke={P.cyan} strokeOpacity=".05">{Array.from({length:18},(_,i)=><path key={i} d={'M '+(100+i*105)+' 0 V 1080'}/>)}{Array.from({length:11},(_,i)=><path key={i} d={'M 0 '+(43+i*104)+' H 1920'}/>)}</g>
 <text x={132} y={95} fill={P.mint} fontFamily={AT_FONT} fontSize={25} fontWeight={830} letterSpacing={3}>{eyebrow}</text>
 <Text x={132} y={166} size={54} weight={900}>{title}</Text>
 <path d="M 132 203 H 1788" stroke={P.line} strokeOpacity=".48" strokeWidth={2}/>
 <CinematicEnergy t={t}/>{children}
 <path d="M 132 1014 H 1788" stroke={P.cyan} strokeWidth={3} strokeOpacity=".15"/>
 <path d={'M 132 1014 H '+(132+1656*limit(t/72))} stroke={P.mint} strokeWidth={4} strokeOpacity=".92"/>
</svg>;
const Prism:React.FC<{x:number;y:number;w:number;h:number;d?:number;color?:string;children?:React.ReactNode;strength?:number}>=({x,y,w,h,d=42,color=P.mint,children,strength=.8})=><g>
 <ellipse cx={x+w/2+12} cy={y+h+d+29} rx={w*.48} ry={22} fill="#010A16" opacity=".7"/>
 <polygon points={[x+','+y,(x+d)+','+(y-d),(x+w+d)+','+(y-d),(x+w)+','+y].join(' ')} fill="#2C5871" stroke={color} strokeOpacity={.4+strength*.4} strokeWidth={2}/>
 <polygon points={[(x+w)+','+y,(x+w+d)+','+(y-d),(x+w+d)+','+(y+h-d),(x+w)+','+(y+h)].join(' ')} fill="#071B31" stroke={color} strokeOpacity={.35+strength*.4} strokeWidth={2}/>
 <rect x={x} y={y} width={w} height={h} rx={24} fill="#0D3049" stroke={color} strokeOpacity={.33+strength*.55} strokeWidth={2.8}/>
 <path d={'M '+(x+26)+' '+(y+19)+' H '+(x+w-26)} stroke={color} strokeOpacity={.28+strength*.36} strokeWidth={2}/>
 {children}
</g>;
const Crystal:React.FC<{x:number;y:number;r:number;t:number;color?:string}>=({x,y,r,t,color=P.mint})=><g>
 <ellipse cx={x} cy={y+r*.93} rx={r*.88} ry={r*.21} fill={color} opacity=".12"/>
 <polygon points={[[x-r*.75,y],[x-r*.28,y-r*.73],[x+r*.28,y-r*.73],[x+r*.75,y],[x+r*.28,y+r*.67],[x-r*.28,y+r*.67]].map(v=>v.join(',')).join(' ')} fill="#15616C" stroke={color} strokeWidth={4}/>
 <polygon points={[[x-r*.75,y],[x-r*.28,y-r*.73],[x,y-r*.18],[x,y+r*.67],[x-r*.28,y+r*.67]].map(v=>v.join(',')).join(' ')} fill="#153651" opacity=".8"/>
 <path d={'M '+(x-r*.28)+' '+(y-r*.73)+' L '+x+' '+(y-r*.18)+' L '+(x+r*.28)+' '+(y-r*.73)+' M '+x+' '+(y-r*.18)+' V '+(y+r*.67)} stroke={color} strokeWidth={3} strokeOpacity=".76" fill="none"/>
 <ellipse cx={x} cy={y} rx={r*1.1} ry={r*.29} transform={'rotate(-17 '+x+' '+y+')'} stroke={color} strokeWidth={3} strokeDasharray="20 15" strokeOpacity=".45" fill="none"/>
 <circle cx={x+r*.93*Math.cos(t*.65)} cy={y-r*.29*Math.sin(t*.65)} r={9} fill={color}/>
</g>;
const CinematicEnergy:React.FC<{t:number}>=({t})=>{
 const phase=t<26.5?0:t<47?1:t<61?2:3;
 const colors=[P.mint,P.violet,P.cyan,P.mint];
 const c=colors[phase];
 const period=phase===0?11:phase===1?9:phase===2?6:4;
 const u=((t/period)%1+1)%1;
 return <g pointerEvents="none">
  <circle cx={1002} cy={554} r={360+64*u} fill="none" stroke={c} strokeWidth={2} opacity={.028*(1-u)}/>
  <circle cx={1002} cy={554} r={195+44*u} fill="none" stroke={c} strokeDasharray="18 31" strokeWidth={3} opacity={.045+.045*Math.sin(t*1.2)}/>
  <path d="M 55 938 H 438 M 1482 243 H 1874 M 125 246 H 341 M 1576 933 H 1800" stroke={c} strokeWidth={2} opacity=".15"/>
  {[0,1,2,3].map(i=>{
    const y=262+i*206;
    const x=90+((t*(19+i*7)+i*431)%1740);
    return <circle key={i} cx={x} cy={y} r={i===0?5:3} fill={c} opacity={.12+.11*Math.sin(t*2+i)}/>;
  })}
 </g>;
};
const ActiveRail:React.FC<{t:number;x:number;y:number;w:number;color?:string;span?:number}>=({t,x,y,w,color=P.cyan,span=230})=>{
 const k=((t*.15)%1+1)%1;
 return <g pointerEvents="none">
  <rect x={x} y={y} width={w} height={4} rx={2} fill={color} opacity=".14"/>
  <rect x={x+(w-span)*k} y={y} width={span} height={4} rx={2} fill={color} opacity={.32+.28*Math.sin(t*1.5)}/>
  <circle cx={x+(w-span)*k+span} cy={y+2} r={7} fill={color} opacity=".22"/>
 </g>
};

const Panel:React.FC<{x:number;y:number;w:number;h:number;color?:string;active?:number;children:React.ReactNode}>=({x,y,w,h,color=P.cyan,active=0,children})=><g>
 <rect x={x-9} y={y-9} width={w+18} height={h+18} rx={32} fill={color} opacity={.018+active*.042}/>
 <rect x={x} y={y} width={w} height={h} rx={27} fill={active>.5?'#103851':'#0B2A43'} stroke={color} strokeOpacity={.36+active*.54} strokeWidth={active>.5?3:2}/>
 <path d={'M '+(x+31)+' '+(y+19)+' H '+(x+w-31)} stroke={color} strokeOpacity=".34" strokeWidth={2.2}/>
 <ActiveRail t={active*2.3+y*.004} x={x+37} y={y+4} w={w-74} color={color} span={168}/>
 {children}
</g>;
const DataRow:React.FC<{x:number;y:number;w:number;label:string;value:string;color?:string;active?:number;valueSize?:number}>=({x,y,w,label,value,color=P.white,active=0,valueSize=30})=><g>
 <rect x={x} y={y} width={w} height={66} rx={13} fill={active>.5?'#153C53':'#102D45'} stroke={active>.5?color:P.line} strokeOpacity={active>.5?.6:.23} strokeWidth={1.4}/>
 <Text x={x+22} y={y+42} size={24} weight={690} color={P.dim}>{label}</Text>
 <Text x={x+w-23} y={y+43} size={valueSize} weight={860} color={color} anchor="end">{value}</Text>
</g>;
const IconBox:React.FC<{x:number;y:number;label:string;color:string;done?:boolean;size?:number}>=({x,y,label,color,done=false,size=31})=><g>
 <rect x={x} y={y} width={322} height={76} rx={17} stroke={color} strokeOpacity={done?.87:.43} strokeWidth={done?2.8:1.6} fill={done?'#143F50':'#102D46'}/>
 <circle cx={x+37} cy={y+38} r={12} fill={color} opacity={done?1:.5}/>
 <Text x={x+68} y={y+49} size={size} color={done?P.white:P.dim} weight={820}>{label}</Text>
</g>;
const Packet:React.FC<{x:number;y:number;label:string;color?:string;width?:number}>=({x,y,label,color=P.mint,width=220})=><g>
 <rect x={x} y={y} width={width} height={77} rx={18} fill="#11394F" stroke={color} strokeWidth={2.8}/>
 <Text x={x+width/2} y={y+48} anchor="middle" size={30} weight={850} color={color}>{label}</Text>
</g>;
const Flux:React.FC<{x1:number;y:number;x2:number;t:number;color?:string;opacity?:number;speed?:number}>=({x1,y,x2,t,color=P.cyan,opacity=1,speed=.46})=><g opacity={opacity}>
 <path d={'M '+x1+' '+y+' H '+x2} stroke={color} strokeOpacity=".29" strokeWidth={4} strokeDasharray="13 15"/>
 {[0,1,2].map(i=>{const k=((t*speed+i/3)%1+1)%1;return <g key={i}><circle cx={x1+(x2-x1)*k} cy={y} r={28} fill={color} opacity={.032+.04*Math.sin(Math.PI*k)}/><circle cx={x1+(x2-x1)*k} cy={y} r={9} fill={color} opacity={.28+.7*Math.sin(Math.PI*k)}/></g>})}
 </g>;
const Bolt:React.FC<{x:number;y:number;color?:string;progress:number}>=({x,y,color=P.mint,progress})=><g opacity={progress}>
 <circle cx={x} cy={y} r={48} fill={color} opacity=".09"/><circle cx={x} cy={y} r={34} fill="none" stroke={color} strokeWidth={3}/>
 <path d={'M '+(x-18)+' '+y+' l 13 14 l 26 -32'} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"/>
 </g>;

const LoginSession:React.FC<{t:number}>=({t})=>{
 const on=ease(t,9.7,14),formed=ease(t,15,23),settle=ease(t,22,26);
 return <Slate t={t} eyebrow="AUTHENTICATION STATE / TRUST CREATION" title="A correct password is not remembered trust">
  <g opacity={ease(t,8.5,10)} transform={'translate(0 '+(18*(1-on))+')'}>
   <Prism x={135} y={352} w={462} h={446} d={51} color={P.violet} strength={.63}>
    <Text x={185} y={428} color={P.violet} size={31} weight={850}>AUTH SERVICE</Text>
    <Text x={184} y={509} size={27} color={P.dim}>Credential decision</Text>
    <Text x={183} y={579} size={39} color={P.mint} weight={910}>VERIFIED</Text>
    <path d="M 184 626 H 548" stroke={P.violet} strokeOpacity=".4" strokeWidth={2}/>
    <Text x={184} y={707} size={26} color={P.dim}>Phone still waiting</Text>
   </Prism>
   <g opacity={on}><path d="M 634 571 H 1017" stroke={P.mint} strokeWidth={5} strokeOpacity=".28" strokeDasharray="12 15"/>
    <circle cx={634+383*ease(t,11,16)} cy={571} r={14} fill={P.mint}/></g>
   <Prism x={1041} y={321} w={680} h={520} d={60} color={P.mint} strength={formed}>
    <Text x={1092} y={405} size={34} weight={850} color={P.mint}>AUTHENTICATION STATE</Text>
    <g opacity={formed}><Crystal x={1390} y={596} r={170} t={t}/><Text x={1390} y={795} anchor="middle" color={P.white} size={29} weight={840}>REUSABLE PROOF</Text></g>
   </Prism>
   <g opacity={settle}><Text x={956} y={942} anchor="middle" size={30} color={P.white} weight={790}>One verified login becomes proof for a later request.</Text></g>
  </g>
 </Slate>;
};
const TokenAnatomy:React.FC<{t:number}>=({t})=>{
 const left=ease(t,27,32)*(1-ease(t,37,42)*.72),right=ease(t,37,43);
 return <Slate t={t} eyebrow="TWO ARCHITECTURE DESIGNS / CHOOSE ONE" title="Remember trust with a session OR a signed token">
  <g opacity={ease(t,26.5,28)}>
   <Prism x={123} y={335} w={705} h={535} d={48} color={P.cyan} strength={left}>
    <Text x={172} y={410} size={35} color={P.cyan} weight={890}>SERVER SESSION</Text>
    <g transform="translate(293 455)">
     {[2,1,0].map(i=><g key={i} transform={'translate('+(i*15)+' '+(-i*30)+')'}>
       <polygon points="0,25 31,-9 253,-9 222,25" fill="#2E748C" stroke={P.cyan} strokeWidth={2}/>
       <rect x={0} y={25} width={222} height={79} rx={9} fill="#13415C" stroke={P.cyan} strokeWidth={3}/>
       <polygon points="222,25 253,-9 253,72 222,104" fill="#0C253C" stroke={P.cyan} strokeWidth={2}/>
       <circle cx={35} cy={65} r={9} fill={P.cyan}/>
     </g>)}
    </g>
    <Text x={468} y={742} anchor="middle" size={38} weight={890}>SESSION ID</Text>
    <Text x={468} y={800} anchor="middle" size={27} color={P.dim}>Server keeps state</Text>
   </Prism>
   <circle cx={961} cy={597} r={58} fill="#102E47" stroke={P.amber} strokeWidth={3.5}/>
   <Text x={961} y={610} anchor="middle" size={36} color={P.amber} weight={900}>OR</Text>
   <Prism x={1084} y={335} w={696} h={535} d={48} color={P.violet} strength={right}>
    <Text x={1131} y={410} size={35} weight={890} color={P.violet}>SIGNED TOKEN</Text>
    <g transform="translate(1422 598)">
     <polygon points="-163,-77 -120,-126 124,-126 169,-77 169,75 124,120 -120,120 -163,75" fill="#233D66" stroke={P.violet} strokeWidth={4}/>
     <polygon points="-163,-77 -120,-126 124,-126 169,-77" fill="#7778B7" opacity=".55"/>
     <path d="M -123 -17 H 126 M -123 26 H 126" stroke={P.violet} strokeWidth={6} strokeOpacity=".66"/>
     <circle r={39} fill="#243F64" stroke={P.violet} strokeWidth={4}/>
     <path d="M -17 0 L -2 16 L 21 -17" stroke={P.mint} strokeWidth={7} fill="none" strokeLinecap="round"/>
    </g>
    <Text x={1422} y={779} anchor="middle" size={27} color={P.dim}>JWT is one possible format</Text>
   </Prism>
   <g opacity={ease(t,40,45)}><Text x={958} y={953} anchor="middle" size={30} weight={800} color={P.white}>Alternatives, not two mandatory login steps. Password stays behind.</Text></g>
  </g>
 </Slate>;
};
const TokenValidation:React.FC<{t:number}>=({t})=>{
 const alive=ease(t,47.5,51),clock=ease(t,50,56),response=ease(t,55,61);
 return <Slate t={t} eyebrow="TRUST HAS A FINITE LIFETIME" title="Authentication proof expires — then trust is checked again">
  <g opacity={ease(t,47,49)}>
   <Prism x={151} y={346} w={695} h={505} d={54} color={P.mint} strength={alive}>
    <Text x={204} y={419} size={34} weight={860} color={P.mint}>AUTHENTICATION PROOF</Text>
    <Crystal x={505} y={623} r={130} t={t}/>
   </Prism>
   <circle cx={504} cy={621} r={215} stroke={P.amber} strokeWidth={19} strokeOpacity=".17" fill="none"/>
   <circle cx={504} cy={621} r={215} stroke={P.amber} strokeWidth={15} strokeDasharray={1351} strokeDashoffset={1351*(1-clock*.77)} strokeLinecap="round" transform="rotate(-90 504 621)" fill="none"/>
   <Text x={505} y={927} size={34} anchor="middle" weight={880} color={P.amber}>TTL / EXPIRY</Text>
   <g opacity={response}><path d="M 885 596 H 1082" stroke={P.mint} strokeWidth={5} strokeOpacity=".7" strokeDasharray="14 13"/>
    <circle cx={1016} cy={596} r={13} fill={P.mint}/></g>
   <Prism x={1095} y={366} w={663} h={455} d={52} color={P.cyan} strength={response}>
    <Text x={1147} y={443} size={34} weight={890} color={P.cyan}>RESPONSE PREP</Text>
    <g opacity={response}>
     <polygon points="1215,536 1248,499 1541,499 1575,536 1575,650 1541,688 1248,688 1215,650" fill="#174D66" stroke={P.mint} strokeWidth={3}/>
     <Text x={1395} y={603} anchor="middle" size={32} weight={900} color={P.mint}>TRUSTED</Text>
     <Text x={1395} y={645} anchor="middle" size={31} weight={900} color={P.mint}>PROOF</Text>
    </g>
   </Prism>
   <g opacity={ease(t,56,60)}><Text x={965} y={968} size={28} color={P.dim} anchor="middle">Proof is created, but the phone has not received the response yet.</Text></g>
  </g>
 </Slate>;
};
const Handoff:React.FC<{t:number}>=({t})=>{
 const ready=ease(t,61.5,64),enroute=ease(t,64,69),edge=ease(t,69,71.6);
 const xx=442+1051*enroute;
 return <Slate t={t} eyebrow="LOGIN STATE" title="Ready to return">
  <g opacity={ease(t,61,62)}>
   <path d="M 413 489 H 1530" stroke={P.line} strokeWidth={7} strokeOpacity=".33" strokeDasharray="14 17"/>
   <Panel x={135} y={307} w={491} h={475} color={P.mint} active={ready}>
    <Text x={179} y={376} size={32} color={P.mint} weight={880}>AUTH SERVICE</Text>
    <g opacity={ready}>
     <Bolt x={381} y={491} progress={ready}/>
     <Text x={381} y={615} anchor="middle" size={42} weight={905} color={P.mint}>200 OK</Text>
     <Text x={381} y={671} anchor="middle" size={27} color={P.dim}>Login proof issued</Text>
    </g>
   </Panel>
   <g opacity={enroute}>
    <Flux x1={631} y={491} x2={1490} t={t} color={P.cyan}/>
    <g opacity={1-ease(t,66.7,68.1)} transform={'translate('+xx+' 438)'}><rect x={-117} y={0} width={234} height={107} rx={20} fill="#164359" stroke={P.cyan} strokeWidth={3}/>
     <Text x={0} y={45} size={23} anchor="middle" color={P.dim}>RESPONSE</Text><Text x={0} y={85} size={35} anchor="middle" weight={880} color={P.mint}>SUCCESS</Text></g>
   </g>
   <g>
    <rect x={1523} y={315} width={242} height={450} rx={45} fill="#08243B" stroke={P.cyan} strokeOpacity={.5+edge*.42} strokeWidth={4}/>
    <rect x={1541} y={367} width={206} height={338} rx={23} fill="#10334D"/>
    <path d="M 1619 344 H 1670" stroke={P.cyan} strokeWidth={6} strokeLinecap="round" strokeOpacity=".53"/>
    <g opacity={edge}><circle cx={1644} cy={514} r={53} fill="none" stroke={P.mint} strokeWidth={6}/><path d="M 1614 513 L 1637 537 L 1678 488" stroke={P.mint} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none"/></g>
    <g opacity={1-edge}><circle cx={1644} cy={514} r={49} fill="none" stroke={P.cyan} strokeOpacity=".36" strokeWidth={5}/><path d="M 1644 465 A 49 49 0 0 1 1693 514" fill="none" stroke={P.cyan} strokeWidth={6}/></g>
    <Text x={1644} y={630} anchor="middle" size={30} color={P.white} weight={850}>PHONE</Text>
    <Text x={1644} y={673} anchor="middle" size={24} color={edge>.9?P.mint:P.dim}>WAITING</Text>
   </g>
   <g opacity={ease(t,67.5,70)}><Text x={961} y={885} anchor="middle" size={33} color={P.mint} weight={850}>Proof is ready. The phone is next.</Text></g>
  </g>
 </Slate>
};
export const Shot10SessionCreationShortV7:React.FC<Props>=({audioClips=[]})=>{
 const frame=useCurrentFrame(),t=frame/FPS;
 return <div style={{position:'absolute',inset:0,width:W,height:H,background:P.navy,overflow:'hidden',fontFamily:AT_FONT}}>
  {t<8.5&&<OriginalMap t={t}/>}
  {t>=8.5&&t<26.5&&<LoginSession t={t}/>}
  {t>=26.5&&t<47&&<TokenAnatomy t={t}/>}
  {t>=47&&t<61&&<TokenValidation t={t}/>}
  {t>=61&&<Handoff t={t}/>}
  {audioClips.map((clip,i)=><Sequence key={i} from={clip.fromFrame} durationInFrames={clip.durationInFrames}><Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames??0}/></Sequence>)}
 </div>;
};
export const SHOT10_PREMIUM_V7_FRAMES=2160;
