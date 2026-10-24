import React from 'react';
import {Easing,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {AuthServiceTier2Shot08BridgeV8} from './AuthServiceTier2Shot08BridgeV8';

const W=1920,H=1080,FPS=30;
const C={bg:'#07192F',cyan:'#43DFFD',ice:'#C9FCFF',muted:'#A5C7D9',text:'#F4FBFF',mint:'#55F0C8'};
const ANCHORS:Record<string,number>={
 GET_FACTS:120.4,INBOX_OPEN:31.8,INSTANCE_B:4.433333333333334,EMAIL_CLAIM:112.13333333333334,
 FORMAT_PREP:57.5,LOOKUP_BORN:125.36666666666666,SECRET_ROLE:46.6,AUTH_ARRIVAL:0.8666666666666667,
 FIND_ACCOUNT:117.23333333333333,INPUT_FIELDS:37.6,LIMITS_CHECK:82.93333333333334,
 CHECKS_PASSED:98.4,FORMAT_EXAMPLE:68.13333333333334,LOOKUP_ACCOUNT:155.83333333333334,
 LOOKUP_TRAVELS:142.96666666666667,ORIGINAL_STAYS:132.43333333333334,
 PROOF_QUESTION:25.966666666666665,REQUIRED_CHECK:76.63333333333334,
 AUTH_DEFINITION:20.833333333333332,IDENTIFIER_ROLE:43.5,NOT_YET_CORRECT:50.566666666666665,
 STRUCTURE_CHECK:79.9,VALIDATION_NAME:60.766666666666666,VALID_NOT_LOGIN:87.03333333333333,
 NOT_SECOND_LOGIN:146.66666666666666,PASSWORD_UNKNOWN:104.63333333333334,
 SERVICE_QUESTION:150.03333333333333,ROUTING_NOT_TRUST:10.666666666666666,
 EMPTY_FIELD_EXAMPLE:65.56666666666666,INFORMATION_FOR_VERIFY:158.66666666666666
};
const STARTS=[24,952,1821,2940,3915];
const t=(seconds:number)=>Math.round(seconds*FPS);
const lim=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(f:number,start:number,end:number)=>interpolate(f,[start,Math.max(start+1,end)],[0,1],{
 extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)
});
type Props={durationInFrames:number;anchors?:Record<string,number>};
const Txt:React.FC<{x:number;y:number;size?:number;weight?:number;color?:string;anchor?:'start'|'middle'|'end';children:React.ReactNode}>=({
 x,y,size=26,weight=670,color=C.text,anchor='start',children
})=><text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor}
 fontFamily={AT_FONT}>{children}</text>;

const OriginalMap:React.FC<{frame:number;dim:number}>=({frame,dim})=>{
 const engage=ease(frame,t(2.4),t(4.2));
 const release=1-ease(frame,t(8.5),t(10.0));
 const live=engage*release;
 const trace=ease(frame,t(3.3),t(8.0));
 return <div style={{position:'absolute',inset:0,opacity:1-dim*.92,
  filter:'blur('+(dim*2.8)+'px)',transform:'scale('+(1+dim*.012)+')',
  transformOrigin:'55% 54%'}}>
  <Sequence from={-4881}><AuthServiceTier2Shot08BridgeV8
     durationInFrames={4882} anchors={ANCHORS} clipStarts={STARTS}/></Sequence>
  <svg width={W} height={H} viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    <defs>
      <filter id="v6-rim-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation={7}/>
      </filter>
      <linearGradient id="v6-node-edge" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0" stopColor="#2A9FD1" stopOpacity=".20"/>
       <stop offset=".6" stopColor="#8AEFFD" stopOpacity=".88"/>
       <stop offset="1" stopColor="#4BA7D1" stopOpacity=".30"/>
      </linearGradient>
    </defs>
    <rect x={1632} y={509} width={203} height={210} rx={17}
      fill="none" stroke="#4EE5FF" strokeWidth={17}
      opacity={live*.12} filter="url(#v6-rim-glow)"/>
    <rect x={1632} y={509} width={203} height={210} rx={17}
      fill="none" stroke="url(#v6-node-edge)" strokeWidth={3}
      pathLength={100} strokeDasharray={''+(trace*100)+' 100'}
      opacity={live*.84}/>
    {[0,1,2].map(i=><g key={i} opacity={live*ease(frame,t(4+i*.9),t(4.7+i*.9))*.68}>
      <path d={'M 1661 '+(566+i*43)+' H 1806'} stroke="#7BE9FA"
        strokeWidth={1.9} strokeDasharray="14 11" strokeLinecap="round"/>
      <circle cx={1652} cy={566+i*43} r={4} fill="#BEF9FF"/>
     </g>)}
    <circle cx={1733} cy={613} r={56} fill="none"
       stroke="#61DEF5" strokeWidth={2.3} opacity={live*.13}/>
  </svg>
 </div>;
};

