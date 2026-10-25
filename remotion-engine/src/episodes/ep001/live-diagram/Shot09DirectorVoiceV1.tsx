import React from 'react';
import {Html5Audio, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';

const FPS=30;
const C={bg:'#07192F',panel:'#0D304B',white:'#F2FDFF',muted:'#A4CDE0',cyan:'#58E6FA',mint:'#60EFC7',violet:'#BEB4FF',amber:'#FFC79D'};
type AudioClip={src:string;fromFrame:number;durationInFrames:number;trimBeforeFrames?:number};
type Props={durationInFrames:number;audioClips?:AudioClip[]};
type LabelProps={x:number;y:number;size?:number;color?:string;weight?:number;children:React.ReactNode;anchor?:'start'|'middle'|'end'};
const Label:React.FC<LabelProps>=({x,y,size=28,color=C.white,weight=720,children,anchor='middle'})=>
  <text x={x} y={y} fill={color} textAnchor={anchor} fontSize={size} fontWeight={weight} fontFamily={AT_FONT}>{children}</text>;
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ramp=(time:number,start:number,end:number)=>clamp((time-start)/(end-start));
const smooth=(v:number)=>v*v*(3-2*v);
const inAt=(time:number,start:number,end:number)=>smooth(ramp(time,start,end));
const outAt=(time:number,start:number,end:number)=>1-inAt(time,start,end);
const pulse=(time:number,speed=2.4)=>.5+.5*Math.sin(time*speed);
const Panel:React.FC<{x:number;y:number;w:number;h:number;accent?:string;children:React.ReactNode;active?:boolean}>=
({x,y,w,h,accent=C.cyan,children,active=false})=><g>
  <rect x={x} y={y} width={w} height={h} rx={24} fill={active?'#154761':C.panel}
    stroke={accent} strokeWidth={active?3:1.8} strokeOpacity={active?1:.64}/>
  {children}
</g>;
const Pill:React.FC<{x:number;y:number;w:number;label:string;color?:string}>=({x,y,w,label,color=C.mint})=>
 <g><rect x={x} y={y} width={w} height={54} rx={14} fill="#143F56" stroke={color} strokeOpacity=".8" strokeWidth={1.7}/>
   <Label x={x+w/2} y={y+35} size={22} color={color} weight={820}>{label}</Label></g>;
const Arrow:React.FC<{x1:number;y1:number;x2:number;y2:number;time:number;color?:string;delay?:number}>=
 ({x1,y1,x2,y2,time,color=C.cyan,delay=0})=>{
   const amount=inAt(time,delay,delay+1.1);
   const xx=x1+(x2-x1)*amount,yy=y1+(y2-y1)*amount;
   return <g><path d={'M '+x1+' '+y1+' L '+x2+' '+y2} fill="none" stroke={color} strokeOpacity=".42" strokeWidth={5}/>
    <circle cx={xx} cy={yy} r={13} fill={color} opacity={.45+.55*pulse(time)}/>
    <circle cx={xx} cy={yy} r={25} fill={color} opacity=".13"/></g>;
 };
const Stage:React.FC<{title:string;sub:string;clock:string;children:React.ReactNode}>=({title,sub,clock,children})=>
 <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{display:'block',position:'absolute',inset:0}}>
   <defs><radialGradient id="shot09-bg" cx=".50" cy=".35" r=".9">
    <stop offset="0" stopColor="#143D59"/><stop offset=".72" stopColor="#0B2A46"/><stop offset="1" stopColor="#07192F"/>
   </radialGradient></defs>
   <rect width={1920} height={1080} fill="url(#shot09-bg)"/>
   <g stroke="#4F90B1" strokeWidth="1" opacity=".065">
    {Array.from({length:13},(_,i)=><path key={'v'+i} d={'M '+(90+i*145)+' 0 V 1080'}/>)}
    {Array.from({length:8},(_,i)=><path key={'h'+i} d={'M 0 '+(100+i*135)+' H 1920'}/>)}
   </g>
   <rect x={109} y={65} width={1702} height={124} rx={21} fill="#0B2B47" stroke="#468CAF" strokeWidth={1.7}/>
   <circle cx={155} cy={124} r={12} fill={C.cyan}/>
   <Label x={195} y={127} size={36} anchor="start" weight={870}>{title}</Label>
   <Label x={195} y={163} size={20} anchor="start" color={C.muted} weight={700}>{sub}</Label>
   <Label x={1750} y={138} size={21} anchor="end" color="#A0C9DB" weight={790}>{clock}</Label>
   {children}
   <path d="M 290 1033 H 1630" stroke="#5AA4C8" strokeWidth={1.6} strokeOpacity=".34"/>
 </svg>;
