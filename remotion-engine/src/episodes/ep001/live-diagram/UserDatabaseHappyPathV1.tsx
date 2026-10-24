import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props = {durationInFrames:number; anchors?:Record<string,number>};
const W=1920,H=1080;
const NAVY='#081B34',WHITE='#F1F7FF',MUTED='#ACC5DF',CYAN='#42DFFF',MINT='#43E7C1';
const clip=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number,a:number,b:number)=>interpolate(v,[a,Math.max(a+.001,b)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)
});
const Txt:React.FC<{x:number;y:number;size?:number;weight?:number;color?:string;anchor?:'start'|'middle'|'end';spacing?:number;children:React.ReactNode}>=({
 x,y,size=29,weight=600,color=WHITE,anchor='start',spacing=0,children
})=><text x={x} y={y} fill={color} fontSize={size} fontWeight={weight}
 textAnchor={anchor} letterSpacing={spacing} fontFamily={AT_FONT}>{children}</text>;

const DatabaseStack:React.FC<{x:number;y:number;scale?:number;phase?:number}>=({
 x,y,scale=1,phase=0
})=><g transform={'translate('+x+' '+y+') scale('+scale+')'}>
 <defs>
  <linearGradient id="s08-db-body" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stopColor="#103F68"/><stop offset=".5" stopColor="#075D8F"/>
   <stop offset="1" stopColor="#062243"/>
  </linearGradient>
 </defs>
 {[2,1,0].map((i)=>{
  const top=i*65;
  const intensity=.5+.5*Math.sin((phase-i*.26)*Math.PI*2);
  return <g key={i}>
   <rect x={0} y={top+7} width={188} height={55} rx={12}
    fill="url(#s08-db-body)" stroke="#2AA5CF" strokeWidth={1.8}/>
   <ellipse cx={94} cy={top+8} rx={93} ry={23} fill="#0E5680"
    stroke="#81DFFF" strokeOpacity={.68+.24*intensity} strokeWidth={2.4}/>
   <ellipse cx={94} cy={top+8} rx={76} ry={14} fill="none" stroke="#59DBFC"
    strokeOpacity={.55+.3*intensity} strokeWidth={1.5}/>
   <path d={'M 21 '+(top+35)+' H 138 M 151 '+(top+35)+' H 169'}
    stroke="#8CEFFF" strokeWidth={3} opacity={.48+.28*intensity} strokeLinecap="round"/>
  </g>
 })}
 </g>;

const WideMap:React.FC<{seconds:number;opacity:number;zoom:number;returnProgress:number;scan:number}>=({
 seconds,opacity,zoom,returnProgress,scan
})=>{
 const scale=1+1.28*zoom;
 const px=960-1719*scale,py=540-610*scale;
 const pulse=clip(.64+.35*Math.sin(seconds*3.5));
 const packetX=1748-170*returnProgress;
 return <div style={{position:'absolute',inset:0,opacity,overflow:'hidden',pointerEvents:'none'}}>
  <div style={{position:'absolute',inset:0,width:W,height:H,transformOrigin:'0 0',
   transform:'translate('+(-px+0)*0+'px, 0px)'}}>
   <div style={{position:'absolute',inset:0,
    transformOrigin:'0 0',transform:'translate('+px+'px,'+py+'px) scale('+scale+')'}}>
    <NetworkTransitYoutubePreview showGuides={false}
      frameOverride={SHOT04_DURATION_FRAMES-1} gatewayHandoff={315}
      balancerHandoff={300} balancerActive={.4}
      balancerIntroArrival={1} balancerIntroSelected={1}
      balancerIntroFlow={1} balancerIntroFrame={5100}
      balancerIntroHandoff={1} authActive={1} networkActiveMultiplier={0}/>
    <svg viewBox="0 0 1920 1080" width={W} height={H}
      style={{position:'absolute',inset:0}}>
     <defs>
      <filter id="s08-map-glow" x="-100%" y="-100%" width="300%" height="300%">
       <feGaussianBlur stdDeviation={8}/>
      </filter>
      <clipPath id="s08-map-db-clip">
       <rect x={1634} y={545} width={210} height={170} rx={10}/>
      </clipPath>
     </defs>
     <rect x={1363} y={507} width={231} height={207} rx={18}
      fill="#0A3C42" fillOpacity=".14" stroke="#4FE7C7"
      strokeOpacity=".84" strokeWidth={2.8}/>
     <circle cx={1483} cy={610} r={10} fill={MINT} opacity={.7+.3*pulse}/>
     <Txt x={1483} y={769} size={22} weight={790} color="#70F5D5" anchor="middle">
      LOGIN WAITING
     </Txt>
     <path d="M 1594 613 H 1638" stroke="#2F6A85" strokeWidth={3} strokeDasharray="4 8"/>
     <rect x={1622} y={505} width={226} height={213} rx={17}
      fill="#0A5680" fillOpacity=".16" stroke="#2DD6FF" strokeWidth={3.5}/>
     <g clipPath="url(#s08-map-db-clip)">
      <DatabaseStack x={1645} y={553} scale={.94} phase={seconds*.3}/>
      <path d={'M 1635 '+(557+148*scan)+' H 1837'} stroke="#00E7FF"
       strokeWidth={15} opacity=".16" filter="url(#s08-map-glow)"/>
      <path d={'M 1641 '+(557+148*scan)+' H 1831'} stroke="#99FAFF"
       strokeWidth={3.8} opacity=".9"/>
     </g>
     <path d="M 1594 613 H 1645" stroke="#1CBDE3" strokeWidth={3.5} opacity=".7"/>
     <circle cx={1653} cy={613} r={6} fill="#8BEAFF" opacity={returnProgress<.03?1:.25}/>
     <path d="M 1593 613 H 1755" stroke="#25C3EF" opacity={returnProgress*.6}
      strokeWidth={5} filter="url(#s08-map-glow)"/>
     <circle cx={packetX} cy={613} r={13} fill="#7BF1FF" opacity={clip(returnProgress*6)*(1-clip((returnProgress-.94)*12))}/>
     <circle cx={packetX} cy={613} r={28} fill="#00DEFF" fillOpacity={.12*returnProgress}/>
     <path d="M 1590 613 H 1750" stroke="#62DCFF"
      strokeWidth={2} strokeDasharray="4 11" opacity=".5"/>
     {returnProgress>.92&&<circle cx={1567} cy={613} r={26}
      fill="none" stroke={CYAN} strokeWidth={2.5} opacity={(1-returnProgress)*11}/>}
    </svg>
   </div>
  </div>
 </div>;
};