const rows=[
 {id:'0038',email:'emma@example.net',name:'Emma Chen',status:'ACTIVE',role:'MEMBER'},
 {id:'0041',email:'mia@example.net',name:'Mia Walker',status:'ACTIVE',role:'MEMBER'},
 {id:'0042',email:'alex@example.com',name:'Alex Morgan',status:'ACTIVE',role:'MEMBER'},
 {id:'0047',email:'jordan@example.net',name:'Jordan Lee',status:'ACTIVE',role:'MEMBER'},
 {id:'0052',email:'sam@example.net',name:'Sam Rivera',status:'ACTIVE',role:'MEMBER'},
];
const columnX=[206,370,894,1227,1470], columnTitles=['USER ID','EMAIL','DISPLAY NAME','STATUS','ROLE'];
const ColumnCell:React.FC<{value:string;col:number;y:number;selected:boolean;opacity?:number}>=({
 value,col,y,selected,opacity=1
})=>{
 if(col===3||col===4){const st=col===3,accent=st?'#58F3CB':'#C0B6FF';
  return <g opacity={opacity}>
   <rect x={columnX[col]+20} y={y+23} width={st?159:160} height={43}
     rx={12} fill={st?(selected?'#145D53':'#134A4A'):(selected?'#333E79':'#2B355F')}
     stroke={accent} strokeWidth={selected?1.9:1.3} strokeOpacity={selected?1:.66}/>
   {st&&<circle cx={columnX[col]+38} cy={y+45} r={4.5} fill={accent}/>}
   <Txt x={columnX[col]+(st?51:41)} y={y+54} size={21}
     weight={800} color={selected?C.text:accent}>{value}</Txt>
  </g>;
 }
 return <g opacity={opacity}><Txt x={columnX[col]+22} y={y+57}
   size={col===1?27:24} weight={selected?850:660}
   color={selected?'#F5FEFF':col===0?'#BCDCEB':'#C0D8E7'}>{value}</Txt></g>;
};

type Beats={scan:number;found:number;hero:number;detail:number;rows:number};
const UserRow:React.FC<{frame:number;index:number;record:typeof rows[number];match:number;lift:number;beats:Beats}>=({
 frame,index,record,match,lift,beats
})=>{
 const y=416+index*103,selected=index===2;
 const shown=ease(frame,t(beats.rows)+index*8,t(beats.rows+1.3)+index*8);
 const faded=selected?1:1-ease(frame,t(beats.found+.4),t(beats.found+2.6))*.61;
 const offset=selected?-18*lift:0;
 return <g opacity={shown*faded} transform={'translate(0 '+offset+')'}>
   <rect x={179} y={y} width={1546} height={90} rx={12}
     fill={selected&&match>.04?'#0D4965':'#0C2E48'} fillOpacity={.94+(selected?.05*match:0)}
     stroke={selected&&match>.04?'#5EF0FF':'#447B9A'}
     strokeOpacity={selected?.33+.65*match:.46} strokeWidth={selected?2.9:1.4}/>
   {columnX.slice(1).map((x,i)=><path key={i}
      d={'M '+x+' '+(y+11)+' V '+(y+78)}
      stroke="#35536F" strokeWidth={1.2} opacity=".52"/>)}
   {[record.id,record.email,record.name,record.status,record.role].map((v,i)=>
     <ColumnCell key={i} value={v} col={i} y={y} selected={selected&&match>.1}/>)}
   {selected&&<g opacity={match}>
     <rect x={183} y={y+3} width={1537} height={84} rx={11}
       fill="none" stroke="#6AEEFF" strokeWidth={6} strokeOpacity=".51"/>
     <path d={'M 189 '+(y+18)+' V '+(y+73)+' M 189 '+(y+18)+' H 215 M 189 '+(y+73)+' H 215'}
       stroke="#C4FCFF" strokeWidth={3} fill="none"/>
     <circle cx={1683} cy={y+45} r={14} fill="#12617C"
       stroke="#B9FFFF" strokeWidth={2}/>
     <path d={'M 1677 '+(y+45)+' l 5 5 l 9 -11'} stroke="#D2FFFF" strokeWidth={2.8} fill="none"/>
   </g>}
 </g>;
};

