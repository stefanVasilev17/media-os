import React from 'react';
import {Html5Audio, Sequence, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';

const W = 1920;
const H = 1080;
const FPS = 30;
export const SHOT12_RECAP_V4_FRAMES = 2400;
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
  return k * k * k * (k * (k * 6 - 15) + 10);
};
const mixHex = (a: string, b: string, k: number) => {
  const f = clamp(k);
  const c = (v: string, i: number) => parseInt(v.slice(i, i + 2), 16);
  const rgb = [1,3,5].map(i=>Math.round(c(a,i)+(c(b,i)-c(a,i))*f));
  return '#'+rgb.map(n=>n.toString(16).padStart(2,'0')).join('');
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
  {id:'assembly',label:'Request Assembly',caption:'Payload · Headers · Context',x:488,y:315,w:310,h:133,color:C.cyan},
  {id:'network',label:'Network',caption:'Transit',x:829,y:315,w:185,h:133,color:C.cyan},
  {id:'gateway',label:'API Gateway',caption:'Entry and routing',x:1045,y:315,w:220,h:133,color:C.blue},
  {id:'balancer',label:'Load Balancer',caption:'Select destination',x:1300,y:315,w:258,h:133,color:C.blue},
  {id:'auth',label:'Auth Service',caption:'Verify credentials',x:1310,y:520,w:250,h:133,color:C.green},
  {id:'database',label:'User Database',caption:'Stored account facts',x:1610,y:520,w:275,h:133,color:C.cyan},
  {id:'state',label:'Authentication State',caption:'Create reusable proof',x:1050,y:700,w:285,h:133,color:C.green},
  {id:'protected',label:'Protected API',caption:'Proof + permissions',x:122,y:768,w:280,h:127,color:C.green},
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
  const fade = 0.18 + 0.82 * reveal(t,nodeReveal[node.id]-0.3,nodeReveal[node.id]+4.2);
  const window = nodeActive[node.id];
  const focused = reveal(t,window[0]-0.6,window[0]+2.8)*(1-reveal(t,window[1]-0.5,window[1]+3.4));
  const opacity = fade*(0.83+0.17*focused);
  return <Panel x={node.x} y={node.y} w={node.w} h={node.h} accent={node.color}
    opacity={opacity} fill={mixHex(C.panel,'#22517A',focused)}>
    <rect x={node.x+21} y={node.y+25} width={44} height={44} rx={12}
      fill={node.color} fillOpacity={0.18} stroke={node.color} strokeWidth={2}/>
    <path d={`M ${node.x+33} ${node.y+47} h 21 M ${node.x+44} ${node.y+36} v 23`}
      stroke={node.color} strokeWidth={3} strokeLinecap="round" opacity={0.8}/>
    <Text x={node.x+21} y={node.y+96} size={node.label.length>19?22:node.label.length>14?25:27}
      weight={860}>{node.label}</Text>
    <Text x={node.x+21} y={node.y+121} size={node.caption.length>23?15.5:18} color={C.secondary}>
      {node.caption}
    </Text>
    <circle cx={node.x+node.w-21} cy={node.y+22}
      r={node.id==='protected'?3.5:4.8}
      fill={mixHex('#5B7793',node.color,focused)}/>
  </Panel>;
};

const paths = [
  {d:'M 400 526 C 438 526 449 382 488 382',a:11,b:20,c:C.cyan},
  {d:'M 798 382 H 829',a:20,b:27,c:C.cyan},
  {d:'M 1014 382 H 1045',a:29,b:34,c:C.cyan},
  {d:'M 1265 382 H 1300',a:34,b:40,c:C.cyan},
  {d:'M 1429 448 V 520',a:40,b:45,c:C.cyan},
  {d:'M 1560 572 H 1610',a:45,b:49,c:C.cyan},
  {d:'M 1610 615 H 1560',a:50,b:54,c:C.green},
  {d:'M 1310 634 C 1276 634 1265 657 1265 682 Q 1265 700 1247 700',a:60,b:68,c:C.green},
  {d:'M 1050 756 H 1007 Q 985 756 985 733 V 683 H 439 Q 405 683 401 653',a:70,b:79,c:C.green},
  {d:'M 252 708 V 768',a:83,b:90,c:C.purple},
  {d:'M 300 768 V 708',a:94,b:99,c:C.green},
];
const Flow:React.FC<{t:number;d:string;a:number;b:number;c:string}> =
  ({t,d,a,b,c}) => {
    const p=reveal(t,a-0.65,b+0.7);
    const glow=reveal(t,a-0.35,a+1.8);
    return <g>
      <path d={d} stroke="#315576" strokeWidth={6.5} strokeOpacity={0.42}
        fill="none" strokeLinecap="round"/>
      <path d={d} stroke={c} strokeWidth={8} strokeOpacity={0.10*glow}
        fill="none" strokeLinecap="round" pathLength={100}
        strokeDasharray="100" strokeDashoffset={100*(1-p)}/>
      <path d={d} stroke={c} strokeWidth={4.4} strokeOpacity={0.80*glow}
        fill="none" strokeLinecap="round" pathLength={100}
        strokeDasharray="100" strokeDashoffset={100*(1-p)}/>
    </g>;
  };