const ResultRow:React.FC<{x:number;y:number;label:string;number:number;selected:boolean;illumination:number}>=({
 x,y,label,number,selected,illumination
})=><g>
 <rect x={x} y={y} width={608} height={100} rx={17}
  fill={selected?'#0A3957':'#102D48'}
  fillOpacity={selected?.98:.63}
  stroke={selected?'#33DEFF':'#355B7D'}
  strokeWidth={selected?3.1:1.6}
  strokeOpacity={selected?.7+.3*illumination:.7}/>
 <circle cx={x+38} cy={y+49} r={18} fill={selected?'#145F7C':'#183B5A'}
  stroke={selected?'#8DF9FF':'#5982A0'} strokeWidth={2}/>
 <path d={'M '+(x+38)+' '+(y+42)+' a 6 6 0 1 1 0 12 a 6 6 0 1 1 0 -12 M '+(x+25)+' '+(y+65)+' q 13 -14 26 0'}
  fill="none" stroke={selected?'#D0FDFF':'#8BB7D1'} strokeWidth={2.1}/>
 <Txt x={x+81} y={y+42} size={21} color={selected?'#E2FBFF':'#C2D3E3'} weight={750}>
  ACCOUNT {String(number).padStart(3,'0')}
 </Txt>
 <Txt x={x+81} y={y+73} size={24}
  color={selected?'#F5FFFF':'#9CB4CA'} weight={selected?740:520}>{label}</Txt>
 {selected&&<g>
  <circle cx={x+561} cy={y+51} r={11} fill="#49E9F5" opacity={.45+.4*illumination}/>
  <circle cx={x+561} cy={y+51} r={4.6} fill="#C9FFFF"/>
 </g>}
 </g>;

const Card:React.FC<{x:number;y:number;w:number;h:number;title:string;accent?:string;opacity?:number;children:React.ReactNode}>=({
 x,y,w,h,title,accent=CYAN,opacity=1,children
})=><g opacity={opacity}>
 <rect x={x+4} y={y+9} width={w} height={h} rx={22}
  fill={accent} fillOpacity=".045"/>
 <rect x={x} y={y} width={w} height={h} rx={22}
  fill="#0A2744" stroke={accent} strokeWidth={2} strokeOpacity=".75"/>
 <path d={'M '+(x+28)+' '+(y+61)+' H '+(x+w-28)} stroke="#365D7B" strokeWidth={1.3}/>
 <Txt x={x+29} y={y+42} size={25} color={accent} weight={805} spacing={.45}>{title}</Txt>
 {children}
 </g>;

