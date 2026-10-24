import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';

type Props={durationInFrames:number;anchors?:Record<string,number>};
const W=1920,H=1080,FPS=30;
const BG='#081B34',CYAN='#43DFFF',MINT='#46E7BD',WHITE='#F3F8FF',MUTED='#A9C0D7',VIOLET='#A59DFF';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const move=(f:number,a:number,b:number)=>interpolate(f,[a,Math.max(a+.001,b)],[0,1],{
 extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const Text:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:'start'|'middle'|'end';spacing?:number}>=({
 x,y,children,size=25,color=WHITE,weight=600,anchor='start',spacing=0
})=><text x={x} y={y} fontFamily={AT_FONT} fontSize={size} fill={color}
 fontWeight={weight} textAnchor={anchor} letterSpacing={spacing}>{children}</text>;

const Tag:React.FC<{x:number;y:number;w:number;h?:number;value:string;accent?:string;faint?:boolean}>=({
 x,y,w,h=43,value,accent=CYAN,faint=false
})=><g opacity={faint?.68:1}>
 <rect x={x} y={y} width={w} height={h} rx={13}
  fill="#143858" stroke={accent} strokeWidth={1.5} strokeOpacity={.6}/>
 <Text x={x+w/2} y={y+h/2+7} anchor="middle" size={20} weight={790}
  color={accent}>{value}</Text>
</g>;

const Server:React.FC<{x:number;y:number;active?:boolean}>=({x,y,active=false})=><g>
 {[0,1,2].map((i)=><g key={i} opacity={active||i<2?.9:.47}>
  <rect x={x} y={y+i*35} width={105} height={28} rx={9}
   fill="#113957" stroke={active?'#65E9CB':'#517D9D'} strokeWidth={1.8}/>
  <circle cx={x+15} cy={y+14+i*35} r={3.5} fill={active?'#7DF1CF':'#84A9C8'}/>
  <path d={'M '+(x+34)+' '+(y+14+i*35)+' H '+(x+80)} stroke="#628AAA"
   strokeWidth={2.5} strokeLinecap="round"/>
 </g>)}
</g>;

const DatabaseStack:React.FC<{x:number;y:number;scale?:number;seconds:number}>=({
 x,y,scale=1,seconds
})=><g transform={'translate('+x+' '+y+') scale('+scale+')'}>
 <defs>
  <linearGradient id="s08v2-db-shell" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stopColor="#0B3B62"/><stop offset=".5" stopColor="#0B5683"/>
   <stop offset="1" stopColor="#05213D"/>
  </linearGradient>
 </defs>
 {[2,1,0].map((i)=>{
  const top=i*56,shimmer=.5+.5*Math.sin(seconds*4-i*1.7);
  return <g key={i}>
   <rect x={0} y={top+10} width={178} height={44} rx={8} fill="url(#s08v2-db-shell)"
    stroke="#239CCA" strokeWidth={1.5}/>
   <ellipse cx={89} cy={top+9} rx={88} ry={17} fill="#0B4E77" stroke="#62DAFF"
    strokeOpacity={.6+.35*shimmer} strokeWidth={2}/>
   <ellipse cx={89} cy={top+8} rx={66} ry={11} fill="none"
    stroke="#91EEFF" strokeOpacity={.25+.32*shimmer} strokeWidth={1.3}/>
   <path d={'M 17 '+(top+33)+' H 112 M 129 '+(top+33)+' H 161'}
    stroke="#83E8FC" strokeWidth={2.2} strokeLinecap="round" opacity={.37+.3*shimmer}/>
  </g>;
 })}
</g>;

const MapCard:React.FC<{x:number;y:number;title:string;accent:string;dim?:boolean;children:React.ReactNode}>=({
 x,y,title,accent,dim=false,children
})=><g opacity={dim?.52:1}>
 <rect x={x+4} y={y+8} width={337} height={314} rx={26}
  fill={accent} fillOpacity=".07"/>
 <rect x={x} y={y} width={337} height={314} rx={26}
  fill="#0A2441" stroke={accent} strokeWidth={2.1} strokeOpacity={dim?.47:.76}/>
 <Text x={x+168.5} y={y+42} size={26} weight={790}
  color={dim?'#B4C3D6':WHITE} anchor="middle">{title}</Text>
 <path d={'M '+(x+23)+' '+(y+61)+' H '+(x+314)} stroke="#2D4E70" strokeWidth={1.5}/>
 {children}
</g>;

const CenteredMap:React.FC<{seconds:number;opacity:number;zoom:number;returnProgress:number}>=({
 seconds,opacity,zoom,returnProgress
})=>{
 const camera=1+.07*zoom;
 const scan=(seconds*.19)%1;
 const replyX=1381-(1381-1278)*returnProgress;
 const packetVisibility=move(returnProgress,0,.12)*(1-move(returnProgress,.93,1));
 return <svg viewBox="0 0 1920 1080" width="100%" height="100%"
  style={{position:'absolute',inset:0,opacity,pointerEvents:'none'}}>
  <defs>
   <radialGradient id="s08v2-map-bg" cx=".52" cy=".49" r=".79">
    <stop offset="0" stopColor="#103253"/><stop offset=".69" stopColor="#0B2340"/>
    <stop offset="1" stopColor={BG}/>
   </radialGradient>
   <filter id="s08v2-map-glow" x="-200%" y="-200%" width="500%" height="500%">
    <feGaussianBlur stdDeviation={9}/>
   </filter>
   <clipPath id="s08v2-db-clip"><rect x={1470} y={429} width={218} height={186} rx={12}/></clipPath>
  </defs>
  <rect x={0} y={0} width={W} height={H} fill="url(#s08v2-map-bg)"/>
  <g opacity=".19" stroke="#245276" strokeWidth={1}>
   {[205,365,525,685,845].map((y)=><path key={y} d={'M 118 '+y+' H 1802'}/>)}
  </g>
  <g transform={'translate(960 540) scale('+camera+') translate(-960 -540)'}>
   <path d="M 532 539 H 584 M 952 539 H 1004 M 1372 539 H 1424" fill="none"
    stroke="#266C8F" strokeWidth={4} strokeDasharray="6 9" strokeLinecap="round"/>
   <MapCard x={196} y={340} title="API Gateway" accent="#5A8DCD" dim>
    <Text x={364} y={435} size={21} color={MUTED} anchor="middle">Routing</Text>
    <path d="M 242 491 H 486" stroke="#356C91" strokeWidth={3}/>
    <Tag x={238} y={532} w={121} value="ROUTE" faint/>
    <Tag x={373} y={532} w={121} value="FILTER" faint/>
   </MapCard>
   <MapCard x={616} y={340} title="Load Balancer" accent="#6E88C8" dim>
    <Server x={678} y={444}/>
    <path d="M 793 460 H 893 M 793 495 H 893 M 793 530 H 893" stroke="#4A92AD"
     strokeWidth={2} strokeOpacity=".7"/>
    <circle cx={894} cy={495} r={8} fill="#46B6CE"/>
   </MapCard>
   <MapCard x={1036} y={340} title="Auth Service" accent={MINT}>
    <Text x={1204} y={428} anchor="middle" color="#78EAD1" size={21} weight={760}>LOGIN REQUEST</Text>
    <rect x={1085} y={469} width={239} height={98} rx={16}
     fill="#0A3A43" stroke="#58D6B8" strokeOpacity=".72" strokeWidth={2}/>
    <circle cx={1204} cy={518} r={16} fill={MINT} fillOpacity=".23"
     stroke={MINT} strokeWidth={2.6}/>
    <circle cx={1204} cy={518} r={7} fill="#C2FFF0"/>
    <Tag x={1103} y={588} w={202} value="WAITING" accent={MINT}/>
   </MapCard>
   <MapCard x={1456} y={340} title="User Database" accent={CYAN}>
    <g clipPath="url(#s08v2-db-clip)">
     <DatabaseStack x={1491} y={440} seconds={seconds} scale={.99}/>
     <path d={'M 1472 '+(442+167*scan)+' H 1685'} stroke="#A0FBFF"
      strokeWidth={4} strokeLinecap="round"/>
     <path d={'M 1472 '+(442+167*scan)+' H 1685'} stroke="#00DDFB"
      strokeWidth={16} opacity=".25" filter="url(#s08v2-map-glow)"/>
    </g>
   </MapCard>
   <circle cx={1430} cy={539} r={9} fill="#9AFCFF"
    opacity={.65+.35*Math.sin(seconds*3)}/>
   <path d="M 1382 539 H 1447" stroke={CYAN} strokeWidth={4.3}
    strokeOpacity={returnProgress*.9}/>
   <circle cx={replyX} cy={539} r={12} fill="#92F5FF" opacity={packetVisibility}/>
   <circle cx={replyX} cy={539} r={27} fill="#42E3FF"
    fillOpacity={packetVisibility*.14}/>
  </g>
 </svg>;
};

const Card:React.FC<{x:number;y:number;w:number;h:number;title:string;accent?:string;opacity?:number;children:React.ReactNode}>=({
 x,y,w,h,title,accent=CYAN,opacity=1,children
})=><g opacity={opacity}>
 <rect x={x+4} y={y+8} width={w} height={h} rx={20}
  fill={accent} fillOpacity=".055"/>
 <rect x={x} y={y} width={w} height={h} rx={20}
  fill="#0B2A49" stroke={accent} strokeWidth={2} strokeOpacity=".74"/>
 <Text x={x+26} y={y+40} size={25} color={accent} weight={810} spacing={.5}>{title}</Text>
 <path d={'M '+(x+25)+' '+(y+56)+' H '+(x+w-25)} stroke="#35617C" strokeWidth={1.5}/>
 {children}
</g>;

const AccountRow:React.FC<{x:number;y:number;name:string;number:string;selected:boolean;intensity:number}>=({
 x,y,name,number,selected,intensity
})=><g>
 <rect x={x} y={y} width={575} height={102} rx={17}
  fill={selected?'#0D3B57':'#102D4A'}
  stroke={selected?'#49E8FF':'#3D607E'}
  strokeWidth={selected?2.8:1.5} opacity={selected?1:.83}/>
 <circle cx={x+43} cy={y+51} r={21} fill="#184762"
  stroke={selected?'#A0F7FF':'#78A8C7'} strokeWidth={1.7}/>
 <circle cx={x+43} cy={y+44} r={7.2} fill="none"
  stroke={selected?'#C6FFFF':'#AAC3D8'} strokeWidth={1.8}/>
 <path d={'M '+(x+29)+' '+(y+65)+' Q '+(x+43)+' '+(y+47)+' '+(x+57)+' '+(y+65)}
  fill="none" stroke={selected?'#C6FFFF':'#AAC3D8'} strokeWidth={1.8}/>
 <Text x={x+82} y={y+42} size={20} color={selected?'#C6F8FF':'#B5C9DB'}
  weight={760}>ACCOUNT {number}</Text>
 <Text x={x+82} y={y+75} size={25} color={selected?WHITE:'#AFC3D8'} weight={selected?730:540}>
  {name}</Text>
 {selected&&<circle cx={x+538} cy={y+51} r={9} fill={CYAN} opacity={.65+.35*intensity}/>}
</g>;

const AccessNetwork:React.FC<{opacity:number}>=({opacity})=><g opacity={opacity}>
 <Card x={931} y={664} w={790} h={234} title="ACCESS RIGHTS" accent={VIOLET}>
  <rect x={961} y={744} width={215} height={112} rx={17}
   fill="#242E58" stroke="#B9B1FF" strokeWidth={2.1}/>
  <Text x={1069} y={786} size={20} color="#B9B8FF" weight={785} anchor="middle">ROLE</Text>
  <Text x={1069} y={827} size={29} color="#F3F1FF" weight={845} anchor="middle">MEMBER</Text>
  <circle cx={1177} cy={800} r={7} fill="#C5BDFF"/>
  <path d="M 1184 800 H 1227 M 1227 750 V 851" stroke="#A59DFF" strokeWidth={2.6}
   fill="none" strokeLinecap="round"/>
  {['PROFILE','ORDERS','SUPPORT'].map((name,i)=>{
   const y=731+i*55;
   return <g key={name}>
    <path d={'M 1227 '+(y+21)+' H 1255'} stroke={VIOLET} strokeWidth={2.2}/>
    <rect x={1255} y={y} width={427} height={45} rx={13}
     fill="#151F48" stroke="#656FB3" strokeWidth={1.5}/>
    <circle cx={1282} cy={y+22.5} r={8} fill="#A9A4F6" fillOpacity=".7"/>
    <Text x={1308} y={y+31} size={23} weight={760} color="#E5E4FF">{name}</Text>
    <path d={'M 1607 '+(y+23)+' H 1648'} stroke="#8886D4" strokeWidth={2} opacity=".66"/>
   </g>;
  })}
 </Card>
</g>;

const Verifier:React.FC<{opacity:number}>=({opacity})=><g opacity={opacity}>
 <Card x={931} y={664} w={790} h={234} title="STORED CREDENTIAL VERIFIER">
  {[
   {name:'KDF',value:'Argon2id'},
   {name:'SALT',value:'6f4c…91a2'},
   {name:'DIGEST',value:'b81e…c5d0'}
  ].map((d,i)=>{
   const x=964+i*247;
   return <g key={d.name}>
    <Text x={x} y={762} size={21} color={MUTED} weight={790}>{d.name}</Text>
    <rect x={x} y={780} width={214} height={71} rx={12}
     fill="#123D60" stroke="#497E9F" strokeWidth={1.7}/>
    <Text x={x+107} y={824} size={24} weight={780} color="#BAF4FF"
     anchor="middle">{d.value}</Text>
   </g>;
  })}
 </Card>
</g>;

const Closeup:React.FC<{seconds:number;opacity:number;found:number;rights:number;verifier:number;reply:number}>=({
 seconds,opacity,found,rights,verifier,reply
})=>{
 const scanY=312+392*((seconds*.14)%1);
 const record=clamp(found);
 const fade=move(found,.12,.86);
 return <svg viewBox="0 0 1920 1080" width="100%" height="100%"
  style={{position:'absolute',inset:0,opacity,pointerEvents:'none'}}>
  <defs>
   <radialGradient id="s08v2-close-bg" cx=".53" cy=".46" r=".8">
    <stop offset="0" stopColor="#123D60"/><stop offset=".65" stopColor="#092845"/>
    <stop offset="1" stopColor={BG}/>
   </radialGradient>
   <linearGradient id="s08v2-scan" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#20CFFF" stopOpacity="0"/>
    <stop offset=".55" stopColor="#20DFFF" stopOpacity=".24"/>
    <stop offset=".83" stopColor="#95F8FF" stopOpacity=".8"/>
    <stop offset="1" stopColor="#00DAFF" stopOpacity="0"/>
   </linearGradient>
   <clipPath id="s08v2-rows"><rect x={208} y={305} width={626} height={457} rx={20}/></clipPath>
  </defs>
  <rect width={W} height={H} fill="url(#s08v2-close-bg)"/>
  <rect x={91} y={68} width={1738} height={948} rx={30}
   fill="#081C35" fillOpacity=".22" stroke="#284D72" strokeWidth={1.6}/>
  <circle cx={154} cy={131} r={8.7} fill={CYAN}/>
  <Text x={181} y={142} size={27} color="#A3EFFF" weight={830} spacing={1.2}>
   USER DATABASE
  </Text>
  <path d="M 95 186 H 1824" stroke="#35617E" strokeWidth={1.5}/>
  <Text x={211} y={267} size={34} weight={820}>Account lookup</Text>
  <rect x={201} y={300} width={646} height={467} rx={20}
   fill="#091E39" stroke="#3C7596" strokeWidth={1.7}/>
  <g clipPath="url(#s08v2-rows)">
   {[
    {n:'041',name:'mia@example.net'},
    {n:'042',name:'alex@example.com'},
    {n:'043',name:'jordan@example.net'}
   ].map((r,i)=><AccountRow key={r.n} x={232} y={326+i*132}
    name={r.name} number={r.n} selected={i===1&&record>.04} intensity={record}/>)}
   <rect x={220} y={scanY-30} width={608} height={39}
    fill="url(#s08v2-scan)" opacity={1-record*.8}/>
   <path d={'M 220 '+scanY+' H 828'} stroke="#91F7FF" strokeWidth={3}
    opacity={1-record*.8}/>
  </g>
  <g opacity={record}>
   <path d="M 808 511 H 932" stroke={CYAN} strokeWidth={3.8}/>
   <circle cx={931} cy={511} r={7.5} fill="#A3FCFF"/>
  </g>
  <g opacity={record}>
   <Card x={931} y={220} w={790} h={171} title="USER DATA">
    <Text x={959} y={328} size={36} weight={805}>Alex Morgan</Text>
    <Tag x={1417} y={301} w={266} value="ACCOUNT · 0042"/>
   </Card>
   <Card x={931} y={414} w={374} h={218} title="PROFILE" opacity={fade}>
    <Text x={959} y={523} size={24} weight={740}>alex@example.com</Text>
    <Text x={959} y={568} size={24} color="#B2D7EA" weight={700}>Alex Morgan</Text>
   </Card>
   <Card x={1326} y={414} w={395} h={218} title="ACCOUNT STATUS" opacity={fade}>
    <Text x={1354} y={512} size={21} color={MUTED} weight={740}>STATUS</Text>
    <Text x={1678} y={512} size={22} color="#79EFCE" anchor="end" weight={810}>ACTIVE</Text>
    <path d="M 1353 527 H 1691" stroke="#315676" strokeWidth={1.2}/>
    <Text x={1354} y={557} size={21} color={MUTED} weight={740}>EMAIL</Text>
    <Text x={1678} y={557} size={22} color="#7AE8D9" anchor="end" weight={810}>VERIFIED</Text>
    <path d="M 1353 573 H 1691" stroke="#315676" strokeWidth={1.2}/>
    <Text x={1354} y={604} size={21} color={MUTED} weight={740}>TIER</Text>
    <Text x={1678} y={604} size={22} color="#D7EFFF" anchor="end" weight={810}>STANDARD</Text>
   </Card>
  </g>
  <AccessNetwork opacity={rights*(1-verifier)}/>
  <Verifier opacity={verifier}/>
  <g opacity={reply}>
   <path d="M 931 945 H 1699" stroke={CYAN} strokeWidth={2.2}/>
   <circle cx={932} cy={945} r={11} fill="#8EFAFF"/>
   <Text x={1313} y={939} size={24} color="#B4F1FF" weight={770} anchor="middle">
    ACCOUNT FACTS
   </Text>
  </g>
 </svg>;
};

export const UserDatabaseHappyPathV2:React.FC<Props>=({durationInFrames,anchors={}})=>{
 const frame=useCurrentFrame();
 const seconds=frame/FPS,full=Math.max(1,durationInFrames/FPS);
 const cue=(name:string,seconds95:number)=>Number.isFinite(anchors[name])?anchors[name]:seconds95*full/95;
 const search=cue('FIND_ACCOUNT',18);
 const rightsStart=cue('ACCESS_RIGHTS',37);
 const verifierStart=cue('STORED_VERIFIER',55);
 const returnStart=cue('FACTS_RETURN',75);
 const mapOut=move(seconds,11,19);
 const mapIn=move(seconds,returnStart+3,returnStart+12);
 const closeOpacity=clamp(mapOut*(1-mapIn));
 const wideOpacity=1-closeOpacity;
 const found=move(seconds,search+10,search+17);
 const rights=move(seconds,rightsStart+1,rightsStart+8);
 const verifier=move(seconds,verifierStart+2,verifierStart+8);
 const reply=move(seconds,returnStart+1,returnStart+6)*(1-mapIn);
 const returnProgress=move(seconds,returnStart+12,full-3);
 const focusZoom=move(seconds,5,14)*(1-mapIn);
 return <div style={{position:'absolute',inset:0,width:W,height:H,overflow:'hidden',
  fontFamily:AT_FONT,isolation:'isolate',background:BG}}>
  <CenteredMap seconds={seconds} opacity={wideOpacity} zoom={focusZoom}
    returnProgress={returnProgress}/>
  <Closeup seconds={seconds} opacity={closeOpacity} found={found} rights={rights}
    verifier={verifier} reply={reply}/>
 </div>;
};
