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
}>=({x,y,w,label,color=C.cyan,fill=C.panelDeep,check=false,opacity=1,h=54,fontSize=25})=>
  <g opacity={opacity}>
    <rect x={x} y={y} width={w} height={h} rx={h*.27} fill={fill}
      stroke={color} strokeWidth={2} strokeOpacity=".82"/>
    <Txt x={x+(w-(check?58:0))/2} y={y+(h+fontSize*.68)/2} size={fontSize}
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

const Phone:React.FC<{
  x:number;y:number;scale?:number;phase?:'waiting'|'received'|'dashboard';
  time?:number;fillProgress?:number;
}>=({x,y,scale=1,phase='waiting',time=0,fillProgress=0})=>
 <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
   <rect x="0" y="0" width="270" height="495" rx="43"
     fill="#071522" stroke="#829FC2" strokeWidth="5"/>
   <rect x="12" y="12" width="246" height="471" rx="33" fill="#0E2845"/>
   <rect x="92" y="17" width="86" height="20" rx="10" fill="#030812"/>
   <Txt x={38} y={55} size={17} weight={760}>9:41</Txt>
   <path d="M 203 48 L 203 42 M 214 48 L 214 37 M 225 48 L 225 32"
     stroke={C.secondary} strokeWidth={3} strokeLinecap="round"/>
   {phase==='waiting'&&<g>
     <circle cx={135} cy={220} r={57} stroke="#335677" strokeWidth={13} fill="none"/>
     <circle cx={135} cy={220} r={57} stroke={C.cyan} strokeWidth={13}
       strokeDasharray="108 365" fill="none" strokeLinecap="round"
       transform={'rotate('+(time*50)+' 135 220)'}/>
     <Txt x={135} y={324} size={25} anchor="middle">Signing in...</Txt>
     <Txt x={135} y={363} size={19} anchor="middle" color={C.secondary}>Please wait</Txt>
   </g>}
   {phase==='received'&&<g>
     <circle cx={135} cy={219} r={60} stroke={C.green} strokeOpacity=".75"
       strokeWidth={8} fill="#123F3B"/>
     <Check x={135} y={219} r={41}/>
     <Txt x={135} y={323} size={25} anchor="middle">Response received</Txt>
     <Txt x={135} y={361} size={19} color={C.secondary} anchor="middle">Session ready</Txt>
   </g>}
   {phase==='dashboard'&&<g>
     <rect x={29} y={75} width={212} height={67} rx={15} fill="#255888"/>
     <Txt x={44} y={106} size={18} color={C.secondary}>ACCOUNT</Txt>
     <Txt x={44} y={131} size={24} weight={830}>Dashboard</Txt>
     <circle cx={224} cy={106} r={11} fill={C.green}/>
     {[0,1,2].map(i=><g key={i}>
       <rect x={29} y={162+i*86} width={212} height={72} rx={13}
         fill={fillProgress>i*.32+.05?'#28659A':'#194065'}
         stroke={fillProgress>i*.32+.05?C.cyan:'#477293'} strokeWidth={1.5}/>
       {fillProgress>i*.32+.05
        ?<g>
          <rect x={45} y={177+i*86} width={90} height={9} rx={4} fill="#8BB8E3"/>
          <rect x={45} y={201+i*86} width={144-i*20} height={16} rx={5} fill="#E4F5FF"/>
          <Check x={216} y={196+i*86} r={10}/>
         </g>
        :<g>
          <rect x={45} y={180+i*86} width={100} height={10} rx={5} fill="#5F8BB3"/>
          <rect x={45} y={203+i*86} width={157} height={11} rx={5} fill="#5F8BB3"/>
         </g>}
       </g>)}
     <rect x={90} y={467} width={90} height={5} rx={2.5} fill="#A6BDD1" opacity=".6"/>
   </g>}
   {phase!=='dashboard'&&<rect x={88} y={465} width={95} height={5} rx={2.5}
     fill={C.secondary} opacity=".6"/>}
 </g>;

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
     <Pill x={675} y={755} w={393} label="HttpOnly · JS cannot read"
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
     <Pill x={1306} y={755} w={407} label="Stored for later requests"
       color={C.purple} fontSize={23} opacity={store}/>
   </Panel>
   <Pill x={683} y={879} w={572} label="No password needed on every request"
     color={C.green} fontSize={27} opacity={ready}/>
 </g>;
};