const Closeup:React.FC<{seconds:number;opacity:number;search:number;found:number;rights:number;verifier:number;reply:number}>=({
 seconds,opacity,search,found,rights,verifier,reply
})=>{
 const beam=300+354*((seconds*0.20)%1);
 const match=clip(found);
 const afterFound=ease(found,0,.8);
 const rightFade=clip(rights);
 const verifierFade=clip(verifier);
 return <svg viewBox="0 0 1920 1080" width="100%" height="100%"
  style={{position:'absolute',inset:0,opacity,pointerEvents:'none'}}>
  <defs>
   <radialGradient id="s08-close-background" cx=".52" cy=".41" r=".85">
    <stop offset="0" stopColor="#123F65"/><stop offset=".64" stopColor="#092C4D"/>
    <stop offset="1" stopColor={NAVY}/>
   </radialGradient>
   <linearGradient id="s08-search-beam" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stopColor="#00DBFF" stopOpacity="0"/>
    <stop offset=".64" stopColor="#00DCFF" stopOpacity=".18"/>
    <stop offset=".84" stopColor="#74F4FF" stopOpacity=".68"/>
    <stop offset="1" stopColor="#00D7FF" stopOpacity="0"/>
   </linearGradient>
   <filter id="s08-halo" x="-150%" y="-150%" width="400%" height="400%">
    <feGaussianBlur stdDeviation="11"/>
   </filter>
   <clipPath id="s08-list-window">
    <rect x={174} y={297} width={687} height={450} rx={21}/>
   </clipPath>
  </defs>
  <rect width={1920} height={1080} fill="url(#s08-close-background)"/>
  <rect x={89} y={82} width={1738} height={916} rx={32}
   fill="#071D36" fillOpacity=".19" stroke="#2B537B" strokeOpacity=".46" strokeWidth={1.7}/>
  <circle cx={143} cy={135} r={9} fill={CYAN}/>
  <Txt x={169} y={146} size={27} weight={840} color="#AAECFF" spacing={1.3}>USER DATABASE</Txt>
  <path d="M 92 184 H 1820" stroke="#375C7B" strokeWidth={1.5}/>
  <g opacity={1-rightFade*.15}>
   <Txt x={173} y={258} size={38} weight={790}>Account lookup</Txt>
   <Txt x={174} y={290} size={20} color={MUTED}>Search by submitted identifier</Txt>
   <rect x={173} y={305} width={691} height={444} rx={20}
    fill="#081E3A" stroke="#2E648A" strokeWidth={1.8}/>
   <g clipPath="url(#s08-list-window)">
    {[{label:'mia@example.net',number:41},{label:'alex@example.com',number:42},{label:'jordan@example.net',number:43}].map((r,i)=>
     <ResultRow key={r.number} x={213} y={330+i*132} label={r.label}
      number={r.number} selected={i===1&&match>.04}
      illumination={i===1?match:0}/>)}
    <rect x={178} y={beam-33} width={677} height={42}
     fill="url(#s08-search-beam)" opacity={1-match*.65}/>
    <path d={'M 190 '+beam+' H 848'} stroke="#81F5FF"
     strokeWidth={3.2} opacity={search*(1-match*.7)}/>
   </g>
   <g opacity={match}>
    <path d="M 820 515 H 961" stroke={CYAN} strokeWidth={3.8}/>
    <circle cx={963} cy={515} r={9} fill="#B1FFFF"/>
   </g>
  </g>
  <g opacity={match}>
   <Card x={980} y={263} w={757} h={177} title="USER DATA">
    <Txt x={1010} y={373} size={35} weight={780}>Alex Morgan</Txt>
    <Txt x={1011} y={408} size={23} color="#A9D2EA">Account ID · 0042</Txt>
   </Card>
   <Card x={980} y={460} w={356} h={197} title="PROFILE" opacity={afterFound}>
    <Txt x={1012} y={559} size={26} weight={695}>alex@example.com</Txt>
    <Txt x={1012} y={598} size={23} color={MUTED}>Display name · Alex</Txt>
   </Card>
   <Card x={1356} y={460} w={381} h={197} title="SETTINGS" opacity={afterFound}>
    <Txt x={1385} y={559} size={25}>Locale · en-US</Txt>
    <Txt x={1385} y={598} size={22} color={MUTED}>Preferences available</Txt>
   </Card>
  </g>
  <g opacity={rightFade*(1-verifierFade*.42)}>
   <Card x={981} y={680} w={756} h={174} title="ACCESS RIGHTS" accent="#9C9BFF">
    <Txt x={1012} y={779} size={25} color="#CECFFF" weight={700}>ROLE · Member</Txt>
    <Txt x={1378} y={779} size={24} color="#CECFFF" weight={700}>SCOPES · Profile read</Txt>
    <Txt x={1012} y={824} size={22} color="#9EB3D2">Permissions do not verify the password.</Txt>
   </Card>
  </g>
  <g opacity={verifierFade}>
   <rect x={961} y={661} width={790} height={248} rx={26}
    fill="#082944" stroke="#4AC8EA" strokeWidth={2.5}/>
   <circle cx={1008} cy={704} r={13} fill="none" stroke="#93EBF4" strokeWidth={3}/>
   <path d="M 1001 704 h 14 M 1008 697 v 14" stroke="#93EBF4" strokeWidth={2.5}/>
   <Txt x={1040} y={713} size={28} color="#A0EEFF" weight={820}>STORED CREDENTIAL VERIFIER</Txt>
   <path d="M 995 737 H 1723" stroke="#3E627B" strokeWidth={1.3}/>
   {['ALGORITHM','SALT','HASH'].map((name,i)=>{
    const x=1016+i*233;
    return <g key={name}>
     <Txt x={x} y={783} size={20} color={MUTED} weight={755}>{name}</Txt>
     <rect x={x} y={800} width={193} height={56} rx={9}
      fill="#123C60" stroke="#387A9E" strokeWidth={1.2}/>
     {Array.from({length:6},(_,j)=><rect key={j} x={x+15+j*28} y={815}
      width={15+(j%2)*3} height={26} rx={4} fill="#72D2ED"
      opacity={.36+.09*((j+i)%4)}/>)}
    </g>;
   })}
   <Txt x={1030} y={892} size={19} color="#99BFD7">
    Stored representation, not plaintext password
   </Txt>
  </g>
  <g opacity={reply}>
   <rect x={965} y={911} width={771} height={56} rx={24}
    fill="#0C3851" stroke={CYAN} strokeWidth={1.7}/>
   <circle cx={1002} cy={939} r={7} fill="#8BEFFF"/>
   <Txt x={1023} y={948} size={24} color="#C1F5FF" weight={725}>
    ACCOUNT FACTS READY FOR AUTH SERVICE
   </Txt>
  </g>
  <g opacity={search*.75}>
   <circle cx={1747} cy={133} r={6} fill="#62DAFA"/>
   <Txt x={1730} y={144} size={18} color="#89B4D1" anchor="end">READ ONLY</Txt>
  </g>
 </svg>;
};

