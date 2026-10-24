import React from 'react';
import {Easing,Freeze,interpolate,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {AuthServiceTier2V10YoutubePreview} from './AuthServiceTier2V10YoutubePreview';

const W=1920;
const H=1080;
const FPS=30;
const SHOT07_FRAMES=4882;
const T={
  navy:'#081B34',dark:'#06172E',cyan:'#38DBFF',cyanWhite:'#B9F9FF',
  green:'#42E6C5',white:'#F1F8FF',muted:'#9AB6CF',blue:'#5595D4',
};
const LAST07_ANCHORS:Record<string,number>={
  GET_FACTS:120.4,INBOX_OPEN:31.8,INSTANCE_B:4.433333333333334,
  EMAIL_CLAIM:112.13333333333334,FORMAT_PREP:57.5,
  LOOKUP_BORN:125.36666666666666,SECRET_ROLE:46.6,
  AUTH_ARRIVAL:0.8666666666666667,FIND_ACCOUNT:117.23333333333333,
  INPUT_FIELDS:37.6,LIMITS_CHECK:82.93333333333334,
  CHECKS_PASSED:98.4,FORMAT_EXAMPLE:68.13333333333334,
  LOOKUP_ACCOUNT:155.83333333333334,LOOKUP_TRAVELS:142.96666666666667,
  ORIGINAL_STAYS:132.43333333333334,PROOF_QUESTION:25.966666666666665,
  REQUIRED_CHECK:76.63333333333334,AUTH_DEFINITION:20.833333333333332,
  IDENTIFIER_ROLE:43.5,NOT_YET_CORRECT:50.56666666666667,
  STRUCTURE_CHECK:79.9,VALIDATION_NAME:60.766666666666666,
  VALID_NOT_LOGIN:87.03333333333333,NOT_SECOND_LOGIN:146.66666666666666,
  PASSWORD_UNKNOWN:104.63333333333334,SERVICE_QUESTION:150.03333333333333,
  ROUTING_NOT_TRUST:10.666666666666666,EMPTY_FIELD_EXAMPLE:65.56666666666666,
  INFORMATION_FOR_VERIFY:158.66666666666666
};
const LAST07_CLIP_STARTS=[24,952,1821,2940,3915];
const ease=(f:number,a:number,b:number)=>interpolate(f,[a,Math.max(a+1,b)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)
});
const clamp=(x:number)=>Math.min(1,Math.max(0,x));
const Text:React.FC<{
  x:number;y:number;children:React.ReactNode;size?:number;color?:string;
  weight?:number;anchor?:'start'|'middle'|'end';spacing?:number
}>=({x,y,children,size=27,color=T.white,weight=650,anchor='start',spacing=0})=>
  <text x={x} y={y} fontFamily={AT_FONT} fontSize={size}
    fontWeight={weight} fill={color} textAnchor={anchor} letterSpacing={spacing}>{children}</text>;

const TerminalWorld:React.FC<{frame:number}>=({frame})=>{
  const focus=ease(frame,164,357);
  const depth=1+1.56*focus;
  const offsetX=960-1733*depth;
  const offsetY=540-613*depth;
  return <div style={{position:'absolute',inset:0,overflow:'hidden',background:T.navy}}>
    <div style={{position:'absolute',width:W,height:H,left:0,top:0,
      transformOrigin:'0 0',transform:'translate('+offsetX+'px,'+offsetY+'px) scale('+depth+')'}}>
      <Freeze frame={SHOT07_FRAMES-1}>
        <AuthServiceTier2V10YoutubePreview
          durationInFrames={SHOT07_FRAMES}
          anchors={LAST07_ANCHORS}
          clipStarts={LAST07_CLIP_STARTS}
        />
      </Freeze>
    </div>
  </div>;
};

const GlassEllipse:React.FC<{cx:number;cy:number;rx:number;ry:number;stroke:string;opacity?:number}>=({
  cx,cy,rx,ry,stroke,opacity=1
})=><ellipse cx={cx} cy={cy} rx={rx} ry={ry}
  fill="none" stroke={stroke} strokeWidth={2} opacity={opacity}/>;

