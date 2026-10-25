import React from 'react';
import {Html5Audio, Sequence, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {AuthServiceTier2Shot08BridgeV8} from './AuthServiceTier2Shot08BridgeV8';

const FPS = 30;
const W = 1920;
const H = 1080;
const C = {bg:'#07192F',surface:'#0D304B',surface2:'#103A56',ink:'#F2FDFF',muted:'#B2D4E7',cyan:'#58E6FA',mint:'#60EFC7',violet:'#BEB4FF',amber:'#FFC79D',line:'#467D9B'};
type VoiceClip = {src:string;fromFrame:number;durationInFrames:number;trimBeforeFrames?:number};
type Props = {durationInFrames:number;audioClips?:VoiceClip[]};
const clamp=(x:number)=>Math.min(1,Math.max(0,x));
const fade=(t:number,a:number,b:number)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x)};
const exit=(t:number,a:number,b:number)=>1-fade(t,a,b);
const wave=(t:number,speed=2)=>.5+.5*Math.sin(t*speed);
const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;weight?:number;color?:string;anchor?:'start'|'middle'|'end';opacity?:number}> =
({x,y,children,size=27,weight=690,color=C.ink,anchor='start',opacity=1})=><text x={x} y={y} textAnchor={anchor} fontFamily={AT_FONT} fontSize={size} fontWeight={weight} fill={color} opacity={opacity}>{children}</text>;
const Capsule:React.FC<{x:number;y:number;w:number;label:string;color?:string;fill?:string}> =
({x,y,w,label,color=C.cyan,fill='#16435C'})=><g>
 <rect x={x} y={y} width={w} height={49} rx={13} fill={fill} stroke={color} strokeWidth={1.5} strokeOpacity={.75}/>
 <T x={x+w/2} y={y+32} size={21} weight={820} color={color} anchor="middle">{label}</T>
</g>;
const Card:React.FC<{x:number;y:number;w:number;h:number;accent?:string;time?:number;active?:boolean;children:React.ReactNode}> =
({x,y,w,h,accent=C.cyan,time=0,active=false,children})=><g>
 <rect x={x-5} y={y-5} width={w+10} height={h+10} rx={26} fill={accent} opacity={active?.085:.025}/>
 <rect x={x} y={y} width={w} height={h} rx={22} fill={active?'#10415A':'#0D2E49'} stroke={accent} strokeWidth={active?2.5:1.5} strokeOpacity={active?.86:.55}/>
 <path d={'M '+(x+24)+' '+(y+18)+' H '+(x+w-24)} stroke={accent} opacity=".22" strokeWidth={2}/>
 <rect x={x+2} y={y+16} width={4} height={Math.max(30,h-32)} rx={2} fill={accent} opacity={active?.82:.34}/>
 <path d={'M '+(x+25+((time*65)%Math.max(60,w-100)))+' '+(y+3)+' h 47'} stroke={accent} strokeWidth={2.5} strokeLinecap="round" opacity={.42+.27*wave(time)}/>
 {children}
</g>;
const InfoRow:React.FC<{x:number;y:number;w:number;name:string;value:string;valueColor?:string;time?:number}> =
({x,y,w,name,value,valueColor=C.ink,time=0})=><g>
  <path d={'M '+x+' '+(y+20)+' H '+(x+w)} stroke="#5887A0" strokeWidth="1" opacity=".23"/>
  <T x={x} y={y+55} size={21} color={C.muted} weight={690}>{name}</T>
  <T x={x+w} y={y+55} size={24} color={valueColor} anchor="end" weight={820}>{value}</T>
  <circle cx={x+w-5} cy={y+20} r={3} fill={valueColor} opacity={.4+.4*wave(time,1.6)}/>
