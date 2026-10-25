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

const TraceDots:React.FC<{x1:number;y1:number;x2:number;y2:number;t:number;color?:string;enabled?:number}>=({x1,y1,x2,y2,t,color=P.mint,enabled=1})=><g opacity={enabled}>
 <path d={'M '+x1+' '+y1+' H '+x2+' V '+y2} fill="none" stroke={color} strokeOpacity=".38" strokeWidth={3.5} strokeDasharray="13 9"/>
 {[0,1,2].map(i=>{const f=((t*.55+i/3)%1+1)%1;return <g key={i}><circle cx={x1+(x2-x1)*f} cy={y1+(y2-y1)*f} r={7+4*f} fill={color} opacity={.35+.55*Math.sin(Math.PI*f)}/><circle cx={x1+(x2-x1)*f} cy={y1+(y2-y1)*f} r={22} fill={color} opacity=".055"/></g>})}
</g>;
const Entry:React.FC<{t:number}>=({t})=>{
 const intro=ease(t,8.5,12);
 const packet=ease(t,13,17),resolved=ease(t,17,23);
 return <Back t={t} headline="AUTHENTICATION STATE / REMEMBERING A LOGIN">
 <g opacity={intro} transform={'translate(0 '+((1-intro)*35)+')'}>
  <Card x={141} y={289} w={460} h={557} color={P.mint} glow>
   <Text x={186} y={364} size={33} weight={840} color={P.mint}>AUTH SERVICE</Text>
   <circle cx={368} cy={501} r={75} fill="#144D4B" stroke={P.mint} strokeWidth={2.6}/>
   <path d="M 326 507 L 357 538 L 411 462" fill="none" stroke={P.mint} strokeWidth={8} strokeLinecap="round"/>
   <Text x={371} y={638} anchor="middle" size={36} color={P.white} weight={850}>IDENTITY VERIFIED</Text>
   <Text x={371} y={690} anchor="middle" size={30} color={P.dim}>ACCOUNT #0042</Text>
  </Card>
  <g opacity={ease(t,11,14)}><Flow x1={606} y1={545} x2={721} y2={545} t={t} color={P.mint}/></g>
  <g opacity={ease(t,11,14)}>
   <Card x={743} y={289} w={1036} h={557} color={P.cyan} glow={t>18}>
    <Text x={800} y={364} size={36} weight={865}>CREATE LOGIN STATE</Text>
    <rect x={803} y={412} width={917} height={111} rx={21} fill="#092C45" stroke={P.cyan} strokeOpacity=".4" strokeWidth={2}/>
    <Text x={845} y={462} size={29} color={P.dim}>VERIFIED ACCOUNT</Text>
    <Text x={1667} y={462} anchor="end" size={35} color={P.mint} weight={890}>0042</Text>
    <Text x={845} y={503} size={28} color={P.dim}>alex@example.com</Text>
    <g opacity={packet}>
     <rect x={802} y={567} width={917} height={100} rx={22} fill="#123F55" stroke={P.mint} strokeOpacity=".67" strokeWidth={2}/>
     <Text x={849} y={631} size={39} color={P.mint} weight={865}>CREATE REUSABLE LOGIN PROOF</Text>
    </g>
    <g opacity={resolved}>
     <circle cx={851} cy={738} r={22} stroke={P.mint} fill="#184B4B" strokeWidth={2}/>
     <path d="M 840 738 l 10 11 l 14 -19" stroke={P.mint} strokeWidth={4} fill="none"/>
     <Text x={894} y={748} size={31} color={P.white}>PASSWORD DOES NOT TRAVEL AGAIN</Text>
    </g>
   </Card>
  </g>
 </g>
 </Back>;
};
const SessionExample:React.FC<{t:number}>=({t})=>{
 const g=ease(t,23,26),issued=ease(t,28,32),returned=ease(t,33,38);
 return <Back t={t} headline="EXAMPLE A / A SERVER-HELD SESSION">
 <g opacity={g} transform={'translate('+((1-g)*39)+' 0)'}>
  <Card x={132} y={287} w={616} h={562} color={P.cyan} glow={t<32}>
   <Text x={182} y={367} size={33} color={P.cyan}>SERVER SESSION STORE</Text>
   <rect x={176} y={417} width={524} height={122} rx={18} fill="#102D47" stroke={P.cyan} strokeOpacity=".5"/>
   <Text x={205} y={463} size={29} color={P.dim}>SESSION KEY</Text>
   <Text x={205} y={506} size={42} weight={850}>s_9K2F...</Text>
   <g opacity={issued}>
    <path d="M 204 564 H 669" stroke={P.cyan} strokeOpacity=".33" strokeWidth={2}/>
    <Text x={205} y={619} size={30} color={P.dim}>ACCOUNT</Text>
    <Text x={635} y={619} anchor="end" size={36} color={P.mint} weight={880}>#0042</Text>
    <Text x={205} y={703} size={30} color={P.dim}>SERVER STORES THE LOGIN</Text>
   </g>
  </Card>
  <g opacity={issued}><Flow x1={753} y1={528} x2={862} y2={528} t={t} color={P.cyan}/></g>
  <Card x={884} y={287} w={902} h={562} color={P.mint} glow={t>=32}>
   <Text x={939} y={370} size={34} color={P.mint}>HTTP RESPONSE / EXAMPLE</Text>
   <g opacity={issued}>
    <rect x={933} y={409} width={802} height={160} rx={18} fill="#0A2A42" stroke={P.mint} strokeOpacity=".54"/>
    <Text x={957} y={464} size={35} weight={850} color={P.white}>Set-Cookie: sid=s_9K2F...</Text>
    <Text x={957} y={524} size={30} color={P.cyan}>HttpOnly · Secure · SameSite=Lax</Text>
   </g>
   <g opacity={returned}>
    <Text x={939} y={641} size={31} color={P.dim}>NEXT REQUEST / GET /account</Text>
    <rect x={933} y={677} width={802} height={91} rx={19} fill="#143E4D" stroke={P.cyan} strokeOpacity=".72" strokeWidth={2}/>
    <Text x={961} y={735} size={35} color={P.mint} weight={850}>Cookie: sid=s_9K2F...</Text>
   </g>
  </Card>
  <g opacity={ease(t,37,40)}><Pill x={706} y={896} w={512} color={P.cyan} label="SESSION ID LINKS TO SERVER STATE" size={27}/></g>
 </g>
 </Back>;
};
const TokenExample:React.FC<{t:number}>=({t})=>{
 const g=ease(t,41,44),claims=ease(t,46,49),signed=ease(t,50,54);
 return <Back t={t} headline="EXAMPLE B / A SIGNED ACCESS TOKEN">
 <g opacity={g} transform={'translate(0 '+((1-g)*31)+')'}>
  <Card x={130} y={288} w={726} h={562} color={P.violet} glow={t<52}>
   <Text x={178} y={363} size={33} color={P.violet} weight={860}>TOKEN / ILLUSTRATIVE</Text>
   <g opacity={claims}>
    <rect x={176} y={417} width={630} height={124} rx={18} fill="#1B3052" stroke={P.violet} strokeOpacity=".55"/>
    <Text x={204} y={467} size={31} color={P.dim}>SUBJECT</Text>
    <Text x={770} y={467} size={38} weight={870} color={P.white} anchor="end">0042</Text>
    <Text x={204} y={515} size={31} color={P.dim}>EXPIRY</Text>
    <Text x={770} y={515} size={36} weight={860} color={P.amber} anchor="end">15 MIN</Text>
   </g>
   <g opacity={signed}>
    <rect x={176} y={585} width={630} height={125} rx={18} fill="#102B49" stroke={P.violet} strokeOpacity=".58"/>
    <Text x={207} y={637} size={31} color={P.dim}>SIGNATURE</Text>
    <Text x={207} y={681} size={37} weight={850} color={P.violet}>VERIFY BEFORE TRUSTING</Text>
   </g>
  </Card>
  <g opacity={claims}><Flow x1={857} y1={538} x2={946} y2={538} t={t} color={P.violet}/></g>
  <Card x={966} y={288} w={818} h={562} color={P.cyan} glow={t>=53}>
   <Text x={1018} y={371} size={33} color={P.cyan}>GET /api/me / REQUEST HEADER</Text>
   <g opacity={claims}>
    <rect x={1017} y={414} width={718} height={136} rx={18} fill="#0A2944" stroke={P.cyan} strokeOpacity=".5"/>
    <Text x={1044} y={468} size={35} weight={830}>Authorization:</Text>
    <Text x={1044} y={520} size={36} weight={850} color={P.violet}>Bearer eyJ...</Text>
   </g>
   <g opacity={signed}>
    <rect x={1017} y={612} width={718} height={115} rx={19} fill="#15414A" stroke={P.mint} strokeOpacity=".7" strokeWidth={2}/>
    <Text x={1050} y={661} size={34} color={P.mint} weight={870}>CHECK SIGNATURE</Text>
    <Text x={1050} y={701} size={30} color={P.white}>+ CHECK EXPIRY</Text>
   </g>
  </Card>
 </g>
 </Back>;
};
const ResponseExit:React.FC<{t:number}>=({t})=>{
 const g=ease(t,58,61),ready=ease(t,62,66),send=ease(t,67,71);
 return <Back t={t} headline="LOGIN STATE / READY TO RETURN">
 <g opacity={g}>
  <Card x={148} y={293} w={533} h={566} color={P.mint} glow>
   <Text x={202} y={378} size={36} weight={870}>TRUST HAS A LIMIT</Text>
   <Text x={202} y={460} size={33} color={P.dim}>EXPIRES AT SOME POINT</Text>
   <rect x={201} y={539} width={425} height={27} rx={13} fill="#2E5164"/>
   <rect x={201} y={539} width={425*(1-.36*ease(t,61,72))} height={27} rx={13} fill={P.mint}/>
   <g opacity={ready}><Text x={202} y={665} size={34} color={P.mint} weight={880}>NOT FOREVER</Text><Text x={202} y={720} size={29} color={P.dim}>Future requests carry proof.</Text></g>
  </Card>
  <g opacity={ready}><Flow x1={687} y1={559} x2={779} y2={559} t={t} color={P.mint}/></g>
  <Card x={804} y={293} w={504} h={566} color={P.cyan} glow={t>65}>
   <Text x={858} y={381} size={35} weight={860}>RESPONSE PREP</Text>
   <g opacity={ready}>
    <Pill x={854} y={445} w={397} color={P.mint} label="200 OK / EXAMPLE" size={27}/>
    <Pill x={854} y={537} w={397} color={P.cyan} label="LOGIN PROOF READY" size={26}/>
    <Text x={1062} y={708} size={34} anchor="middle" color={P.mint} weight={870}>SUCCESS</Text>
   </g>
  </Card>
  <g opacity={send}><Flow x1={1314} y1={560} x2={1404} y2={560} t={t} color={P.cyan}/></g>
  <Card x={1428} y={293} w={340} h={566} color={P.cyan} glow={false}>
   <Text x={1598} y={377} size={36} anchor="middle" weight={865}>PHONE</Text>
   <rect x={1502} y={438} width={193} height={281} rx={29} fill="#08253D" stroke={P.cyan} strokeOpacity=".73" strokeWidth={3}/>
   <rect x={1520} y={473} width={158} height={219} rx={15} fill="#102E43"/>
   <circle cx={1600} cy={572} r={47} fill="none" stroke={P.cyan} strokeWidth={7} strokeOpacity=".3"/>
   <path d="M 1600 525 A 47 47 0 0 1 1647 572" stroke={P.cyan} strokeWidth={7} fill="none" strokeLinecap="round"/>
   <Text x={1600} y={794} size={30} anchor="middle" color={P.dim}>WAITING</Text>
  </Card>
 </g>
 <g opacity={ease(t,65,69)}><Text x={960} y={950} anchor="middle" size={33} weight={870} color={P.mint}>THE NEXT STEP IS THE PHONE'S RESPONSE</Text></g>
 </Back>;
};
export const Shot10SessionCreationShortV3:React.FC<Props>=({audioClips=[]})=>{
 const t=useCurrentFrame()/FPS;
 return <div style={{position:'absolute',inset:0,width:W,height:H,background:P.navy,overflow:'hidden',fontFamily:AT_FONT}}>
  {t<12&&<div style={{position:'absolute',inset:0,opacity:1-ease(t,8,12)}}><OriginalMap t={t}/></div>}
  {t>=8&&t<26&&<div style={{position:'absolute',inset:0,opacity:ease(t,8,12)*(1-ease(t,23,26)),transform:'scale('+(1+.018*ease(t,12,23))+')',transformOrigin:'center center'}}><Entry t={t}/></div>}
  {t>=23&&t<44&&<div style={{position:'absolute',inset:0,opacity:ease(t,23,26)*(1-ease(t,41,44)),transform:'scale('+(1+.021*ease(t,26,40))+')',transformOrigin:'center center'}}><SessionExample t={t}/></div>}
  {t>=41&&t<61&&<div style={{position:'absolute',inset:0,opacity:ease(t,41,44)*(1-ease(t,58,61)),transform:'scale('+(1+.021*ease(t,44,57))+')',transformOrigin:'center center'}}><TokenExample t={t}/></div>}
  {t>=58&&<div style={{position:'absolute',inset:0,opacity:ease(t,58,61),transform:'scale('+(1+.014*ease(t,61,72))+')',transformOrigin:'center center'}}><ResponseExit t={t}/></div>}
  {audioClips.map((clip,i)=><Sequence key={i} from={clip.fromFrame} durationInFrames={clip.durationInFrames}><Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames??0}/></Sequence>)}
 </div>;
};
export const SHOT10_PREMIUM_V3_FRAMES=2160;
