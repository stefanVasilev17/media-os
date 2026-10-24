import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props = {durationInFrames:number; anchors?:Record<string,number>; clipStarts?:number[]};
const W=1920, H=1080, BG='#081B34', WHITE='#F6F8FF', MUTED='#B2C5E1';
const TEAL='#42E6C5', BLUE='#29B9FF', PURPLE='#8C83FF';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const move=(f:number,a:number,b:number)=>interpolate(f,[a,Math.max(a+1,b)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const stage=(f:number,start:number,end:number)=>move(f,start,start+17)*(1-move(f,end-20,end+15));

const Text:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:'start'|'middle'|'end';opacity?:number;spacing?:number}>=({
  x,y,children,size=28,color=WHITE,weight=600,anchor='start',opacity=1,spacing=0
})=><text x={x} y={y} fill={color} fontSize={size} fontWeight={weight}
  textAnchor={anchor} opacity={opacity} letterSpacing={spacing} fontFamily={AT_FONT}>{children}</text>;

const Question:React.FC<{cx:number;cy:number;r?:number}>=({cx,cy,r=65})=><g>
  <circle cx={cx} cy={cy} r={r} fill="#162142" stroke={PURPLE} strokeWidth={3.5}/>
  <text x={cx} y={cy+26*(r/65)} fontFamily={AT_FONT}
    fontSize={86*(r/65)} fontWeight={780} fill="#D4CCFF"
    textAnchor="middle">?</text>
</g>;

const Person:React.FC<{cx:number;cy:number;color?:string;scale?:number}>=({
  cx,cy,color=TEAL,scale=1
})=><g transform={'translate('+cx+' '+cy+') scale('+scale+')'} fill="none"
  stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
  <circle cx={0} cy={-14} r={14}/>
  <path d="M -27 29 C -27 1 27 1 27 29"/>
</g>;

const Search:React.FC<{cx:number;cy:number;color?:string;scale?:number}>=({
  cx,cy,color=PURPLE,scale=1
})=><g transform={'translate('+cx+' '+cy+') scale('+scale+')'} fill="none" stroke={color}
  strokeWidth={5} strokeLinecap="round">
  <circle cx={-6} cy={-6} r={16}/><path d="M 7 8 L 29 30"/>
</g>;

const Tick:React.FC<{cx:number;cy:number;color?:string}>=({cx,cy,color=TEAL})=>
  <path d={'M '+(cx-25)+' '+cy+' l 17 17 l 34 -38'} fill="none" stroke={color}
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={6}/>;

const Panel:React.FC<{x:number;y:number;w:number;h:number;accent:string;kind?:'teal'|'blue'|'purple';children:React.ReactNode;radius?:number}>=({
 x,y,w,h,accent,kind='teal',children,radius=28
})=><g>
  <rect x={x+3} y={y+8} width={w} height={h} rx={radius} fill={accent}
    fillOpacity=".055" filter="url(#softBloom)"/>
  <rect x={x} y={y} width={w} height={h} rx={radius}
    fill={kind==='teal'?'url(#cardTeal)':kind==='blue'?'url(#cardBlue)':'url(#cardPurple)'}
    stroke={accent} strokeWidth={2.8}/>
  {children}
</g>;

const Arrow:React.FC<{x1:number;x2:number;y:number;progress?:number;color?:string}>=({
 x1,x2,y,progress=1,color=TEAL
})=><g opacity={progress}>
  <path d={'M '+x1+' '+y+' H '+(x1+(x2-x1-20)*progress)} stroke={color}
    strokeWidth={11} opacity=".25" filter="url(#softBloom)"/>
  <path d={'M '+x1+' '+y+' H '+(x1+(x2-x1-20)*progress)} stroke={color}
    strokeWidth={5} strokeLinecap="round"/>
  <path d={'M '+(x1+(x2-x1-45)*progress)+' '+(y-13)+' L '+(x1+(x2-x1-20)*progress)+' '+y+' L '+(x1+(x2-x1-45)*progress)+' '+(y+13)}
    fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round"/>
</g>;

const Phone:React.FC<{x:number;y:number;progress:number;w?:number;h?:number}>=({
 x,y,progress,w=300,h=530
})=>{
 const email='alex@example.com';
 const letters=Math.floor(email.length*clamp(progress));
 return <g transform={'translate('+x+' '+y+')'}>
  <defs>
   <linearGradient id="v10-phone-titanium" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#ACBFCD"/><stop offset=".16" stopColor="#31485F"/>
    <stop offset=".41" stopColor="#10243E"/><stop offset=".80" stopColor="#66879F"/>
    <stop offset="1" stopColor="#B7CCD8"/>
   </linearGradient>
   <linearGradient id="v10-phone-glass" x1="0" y1="0" x2=".85" y2="1">
    <stop offset="0" stopColor="#12385D"/><stop offset=".43" stopColor="#0B2748"/>
    <stop offset="1" stopColor="#04152A"/>
   </linearGradient>
   <linearGradient id="v10-phone-reflection" x1="0" y1="0" x2="1" y2=".9">
    <stop offset="0" stopColor="#D6EBFF" stopOpacity=".15"/>
    <stop offset=".25" stopColor="#B7DFFF" stopOpacity=".025"/>
    <stop offset=".6" stopColor="#D8F2FF" stopOpacity=".005"/>
    <stop offset="1" stopColor="#FFFFFF" stopOpacity=".075"/>
   </linearGradient>
   <clipPath id="v10-phone-screen-clip"><rect x={8} y={8} width={w-16} height={h-16} rx={40}/></clipPath>
  </defs>
  <rect x={-10} y={8} width={w+20} height={h+4} rx={51}
    fill="#02101E" opacity=".60" filter="url(#softBloom)"/>
  <rect x={-5} y={0} width={w+10} height={h+6} rx={49}
    fill="url(#v10-phone-titanium)" stroke="#7797B3" strokeWidth={1.3}/>
  <path d={'M '+(w+5)+' 117 h 4 v 81 h -4'} fill="#506E86" stroke="#8BA7B9" strokeWidth={1}/>
  <path d="M -5 94 h -4 v 34 h 4 M -5 153 h -4 v 51 h 4 M -5 218 h -4 v 49 h 4"
    fill="#59758F" stroke="#8DA7BE" strokeWidth={1}/>
  <rect x={3.7} y={3.7} width={w-7.4} height={h-1.4} rx={44}
    fill="#031123" stroke="#0B2036" strokeWidth={2.3}/>
  <g clipPath="url(#v10-phone-screen-clip)">
   <rect x={8} y={8} width={w-16} height={h-16} rx={40} fill="url(#v10-phone-glass)"/>
   <path d={'M 15 9 L '+(w-105)+' 9 L 42 '+(h-12)+' L 10 '+(h-10)+' Z'}
     fill="url(#v10-phone-reflection)" opacity=".38"/>
   <circle cx={w/2} cy={193} r={145} fill="none" stroke="#31557B" strokeWidth={1.5} strokeOpacity=".25"/>
   <circle cx={w/2} cy={193} r={104} fill="none" stroke="#2A6BA1" strokeWidth={1.3} strokeOpacity=".12"/>
   <Text x={34} y={47} size={17} color="#FAFCFF" weight={820}>9:41</Text>
   <g transform={'translate('+(w-85)+' 31)'} fill="#ECF5FF">
    {[6,9,12,15].map((bar,i)=><rect key={i} x={i*6} y={16-bar} width={4} height={bar} rx={1}/>)}
    <path d="M 33 7 Q 41 0 49 7 M 36 10 Q 41 6 46 10 M 40 13 h 2" fill="none" stroke="#ECF5FF" strokeWidth={2} strokeLinecap="round"/>
    <rect x={56} y={3} width={24} height={12} rx={3} stroke="#ECF5FF" strokeWidth={1.5} fill="none"/>
    <rect x={59} y={6} width={17} height={6} rx={1.5} fill="#ECF5FF"/>
    <rect x={81} y={7} width={2} height={4} rx={1} fill="#ECF5FF"/>
   </g>
   <circle cx={w/2} cy={151} r={41} stroke="#4FE5D6" strokeWidth={2.4}
     fill="#063746" fillOpacity=".40"/>
   <Person cx={w/2} cy={156} color="#6BEBE0" scale={.55}/>
   <Text x={w/2} y={226} size={34} weight={785} anchor="middle">Log in</Text>
   <Text x={w/2} y={258} size={17} color="#B0C5DA" anchor="middle">Welcome back</Text>
   <rect x={25} y={305} width={w-50} height={56} rx={10}
     fill="#092743" stroke="#3972A0" strokeWidth={1.6}/>
   <path d="M 40 322 h 19 v 14 h -19 Z M 40 322 l 9.5 8 l 9.5 -8"
     stroke="#78BCE5" fill="none" strokeWidth={1.7} strokeLinejoin="round"/>
   <Text x={69} y={338} size={17} color="#E1EDFF" weight={590}>{email.slice(0,letters)}</Text>
   <rect x={25} y={375} width={w-50} height={56} rx={10}
     fill="#092743" stroke="#3972A0" strokeWidth={1.6}/>
   <path d="M 43 394 v -5 a 7 7 0 0 1 14 0 v 5 M 40 394 h 20 v 17 h -20 Z"
     stroke="#78BCE5" fill="none" strokeWidth={1.8} strokeLinejoin="round"/>
   <Text x={70} y={407} size={22} color="#EAF6FF" spacing={2.5}>
    {'•'.repeat(Math.ceil(clamp(progress)*9))}
   </Text>
   <rect x={w/2-47} y={h-17} width={94} height={4} rx={2} fill="#EAF5FF" opacity=".85"/>
  </g>
  <rect x={w/2-50} y={15} width={100} height={25} rx={13}
    fill="#010A16" stroke="#162B41" strokeWidth={.9}/>
  <circle cx={w/2+31} cy={27.5} r={4.5} fill="#162C42"/>
  <circle cx={w/2+31} cy={27.5} r={2.2} fill="#274D71"/>
  <path d={'M 19 62 Q 10 '+(h/2)+' 21 '+(h-58)}
    stroke="#DAF3FF" strokeWidth={1.2} fill="none" opacity=".10"/>
 </g>;
};

const FrameBackdrop:React.FC=()=> <g>
  <rect width={W} height={H} fill="#081B34"/>
  <rect width={W} height={H} fill="url(#background)"/>
  {Array.from({length:11},(_,i)=><path key={i}
    d={'M '+(i*225-190)+' 0 V 1080'} stroke="#204C78" strokeOpacity={i===5?.25:.13} strokeWidth={1.3}/>)}
  {Array.from({length:7},(_,i)=><path key={i}
    d={'M 0 '+(i*177-10)+' H 1920'} stroke="#204C78" strokeOpacity=".15" strokeWidth={1}/>)}
  <ellipse cx={960} cy={540} rx={855} ry={920} stroke="#265BC9" strokeOpacity=".42"
    strokeWidth={1.6} fill="none"/>
  <ellipse cx={960} cy={540} rx={770} ry={860} stroke="#3A5FAC" strokeOpacity=".15"
    strokeWidth={1.1} fill="none"/>
  {Array.from({length:9},(_,i)=>Array.from({length:3},(_,j)=>
    <circle key={i+'-'+j} cx={70+i*29} cy={270+j*30} r={1.7} fill="#4780E0" opacity=".42"/>))}
  {Array.from({length:9},(_,i)=>Array.from({length:3},(_,j)=>
    <circle key={'r'+i+'-'+j} cx={1600+i*29} cy={270+j*30} r={1.7} fill="#4780E0" opacity=".42"/>))}
 </g>;

const Header:React.FC=()=> <g>
  <Text x={960} y={190} size={88} weight={860} anchor="middle">Auth Service</Text>
  <Text x={960} y={259} size={34} color={MUTED} anchor="middle" weight={480}>
    A login request has arrived. But identity is not proven yet.
  </Text>
  <path d="M 912 300 H 1008" stroke="#3A62D6" strokeWidth={3.2} strokeLinecap="round"/>
</g>;

const Hero:React.FC<{f:number;from:number}>=({f,from})=><g>
  <Panel x={230} y={432} w={555} h={354} kind="teal" accent={TEAL}>
    <circle cx={508} cy={554} r={76} stroke={TEAL} strokeWidth={3.2}
      fill="#0B453E" fillOpacity=".48"/>
    <Person cx={508} cy={561} scale={1.55}/>
    <Text x={508} y={721} anchor="middle" size={44} weight={800}>Login request</Text>
  </Panel>
  <Arrow x1={786} x2={1133} y={609} progress={move(f,from+12,from+50)}/>
  <Panel x={1135} y={432} w={555} h={354} kind="purple" accent={PURPLE}>
    <Question cx={1412} cy={554} r={75}/>
    <Text x={1412} y={721} anchor="middle" size={44} weight={800}>Who is this?</Text>
  </Panel>
</g>;

const Credentials:React.FC<{phone:number;email:number;secret:number}>=({phone,email,secret})=><g>
  <Phone x={225} y={375} progress={phone} w={300} h={530}/>
  <Text x={705} y={415} size={28} color={MUTED} weight={660}>WHAT THE APP SENDS</Text>
  <Arrow x1={550} x2={681} y={628} progress={email}/>
  <g opacity={email}>
    <Panel x={710} y={475} w={884} h={148} accent={BLUE} kind="blue" radius={21}>
      <circle cx={779} cy={525} r={26} fill={BLUE} fillOpacity=".09" stroke={BLUE} strokeWidth={2}/>
      <Person cx={779} cy={528} scale={.46} color={BLUE}/>
      <Text x={825} y={535} color={MUTED} size={22} weight={730} spacing={1}>ACCOUNT IDENTIFIER</Text>
      <Text x={770} y={595} size={37} weight={760}>alex@example.com</Text>
    </Panel>
  </g>
  <g opacity={secret}>
    <Panel x={710} y={656} w={884} h={148} accent={PURPLE} kind="purple" radius={21}>
      <circle cx={779} cy={710} r={26} fill={PURPLE} fillOpacity=".10"
        stroke={PURPLE} strokeWidth={2}/>
      <rect x={770} y={708} width={18} height={16} rx={3.2}
        fill="none" stroke={PURPLE} strokeWidth={2.8}/>
      <path d="M 773 708 v -5 a 6 6 0 0 1 12 0 v 5" fill="none"
        stroke={PURPLE} strokeWidth={2.8} strokeLinecap="round"/>
      <Text x={825} y={715} color={MUTED} size={22} weight={730} spacing={1}>SUBMITTED SECRET</Text>
      <Text x={770} y={773} size={36} weight={780} spacing={5}>•••••••••</Text>
    </Panel>
  </g>
  <Text x={1152} y={869} size={26} weight={600} color={MUTED}
    anchor="middle" opacity={secret}>
    Submitted data is not verified identity.
  </Text>
</g>;

type ValidateName='presence'|'email'|'limit';
const ValidateCard:React.FC<{x:number;accent:string;name:ValidateName;opacity:number;progress:number}>=({
 x,accent,name,opacity,progress
})=>{
 const title=name==='presence'?'01 / Fields present':name==='email'?'02 / Email format':'03 / Input size';
 const info=name==='presence'?'Both fields exist':name==='email'?'Email structure':'Input within policy';
 return <g opacity={opacity} transform={'translate(0 '+(26*(1-opacity))+')'}>
  <Panel x={x} y={442} w={375} h={388}
    accent={accent} kind={name==='presence'?'teal':name==='email'?'blue':'purple'}>
    <circle cx={x+187} cy={515} r={45} stroke={accent} strokeWidth={3}
      fill={accent} fillOpacity=".08"/>
    {name==='presence'?<g stroke={accent} fill="none" strokeWidth={3.6}>
      <rect x={x+173} y={493} width={29} height={41} rx={3}/>
      <path d={'M '+(x+180)+' 507 h 17 M '+(x+180)+' 515 h 17 M '+(x+180)+' 523 h 11'}/>
    </g>:name==='email'?
      <Text x={x+187} y={531} size={52} color={accent} anchor="middle" weight={820}>@</Text>
      :<g fill="none" stroke={accent} strokeWidth={3.4}>
        <rect x={x+161} y={504} width={52} height={23} rx={3}/>
        {[0,1,2,3].map(i=><path key={i} d={'M '+(x+170+i*12)+' 504 v 10'}/>)}
      </g>}
    <Text x={x+187} y={615} size={29} weight={820} anchor="middle">{title}</Text>
    {name==='presence'?<>
      <rect x={x+39} y={648} width={297} height={46} rx={10}
        fill="#07182C" stroke="#416E86" strokeWidth={1.5}/>
      <Text x={x+64} y={680} size={22}>alex@example.com</Text>
      <rect x={x+39} y={703} width={297} height={46} rx={10}
        fill="#07182C" stroke="#416E86" strokeWidth={1.5}/>
      <Text x={x+65} y={734} size={25} spacing={3}>•••••••••</Text>
    </>:name==='email'?<>
      <rect x={x+33} y={662} width={309} height={83} rx={13}
        fill="#0B223F" stroke="#235A91" strokeWidth={1.5}/>
      <Text x={x+187} y={712} size={25} anchor="middle" weight={690}>
        <tspan>alex</tspan><tspan fill={TEAL}>@</tspan><tspan>example.com</tspan>
      </Text>
    </>:<>
      <rect x={x+41} y={679} width={293} height={19} rx={10} fill="#283D61"/>
      <rect x={x+41} y={679} width={200*progress} height={19} rx={10} fill={TEAL}/>
      <Text x={x+187} y={738} size={21} anchor="middle" color={MUTED}>Within acceptable limits</Text>
    </>}
    <path d={'M '+(x+39)+' 773 h 297'} stroke="#294D72" strokeWidth={1.5}/>
    <Text x={x+187} y={808} size={22} anchor="middle" color={MUTED}>{info}</Text>
  </Panel>
 </g>;
};

const Validation:React.FC<{
 phone:number;p1:number;p2:number;p3:number;valid:number
}>=({phone,p1,p2,p3,valid})=><g>
  <Text x={960} y={377} size={44} weight={800} anchor="middle">Is this request usable?</Text>
  <g opacity={Math.max(.36,1-p1*.6)}>
    <Phone x={108} y={392} w={275} h={493} progress={phone}/>
  </g>
  <Arrow x1={400} x2={462} y={642} progress={p1}/>
  <ValidateCard x={470} accent={TEAL} name="presence" opacity={p1} progress={p1}/>
  {p2>.05&&<Arrow x1={846} x2={881} y={642} progress={p2}/>}
  <ValidateCard x={884} accent={BLUE} name="email" opacity={p2} progress={p2}/>
  {p3>.05&&<Arrow x1={1260} x2={1295} y={642} progress={p3}/>}
  <ValidateCard x={1298} accent={PURPLE} name="limit" opacity={p3} progress={p3}/>
  <g opacity={valid}>
    <rect x={329} y={935} width={1264} height={75} rx={19}
      fill="#0B1C35" stroke="#345DA5" strokeWidth={1.9}/>
    <circle cx={381} cy={973} r={20} fill="#162449" stroke={PURPLE} strokeWidth={2.5}/>
    <Text x={381} y={982} size={26} color={PURPLE} anchor="middle" weight={850}>i</Text>
    <Text x={964} y={983} size={26} weight={650} anchor="middle">
      The request may be valid in form, while the password is still unproven.
    </Text>
  </g>
</g>;

const Facts:React.FC<{show:number;lookup:number}>=({show,lookup})=><g>
  <Text x={960} y={399} size={39} anchor="middle" weight={800}>
    The request passed. But proof still depends on stored account data.
  </Text>
  <Panel x={175} y={478} w={610} h={344} accent={TEAL} kind="teal">
    <circle cx={258} cy={566} r={43} fill={TEAL} fillOpacity=".07"
      stroke={TEAL} strokeWidth={3}/>
    <Tick cx={258} cy={567}/>
    <Text x={335} y={580} size={39} weight={800}>Submitted</Text>
    <Text x={239} y={679} size={32} weight={710} color={MUTED}>alex@example.com</Text>
    <Text x={239} y={743} size={29} weight={670} color={MUTED}>password: •••••••••</Text>
  </Panel>
  <path d="M 790 652 H 879" stroke={TEAL} strokeWidth={5} strokeDasharray="4 21"
    strokeLinecap="round"/>
  <path d="M 1042 652 H 1129" stroke={PURPLE} strokeWidth={5} strokeDasharray="4 21"
    strokeLinecap="round"/>
  <Question cx={960} cy={652} r={68}/>
  <Panel x={1134} y={478} w={610} h={344} accent={PURPLE} kind="purple">
    <circle cx={1216} cy={566} r={43} fill={PURPLE} fillOpacity=".08"
      stroke={PURPLE} strokeWidth={3}/>
    <Search cx={1216} cy={566} scale={.82}/>
    <Text x={1282} y={578} size={32} weight={800}>Account facts needed</Text>
    <Text x={1201} y={686} size={26} color={MUTED}>The service needs stored account</Text>
    <Text x={1201} y={724} size={26} color={MUTED}>data before it can verify the</Text>
    <Text x={1201} y={762} size={26} color={MUTED}>submitted password.</Text>
  </Panel>
  {lookup>.01 && <g opacity={lookup} transform={'translate(0 '+(14*(1-lookup))+')'}>
    <rect x={715} y={878} width={490} height={72} rx={36}
      fill="#092A3B" stroke={BLUE} strokeWidth={2.6}/>
    <circle cx={770} cy={914} r={10} fill={BLUE}/>
    <Text x={1010} y={924} anchor="middle" size={26} weight={790}
      color="#74E0FC" spacing={.7}>USER LOOKUP CREATED</Text>
  </g>}
</g>;

const ReturnMap:React.FC<{
  progress:number;waiting:number;travel:number;internal:number;question:number;
  account:number;facts:number;frame:number
}>=({progress,waiting,travel,question,account,facts,frame})=>{
  const arrival=clamp((travel-.80)/.20);
  const active=clamp(Math.max(arrival,question*.38,account*.95,facts));
  const cycle=((frame*.013)%1+1)%1;
  const scanY=559+123*cycle;
  const shimmer=.5+.5*Math.sin(frame*.085);
  const sourceX=1589,destinationX=1733,lineY=613;
  const packetX=sourceX+(destinationX-sourceX)*travel;
  const moving=clamp(travel*9)*(1-clamp((travel-.91)/.09));
  return <g opacity={progress} pointerEvents="none">
    <defs>
      <linearGradient id="v10-transfer" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#36DDC5" stopOpacity=".40"/>
        <stop offset="65%" stopColor="#36D9FF" stopOpacity=".92"/>
        <stop offset="100%" stopColor="#8CEFFF" stopOpacity="1"/>
      </linearGradient>
      <linearGradient id="v10-database-casing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#082F58"/>
        <stop offset=".52" stopColor="#075282"/>
        <stop offset="1" stopColor="#041B3B"/>
      </linearGradient>
      <linearGradient id="v10-database-scan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#04CAFB" stopOpacity="0"/>
        <stop offset="47%" stopColor="#13DBFF" stopOpacity=".21"/>
        <stop offset="72%" stopColor="#00E5FF" stopOpacity=".83"/>
        <stop offset="100%" stopColor="#00D4FA" stopOpacity="0"/>
      </linearGradient>
      <clipPath id="v10-db-window">
        <rect x={1635} y={552} width={199} height={153} rx={10}/>
      </clipPath>
    </defs>
    <g opacity={waiting}>
      <rect x={1363} y={507} width={231} height={207} rx={18}
        fill="#36DEB9" fillOpacity=".025" stroke="#46EBCB" strokeWidth={2.8}
        strokeOpacity=".86"/>
      <circle cx={1612} cy={613} r={13} fill="#45F0C7" opacity=".19"/>
      <circle cx={1612} cy={613} r={8.5} fill="#4CDEBF"
        stroke="#B1FFF0" strokeWidth={1.6}/>
      <Text x={1483} y={765} size={22} weight={800} anchor="middle"
        color="#5AEBD0" spacing={.5}>LOGIN WAITING</Text>
    </g>
    <g opacity={clamp(travel*8)}>
      <path d="M 1590 613 H 1733" stroke="#275779" strokeWidth={2.2}
        fill="none" strokeDasharray="4 9" strokeLinecap="round"/>
      <path d={"M 1590 613 H "+Math.max(sourceX,packetX)}
        stroke="url(#v10-transfer)" strokeWidth={4.3}
        fill="none" strokeLinecap="round"/>
      <circle cx={packetX} cy={lineY} r={17} fill="#29C8FC"
        fillOpacity={.16*moving}/>
      <circle cx={packetX} cy={lineY} r={7.3} fill="#72E6FF"
        stroke="#ECFFFF" strokeWidth={1.5} opacity={moving}/>
    </g>
    <g opacity={active}>
      <rect x={1622} y={505} width={226} height={213} rx={17}
        fill="#0A5595" fillOpacity=".11"
        stroke="#38C9FF" strokeWidth={3.2}
        strokeOpacity={.70+.14*shimmer}/>
      <g clipPath="url(#v10-db-window)">
        <rect x={1635} y={552} width={199} height={153}
          fill="#051F3E" fillOpacity=".86"/>
        <g opacity={.98}>
          {[0,1,2].map((index)=>{
            const top=562+index*43;
            const lit=Math.max(.05,1-Math.abs(cycle*3-index-.5)*1.10);
            return <g key={'v10-db-slab-'+index}>
              <rect x={1659} y={top+4} width={148} height={29} rx={5}
                fill="url(#v10-database-casing)" stroke="#26AEE0"
                strokeWidth={1.3} strokeOpacity={.47+.38*lit}/>
              <ellipse cx={1733} cy={top+5} rx={73.5} ry={10.5}
                fill="#064872" stroke="#5DD8FF"
                strokeWidth={1.5} strokeOpacity={.55+.42*lit}/>
              <ellipse cx={1733} cy={top+5} rx={57} ry={6.7}
                fill="none" stroke="#48DBFF" strokeWidth={1.3}
                strokeOpacity={.40+.44*lit}/>
              <path d={"M 1660 "+(top+26)+" Q 1733 "+(top+42)+" 1806 "+(top+26)}
                stroke="#23E1FF" strokeWidth={2.4} fill="none"
                strokeOpacity={.39+.52*lit}/>
              <path d={"M 1680 "+(top+14)+" h 70 M 1763 "+(top+14)+" h 28"}
                stroke="#A2EEFF" strokeWidth={2.3} strokeLinecap="round"
                opacity={.33+.58*lit}/>
              <circle cx={1669} cy={top+16} r={3.2} fill="#55F5FE"
                opacity={.55+.38*lit}/>
            </g>;
          })}
        </g>
        <rect x={1635} y={scanY-23} width={199} height={35}
          fill="url(#v10-database-scan)" opacity={.93}/>
        <path d={"M 1643 "+scanY+" H 1825"} stroke="#88F7FF"
          strokeWidth={3.4} strokeLinecap="round"
          opacity={.88+.12*shimmer}/>
        <path d={"M 1646 "+(scanY-5)+" H 1822"}
          stroke="#10E8FF" strokeWidth={9} strokeLinecap="round"
          opacity=".20"/>
      </g>
      <circle cx={1733} cy={613} r={33} fill="none"
        stroke="#4EE7FF" strokeWidth={2.2}
        strokeOpacity={.32+.15*shimmer}/>
    </g>
  </g>;
};

export const AuthServiceTier2Shot08BridgeV8:React.FC<Props>=({
 durationInFrames,anchors={},clipStarts=[]
})=>{
 const frame=useCurrentFrame();
 const fallback=[0,.2,.4,.6,.8].map(v=>Math.floor(durationInFrames*v));
 const starts=fallback.map((v,i)=>Number.isFinite(clipStarts[i])?clipStarts[i]:v);
 const cue=(key:string,clip:number,f:number)=>Number.isFinite(anchors[key])?
   Math.round(anchors[key]*30):starts[clip]+f;
 const a=starts[0],b=cue('INBOX_OPEN',1,12),c=cue('VALIDATION_NAME',2,12),
       d=cue('CHECKS_PASSED',3,5),e=cue('ORIGINAL_STAYS',4,5);
 const hero=stage(frame,a+12,b-8),credentials=stage(frame,b-10,c-7);
 const validation=stage(frame,c-12,d-6),facts=stage(frame,d-10,e+17);
 const mapIn=move(frame,e+10,e+56);
 const entered=move(frame,a+2,a+24);
 const sceneOpacity=entered*(1-mapIn);
 const waiting=move(frame,cue('ORIGINAL_STAYS',4,5)-10,cue('ORIGINAL_STAYS',4,5)+18);
 const internal=move(frame,cue('NOT_SECOND_LOGIN',4,76)-9,cue('NOT_SECOND_LOGIN',4,76)+23)*
   (1-move(frame,cue('LOOKUP_ACCOUNT',4,130)-14,cue('LOOKUP_ACCOUNT',4,130)+16));
 const question=move(frame,cue('SERVICE_QUESTION',4,108)-9,cue('SERVICE_QUESTION',4,108)+35);
 const account=move(frame,cue('LOOKUP_ACCOUNT',4,130)-7,cue('LOOKUP_ACCOUNT',4,130)+24)*
   (1-move(frame,cue('INFORMATION_FOR_VERIFY',4,154)-8,cue('INFORMATION_FOR_VERIFY',4,154)+16));
 const stored=move(frame,cue('INFORMATION_FOR_VERIFY',4,154)-8,cue('INFORMATION_FOR_VERIFY',4,154)+22);
 const inputEmail=move(frame,cue('INPUT_FIELDS',1,20)-8,cue('IDENTIFIER_ROLE',1,65)+14);
 const inputSecret=move(frame,cue('SECRET_ROLE',1,91)-11,cue('SECRET_ROLE',1,91)+28);
 const present=move(frame,cue('EMPTY_FIELD_EXAMPLE',2,45)-7,cue('EMPTY_FIELD_EXAMPLE',2,45)+24);
 const format=move(frame,cue('FORMAT_EXAMPLE',2,77)-7,cue('FORMAT_EXAMPLE',2,77)+24);
 const limits=move(frame,cue('LIMITS_CHECK',2,170)-9,cue('LIMITS_CHECK',2,170)+25);
 const valid=move(frame,cue('VALID_NOT_LOGIN',2,210)-7,cue('VALID_NOT_LOGIN',2,210)+28);
 const lookupBorn=move(frame,cue('LOOKUP_BORN',3,125)-5,cue('LOOKUP_BORN',3,125)+30);
 const lookupTravel=move(frame,cue('LOOKUP_TRAVELS',4,44)-8,cue('LOOKUP_TRAVELS',4,44)+65);
 return <div style={{position:'absolute',inset:0,overflow:'hidden',
   background:BG,fontFamily:AT_FONT,isolation:'isolate'}}>
   <div style={{position:'absolute',inset:0,zIndex:0}}>
     <NetworkTransitYoutubePreview showGuides={false}
       frameOverride={SHOT04_DURATION_FRAMES-1} gatewayHandoff={315}
       balancerHandoff={300} balancerActive={.4}
       balancerIntroArrival={1} balancerIntroSelected={1} balancerIntroFlow={1}
       balancerIntroFrame={5100} balancerIntroHandoff={1}
       authActive={1} networkActiveMultiplier={0}/>
   </div>
   <div style={{position:'absolute',inset:0,zIndex:1,pointerEvents:'none',
      background:'linear-gradient(125deg,rgba(12,39,73,.56),rgba(8,28,54,.42) 45%,rgba(12,39,73,.51))',
      mixBlendMode:'screen'}}/>
   {frame>=a+2 && sceneOpacity>0 && (
     <div style={{position:'absolute',inset:0,zIndex:20,opacity:sceneOpacity,
       background:BG,overflow:'hidden',isolation:'isolate'}}>
       <svg viewBox="0 0 1920 1080" width="100%" height="100%"
         style={{display:'block',width:'100%',height:'100%',position:'absolute',inset:0}}>
   <defs>
    <radialGradient id="background"><stop offset="0" stopColor="#12385B"/>
      <stop offset=".72" stopColor="#0A2746"/><stop offset="1" stopColor="#081B34"/></radialGradient>
    <linearGradient id="cardTeal" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stopColor="#104A45"/><stop offset="1" stopColor="#042B2B"/></linearGradient>
    <linearGradient id="cardBlue" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stopColor="#103459"/><stop offset="1" stopColor="#061A3D"/></linearGradient>
    <linearGradient id="cardPurple" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stopColor="#253861"/><stop offset="1" stopColor="#101B43"/></linearGradient>
    <linearGradient id="phoneFace" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#09213C"/><stop offset="1" stopColor="#020B19"/></linearGradient>
    <filter id="softBloom" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="15"/></filter>
   </defs>
         <FrameBackdrop/>
         <Header/>
         <g opacity={hero}><Hero f={frame} from={a}/></g>
         <g opacity={credentials}>
           <Credentials phone={inputEmail} email={inputEmail} secret={inputSecret}/>
         </g>
         <g opacity={validation}>
           <Validation phone={1} p1={present} p2={format} p3={limits} valid={valid}/>
         </g>
         <g opacity={facts}><Facts show={facts} lookup={lookupBorn}/></g>
       </svg>
     </div>
   )}
   {mapIn>0 && (
     <svg viewBox="0 0 1920 1080" width="100%" height="100%"
       style={{position:'absolute',inset:0,zIndex:30,pointerEvents:'none'}}>
       <defs>
         <filter id="softBloom" x="-60%" y="-60%" width="220%" height="220%">
           <feGaussianBlur stdDeviation="15"/>
         </filter>
       </defs>
       <ReturnMap progress={mapIn} waiting={waiting} travel={lookupTravel}
         internal={internal} question={question} account={account}
         facts={stored} frame={frame}/>
     </svg>
   )}
 </div>;
};