const CircleCheck:React.FC<{x:number;y:number;r?:number}> = ({x,y,r=23})=>
  <g><circle cx={x} cy={y} r={r} fill={C.green}/>
    <path d={`M ${x-r*.41} ${y} L ${x-r*.13} ${y+r*.28} L ${x+r*.48} ${y-r*.39}`}
      stroke="#062236" strokeWidth={r*.2} fill="none" strokeLinecap="round"
      strokeLinejoin="round"/></g>;
const DashboardPhone:React.FC<{x:number;y:number;scale?:number;time:number}> = ({x,y,scale=1,time}) => {
  const dashboardAlpha=reveal(time,76,80);
  const dataProgress=reveal(time,94,99);
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
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
    <g opacity={dashboardAlpha}>
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
        <rect x="35" y={256+i*77} width="133" height="14" rx={5} fill="#E1EAF2" opacity={1-dataProgress}/>
        <Text x={35} y={269+i*77} size={20} weight={860} color="#153957" opacity={dataProgress}>
          {['$12,480.00','$3,240.80','4 new items'][i]}
        </Text>
        <circle cx="226" cy={252+i*77} r="9" fill="#CEF5E7" opacity={dataProgress}/>
      </g>
    )}
    <rect x="17" y="453" width="236" height="25" rx="12" fill="#E7EFF6"/>
    <Text x={136} y={471} size={14} weight={720} color="#35617B" anchor="middle">
      HOME   ·   ACTIVITY   ·   PROFILE
    </Text>
    </g>

    <g opacity={1-dashboardAlpha}>
      <Text x={25} y={129} size={27} weight={870} color="#153957">Welcome back</Text>
      <Text x={25} y={155} size={14} color="#597188">Sign in to your account</Text>
      <Text x={25} y={199} size={14} weight={750} color="#3D5B79">Email address</Text>
      <rect x="23" y="211" width="224" height="49" rx="10"
        fill="#FFFFFF" stroke="#C5D6E5" strokeWidth="2"/>
      <Text x={36} y={241} size={17} color="#34516F">alex@example.com</Text>
      <Text x={25} y={295} size={14} weight={750} color="#3D5B79">Password</Text>
      <rect x="23" y="307" width="224" height="49" rx="10"
        fill="#FFFFFF" stroke="#C5D6E5" strokeWidth="2"/>
      <Text x={36} y={338} size={22} weight={800} color="#34516F">••••••••••</Text>
      <rect x="23" y="377" width="224" height="54" rx="12" fill="#2168A7"/>
      <g opacity={1-reveal(time,13,16)}>
        <Text x={135} y={412} size={20} weight={850} anchor="middle">Sign in</Text>
      </g>
      <g opacity={reveal(time,13,16)}>
        <Text x={135} y={412} size={20} weight={850} anchor="middle">Signing in...</Text>
      </g>
      <Text x={135} y={462} size={14} color="#53718D" anchor="middle">
        Secure account access
      </Text>
    </g>
    <rect x="97" y="477" width="76" height="5" rx="2.5" fill="#274963"/>
  </g>;
};

const Label:React.FC<{x:number;y:number;text:string;color:string;opacity:number;w:number}> =
  ({x,y,text,color,opacity,w}) => <g opacity={opacity}>
    <rect x={x} y={y} width={w} height={58} rx={15}
      fill="#102B4A" stroke={color} strokeWidth={2}/>
    <Text x={x+w/2} y={y+37} size={24} color={color} weight={800} anchor="middle">{text}</Text>
  </g>;

