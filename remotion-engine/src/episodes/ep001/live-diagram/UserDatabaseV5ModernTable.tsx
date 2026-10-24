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

const OriginalMap:React.FC<{frame:number;fade:number}>=({frame,fade})=>{
 const scanner=ease(frame,t(2.1),t(3.7))*(1-ease(frame,t(8.9),t(11.1)));
 const sweep=((frame-t(2))*1.20)%163;
 return <div style={{position:'absolute',inset:0,opacity:fade}}>
  <Sequence from={-4881}>
   <AuthServiceTier2V10YoutubePreview durationInFrames={4882}
     anchors={ANCHORS} clipStarts={STARTS}/>
  </Sequence>
  <svg width={W} height={H} viewBox="0 0 1920 1080"
   style={{position:'absolute',inset:0,pointerEvents:'none'}}>
   <defs>
    <clipPath id="v5-map-scan-clip"><rect x={1635} y={552} width={199} height={153} rx={8}/></clipPath>
    <linearGradient id="v5-map-scangrad" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stopColor="#3AE8FF" stopOpacity="0"/>
     <stop offset=".76" stopColor="#3AE8FF" stopOpacity=".16"/>
     <stop offset=".88" stopColor="#AFFAFF" stopOpacity=".88"/>
     <stop offset="1" stopColor="#3AE8FF" stopOpacity="0"/>
    </linearGradient>
   </defs>
   <g opacity={scanner} clipPath="url(#v5-map-scan-clip)">
    <rect x={1635} y={548+sweep-20} width={199} height={44} fill="url(#v5-map-scangrad)"/>
    <path d={'M 1644 '+(548+sweep)+' H 1824'} stroke="#B6FAFF" strokeWidth={3.5}/>
   </g>
   <circle cx={1733} cy={613} r={40+22*ease(frame,t(4.5),t(7.8))}
    fill="none" stroke={C.cyan} strokeWidth={2.7} strokeOpacity={scanner*.48}/>
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
})=><g opacity={opacity}>
 <Txt x={columnX[col]+22} y={y+57} size={col===1?26:24}
  weight={selected?810:630} color={selected?'#ECFCFF':col===0?'#BBEAF5':'#A5BFD3'}>{value}</Txt>
</g>;

const UserRow:React.FC<{frame:number;index:number;record:typeof rows[number];match:number;lift:number;visible:number}>=({
 frame,index,record,match,lift,visible
})=>{
 const y=416+index*103;
 const chosen=index===2;
 const active=chosen?match:0;
 const muted=chosen?1:1-ease(frame,t(33),t(37))*.69;
 const shown=ease(frame,t(13)+index*11,t(14.6)+index*11);
 const highlight=(ease(frame,t(20)+index*53,t(21.2)+index*53))*
  (1-ease(frame,t(21.7)+index*53,t(22.4)+index*53));
 const shift=chosen?-53*lift:0;
 return <g opacity={shown*muted*visible} transform={'translate(0 '+shift+')'}>
  <rect x={179} y={y} width={1546} height={90} rx={12}
   fill={chosen?'#0E4259':'#0B2B46'} fillOpacity={chosen?.43+.37*active:.5}
   stroke={chosen?'#48DDFC':'#3B5771'} strokeOpacity={chosen?.25+.72*active:.28}
   strokeWidth={chosen?2.9:1.2}/>
  {columnX.slice(1).map((x,i)=><path key={i}
   d={'M '+x+' '+(y+12)+' V '+(y+79)}
   stroke="#385B78" strokeWidth={1.2} opacity=".55"/>)}
  {[record.id,record.email,record.name,record.status,record.role].map((value,i)=>
   <ColumnCell key={i} value={value} col={i} y={y} selected={chosen&&match>.1}/>)}
  <path d={'M 192 '+(y+85)+' H 1710'} stroke="#7BE6FF"
   strokeWidth={2.7} opacity={highlight*ease(frame,t(19),t(20))*(1-active)}/>
  {chosen&&<g opacity={active}>
   <rect x={178} y={y-2} width={1548} height={94} rx={13} fill="none"
    stroke="#40DCFF" strokeOpacity=".33" strokeWidth={9}/>
   <path d={'M 186 '+(y+14)+' V '+(y+75)+' M 188 '+(y+14)+' H 213 M 188 '+(y+75)+' H 213'}
    stroke="#ACF5FF" strokeWidth={3} fill="none"/>
   <circle cx={1671} cy={y+45} r={13} fill="#104F64"
    stroke="#AEFCFF" strokeWidth={2}/>
   <path d={'M 1665 '+(y+45)+' l 5 5 l 9 -11'} stroke="#D5FFFF" strokeWidth={2.6} fill="none"/>
  </g>}
 </g>;
};