</g>;
const DotTrail:React.FC<{x1:number;y1:number;x2:number;y2:number;time:number;color?:string;speed?:number;count?:number}> =
({x1,y1,x2,y2,time,color=C.cyan,speed=.25,count=4})=><g>
 <path d={'M '+x1+' '+y1+' L '+x2+' '+y2} stroke={color} strokeWidth={3} opacity=".31" strokeDasharray="11 11"/>
 {Array.from({length:count},(_,i)=>{const k=((time*speed+i/count)%1+1)%1;return <g key={i}>
  <circle cx={x1+(x2-x1)*k} cy={y1+(y2-y1)*k} r={10} fill={color} opacity={.33+.55*Math.sin(Math.PI*k)}/>
  <circle cx={x1+(x2-x1)*k} cy={y1+(y2-y1)*k} r={22} fill={color} opacity=".06"/>
 </g>})}
</g>;
const Tick:React.FC<{x:number;y:number;color?:string;time:number;size?:number}> = ({x,y,color=C.mint,time,size=26})=><g>
 <circle cx={x} cy={y} r={size+13+wave(time,2.9)*7} fill={color} opacity=".06"/>
 <circle cx={x} cy={y} r={size} fill="#14495A" stroke={color} strokeWidth={2.4}/>
 <path d={'M '+(x-size*.47)+' '+y+' l '+(size*.31)+' '+(size*.29)+' l '+(size*.60)+' '+(-size*.67)} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
</g>;

const Header:React.FC<{time:number;phase:string;sub:string;children:React.ReactNode}> =
({time,phase,sub,children})=><svg width={W} height={H} viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
 <defs>
  <radialGradient id="s09v2bg" cx=".46" cy=".28" r=".91"><stop offset="0" stopColor="#123E5A"/><stop offset=".67" stopColor="#0B2946"/><stop offset="1" stopColor="#061629"/></radialGradient>
  <linearGradient id="s09v2glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#224C6A" stopOpacity=".45"/><stop offset="1" stopColor="#081F36" stopOpacity=".02"/></linearGradient>
 </defs>
 <rect width={1920} height={1080} fill="url(#s09v2bg)"/>
 <g opacity=".085" stroke={C.cyan} strokeWidth={1}>
  {Array.from({length:15},(_,i)=><path key={'v'+i} d={'M '+(85+i*124)+' 0 V 1080'}/>)}
  {Array.from({length:10},(_,i)=><path key={'h'+i} d={'M 0 '+(70+i*118)+' H 1920'}/>)}
 </g>
 <circle cx={1580+35*Math.sin(time*.13)} cy={185} r={210} fill={C.cyan} opacity=".017"/>
 <circle cx={400+46*Math.sin(time*.1)} cy={820} r={250} fill={C.violet} opacity=".019"/>
 <rect x={92} y={62} width={1736} height={127} rx={23} fill="#0A2B47" stroke="#477F9C" strokeWidth={1.6}/>
 <rect x={93} y={64} width={1734} height={73} rx={22} fill="url(#s09v2glass)"/>
 <circle cx={132} cy={126} r={11} fill={C.mint}/>
 <circle cx={132} cy={126} r={20+5*wave(time,3)} fill={C.mint} opacity=".07"/>
 <T x={164} y={122} size={35} weight={870}>AUTH SERVICE</T>
 <T x={164} y={159} size={19} weight={740} color={C.muted}>{sub}</T>
 <Capsule x={1416} y={102} w={349} label={phase} color={C.cyan}/>
 {children}
 <path d="M 200 1015 H 1720" stroke={C.cyan} strokeWidth={2} opacity=".23"/>
 <path d={'M 200 1015 H '+(200+1520*clamp(time/136.333))} stroke={C.mint} strokeWidth={4} opacity=".72"/>
 {Array.from({length:4},(_,i)=><circle key={i} cx={[200,610,1032,1460][i]} cy={1015} r={6} fill={time>[0,36,67,101][i]?C.mint:'#42738F'}/>)}
 <T x={202} y={1050} size={17} color={C.muted}>EP001  /  CREDENTIAL VERIFICATION</T>
 <T x={1718} y={1050} size={18} color={C.muted} anchor="end">SHOT 09  /  DIRECTOR PREVIEW V3</T>