const Check:React.FC<{x:number;y:number;r:number;time:number;scale?:number}>=({x,y,r,time,scale=1})=>
 <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
   <circle r={r+16*pulse(time)} fill={C.mint} opacity=".06"/>
   <circle r={r} fill="#154E59" stroke={C.mint} strokeWidth={4}/>
   <path d={'M '+(-r*.46)+' 0 L '+(-r*.12)+' '+(r*.30)+' L '+(r*.48)+' '+(-r*.36)}
     stroke={C.mint} strokeWidth={Math.max(5,r*.13)} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
 </g>;

const VerifyStage:React.FC<{time:number}>=({time})=>{
 const inputs=inAt(time,5.2,7.6),center=inAt(time,12,14.8),check=inAt(time,25.7,28.2);
 return <Stage title="AUTH SERVICE" sub="CREDENTIAL VERIFICATION  /  RETURNED ACCOUNT FACTS" clock="STEP 01 / CHECK">
   <g opacity={outAt(time,6,8.5)}>
     <Panel x={190} y={294} w={630} h={215} accent={C.mint}>
      <Label x={505} y={350} size={25} color={C.muted}>USER DATABASE</Label>
      <Label x={505} y={419} size={36}>ACCOUNT RECORD 0042</Label>
      <Pill x={370} y={444} w={270} label="ACCOUNT ACTIVE"/>
     </Panel>
     <Arrow x1={820} y1={402} x2={1080} y2={402} time={time} delay={2.5}/>
     <Panel x={1080} y={294} w={630} h={215} accent={C.cyan} active>
       <Label x={1395} y={350} size={25} color={C.muted}>AUTH SERVICE</Label>
       <Label x={1395} y={429} size={39} weight={860}>ACCOUNT FACTS RECEIVED</Label>
     </Panel>
   </g>
   <g opacity={inputs}>
     <Panel x={159} y={288} w={762} h={248} accent={C.cyan}>
      <Label x={540} y={344} size={25} color={C.muted} weight={810}>SUBMITTED PASSWORD</Label>
      <rect x={257} y={379} width={566} height={91} rx={17} fill="#15445C" stroke="#478EAA" strokeWidth={1.5}/>
      <Label x={540} y={443} size={45}>••••••••••••</Label>
      <Label x={540} y={505} size={21} color="#B9DCEB">From the original Login Request</Label>
     </Panel>
     <Panel x={999} y={288} w={762} h={248} accent={C.violet}>
      <Label x={1380} y={344} size={25} color={C.muted} weight={810}>STORED VERIFIER</Label>
      <rect x={1098} y={379} width={563} height={91} rx={17} fill="#293C5E" stroke="#9388D9" strokeWidth={1.5}/>
      <Label x={1380} y={438} size={32} color="#E2DFFF" weight={860}>PROTECTED HASH + SALT</Label>
      <Label x={1380} y={505} size={21} color="#C7D3EB">Retrieved from the User Database</Label>
     </Panel>
     <path d="M 540 537 V 610 H 960" stroke={C.cyan} strokeWidth={4} opacity=".62" fill="none"/>
     <path d="M 1380 537 V 610 H 960" stroke={C.violet} strokeWidth={4} opacity=".64" fill="none"/>
   </g>
   <g opacity={center}>
     <Panel x={473} y={652} w={972} h={190} accent={check>.4?C.mint:C.cyan} active>
       <Label x={960} y={706} size={28} color={C.muted}>VERIFICATION ROUTINE</Label>
       <Label x={960} y={779} size={46} weight={890}>PASSWORD VERIFICATION</Label>
       {check>.1&&<g opacity={check}><Check x={1374} y={740} r={25} time={time}/></g>}
     </Panel>
     <Label x={960} y={921} size={25} color="#B4D8E8" weight={760}>NO PLAINTEXT COMPARISON. NO STORED PASSWORD DECRYPTION.</Label>
   </g>
 </Stage>;
};
const SuccessStage:React.FC<{time:number}>=({time})=>{
 const enter=inAt(time,35,37),facts=inAt(time,42,45),required=inAt(time,53,55),decision=inAt(time,59,62);
 return <Stage title="AUTH SERVICE" sub="VERIFICATION RESULT  /  REQUIRED CHECKS" clock="STEP 02 / DECISION">
   <g opacity={enter}>
     <Panel x={345} y={244} w={1230} h={340} accent={C.mint} active={decision>.3}>
       <Check x={960} y={361} r={74} time={time} scale={1}/>
       <Label x={960} y={515} size={54} color={C.mint} weight={900}>CREDENTIALS VERIFIED</Label>
     </Panel>
     <g opacity={facts}>
       <Panel x={160} y={629} w={496} h={155} accent={C.mint}>
         <Label x={408} y={693} size={24} color={C.muted}>ACCOUNT STATUS</Label>
         <Label x={408} y={751} size={36} color={C.mint} weight={860}>ACTIVE</Label>
       </Panel>
       <Panel x={712} y={629} w={496} h={155} accent={C.cyan}>
         <Label x={960} y={693} size={24} color={C.muted}>PASSWORD CHECK</Label>
         <Label x={960} y={751} size={36} color={C.mint} weight={860}>PASSED</Label>
       </Panel>
       <Panel x={1264} y={629} w={496} h={155} accent={C.violet}>
         <Label x={1512} y={693} size={24} color={C.muted}>REQUIRED PROOF</Label>
         <Label x={1512} y={751} size={36} color={C.mint} weight={860}>SATISFIED</Label>
       </Panel>
     </g>
     <g opacity={required*outAt(time,60.2,62)}>
       <Label x={960} y={846} size={24} color={C.amber}>ADDITIONAL FACTOR — ONLY IF THIS SYSTEM REQUIRES IT</Label>
     </g>
     <g opacity={decision}>
       <rect x={620} y={858} width={680} height={90} rx={19} fill="#155361" stroke={C.mint} strokeWidth={3}/>
       <Label x={960} y={918} size={42} color={C.mint} weight={920}>AUTHENTICATED</Label>
     </g>
   </g>
 </Stage>;
};
const DifferenceStage:React.FC<{time:number}>=({time})=>{
 const enter=inAt(time,66.5,69),right=inAt(time,77,79),role=inAt(time,88,90);
 return <Stage title="AUTH SERVICE" sub="AUTHENTICATION IS NOT AUTHORIZATION" clock="STEP 03 / THE DISTINCTION">
   <g opacity={enter}>
    <Panel x={158} y={270} w={759} h={489} accent={C.mint} active>
      <Label x={537} y={341} size={32} color={C.mint} weight={860}>AUTHENTICATION</Label>
      <Label x={537} y={428} size={42} weight={900}>WHO ARE YOU?</Label>
      <path d="M 265 468 H 806" stroke={C.mint} strokeOpacity=".42" strokeWidth={3}/>
      <Check x={537} y={555} r={58} time={time}/>
      <Label x={537} y={693} size={28} color="#B8F5E2">IDENTITY PROVEN</Label>
    </Panel>
    <g opacity={right}>
     <Panel x={1003} y={270} w={759} h={489} accent={C.violet} active>
       <Label x={1382} y={341} size={32} color={C.violet} weight={860}>AUTHORIZATION</Label>
       <Label x={1382} y={428} size={39} weight={900}>WHAT CAN YOU ACCESS?</Label>
       <path d="M 1104 468 H 1660" stroke={C.violet} strokeOpacity=".42" strokeWidth={3}/>
       <Pill x={1127} y={513} w={243} label="MEMBER" color={C.violet}/>
       <Pill x={1404} y={513} w={243} label="ADMIN" color={C.violet}/>
       <Label x={1382} y={644} size={25} color="#D5D1F2">DIFFERENT PERMISSIONS</Label>
       <Label x={1382} y={689} size={24} color="#C8C9E9">FOR DIFFERENT ACTIONS</Label>
     </Panel>
    </g>
    <g opacity={role}>
     <rect x={273} y={827} width={1374} height={110} rx={20} fill="#153F58" stroke={C.cyan} strokeWidth={2}/>
     <Label x={960} y={895} size={30} color={C.cyan} weight={870}>VALID PASSWORD DOES NOT GRANT EVERY PERMISSION</Label>
    </g>
   </g>
 </Stage>;
};
const StateHandoffStage:React.FC<{time:number}>=({time})=>{
 const enter=inAt(time,99.5,102),handoff=inAt(time,108,112),waiting=inAt(time,115,119),focus=inAt(time,122,126);
 return <Stage title="AUTH SERVICE" sub="IDENTITY CONFIRMED  /  THE NEXT SYSTEM STEP" clock="STEP 04 / HANDOFF">
  <g opacity={enter}>
   <Panel x={165} y={315} w={659} h={405} accent={C.mint}>
     <Label x={495} y={400} size={36} weight={870}>AUTH SERVICE</Label>
     <Check x={495} y={513} r={62} time={time}/>
     <Label x={495} y={644} size={29} color={C.mint}>LOGIN APPROVED</Label>
   </Panel>
   <path d="M 836 515 H 1119" stroke="#478CAB" strokeWidth={5} opacity=".66"/>
   <g opacity={handoff}>
     <circle cx={836+(1119-836)*ramp(time,109,126)} cy={515} r={17} fill={C.cyan}/>
     <circle cx={836+(1119-836)*ramp(time,109,126)} cy={515} r={36} fill={C.cyan} opacity=".11"/>
   </g>
   <g opacity={handoff}>
    <Panel x={1120} y={315} w={650} h={405} accent={C.cyan} active={focus>.25}>
      <Label x={1445} y={398} size={35} weight={880}>AUTHENTICATION</Label>
      <Label x={1445} y={447} size={35} weight={880}>STATE</Label>
      <rect x={1260} y={514} width={370} height={70} rx={15} fill="#143D55" stroke={C.cyan} strokeWidth={1.6}/>
      <Label x={1445} y={561} size={25} color={focus>.25?C.mint:C.muted}>THE NEXT STEP</Label>
      <Label x={1445} y={650} size={23} color="#B6DCEA">Recognize future requests securely</Label>
    </Panel>
   </g>
   <g opacity={waiting}>
    <rect x={610} y={801} width={704} height={115} rx={17} fill="#0E304A" stroke="#48738A" strokeWidth={1.5}/>
    <Label x={960} y={850} size={23} color={C.muted}>PHONE / LOGIN REQUEST</Label>
    <Label x={960} y={892} size={27} color="#C1DEED">WAITING FOR SECURE LOGIN STATE</Label>
   </g>
  </g>
 </Stage>;
};
export const Shot09DirectorVoiceV1:React.FC<Props>=({durationInFrames,audioClips=[]})=>{
 const frame=useCurrentFrame();
 const time=frame/FPS;
 const clips=audioClips.length===4?audioClips:[];
 const opacity=(from:number,to:number)=>inAt(time,from,from+1.8)*outAt(time,to-1.9,to);
 return <div style={{position:'absolute',inset:0,width:1920,height:1080,background:C.bg,overflow:'hidden'}}>
   {time<39&&<div style={{opacity:outAt(time,35,38.7)}}><VerifyStage time={time}/></div>}
   {time>=34&&time<72&&<div style={{opacity:opacity(34,72)}}><SuccessStage time={time}/></div>}
   {time>=66&&time<106&&<div style={{opacity:opacity(66,106)}}><DifferenceStage time={time}/></div>}
   {time>=100&&<div style={{opacity:inAt(time,100,103)}}><StateHandoffStage time={time}/></div>}
   {clips.map((c,i)=><Sequence key={'voice'+i} from={c.fromFrame} durationInFrames={c.durationInFrames} name={'Director-approved voice C0'+(i+1)}>
    <Html5Audio src={c.src} trimBefore={c.trimBeforeFrames??0}/>
   </Sequence>)}
 </div>;
};
export const SHOT09_V1_STARTS=[18,1104,2051,3031] as const;
export const SHOT09_V1_DURATIONS=[1074,935,968,966] as const;