const SceneTwo:React.FC<{t:number}>=({t})=>{
 const a=envelope(t,21.6,46.7);
 const s=t-22;
 const state=ease(s,3.2,5.2);
 const routing=ease(s,7.8,10.4);
 const noPath=ease(s,11.3,13.2);
 const separation=ease(s,14.8,17);
 return <g opacity={a}>
   <Head title="Route Decision is not a security check"
     subtitle="The client chooses a screen. The server protects the data."/>
   <Panel x={118} y={340} w={602} h={487} accent={C.blue} fill={C.panelBright}>
     <Txt x={162} y={413} size={37} weight={850}>Client authentication state</Txt>
     <rect x={179} y={479} width={476} height={192} rx={20}
       fill="#0F3457" stroke={C.outline} strokeWidth={2.5}/>
     <Txt x={418} y={533} anchor="middle" size={29} color={C.secondary}>LOGIN RESPONSE</Txt>
     <g opacity={state}>
       <Check x={282} y={601} r={29}/>
       <Txt x={332} y={611} size={37} weight={865} color={C.green}>Authenticated</Txt>
     </g>
     <Pill x={189} y={729} w={450} label="Local UI state updated"
       color={C.cyan} opacity={state}/>
   </Panel>
   <path d="M 720 591 H 873" stroke={C.cyan} strokeWidth={6}
     strokeOpacity={routing} strokeLinecap="round"/>
   <circle cx={875} cy={591} r={12} fill={C.cyan} opacity={routing}/>
   <Panel x={889} y={365} w={868} h={435} accent={C.cyan} fill="#163D63"
     opacity={routing}>
     <Txt x={931} y={432} size={38} weight={860}>Which screen should open?</Txt>
     <Panel x={941} y={468} w={346} h={219} accent={C.green} fill="#205A61">
       <Txt x={1114} y={529} anchor="middle" size={29} weight={850}>SIGNED IN</Txt>
       <Check x={1115} y={599} r={27}/>
       <Txt x={1116} y={652} anchor="middle" size={34} weight={860}
         color={C.green}>Dashboard</Txt>
     </Panel>
     <Panel x={1340} y={468} w={346} h={219} accent={C.amber}
       fill="#4B4B53" opacity={.52+.48*noPath}>
       <Txt x={1513} y={529} anchor="middle" size={29} weight={850}>NOT SIGNED IN</Txt>
       <circle cx={1513} cy={602} r={26} fill="#936E32"/>
       <path d="M 1502 589 L 1524 612 M 1524 589 L 1502 612"
         stroke="#FFDBAC" strokeWidth={7} strokeLinecap="round"/>
       <Txt x={1513} y={652} anchor="middle" size={34} weight={860}
         color={C.amber}>Login</Txt>
     </Panel>
     <Txt x={1310} y={758} size={27} color={C.secondary} anchor="middle">
       Navigation changes what is shown.
     </Txt>
   </Panel>
   <g opacity={separation}>
     <Panel x={346} y={858} w={1248} h={117} accent={C.amber} fill="#243850"
       radius={20}>
       <Txt x={970} y={907} size={33} anchor="middle" weight={850}>
         Dashboard route ≠ permission to access protected data
       </Txt>
       <Txt x={970} y={947} size={24} anchor="middle" color={C.secondary}>
         A server-side check still decides what this account can read.
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
     <Pill x={1229} y={716} w={426} label="Private data stays protected"
       color={C.amber} fontSize={23} opacity={auth}/>
   </Panel>
   <g opacity={ease(s,6.2,8.0)}>
     <Pill x={464} y={684} w={351} label="Cookie OR access token"
       color={C.purple} fontSize={24}/>
   </g>
   <g opacity={data}>
     <path d="M 1300 817 C 1130 919 700 919 414 817" stroke={C.green}
       strokeWidth={7} strokeLinecap="round" fill="none"
       strokeDasharray="13 16" strokeOpacity=".9"/>
     <Pill x={844} y={850} w={350} label="Authorized account data"
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

export const Shot11RouteDecisionPresentationV1:React.FC<Props>=({audioClips=[]})=>{
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
export const SHOT11_PRESENTATION_V1_FRAMES=2160;