</svg>;

const PREVIOUS_APPROVED_MAP_ANCHORS:Record<string,number>={
 GET_FACTS:120.4,INBOX_OPEN:31.8,INSTANCE_B:4.433333333333334,
 EMAIL_CLAIM:112.13333333333334,FORMAT_PREP:57.5,LOOKUP_BORN:125.36666666666666,
 SECRET_ROLE:46.6,AUTH_ARRIVAL:.8666666666666667,FIND_ACCOUNT:117.23333333333333,
 INPUT_FIELDS:37.6,LIMITS_CHECK:82.93333333333334,CHECKS_PASSED:98.4,
 FORMAT_EXAMPLE:68.13333333333334,LOOKUP_ACCOUNT:155.83333333333334,
 LOOKUP_TRAVELS:142.96666666666667,ORIGINAL_STAYS:132.43333333333334,
 PROOF_QUESTION:25.966666666666665,REQUIRED_CHECK:76.63333333333334,
 AUTH_DEFINITION:20.833333333333332,IDENTIFIER_ROLE:43.5,NOT_YET_CORRECT:50.566666666666665,
 STRUCTURE_CHECK:79.9,VALIDATION_NAME:60.766666666666666,VALID_NOT_LOGIN:87.03333333333333,
 NOT_SECOND_LOGIN:146.66666666666666,PASSWORD_UNKNOWN:104.63333333333334,
 SERVICE_QUESTION:150.03333333333333,ROUTING_NOT_TRUST:10.666666666666666,
 EMPTY_FIELD_EXAMPLE:65.56666666666666,INFORMATION_FOR_VERIFY:158.66666666666666
};
const PREVIOUS_APPROVED_MAP_CLIP_STARTS=[24,952,1821,2940,3915];
const Overview:React.FC<{time:number}>=({time})=>{
 const target=fade(time,1.8,8.9);
 const cameraZoom=1+.76*target;
 const panX=-900*target;
 const panY=-120*target;
 const attention=fade(time,1.5,3.9);
 const database=fade(time,3.4,5.8);
 const arrow=fade(time,4.8,7.3);
 return <div style={{position:'absolute',inset:0,width:W,height:H,overflow:'hidden',background:C.bg,isolation:'isolate'}}>
   <div style={{position:'absolute',inset:0,width:W,height:H,
      transform:'translate('+panX+'px,'+panY+'px) scale('+cameraZoom+')',
      transformOrigin:'50% 50%',willChange:'transform'}}>
     <Sequence from={-4881}>
       <AuthServiceTier2Shot08BridgeV8 durationInFrames={4882}
         anchors={PREVIOUS_APPROVED_MAP_ANCHORS}
         clipStarts={PREVIOUS_APPROVED_MAP_CLIP_STARTS}/>
     </Sequence>
   </div>
   <svg width={W} height={H} viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0,pointerEvents:'none'}}>
     <defs>
       <linearGradient id="reuse09v3-head" x1="0" y1="0" x2="1" y2="0">
         <stop offset="0" stopColor="#0B2A45" stopOpacity=".95"/>
         <stop offset="1" stopColor="#0B2A45" stopOpacity=".84"/>
       </linearGradient>
     </defs>
     <g opacity={attention}>
      <rect x={110} y={72} width={1042} height={99} rx={19} fill="url(#reuse09v3-head)"
        stroke={C.cyan} strokeWidth={1.8}/>
      <circle cx={145} cy={122} r={8} fill={C.mint}/>
      <T x={170} y={119} size={30} weight={880}>LOGIN ARCHITECTURE</T>
      <T x={170} y={154} size={21} color={C.muted}>ACCOUNT FACTS HAVE RETURNED  /  AUTH SERVICE CONTINUES</T>
     </g>
     <g opacity={database*(1-target*.35)}>
       <rect x={1410} y={224} width={395} height={66} rx={14} fill="#103C57"
         stroke={C.violet} strokeOpacity=".74" strokeWidth={1.5}/>
       <T x={1608} y={265} size={23} weight={810} anchor="middle" color={C.violet}>
         DATABASE LOOKUP COMPLETE
       </T>
     </g>
     <g opacity={arrow}>
       <rect x={567} y={853} width={786} height={87} rx={20} fill="#123F58"
         stroke={C.mint} strokeOpacity=".83" strokeWidth={1.8}/>
       <T x={960} y={909} size={30} anchor="middle" color={C.mint} weight={875}>
         NEXT  /  AUTH SERVICE VERIFIES THE CREDENTIALS
       </T>
     </g>
   </svg>
 </div>;
};

