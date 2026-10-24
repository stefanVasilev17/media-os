import React from 'react';
import {Easing,Sequence,interpolate,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {AuthServiceTier2V10YoutubePreview} from './AuthServiceTier2V10YoutubePreview';

const W=1920,H=1080,FPS=30;
const C={bg:'#081B34',cyan:'#45DFFF',ice:'#BEFAFF',muted:'#93B8D0',text:'#F0F7FF',mint:'#43E5C0'};
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
 return <div style={{position:'absolute',inset:0,opacity:1-dim*.84,
  filter:'blur('+(dim*2.8)+'px)',transform:'scale('+(1+dim*.02)+')',
  transformOrigin:'55% 54%'}}>
  <Sequence from={-4881}><AuthServiceTier2V10YoutubePreview
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
 if(col===3||col===4){const st=col===3,accent=st?'#74E4C5':'#A9AEF7';
  return <g opacity={opacity}>
   <rect x={columnX[col]+20} y={y+23} width={st?159:160} height={43}
     rx={12} fill={st?'#124149':'#242E56'}
     stroke={accent} strokeWidth={1.1} strokeOpacity={selected?.85:.34}/>
   {st&&<circle cx={columnX[col]+38} cy={y+45} r={4.5} fill={accent}/>}
   <Txt x={columnX[col]+(st?51:41)} y={y+54} size={21}
     weight={780} color={selected?C.text:accent}>{value}</Txt>
  </g>;
 }
 return <g opacity={opacity}><Txt x={columnX[col]+22} y={y+57}
   size={col===1?27:24} weight={selected?820:640}
   color={selected?'#F1FCFF':col===0?'#ADDDEB':'#B5CDDB'}>{value}</Txt></g>;
};

