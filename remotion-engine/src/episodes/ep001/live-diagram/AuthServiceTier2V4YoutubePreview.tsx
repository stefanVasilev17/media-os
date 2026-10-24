import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props = {durationInFrames:number; anchors?:Record<string,number>; clipStarts?:number[]};
const W=1920, H=1080, BG='#030D1D', WHITE='#F6F8FF', MUTED='#B2C5E1';
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
 const e='alex@example.com';
 const letters=Math.floor(e.length*clamp(progress));
 return <g transform={'translate('+x+' '+y+')'}>
  <rect x={-5} y={7} width={w+10} height={h+4} rx={47}
    fill="#030916" stroke="#3C6EA5" strokeWidth={3}/>
  <rect width={w} height={h} rx={43} fill="url(#phoneFace)" stroke="#80A5CD" strokeWidth={2}/>
  <rect x={w/2-45} y={14} width={90} height={19} rx={10} fill="#030916"/>
  <Text x={32} y={46} size={15} color={WHITE} weight={800}>9:41</Text>
  <circle cx={w/2} cy={118} r={39} stroke={TEAL} strokeWidth={2.5}
    fill={TEAL} fillOpacity=".06"/>
  <Person cx={w/2} cy={120} scale={.6}/>
  <Text x={w/2} y={204} size={32} weight={760} anchor="middle">Log in</Text>
  <Text x={w/2} y={236} size={17} color={MUTED} anchor="middle">Welcome back</Text>
  <rect x={27} y={283} width={w-54} height={60} rx={12}
    fill="#0B213C" stroke="#41688F" strokeWidth={1.7}/>
  <Text x={43} y={320} size={19} color={WHITE}>{e.slice(0,letters)}</Text>
  <rect x={27} y={356} width={w-54} height={60} rx={12}
    fill="#0B213C" stroke="#41688F" strokeWidth={1.7}/>
  <Text x={47} y={392} size={24} spacing={3}>{'•'.repeat(Math.ceil(progress*9))}</Text>
  <rect x={27} y={450} width={w-54} height={61} rx={12} fill="url(#continueGradient)"
    stroke={TEAL} strokeWidth={1.5}/>
  <Text x={w/2} y={488} anchor="middle" size={23} weight={780}>Continue</Text>
 </g>;
};

const FrameBackdrop:React.FC=()=> <g>
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
      <path d="M 774 713 a 11 11 0 1 1 11 11 h 13 v 10 h -9"
        fill="none" stroke={PURPLE} strokeWidth={3.4}/>
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
  {lookup>.01 && <g opacity={lookup}>
    <rect x={766} y={879} width={389} height={70} rx={35}
      fill="#0A263B" stroke={BLUE} strokeWidth={2.1}/>
    <Search cx={806} cy={913} color={BLUE} scale={.65}/>
    <Text x={967} y={923} anchor="middle" size={26} weight={790} color={BLUE}>
      USER LOOKUP CREATED
    </Text>
  </g>}
</g>;

const ReturnMap:React.FC<{progress:number;lookup:number}>=({progress,lookup})=><g opacity={progress}>
  <rect x={228} y={100} width={1464} height={167} rx={26} fill="#07172D"
    stroke="#345779" strokeWidth={2}/>
  <Text x={960} y={163} size={34} weight={790} anchor="middle">Two requests. Two different jobs.</Text>
  <circle cx={484} cy={213} r={10} fill={TEAL}/>
  <Text x={508} y={224} size={26}>Login stays in Auth</Text>
  <circle cx={1011} cy={213} r={10} fill={BLUE}/>
  <Text x={1035} y={224} size={26}>Lookup asks User Database</Text>
  <g opacity={lookup}>
    <rect x={1245} y={834} width={515} height={115} rx={19}
      fill="#081B32" stroke={BLUE} strokeWidth={2}/>
    <Search cx={1293} cy={874} color={BLUE} scale={.78}/>
    <Text x={1340} y={879} size={27} weight={830} color={BLUE}>USER LOOKUP</Text>
    <Text x={1283} y={924} size={24}>email = alex@example.com</Text>
    <path d="M 1600 643 H 1690" stroke={BLUE} strokeWidth={3.5}
      strokeLinecap="round" opacity=".8"/>
    <circle cx={1600+90*lookup} cy={643} r={11} fill={BLUE}/>
  </g>