const Verify:React.FC<{time:number}>=({time})=>{
 const f=fade(time,8.4,11),step=fade(time,17,19),third=fade(time,25.5,28);
 return <Header time={time} phase="01  /  VERIFICATION" sub="TWO SOURCES OF DATA  /  ONE SECURE CHECK">
 <g opacity={f}>
  <Card x={112} y={244} w={501} h={461} accent={C.cyan} time={time}>
   <Capsule x={144} y={278} w={276} label="SUBMITTED INPUT" color={C.cyan}/>
   <T x={151} y={378} size={25} color={C.muted}>LOGIN REQUEST</T>
   <T x={151} y={425} size={30} weight={830}>alex@example.com</T>
   <path d="M 145 462 H 578" stroke={C.cyan} strokeWidth={1} opacity=".29"/>
   <T x={151} y={509} size={22} color={C.muted}>SUBMITTED PASSWORD</T>
   <rect x={151} y={531} width={418} height={87} rx={16} fill="#15465F" stroke={C.cyan} strokeOpacity=".55"/>
   <T x={360} y={591} size={42} weight={900} anchor="middle">••••••••••••</T>
   <T x={151} y={669} size={21} color="#B5D8E8">SECRET INPUT  ·  MASKED</T>
  </Card>
  <Card x={1307} y={244} w={501} h={461} accent={C.violet} time={time+1}>
   <Capsule x={1340} y={278} w={296} label="STORED ACCOUNT FACTS" color={C.violet}/>
   <InfoRow x={1342} y={335} w={419} name="ACCOUNT ID" value="0042" valueColor={C.ink} time={time}/>
   <InfoRow x={1342} y={419} w={419} name="ACCOUNT STATUS" value="ACTIVE" valueColor={C.mint} time={time}/>
   <InfoRow x={1342} y={503} w={419} name="VERIFIER" value="PROTECTED HASH" valueColor={C.violet} time={time}/>
   <InfoRow x={1342} y={587} w={419} name="SALT" value="STORED VALUE" valueColor={C.violet} time={time}/>
  </Card>
  <DotTrail x1={614} y1={482} x2={689} y2={482} time={time} color={C.cyan} speed={.38}/>
  <DotTrail x1={1307} y1={482} x2={1231} y2={482} time={time} color={C.violet} speed={.38}/>
  <Card x={688} y={295} w={543} h={410} accent={third>.5?C.mint:C.cyan} time={time} active>
   <T x={960} y={361} anchor="middle" size={24} weight={770} color={C.muted}>AUTH SERVICE  /  SECURITY ROUTINE</T>
   <T x={960} y={425} anchor="middle" size={35} weight={900}>PASSWORD</T>
   <T x={960} y={467} anchor="middle" size={35} weight={900}>VERIFICATION</T>
   <g opacity={.55+.45*wave(time,3.9)}>
    {Array.from({length:11},(_,i)=><rect key={i} x={793+i*30} y={507} width={18} height={25+27*wave(time+i*.3,3.2)} rx={6} fill={i<7?C.cyan:C.violet} opacity={.60+.40*wave(time+i*.4,2.9)}/>)}
   </g>
   <T x={960} y={624} anchor="middle" color={third>.7?C.mint:C.muted} size={23}>MATCH AGAINST PROTECTED VERIFIER</T>
   <g opacity={third}><Tick x={1173} y={664} size={22} time={time}/></g>
  </Card>
  <g opacity={step}>
   <Card x={204} y={760} w={1512} h={160} accent={C.mint} time={time}>
     <T x={249} y={811} size={23} color={C.muted}>HOW THE CHECK WORKS</T>
     <Capsule x={245} y={840} w={430} label="USE STORED PARAMETERS" color={C.cyan}/>
     <DotTrail x1={692} y1={864} x2={752} y2={864} time={time} count={2} speed={.5}/>
     <Capsule x={769} y={840} w={373} label="COMPUTE A CHECK" color={C.violet}/>
     <DotTrail x1={1156} y1={864} x2={1216} y2={864} time={time} count={2} speed={.5}/>
     <Capsule x={1235} y={840} w={414} label="VERIFY THE RESULT" color={third>.5?C.mint:C.cyan}/>
   </Card>
  </g>
  <T x={960} y={964} size={22} color={C.muted} anchor="middle">THE STORED PASSWORD IS NOT DECRYPTED  ·  THERE IS NO READABLE PASSWORD COMPARISON</T>
 </g>
 </Header>;
};