const DatabaseScreen:React.FC<{frame:number}>=({frame})=>{
 const intro=ease(frame,t(10),t(13));
 const table=ease(frame,t(13),t(17));
 const searching=ease(frame,t(19),t(23));
 const matched=ease(frame,t(31.2),t(34.4));
 const lifting=ease(frame,t(36),t(42));
 const detail=ease(frame,t(41),t(46));
 const currentScan=Math.min(4,Math.max(0,Math.floor((frame-t(20))/53)));
 const pulse=.64+.36*Math.sin(frame*.10);
 return <svg width={W} height={H} viewBox="0 0 1920 1080" style={{display:'block'}}>
  <defs>
   <radialGradient id="v5-screen-bg" cx=".49" cy=".35" r=".82">
    <stop offset="0" stopColor="#113D59"/>
    <stop offset=".58" stopColor="#0A2945"/>
    <stop offset="1" stopColor="#06162D"/>
   </radialGradient>
   <linearGradient id="v5-screen-line" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#49DAFF" stopOpacity="0"/>
    <stop offset=".50" stopColor="#75F3FF" stopOpacity=".82"/>
    <stop offset="1" stopColor="#49DAFF" stopOpacity="0"/>
   </linearGradient>
  </defs>
  <rect width={W} height={H} fill="url(#v5-screen-bg)"/>
  <g stroke="#3A7394" strokeWidth={1} opacity=".13">
   {[0,1,2,3,4,5,6,7,8].map(i=><path key={i} d={'M 0 '+(99+i*125)+' H '+W}/>)}
   {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i=><path key={i} d={'M '+(72+i*128)+' 0 V '+H}/>)}
  </g>
  <path d="M 160 201 H 1760" stroke="#3F6B89" strokeWidth={1.5} opacity=".75"/>
  <path d="M 160 201 H 1760" stroke="url(#v5-screen-line)" strokeWidth={4} opacity=".54"/>
  <g opacity={intro}>
   <g transform="translate(191 129)">
    {[2,1,0].map(i=><g key={i}>
     <rect x={-27} y={-21+i*14} width={54} height={17} rx={3} fill="#0F4B70" stroke="#49D6FA" strokeWidth={1.3}/>
     <ellipse cx={0} cy={-22+i*14} rx={27} ry={9} fill="#124E74" stroke="#7EEDFF" strokeWidth={2}/>
    </g>)}
   </g>
   <Txt x={255} y={149} size={38} weight={870} color="#E5FBFF">USER DATABASE</Txt>
   <Txt x={1737} y={147} size={23} anchor="end" weight={710} color="#91C6DE">USERS  /  ACCOUNT LOOKUP</Txt>
   <rect x={174} y={242} width={1551} height={106} rx={16} fill="#0B2C47" stroke="#427598" strokeWidth={1.5}/>
   <circle cx={219} cy={295} r={16} fill="none" stroke={C.cyan} strokeWidth={2.6}/>
   <path d="M 231 307 l 13 13" fill="none" stroke={C.cyan} strokeWidth={3.2} strokeLinecap="round"/>
   <Txt x={269} y={306} size={23} weight={775} color="#B7DDED">EMAIL</Txt>
   <rect x={358} y={262} width={1085} height={67} rx={10} fill="#103A54" stroke="#3E6583" strokeWidth={1.2}/>
   <Txt x={397} y={307} size={33} weight={760}>alex@example.com</Txt>
   <rect x={1480} y={260} width={210} height={68} rx={11} fill="#0A3B50" stroke="#39AECB" strokeWidth={1.6}/>
   <Txt x={1585} y={305} size={22} anchor="middle" color="#B4F3FF" weight={840}>INDEX LOOKUP</Txt>
  </g>
  <g opacity={table}>
   <rect x={178} y={371} width={1547} height={64} rx={9} fill="#0A243C" stroke="#375977" strokeWidth={1.2}/>
   {columnTitles.map((name,i)=><Txt key={name} x={columnX[i]+22} y={414} size={21}
    color="#9DCDE5" weight={840}>{name}</Txt>)}
   {rows.map((row,i)=><UserRow key={row.id} frame={frame} index={i}
    record={row} match={matched} lift={lifting} visible={1}/>)}
  </g>
  <g opacity={searching*(1-matched)}>
   <rect x={181} y={416+currentScan*103} width={1541} height={87} rx={11}
    fill="#5EDBFF" fillOpacity=".048"/>
   <path d={'M 183 '+(424+currentScan*103)+' V '+(492+currentScan*103)}
    stroke="#68EAFF" strokeWidth={4} strokeOpacity={pulse}/>
  </g>
  <g opacity={lifting}>
   <path d="M 252 885 V 900 M 1651 884 V 900" stroke="#70EDFF" strokeWidth={2.3}/>
   <rect x={181} y={900} width={1542} height={113} rx={18}
    fill="#0B354A" stroke="#3AC6E1" strokeWidth={2}/>
   <circle cx={246} cy={957} r={19} fill="#15516B" stroke="#A0FBFF" strokeWidth={2.3}/>
   <path d="M 237 957 l 7 7 l 12 -15" fill="none" stroke="#C6FDFF" strokeWidth={3}/>
   <Txt x={289} y={969} size={31} weight={865} color="#F0FCFF">RECORD 0042</Txt>
   <path d="M 581 930 V 991 M 1180 930 V 991" stroke="#476E85" strokeWidth={1.5}/>
   <Txt x={620} y={962} size={21} color="#94C5DF" weight={785}>EMAIL MATCH</Txt>
   <Txt x={822} y={965} size={29} color="#D1FAFF" weight={810}>alex@example.com</Txt>
   <Txt x={1227} y={963} size={22} color="#8FC0DA" weight={755}>NEXT</Txt>
   <Txt x={1321} y={963} size={26} color="#C1F0FF" weight={795}>CREDENTIAL CHECK</Txt>
  </g>
  <g opacity={detail}>
   <path d="M 190 1034 H 1736" stroke="#387CA0" strokeWidth={1.2} opacity=".6"/>
   <path d="M 680 1034 H 1275" stroke="#71E6FC" strokeWidth={2.4} opacity=".67"/>
  </g>
 </svg>;
};

