import React from 'react';
import {Html5Audio, Sequence, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';

const W=1920;
const H=1080;
const FPS=30;
const LENGTH=72;
const C={
  bg:'#020811', bgGlow:'#0B2340', panel:'#17385F', panelDeep:'#102B4A',
  panelBright:'#245486', outline:'#5180AD', text:'#F3F7FF',
  secondary:'#AFC5DB', cyan:'#38CFF2', blue:'#60A5FA',
  green:'#31D69B', purple:'#AA8DFF', amber:'#F4B94F', ink:'#062236',
};
type AudioClip={src:string;fromFrame:number;durationInFrames:number;trimBeforeFrames?:number};
type Props={durationInFrames?:number;audioClips?:AudioClip[]};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(t:number,a:number,b:number)=>{
  const v=clamp((t-a)/Math.max(.001,b-a));
  return v*v*(3-2*v);
};
const envelope=(t:number,a:number,b:number,first=false,last=false)=>
  (first?1:ease(t,a,a+.85))*(last?1:1-ease(t,b-.85,b));
const lerp=(a:number,b:number,k:number)=>a+(b-a)*k;

const Txt:React.FC<{
  x:number;y:number;children:React.ReactNode;size?:number;weight?:number;
  color?:string;anchor?:'start'|'middle'|'end';opacity?:number;tracking?:number;
}>=({x,y,children,size=30,weight=670,color=C.text,anchor='start',opacity=1,tracking=0})=>
  <text x={x} y={y} fontFamily={AT_FONT} fontSize={size}
    fill={color} opacity={opacity} fontWeight={weight}
    textAnchor={anchor} letterSpacing={tracking}>{children}</text>;

const Panel:React.FC<{
  x:number;y:number;w:number;h:number;accent?:string;fill?:string;
  opacity?:number;children?:React.ReactNode;radius?:number;
}>=({x,y,w,h,accent=C.blue,fill=C.panel,opacity=1,children,radius=26})=>
  <g opacity={opacity}>
    <rect x={x+5} y={y+11} width={w} height={h} rx={radius} fill="#000611" opacity=".3"/>
    <rect x={x} y={y} width={w} height={h} rx={radius}
      fill={fill} stroke={accent} strokeOpacity=".64" strokeWidth={2.5}/>
    <path d={'M '+(x+24)+' '+(y+2)+' H '+(x+w-24)} stroke={accent}
      strokeWidth={3} strokeOpacity=".38" strokeLinecap="round"/>
    {children}
  </g>;

const Pill:React.FC<{
  x:number;y:number;w:number;label:string;color?:string;fill?:string;check?:boolean;
  opacity?:number;h?:number;fontSize?:number;
}>=({x,y,w,label,color=C.cyan,fill=C.panelDeep,check=false,opacity=1,h=54,fontSize=25})=>{
  const usable=w-(check?94:54);
  const estimated=(label.length*0.60+2)*fontSize;
  const fitted=Math.max(11,Math.min(fontSize,fontSize*usable/Math.max(usable,estimated)));
  return <g opacity={opacity}>
    <rect x={x} y={y} width={w} height={h} rx={h*.27} fill={fill}
      stroke={color} strokeWidth={2} strokeOpacity=".82"/>
    <Txt x={x+(w-(check?62:0))/2} y={y+(h+fitted*.68)/2} size={fitted}
      weight={780} color={color} anchor="middle">{label}</Txt>
    {check&&<Check x={x+w-30} y={y+h/2} r={18}/>}
  </g>;


const Check:React.FC<{x:number;y:number;r?:number;color?:string}>=
  ({x,y,r=24,color=C.green})=>
  <g>
    <circle cx={x} cy={y} r={r} fill={color}/>
    <path d={'M '+(x-.43*r)+' '+y+' L '+(x-.13*r)+' '+(y+.28*r)+
      ' L '+(x+.48*r)+' '+(y-.39*r)}
      stroke={C.ink} strokeWidth={r*.20} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </g>;

const Arrow:React.FC<{d:string;color?:string;opacity?:number;width?:number;dashed?:boolean}>=
 ({d,color=C.cyan,opacity=1,width=5,dashed=false})=>
 <path d={d} fill="none" stroke={color} strokeOpacity={opacity}
   strokeWidth={width} strokeDasharray={dashed?'13 13':undefined}
   strokeLinecap="round" strokeLinejoin="round"/>;

const Head:React.FC<{title:string;subtitle:string}>=({title,subtitle})=>
  <g>
    <Txt x={131} y={202} size={49} weight={875}>{title}</Txt>
    <Txt x={134} y={247} size={26} color={C.secondary} weight={520}>{subtitle}</Txt>
  </g>;

type PhonePhase='waiting'|'received'|'dashboard'|'login';
const Phone:React.FC<{
  x:number;y:number;scale?:number;phase?:PhonePhase;
  time?:number;fillProgress?:number;
}>=({x,y,scale=1,phase='waiting',time=0,fillProgress=0})=>{
  const dashboard=phase==='dashboard';
  const isWaiting=phase==='waiting';
  const received=phase==='received';
  const rejection=phase==='login';
  return <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
    <rect x="-7" y="105" width="7" height="57" rx="3" fill="#70809B"/>
    <rect x="-7" y="184" width="7" height="74" rx="3" fill="#70809B"/>
    <rect x="270" y="158" width="7" height="93" rx="3" fill="#7A90AC"/>
    <rect x="-5" y="-5" width="280" height="505" rx="49" fill="#03070D" stroke="#64758A" strokeWidth="7"/>
    <rect x="7" y="7" width="256" height="481" rx="39" fill={dashboard?'#EEF4FA':'#F5F8FC'}/>
    <rect x="83" y="13" width="104" height="24" rx="12" fill="#020509"/>
    <circle cx="174" cy="25" r="4" fill="#1A2631"/>
    <Txt x={32} y={32} size={15} weight={850} color="#1B304A">9:41</Txt>
    <g fill="#1B304A">
      <rect x="203" y="25" width="5" height="6" rx="1"/>
      <rect x="211" y="21" width="5" height="10" rx="1"/>
      <rect x="219" y="17" width="5" height="14" rx="1"/>
      <rect x="231" y="18" width="24" height="12" rx="3" fill="none" stroke="#1B304A" strokeWidth="2"/>
      <rect x="234" y="21" width="16" height="6" rx="2"/>
    </g>
    <g>
      <circle cx="39" cy="68" r="15" fill="#1A4F82"/>
      <path d="M 32 72 L 39 59 L 46 72 Z" fill="#BDE8FF"/>
      <Txt x={64} y={75} size={18} weight={900} color="#183653">NORTHSTAR</Txt>
    </g>
    {dashboard
      ?<g>
        <rect x="22" y="98" width="226" height="74" rx="15" fill="#133D69"/>
        <Txt x={40} y={124} size={15} color="#C6DDF4">Welcome back</Txt>
        <Txt x={40} y={151} size={23} weight={840}>Your overview</Txt>
        <circle cx="220" cy="129" r="11" fill="#30D49A"/>
        <Txt x={25} y={204} size={14} color="#44607A">ACCOUNT OVERVIEW</Txt>
        {[0,1,2].map(i=>{
          const visible=fillProgress>=0.21+i*.30;
          const values=['$12,480.00','$3,240.80','4 new items'];
          const names=['Available balance','Portfolio value','Recent activity'];
          return <g key={i}>
            <rect x="20" y={219+i*77} width="231" height="67" rx="12"
              fill="#FFFFFF" stroke="#D5E2ED" strokeWidth="2"/>
            {visible?<g>
              <Txt x={35} y={243+i*77} size={13} color="#4A6883">{names[i]}</Txt>
              <Txt x={35} y={269+i*77} size={20} weight={860} color="#153957">{values[i]}</Txt>
              <circle cx="226" cy={252+i*77} r="9" fill="#CEF5E7"/>
              <path d={'M 222 '+(252+i*77)+' L 225 '+(255+i*77)+' L 231 '+(248+i*77)}
                stroke="#137657" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </g>:<g>
              <rect x="34" y={233+i*77} width="117" height="9" rx="4" fill="#D7E2EB"/>
              <rect x="34" y={252+i*77} width="170" height="15" rx="6" fill="#E5EDF3"/>
            </g>}
          </g>;
        })}
        <rect x="17" y="453" width="236" height="25" rx="12" fill="#E7EFF6"/>
        <Txt x={136} y={471} size={14} weight={720} color="#35617B" anchor="middle">HOME   ·   ACTIVITY   ·   PROFILE</Txt>
      </g>
      :<g>
        <Txt x={25} y={135} size={28} weight={900} color="#153957">Welcome back</Txt>
        <Txt x={25} y={158} size={14} color="#597188">Sign in to continue</Txt>
        <Txt x={25} y={202} size={14} weight={710} color="#3D5B79">Email address</Txt>
        <rect x="23" y="213" width="224" height="49" rx="10" fill="#FFFFFF"
          stroke="#C5D6E5" strokeWidth="2"/>
        <Txt x={38} y={242} size={17} color="#55708A">alex@example.com</Txt>
        <Txt x={25} y={296} size={14} weight={710} color="#3D5B79">Password</Txt>
        <rect x="23" y="308" width="224" height="49" rx="10" fill="#FFFFFF"
          stroke="#C5D6E5" strokeWidth="2"/>
        <Txt x={38} y={339} size={22} weight={800} color="#34516F">••••••••••</Txt>
        <rect x="23" y="380" width="224" height="51" rx="12" fill="#2168A7"/>
        <Txt x={135} y={413} size={20} weight={850} anchor="middle">Sign in</Txt>
        <Txt x={135} y={460} size={14} color="#53718D" anchor="middle">Secure account access</Txt>
        {rejection&&<g>
          <rect x="17" y="80" width="236" height="44" rx="9"
            fill="#FFF1D7" stroke="#E6AF54" strokeWidth="2"/>
          <circle cx="40" cy="102" r="10" fill="#DFA242"/>
          <Txt x={57} y={108} size={15} weight={800} color="#795421">Sign-in required</Txt>
        </g>}
        {(isWaiting||received)&&<g opacity={.93}>
          <rect x="18" y="167" width="234" height="278" rx="17" fill="#112E4E" opacity=".96"/>
          {isWaiting?<g>
            <circle cx="135" cy="280" r="44" fill="none" stroke="#2D557B" strokeWidth="10"/>
            <circle cx="135" cy="280" r="44" fill="none" stroke="#55D3F1"
              strokeWidth="10" strokeDasharray="80 280" strokeLinecap="round"
              transform={'rotate('+(time*45)+' 135 280)'}/>
            <Txt x={135} y={362} size={23} anchor="middle" weight={810}>Signing in...</Txt>
            <Txt x={135} y={389} size={15} color="#BDD6EA" anchor="middle">Verifying account</Txt>
          </g>:<g>
            <circle cx="135" cy="280" r="49" fill="#0F4D43" stroke="#38DDA3" strokeWidth="3"/>
            <Check x={135} y={280} r={31}/>
            <Txt x={135} y={360} size={21} anchor="middle" weight={820}>Response received</Txt>
            <Txt x={135} y={390} size={15} anchor="middle" color="#BCE8D8">Session confirmed</Txt>
          </g>}
        </g>}
      </g>}
    <rect x="97" y="477" width="76" height="5" rx="2.5"
      fill={dashboard?'#274963':'#52677B'}/>
  </g>;
};


const Cookie:React.FC<{x:number;y:number;scale?:number}>=({x,y,scale=1})=>
 <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
   <circle cx="93" cy="93" r="89" fill="#D8EFFF"/>
   <path d="M 135 8 C 126 44 142 69 180 77 C 171 133 141 170 92 181
     C 24 179 -10 110 19 53 C 43 12 88 -7 135 8 Z"
     fill="#B2DDF5" stroke="#7FC6ED" strokeWidth={4}/>
   {[[57,52,11],[99,91,14],[54,130,10],[132,139,11],[93,37,8]].map(([cx,cy,r],i)=>
     <circle key={i} cx={cx} cy={cy} r={r} fill="#316794"/>)}
   <path d="M 133 8 C 128 41 145 66 180 77" stroke="#F1FCFF" strokeWidth={6} fill="none"/>
 </g>;

const Token:React.FC<{x:number;y:number;scale?:number}>=({x,y,scale=1})=>
 <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
   <rect x="0" y="0" width="242" height="172" rx="22" fill="#E2E8FF"
     stroke={C.purple} strokeWidth={5}/>
   <rect x="22" y="24" width="54" height="54" rx="13" fill="#826ADF"/>
   <path d="M 40 51 L 48 59 L 62 44" stroke="#F7F5FF" strokeWidth={6}
     strokeLinecap="round" strokeLinejoin="round" fill="none"/>
   <rect x="92" y="30" width="125" height="10" rx="5" fill="#5C6FAD"/>
   <rect x="92" y="55" width="91" height="9" rx="5" fill="#9EA8C9"/>
   <rect x="23" y="108" width="192" height="9" rx="4" fill="#7081B4"/>
   <rect x="23" y="135" width="138" height="8" rx="4" fill="#AAB4D8"/>
 </g>;

const Server:React.FC<{x:number;y:number;scale?:number}>=({x,y,scale=1})=>
 <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
   {[0,1,2].map(i=><g key={i}>
     <rect x="0" y={i*63} width="200" height="54" rx={13}
       fill="#2A6296" stroke={C.cyan} strokeOpacity=".7" strokeWidth={2}/>
     <rect x="24" y={i*63+21} width={83} height={9} rx={4} fill="#123653"/>
     <circle cx={153} cy={i*63+27} r={8} fill={C.green}/>
     <circle cx={174} cy={i*63+27} r={6} fill="#94B8D7"/>
   </g>)}
 </g>;

const SceneOne:React.FC<{t:number}>=({t})=>{
 const alpha=envelope(t,0,22.7,true);
 const arrival=ease(t,.1,2.4);
 const cookie=ease(t,5.3,7.4);
 const httpOnly=ease(t,8.3,9.5);
 const token=ease(t,10.1,12.5);
 const store=ease(t,12.5,15);
 const ready=ease(t,15.5,17.9);
 return <g opacity={alpha}>
   <Head title="What the phone keeps after login"
     subtitle="The response carries proof that can be used again."/>
   <Phone x={146} y={334} scale={.91} phase={t<2.1?'waiting':'received'} time={t}/>
   <g opacity={1-ease(t,2.2,3.9)}>
     <g transform={'translate('+lerp(492,406,arrival)+' '+lerp(557,548,arrival)+')'}>
       <rect x={-118} y={-45} width="236" height="87" rx={18}
         fill="#DBF7FF" stroke={C.cyan} strokeWidth={3}/>
       <Txt x={0} y={7} size={32} anchor="middle" weight={865} color={C.ink}>200 OK</Txt>
     </g>
   </g>
   <Pill x={166} y={810} w={236} label="RECEIVED" color={C.green}
     check opacity={ease(t,2.1,4)}/>
   <Panel x={608} y={341} w={529} h={467} accent={C.cyan}
     fill="#183F65" opacity={ease(t,4,6)}>
     <Txt x={652} y={408} size={36} weight={860}>Browser session</Txt>
     <Txt x={652} y={445} size={25} color={C.secondary}>Cookie-based approach</Txt>
     <g opacity={cookie}><Cookie x={771} y={484} scale={.87}/></g>
     <Pill x={698} y={692} w={347} label="Session cookie" color={C.cyan}
       opacity={cookie}/>
     <Pill x={675} y={755} w={393} label="HttpOnly · hidden from JS"
       color={C.green} opacity={httpOnly} fontSize={22}/>
   </Panel>
   <Txt x={1190} y={583} size={39} weight={875} anchor="middle"
     color={C.secondary} opacity={ease(t,8.7,10.7)}>OR</Txt>
   <Panel x={1244} y={341} w={531} h={467} accent={C.purple}
     fill="#20375F" opacity={ease(t,9.8,11.7)}>
     <Txt x={1287} y={408} size={36} weight={860}>Token-based app</Txt>
     <Txt x={1288} y={445} size={25} color={C.secondary}>Client-managed proof</Txt>
     <g opacity={token}><Token x={1385} y={499} scale={1}/></g>
     <Pill x={1346} y={692} w={327} label="Access token" color={C.purple}
       opacity={token}/>
     <Pill x={1306} y={755} w={407} label="Saved for future requests"
       color={C.purple} fontSize={23} opacity={store}/>
   </Panel>
   <Pill x={664} y={879} w={610} label="Proof reused on future requests"
     color={C.green} fontSize={27} opacity={ready}/>
 </g>;
};

const SceneTwo:React.FC<{t:number}>=({t})=>{
 const a=envelope(t,21.6,46.7);
 const s=t-22;
 const state=ease(s,3.2,5.2);
 const routing=ease(s,7.8,10.4);
 const comparison=ease(s,11.3,13.2);
 const separation=ease(s,14.8,17);
 const done=ease(s,17.2,20.1);
 return <g opacity={a}>
   <Head title="Route Decision: two possible screens"
     subtitle="The app chooses navigation. The server still protects data."/>
   <Panel x={120} y={336} w={480} h={497} accent={C.blue} fill={C.panelBright}>
     <Txt x={161} y={414} size={33} weight={850}>Client auth state</Txt>
     <rect x={158} y={461} width={400} height={164} rx={19}
       fill="#0F3457" stroke={C.outline} strokeWidth={2}/>
     <Txt x={359} y={510} anchor="middle" size={23} color={C.secondary}>LOGIN RESPONSE</Txt>
     <g opacity={state}>
       <Check x={231} y={564} r={24}/>
       <Txt x={275} y={576} size={31} weight={855} color={C.green}>Authenticated</Txt>
     </g>
     <Pill x={160} y={689} w={400} label="Local auth state updated"
       color={C.cyan} opacity={state} fontSize={24}/>
     <Txt x={359} y={795} size={21} anchor="middle" color={C.secondary}
       opacity={comparison}>Used only for UI routing</Txt>
   </Panel>
   <Arrow d="M 603 584 H 692" color={C.cyan} opacity={routing} width={6}/>
   <circle cx={695} cy={584} r={9} fill={C.cyan} opacity={routing}/>
   <Panel x={710} y={335} w={1087} h={498} accent={C.cyan}
     fill="#153A5F" opacity={routing}>
     <Txt x={759} y={404} size={36} weight={855}>What screen should the app display?</Txt>
     <Panel x={762} y={433} w={478} h={377} accent={C.green}
       fill="#195054">
       <Pill x={784} y={449} w={433} h={46} label="SIGNED IN  →  DASHBOARD"
         color={C.green} fontSize={22}/>
       <Phone x={924} y={492} scale={.57} phase="dashboard" fillProgress={done}/>
       <Pill x={836} y={774} w={330} h={32} label="Session confirmed"
         color={C.green} fontSize={19} opacity={comparison}/>
     </Panel>
     <Panel x={1266} y={433} w={481} h={377} accent={C.amber}
       fill="#3A4157" opacity={.58+.42*comparison}>
       <Pill x={1289} y={449} w={435} h={46} label="NOT SIGNED IN  →  LOGIN"
         color={C.amber} fontSize={22}/>
       <Phone x={1426} y={492} scale={.57} phase="login"/>
       <Pill x={1337} y={774} w={332} h={32} label="No authenticated state"
         color={C.amber} fontSize={19} opacity={comparison}/>
     </Panel>
   </Panel>
   <g opacity={separation}>
     <Panel x={293} y={865} w={1333} h={100} accent={C.amber}
       fill="#243850" radius={17}>
       <Txt x={960} y={910} size={32} weight={855} anchor="middle">
         Changing screens never grants access to protected data.
       </Txt>
       <Txt x={960} y={946} size={23} color={C.secondary} anchor="middle">
         The backend verifies identity and permissions on the next API request.
       </Txt>
     </Panel>
   </g>
 </g>;
};


const SceneThree:React.FC<{t:number}>=({t})=>{
 const a=envelope(t,45.6,72.3,false,true);
 const s=t-46;
 const launch=ease(s,1.4,3.0);
 const sent=ease(s,3.2,5.3);
 const auth=ease(s,10.9,12.2);
 const permissions=ease(s,13.1,15.4);
 const data=ease(s,16.1,18.2);
 const filled=ease(s,18.7,21.0);
 const resolution=ease(s,21.8,23.6);
 const xx=lerp(553,826,sent), yy=lerp(596,596,sent);
 return <g opacity={a}>
   <Head title="Dashboard data needs another request"
     subtitle="A visible screen is not the same as authorized access."/>
   <Phone x={147} y={344} scale={.96} phase="dashboard"
     fillProgress={filled}/>
   <Pill x={158} y={847} w={291} label={filled>.9?'DATA LOADED':'LOADING DATA'}
     color={filled>.9?C.green:C.secondary} check={filled>.9}/>
   <path d="M 420 597 H 850" fill="none" stroke="#315577" strokeWidth={12}
     strokeLinecap="round" opacity={launch}/>
   <path d="M 420 597 H 850" fill="none" stroke={C.cyan} strokeWidth={6}
     strokeLinecap="round" opacity={launch}
     pathLength={100} strokeDasharray="100" strokeDashoffset={100*(1-sent)}/>
   <g transform={'translate('+xx+' '+yy+')'} opacity={launch*(1-ease(s,6.1,7.1))}>
     <rect x={-141} y={-46} width={281} height={86} rx={16}
       fill="#DEF7FF" stroke={C.cyan} strokeWidth={3}/>
     <Txt x={0} y={8} size={26} anchor="middle" color={C.ink}
       weight={860}>GET /account</Txt>
   </g>
   <Panel x={872} y={334} w={865} h={463} accent={C.blue} fill="#173B60"
     opacity={ease(s,2.4,4.0)}>
     <Server x={933} y={445} scale={.79}/>
     <Txt x={1017} y={686} size={31} anchor="middle" weight={840}>Protected API</Txt>
     <Pill x={1217} y={420} w={451} label="1 · Authenticate request"
       color={C.cyan} opacity={ease(s,9.4,11.3)}/>
     <g opacity={auth}>
       <Check x={1597} y={510} r={23}/>
       <Pill x={1217} y={487} w={328} label="Proof valid" color={C.green}/>
     </g>
     <Pill x={1217} y={565} w={451} label="2 · Check permissions"
       color={C.purple} opacity={ease(s,12.6,14.1)}/>
     <g opacity={permissions}>
       <Check x={1597} y={654} r={23}/>
       <Pill x={1217} y={631} w={328} label="Access allowed" color={C.green}/>
     </g>
     <Pill x={1229} y={716} w={426} label="Private data protected"
       color={C.amber} fontSize={23} opacity={auth}/>
   </Panel>
   <g opacity={ease(s,6.2,8.0)}>
     <Pill x={464} y={684} w={351} label="Cookie OR token"
       color={C.purple} fontSize={24}/>
   </g>
   <g opacity={data}>
     <path d="M 1300 817 C 1130 919 700 919 414 817" stroke={C.green}
       strokeWidth={7} strokeLinecap="round" fill="none"
       strokeDasharray="13 16" strokeOpacity=".9"/>
     <Pill x={844} y={850} w={350} label="Authorized data"
       color={C.green} fontSize={24}/>
   </g>
   <g opacity={resolution}>
     <Panel x={451} y={961} w={1055} h={68} accent={C.green}
       fill="#164D54" radius={16}>
       <Txt x={979} y={1004} size={29} weight={865}
         anchor="middle">Authenticated ≠ unlimited access</Txt>
     </Panel>
   </g>
 </g>;
};

export const Shot11RouteDecisionPresentationV2:React.FC<Props>=({audioClips=[]})=>{
 const frame=useCurrentFrame();
 const t=frame/FPS;
 const progress=clamp(t/LENGTH);
 return <div style={{
   position:'absolute',inset:0,width:W,height:H,overflow:'hidden',
   background:C.bg,fontFamily:AT_FONT
 }}>
   <svg width={W} height={H} viewBox="0 0 1920 1080"
     style={{position:'absolute',inset:0}}>
     <defs>
       <radialGradient id="s11background" cx=".46" cy=".30" r=".90">
         <stop offset="0" stopColor={C.bgGlow}/>
         <stop offset=".69" stopColor="#061322"/>
         <stop offset="1" stopColor={C.bg}/>
       </radialGradient>
     </defs>
     <rect width={W} height={H} fill="url(#s11background)"/>
     <g stroke="#3C6B94" strokeOpacity=".088" strokeWidth={1}>
       {Array.from({length:18},(_,i)=><path key={'v'+i}
         d={'M '+(95+i*106)+' 0 V 1080'}/>)}
       {Array.from({length:10},(_,i)=><path key={'h'+i}
         d={'M 0 '+(52+i*110)+' H 1920'}/>)}
     </g>
     {t<23.3&&<SceneOne t={t}/>}
     {t>21.4&&t<47.3&&<SceneTwo t={t}/>}
     {t>45.4&&<SceneThree t={t}/>}
     <path d="M 133 1035 H 1786" stroke="#315576"
       strokeWidth={7} strokeLinecap="round"/>
     <path d={'M 133 1035 H '+(133+1653*progress)}
       stroke={C.cyan} strokeWidth={7} strokeLinecap="round"/>
     {[11,34,59].map((sec,i)=>{
       const x=133+1653*sec/LENGTH;
       const active=(i===0&&t<22)||(i===1&&t>=22&&t<46)||(i===2&&t>=46);
       return <circle key={i} cx={x} cy={1005} r={8}
         fill={active?[C.cyan,C.purple,C.green][i]:'#376183'}/>;
     })}
   </svg>
   {audioClips.map((clip,i)=>
     <Sequence key={i} from={clip.fromFrame} durationInFrames={clip.durationInFrames}>
       <Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames??0}/>
     </Sequence>
   )}
 </div>;
};
export const SHOT11_PRESENTATION_V2_FRAMES=2160;