const Success:React.FC<{time:number}>=({time})=>{
 const enter=fade(time,35,38),rows=fade(time,41,44),checks=fade(time,49,52),out=fade(time,58,62);
 const fields=[['ACCOUNT RECORD','FOUND'],['PASSWORD VERIFIER','MATCH'],['ACCOUNT STATUS','ACTIVE'],['REQUIRED CHECKS','SATISFIED']];
 return <Header time={time} phase="02  /  DECISION" sub="VERIFICATION RESULT  /  AUTHENTICATED IDENTITY">
  <g opacity={enter}>
   <Card x={126} y={247} w={902} h={665} accent={C.cyan} time={time}>
    <T x={170} y={304} size={30} weight={830}>VERIFICATION PIPELINE</T>
    <T x={170} y={348} size={23} color={C.muted}>Each necessary check contributes to the decision.</T>
    {fields.map((line,i)=>{const revealed=fade(time,37+i*4.6,39+i*4.6);return <g key={i} opacity={rows*.2+revealed*.8}>
     <rect x={165} y={375+i*108} width={824} height={91} rx={15} fill="#153D57" stroke={i===3?C.mint:'#477E9D'} strokeWidth={1.5}/>
     <circle cx={200} cy={422+i*108} r={12} fill={revealed>.7?C.mint:'#315D70'}/>
     <T x={232} y={430+i*108} size={26} weight={830}>{line[0]}</T>
     <Capsule x={738} y={398+i*108} w={222} label={line[1]} color={revealed>.7?C.mint:C.cyan}/>
    </g>})}
   </Card>
   <Card x={1080} y={247} w={714} h={665} accent={C.mint} time={time+3} active={out>.4}>
    <g opacity={checks}>
      <Tick x={1439} y={410} size={89} time={time}/>
      <T x={1437} y={543} size={42} color={C.mint} weight={900} anchor="middle">IDENTITY VERIFIED</T>
      <T x={1437} y={601} size={25} color={C.muted} anchor="middle">All checks required for this login passed.</T>
    </g>
    <g opacity={out}>
     <rect x={1170} y={661} width={541} height={121} rx={24} fill="#165461" stroke={C.mint} strokeWidth={3}/>
     <T x={1439} y={738} size={42} color={C.mint} anchor="middle" weight={900}>AUTHENTICATED</T>
    </g>
    <T x={1437} y={848} size={22} color={C.muted} anchor="middle">AUTHENTICATED ≠ AUTHORIZED FOR ALL ACTIONS</T>
   </Card>
   <g opacity={checks}>
    <T x={960} y={969} color={C.amber} size={22} anchor="middle">AN ADDITIONAL FACTOR IS VERIFIED ONLY WHEN REQUIRED BY THIS SYSTEM</T>
   </g>
  </g>
 </Header>;
};