const Prism:React.FC<{
  cx:number;cy:number;label:string;index:number;highlight:number;offsetX?:number;offsetY?:number
}>=({cx,cy,label,index,highlight,offsetX=0,offsetY=0})=>{
  const bright=clamp(highlight);
  const tint=bright>.01?T.cyan:'#3E688D';
  const x=cx+offsetX,y=cy+offsetY;
  return <g opacity={.58+.42*bright}>
    <path d={'M '+(x-150)+' '+(y-34)+' L '+(x+3)+' '+(y-68)+' L '+(x+156)+' '+(y-34)+
      ' L '+x+' '+(y+7)+' Z'}
      fill={bright>.2?'#105574':'#12344F'}
      stroke={tint} strokeWidth={2.5} strokeOpacity={.7+.3*bright}/>
    <path d={'M '+(x-150)+' '+(y-34)+' L '+(x-150)+' '+(y+8)+' L '+x+' '+(y+51)+
      ' L '+x+' '+(y+7)+' Z'} fill="#0A263F"
      stroke={tint} strokeWidth={1.7} strokeOpacity=".48"/>
    <path d={'M '+x+' '+(y+7)+' L '+(x+156)+' '+(y-34)+' L '+(x+156)+' '+(y+8)+
      ' L '+x+' '+(y+51)+' Z'} fill="#09253D" stroke={tint} strokeWidth={1.6}/>
    <path d={'M '+(x-114)+' '+(y-29)+' H '+(x-38)+
      ' M '+(x+37)+' '+(y-29)+' H '+(x+119)}
      stroke={bright>.1?T.cyanWhite:T.muted} strokeWidth={1.8} strokeLinecap="round"
      opacity={.45+.35*bright}/>
    <Text x={x} y={y-13} size={25} weight={800}
      color={bright>.1?'#D6FEFF':'#83A9C7'} anchor="middle" spacing={1.6}>
      {label}
    </Text>
    {[0,1,2,3,4].map(j=><rect key={j} x={x-102+j*51} y={y+15} width={27}
      height={3} rx={1.5} fill={bright>.1?T.cyan:'#4E85AD'}
      opacity={.36+bright*.5}/>)}
    {bright>.02&&<GlassEllipse cx={x} cy={y-16} rx={159} ry={66}
      stroke={T.cyan} opacity={bright*.24}/>}
  </g>;
};

