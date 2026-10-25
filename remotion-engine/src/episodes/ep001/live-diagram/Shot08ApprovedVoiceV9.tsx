import React from 'react';
import {Easing, Html5Audio, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {UserDatabaseV8Premium} from './UserDatabaseV8Premium';

const W=1920,H=1080,FPS=30;
const COLORS={bg:'#07192F',surface:'#0D304B',ink:'#F2FDFF',muted:'#A4CDE0',
  cyan:'#58E6FA',mint:'#60EFC7',violet:'#BEB4FF',amber:'#FFC79D'};
const f=(seconds:number)=>Math.round(seconds*FPS);
const ease=(frame:number,start:number,end:number)=>interpolate(frame,[f(start),f(end)],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const linear=(frame:number,start:number,end:number)=>interpolate(frame,[f(start),f(end)],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const T:React.FC<{x:number;y:number;size?:number;color?:string;weight?:number;
  anchor?:'start'|'middle'|'end';children:React.ReactNode}>=
  ({x,y,size=27,color=COLORS.ink,weight=690,anchor='start',children})=>
  <text x={x} y={y} textAnchor={anchor} fill={color} fontWeight={weight}
    fontFamily={AT_FONT} fontSize={size}>{children}</text>;

type VoiceSegment={src:string;fromFrame:number;durationInFrames:number;trimBeforeFrames?:number};
type Props={durationInFrames:number;audioClips?:VoiceSegment[]};

const Frame:React.FC<{label:string;sub?:string;clock:string;children:React.ReactNode}>=({label,sub,clock,children})=>
  <svg viewBox="0 0 1920 1080" width={W} height={H} style={{display:'block'}}>
    <defs>
      <radialGradient id="v9-backdrop" cx=".50" cy=".37" r=".82">
       <stop offset="0" stopColor="#134361"/>
       <stop offset=".66" stopColor="#0B2A46"/>
       <stop offset="1" stopColor="#07172D"/>
      </radialGradient>
      <linearGradient id="v9-tube" x1="0" x2="1">
       <stop offset="0" stopColor="#55E0FB" stopOpacity=".13"/>
       <stop offset=".56" stopColor="#6AEBFB" stopOpacity=".70"/>
       <stop offset="1" stopColor="#63B2DD" stopOpacity=".16"/>
      </linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#v9-backdrop)"/>
    <g stroke="#4A8FB1" strokeWidth={1} opacity=".09">
     {Array.from({length:13},(_,i)=><path key={'v'+i} d={'M '+(88+150*i)+' 0 V 1080'}/>)}
     {Array.from({length:9},(_,i)=><path key={'h'+i} d={'M 0 '+(100+i*118)+' H 1920'}/>)}
    </g>
    <rect x={110} y={66} width={1700} height={120} rx={19} fill="#0A2A46"
      stroke="#478BAA" strokeWidth={1.8}/>
    <circle cx={155} cy={124} r={12} fill={COLORS.cyan}/>
    <T x={189} y={128} size={34} weight={860}>{label}</T>
    {sub&&<T x={189} y={164} size={19} color={COLORS.muted} weight={720}>{sub}</T>}
    <T x={1740} y={139} size={22} anchor="end" color="#87BDD4" weight={760}>{clock}</T>
    {children}
    <path d="M 292 1036 H 1628" stroke="#5AA4C8" opacity=".28" strokeWidth={1.5}/>
  </svg>;

const Panel:React.FC<{x:number;y:number;w:number;h:number;tint?:string;children:React.ReactNode;
  active?:boolean}>=({x,y,w,h,tint=COLORS.cyan,children,active=false})=>
  <g>
    <rect x={x} y={y} width={w} height={h} rx={20}
      fill={active?'#11405A':'#0C2D49'} stroke={tint}
      strokeOpacity={active?.91:.57} strokeWidth={active?2.9:1.7}/>
    {children}
  </g>;

const Chip:React.FC<{x:number;y:number;w:number;label:string;tint?:string}>=
 ({x,y,w,label,tint=COLORS.cyan})=><g>
  <rect x={x} y={y} width={w} height={46} rx={12} fill="#17445A"
    stroke={tint} strokeWidth={1.5} strokeOpacity=".62"/>
  <circle cx={x+19} cy={y+24} r={5} fill={tint}/>
  <T x={x+36} y={y+31} color={tint} size={22} weight={815}>{label}</T>
 </g>;

const FlowEdge:React.FC<{x1:number;y1:number;x2:number;y2:number;active:number;reverse?:boolean}>=
 ({x1,y1,x2,y2,active,reverse=false})=>{
  const x=x1+(x2-x1)*(reverse?1-active:active),y=y1+(y2-y1)*(reverse?1-active:active);
  return <g>
   <path d={'M '+x1+' '+y1+' L '+x2+' '+y2} stroke="#5397B5"
     strokeWidth={4} strokeOpacity=".48" strokeLinecap="round"/>
   <circle cx={x} cy={y} r={11} fill="#A4F8FF" opacity={.40+.60*Math.sin(active*Math.PI)}/>
   <circle cx={x} cy={y} r={22} fill="#59DEFA" opacity=".10"/>
  </g>;
};

const CredentialSecurity:React.FC<{time:number;frame:number}>=({time,frame})=>{
 const enter=ease(frame,32.5,34.0);
 const revealHash=ease(frame,49.2,52.1);
 const removeReadable=ease(frame,40.8,43.3);
 const salt=ease(frame,77.8,80.5);
 const compare=ease(frame,80.3,83.0)*(1-ease(frame,87,89));
 const work=ease(frame,86.7,89.0);
 const attack=ease(frame,98.8,101.1)*(1-ease(frame,112.2,115));
 const close=ease(frame,112.5,116.0);
 const pulse=.5+.5*Math.sin(time*3.6);
 const repeated=Math.floor(Math.max(0,time-99)*1.35);
 const paired=work>.6&&time<98;
 return <div style={{position:'absolute',inset:0,opacity:enter,
   transform:'translateY('+(14*(1-enter))+'px)'}}>
 <Frame label="USER DATABASE" sub="CREDENTIAL STORAGE  /  AUTHENTICATION DATA" clock="PROTECTED VERIFIER">
   <Panel x={158} y={224} w={1604} h={165} tint="#427F9D">
    <T x={202} y={271} size={23} color="#95C5D9" weight={800}>SELECTED ACCOUNT</T>
    <T x={205} y={333} size={47} weight={860}>0042</T>
    <T x={385} y={331} size={33} color="#B2E3F1">alex@example.com</T>
    <Chip x={1409} y={278} w={292} label="ACTIVE ACCOUNT" tint={COLORS.mint}/>
   </Panel>
   <g opacity={1-ease(frame,65.3,67)}>
    <Panel x={159} y={423} w={647} h={434} tint="#6A98B5">
      <T x={201} y={474} size={24} color="#91C6DA" weight={820}>SUBMITTED PASSWORD</T>
      <rect x={202} y={511} width={562} height={111} rx={17} fill="#143B57"
        stroke="#557B99" strokeWidth={1.5}/>
      <T x={237} y={582} size={43} color="#B1D9EE" weight={850}>••••••••••••</T>
      <path d="M 220 669 H 744" stroke="#547E9B" opacity=".6"/>
      <T x={210} y={720} size={22} color="#A2BBD1" weight={770}>SENSITIVE INPUT</T>
      <T x={210} y={759} size={25} color="#DCF5FF" weight={700}>Used during the verification step</T>
    </Panel>
    <Panel x={840} y={423} w={920} h={434} tint={COLORS.violet} active={revealHash>.5}>
      <T x={884} y={476} size={27} color="#CAC4FF" weight={860}>STORED PASSWORD VERIFIER</T>
      <g opacity={1-removeReadable}>
        <rect x={883} y={520} width={828} height={107} rx={17}
          fill="#19374D" stroke="#537A93" strokeWidth={1.8}/>
        <T x={924} y={586} size={33} weight={775} color="#A9BFD0">READABLE PASSWORD</T>
      </g>
      <g opacity={removeReadable}>
        <rect x={881} y={519} width={834} height={105} rx={16}
          fill="#103E51" stroke={COLORS.mint} strokeWidth={1.7}/>
        <T x={907} y={562} size={23} color={COLORS.mint} weight={825}>NOT PLAINTEXT</T>
        <T x={907} y={603} size={27} color="#DCF9FF" weight={830}>One-way protected representation</T>
      </g>
      <g opacity={revealHash}>
        <T x={890} y={692} size={23} color="#94C1DA" weight={785}>KDF</T>
        <T x={1107} y={692} size={23} color="#94C1DA" weight={785}>SALT</T>
        <T x={1407} y={692} size={23} color="#94C1DA" weight={785}>DIGEST</T>
        {[
          {x:883,w:200,label:'Argon2id'},
          {x:1100,w:281,label:'f6c1…8a04'},
          {x:1399,w:316,label:'9ac2…e047'}
        ].map((e,i)=><g key={i}>
          <rect x={e.x} y={716} width={e.w} height={75} rx={12}
            fill="#193A61" stroke={i===0?COLORS.violet:COLORS.cyan}
            strokeWidth={1.8}/>
          <T x={e.x+17} y={765} size={i===0?29:27} weight={800}>{e.label}</T>
        </g>)}
      </g>
    </Panel>
    <g opacity={removeReadable*(1-revealHash*.15)}>
      <path d="M 756 640 L 784 664" stroke="#73DBF5" strokeWidth={4} opacity=".60"/>
      <circle cx={804} cy={678} r={11} fill="#7CE9FF" opacity=".9"/>
    </g>
   </g>
   <g opacity={ease(frame,65.0,66.8)}>
    <Panel x={171} y={433} w={1560} h={447} tint="#5DA7CF">
      <T x={215} y={486} size={29} weight={845}>PASSWORD HASHING — HOW THE VERIFIER IS CREATED</T>
      <rect x={212} y={544} width={365} height={165} rx={18}
         fill="#17405D" stroke="#5FCBEE" strokeWidth={1.8}/>
      <T x={251} y={600} size={24} color="#A6D6E9" weight={790}>PASSWORD INPUT</T>
      <T x={251} y={671} size={42}>••••••••••</T>
      <rect x={723} y={544} width={443} height={165} rx={18}
         fill="#28335A" stroke={COLORS.violet} strokeWidth={2}/>
      <T x={945} y={602} size={28} anchor="middle" weight={830}>PASSWORD KDF</T>
      <T x={945} y={662} size={38} anchor="middle" color="#E5DFFF" weight={870}>Argon2id</T>
      <rect x={1323} y={544} width={363} height={165} rx={18}
         fill="#17405B" stroke={COLORS.cyan} strokeWidth={1.9}/>
      <T x={1360} y={601} size={24} color="#9DDAE9" weight={790}>STORED VERIFIER</T>
      <T x={1360} y={658} size={34} weight={850}>9ac2…e047</T>
      <FlowEdge x1={583} y1={622} x2={713} y2={622} active={linear(frame,66.8,68.1)}/>
      <FlowEdge x1={1170} y1={622} x2={1313} y2={622} active={linear(frame,69.2,71.0)}/>
      <g opacity={salt}>
        <rect x={741} y={739} width={407} height={91} rx={17}
          fill="#134E57" stroke={COLORS.mint} strokeWidth={1.8}/>
        <T x={778} y={770} size={21} color="#9DF5DA" weight={825}>UNIQUE SALT</T>
        <T x={778} y={808} size={29} weight={810}>f6c1…8a04</T>
        <path d="M 945 740 V 709" stroke={COLORS.mint} strokeWidth={3}
          strokeLinecap="round"/>
      </g>
    </Panel>
    <g opacity={compare}>
      <rect x={195} y={461} width={1530} height={407} rx={18} fill="#0A2B46" stroke={COLORS.violet} strokeWidth={2}/>
      <T x={244} y={511} size={27} weight={825}>SAME PASSWORD — DIFFERENT STORED HASHES</T>
      {[
        {y:547,name:'ACCOUNT A',salt:'f6c1…8a04',hash:'9ac2…e047',tint:COLORS.cyan},
        {y:694,name:'ACCOUNT B',salt:'4d87…63ff',hash:'e4b9…27c1',tint:COLORS.violet}
      ].map((o,i)=><g key={i}>
        <rect x={232} y={o.y} width={1450} height={122} rx={15} fill="#103752" stroke={o.tint} strokeOpacity=".66"/>
        <T x={256} y={o.y+46} size={25} weight={815} color={o.tint}>{o.name}</T>
        <T x={590} y={o.y+43} size={20} color="#9AC5DA" weight={735}>SALT</T>
        <T x={590} y={o.y+90} size={28}>{o.salt}</T>
        <T x={1080} y={o.y+43} size={20} color="#9AC5DA" weight={735}>HASH</T>
        <T x={1080} y={o.y+90} size={28} weight={840}>{o.hash}</T>
      </g>)}
    </g>
    <g opacity={work}>
      <rect x={207} y={906} width={1501} height={79} rx={15} fill="#113953" stroke="#58B4D7" strokeWidth={1.6}/>
      <T x={239} y={954} size={25} weight={820} color="#BAEFFF">
        {attack>.1?'MANY GUESSES  →  REPEATED COMPUTATIONAL COST':
          paired?'COST PER PASSWORD GUESS':'ONE-WAY VERIFICATION REQUIRES COMPUTE'}
      </T>
      <g transform="translate(1336 931)">
      {Array.from({length:8},(_,i)=><rect key={i} x={i*42} y={0}
        width={28} height={26} rx={5} fill={i<Math.floor(pulse*8)?COLORS.mint:'#275574'}
        opacity={.40+.60*work}/>)}
      </g>
    </g>
    <g opacity={attack}>
     <rect x={210} y={458} width={1500} height={398} rx={18}
       fill="#0A2F4A" stroke={COLORS.cyan} strokeWidth={2}/>
     <T x={257} y={511} size={27} weight={850}>REPEATED PASSWORD GUESSES ARE EXPENSIVE</T>
     <T x={262} y={574} size={22} weight={745} color="#9FCEDE">EACH GUESS REQUIRES MORE WORK</T>
     {Array.from({length:14},(_,i)=>{
       const active=i<=repeated%14,xx=270+(i%7)*201,yy=625+Math.floor(i/7)*103;
       return <g key={i}>
         <rect x={xx} y={yy} width={169} height={70} rx={13}
           fill={active?'#14536A':'#123A53'} stroke={active?COLORS.cyan:'#47738C'} strokeWidth={1.2}/>
         <T x={xx+21} y={yy+44} size={22} weight={790}
           color={active?'#B5FCFF':'#8FB3CA'}>ATTEMPT {String(i+1).padStart(2,'0')}</T>
       </g>;
     })}
    </g>
    <g opacity={close}>
      <rect x={212} y={462} width={1496} height={386} rx={19}
        fill="#103451" stroke={COLORS.mint} strokeWidth={2.1}/>
      <T x={260} y={532} color="#BFF8E6" size={27} weight={850}>STORED INFORMATION</T>
      <T x={257} y={627} size={43} weight={880}>VERIFY — DO NOT RECOVER</T>
      <T x={259} y={704} size={30} color="#C5E5F2" weight={700}>The original password is not retrievable from the digest.</T>
      <rect x={250} y={750} width={1410} height={68} rx={14}
       fill="#144B5E" stroke={COLORS.cyan} strokeWidth={1.2}/>
      <T x={291} y={796} size={26} weight={830}>NEXT  ·  AUTH SERVICE CHECKS THE SUBMITTED CREDENTIALS</T>
    </g>
   </g>
 </Frame></div>;
};

const FactsReturn:React.FC<{time:number;frame:number}>=({time,frame})=>{
 const intro=ease(frame,121.4,123.6);
 const showVerifier=ease(frame,127.4,130.2);
 const showStatus=ease(frame,137.4,139.5);
 const showRole=ease(frame,140.3,143.2);
 const proof=ease(frame,147.1,149.4);
 const arrival=ease(frame,149.7,152);
 const transit=linear(frame,128.0,150.5);
 return <div style={{position:'absolute',inset:0,opacity:intro}}>
  <Frame label="USER DATABASE" sub="ACCOUNT FACTS  /  RETURN TO AUTH SERVICE" clock="LOOKUP REPLY">
    <Panel x={130} y={268} w={650} h={524} tint={COLORS.cyan}>
      <T x={176} y={340} size={32} weight={830}>DATABASE RECORD</T>
      <T x={176} y={425} size={54} weight={870}>0042</T>
      <T x={176} y={485} size={32} color="#D8F7FF" weight={760}>alex@example.com</T>
      <Chip x={171} y={536} w={360} label="ACCOUNT ACTIVE" tint={COLORS.mint}/>
      <g opacity={showVerifier}>
       <rect x={169} y={613} width={567} height={128} rx={14}
         fill="#153C57" stroke={COLORS.violet} strokeWidth={1.4}/>
       <T x={200} y={658} color="#C2B7FF" size={22} weight={830}>STORED VERIFIER</T>
       <T x={200} y={709} size={30} weight={805}>Argon2id  /  salt  /  digest</T>
      </g>
    </Panel>
    <path d="M 803 523 H 1214" stroke="#407793" strokeWidth={5} opacity=".85"/>
    <g opacity={.9}>
      <rect x={810+420*transit} y={503} width={56} height={42} rx={12}
        fill="#5BDDEB" stroke="#ACFCFF" strokeWidth={1.6}/>
    </g>
    <Panel x={1233} y={268} w={553} h={524} tint={COLORS.violet} active={arrival>.3}>
      <T x={1276} y={344} size={33} weight={865}>AUTH SERVICE</T>
      <T x={1276} y={392} size={24} color="#B8C5F4">IDENTITY VERIFICATION</T>
      <rect x={1272} y={441} width={473} height={121} rx={15} fill="#143D57"
         stroke={COLORS.cyan} strokeWidth={1.5}/>
      <T x={1298} y={485} size={23} color="#A5E5F1" weight={790}>ORIGINAL LOGIN REQUEST</T>
      <Chip x={1300} y={504} w={246} label="WAITING" tint={COLORS.mint}/>
      <g opacity={arrival}>
       <T x={1276} y={653} size={28} color="#9BEFDA" weight={845}>ACCOUNT FACTS RECEIVED</T>
       <T x={1276} y={710} size={23} color="#C4DEEE">Credential check comes next.</T>
      </g>
    </Panel>
    <g opacity={showStatus}>
     <rect x={136} y={817} width={526} height={82} rx={15} fill="#0F4652"
       stroke={COLORS.mint} strokeWidth={1.6}/>
     <T x={174} y={868} size={26} color="#C3FDEB" weight={825}>STATUS  ·  ACTIVE</T>
    </g>
    <g opacity={showRole}>
     <rect x={677} y={817} width={530} height={82} rx={15} fill="#2A2D56"
       stroke={COLORS.violet} strokeWidth={1.6}/>
     <T x={718} y={868} size={26} weight={835} color="#DFD6FF">ROLE  ·  MEMBER</T>
    </g>
    <g opacity={proof}>
     <rect x={1226} y={817} width={560} height={82} rx={15} fill="#103A57"
       stroke={COLORS.cyan} strokeWidth={1.6}/>
     <T x={1257} y={869} size={23} weight={855}>PERMISSIONS ≠ PASSWORD PROOF</T>
    </g>
    <g opacity={ease(frame,128.0,131.3)*(1-ease(frame,148,150.8))}>
      <T x={1017} y={483} anchor="middle" size={22} weight={845} color="#B8EEFA">ACCOUNT FACTS</T>
    </g>
  </Frame>
 </div>;
};

const DEFAULT_AUDIO_STARTS=[18,982,1972,3659];
const DEFAULT_AUDIO_DURATIONS=[949,973,1672,951];

export const Shot08ApprovedVoiceV9:React.FC<Props>=({durationInFrames,audioClips=[]})=>{
 const frame=useCurrentFrame(),time=frame/FPS;
 const segments=audioClips.length===4?audioClips:[];
 return <div style={{position:'absolute',width:W,height:H,overflow:'hidden',background:COLORS.bg,fontFamily:AT_FONT}}>
    {frame<f(35.0)&&<UserDatabaseV8Premium durationInFrames={f(35)}
      anchors={{DB_TABLE_OPEN:8.7,DB_ROWS_START:11.6,DB_ROW_SCAN:17.2,
        DB_ACCOUNT_MATCH:22.8,DB_MATCH_HERO:24.4,DB_RESULT_REVEAL:26.7}}/>}
    {time>=31.7&&time<124.1&&<CredentialSecurity time={time} frame={frame}/>}
    {time>=120.7&&<FactsReturn time={time} frame={frame}/>}
    {segments.map((clip,index)=><Sequence key={'voice'+index} from={clip.fromFrame}
      durationInFrames={clip.durationInFrames} name={'Director voice C0'+(index+1)}>
        <Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames??0}/>
      </Sequence>)}
  </div>;
};

export const SHOT08_V9_VOICE_STARTS=DEFAULT_AUDIO_STARTS;
export const SHOT08_V9_VOICE_DURATIONS=DEFAULT_AUDIO_DURATIONS;