</g>;

export const AuthServiceTier2V4YoutubePreview:React.FC<Props>=({
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
 const mapIn=move(frame,e+2,e+62);
 const entered=move(frame,a+3,a+46);
 const inputEmail=move(frame,cue('INPUT_FIELDS',1,20)-8,cue('IDENTIFIER_ROLE',1,65)+14);
 const inputSecret=move(frame,cue('SECRET_ROLE',1,91)-11,cue('SECRET_ROLE',1,91)+28);
 const present=move(frame,cue('EMPTY_FIELD_EXAMPLE',2,45)-7,cue('EMPTY_FIELD_EXAMPLE',2,45)+24);
 const format=move(frame,cue('FORMAT_EXAMPLE',2,77)-7,cue('FORMAT_EXAMPLE',2,77)+24);
 const limits=move(frame,cue('LIMITS_CHECK',2,170)-9,cue('LIMITS_CHECK',2,170)+25);
 const valid=move(frame,cue('VALID_NOT_LOGIN',2,210)-7,cue('VALID_NOT_LOGIN',2,210)+28);
 const lookupBorn=move(frame,cue('LOOKUP_BORN',3,125)-5,cue('LOOKUP_BORN',3,125)+30);
 const lookupTravel=move(frame,cue('LOOKUP_TRAVELS',4,44)-8,cue('LOOKUP_TRAVELS',4,44)+65);
 return <div style={{position:'absolute',inset:0,overflow:'hidden',background:BG,fontFamily:AT_FONT}}>
  <div style={{position:'absolute',inset:0,opacity:1-entered*.7+mapIn*.7}}>
    <NetworkTransitYoutubePreview showGuides={false}
      frameOverride={SHOT04_DURATION_FRAMES-1} gatewayHandoff={315}
      balancerHandoff={300} balancerActive={.4}
      balancerIntroArrival={1} balancerIntroSelected={1} balancerIntroFlow={1}
      balancerIntroFrame={5100} balancerIntroHandoff={1}
      authActive={1} networkActiveMultiplier={0}/>
  </div>
  <svg viewBox="0 0 1920 1080" width="100%" height="100%"
    style={{position:'absolute',inset:0,overflow:'hidden'}}>
   <defs>
    <radialGradient id="background"><stop offset="0" stopColor="#071E39"/>
      <stop offset=".72" stopColor="#031326"/><stop offset="1" stopColor="#020B18"/></radialGradient>
    <linearGradient id="cardTeal" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stopColor="#104A45"/><stop offset="1" stopColor="#042B2B"/></linearGradient>
    <linearGradient id="cardBlue" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stopColor="#103459"/><stop offset="1" stopColor="#061A3D"/></linearGradient>
    <linearGradient id="cardPurple" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stopColor="#253861"/><stop offset="1" stopColor="#101B43"/></linearGradient>
    <linearGradient id="phoneFace" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#09213C"/><stop offset="1" stopColor="#020B19"/></linearGradient>
    <linearGradient id="continueGradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#14A99D"/><stop offset="1" stopColor="#067B7B"/></linearGradient>
    <filter id="softBloom" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="15"/></filter>
   </defs>
   <g opacity={entered*(1-mapIn)}><FrameBackdrop/><Header/></g>
   <g opacity={hero}><Hero f={frame} from={a}/></g>
   <g opacity={credentials}><Credentials phone={inputEmail} email={inputEmail} secret={inputSecret}/></g>
   <g opacity={validation}><Validation phone={1} p1={present} p2={format} p3={limits} valid={valid}/></g>
   <g opacity={facts}><Facts show={facts} lookup={lookupBorn}/></g>
   <ReturnMap progress={mapIn} lookup={lookupTravel}/>
  </svg>
 </div>;
};
