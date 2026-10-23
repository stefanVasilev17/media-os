import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props = {
  durationInFrames: number;
  anchors?: Record<string, number>;
  clipStarts?: number[];
};

const W = 1920;
const H = 1080;
const BG = '#040B17';
const WHITE = '#EAF3FF';
const SOFT = '#9DB1CA';
const MINT = '#52E4B4';
const CYAN = '#4BD3F5';
const VIOLET = '#B39AFF';
const OUTLINE = '#273C5D';
const ease = (frame: number, start: number, end: number) => interpolate(
  frame, [start, Math.max(start + 1, end)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  }
);
const linear = (frame: number, start: number, end: number) => interpolate(
  frame, [start, Math.max(start + 1, end)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }
);
const clamp = (n: number) => Math.max(0, Math.min(1, n));

const Label: React.FC<{
  x: number; y: number; children: React.ReactNode; size?: number; color?: string;
  weight?: number; opacity?: number; spacing?: number;
}> = ({x, y, children, size = 27, color = SOFT, weight = 600, opacity = 1, spacing = 0}) => (
  <text x={x} y={y} fontFamily={AT_FONT} fill={color} fontSize={size}
    fontWeight={weight} opacity={opacity} letterSpacing={spacing}>{children}</text>
);

const Pill: React.FC<{
  x: number; y: number; w: number; text: string; color: string;
  opacity?: number; prefix?: React.ReactNode;
}> = ({x,y,w,text,color,opacity=1,prefix}) => (
  <g opacity={opacity}>
    <rect x={x} y={y} width={w} height={49} rx={24.5}
      fill={color} fillOpacity=".075" stroke={color} strokeOpacity=".42"/>
    {prefix || <circle cx={x+24} cy={y+24} r={5.5} fill={color}/>}
    <Label x={x+41} y={y+32} size={19} color={color} weight={770} spacing={1.1}>{text}</Label>
  </g>
);

const CheckIcon: React.FC<{x:number;y:number;size?:number;color?:string;opacity?:number}> = ({
  x,y,size=32,color=MINT,opacity=1
}) => (
  <g transform={'translate('+x+' '+y+') scale('+(size/40)+')'} opacity={opacity}>
    <circle cx="20" cy="20" r="18" fill={color} fillOpacity=".095"
      stroke={color} strokeOpacity=".8" strokeWidth="2"/>
    <path d="M 11 20 L 17 26 L 29 14" fill="none" stroke={color}
      strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
  </g>
);

const MagnifyIcon: React.FC<{x:number;y:number;scale?:number;color?:string}> = ({
  x,y,scale=1,color=CYAN
}) => (
  <g transform={'translate('+x+' '+y+') scale('+scale+')'} fill="none" stroke={color}
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="15" cy="15" r="10" strokeWidth="2.5"/>
    <path d="M 22.5 22.5 L 33 33" strokeWidth="3"/>
  </g>
);

