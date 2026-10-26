import React from 'react';
import {Html5Audio, Sequence, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';

const W = 1920;
const H = 1080;
const FPS = 30;
export const SHOT12_RECAP_V1_FRAMES = 3150;
const C = {
  bg: '#020811', glow: '#0B2340', panel: '#17385F',
  panelDeep: '#102B4A', text: '#F3F7FF', secondary: '#AFC5DB',
  cyan: '#38CFF2', blue: '#60A5FA', green: '#31D69B',
  purple: '#AA8DFF', amber: '#F4B94F', outline: '#5180AD',
};
type AudioClip = {
  src: string;
  fromFrame: number;
  durationInFrames: number;
  trimBeforeFrames?: number;
};
type Props = {durationInFrames?: number; audioClips?: AudioClip[]};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const reveal = (t: number, a: number, b: number) => {
  const k = clamp((t - a) / Math.max(0.001, b - a));
  return k * k * (3 - 2 * k);
};
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const Text: React.FC<{x: number; y: number; children: React.ReactNode;
  size?: number; color?: string; weight?: number; anchor?: 'start'|'middle'|'end';
  opacity?: number}> = ({x, y, children, size=28, color=C.text, weight=680, anchor='start', opacity=1}) =>
  <text x={x} y={y} textAnchor={anchor} fontFamily={AT_FONT}
    fontSize={size} fontWeight={weight} fill={color} opacity={opacity}>{children}</text>;

const Panel: React.FC<{x: number;y: number;w: number;h: number;accent?: string;
  fill?: string; opacity?: number; children?: React.ReactNode}> =
  ({x,y,w,h,accent=C.blue,fill=C.panel,opacity=1,children}) =>
  <g opacity={opacity}>
    <rect x={x+5} y={y+9} width={w} height={h} rx={22}
      fill="#000610" opacity={0.32}/>
    <rect x={x} y={y} width={w} height={h} rx={22}
      fill={fill} stroke={accent} strokeWidth={2.3} strokeOpacity={0.7}/>
    <path d={`M ${x+21} ${y+2} H ${x+w-21}`}
      stroke={accent} strokeOpacity={0.48} strokeWidth={3}
      strokeLinecap="round"/>
    {children}
  </g>;

type SystemNode = {id:string; label:string; caption:string; x:number;y:number;w:number;h:number;
  color:string;};
const nodes: SystemNode[] = [
  {id:'assembly',label:'Request Assembly',caption:'Credentials · Headers · Context',x:505,y:321,w:273,h:133,color:C.cyan},
  {id:'network',label:'Network',caption:'Transit',x:825,y:321,w:177,h:133,color:C.cyan},
  {id:'gateway',label:'API Gateway',caption:'Entry and routing',x:1048,y:321,w:223,h:133,color:C.blue},
  {id:'balancer',label:'Load Balancer',caption:'Select destination',x:1320,y:321,w:255,h:133,color:C.blue},
  {id:'auth',label:'Auth Service',caption:'Verify credentials',x:1320,y:592,w:255,h:133,color:C.green},
  {id:'database',label:'User Database',caption:'Stored account facts',x:1630,y:592,w:240,h:133,color:C.cyan},
  {id:'state',label:'Authentication State',caption:'Create reusable proof',x:1048,y:811,w:262,h:135,color:C.green},
  {id:'protected',label:'Protected API',caption:'Proof + permissions',x:716,y:811,w:258,h:135,color:C.green},
];
const nodeReveal:Record<string,number> = {
  assembly:9,network:20,gateway:30,balancer:34,auth:41,
  database:46,state:64,protected:82
};
const nodeActive:Record<string,[number,number]> = {
  assembly:[12,19],network:[22,29],gateway:[30,35],balancer:[35,41],
  auth:[41,58],database:[46,54],state:[62,80],protected:[82,99]
};
const Node:React.FC<{node:SystemNode;t:number}> = ({node,t}) => {
  const fade = 0.18 + 0.82 * reveal(t,nodeReveal[node.id],nodeReveal[node.id]+3);
  const window = nodeActive[node.id];
  const focused = reveal(t,window[0],window[0]+2)*(1-reveal(t,window[1],window[1]+3));
  const opacity = fade*(0.80+0.20*focused);
  return <Panel x={node.x} y={node.y} w={node.w} h={node.h} accent={node.color}
    opacity={opacity} fill={focused>.15?'#22517A':C.panel}>
    <rect x={node.x+21} y={node.y+25} width={44} height={44} rx={12}
      fill={node.color} fillOpacity={0.18} stroke={node.color} strokeWidth={2}/>
    <path d={`M ${node.x+33} ${node.y+47} h 21 M ${node.x+44} ${node.y+36} v 23`}
      stroke={node.color} strokeWidth={3} strokeLinecap="round" opacity={0.8}/>
    <Text x={node.x+21} y={node.y+96} size={node.label.length>19?23:27}
      weight={860}>{node.label}</Text>
    <Text x={node.x+21} y={node.y+121} size={18} color={C.secondary}>
      {node.caption}
    </Text>
    <circle cx={node.x+node.w-21} cy={node.y+22} r={6.5}
      fill={focused>.15?node.color:'#5B7793'}/>
  </Panel>;
};

const paths = [
  {d:'M 408 555 C 448 555 460 387 505 387',a:11,b:20,c:C.cyan},
  {d:'M 778 387 H 825',a:20,b:27,c:C.cyan},
  {d:'M 1002 387 H 1048',a:29,b:34,c:C.cyan},
  {d:'M 1271 387 H 1320',a:34,b:40,c:C.cyan},
  {d:'M 1445 454 V 592',a:40,b:45,c:C.cyan},
  {d:'M 1575 650 H 1630',a:45,b:49,c:C.cyan},
  {d:'M 1630 693 H 1575',a:50,b:54,c:C.green},
  {d:'M 1320 673 H 1300 V 880 H 1310',a:61,b:69,c:C.green},
  {d:'M 1048 879 H 974',a:72,b:80,c:C.green},
  {d:'M 716 876 C 583 876 513 782 407 772',a:78,b:84,c:C.green},
  {d:'M 411 746 C 511 746 580 869 716 869',a:83,b:90,c:C.purple},
  {d:'M 716 917 C 587 963 488 953 407 813',a:93,b:101,c:C.green},
];
const Flow:React.FC<{t:number;d:string;a:number;b:number;c:string}> =
  ({t,d,a,b,c}) => {
    const p=reveal(t,a,b);
    return <g>
      <path d={d} stroke="#315576" strokeWidth={7} strokeOpacity={0.52}
        fill="none" strokeLinecap="round"/>
      <path d={d} stroke={c} strokeWidth={5} strokeOpacity={0.86}
        fill="none" strokeLinecap="round" pathLength={100}
        strokeDasharray="100" strokeDashoffset={100*(1-p)}/>
    </g>;
  };
const CircleCheck:React.FC<{x:number;y:number;r?:number}> = ({x,y,r=23})=>
  <g><circle cx={x} cy={y} r={r} fill={C.green}/>
    <path d={`M ${x-r*.41} ${y} L ${x-r*.13} ${y+r*.28} L ${x+r*.48} ${y-r*.39}`}
      stroke="#062236" strokeWidth={r*.2} fill="none" strokeLinecap="round"
      strokeLinejoin="round"/></g>;
const DashboardPhone:React.FC<{x:number;y:number;scale?:number}> = ({x,y,scale=1}) =>
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x="-7" y="105" width="7" height="57" rx="3" fill="#70809B"/>
    <rect x="-7" y="184" width="7" height="74" rx="3" fill="#70809B"/>
    <rect x="270" y="158" width="7" height="93" rx="3" fill="#7A90AC"/>
    <rect x="-5" y="-5" width="280" height="505" rx="49" fill="#03070D"
      stroke="#64758A" strokeWidth={7}/>
    <rect x="7" y="7" width="256" height="481" rx="39" fill="#EEF4FA"/>
    <rect x="83" y="13" width="104" height="24" rx="12" fill="#020509"/>
    <circle cx="174" cy="25" r="4" fill="#1A2631"/>
    <Text x={32} y={32} size={15} weight={850} color="#1B304A">9:41</Text>
    <rect x="203" y="25" width="5" height="6" rx="1" fill="#1B304A"/>
    <rect x="211" y="21" width="5" height="10" rx="1" fill="#1B304A"/>
    <rect x="219" y="17" width="5" height="14" rx="1" fill="#1B304A"/>
    <rect x="231" y="18" width="24" height="12" rx="3" fill="none" stroke="#1B304A" strokeWidth={2}/>
    <rect x="234" y="21" width="16" height="6" rx="2" fill="#1B304A"/>
    <circle cx="39" cy="68" r="15" fill="#1A4F82"/>
    <path d="M 32 72 L 39 59 L 46 72 Z" fill="#BDE8FF"/>
    <Text x={64} y={75} size={18} weight={900} color="#183653">NORTHSTAR</Text>
    <rect x="22" y="98" width="226" height="74" rx="15" fill="#133D69"/>
    <Text x={40} y={124} size={15} color="#C6DDF4">Welcome back</Text>
    <Text x={40} y={151} size={23} weight={840}>Your overview</Text>
    <circle cx="222" cy="110" r="9" fill="#30D49A"/>
    <Text x={25} y={204} size={14} color="#44607A">ACCOUNT OVERVIEW</Text>
    {['Available balance','Portfolio value','Recent activity'].map((label,i)=>
      <g key={i}>
        <rect x="20" y={219+i*77} width="231" height="67" rx="12"
          fill="#FFFFFF" stroke="#D5E2ED" strokeWidth="2"/>
        <Text x={35} y={243+i*77} size={13} color="#4A6883">{label}</Text>
        <Text x={35} y={269+i*77} size={20} weight={860} color="#153957">
          {['$12,480.00','$3,240.80','4 new items'][i]}
        </Text>
        <circle cx="226" cy={252+i*77} r="9" fill="#CEF5E7"/>
      </g>
    )}
    <rect x="17" y="453" width="236" height="25" rx="12" fill="#E7EFF6"/>
    <Text x={136} y={471} size={14} weight={720} color="#35617B" anchor="middle">
      HOME   ·   ACTIVITY   ·   PROFILE
    </Text>
    <rect x="97" y="477" width="76" height="5" rx="2.5" fill="#274963"/>
  </g>;

const Label:React.FC<{x:number;y:number;text:string;color:string;opacity:number;w:number}> =
  ({x,y,text,color,opacity,w}) => <g opacity={opacity}>
    <rect x={x} y={y} width={w} height={58} rx={15}
      fill="#102B4A" stroke={color} strokeWidth={2}/>
    <Text x={x+w/2} y={y+37} size={24} color={color} weight={800} anchor="middle">{text}</Text>
  </g>;

export const Shot12CompleteLoginRecapV1:React.FC<Props> = ({audioClips=[]}) => {
  const frame=useCurrentFrame();
  const t=frame/FPS;
  const progress=clamp(frame/SHOT12_RECAP_V1_FRAMES);
  const wide=reveal(t,8,17);
  const fadeInMap=reveal(t,10,21);
  const a2=reveal(t,27,30);
  const a3=reveal(t,60,64);
  const finish=reveal(t,97,103);
  return <div style={{position:'absolute',inset:0,width:W,height:H,overflow:'hidden',
    background:C.bg,fontFamily:AT_FONT}}>
    <svg width={W} height={H} viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0}}>
      <defs>
        <radialGradient id="shot12bg" cx=".47" cy=".35" r=".9">
          <stop offset="0" stopColor={C.glow}/><stop offset=".75" stopColor="#061322"/>
          <stop offset="1" stopColor={C.bg}/>
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#shot12bg)"/>
      <g stroke="#3C6B94" strokeOpacity=".088" strokeWidth={1}>
        {Array.from({length:18},(_,i)=><path key={'x'+i} d={`M ${95+i*106} 0 V 1080`}/>)}
        {Array.from({length:10},(_,i)=><path key={'y'+i} d={`M 0 ${52+i*110} H 1920`}/>)}
      </g>
      <Text x={130} y={148} size={51} weight={900}>
        {t<89?'What happens behind one click?':'What Really Happens When You Click Login?'}
      </Text>
      <Text x={133} y={195} size={25} color={C.secondary} opacity={1-finish}>
        From a human action to trusted access.
      </Text>
      <g opacity={0.26+0.74*fadeInMap}>
        {paths.map((path,i)=><Flow key={i} t={t} {...path}/>)}
        {nodes.map(node=><Node key={node.id} t={t} node={node}/>)}
      </g>
      <g opacity={1-0.08*wide} transform={`translate(${mix(130,140,wide)} ${mix(310,380,wide)}) scale(${mix(1.17,0.94,wide)})`}>
        <DashboardPhone x={0} y={0}/>
      </g>
      <Label x={98} y={876} w={333} text="DASHBOARD LOADED"
        color={C.green} opacity={1-reveal(t,29,33)}/>
      <g opacity={a2*(1-reveal(t,59,63))}>
        <Label x={1229} y={758} w={385} text="CREDENTIALS VERIFIED"
          color={C.green} opacity={reveal(t,53,58)}/>
      </g>
      <g opacity={a3}>
        <Label x={1080} y={954} w={279} text="REUSABLE PROOF"
          color={C.green} opacity={reveal(t,67,72)*(1-reveal(t,90,94))}/>
        <Label x={534} y={957} w={330} text="GET /account"
          color={C.cyan} opacity={reveal(t,84,89)*(1-reveal(t,96,100))}/>
        <g opacity={reveal(t,91,97)}><CircleCheck x={851} y={831}/></g>
      </g>
      <g opacity={finish}>
        <Panel x={479} y={944} w={1019} h={74} accent={C.green} fill="#164D54">
          <Text x={989} y={991} size={31} weight={860} anchor="middle">
            From a human claim to trusted, controlled access.
          </Text>
        </Panel>
      </g>
      <path d="M 133 1035 H 1786" stroke="#315576" strokeWidth={7} strokeLinecap="round"/>
      <path d={`M 133 1035 H ${133+1653*progress}`} stroke={C.cyan}
        strokeWidth={7} strokeLinecap="round"/>
      {[14,43,82].map((s,i)=><circle key={i} cx={133+1653*s/105}
        cy={1005} r={8}
        fill={(i===0&&t<29)||(i===1&&t>=29&&t<60)||(i===2&&t>=60)
          ? [C.cyan,C.blue,C.green][i]:'#376183'}/>)}
    </svg>
    {audioClips.map((clip,i)=>
      <Sequence key={i} from={clip.fromFrame} durationInFrames={clip.durationInFrames}>
        <Html5Audio src={clip.src} trimBefore={clip.trimBeforeFrames??0}/>
      </Sequence>
    )}
  </div>;
};
