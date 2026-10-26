import React from 'react';
import {Html5Audio, Sequence, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';

const W = 1920;
const H = 1080;
const FPS = 30;
const C = {
  bg: '#020811',
  bgHi: '#091B30',
  panel: '#17385F',
  panelDeep: '#102B4A',
  panelHi: '#204F80',
  text: '#F3F7FF',
  secondary: '#AFC5DB',
  cyan: '#38CFF2',
  blue: '#60A5FA',
  green: '#31D69B',
  purple: '#AA8DFF',
  amber: '#F4B94F',
  outline: '#46769E',
};
type VoiceClip = {
  src: string;
  fromFrame: number;
  durationInFrames: number;
  trimBeforeFrames?: number;
};
type Props = {durationInFrames?: number; audioClips?: VoiceClip[]};
type ColorName = 'blue'|'green'|'purple'|'amber'|'cyan';
const clamp = (n:number) => Math.max(0,Math.min(1,n));
const smooth = (t:number,a:number,b:number) => {
  const v=clamp((t-a)/Math.max(.001,b-a));
  return v*v*(3-2*v);
};
const flash=(t:number) => .5+.5*Math.sin(t*2.1);
const tones:Record<ColorName,string>={
  blue:C.blue,green:C.green,purple:C.purple,amber:C.amber,cyan:C.cyan,
};

const T:React.FC<{
  x:number;y:number;children:React.ReactNode;size?:number;weight?:number;
  color?:string;anchor?:'start'|'middle'|'end';opacity?:number;letterSpacing?:number;
}> = ({x,y,children,size=31,weight=650,color=C.text,anchor='start',opacity=1,letterSpacing=0}) =>
  <text x={x} y={y} fontFamily={AT_FONT} fontWeight={weight} fontSize={size}
    textAnchor={anchor} fill={color} opacity={opacity} letterSpacing={letterSpacing}>{children}</text>;

const Tile:React.FC<{
  x:number;y:number;w:number;h:number;accent?:string;fill?:string;
  opacity?:number;children?:React.ReactNode;radius?:number;
}> = ({x,y,w,h,accent=C.blue,fill=C.panel,opacity=1,children,radius=28}) =>
  <g opacity={opacity}>
    <rect x={x+5} y={y+10} width={w} height={h} rx={radius} fill="#000610" opacity=".33"/>
    <rect x={x} y={y} width={w} height={h} rx={radius} fill={fill}
      stroke={accent} strokeOpacity=".63" strokeWidth={2.5}/>
    <path d={'M '+(x+25)+' '+(y+2)+' H '+(x+w-25)} stroke={accent}
      strokeOpacity=".37" strokeWidth={3} strokeLinecap="round"/>
    {children}
  </g>;

const Avatar:React.FC<{x:number;y:number;size?:number;color?:string}>=
  ({x,y,size=75,color=C.text}) =>
  <g transform={'translate('+x+' '+y+') scale('+(size/100)+')'}>
    <circle cx="50" cy="31" r="18" fill={color}/>
    <path d="M 15 88 C 15 55 85 55 85 88 Z" fill={color}/>
  </g>;

const Server:React.FC<{x:number;y:number;scale?:number;accent?:string}>=
  ({x,y,scale=1,accent=C.cyan}) =>
  <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
    {[0,1,2].map(i=><g key={i}>
      <rect x={0} y={i*79} width={205} height={67} rx={13}
        fill={i===0?'#2A5787':'#234B74'} stroke={accent} strokeOpacity=".75" strokeWidth={2}/>
      <rect x={23} y={i*79+28} width={76} height={9} rx={4} fill="#102B4A"/>
      <circle cx={155} cy={i*79+33} r={8} fill={accent}/>
      <circle cx={178} cy={i*79+33} r={6} fill="#85B3DB" opacity=".7"/>
    </g>)}
  </g>;

const DataStore:React.FC<{x:number;y:number;scale?:number;accent?:string}>=
  ({x,y,scale=1,accent=C.blue}) =>
  <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
    <rect x="0" y="20" width="170" height="160" rx="20" fill="#28659E" stroke={accent} strokeWidth="3"/>
    <ellipse cx="85" cy="22" rx="85" ry="26" fill="#4599D8" stroke={accent} strokeWidth="3"/>
    <path d="M 0 72 C 0 109 170 109 170 72 M 0 126 C 0 165 170 165 170 126"
      fill="none" stroke="#91D6FD" strokeWidth="4" opacity=".75"/>
    <ellipse cx="85" cy="180" rx="85" ry="23" fill="#205081" opacity=".75"/>
  </g>;

const Phone:React.FC<{x:number;y:number;scale?:number;waiting?:boolean;time?:number;accent?:string}>=
  ({x,y,scale=1,waiting=true,time=0,accent=C.blue}) =>
  <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
    <rect x="0" y="0" width="270" height="495" rx="43" fill="#071523"
      stroke="#7C99BE" strokeWidth="5"/>
    <rect x="12" y="12" width="246" height="471" rx="33" fill="#0E2845"/>
    <rect x="92" y="17" width="86" height="20" rx="10" fill="#030812"/>
    <T x={39} y={53} size={17} weight={700}>9:41</T>
    <path d="M 204 46 L 204 39 M 214 46 L 214 35 M 224 46 L 224 30"
      stroke={C.secondary} strokeWidth="3" strokeLinecap="round"/>
    {waiting ?
      <g>
        <circle cx="135" cy="225" r="58" stroke="#315879" strokeWidth="13" fill="none"/>
        <circle cx="135" cy="225" r="58" stroke={C.cyan} strokeWidth="13"
          strokeDasharray="110 364" strokeLinecap="round" fill="none"
          transform={'rotate('+(time*52)+' 135 225)'}/>
        <T x={135} y={326} size={25} weight={650} anchor="middle">Signing in...</T>
        <T x={135} y={366} size={20} color={C.secondary} anchor="middle">Please wait</T>
        <rect x={88} y={458} width={95} height={6} rx={3} fill={C.secondary} opacity=".55"/>
      </g> :
      <g>
        <circle cx={135} cy={218} r={56} stroke={C.green} strokeWidth={9} fill="#17684E"/>
        <path d="M 103 217 L 126 241 L 166 191" stroke="#E8FFF7"
          strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <T x={135} y={328} size={27} anchor="middle">Response received</T>
      </g>
    }
    <path d="M 45 425 H 222" stroke={accent} opacity=".17" strokeWidth="4" strokeLinecap="round"/>
  </g>;

const ClientDevice:React.FC<{x:number;y:number;scale?:number;accent?:string}>=
  ({x,y,scale=1,accent=C.blue}) =>
  <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
    <rect width="270" height="495" rx="42" fill="#071523" stroke="#84A0C4" strokeWidth="5"/>
    <rect x="12" y="13" width="246" height="467" rx="31" fill="#EAF2FF"/>
    <rect x="94" y="16" width="82" height="19" rx="9" fill="#071523"/>
    <circle cx="135" cy="169" r="70" fill={accent} opacity=".19"/>
    <Avatar x={95} y={130} size={80} color="#2E6499"/>
    <rect x="54" y="276" width="166" height="14" rx="7" fill="#B6CDE7"/>
    <rect x="54" y="314" width="128" height="12" rx="6" fill="#B6CDE7"/>
    <rect x="54" y="352" width="151" height="12" rx="6" fill="#B6CDE7"/>
    <rect x="95" y="460" width="81" height="6" rx="3" fill="#7C9CBB"/>
  </g>;

const Doc:React.FC<{x:number;y:number;scale?:number;color?:string}>=
  ({x,y,scale=1,color=C.text}) =>
  <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
    <path d="M 0 0 H 73 L 103 31 V 131 H 0 Z" fill="none" stroke={color} strokeWidth={6}
      strokeLinejoin="round"/>
    <path d="M 73 1 V 31 H 102 M 20 64 H 76 M 20 83 H 77 M 20 103 H 58"
      fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"/>
  </g>;

const Tick:React.FC<{x:number;y:number;r?:number;color?:string}>=
  ({x,y,r=31,color=C.green}) =>
  <g><circle cx={x} cy={y} r={r} fill={color}/>
    <path d={'M '+(x-r*.46)+' '+y+' L '+(x-r*.13)+' '+(y+r*.31)+' L '+(x+r*.5)+' '+(y-r*.37)}
      stroke="#042C28" fill="none" strokeWidth={r*.19} strokeLinecap="round"
      strokeLinejoin="round"/></g>;

const Tag:React.FC<{x:number;y:number;w:number;text:string;color?:string;opacity?:number;check?:boolean}>=
  ({x,y,w,text,color=C.cyan,opacity=1,check=false}) =>
  <g opacity={opacity}>
    <rect x={x} y={y} width={w} height={54} rx={14} fill="#0E2B49"
      stroke={color} strokeOpacity=".72" strokeWidth={2}/>
    <T x={x+(w-(check?60:0))/2} y={y+36} size={24} anchor="middle"
      color={color} weight={770}>{text}</T>
    {check&&<Tick x={x+w-30} y={y+27} r={17} color={C.green}/>}
  </g>;

const Arrow:React.FC<{d:string;color?:string;opacity?:number;width?:number}>=
  ({d,color=C.cyan,opacity=1,width=5}) =>
  <path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={width}
    strokeLinecap="round" strokeLinejoin="round" fill="none" markerEnd="url(#s10v8Arrow)"/>;

const SceneLabel:React.FC<{title:string;caption:string}>=({title,caption})=>
  <g>
    <T x={132} y={199} size={48} weight={870}>{title}</T>
    <T x={134} y={242} size={25} color={C.secondary} weight={500}>{caption}</T>
  </g>;

const Landing:React.FC<{x:number;y:number;size?:number}>=({x,y,size=38})=>
  <g>
    <circle cx={x} cy={y} r={size} fill={C.green} opacity=".12"/>
    <circle cx={x} cy={y} r={size*.6} fill="none" stroke={C.green} strokeWidth="4" opacity=".92"/>
    <circle cx={x} cy={y} r={size*.22} fill={C.green}/>
  </g>;

const sceneOpacity=(t:number,start:number,end:number,first=false,last=false)=>
  (first?1:smooth(t,start,start+.9)) * (last?1:(1-smooth(t,end-.9,end)));

const Scene01:React.FC<{t:number}>=({t})=>{
  const identity=smooth(t,6.1,12.7);
  const reveal=smooth(t,11.2,15.5);
  const ex=smooth(t,16,19.2);
  const x=980+180*identity;
  return <g opacity={sceneOpacity(t,0,22.5,true)}>
    <SceneLabel title="The password is verified. What's next?"
      caption="The client still needs a way to be recognized."/>
    <Phone x={142} y={337} scale={.85} time={t}/>
    <Tag x={159} y={789} w={208} text="WAITING" color={C.secondary}/>
    <Tile x={532} y={347} w={402} h={409} accent={C.blue} fill={C.panel}>
      <Server x={638} y={416} scale={.92} accent={C.cyan}/>
      <T x={734} y={731} anchor="middle" size={34} weight={850}>Auth Service</T>
    </Tile>
    <g opacity={smooth(t,2.1,4.3)}>
      <Tag x={556} y={765} w={354} text="Password verified" color={C.green} check/>
    </g>
    <Arrow d="M 944 543 H 1207" color={C.cyan} opacity=".85"/>
    <g transform={'translate('+x+' 498)'} opacity={smooth(t,6,7)*(1-smooth(t,13,14))}>
      <rect x={-38} y={-33} width={76} height={77} rx={19} fill="#D7F6FF"/>
      <Avatar x={-24} y={-22} size={49} color="#17436A"/>
    </g>
    <Tile x={1214} y={327} w={527} h={439} accent={C.blue} fill={C.panelHi}>
      <DataStore x={1373} y={401} scale={1.12} accent="#7AD9FC"/>
      <circle cx={1589} cy={602} r={39} fill={C.green} opacity={reveal}/>
      <Avatar x={1560} y={576} size={58} color="#062B29"/>
      <T x={1477} y={716} size={37} anchor="middle" weight={880}>Authentication State</T>
    </Tile>
    <g opacity={reveal}>
      <Tick x={1655} y={363} r={23}/>
      <Tag x={1201} y={795} w={274} text="Proof created" color={C.green}/>
    </g>
    <g opacity={ex}>
      <Tag x={1501} y={795} w={272} text="Future requests" color={C.cyan}/>
      <path d="M 1580 765 V 784" stroke={C.cyan} strokeWidth={4}/>
    </g>
  </g>;
};

const Scene02:React.FC<{t:number}>=({t})=>{
  const left=smooth(t,22.4,25.5);
  const id=smooth(t,26.5,30.5);
  const right=smooth(t,31.7,34.6);
  const signed=smooth(t,35.3,39.8);
  const both=smooth(t,40,44.2);
  return <g opacity={sceneOpacity(t,21.65,46.6)}>
    <SceneLabel title="Two ways to remember the login"
      caption="Alternatives, not two steps in the same flow."/>
    <Tile x={104} y={328} w={803} h={546} accent={C.cyan} fill="#14395E" opacity={left}>
      <T x={149} y={399} size={38} weight={865}>Server-side session</T>
      <Tag x={149} y={425} w={326} text="State stored on server" color={C.cyan}/>
      <Server x={191} y={541} scale={.83} accent={C.cyan}/>
      <T x={277} y={804} size={25} anchor="middle">Server</T>
      <ClientDevice x={635} y={548} scale={.43} accent={C.cyan}/>
      <T x={689} y={804} size={25} anchor="middle">Client</T>
      <Arrow d="M 631 696 H 461" color={C.cyan} opacity={id}/>
      <g opacity={id}>
        <rect x={459} y={599} width={169} height={57} rx={15} fill="#D9F8FF"/>
        <T x={543} y={637} size={25} color="#113750" anchor="middle" weight={800}>Session ID</T>
      </g>
    </Tile>
    <circle cx={960} cy={607} r={53} fill="#0B2742" stroke={C.secondary} strokeWidth="3"/>
    <T x={960} y={622} anchor="middle" size={40} weight={900}>OR</T>
    <Tile x={1012} y={328} w={803} h={546} accent={C.purple} fill="#1C345F" opacity={right}>
      <T x={1063} y={399} size={38} weight={865}>Signed token</T>
      <Tag x={1063} y={425} w={331} text="Signature verified" color={C.purple}/>
      <rect x={1089} y={550} width={290} height={222} rx={24} fill="#E3E7FF"
        stroke="#AFADFF" strokeWidth={4}/>
      <Doc x={1122} y={586} scale={.8} color="#4264A1"/>
      <T x={1240} y={612} size={22} weight={820} color="#1D375A">SIGNED</T>
      <T x={1240} y={643} size={22} weight={820} color="#1D375A">TOKEN</T>
      <path d="M 1238 680 H 1345 M 1238 698 H 1316" stroke="#687AAA" strokeWidth="5"
        strokeLinecap="round"/>
      <g opacity={signed}><Tick x={1354} y={745} r={27} color={C.purple}/></g>
      <ClientDevice x={1550} y={548} scale={.43} accent={C.purple}/>
      <T x={1606} y={804} size={25} anchor="middle">Client</T>
      <Arrow d="M 1394 690 H 1531" color={C.purple} opacity={signed}/>
    </Tile>
    <g opacity={both}>
      <Tile x={480} y={912} w={961} h={78} accent={C.cyan} fill={C.panelDeep} radius={19}>
        <T x={960} y={963} size={29} weight={800} anchor="middle">
          Two designs. One goal: no password on every request.
        </T>
      </Tile>
    </g>
  </g>;
};

const Scene03:React.FC<{t:number}>=({t})=>{
  const show=smooth(t,46.3,48.2);
  const ring=smooth(t,48.7,54.6);
  const choices=smooth(t,53.7,57.7);
  const circ=2*Math.PI*228;
  return <g opacity={sceneOpacity(t,45.8,59.6)}>
    <SceneLabel title="Access does not last forever"
      caption="Sessions and tokens have a defined lifetime."/>
    <g opacity={show}>
      <circle cx={959} cy={594} r={228} stroke="#33557A" strokeWidth={29} fill="none"/>
      <circle cx={959} cy={594} r={228} stroke={C.cyan} strokeWidth={29} fill="none"
        strokeDasharray={circ} strokeDashoffset={circ*(1-ring*.75)}
        strokeLinecap="round" transform="rotate(-90 959 594)"/>
      <Tile x={785} y={430} w={348} h={330} accent={C.blue} fill={C.panelHi}>
        <circle cx={960} cy={523} r={65} fill="#3777B3"/>
        <Avatar x={923} y={493} size={75}/>
        <Tick x={1029} y={570} r={27}/>
        <T x={959} y={664} size={34} weight={850} anchor="middle">Authentication</T>
        <T x={959} y={705} size={34} weight={850} anchor="middle">proof</T>
      </Tile>
    </g>
    <Tile x={174} y={466} w={400} h={227} accent={C.blue} opacity={show}>
      <T x={211} y={531} size={34} weight={850}>Time-limited</T>
      <T x={211} y={582} size={28} color={C.secondary}>Proof is valid</T>
      <T x={211} y={624} size={28} color={C.secondary}>for a set period.</T>
    </Tile>
    <Tile x={1360} y={466} w={393} h={227} accent={C.amber} opacity={choices}>
      <T x={1395} y={531} size={34} weight={850}>TTL / Expiry</T>
      <T x={1395} y={582} size={28} color={C.secondary}>After expiry:</T>
      <T x={1395} y={624} size={28} color={C.amber}>Check trust again.</T>
    </Tile>
    <g opacity={choices}>
      <Tag x={712} y={844} w={242} text="Renew access" color={C.green}/>
      <T x={978} y={877} size={27} anchor="middle" color={C.secondary}>or</T>
      <Tag x={1012} y={844} w={287} text="Sign in again" color={C.amber}/>
    </g>
  </g>;
};

const cubic=(p:number) => {
  const s=1-p;
  const x=s*s*s*1366+3*s*s*p*1170+3*s*p*p*770+p*p*p*464;
  const y=s*s*s*589+3*s*s*p*404+3*s*p*p*674+p*p*p*582;
  return {x,y};
};
const Scene04:React.FC<{t:number}>=({t})=>{
  const appear=smooth(t,59.2,60.2);
  const run=smooth(t,61.3,70.1);
  const pos=cubic(run);
  const arriving=smooth(t,69.4,71.4);
  return <g opacity={sceneOpacity(t,58.6,72,false,true)}>
    <SceneLabel title="The response heads back to the phone"
      caption="The client has not changed screens yet."/>
    <g opacity={appear}>
      <Phone x={172} y={330} scale={.91} time={t}/>
      <Tile x={1354} y={357} w={419} h={399} accent={C.blue} fill={C.panelHi}>
        <Server x={1490} y={429} scale={.77} accent={C.cyan}/>
        <T x={1564} y={712} anchor="middle" size={32} weight={850}>Authentication State</T>
      </Tile>
      <path d="M 1366 589 C 1170 404 770 674 464 582" fill="none"
        stroke="#27557D" strokeWidth={13} strokeLinecap="round"/>
      <path d="M 1366 589 C 1170 404 770 674 464 582" fill="none"
        stroke={C.cyan} strokeWidth={7} strokeLinecap="round"
        pathLength={100} strokeDasharray="100" strokeDashoffset={100*(1-run)}/>
      <Landing x={464} y={582} size={28+8*arriving}/>
    </g>
    <g opacity={appear*(1-smooth(t,69.3,71))} transform={'translate('+pos.x+' '+pos.y+')'}>
      <rect x={-170} y={-57} width={340} height={114} rx={21}
        fill="#DDF7FF" stroke={C.cyan} strokeWidth={4}/>
      <Tick x={-119} y={0} r={27}/>
      <T x={-78} y={-7} size={25} color="#0D3B53" weight={870}>200 OK</T>
      <T x={-78} y={29} size={22} color="#1C5872">Proof attached</T>
    </g>
    <g opacity={arriving}>
      <Tag x={180} y={810} w={321} color={C.green} text="Response arriving"/>
      <path d="M 441 803 V 779" stroke={C.green} strokeWidth={4}/>
    </g>
    <g opacity={smooth(t,65.2,67.4)}>
      <Tag x={897} y={834} w={284} color={C.cyan} text="Successful response"/>
    </g>
  </g>;
};

export const Shot10SessionCreationPresentationV8:React.FC<Props>=({audioClips=[]})=>{
  const frame=useCurrentFrame();
  const t=frame/FPS;
  const section=t<22?0:t<46?1:t<59?2:3;
  const progress=clamp(t/72);
  return <div style={{
      position:'absolute',inset:0,width:W,height:H,overflow:'hidden',
      background:C.bg,fontFamily:AT_FONT,
    }}>
    <svg width={W} height={H} viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0}}>
      <defs>
        <radialGradient id="s10v8Background" cx=".46" cy=".28" r=".92">
          <stop offset="0" stopColor={C.bgHi}/>
          <stop offset=".65" stopColor="#061221"/>
          <stop offset="1" stopColor={C.bg}/>
        </radialGradient>
        <marker id="s10v8Arrow" markerWidth="11" markerHeight="11"
          refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
          <path d="M 1 1 L 10 5 L 1 10 Z" fill={C.cyan}/>
        </marker>
      </defs>
      <rect width={W} height={H} fill="url(#s10v8Background)"/>
      <g stroke="#3C6B94" strokeOpacity=".09" strokeWidth={1}>
        {Array.from({length:18},(_,i)=><path key={'v'+i} d={'M '+(95+i*106)+' 0 V 1080'}/>)}
        {Array.from({length:10},(_,i)=><path key={'h'+i} d={'M 0 '+(52+i*110)+' H 1920'}/>)}
      </g>
      {t<23.5&&<Scene01 t={t}/>}
      {t>21.5&&t<47.4&&<Scene02 t={t}/>}
      {t>45.6&&t<60.5&&<Scene03 t={t}/>}
      {t>58.5&&<Scene04 t={t}/>}
      <path d="M 133 1035 H 1786" stroke="#315576" strokeWidth={7} strokeLinecap="round"/>
      <path d={'M 133 1035 H '+(133+1653*progress)} stroke={C.cyan} strokeWidth={7}
        strokeLinecap="round"/>
      {[0,1,2,3].map((i)=>{
        const starts=[0,22,46,59];
        const widths=[22,24,13,13];
        const x=133+1653*(starts[i]+widths[i]/2)/72;
        return <g key={i}>
          <circle cx={x} cy={1005} r={8} fill={i===section?tones[['blue','purple','amber','green'][i] as ColorName]:'#376183'}/>
          <T x={x} y={990} size={16} color={i===section?C.text:C.secondary} anchor="middle" weight={850}>
            {'0'+(i+1)}
          </T>
        </g>;
      })}
    </svg>
    {audioClips.map((clip,i)=>
      <Sequence key={i} from={clip.fromFrame} durationInFrames={clip.durationInFrames}>
        <Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames??0}/>
      </Sequence>
    )}
  </div>;
};

export const SHOT10_PRESENTATION_V8_FRAMES = 2160;