const Phone: React.FC<{
  x:number;y:number;showEmail:number;showSecret:number;opacity:number;
  compact?:boolean;
}> = ({x,y,showEmail,showSecret,opacity,compact=false}) => {
  const phoneWidth = compact ? 247 : 310;
  const phoneHeight = compact ? 470 : 528;
  const fieldsWidth = phoneWidth-44;
  const email = 'alex@example.com';
  const visibleLetters = Math.floor(email.length * clamp(showEmail));
  return (
    <g transform={'translate('+x+' '+y+')'} opacity={opacity}>
      <rect width={phoneWidth} height={phoneHeight} rx="39" fill="#070F1E"
        stroke="#53728C" strokeWidth="2.3"/>
      <rect x="8" y="8" width={phoneWidth-16} height={phoneHeight-16} rx="31"
        fill="url(#phoneScreen)" stroke="#182941"/>
      <rect x={phoneWidth/2-42} y="12" width="84" height="16" rx="8" fill="#060C16"/>
      <circle cx={phoneWidth/2+24} cy="20" r="3" fill="#35516C"/>
      <circle cx={phoneWidth/2} cy="84" r="25" fill="#18334A" stroke="#4ED8B9" strokeOpacity=".65"/>
      <path d={'M '+(phoneWidth/2-12)+' 85 L '+(phoneWidth/2)+' 73 L '+(phoneWidth/2+12)+' 85 L '+(phoneWidth/2)+' 97 Z'}
        fill="none" stroke={MINT} strokeWidth="2.4"/>
      <Label x={21} y={148} size={compact?27:31} color={WHITE} weight={780}>Log in</Label>
      <Label x={21} y={176} size={compact?13:15} color="#829BB8">Continue to your account</Label>
      <Label x={21} y={222} size={14} color="#B4C7D9" weight={720}>EMAIL</Label>
      <rect x="21" y="235" width={fieldsWidth} height="64" rx="12"
        stroke={showEmail > .03?MINT:'#354A64'} strokeOpacity=".58" fill="#0C1A2C"/>
      <Label x={34} y={275} size={compact?16:20} color={WHITE} weight={580}>
        {email.slice(0,visibleLetters)}
      </Label>
      {showEmail > .03 && showEmail < .99 && <rect x={36+visibleLetters*(compact?9.1:10.9)}
        y="252" width="2" height="26" fill={MINT}/>}
      <Label x={21} y={338} size={14} color="#B4C7D9" weight={720}>PASSWORD</Label>
      <rect x="21" y="350" width={fieldsWidth} height="63" rx="12"
        stroke={showSecret > .08?MINT:'#354A64'} strokeOpacity=".58" fill="#0C1A2C"/>
      {showSecret > .05 && Array.from({length: Math.ceil(showSecret*9)},(_,i) =>
        <circle key={i} cx={37+i*22} cy="383" r="4.8" fill={WHITE}/>
      )}
      <rect x="21" y={phoneHeight-83} width={fieldsWidth} height="54" rx="12"
        fill={MINT} fillOpacity={showSecret>.85?.89:.26}/>
      <Label x={phoneWidth/2-48} y={phoneHeight-48} size={19} color={BG} weight={820}>Continue</Label>
    </g>
  );
};

const FieldTile:React.FC<{
  x:number;y:number;width:number;title:string;value:string;accent:string;
  opacity:number;icon:'user'|'key';
}> = ({x,y,width,title,value,accent,opacity,icon}) => (
  <g opacity={opacity}>
    <rect x={x} y={y} width={width} height="131" rx="17" fill="#101E34"
      stroke={accent} strokeOpacity=".35"/>
    <circle cx={x+39} cy={y+45} r="23" fill={accent} fillOpacity=".12"/>
    {icon==='user'
      ? <g fill="none" stroke={accent} strokeWidth="2.4">
        <circle cx={x+39} cy={y+39} r="7"/>
        <path d={'M '+(x+25)+' '+(y+59)+' Q '+(x+39)+' '+(y+42)+' '+(x+53)+' '+(y+59)}/>
      </g>
      : <g fill="none" stroke={accent} strokeWidth="2.7" strokeLinecap="round">
        <circle cx={x+34} cy={y+44} r="8"/><path d={'M '+(x+42)+' '+(y+44)+' h 16 v 7 h -8'}/>
      </g>
    }
    <Label x={x+79} y={y+45} size={20} color={SOFT} weight={720} spacing={1}>{title}</Label>
    <Label x={x+27} y={y+104} size={29} color={WHITE} weight={750}>{value}</Label>
  </g>
);

const ValidationCard:React.FC<{
  x:number;y:number;number:string;label:string;icon:'present'|'format'|'limits';
  progress:number;
}> = ({x,y,number,label,icon,progress}) => {
  const complete = progress > .95;
  const active = progress > .03;
  return (
    <g opacity={active?1:.43}>
      <rect x={x} y={y} width="286" height="292" rx="22" fill="#0D1A30"
        stroke={active?MINT:OUTLINE} strokeOpacity={active?.75:.9} strokeWidth={active?2:1.6}/>
      <Label x={x+28} y={y+45} size={19} color={SOFT} weight={740} spacing={1.1}>{number}</Label>
      {complete && <CheckIcon x={x+230} y={y+23} size={30}/>}
      {icon==='present' && (
        <g>
          <rect x={x+43} y={y+93} width="200" height="46" rx="10" fill="#192B41"/>
          <circle cx={x+66} cy={y+116} r="6" fill={MINT}/>
          <rect x={x+85} y={y+112} width="101" height="8" rx="4" fill="#8BAEC1" fillOpacity=".6"/>
          <rect x={x+43} y={y+153} width="200" height="46" rx="10" fill="#192B41"/>
          <circle cx={x+66} cy={y+176} r="6" fill={MINT}/>
          {Array.from({length:7},(_,i)=>
            <circle key={i} cx={x+95+i*17} cy={y+176} r={3.4} fill={WHITE}/>)}
        </g>
      )}
      {icon==='format' && (
        <g>
          <rect x={x+35} y={y+98} width="216" height="89" rx="12" fill="#142A43"/>
          <Label x={x+48} y={y+142} size={24} color={WHITE} weight={700}>alex</Label>
          <rect x={x+102} y={y+115} width="38" height="40" rx="9" fill={MINT} fillOpacity=".19"/>
          <Label x={x+106} y={y+141} size={27} color={MINT} weight={850}>@</Label>
          <Label x={x+145} y={y+142} size={20} color={WHITE} weight={690}>mail.com</Label>
          <path d={'M '+(x+66)+' '+(y+166)+' H '+(x+218)}
            stroke={MINT} strokeOpacity={progress} strokeWidth="3.8" strokeLinecap="round"/>
        </g>
      )}
      {icon==='limits' && (
        <g>
          <rect x={x+38} y={y+107} width="210" height="17" rx="8.5" fill="#24344D"/>
          <rect x={x+38} y={y+107} width={Math.max(0,134*progress)} height="17" rx="8.5" fill={MINT}/>
          <circle cx={x+40+133*progress} cy={y+115} r="15" fill="#123E42" stroke={MINT} strokeWidth="2.5"/>
          <Label x={x+43} y={y+176} size={20} color={SOFT}>Input within policy</Label>
        </g>
      )}
      <Label x={x+27} y={y+248} size={24} color={active?WHITE:SOFT} weight={780}>{label}</Label>
    </g>
  );
};