export const Shot12CompleteLoginRecapV4:React.FC<Props> = ({audioClips=[],durationInFrames=SHOT12_RECAP_V4_FRAMES}) => {
  const frame=useCurrentFrame();
  const t=(frame/FPS)*(3150/durationInFrames);
  const progress=clamp(frame/durationInFrames);
  const wide=reveal(t,8,19);
  const fadeInMap=reveal(t,10,21);
  const finish=reveal(t,99,103);
  return <div style={{position:'absolute',inset:0,width:W,height:H,overflow:'hidden',
    background:C.bg,fontFamily:AT_FONT}}>
    <svg width={W} height={H} viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0}}>
      <defs>
        <radialGradient id="shot12v2bg" cx=".47" cy=".35" r=".9">
          <stop offset="0" stopColor={C.glow}/><stop offset=".75" stopColor="#061322"/>
          <stop offset="1" stopColor={C.bg}/>
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#shot12v2bg)"/>
      <g stroke="#3C6B94" strokeOpacity=".088" strokeWidth={1}>
        {Array.from({length:18},(_,i)=><path key={'x'+i} d={`M ${95+i*106} 0 V 1080`}/>)}
        {Array.from({length:10},(_,i)=><path key={'y'+i} d={`M 0 ${52+i*110} H 1920`}/>)}
      </g>
      <g opacity={1-reveal(t,89,94)}>
        <Text x={129} y={146} size={51} weight={900}>
          What happens behind one click?
        </Text>
      </g>
      <g opacity={reveal(t,89,94)}>
        <Text x={129} y={146} size={51} weight={900}>
          What Really Happens When You Click Login?
        </Text>
      </g>
      <Text x={133} y={192} size={25} color={C.secondary} opacity={1-finish}>
        From a human action to trusted access.
      </Text>
      <g opacity={0.26+0.74*fadeInMap}>
        {paths.map((path,i)=><Flow key={i} t={t} {...path}/>)}
        {nodes.map(node=><Node key={node.id} t={t} node={node}/>)}
      </g>
      <g transform={`translate(138 245) scale(${mix(1,.91,wide)})`}>
        <DashboardPhone x={0} y={0} time={t}/>
      </g>
      <g opacity={reveal(t,62,66)*(1-reveal(t,91,95))}>
        <path d="M 1192 834 V 850" fill="none" stroke={C.green}
          strokeWidth={3} strokeDasharray="6 5"/>
        <rect x={1062} y={850} width={260} height={48} rx={14}
          fill="#102B4A" stroke={C.green} strokeWidth={2.3}/>
        <Text x={1192} y={882} size={23} color={C.green}
          weight={850} anchor="middle">REUSABLE PROOF</Text>
      </g>
      <g opacity={reveal(t,52,58)*(1-reveal(t,68,73))}>
        <rect x={1318} y={663} width={234} height={52} rx={13}
          fill="#102B4A" stroke={C.green} strokeWidth={2}/>
        <Text x={1435} y={696} size={18} color={C.green}
          weight={830} anchor="middle">CREDENTIALS VERIFIED</Text>
      </g>
      <g opacity={reveal(t,83,87)*(1-reveal(t,94,98))}>
        <Label x={456} y={808} w={229} text="GET /account"
          color={C.cyan} opacity={1}/>
      </g>
      <g opacity={reveal(t,92,96)}>
        <CircleCheck x={377} y={793} r={12}/>
      </g>
      <g opacity={finish}>
        <Panel x={475} y={930} w={1030} h={76} accent={C.green} fill="#164D54">
          <Text x={990} y={978} size={30} weight={860} anchor="middle">
            From a human claim to trusted, controlled access.
          </Text>
        </Panel>
      </g>
      <path d="M 133 1035 H 1786" stroke="#315576" strokeWidth={7} strokeLinecap="round"/>
      <path d={`M 133 1035 H ${133+1653*progress}`} stroke={C.cyan}
        strokeWidth={7} strokeLinecap="round"/>
      {[14,43,82].map((sec,i)=><circle key={i} cx={133+1653*sec/105}
        cy={1005} r={5.25}
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