const StackCore:React.FC<{seconds:number;scan:number;opacity:number}>=({
  seconds,scan,opacity
})=>{
  const scanY=380+292*scan;
  return <g opacity={opacity}>
    <defs>
      <linearGradient id="shot08v3-core-shell" x1="0" y1="0" x2=".95" y2="1">
        <stop offset="0%" stopColor="#0A2C4A" stopOpacity=".38"/>
        <stop offset="40%" stopColor="#125A7B" stopOpacity=".46"/>
        <stop offset="100%" stopColor="#061F39" stopOpacity=".72"/>
      </linearGradient>
      <linearGradient id="shot08v3-scan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#18E0FF" stopOpacity="0"/>
        <stop offset="60%" stopColor="#18E0FF" stopOpacity=".19"/>
        <stop offset="88%" stopColor="#B6FDFF" stopOpacity=".75"/>
        <stop offset="100%" stopColor="#18E0FF" stopOpacity="0"/>
      </linearGradient>
      <clipPath id="shot08v3-core-clip">
        <rect x={258} y={339} width={550} height={415} rx={15}/>
      </clipPath>
    </defs>
    <path d="M 299 372 Q 509 278 752 372 L 750 674 Q 510 780 299 674 Z"
      fill="url(#shot08v3-core-shell)" stroke="#438FB1" strokeOpacity=".43" strokeWidth={2}/>
    <g opacity=".24" stroke="#70B6DF" strokeWidth={1.5}>
      {[326,358,389,421,453,485,517,549,581,613,645,677].map(x=>
        <path key={x} d={'M '+x+' 346 L '+x+' 703'}/>)}
    </g>
    <GlassEllipse cx={524} cy={350} rx={234} ry={67} stroke="#74D9F5" opacity={.55}/>
    <GlassEllipse cx={524} cy={687} rx={230} ry={69} stroke="#62DDFB" opacity={.45}/>
    <GlassEllipse cx={524} cy={515} rx={247} ry={72} stroke="#46C7E8" opacity={.19}/>
    <g clipPath="url(#shot08v3-core-clip)">
      {[0,1,2].map(i=>{
        const y=395+i*119;
        const tint=i===1?'#42DDF3':'#467998';
        const brightness=i===1?.82:.45;
        return <g key={i}>
          <ellipse cx={524} cy={y+20} rx={191} ry={38} fill="#0E4363"
            stroke={tint} strokeWidth={3} strokeOpacity={brightness}/>
          <path d={'M 333 '+(y+20)+' V '+(y+47)+' Q 524 '+(y+130)+' 715 '+(y+47)+
            ' V '+(y+20)} fill="#0B314D" fillOpacity=".94" stroke={tint}
            strokeOpacity=".58" strokeWidth={2}/>
          <ellipse cx={524} cy={y+47} rx={191} ry={38} fill="none"
            stroke="#50A0C0" strokeOpacity=".40" strokeWidth={1.6}/>
          <Text x={523} y={y+29} size={21} weight={750}
            color={i===1?'#B4F9FF':'#7896B3'} anchor="middle">
            {'DATA LAYER 0'+(i+1)}
          </Text>
          {[0,1,2,3,4,5,6].map(j=><circle key={j}
            cx={362+j*51} cy={y+65} r={2.6} fill="#76D4EC"
            opacity={.2+.05*j}/>)}
        </g>;
      })}
      <rect x={272} y={scanY-56} width={516} height={64}
        fill="url(#shot08v3-scan)" opacity={.94}/>
      <path d={'M 308 '+scanY+' H 741'} stroke="#9BFAFF" strokeWidth={3.6}
        strokeLinecap="round" opacity={.91}/>
    </g>
    <g fill="none" stroke="#56D6F3" opacity=".28" strokeWidth={1.6}>
      <path d="M 236 357 V 719 H 816 V 357"/>
      <path d="M 270 313 H 767 M 270 768 H 767"/>
    </g>
    <circle cx={524} cy={350} r={18} fill="none"
      stroke="#5CD7F1" strokeWidth={2} opacity={.35+.16*Math.sin(seconds*1.2)}/>
    <Text x={530} y={828} color="#B5E9F8" size={28} weight={795}
      anchor="middle" spacing={2.3}>STORED RECORDS</Text>
  </g>;
};

const RecordCarousel:React.FC<{frame:number;opacity:number}>=({frame,opacity})=>{
  const appear=ease(frame,451,528);
  const scan=ease(frame,540,654);
  const found=ease(frame,672,764);
  const exportRecord=ease(frame,745,866);
  const selectedLift=-72*exportRecord;
  return <g opacity={opacity*appear}>
    <defs>
      <filter id="shot08v3-cyan-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation={10}/>
      </filter>
      <linearGradient id="shot08v3-record-ray" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#28DFFF" stopOpacity=".0"/>
        <stop offset=".68" stopColor="#51E9FF" stopOpacity=".7"/>
        <stop offset="1" stopColor="#C2FAFF" stopOpacity="1"/>
      </linearGradient>
    </defs>
    <path d="M 770 545 C 862 545 906 559 984 559"
      fill="none" stroke="#2B779E" strokeWidth={5}
      strokeDasharray="5 12" strokeLinecap="round"/>
    <path d="M 771 545 C 862 545 906 559 984 559" fill="none"
      stroke="#50E9FC" strokeWidth={5} strokeLinecap="round"
      pathLength={100} strokeDasharray={Math.max(0,scan*100)+' 100'}/>
    <Prism cx={1177} cy={405} label="ACCOUNT 041" index={0} highlight={0}/>
    <Prism cx={1177} cy={572} label="ACCOUNT 042" index={1}
      highlight={found} offsetX={exportRecord*97} offsetY={selectedLift}/>
    <Prism cx={1177} cy={738} label="ACCOUNT 043" index={2} highlight={0}/>
    {found>.01&&<g opacity={found}>
      <path d={'M '+(1273+26*exportRecord)+' '+(556-72*exportRecord)+
        ' L '+(1540+59*exportRecord)+' '+(516-61*exportRecord)}
        stroke="#57E8F8" strokeWidth={2.6}/>
      <circle cx={1540+59*exportRecord} cy={516-61*exportRecord} r={6} fill="#C1FEFF"/>
    </g>}
    <g opacity={found*.95}>
      <path d="M 1538 400 L 1645 400 L 1685 445 L 1685 588 L 1541 588"
        fill="none" stroke="#57BFE5" strokeWidth={1.9} opacity=".65"/>
      <Text x={1536} y={477} size={24} color="#9AD5E6" weight={735}>ID</Text>
      <Text x={1616} y={477} size={29} color="#D4FBFF" weight={830}>0042</Text>
      <Text x={1536} y={535} size={25} color="#D4FBFF" weight={760}>alex@example.com</Text>
    </g>
    <g opacity={found*.6}>
      <ellipse cx={1274+97*exportRecord} cy={556-72*exportRecord}
        rx={207} ry={88} fill="none" stroke="#26DFFF" strokeWidth={2.4}/>
    </g>
  </g>;
};

