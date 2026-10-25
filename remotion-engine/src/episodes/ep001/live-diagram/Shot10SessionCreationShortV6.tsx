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
 <defs>
  <radialGradient id="s10v4bg" cx=".46" cy=".43" r=".9"><stop offset="0" stopColor="#103653"/><stop offset=".56" stopColor="#092541"/><stop offset="1" stopColor="#061627"/></radialGradient>
  <linearGradient id="s10v4glow"><stop offset="0" stopColor="#62EDBF" stopOpacity=".03"/><stop offset=".52" stopColor="#61DEF5" stopOpacity=".13"/><stop offset="1" stopColor="#BAAFFF" stopOpacity=".03"/></linearGradient>
 </defs>
 <rect width={W} height={H} fill="url(#s10v4bg)"/>
 <g stroke={P.cyan} strokeWidth={1} strokeOpacity=".047">{Array.from({length:18},(_,i)=><path key={'v'+i} d={'M '+(55+i*110)+' 0 V 1080'}/>)}{Array.from({length:11},(_,i)=><path key={'h'+i} d={'M 0 '+(36+i*105)+' H 1920'}/>)}</g>
 <ellipse cx={986} cy={565} rx={790} ry={370} fill="url(#s10v4glow)" opacity={.8+.2*Math.sin(t*.6)}/>
 <text x={138} y={103} fill={P.mint} fontFamily={AT_FONT} fontSize={25} fontWeight={800} letterSpacing={4}>{eyebrow}</text>
 <Text x={138} y={178} size={59} weight={900}>{title}</Text>
 <path d="M 138 211 H 1782" stroke={P.line} strokeOpacity=".52" strokeWidth={2}/>
 <CinematicEnergy t={t}/>
 {children}
 <path d="M 139 1013 H 1782" stroke={P.cyan} strokeOpacity=".15" strokeWidth={3}/>
 <path d={'M 139 1013 H '+(139+1643*limit(t/72))} stroke={P.mint} strokeOpacity=".9" strokeWidth={4}/>
