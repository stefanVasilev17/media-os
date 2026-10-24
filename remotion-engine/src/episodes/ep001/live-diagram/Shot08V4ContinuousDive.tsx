import React from 'react';
import {Easing, Freeze, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {AuthServiceTier2V10YoutubePreview} from './AuthServiceTier2V10YoutubePreview';

const FPS=30, W=1920, H=1080, SHOT07_FRAMES=4882;
const CENTER={x:1733,y:613};
const C={navy:'#081B34',cyan:'#38D9FF',ice:'#B6FCFF',dark:'#061D37',
  steel:'#346B91',muted:'#80A9C5',mint:'#48E5C3',white:'#F2FBFF'};
const LOCKED_ANCHORS:Record<string,number>={
 GET_FACTS:120.4,INBOX_OPEN:31.8,INSTANCE_B:4.433333333333334,
 EMAIL_CLAIM:112.13333333333334,FORMAT_PREP:57.5,LOOKUP_BORN:125.36666666666666,
 SECRET_ROLE:46.6,AUTH_ARRIVAL:0.8666666666666667,FIND_ACCOUNT:117.23333333333333,
 INPUT_FIELDS:37.6,LIMITS_CHECK:82.93333333333334,CHECKS_PASSED:98.4,
 FORMAT_EXAMPLE:68.13333333333334,LOOKUP_ACCOUNT:155.83333333333334,
 LOOKUP_TRAVELS:142.96666666666667,ORIGINAL_STAYS:132.43333333333334,
 PROOF_QUESTION:25.966666666666665,REQUIRED_CHECK:76.63333333333334,
 AUTH_DEFINITION:20.833333333333332,IDENTIFIER_ROLE:43.5,
 NOT_YET_CORRECT:50.566666666666665,STRUCTURE_CHECK:79.9,
 VALIDATION_NAME:60.766666666666666,VALID_NOT_LOGIN:87.03333333333333,
 NOT_SECOND_LOGIN:146.66666666666666,PASSWORD_UNKNOWN:104.63333333333334,
 SERVICE_QUESTION:150.03333333333333,ROUTING_NOT_TRUST:10.666666666666666,
 EMPTY_FIELD_EXAMPLE:65.56666666666666,INFORMATION_FOR_VERIFY:158.66666666666666
};
const LOCKED_CLIP_STARTS=[24,952,1821,2940,3915];
const lim=(n:number)=>Math.max(0,Math.min(1,n));
const tween=(f:number,a:number,b:number)=>interpolate(f,[a,Math.max(a+1,b)],[0,1],{
 extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const Txt:React.FC<{
 x:number;y:number;size?:number;weight?:number;anchor?:'start'|'middle'|'end';color?:string;children:React.ReactNode
}>=({x,y,size=15,weight=700,anchor='start',color=C.white,children})=>
 <text x={x} y={y} fontFamily={AT_FONT} fontWeight={weight} fontSize={size}
  fill={color} textAnchor={anchor}>{children}</text>;

const RecordSlab:React.FC<{
 x:number;y:number;opacity:number;selected?:number;label:string;lift?:number
}>=({x,y,opacity,selected=0,label,lift=0})=>
 <g opacity={lim(opacity)} transform={'translate('+x+' '+(y-lift)+')'}>
  <path d="M -108 -15 L -24 -40 L 109 -16 L 24 8 Z"
   fill={selected>0?'#176D89':'#0C3A58'} stroke={selected>0?'#93F2FF':'#4B86AB'}
   strokeWidth={selected>0?2.5:1.4} strokeOpacity={.55+.42*selected}/>
  <path d="M -108 -15 L 24 8 L 24 36 L -108 12 Z" fill="#071C33"
   stroke="#37769B" strokeWidth={1.2}/>
  <path d="M 24 8 L 109 -16 L 109 13 L 24 36 Z"
   fill="#0B2A43" stroke="#55ADD3" strokeWidth={1.2}/>
  <path d="M -82 -12 L -25 -27 M 9 -9 L 67 -20" stroke="#91D2E7"
   strokeWidth={2.2} strokeLinecap="round" opacity={.36+selected*.5}/>
  <Txt x={-4} y={2} size={15} weight={820} anchor="middle"
   color={selected>.1?'#D7FCFF':'#8AADC8'}>{label}</Txt>
  {[0,1,2,3,4,5].map(i=><rect key={i} x={-89+i*34} y={17} width={20}
    height={2.4} rx={1.2} fill={selected>0?C.cyan:C.steel} opacity={.45+selected*.32}/>)}
  {selected>.01&&<ellipse cx={1} cy={-7} rx={125} ry={47}
    fill="none" stroke={C.cyan} strokeWidth={2} opacity={selected*.22}/>}
 </g>;

const ImmersiveArchive:React.FC<{frame:number;opacity:number}>=({frame,opacity})=>{
  const grow=tween(frame,355,555);
  const search=tween(frame,550,694);
  const match=tween(frame,677,792);
  const reveal=tween(frame,790,895);
  const scanPosition=102+371*search;
  const shift=47*reveal;
  return <svg viewBox="0 0 1920 1080" width={W} height={H}
    style={{position:'absolute',left:0,top:0,pointerEvents:'none',overflow:'visible'}}>
    <defs>
      <clipPath id="s08-v4-volume"><rect x={1626} y={508} width={218} height={207} rx={12}/></clipPath>
      <radialGradient id="s08-v4-shell" cx=".48" cy=".38" r=".86">
        <stop offset="0%" stopColor="#176587" stopOpacity=".95"/>
        <stop offset=".47" stopColor="#0B405F" stopOpacity=".93"/>
        <stop offset="100%" stopColor="#071C36" stopOpacity=".97"/>
      </radialGradient>
      <linearGradient id="s08-v4-ray" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38DCFF" stopOpacity="0"/>
        <stop offset=".72" stopColor="#58EAFF" stopOpacity=".19"/>
        <stop offset=".86" stopColor="#BAFBFF" stopOpacity=".77"/>
        <stop offset="100%" stopColor="#38DCFF" stopOpacity="0"/>
      </linearGradient>
      <filter id="s08-v4-soft-halo" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation={6}/>
      </filter>
    </defs>
    <g clipPath="url(#s08-v4-volume)" opacity={opacity}>
      <g transform="translate(1637 520) scale(.292)">
        <rect x={0} y={0} width={672} height={660} rx={19}
          fill="url(#s08-v4-shell)" stroke="#5EAEC8" strokeWidth={3}/>
        <g opacity=".18" stroke="#8AD7EC" strokeWidth={1.5}>
          {[0,1,2,3,4,5,6,7,8].map(i=>
           <path key={i} d={'M '+(42+i*73)+' 10 V 650'}/>)}
          {[0,1,2,3,4,5,6,7].map(i=>
           <path key={i} d={'M 20 '+(61+i*77)+' H 651'}/>)}
        </g>
        <path d="M 67 63 V 583 M 324 63 V 583" stroke="#36A6CA"
          strokeWidth={2.2} strokeOpacity=".45"/>
        <ellipse cx={196} cy={97} rx={142} ry={46} fill="#0B4F6E"
          stroke="#86E7FF" strokeWidth={3} strokeOpacity=".88"/>
        <path d="M 54 99 V 486 Q 196 566 338 486 V 99" stroke="#4AA9CF"
          strokeWidth={3.4} fill="#0A2945" fillOpacity=".33"/>
        <ellipse cx={196} cy={486} rx={143} ry={47} fill="none"
          stroke="#6FC6E5" strokeWidth={2.2} strokeOpacity=".66"/>
        <g opacity={.45+.5*grow}>
          {[0,1,2].map(i=>{
            const y=202+i*103;
            const lit=i===1?match:.13;
            return <g key={i}>
              <ellipse cx={197} cy={y} rx={116} ry={29} fill="#0E4968"
                stroke="#5CD3EB" strokeOpacity={.4+lit*.48} strokeWidth={2}/>
              <path d={'M 81 '+y+' V '+(y+25)+' Q 197 '+(y+88)+
                ' 313 '+(y+25)+' V '+y} fill="#092B48"
                stroke="#3E95BA" strokeWidth={1.7}/>
              <ellipse cx={197} cy={y+25} rx={116} ry={29} fill="none"
                stroke="#64BCDB" strokeOpacity=".35" strokeWidth={1.7}/>
              <path d={'M 131 '+(y+30)+' H 261'} stroke={i===1?'#57DFFD':'#41799E'}
                strokeOpacity={.32+lit*.59} strokeWidth={3.5} strokeLinecap="round"/>
            </g>;
          })}
        </g>
        <path d="M 345 320 H 390" stroke="#41C2E5" strokeWidth={2.2}
          strokeDasharray="5 10" opacity={.18+grow*.6}/>
        <path d="M 394 87 V 544" stroke="#4B82A9" strokeWidth={2}
          strokeOpacity=".48"/>
        <RecordSlab x={535} y={177} opacity={grow*.71} label="RECORD 041"/>
        <RecordSlab x={535+shift*.42} y={343} opacity={grow} label="RECORD 042"
          selected={match} lift={shift}/>
        <RecordSlab x={535} y={498} opacity={grow*.69} label="RECORD 043"/>
        <rect x={14} y={scanPosition-23} width={365} height={59}
          fill="url(#s08-v4-ray)" opacity={search*(1-match*.55)}/>
        <path d={'M 49 '+scanPosition+' H 366'} stroke="#A7FAFF"
          strokeWidth={3.6} strokeLinecap="round"
          opacity={search*(1-match*.52)}/>
        <path d="M 322 343 H 408" stroke="#43C8ED" strokeWidth={3.4}
          opacity={match} strokeLinecap="round"/>
        <path d="M 321 343 H 408" stroke="#4FEFFF" strokeWidth={14}
          opacity={match*.27} filter="url(#s08-v4-soft-halo)"/>
        <circle cx={405} cy={343} r={6.8} fill={C.ice} opacity={match}/>
        <g opacity={reveal}>
          <path d="M 474 259 V 238 H 638" stroke="#8AECFA"
            strokeWidth={1.8} strokeOpacity=".7" fill="none"/>
          <Txt x={630} y={227} size={18} anchor="end" weight={820}
            color="#C7FBFF">alex@example.com</Txt>
        </g>
      </g>
    </g>
  </svg>;
};

export const Shot08V4ContinuousDive:React.FC<{durationInFrames:number}>=()=>{
  const frame=useCurrentFrame();
  const shift=tween(frame,90,465);
  const zoom=tween(frame,115,630);
  const depth=1+5.25*zoom;
  const targetX=CENTER.x+(W/2-CENTER.x)*shift;
  const targetY=CENTER.y+(H/2-CENTER.y)*shift;
  const translationX=targetX-CENTER.x*depth;
  const translationY=targetY-CENTER.y*depth;
  const interior=tween(frame,385,615);
  return <div style={{position:'absolute',width:W,height:H,left:0,top:0,overflow:'hidden',
    background:C.navy,isolation:'isolate',fontFamily:AT_FONT}}>
    <div style={{position:'absolute',width:W,height:H,left:0,top:0,
      transformOrigin:'0 0',
      transform:'translate('+translationX+'px,'+translationY+'px) scale('+depth+')'}}>
      <Freeze frame={SHOT07_FRAMES-1}>
        <AuthServiceTier2V10YoutubePreview
          durationInFrames={SHOT07_FRAMES}
          anchors={LOCKED_ANCHORS}
          clipStarts={LOCKED_CLIP_STARTS}/>
      </Freeze>
      <ImmersiveArchive frame={frame} opacity={interior}/>
    </div>
  </div>;
};