const InnerWorld:React.FC<{frame:number;opacity:number}>=({frame,opacity})=>{
  const seconds=frame/FPS;
  const appear=ease(frame,348,420);
  const scan=clamp((frame-435)/420);
  return <svg viewBox="0 0 1920 1080" width="100%" height="100%"
    style={{display:'block',position:'absolute',inset:0,opacity:pointerSafe(opacity),
      pointerEvents:'none'}}>
    <defs>
      <radialGradient id="shot08v3-inner-space" cx=".51" cy=".48" r=".71">
        <stop offset="0%" stopColor="#133C5A"/>
        <stop offset=".62" stopColor="#0A2947"/>
        <stop offset="100%" stopColor={T.navy}/>
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#shot08v3-inner-space)"/>
    <g opacity=".15" stroke="#4C86B1" strokeWidth={1}>
      {[0,1,2,3,4,5,6,7].map(i=>
        <path key={i} d={'M '+(70+i*255)+' 0 V 1080'}/>)}
      {[0,1,2,3,4].map(i=>
        <path key={i} d={'M 0 '+(60+i*240)+' H 1920'}/>)}
    </g>
    <path d="M 92 192 H 1828 M 92 882 H 1828"
      fill="none" stroke="#335674" strokeWidth={1.8} opacity=".62"/>
    <g opacity={appear}>
      <circle cx={133} cy={128} r={11} fill={T.cyan}/>
      <Text x={169} y={139} size={33} color="#D0F5FF" weight={825} spacing={2.5}>
        USER DATABASE
      </Text>
      <Text x={1740} y={137} size={23} anchor="end" color="#78B0CC" weight={700}>
        LOOKUP
      </Text>
      <g opacity=".75">
        <path d="M 88 537 H 278" stroke="#42D0ED" strokeWidth={3.4} strokeDasharray="7 10"/>
        <circle cx={270} cy={537} r={12} fill={T.cyan}/>
      </g>
      <StackCore seconds={seconds} scan={scan} opacity={1}/>
      <RecordCarousel frame={frame} opacity={1}/>
    </g>
  </svg>;
};
const pointerSafe=(x:number)=>clamp(x);

export const Shot08V3PremiumSlice:React.FC<{durationInFrames:number}>=({durationInFrames})=>{
  const frame=useCurrentFrame();
  const enter=ease(frame,339,425);
  return <div style={{position:'absolute',inset:0,width:W,height:H,
    overflow:'hidden',background:T.navy,isolation:'isolate',fontFamily:AT_FONT}}>
    <TerminalWorld frame={frame}/>
    <InnerWorld frame={frame} opacity={enter}/>
  </div>;
};