type Beats={scan:number;found:number;hero:number;detail:number;rows:number};
const UserRow:React.FC<{frame:number;index:number;record:typeof rows[number];match:number;lift:number;beats:Beats}>=({
 frame,index,record,match,lift,beats
})=>{
 const y=416+index*103,selected=index===2;
 const shown=ease(frame,t(beats.rows)+index*8,t(beats.rows+1.3)+index*8);
 const faded=selected?1:1-ease(frame,t(beats.found+.4),t(beats.found+2.6))*.74;
 const offset=selected?-39*lift:0;
 return <g opacity={shown*faded} transform={'translate(0 '+offset+')'}>
   <rect x={179} y={y} width={1546} height={90} rx={12}
     fill={selected&&match>.04?'#103C54':'#0C2A43'} fillOpacity={.57+(selected?.29*match:0)}
     stroke={selected&&match>.04?'#6AE9FA':'#3C607D'}
     strokeOpacity={selected?.27+.69*match:.27} strokeWidth={selected?2.7:1.1}/>
   {columnX.slice(1).map((x,i)=><path key={i}
      d={'M '+x+' '+(y+11)+' V '+(y+78)}
      stroke="#35536F" strokeWidth={1.2} opacity=".52"/>)}
   {[record.id,record.email,record.name,record.status,record.role].map((v,i)=>
     <ColumnCell key={i} value={v} col={i} y={y} selected={selected&&match>.1}/>)}
   {selected&&<g opacity={match}>
     <rect x={183} y={y+3} width={1537} height={84} rx={11}
       fill="none" stroke="#68E9FF" strokeWidth={6} strokeOpacity=".25"/>
     <path d={'M 189 '+(y+18)+' V '+(y+73)+' M 189 '+(y+18)+' H 215 M 189 '+(y+73)+' H 215'}
       stroke="#C4FCFF" strokeWidth={3} fill="none"/>
     <circle cx={1683} cy={y+45} r={14} fill="#124D62"
       stroke="#A7FAFF" strokeWidth={2}/>
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
 const selectedRow=delta<2.4?0:delta<4.85?1:2;
 const y=416+selectedRow*103;
 const cursor=ease(frame,t(beats.scan)+Math.max(0,selectedRow)*t(2.45),
      t(beats.scan+1.6)+selectedRow*t(2.45));
 return <svg width={W} height={H} viewBox="0 0 1920 1080" style={{display:'block'}}>
  <defs>
   <radialGradient id="v6-canvas" cx=".5" cy=".35" r=".83">
    <stop offset="0" stopColor="#153E58"/><stop offset=".65" stopColor="#0B2843"/>
    <stop offset="1" stopColor="#06172C"/>
   </radialGradient>
   <linearGradient id="v6-highlight" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#36D3EC" stopOpacity="0"/>
    <stop offset=".45" stopColor="#60E1F7" stopOpacity=".08"/>
    <stop offset="1" stopColor="#36D3EC" stopOpacity="0"/>
   </linearGradient>
  </defs>
  <rect width={W} height={H} fill="url(#v6-canvas)"/>
  <g opacity=".095" stroke="#60A1C4" strokeWidth={1}>
   {Array.from({length:12},(_,i)=><path key={i} d={'M '+(78+i*161)+' 0 V 1080'}/>)}
   {Array.from({length:8},(_,i)=><path key={i} d={'M 0 '+(100+i*125)+' H 1920'}/>)}
  </g>
  <g opacity={intro} transform={'translate(0 '+((1-intro)*15)+')'}>
   <rect x={116} y={74} width={1689} height={120} rx={18}
    fill="#0D2943" stroke="#41718F" strokeWidth={1.4} strokeOpacity=".65"/>
   <g transform="translate(183 130)">{[2,1,0].map(i=><g key={i}>
    <rect x={-24} y={-19+i*13} width={48} height={16} rx={3}
      fill="#145375" stroke="#56DDF6" strokeWidth={1.2}/>
    <ellipse cx={0} cy={-20+i*13} rx={24} ry={8}
      fill="#176684" stroke="#96F3FF" strokeWidth={1.6}/>
   </g>)}</g>
   <Txt x={247} y={145} size={36} weight={850} color="#E2F9FF">USER DATABASE</Txt>
   <Txt x={248} y={176} size={19} weight={750} color="#82B4D3">IDENTITY STORE  /  USERS</Txt>
   {[{x:1157,w:179,text:'READ ACCESS',c:'#8BC9E9'},
     {x:1346,w:196,text:'INDEX ACTIVE',c:'#7CE5D6'},
     {x:1550,w:219,text:'QUERY 001',c:'#ADA9F1'}].map((i,j)=><g key={j}>
      <rect x={i.x} y={113} width={i.w} height={44} rx={12}
        fill="#153753" stroke={i.c} strokeOpacity=".5" strokeWidth={1.1}/>
      <circle cx={i.x+15} cy={136} r={4.4} fill={i.c}/>
      <Txt x={i.x+31} y={144} size={18} weight={790} color={i.c}>{i.text}</Txt>
     </g>)}
  </g>
  <g opacity={intro}>
   <rect x={177} y={223} width={1548} height={126} rx={17}
     fill="#0A2B46" stroke="#447E9B" strokeWidth={1.5} strokeOpacity=".75"/>
   <rect x={205} y={246} width={171} height={76} rx={12}
     fill="#123D59" stroke="#5583A4" strokeWidth={1.2}/>
   <Txt x={240} y={293} size={25} weight={790} color="#B9E2F4">EMAIL</Txt>
   <rect x={396} y={246} width={1006} height={76} rx={12}
     fill="#11344E" stroke="#457B99" strokeWidth={1.2}/>
   <Txt x={435} y={294} size={34} weight={820}>alex@example.com</Txt>
   <path d="M 434 312 H 781" stroke="#62D6EA" strokeWidth={2} opacity={matched?.24:.60}/>
   <rect x={1428} y={246} width={263} height={76} rx={12}
     fill="#114355" stroke="#53CDDC" strokeWidth={1.7} strokeOpacity=".74"/>
   <Txt x={1559} y={293} size={23} weight={840} anchor="middle" color="#B5F2FC">INDEX LOOKUP</Txt>
   <circle cx={1662} cy={262} r={5} fill={matched?'#7EE8C6':'#72DEED'}/>
  </g>
  <g opacity={table}>
   <rect x={178} y={372} width={1547} height={63} rx={10}
     fill="#0A243E" stroke="#3D6281" strokeWidth={1.1}/>
   {columnTitles.map((value,i)=><Txt key={i} x={columnX[i]+22} y={414}
      size={21} color="#A0CDE4" weight={830}>{value}</Txt>)}
   {rows.map((rec,i)=><UserRow key={i} frame={frame} index={i}
     record={rec} match={matched} lift={lifted} beats={beats}/>)}
  </g>
  <g opacity={scanning}>
   <rect x={181} y={y+3} width={1540} height={85} rx={12}
     fill="url(#v6-highlight)"/>
   <path d={'M 185 '+(y+15)+' V '+(y+72)}
     stroke="#68E9FC" strokeWidth={3}/>
   <path d={'M 187 '+(y+83)+' H '+(243+Math.min(1,cursor)*1034)}
     stroke="#80EEFC" strokeWidth={2.5} strokeLinecap="round"/>
  </g>
  <g opacity={detail} transform={'translate(0 '+(26*(1-detail))+')'}>
   <rect x={180} y={912} width={1545} height={109} rx={17}
     fill="#0D364E" stroke="#48D3ED" strokeWidth={1.7}/>
   <rect x={199} y={930} width={239} height={67} rx={12}
     fill="#14516A" stroke="#6CE0F5" strokeOpacity=".56" strokeWidth={1.2}/>
   <circle cx={222} cy={962} r={7.5} fill="#80E8CF"/>
   <Txt x={244} y={972} size={24} weight={840}>MATCH FOUND</Txt>
   <Txt x={469} y={977} size={33} weight={860} color="#E2FBFF">0042</Txt>
   <path d="M 580 934 V 994 M 1250 934 V 994"
     stroke="#3C6A84" strokeWidth={1.5}/>
   <Txt x={614} y={954} size={18} weight={770} color="#86BDD7">IDENTIFIER</Txt>
   <Txt x={614} y={993} size={28} weight={815} color="#CEF7FE">alex@example.com</Txt>
   <Txt x={1285} y={955} size={18} weight={770} color="#8ABFD7">NEXT</Txt>
   <Txt x={1285} y={993} size={26} weight={835} color="#BFEFFF">CREDENTIAL CHECK</Txt>
  </g>
  <path d="M 414 1044 H 1505" stroke="#54BDD5" strokeOpacity=".26" strokeWidth={2}/>
 </svg>;
};

export const UserDatabaseV6Premium:React.FC<Props>=({durationInFrames,anchors={}})=>{
 const frame=useCurrentFrame();
 const cue=(key:string,fallback:number)=>Number.isFinite(anchors[key])?anchors[key]:fallback;
 const beats:Beats={rows:cue('DB_ROWS_START',13.4),scan:cue('DB_ROW_SCAN',20),
  found:cue('DB_ACCOUNT_MATCH',28.5),hero:cue('DB_MATCH_HERO',32.1),
  detail:cue('DB_RESULT_REVEAL',38.3)};
 const open=cue('DB_TABLE_OPEN',8.7);
 const ambient=ease(frame,t(open-1.2),t(open+2.8));
 const fade=ease(frame,t(open),t(open+2.6));
 const shift=(1-fade)*19;
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