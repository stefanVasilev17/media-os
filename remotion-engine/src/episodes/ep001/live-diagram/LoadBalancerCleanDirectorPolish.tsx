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

export const ModeNavigationPolished:React.FC<Phase>=({phase,previous,blend,zoneFocus=0})=>{
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
              flex:1,fontSize:21,fontWeight:735,padding:'9px 5px',textAlign:'center',
              display:'flex',alignItems:'center',justifyContent:'center',minHeight:76,boxSizing:'border-box',lineHeight:'1.15',
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
  {id:'B',x:822,y:540},
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
const EventDashes:React.FC<{
  route:number;frame:number;start:number;duration?:number;
  colorMode?:'blue'|'green'|'amber';count?:number;opacity?:number;
  repeating?:boolean;
}>=({route,frame,start,duration=82,colorMode='blue',count=7,opacity=1,repeating=false})=>{
  const age=frame-start;
  if(age<0||opacity<=0)return null;
  if(!repeating&&age>duration+18)return null;
  const appearance=tween(frame,start,start+12);
  const disappearance=repeating?1:1-tween(frame,start+duration,start+duration+18);
  const palette=colorMode==='green'?['#58EAC0','#65E8D9','#84C5FA','#B2A2FF']:
    colorMode==='amber'?['#EAB46D','#F6D392','#85B5E7']:
    ['#54D1F2','#7EE5D7','#8EBAFC','#B39FFF'];
  const spacing=repeating?1/count:11/duration;
  return <g opacity={Math.max(0,appearance*disappearance*opacity)}>
    {Array.from({length:count},(_,index)=>{
      const progress=repeating?((age/(74+route*9)+index/count)%1):
        Math.min(1.03,Math.max(-.06,age/duration-index*spacing));
      if(progress<.02||progress>.975)return null;
      const pt=point(route,progress);
      const next=point(route,Math.min(1,progress+.012));
      const rotation=Math.atan2(next.y-pt.y,next.x-pt.x)*180/Math.PI;
      const hue=palette[index%palette.length];
      const length=index%4===0?18:index%3===0?13:9;
      const alpha=(.53+.37*Math.sin(progress*Math.PI))*(index%3===0?1:.76);
      return <g key={index} transform={'translate('+pt.x+' '+pt.y+') rotate('+rotation+')'}>
        <rect x={-length/2} y={-2.5} width={length} height={5} rx={2.5}
          fill={hue} opacity={alpha}
          style={{filter:'drop-shadow(0 0 5px '+hue+'88)'}}/>
        {index%3===0&&<rect x={-length/2} y={-1.25} width={length} height={2.5} rx={1.2}
          fill="#DDFBFF" opacity={.35*alpha}/>}
      </g>;
    })}
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
  const dim=isC?1-.19*failed:1;
  const chosen=isB?choice:0;
  return <g opacity={reveal*dim}>
    <rect x="820" y={y-52} rx="18" width="306" height="105"
      fill={chosen>.02?'rgba(13,54,51,.92)':'url(#lb-instance-surface)'}
      stroke={isC&&failed>.65?C.red:chosen>.05?C.green:'#6384B6'}
      strokeWidth={chosen>.05?2.8:1.8}/>
    <rect x="825" y={y-47} rx="14" width="296" height="95"
      fill="none" stroke="rgba(172,204,248,.16)" strokeWidth="1"/>
    <path d={'M 842 '+(y-45)+' H 1046'} stroke={chosen>.05?C.green:C.blue}
      strokeWidth="2" opacity={chosen>.05?.68:.27}/>
    <path d={'M 827 '+(y-33)+' V '+(y+33)}
      stroke={isC&&failed>.65?C.red:chosen>.05?C.green:C.blue}
      strokeWidth="3" opacity=".75" strokeLinecap="round"/>
    <rect x="837" y={y-31} rx="9" width="49" height="57"
      fill="url(#lb-server-surface)" stroke={chosen>.05?C.green:C.blue} strokeWidth="2"/>
    <rect x="841" y={y-27} width="41" height="49" rx="6"
      fill="none" stroke="rgba(191,222,255,.17)" strokeWidth=".9"/>
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

export const LoadBalancerCenterPolished:React.FC<CenterProps>=({phase,frame,anchors,frozen=false})=>{
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
        <linearGradient id="lb-instance-surface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#142C4C"/>
          <stop offset=".56" stopColor="#102441"/>
          <stop offset="1" stopColor="#091A32"/>
        </linearGradient>
        <linearGradient id="lb-server-surface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#254B7A"/>
          <stop offset="1" stopColor="#0C213D"/>
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
      <path d="M 775 91 H 1117" stroke={C.blue} strokeWidth="1"
        opacity={showZone*.18}/>
      <text x="775" y="455" fill={C.green} fontSize="23" fontWeight="830"
        fontFamily={AT_FONT} opacity={showZone}>ZONE B</text>
      <path d="M 775 469 H 1117" stroke={C.green} strokeWidth="1"
        opacity={showZone*(.11+.19*brightZone)}/>
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
      {[0,1,2].map(index=>{
        const isC=index===1;
        const open=phase===0?
          fade(frame,t('THREE_COPIES',7.1)+18+index*12,
            t('THREE_COPIES',7.1)+36+index*12):
          1;
        const intensity=phase===0?.28:distribute?.45:
          roundRobin?.18:hash?.13:health?.12:target?.12:0;
        return <g key={'ambient-'+index}>
          <path d={curve(index)} fill="none" stroke={index===2?C.green:C.blue}
            strokeWidth={7} opacity={open*intensity*.13}
            style={{filter:'blur(4px)'}}/>
          <path d={curve(index)} fill="none" stroke={C.blue}
            strokeWidth={1} strokeDasharray="3 13"
            opacity={open*intensity*.56}/>
          {(phase===0||distribute)&&<EventDashes route={index} frame={frame}
            start={t('THREE_COPIES',7.1)+20+index*13}
            repeating count={index===2?6:5} opacity={open*(distribute?.78:.42)}/>}
        </g>;
      })}
      {roundRobin&&<g>
        <EventDashes route={0} frame={frame} start={t('FIRST_A',38.682)}
          duration={32} colorMode="blue" count={6}/>
        <EventDashes route={2} frame={frame} start={t('SECOND_B',40.762)}
          duration={32} colorMode="blue" count={6}/>
        <EventDashes route={1} frame={frame} start={t('THIRD_C',42.442)}
          duration={32} colorMode="blue" count={6}/>
      </g>}
      {hash&&<g>
        <EventDashes route={2} frame={frame} start={t('HASH_SAMPLES',61.982)}
          duration={50} colorMode="blue" count={8}/>
        <EventDashes route={2} frame={frame} start={t('SAME_DESTINATION',67.022)}
          duration={46} colorMode="blue" count={8}/>
      </g>}
      {health&&failed<.65&&<g>
        <EventDashes route={1} frame={frame} start={t('PROBE_1',79.323)}
          duration={70} colorMode="amber" count={5} opacity={1-failed}/>
        <EventDashes route={1} frame={frame} start={t('PROBE_2',83.123)}
          duration={55} colorMode="amber" count={5} opacity={1-failed}/>
      </g>}
      {target&&greenTravel>.02&&<EventDashes route={2} frame={frame}
        start={t('GREEN_MOVES',133.863)+19} duration={73} colorMode="green"
        count={7} opacity={Math.min(1,greenTravel*3)}/>}
      <path d="M 14 326 H 76" stroke="rgba(88,234,192,.2)"
        strokeWidth={9} fill="none" strokeLinecap="round"/>
      <path d="M 14 326 H 76" stroke="#58EAC0"
        strokeWidth={3.3} fill="none" strokeLinecap="round"
        style={{filter:'drop-shadow(0 0 5px rgba(88,234,192,.56))'}}/>
      <path d="M 77 326 H 317" stroke="#58EAC0" strokeWidth={2.4}
        fill="none" opacity={.30+.56*greenTravel} strokeLinecap="round"/>
      {Array.from({length:6},(_,k)=>{
        const p=((frame*.023+k/6)%1+1)%1;
        const x=16+57*p;
        const hue=['#58EAC0','#52D6F5','#A5A7FF'][k%3];
        return <rect key={'inlet-'+k} x={x} y={324.1} width={k%2===0?8:5}
          height={3.8} rx={1.9} fill={hue} opacity={.26+.40*Math.sin(Math.PI*p)}
          style={{filter:'drop-shadow(0 0 4px '+hue+')'}}/>;
      })}
      <rect x="76" y="247" width="242" height="158" rx="25"
        fill="url(#lb-gateway)" stroke={C.violet} strokeWidth="2.7"/>
      <rect x="83" y="254" width="228" height="144" rx="20"
        fill="none" stroke="rgba(204,207,255,.19)" strokeWidth="1.3"/>
      <path d="M 106 263 H 287" stroke={C.violet} strokeWidth="2"
        opacity=".52" strokeLinecap="round"/>
      <rect x="147" y="268" width="99" height="82" rx="14"
        fill="rgba(27,49,84,.66)" stroke="rgba(124,167,244,.30)" strokeWidth="1.2"/>
      <circle cx="197" cy="290" r="8" fill={C.violet}/>
      <circle cx="164" cy="326" r="8" fill={C.blue}/>
      <circle cx="230" cy="326" r="8" fill={C.blue}/>
      <path d="M 197 290 L 164 326 M 197 290 L 230 326"
        stroke={C.blue} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 110 353 H 285" stroke="rgba(164,175,245,.29)" strokeWidth="1"/>
      <text x="197" y="379" textAnchor="middle" fontSize="23" fontWeight="860"
        fontFamily={AT_FONT} fill={C.white} letterSpacing=".5">LOAD BALANCER</text>
      <path d="M 156 390 H 238" stroke={C.violet} strokeWidth="2" opacity=".50"
        strokeLinecap="round"/>
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
      {!target&&<g>
        <rect x="84" y="184" width="226" height="48" rx="12"
          fill="rgba(8,42,48,.94)" stroke="rgba(88,234,192,.64)" strokeWidth="1.4"/>
        <circle cx="103" cy="208" r="5.5" fill={C.green}/>
        <text x="118" y="215" fill={C.green} fontSize="19"
          fontWeight="820" letterSpacing=".6" fontFamily={AT_FONT}>LOGIN REQUEST</text>
      </g>}
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
          <circle key={i} cx={813} cy={ROUTES[[0,2,1][i]].y}
            r="4" fill={C.blue} opacity=".7"/>)}
      </g>}
      {hash&&<g>
        <Packet route={2} progress={hash1} color={C.blue} number="1"/>
        <Packet route={2} progress={hash2} color={C.blue} number="2"/>
        {hash1>.985&&<circle cx="787" cy="540" r="6.5" fill={C.blue}/>}
        {hash2>.985&&<circle cx="805" cy="540" r="6.5" fill={C.blue}/>}
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