const Compare:React.FC<{time:number}>=({time})=>{
 const enter=fade(time,66,69),right=fade(time,74,77),roles=fade(time,82,86),aha=fade(time,91,95);
 return <Header time={time} phase="03  /  IDENTITY VS ACCESS" sub="AUTHENTICATION AND AUTHORIZATION ANSWER DIFFERENT QUESTIONS">
  <g opacity={enter}>
    <Card x={121} y={243} w={816} h={570} accent={C.mint} time={time} active>
      <Capsule x={153} y={281} w={383} label="AUTHENTICATION" color={C.mint}/>
      <T x={158} y={392} size={43} weight={890}>WHO ARE YOU?</T>
      <T x={160} y={442} size={25} color={C.muted}>Verify acceptable proof of identity.</T>
      <path d="M 161 489 H 895" stroke={C.mint} strokeOpacity=".42" strokeWidth={2}/>
      <Tick x={236} y={567} time={time} size={38}/>
      <T x={310} y={574} size={29} weight={840}>PASSWORD VERIFIED</T>
      <Tick x={236} y={668} time={time} size={38}/>
      <T x={310} y={675} size={29} weight={840}>IDENTITY CONFIRMED</T>
      <T x={162} y={774} size={23} color={C.muted}>OUTPUT: AUTHENTICATED IDENTITY</T>
    </Card>
    <g opacity={right}>
     <Card x={982} y={243} w={816} h={570} accent={C.violet} time={time+4} active>
      <Capsule x={1014} y={281} w={384} label="AUTHORIZATION" color={C.violet}/>
      <T x={1019} y={392} size={40} weight={880}>WHAT CAN YOU ACCESS?</T>
      <T x={1021} y={442} size={25} color={C.muted}>Evaluate permissions for requested actions.</T>
      <path d="M 1024 489 H 1756" stroke={C.violet} strokeOpacity=".42" strokeWidth={2}/>
      <g opacity={roles}>
       <Capsule x={1042} y={523} w={315} label="MEMBER" color={C.cyan}/>
       <Capsule x={1400} y={523} w={315} label="ADMIN" color={C.violet}/>
       <T x={1198} y={628} anchor="middle" size={22} color={C.muted}>OWN PROFILE</T>
       <T x={1558} y={628} anchor="middle" size={22} color={C.muted}>MANAGE USERS</T>
       <Tick x={1199} y={699} size={36} color={C.cyan} time={time}/>
       <Tick x={1558} y={699} size={36} color={C.violet} time={time}/>
       <T x={1388} y={772} anchor="middle" color={C.muted} size={21}>EXAMPLE POLICIES — DEPEND ON THE SYSTEM</T>
      </g>
     </Card>
    </g>
    <g opacity={aha}>
     <rect x={259} y={858} width={1403} height={104} rx={21} fill="#14465A" stroke={C.cyan} strokeWidth={2}/>
     <path d={'M '+(289+(time*65)%1250)+' 860 H '+(359+(time*65)%1250)} stroke={C.mint} strokeWidth={3} opacity=".66"/>
     <T x={960} y={925} anchor="middle" color={C.cyan} size={33} weight={870}>A CORRECT PASSWORD DOES NOT GRANT UNLIMITED ACCESS</T>
    </g>
  </g>
 </Header>;
};