const DatabaseScreen:React.FC<{frame:number;beats:Beats}>=({frame,beats})=>{
 const intro=ease(frame,t(10),t(12.8));
 const table=ease(frame,t(beats.rows),t(beats.rows+2));
 const matched=ease(frame,t(beats.found),t(beats.found+.85));
 const lifted=ease(frame,t(beats.hero),t(beats.hero+2.3));
 const detail=ease(frame,t(beats.detail),t(beats.detail+2.2));
 const scanning=ease(frame,t(beats.scan),t(beats.scan+1))*(1-matched);
 const delta=frame/FPS-beats.scan;
 const focusY=interpolate(frame,
    [t(beats.scan),t(beats.scan+2.2),t(beats.scan+2.95),t(beats.scan+4.65),t(beats.scan+5.4),t(beats.found)],
    [416,416,519,519,622,622],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <svg width={W} height={H} viewBox="0 0 1920 1080" style={{display:'block'}}>
  <defs>
   <radialGradient id="v6-canvas" cx=".5" cy=".35" r=".83">
    <stop offset="0" stopColor="#104462"/><stop offset=".65" stopColor="#0A2C49"/>
    <stop offset="1" stopColor="#061A32"/>
   </radialGradient>
   <linearGradient id="v7-search-halo" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#3CEAFF" stopOpacity=".05"/>
    <stop offset=".45" stopColor="#B4FDFF" stopOpacity=".18"/>
    <stop offset="1" stopColor="#3CEAFF" stopOpacity=".02"/>
   </linearGradient>
  </defs>
  <rect width={W} height={H} fill="url(#v6-canvas)"/>
  <g opacity=".095" stroke="#60A1C4" strokeWidth={1}>
   {Array.from({length:12},(_,i)=><path key={i} d={'M '+(78+i*161)+' 0 V 1080'}/>)}
   {Array.from({length:8},(_,i)=><path key={i} d={'M 0 '+(100+i*125)+' H 1920'}/>)}
  </g>
  <g opacity={intro} transform={'translate(0 '+((1-intro)*15)+')'}>
   <rect x={116} y={74} width={1689} height={120} rx={18}
    fill="#0B2B49" stroke="#5494B8" strokeWidth={1.5} strokeOpacity=".80"/>
   <g transform="translate(183 130)">{[2,1,0].map(i=><g key={i}>
    <rect x={-24} y={-19+i*13} width={48} height={16} rx={3}
      fill="#145375" stroke="#56DDF6" strokeWidth={1.2}/>
    <ellipse cx={0} cy={-20+i*13} rx={24} ry={8}
      fill="#176684" stroke="#96F3FF" strokeWidth={1.6}/>
   </g>)}</g>
   <Txt x={247} y={145} size={36} weight={850} color="#E2F9FF">USER DATABASE</Txt>
   <Txt x={248} y={176} size={19} weight={750} color="#82B4D3">IDENTITY STORE  /  USERS</Txt>


  </g>
  <g opacity={intro}>
   <rect x={177} y={223} width={1548} height={126} rx={17}
     fill="#092E50" stroke="#57A0BE" strokeWidth={1.8} strokeOpacity=".90"/>
   <rect x={205} y={246} width={171} height={76} rx={12}
     fill="#123D59" stroke="#5583A4" strokeWidth={1.2}/>
   <Txt x={240} y={293} size={25} weight={790} color="#B9E2F4">EMAIL</Txt>
   <rect x={396} y={246} width={1006} height={76} rx={12}
     fill="#0D3A59" stroke="#5C9DBA" strokeWidth={1.4}/>
   <Txt x={435} y={294} size={34} weight={820}>alex@example.com</Txt>
   <path d="M 434 312 H 781" stroke="#62D6EA" strokeWidth={2} opacity={matched?.24:.60}/>
   <rect x={1428} y={246} width={263} height={76} rx={12}
     fill="#0C5667" stroke="#55E5ED" strokeWidth={2.1} strokeOpacity="1"/>
   <Txt x={1559} y={293} size={23} weight={840} anchor="middle" color="#B5F2FC">INDEX LOOKUP</Txt>
   <circle cx={1662} cy={262} r={5} fill={matched?'#7EE8C6':'#72DEED'}/>
  </g>
  <g opacity={table}>
   <rect x={178} y={372} width={1547} height={63} rx={10}
     fill="#0B304C" stroke="#4F88A8" strokeWidth={1.4}/>
   {columnTitles.map((value,i)=><Txt key={i} x={columnX[i]+22} y={414}
      size={21} color="#A0CDE4" weight={830}>{value}</Txt>)}
   {rows.map((rec,i)=><UserRow key={i} frame={frame} index={i}
     record={rec} match={matched} lift={lifted} beats={beats}/>)}
  </g>
  <g opacity={scanning}>
   <rect x={360} y={focusY+8} width={534} height={73} rx={12}
     fill="#30D6F2" fillOpacity=".11" stroke="#6FE9FA"
     strokeWidth={2.1} strokeOpacity=".78"/>
   <rect x={373} y={focusY+19} width={510} height={51} rx={9}
     fill="url(#v7-search-halo)" opacity=".66"/>
   <path d={'M 378 '+(focusY+20)+' H 396 M 378 '+(focusY+20)+' V '+(focusY+39)+
      ' M 878 '+(focusY+20)+' H 860 M 878 '+(focusY+20)+' V '+(focusY+39)}
     stroke="#ABF9FF" strokeWidth={2.3} fill="none" strokeLinecap="round"/>
   <circle cx={875} cy={focusY+46} r={5.3} fill="#8DF9FF" opacity=".88"/>
  </g>
  <g opacity={detail} transform={'translate(0 '+(19*(1-detail))+')'}>
   <rect x={180} y={912} width={1545} height={109} rx={17}
     fill="#103E59" stroke="#4BE3F5" strokeWidth={2.2} strokeOpacity=".98"/>
   <rect x={201} y={932} width={264} height={66} rx={12}
     fill="#145E75" stroke="#6AF6FF" strokeOpacity=".86" strokeWidth={1.7}/>
   <circle cx={222} cy={963} r={7} fill="#66F3C8"/>
   <Txt x={238} y={971} size={22} weight={845} color="#F1FEFF">MATCH FOUND</Txt>
   <Txt x={492} y={977} size={32} weight={870} color="#F0FEFF">0042</Txt>
   <path d="M 611 932 V 997 M 1238 932 V 997"
     stroke="#558EA9" strokeWidth={1.3} strokeOpacity=".8"/>
   <Txt x={641} y={955} size={18} weight={770} color="#A5D1E9">IDENTIFIER</Txt>
   <Txt x={641} y={991} size={28} weight={840} color="#E1FCFF">alex@example.com</Txt>
   <Txt x={1267} y={955} size={18} weight={780} color="#A9D9EC">NEXT</Txt>
   <Txt x={1267} y={991} size={26} weight={830} color="#D0F6FF">CREDENTIAL CHECK</Txt>
  </g>
  <path d="M 414 1044 H 1505" stroke="#54BDD5" strokeOpacity=".26" strokeWidth={2}/>
 </svg>;
};

export const UserDatabaseV8Premium:React.FC<Props>=({durationInFrames,anchors={}})=>{
 const frame=useCurrentFrame();
 const cue=(key:string,fallback:number)=>Number.isFinite(anchors[key])?anchors[key]:fallback;
 const beats:Beats={rows:cue('DB_ROWS_START',13.4),scan:cue('DB_ROW_SCAN',20),
  found:cue('DB_ACCOUNT_MATCH',28.5),hero:cue('DB_MATCH_HERO',32.1),
  detail:cue('DB_RESULT_REVEAL',38.3)};
 const open=cue('DB_TABLE_OPEN',8.7);
 const ambient=ease(frame,t(open-1.15),t(open+1.1));
 const fade=ease(frame,t(open),t(open+1.0));
 const shift=(1-fade)*9;
 const signal=ease(frame,t(open-.95),t(open-.30))*
   (1-ease(frame,t(open+1.4),t(open+2.5)));
 return <div style={{position:'absolute',inset:0,width:W,height:H,
   overflow:'hidden',background:C.bg,isolation:'isolate',fontFamily:AT_FONT}}>
  {frame<t(open+3.5)&&<OriginalMap frame={frame} dim={ambient}/>}
  <div style={{position:'absolute',inset:0,opacity:fade,
    transform:'translateY('+shift+'px)',pointerEvents:'none'}}>
   <DatabaseScreen frame={frame} beats={beats}/>
  </div>
  <svg viewBox="0 0 1920 1080" width={W} height={H}
    style={{position:'absolute',inset:0,pointerEvents:'none'}}>
   <g opacity={signal}>
    <path d="M 1827 612 C 1868 612 1889 593 1919 574"
      fill="none" stroke="#91F2FF" strokeWidth={2.3}/>
    <circle cx={1877} cy={600} r={5} fill="#C5FCFF"/>
    <path d="M 146 186 H 1778" fill="none" stroke="#71E8FB"
      strokeWidth={2} strokeOpacity=".45"/>
   </g>
  </svg>
 </div>;
};