export const UserDatabaseHappyPathV1:React.FC<Props>=({durationInFrames,anchors={}})=>{
 const frame=useCurrentFrame();
 const seconds=frame/30;
 const full=Math.max(1,durationInFrames/30);
 const t=(key:string,fallback:number)=>Number.isFinite(anchors[key])?anchors[key]:fallback*(full/95);
 const begin=t('USER_LOOKUP_ARRIVED',0);
 const searchStart=t('FIND_ACCOUNT',18);
 const rightsStart=t('ACCESS_RIGHTS',37);
 const verifierStart=t('STORED_VERIFIER',55);
 const returnStart=t('FACTS_RETURN',75);
 const reveal=ease(seconds,begin+2,begin+13);
 const closeIn=ease(seconds,begin+9,begin+17);
 const closeOut=ease(seconds,returnStart+1,returnStart+11);
 const found=ease(seconds,searchStart+7,searchStart+17);
 const rights=ease(seconds,rightsStart+1,rightsStart+9);
 const verifier=ease(seconds,verifierStart+1,verifierStart+9);
 const reply=ease(seconds,returnStart+2,returnStart+7);
 const returnProgress=ease(seconds,returnStart+8,full-4);
 const zoom=closeIn*(1-closeOut);
 const closeOpacity=clip(closeIn*(1-closeOut));
 const wideOpacity=clip(1-closeOpacity);
 const scan=(seconds*.35)%1;
 return <div style={{position:'absolute',inset:0,width:W,height:H,overflow:'hidden',
  background:NAVY,isolation:'isolate',fontFamily:AT_FONT}}>
   <WideMap seconds={seconds} opacity={wideOpacity} zoom={zoom*.35}
    returnProgress={returnProgress} scan={scan}/>
   <Closeup seconds={seconds} opacity={closeOpacity} search={reveal}
    found={found} rights={rights} verifier={verifier} reply={reply}/>
   <div style={{position:'absolute',left:92,bottom:62,opacity:clip(.8*(1-closeOpacity)),
    color:'#D3E6F9',fontSize:25,fontWeight:680}}>
    {returnProgress>.05?'ACCOUNT FACTS  →  AUTH SERVICE':'USER LOOKUP  →  USER DATABASE'}
   </div>
 </div>;
};