export const UserDatabaseV5ModernTable:React.FC<Props>=({durationInFrames,anchors={}})=>{
 const frame=useCurrentFrame();
 const scanCue=Number.isFinite(anchors.DB_SCAN)?anchors.DB_SCAN:2.5;
 const openCue=Number.isFinite(anchors.DB_TABLE_OPEN)?anchors.DB_TABLE_OPEN:8.5;
 const opening=ease(frame,t(openCue),t(openCue+3.4));
 const pos={
  x:interpolate(opening,[0,1],[1622,0]),
  y:interpolate(opening,[0,1],[505,0]),
  w:interpolate(opening,[0,1],[226,W]),
  h:interpolate(opening,[0,1],[213,H])
 };
 const insetRight=W-pos.x-pos.w,insetBottom=H-pos.y-pos.h;
 return <div style={{position:'absolute',inset:0,width:W,height:H,background:C.bg,
  isolation:'isolate',overflow:'hidden',fontFamily:AT_FONT}}>
  <OriginalMap frame={frame} fade={1}/>
  <div style={{position:'absolute',inset:0,overflow:'hidden',
   clipPath:'inset('+pos.y+'px '+insetRight+'px '+insetBottom+'px '+pos.x+'px round '+(18*(1-opening))+'px)',
   opacity:lim(opening*2.4)}}>
   <DatabaseScreen frame={frame}/>
  </div>
  {opening>.015&&opening<.99&&<svg width={W} height={H} viewBox="0 0 1920 1080"
   style={{position:'absolute',inset:0,pointerEvents:'none'}}>
   <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={18*(1-opening)}
     fill="none" stroke="#6FE9FE" strokeOpacity={.70*(1-opening)} strokeWidth={3.5}/>
  </svg>}
 </div>;
};