const Handoff:React.FC<{time:number}>=({time})=>{
 const enter=fade(time,100,103),packet=fade(time,108,111),state=fade(time,116,120),waiting=fade(time,123,125);
 return <Header time={time} phase="04  /  AUTH STATE NEXT" sub="THE PASSWORD CHECK PASSED  /  THE PHONE IS STILL WAITING">
   <g opacity={enter}>
    <Card x={127} y={244} w={615} h={546} accent={C.mint} time={time}>
      <Capsule x={170} y={281} w={290} label="AUTH SERVICE" color={C.mint}/>
      <Tick x={432} y={464} time={time} size={76}/>
      <T x={434} y={604} anchor="middle" size={36} color={C.mint} weight={900}>LOGIN APPROVED</T>
      <T x={434} y={662} anchor="middle" size={23} color={C.muted}>Credential checks completed</T>
      <T x={434} y={709} anchor="middle" size={23} color={C.muted}>Authenticated identity is ready</T>
    </Card>
    <path d="M 742 496 H 1129" stroke={C.cyan} strokeWidth={4} strokeOpacity=".50" strokeDasharray="14 15"/>
    <g opacity={packet}><DotTrail x1={755} y1={496} x2={1130} y2={496} time={time} speed={.28} color={C.mint}/></g>
    <g opacity={fade(time,110,114)}>
     <Capsule x={783} y={399} w={306} label="AUTHENTICATED IDENTITY" color={C.cyan}/>
    </g>
    <g opacity={state}>
     <Card x={1147} y={244} w={650} h={546} accent={C.cyan} time={time+2} active>
      <Capsule x={1180} y={281} w={364} label="AUTHENTICATION STATE" color={C.cyan}/>
      <T x={1186} y={405} size={30} weight={850}>RECOGNIZE FUTURE REQUESTS</T>
      <InfoRow x={1183} y={423} w={570} name="INPUT" value="VERIFIED IDENTITY" valueColor={C.mint} time={time}/>
      <InfoRow x={1183} y={512} w={570} name="NEXT ACTION" value="CREATE LOGIN STATE" valueColor={C.cyan} time={time}/>
      <InfoRow x={1183} y={601} w={570} name="PHONE STATUS" value="NOT FINISHED YET" valueColor={C.amber} time={time}/>
      <T x={1473} y={753} anchor="middle" size={22} color={C.muted}>SESSION PROOF / TOKEN: NOT ISSUED YET</T>
     </Card>
    </g>
    <g opacity={waiting}>
     <rect x={420} y={844} width={1080} height={110} rx={21} fill="#123951" stroke={C.cyan} strokeWidth={1.7}/>
     <T x={958} y={896} anchor="middle" size={25} color={C.muted}>PHONE / CLIENT APPLICATION</T>
     <T x={958} y={934} anchor="middle" size={26} weight={820} color={C.ink}>STILL WAITING FOR SECURE LOGIN STATE</T>
    </g>
   </g>
 </Header>;
};

export const Shot09DirectorVoiceV3:React.FC<Props>=({audioClips=[]})=>{
 const time=useCurrentFrame()/FPS;
 const voice=audioClips.length===4?audioClips:[];
 return <div style={{position:'absolute',width:W,height:H,background:C.bg,overflow:'hidden',fontFamily:AT_FONT}}>
  {time<10.7&&<div style={{position:'absolute',inset:0,opacity:exit(time,8.2,10.5)}}><Overview time={time}/></div>}
  {time>=7.5&&time<38.7&&<div style={{position:'absolute',inset:0,opacity:fade(time,7.5,10.5)*exit(time,35.7,38.7)}}><Verify time={time}/></div>}
  {time>=34.6&&time<70.3&&<div style={{position:'absolute',inset:0,opacity:fade(time,34.6,37.6)*exit(time,67.3,70.3)}}><Success time={time}/></div>}
  {time>=66.3&&time<104.4&&<div style={{position:'absolute',inset:0,opacity:fade(time,66.3,69.3)*exit(time,101.4,104.4)}}><Compare time={time}/></div>}
  {time>=100.8&&<div style={{position:'absolute',inset:0,opacity:fade(time,100.8,103.8)}}><Handoff time={time}/></div>}
  {voice.map((clip,index)=><Sequence key={index} from={clip.fromFrame} durationInFrames={clip.durationInFrames} name={'Approved original C0'+(index+1)}>
    <Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames??0}/>
   </Sequence>)}
 </div>;
};
export const SHOT09_V3_VOICE_STARTS=[18,1104,2051,3031] as const;
export const SHOT09_V3_VOICE_DURATIONS=[1074,935,968,966] as const;