const Connector:React.FC<{x1:number;y1:number;x2:number;y2:number;color:string;progress:number}> = ({
  x1,y1,x2,y2,color,progress
}) => (
  <g opacity={clamp(progress)}>
    <path d={'M '+x1+' '+y1+' H '+x2+' V '+y2} stroke={color}
      strokeOpacity=".11" strokeWidth="16" strokeLinecap="round" fill="none"/>
    <path d={'M '+x1+' '+y1+' H '+x2+' V '+y2} stroke={color}
      strokeOpacity=".65" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx={x1+(x2-x1)*clamp(progress)} cy={y1} r="6" fill={color}/>
  </g>
);

export const AuthServiceTier2YoutubePreview: React.FC<Props> = ({
  durationInFrames, anchors={}, clipStarts=[]
}) => {
  const frame = useCurrentFrame();
  const fallback = [0,.2,.4,.6,.8].map(x=>Math.round(durationInFrames*x));
  const starts = fallback.map((fallbackValue,i)=>
    Number.isFinite(clipStarts[i])?clipStarts[i]:fallbackValue);
  const cue=(key:string,clip:number,offset:number)=>
    Number.isFinite(anchors[key])?Math.round(anchors[key]*30):starts[clip]+offset;

  const c01=starts[0],c02=starts[1],c03=starts[2],c04=starts[3],c05=starts[4];
  const open=ease(frame,cue('AUTH_ARRIVAL',0,0)+2,cue('AUTH_DEFINITION',0,90)+36);
  const phoneIn=ease(frame,cue('INBOX_OPEN',1,7)-12,cue('INBOX_OPEN',1,7)+25);
  const inputEmail=ease(frame,cue('INPUT_FIELDS',1,30),cue('IDENTIFIER_ROLE',1,60)+19);
  const inputPassword=ease(frame,cue('SECRET_ROLE',1,84)-14,cue('SECRET_ROLE',1,84)+24);
  const received=ease(frame,cue('NOT_YET_CORRECT',1,115),cue('FORMAT_PREP',1,160)+20);
  const validateIn=ease(frame,cue('VALIDATION_NAME',2,0)-4,cue('VALIDATION_NAME',2,0)+30);
  const required=ease(frame,cue('REQUIRED_CHECK',2,100)-6,cue('REQUIRED_CHECK',2,100)+18);
  const format=ease(frame,cue('STRUCTURE_CHECK',2,130)-7,cue('STRUCTURE_CHECK',2,130)+20);
  const limits=ease(frame,cue('LIMITS_CHECK',2,170)-7,cue('LIMITS_CHECK',2,170)+20);
  const valid=ease(frame,cue('VALID_NOT_LOGIN',2,205)-5,cue('VALID_NOT_LOGIN',2,205)+28);
  const need=ease(frame,cue('PASSWORD_UNKNOWN',3,31)-15,cue('GET_FACTS',3,114)+30);
  const lookupBorn=ease(frame,cue('LOOKUP_BORN',3,120)-12,cue('LOOKUP_BORN',3,120)+37);
  const lookupJourney=ease(frame,cue('LOOKUP_TRAVELS',4,45)-10,cue('INFORMATION_FOR_VERIFY',4,154)+28);
  const backToMap=ease(frame,cue('ORIGINAL_STAYS',4,6)+15,cue('SERVICE_QUESTION',4,110)+25);
  const page=validateIn*(1-need);
  const reasoning=need*(1-backToMap);
  const overview=(1-open)+backToMap*open;
  const interior=open*(1-backToMap);
  const receivedWorld=received*(1-validateIn);
  const phoneShown=phoneIn*(1-validateIn*.90)*(1-backToMap);
  const isPhoneVisible=phoneShown>.001;
  const fullC05=frame>=c05;
  const fadePhone=1-clamp(validateIn*.88);

  return <div style={{position:'absolute',inset:0,background:BG,overflow:'hidden',
    color:WHITE,fontFamily:AT_FONT}}>
    <div style={{position:'absolute',inset:0,
      transform:'scale('+(1+.13*backToMap)+') translateX('+(-24*backToMap)+'px)',
      transformOrigin:'78% 55%',opacity:.99}}>
      <NetworkTransitYoutubePreview showGuides={false}
        frameOverride={SHOT04_DURATION_FRAMES-1}
        gatewayHandoff={315} balancerHandoff={300}
        balancerActive={.4} balancerIntroArrival={1}
        balancerIntroSelected={1} balancerIntroFlow={1}
        balancerIntroFrame={5100} balancerIntroHandoff={1}
        authActive={1} networkActiveMultiplier={0}/>
    </div>
    <svg viewBox={'0 0 '+W+' '+H} width={W} height={H}
      style={{position:'absolute',inset:0,overflow:'hidden'}}>
      <defs>
        <radialGradient id="authFade">
          <stop offset="0" stopColor="#081A2B" stopOpacity=".995"/>
          <stop offset="1" stopColor="#030916" stopOpacity=".997"/>
        </radialGradient>
        <linearGradient id="authPanel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#0C1E33"/>
          <stop offset="1" stopColor="#071424"/>
        </linearGradient>
        <linearGradient id="phoneScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B1E32"/>
          <stop offset="1" stopColor="#05111F"/>
        </linearGradient>
        <linearGradient id="requestBeam" x1="0" x2="1">
          <stop offset="0" stopColor={MINT}/>
          <stop offset="1" stopColor={CYAN}/>
        </linearGradient>
        <filter id="subtleGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6"/>
        </filter>
        <clipPath id="authPanelClip">
          <rect x="136" y="128" width="1648" height="819" rx="31"/>
        </clipPath>
      </defs>

      {interior>.001 && <>
        <rect width={W} height={H} fill="#010811" opacity={interior*.74}/>
        <rect x="136" y="128" width="1648" height="819" rx="31" fill="url(#authFade)"
          opacity={interior}/>
        <rect x="136" y="128" width="1648" height="819" rx="31"
          fill="none" stroke={VIOLET} strokeWidth="1.7" strokeOpacity={interior*.52}/>
      </>}

      <g opacity={interior}>
        <Label x={197} y={194} size={18} color={VIOLET} weight={750} spacing={2.8}>
          INSIDE THE SYSTEM  /  07
        </Label>
        <Label x={197} y={258} size={48} color={WHITE} weight={850}>Auth Service</Label>
        <Label x={199} y={298} size={21} color={SOFT} weight={570}>
          A login request is received. Identity is not yet proven.
        </Label>
        <Pill x={1480} y={194} w={253} text="NOT VERIFIED" color={VIOLET}/>
        <path d="M 196 328 H 1728" stroke="#29405D" strokeOpacity=".85" strokeWidth="1.4"/>
      </g>

      {/* Beat one: trust boundary. One large, understandable transaction, not a telemetry dashboard. */}
      <g opacity={interior*(1-phoneIn)}>
        <rect x="323" y="468" width="338" height="175" rx="26" fill="#112A34"
          stroke={MINT} strokeOpacity=".6" strokeWidth="2"/>
        <circle cx="390" cy="541" r="23" fill={MINT} fillOpacity=".1" stroke={MINT} strokeOpacity=".62"/>
        <path d="M 379 542 L 387 550 L 401 534" stroke={MINT}
          strokeWidth="3" fill="none" strokeLinecap="round"/>
        <Label x={428} y={542} size={27} color={WHITE} weight={770}>LOGIN</Label>
        <Label x={428} y={579} size={24} color={MINT} weight={690}>REQUEST</Label>
        <path d="M 674 560 H 1064" stroke={MINT} strokeWidth="3" strokeOpacity=".6"/>
        <path d="M 1040 546 L 1067 560 L 1040 574" stroke={MINT} fill="none"
          strokeWidth="3.5" strokeLinejoin="round"/>
        <rect x="1079" y="426" width="473" height="269" rx="27" fill="#101C32"
          stroke={VIOLET} strokeOpacity=".5" strokeWidth="2"/>
        <circle cx="1317" cy="532" r="54" fill="#1C2549" stroke={VIOLET} strokeOpacity=".5"/>
        <path d="M 1318 498 C 1292 499 1291 518 1297 528 C 1308 545 1329 542 1334 564"
          stroke={WHITE} strokeOpacity=".85" strokeWidth="8"
          fill="none" strokeLinecap="round"/>
        <circle cx="1334" cy="581" r="5.5" fill={VIOLET}/>
        <Label x={1135} y={644} size={23} color={SOFT} weight={690}>WHO IS THIS?</Label>
      </g>

      {/* Beat two: physically recognizable login form, its fields and the request boundary. */}
      <g opacity={interior*phoneShown}>
        {isPhoneVisible && <Phone x={257} y={361} showEmail={inputEmail} showSecret={inputPassword}
          opacity={1} compact={false}/>}
        <Label x={636} y={427} size={22} color={SOFT} weight={680}>WHAT THE APP SENDS</Label>
        <path d="M 604 599 H 706" stroke={MINT} strokeOpacity=".75" strokeWidth="3.2"/>
        <path d="M 691 588 L 711 599 L 691 610" stroke={MINT} strokeWidth="3" fill="none"/>
        <FieldTile x={741} y={442} width={665} title="ACCOUNT IDENTIFIER"
          value="alex@example.com" accent={CYAN} icon="user" opacity={inputEmail}/>
        <FieldTile x={741} y={590} width={665} title="SUBMITTED SECRET"
          value="•••••••••" accent={VIOLET} icon="key" opacity={inputPassword}/>
        {receivedWorld>.001 && <>
          <Pill x={1449} y={476} w={245} color={MINT} text="RECEIVED"
            opacity={receivedWorld}/>
          <Label x={1452} y={616} color={VIOLET} size={23} opacity={receivedWorld} weight={790}>
            STILL UNVERIFIED
          </Label>
        </>}
        <Label x={750} y={802} size={27} color={WHITE} weight={760}
          opacity={Math.max(inputPassword,receivedWorld)*.85}>
          An email identifies an account. A password proposes proof.
        </Label>
      </g>

      {/* Beat three: three oversized visual checks, not a list of status text. */}
      <g opacity={interior*page}>
        <Label x={261} y={398} size={29} color={WHITE} weight={760}>Is this request structurally usable?</Label>
        <Pill x={1408} y={351} w={285} color={VIOLET} text="NOT VERIFIED"/>
        <ValidationCard x={266} y={455} number="01 / PRESENCE" label="Both fields exist"
          icon="present" progress={required}/>
        <ValidationCard x={614} y={455} number="02 / STRUCTURE" label="Email format"
          icon="format" progress={format}/>
        <ValidationCard x={962} y={455} number="03 / SIZE" label="Input limits"
          icon="limits" progress={limits}/>
        <path d="M 555 597 H 608 M 902 597 H 954"
          stroke={MINT} strokeOpacity=".6" strokeWidth="3" strokeLinecap="round"/>
        <g opacity={valid}>
          <rect x="1320" y="476" width="355" height="215" rx="22"
            fill="#0D2B2B" stroke={MINT} strokeOpacity=".66" strokeWidth="2"/>
          <CheckIcon x={1348} y={501} size={40}/>
          <Label x={1404} y={533} size={24} weight={790} color={MINT}>REQUEST VALID</Label>
          <path d="M 1349 568 H 1648" stroke={MINT} strokeOpacity=".24" strokeWidth="2"/>
          <Label x={1352} y={612} size={22} weight={670} color={SOFT}>Not the same as</Label>
          <Label x={1352} y={651} size={24} weight={770} color={VIOLET}>LOGIN SUCCESS</Label>
        </g>
        <Label x={276} y={839} size={25} weight={620} color={SOFT}>
          These checks inspect the request — not the truth of the password.
        </Label>
      </g>

      {/* Beat four: a dependency, not a fake login failure. */}
      <g opacity={interior*reasoning}>
        <Label x={266} y={405} size={30} color={WHITE} weight={770}>The request passed. But one thing is missing.</Label>
        <rect x="273" y="482" width="408" height="240" rx="23"
          fill="#0E2A31" stroke={MINT} strokeOpacity=".61" strokeWidth="2"/>
        <CheckIcon x={315} y={521} size={51}/>
        <Label x={390} y={558} size={27} color={WHITE} weight={760}>Submitted</Label>
        <Label x={312} y={619} size={26} color={SOFT}>alex@example.com</Label>
        <Label x={313} y={669} size={24} color={SOFT}>password: •••••••••</Label>
        <path d="M 698 602 H 967" stroke={CYAN} strokeOpacity=".38" strokeWidth="3"
          strokeDasharray="7 12"/>
        <circle cx={828} cy={602} r="32" fill="#15233C" stroke={VIOLET}
          strokeOpacity=".6" strokeWidth="2"/>
        <Label x={813} y={611} size={30} color={VIOLET} weight={900}>?</Label>
        <rect x="985" y="475" width="626" height="264" rx="24"
          fill="#111B32" stroke={VIOLET} strokeOpacity=".62" strokeWidth="2"/>
        <MagnifyIcon x={1043} y={518} scale={1.55} color={CYAN}/>
        <Label x={1115} y={546} size={34} color={WHITE} weight={830}>Account facts</Label>
        <Label x={1115} y={583} size={29} color={CYAN} weight={760}>needed</Label>
        <Label x={1039} y={665} size={24} color={SOFT}>Find the account, then verify the secret.</Label>
        <g opacity={lookupBorn}>
          <rect x="1178" y="776" width="298" height="59" rx="29"
            fill="#0A3241" stroke={CYAN} strokeWidth="1.8" strokeOpacity=".78"/>
          <MagnifyIcon x={1202} y={790} scale={.9}/>
          <Label x={1251} y={815} size={23} color={CYAN} weight={820}>LOOKUP CREATED</Label>
        </g>
      </g>

      {/* Beat five: a clean architectural handoff: original stays / lookup moves. */}
      {fullC05 && <g opacity={backToMap}>
        <rect x="222" y="95" width="1506" height="194" rx="23"
          fill="#071629" fillOpacity=".98" stroke="#334C68" strokeWidth="1.3"/>
        <Label x={263} y={152} size={17} color={SOFT} spacing={2.2} weight={790}>
          TWO DIFFERENT REQUESTS
        </Label>
        <circle cx="284" cy="204" r="9" fill={MINT}/>
        <Label x={306} y={214} size={26} color={WHITE} weight={750}>Login stays in Auth</Label>
        <path d="M 771 161 V 260" stroke="#304760" strokeWidth="1.3"/>
        <MagnifyIcon x={832} y={188} scale={1.12} color={CYAN}/>
        <Label x={892} y={214} size={26} color={WHITE} weight={750}>Lookup asks User Database</Label>
        <Label x={894} y={256} size={21} color={CYAN} weight={680}>
          account identifier only · no password
        </Label>
        <rect x="1165" y="790" width="517" height="106" rx="21"
          fill="#07192D" fillOpacity=".94" stroke={CYAN} strokeOpacity=".38"
          strokeWidth="1.6"/>
        <MagnifyIcon x={1206} y={817} scale={1.1}/>
        <Label x={1264} y={840} size={22} color={CYAN} weight={790}>USER LOOKUP</Label>
        <Label x={1206} y={876} size={23} color={WHITE} weight={650}>
          email = alex@example.com
        </Label>
        <path d="M 1578 609 L 1632 609" stroke={CYAN} strokeOpacity=".26"
          strokeWidth="14" strokeLinecap="round" filter="url(#subtleGlow)"/>
        <path d="M 1578 609 L 1632 609" stroke={CYAN} strokeOpacity=".81"
          strokeWidth="3.4" strokeLinecap="round"/>
        <circle cx={1578+54*clamp(lookupJourney)} cy="609" r="9"
          fill={CYAN} stroke="#D6F6FF" strokeOpacity=".8" strokeWidth="2"/>
        <circle cx="1578" cy="609" r="9" fill={MINT}/>
        <circle cx="1632" cy="609" r="8" fill="none" stroke={CYAN} strokeWidth="2"/>
      </g>}

      {/* The handoff leaves the regional map visible as SHOT08 starts. */}
      {frame > durationInFrames-65 && <rect x="0" y="0" width={W} height={H}
        fill="#01040B" opacity={.04*ease(frame,durationInFrames-65,durationInFrames-1)}/>}
    </svg>
  </div>;
};