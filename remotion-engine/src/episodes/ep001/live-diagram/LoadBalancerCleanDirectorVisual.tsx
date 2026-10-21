import React from 'react';
import {Easing, interpolate} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';

const C={
  white:'#F3F7FF',muted:'#A1B6D2',faint:'#687E9E',
  border:'#5775A4',violet:'#AB9BFF',blue:'#82BEFF',
  green:'#58EAC0',amber:'#F7BA72',red:'#FA8492',
};
const limit=(n:number)=>Math.max(0,Math.min(1,n));
const tween=(frame:number,start:number,end:number)=>interpolate(frame,
  [start,Math.max(start+1,end)],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',
    easing:Easing.inOut(Easing.cubic)});
const fade=(frame:number,start:number,end:number)=>interpolate(frame,
  [start,Math.max(start+1,end)],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
const at=(seconds:number)=>Math.round(seconds*30);

type Phase={phase:number;previous:number;blend:number;zoneFocus?:number};
type CenterProps={
  phase:number;frame:number;anchors:Record<string,number>;
  frozen?:boolean;
};
const menus=[
  {name:'Traffic Distribution',items:['Round Robin','Hash Key']},
  {name:'Health Checks',items:['Healthy','Timeout']},
  {name:'Target Choice',items:['Instance','Zone']},
];
const sectionFor=(phase:number):[string,string]=>phase<=2?
  ['Traffic Distribution','Round Robin']:
  phase===3?['Traffic Distribution','Hash Key']:
  phase===4?['Health Checks','Timeout']:
  ['Target Choice','Instance'];

export const ModeNavigation:React.FC<Phase>=({phase,previous,blend,zoneFocus=0})=>{
  const selected=sectionFor(phase),prior=sectionFor(previous);
  const brightness=(section:string,item?:string)=>{
    const current=(selected[0]===section&&(!item||selected[1]===item)?blend:0);
    const earlier=(prior[0]===section&&(!item||prior[1]===item)?1-blend:0);
    if(section==='Target Choice'&&phase===5&&item==='Zone')
      return limit(zoneFocus);
    if(section==='Target Choice'&&phase===5&&item==='Instance')
      return limit((1-zoneFocus)*(current+earlier));
    return limit(current+earlier);
  };
  return <div style={{display:'flex',flexDirection:'column',gap:19,height:'100%'}}>
    {menus.map(group=>{
      const lit=brightness(group.name);
      return <div key={group.name} style={{
        flex:1,background:'linear-gradient(135deg,rgba(20,41,78,.92),rgba(9,24,46,.97))',
        border:'2px solid rgba(135,163,243,'+(.23+.48*lit)+')',
        borderRadius:20,padding:'25px 20px',minHeight:0,
        boxShadow:'0 0 '+Math.round(23*lit)+'px rgba(104,141,244,'+(.11*lit)+')',
        opacity:.75+.25*lit}}>
        <div style={{fontSize:26,fontWeight:825,color:lit>.48?C.white:C.muted,
          lineHeight:1.2,marginBottom:23}}>{group.name}</div>
        <div style={{display:'flex',gap:9}}>
          {group.items.map(item=>{
            const focus=brightness(group.name,item);
            return <div key={item} style={{
              flex:1,fontSize:21,fontWeight:735,padding:'13px 5px',textAlign:'center',
              background:'rgba(43,89,155,'+(.08+.31*focus)+')',
              border:'1px solid rgba(106,170,247,'+(.20+.45*focus)+')',
              borderRadius:12,color:focus>.4?C.blue:C.muted}}>
              {item}
            </div>;
          })}
        </div>
      </div>;
    })}
  </div>;
};

const ROUTES=[
  {id:'A',x:822,y:163},
  {id:'C',x:822,y:317},
  {id:'B',x:822,y:501},
];
const origin={x:332,y:326};
const curve=(index:number)=>'M '+origin.x+' '+origin.y+
  ' C 493 '+origin.y+', 567 '+ROUTES[index].y+', 818 '+ROUTES[index].y;
const point=(index:number,progress:number)=>{
  const t=limit(progress),q=1-t,finish=ROUTES[index];
  return {x:q*q*q*origin.x+3*q*q*t*493+3*q*t*t*567+t*t*t*finish.x,
          y:q*q*q*origin.y+3*q*q*t*origin.y+
            3*q*t*t*finish.y+t*t*t*finish.y};
};
const Packet:React.FC<{route:number;progress:number;color:string;number?:string;scale?:number}>=(
  {route,progress,color,number,scale=1})=>{
  if(progress<=0||progress>=.985)return null;
  const p=point(route,progress);
  return <g style={{filter:'drop-shadow(0 0 9px '+color+'77)'}}>
    <circle cx={p.x} cy={p.y} r={14*scale} fill={color} stroke="#D7F0FF" strokeWidth="2"/>
    {number&&<text x={p.x} y={p.y+6} textAnchor="middle" fontSize={15*scale}
      fontWeight="880" fill="#08162A" fontFamily={AT_FONT}>{number}</text>}
  </g>;
};
const wordAnchor=(anchors:Record<string,number>,key:string,fallback:number)=>
  at(anchors[key]??fallback);
const Group:React.FC<{
  index:number;frame:number;phase:number;failed:number;choice:number;
  reveal:number;zoneFocus:number;
}>=({index,frame,phase,failed,choice,reveal,zoneFocus})=>{
  const name=ROUTES[index].id,y=ROUTES[index].y;
  const isC=name==='C',isB=name==='B';
  const dim=isC?1-.58*failed:1;
  const chosen=isB?choice:0;
  return <g opacity={reveal*dim}>
    <rect x="820" y={y-52} rx="18" width="306" height="105"
      fill={chosen>.02?'rgba(13,54,51,.88)':'rgba(18,35,62,.93)'}
      stroke={isC&&failed>.65?C.red:chosen>.05?C.green:'#516A97'}
      strokeWidth={chosen>.05?3:2}/>
    <rect x="837" y={y-31} rx="7" width="49" height="57"
      fill="rgba(32,65,107,.85)" stroke={chosen>.05?C.green:C.blue} strokeWidth="2"/>
    {[0,1,2].map(i=><g key={i}>
      <circle cx="848" cy={y-18+i*16} r="2.5" fill={chosen>.05?C.green:C.blue}/>
      <path d={'M 857 '+(y-18+i*16)+' H 877'} stroke="#799BC8" strokeWidth="2"/>
    </g>)}
    <text x="903" y={y-18} fill={C.white} fontSize="25" fontFamily={AT_FONT}
      fontWeight="840">INSTANCE {name}</text>
    <text x="903" y={y+11} fill={C.muted} fontSize="20" fontFamily={AT_FONT}>
      Auth Service</text>
    <circle cx="908" cy={y+36} r="5.8"
      fill={isC&&failed>.6?C.red:chosen>.05?C.green:'#74BCEB'}/>
    <text x="922" y={y+42} fontSize="17.5" fontFamily={AT_FONT}
      fontWeight="820" fill={isC&&failed>.6?C.red:chosen>.05?C.green:C.muted}>
      {isC&&failed>.6?'UNHEALTHY':chosen>.05?'SELECTED':'HEALTHY'}
    </text>
    {[0,1,2].map((i)=><rect key={i} x={1080} y={y-22+i*16}
      width={i===0?30:i===1?23:16} height={5} rx={2.5}
      fill={chosen>.05?C.green:i===0?C.blue:'#5F8CC3'}
      opacity={isC&&failed>.6?.3:.75-(i*.13)}/>)}
  </g>;
};

export const LoadBalancerCenter:React.FC<CenterProps>=({phase,frame,anchors,frozen=false})=>{
  const t=(key:string,fallback:number)=>wordAnchor(anchors,key,fallback);
  const arrive=phase===0;
  const distribute=phase===1;
  const roundRobin=phase===2;
  const hash=phase===3;
  const health=phase===4;
  const target=phase>=5;
  const choice=target?tween(frame,t('SELECT_B',116.6),t('SELECT_B',116.6)+24):0;
  const probe1=health?tween(frame,t('PROBE_1',79.323),t('NO_RESPONSE',81.763)):0;
  const probe2=health?tween(frame,t('PROBE_2',83.123),t('THRESHOLD',84.963)):0;
  const failed=phase>=5?1:health?tween(frame,t('MARK_UNHEALTHY',90.003),
    t('ROUTE_REMOVED',92.603)+21):0;
  const sample1=roundRobin?tween(frame,t('FIRST_A',38.682),t('FIRST_A',38.682)+29):0;
  const sample2=roundRobin?tween(frame,t('SECOND_B',40.762),t('SECOND_B',40.762)+29):0;
  const sample3=roundRobin?tween(frame,t('THIRD_C',42.442),t('THIRD_C',42.442)+29):0;
  const hash1=hash?tween(frame,t('HASH_SAMPLES',61.982),t('HASH_SAMPLES',61.982)+45):0;
  const hash2=hash?tween(frame,t('SAME_DESTINATION',67.022),t('SAME_DESTINATION',67.022)+42):0;
  const greenTravel=target?tween(frame,t('GREEN_MOVES',133.863),t('GREEN_MOVES',133.863)+70):0;
  const brightZone=target?tween(frame,t('ZONE_EXPLAIN',121.463),
    t('ZONE_EXPLAIN',121.463)+28):0;
  const revealA=arrive?fade(frame,t('SERVER_A',9.921)-8,t('SERVER_A',9.921)+13):1;
  const revealB=arrive?fade(frame,t('SERVER_B',10.641)-8,t('SERVER_B',10.641)+13):1;
  const revealC=arrive?fade(frame,t('SERVER_C',11.121)-8,t('SERVER_C',11.121)+13):1;
  const reveals=[revealA,revealC,revealB];
  const showZone=target?fade(frame,t('ZONE_EXPLAIN',121.463)-20,t('ZONE_EXPLAIN',121.463)+20):.72;
  const sceneText=arrive?'Three servers. One request.':
    distribute?'Traffic Distribution':roundRobin?'Round Robin':
    hash?'Hash Key':health?'Health Checks':'Target Choice';
  const secondary=arrive?'Which instance should receive our login?':
    distribute?'One entrance. Three eligible destinations.':
    roundRobin?'Request 1 → A    Request 2 → B    Request 3 → C':
    hash?'client-42 → Instance B':
    health?failed>.75?'Instance C · UNHEALTHY':
      frame>=t('NO_RESPONSE',81.763)?'No response from Instance C':'Checking Instance C':
      brightZone>.6?'Instance B · Zone B':'Selecting a healthy instance';
  const queue=distribute?tween(frame,t('BOTTLENECK',22.502),t('BOTTLENECK',22.502)+33):0;
  const distribution=distribute?tween(frame,t('DISTRIBUTION_RULES',27.702),
    t('DISTRIBUTION_RULES',27.702)+38):0;
  return <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',
    overflow:'hidden',fontFamily:AT_FONT,minHeight:0}}>
    <div style={{height:96,flexShrink:0,paddingLeft:13,overflow:'hidden'}}>
      <div style={{fontSize:36,fontWeight:850,color:C.white}}>{sceneText}</div>
      <div style={{fontSize:23,fontWeight:710,color:
        health&&failed>.7?C.amber:target?C.green:C.muted,marginTop:6}}>
        {secondary}
      </div>
    </div>
    <svg viewBox="0 0 1160 642" width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{display:'block',overflow:'hidden',flex:'1 1 0',minHeight:0}}>
      <defs>
        <linearGradient id="lb-gateway" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1B3861"/>
          <stop offset="1" stopColor="#0C1D3A"/>
        </linearGradient>
      </defs>
      <rect x="756" y="42" width="390" height="356" rx="24"
        fill={'rgba(21,42,73,'+(.14+.13*(1-brightZone))+')'}
        stroke={'rgba(107,151,236,'+(.30+.15*(1-brightZone))+')'}
        strokeWidth="2" opacity={showZone}/>
      <rect x="756" y="418" width="390" height="196" rx="24"
        fill={'rgba(9,79,60,'+(.10+.22*brightZone)+')'}
        stroke={'rgba(88,234,192,'+(.26+.53*brightZone)+')'}
        strokeWidth={brightZone>.4?3:2} opacity={showZone}/>
      <text x="775" y="77" fill={C.blue} fontSize="23" fontWeight="830"
        fontFamily={AT_FONT} opacity={showZone}>ZONE A</text>
      <text x="775" y="451" fill={C.green} fontSize="23" fontWeight="830"
        fontFamily={AT_FONT} opacity={showZone}>ZONE B</text>
      {[0,1,2].map(index=>{
        const isC=index===1;
        const strong=index===2&&choice>.05;
        const disabled=isC&&failed>.60;
        const focus=roundRobin?[sample1,sample3,sample2][index]:
          hash?(index===2?Math.max(hash1,hash2):0):
          health?(isC?Math.max(probe1,probe2):0):
          distribute?distribution:0;
        return <g key={index} opacity={reveals[index]}>
          <path d={curve(index)} fill="none" stroke={disabled?'#56657A':
            strong?C.green:focus>.02?C.blue:'#557096'}
            strokeWidth={strong?6:focus>.1?4:2.8}
            strokeDasharray={disabled?'8 11':undefined}
            opacity={disabled?.26:strong?1:.48+.43*focus}/>
          {disabled&&<g opacity={failed}>
            <path d="M 694 309 l 18 18 m 0 -18 l -18 18"
              stroke={C.red} strokeWidth="5" strokeLinecap="round"/>
          </g>}
          <Group index={index} frame={frame} phase={phase}
            failed={failed} choice={choice} reveal={reveals[index]}
            zoneFocus={brightZone}/>
        </g>;
      })}
      <rect x="76" y="247" width="242" height="158" rx="25"
        fill="url(#lb-gateway)" stroke={C.violet} strokeWidth="3"/>
      <circle cx="197" cy="291" r="10" fill={C.violet}/>
      <circle cx="159" cy="322" r="10" fill={C.blue}/>
      <circle cx="231" cy="322" r="10" fill={C.blue}/>
      <path d="M 197 291 L 159 322 M 197 291 L 231 322"
        stroke={C.blue} strokeWidth="4" fill="none"/>
      <text x="197" y="364" textAnchor="middle" fontSize="26" fontWeight="880"
        fontFamily={AT_FONT} fill={C.white}>LOAD BALANCER</text>
      <path d="M 21 326 H 75" stroke={C.green} strokeWidth="3"
        strokeDasharray="9 8" opacity=".83"/>
      {(!target||greenTravel<.99)&&<g
        style={{filter:'drop-shadow(0 0 10px rgba(88,234,192,.44))'}}>
        {(()=>{
          const travel=target?greenTravel:0;
          const advance=travel<.32?0:(travel-.32)/.68;
          const p=point(2,advance);
          return <circle
            cx={travel<.32?29+303*travel/.32:p.x}
            cy={travel<.32?326:p.y}
            r={14} fill={C.green}
            stroke="#D4FFEB" strokeWidth="2.5"/>;
        })()}
      </g>}
      {!target&&<text x="20" y="296" fill={C.green} fontSize="23"
        fontWeight="830" fontFamily={AT_FONT}>LOGIN REQUEST</text>}
      {distribute&&queue>.1&&
        [0,1,2,3].map((i)=><circle key={i} cx={345+i*27} cy={262}
          r="9" stroke="#CDEBFF" strokeWidth="1.5" fill={C.blue}
          opacity={queue*(1-distribution)}/>)}
      {distribute&&distribution>.02&&[0,1,2].map((i)=>
        <Packet key={i} route={i} progress={limit((distribution*1.65-i*.3))}
          color={C.blue} number={String(i+1)}/>)}
      {roundRobin&&<g>
        <Packet route={0} progress={sample1} color={C.blue} number="1"/>
        <Packet route={2} progress={sample2} color={C.blue} number="2"/>
        <Packet route={1} progress={sample3} color={C.blue} number="3"/>
        {[sample1,sample2,sample3].map((v,i)=>v>.95&&
          <text key={i} x={780} y={ROUTES[[0,2,1][i]].y-63}
            textAnchor="middle" fontSize="19" fontWeight="810"
            fontFamily={AT_FONT} fill={C.blue}>{i+1}</text>)}
      </g>}
      {hash&&<g>
        <Packet route={2} progress={hash1} color={C.blue} number="1"/>
        <Packet route={2} progress={hash2} color={C.blue} number="2"/>
        {hash1>.985&&<circle cx="783" cy="473" r="8.5" fill={C.blue}/>}
        {hash2>.985&&<circle cx="808" cy="473" r="8.5" fill={C.blue}/>}
        <rect x="362" y="168" rx="12" width="232" height="58"
          fill="rgba(19,47,79,.95)" stroke={C.blue} strokeWidth="2"/>
        <text x="478" y="205" fontFamily={AT_FONT} fontSize="25"
          fontWeight="800" fill={C.white} textAnchor="middle">client-42</text>
      </g>}
      {health&&<g>
        <Packet route={1} progress={probe1} color={C.amber}/>
        <Packet route={1} progress={probe2} color={C.amber}/>
        {frame>=t('NO_RESPONSE',81.763)&&failed<.65&&
          <text x="635" y="254" textAnchor="middle" fontSize="24"
            fontWeight="835" fill={C.amber} fontFamily={AT_FONT}>
            {frame>=t('THRESHOLD',84.963)?'TIMEOUT':'NO RESPONSE'}
          </text>}
      </g>}
    </svg>
  </div>;
};