</svg>;


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
 const create=ease(t,10,14),mapped=ease(t,13,17),issue=ease(t,17,20),again=ease(t,21,24);
 return <Slate t={t} eyebrow="AUTHENTICATION STATE" title="Session created">
  <g opacity={ease(t,8.4,10)} transform={'translate(0 '+(23*(1-ease(t,8.4,10)))+')'}>
   <Panel x={123} y={271} w={753} h={609} color={P.mint} active={mapped}>
    <Text x={166} y={344} size={34} color={P.mint} weight={890}>SESSION RECORD</Text>
    <g opacity={create}>
     <rect x={166} y={389} width={665} height={111} rx={21} fill="#0D384D" stroke={P.mint} strokeOpacity=".57" strokeWidth={1.8}/>
     <Text x={197} y={429} size={24} color={P.dim}>SESSION ID</Text>
     <Text x={197} y={477} size={43} weight={880}>SID9K2F42</Text>
     <circle cx={791} cy={444} r={11} fill={P.mint} opacity={.5+.5*Math.sin(t*3)}/>
    </g>
    <g opacity={mapped}>
     <DataRow x={166} y={531} w={665} label="ACCOUNT" value="0042" color={P.white}/>
     <DataRow x={166} y={615} w={665} label="STATUS" value="ACTIVE" color={P.mint} active={1}/>
     <DataRow x={166} y={699} w={665} label="LIFETIME" value="30 MIN" color={P.amber}/>
     <Text x={167} y={823} size={26} color={P.dim}>The server remembers account 0042</Text>
    </g>
   </Panel>
   <g opacity={ease(t,12,19)}>
    <circle cx={927} cy={566} r={40+6*Math.sin(t*2.5)} fill="none" stroke={P.mint} strokeWidth={3} strokeOpacity=".22"/>
    <circle cx={927} cy={566} r={18} fill={P.mint} opacity={.08+.07*Math.sin(t*3.8)}/>
   </g>
   <Flux x1={879} y={567} x2={978} t={t} color={P.mint} opacity={mapped}/>
   <Panel x={1004} y={271} w={789} h={609} color={P.cyan} active={again}>
    <Text x={1054} y={344} size={34} color={P.cyan} weight={885}>COOKIE DELIVERY</Text>
    <g opacity={issue}>
     <Text x={1054} y={415} size={23} color={P.dim}>RESPONSE HEADER</Text>
     <rect x={1054} y={446} width={687} height={92} rx={19} fill="#09263C" stroke={P.cyan} strokeOpacity=".6" strokeWidth={1.6}/>
     <Text x={1080} y={505} size={34} weight={835}>Set-Cookie: sid=SID9K2F42</Text>
     <g><rect x={1054} y={557} width={174} height={47} rx={12} fill="#123F50" stroke={P.cyan} strokeOpacity=".57"/><rect x={1241} y={557} width={150} height={47} rx={12} fill="#123F50" stroke={P.cyan} strokeOpacity=".57"/><rect x={1405} y={557} width={289} height={47} rx={12} fill="#123F50" stroke={P.cyan} strokeOpacity=".57"/>
      <Text x={1141} y={588} size={23} anchor="middle" color={P.cyan}>HttpOnly</Text><Text x={1316} y={588} size={23} anchor="middle" color={P.cyan}>Secure</Text><Text x={1549} y={588} size={23} anchor="middle" color={P.cyan}>SameSite=Lax</Text></g>
    </g>
    <g opacity={again}>
     <Text x={1054} y={683} size={23} color={P.dim}>NEXT REQUEST</Text>
     <Text x={1054} y={727} size={31} weight={855} color={P.white}>GET /account</Text>
     <rect x={1054} y={752} width={687} height={77} rx={17} fill="#123E4E" stroke={P.mint} strokeOpacity=".68" strokeWidth={2}/>
     <Text x={1080} y={802} size={32} weight={835} color={P.mint}>Cookie: sid=SID9K2F42</Text>
    </g>
   </Panel>
  </g>
 </Slate>
};
const TokenAnatomy:React.FC<{t:number}>=({t})=>{
 const header=ease(t,27,30),claims=ease(t,31,35),sig=ease(t,36,40),ready=ease(t,41,46);
 return <Slate t={t} eyebrow="SIGNED TOKEN" title="Token anatomy">
  <g opacity={ease(t,26.5,28)} transform={'translate('+(10*Math.sin((t-26.5)*.28))+' 0)'}>
   <Text x={157} y={285} size={28} color={P.dim}>One signed proof. Three meaningful parts.</Text>
   <g>
    <g opacity={ease(t,28,32)}><path d="M 320 304 H 1490" stroke={P.violet} strokeWidth={2} strokeOpacity=".23"/><circle cx={320+1170*ease(t,29,42)} cy={304} r={11} fill={P.violet} opacity=".75"/></g>
    <Panel x={132} y={332} w={509} h={496} color={P.cyan} active={header}>
     <Text x={174} y={401} size={35} color={P.cyan} weight={885}>HEADER</Text>
     <g opacity={header}><Text x={175} y={493} size={27} color={P.dim}>FORMAT</Text><Text x={579} y={493} size={32} anchor="end" weight={880}>JWT</Text>
     <DataRow x={174} y={541} w={421} label="ALGORITHM" value="RS256" color={P.cyan}/><Text x={175} y={737} size={25} color={P.dim}>How to verify the signature</Text></g>
    </Panel>
    <Panel x={700} y={332} w={524} h={496} color={P.violet} active={claims}>
     <Text x={739} y={401} size={35} color={P.violet} weight={885}>PAYLOAD</Text>
     <g opacity={claims}><DataRow x={740} y={441} w={443} label="SUBJECT" value="0042" color={P.white}/>
     <DataRow x={740} y={524} w={443} label="AUDIENCE" value="API" color={P.white}/>
     <DataRow x={740} y={607} w={443} label="EXPIRES" value="15 MIN" color={P.amber}/>
     <Text x={739} y={764} size={25} color={P.dim}>Readable claims, not encrypted</Text></g>
    </Panel>
    <Panel x={1281} y={332} w={509} h={496} color={P.mint} active={sig}>
     <Text x={1322} y={401} size={35} color={P.mint} weight={885}>SIGNATURE</Text>
     <g opacity={sig}>
      <rect x={1322} y={450} width={418} height={93} rx={17} fill="#133D4B" stroke={P.mint} strokeOpacity=".56"/>
      <Text x={1531} y={507} anchor="middle" size={32} color={P.mint} weight={840}>Digital signature</Text>
      <Text x={1322} y={630} size={26} color={P.dim}>Protects against alteration</Text>
      <Bolt x={1532} y={710} progress={ready}/>
     </g>
    </Panel>
    <g opacity={ease(t,32,42)}><path d="M 612 581 H 702 M 1219 581 H 1285" stroke={P.violet} strokeOpacity=".53" strokeWidth={4} strokeDasharray="7 8"/></g>
    <g opacity={header}><circle cx={669} cy={580} r={8} fill={P.white} opacity=".7"/></g>
    <g opacity={claims}><circle cx={1253} cy={580} r={8} fill={P.white} opacity=".7"/></g>
   </g>
   <g opacity={ready}><rect x={246} y={885} width={1428} height={72} rx={17} fill="#0B3049" stroke={P.violet} strokeOpacity=".46"/>
    <Text x={964} y={932} size={31} weight={855} anchor="middle" color={P.white}>HEADER7A1C      PAYLOAD0042      SIGNATURE7D2F</Text>
   </g>
  </g>
 </Slate>
};
const TokenValidation:React.FC<{t:number}>=({t})=>{
 const request=ease(t,47.5,49.5),signature=ease(t,51,54),expiry=ease(t,54,57),verified=ease(t,57,60);
 return <Slate t={t} eyebrow="NEXT REQUEST" title="Token verification">
  <g opacity={ease(t,47,49)} transform={"translate("+(-13*ease(t,56,61))+" 0)"}>
   <Panel x={124} y={305} w={562} h={562} color={P.violet} active={request}>
    <Text x={167} y={375} size={34} color={P.violet} weight={880}>CLIENT REQUEST</Text>
    <Text x={167} y={453} size={40} weight={850}>GET /api/me</Text>
    <rect x={166} y={492} width={473} height={112} rx={17} fill="#142A48" stroke={P.violet} strokeOpacity=".54" strokeWidth={2}/>
    <Text x={189} y={538} size={25} color={P.dim}>Authorization</Text><Text x={189} y={581} size={33} weight={860} color={P.violet}>Bearer JWT00427F3A</Text>
    <g opacity={request}><Text x={167} y={744} size={27} color={P.dim}>Proof accompanies each request</Text></g>
   </Panel>
   <g opacity={ease(t,50,59)}><circle cx={770} cy={584} r={27+6*Math.sin(t*2.4)} fill="none" stroke={P.violet} strokeOpacity=".34" strokeWidth={2}/></g>
   <Flux x1={696} y={584} x2={840} t={t} color={P.violet} opacity={request}/>
   <Panel x={866} y={305} w={930} h={562} color={P.mint} active={verified}>
    <Text x={923} y={375} size={36} weight={885}>AUTH VERIFIER</Text>
    <g opacity={signature}>
     <IconBox x={922} y={429} label="Signature" color={P.violet} done={signature>.95}/>
     <Text x={1280} y={483} size={26} color={P.dim}>Trusted signing key</Text>
     <Bolt x={1718} y={467} progress={signature}/>
    </g>
    <g opacity={expiry}>
     <IconBox x={922} y={535} label="Expiry" color={P.amber} done={expiry>.95}/>
     <Text x={1280} y={588} size={26} color={P.dim}>Not expired</Text>
     <Bolt x={1718} y={573} progress={expiry}/>
    </g>
    <g opacity={verified}>
     <rect x={920} y={674} width={825} height={112} rx={23} fill="#164B47" stroke={P.mint} strokeWidth={3}/>
     <Text x={1332} y={746} anchor="middle" size={46} weight={910} color={P.mint}>REQUEST VERIFIED</Text>
    </g>
   </Panel>
  </g>
 </Slate>
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
export const Shot10SessionCreationShortV6:React.FC<Props>=({audioClips=[]})=>{
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
export const SHOT10_PREMIUM_V6_FRAMES=2160;
