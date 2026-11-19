import React from 'react';
import {AT_FONT} from './ATVisualPrimitives';

const WHITE='#F5FCFF';
const SOFT='#B5D2E6';
const CYAN='#68E5FF';
const MINT='#6FECD4';
const AMBER='#F5A55A';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

export type ATOutlookMailClientProps={
  openProgress:number;
  blocked:number;
  frame:number;
};

export const ATOutlookMailClient:React.FC<ATOutlookMailClientProps>=({
  openProgress,blocked,frame
})=>{
  const selected=clamp(openProgress);
  const waiting=clamp(blocked);
  const blink=.55+.45*Math.sin(frame*.08)**2;
  const messages=[
    {sender:'Team Updates',time:'9:41 AM',subject:'Today’s priorities',
     preview:'The weekly plan is ready.'},
    {sender:'Alex Morgan',time:'9:22 AM',subject:'Project review',
     preview:'Can you check the proposal?'},
    {sender:'Calendar',time:'Yesterday',subject:'Design review',
     preview:'Meeting details and notes.'}
  ];
  return <g fontFamily={AT_FONT}>
    <defs>
      <clipPath id="ep004-outlook-window-clip">
        <rect x={57} y={158} width={428} height={767} rx={23}/>
      </clipPath>
      <linearGradient id="ep004-outlook-header-blue" x1="0" x2="1" y1="0" y2="1">
        <stop stopColor="#165A9E"/>
        <stop offset="1" stopColor="#07315B"/>
      </linearGradient>
    </defs>
    <rect x={56} y={157} width={430} height={769} rx={25}
      fill="#051525" stroke="#5BA4D1" strokeWidth={2.6}
      style={{filter:'drop-shadow(0 15px 26px rgba(0,0,0,.44))'}}/>
    <g clipPath="url(#ep004-outlook-window-clip)">
      <rect x={58} y={159} width={426} height={767} fill="#081B2E"/>
      <rect x={58} y={159} width={426} height={80}
        fill="url(#ep004-outlook-header-blue)"/>
      <rect x={76} y={177} width={45} height={45} rx={8}
        fill="#0A7ACE" stroke="#69B9F5" strokeWidth={1.3}/>
      <rect x={93} y={185} width={37} height={29} rx={3}
        fill="#1C9CE7" opacity={.82}/>
      <path d="M94 193 L111 205 L129 193" stroke="#D1ECFF"
        strokeWidth={2.3} fill="none"/>
      <rect x={75} y={180} width={30} height={38} rx={5} fill="#0868B8"/>
      <text x={90} y={207} textAnchor="middle" fill={WHITE}
        fontSize={23} fontWeight={850}>O</text>
      <text x={140} y={209} fontSize={29}
        fill={WHITE} fontWeight={830}>Outlook</text>
      <text x={350} y={207} fontSize={16}
        fill="#CEE6F7" fontWeight={650}>Microsoft 365</text>
      <circle cx={445} cy={199} r={3.6} fill={WHITE}/>
      <circle cx={445} cy={211} r={3.6} fill={WHITE}/>
      <rect x={76} y={260} width={391} height={49} rx={9}
        fill="#0F314C" stroke="#376783" strokeWidth={1.4}/>
      <circle cx={100} cy={283} r={8} fill="none"
        stroke="#ACCFE5" strokeWidth={2.4}/>
      <path d="M106 289 l7 7" stroke="#ACCFE5" strokeWidth={2.4}/>
      <text x={124} y={290} fontSize={18} fill="#9BBAD0">
        Search mail
      </text>
      <rect x={58} y={326} width={69} height={600} fill="#082039"/>
      <rect x={69} y={348} width={46} height={46} rx={9}
        fill="#135284" stroke="#3899D8" strokeWidth={1}/>
      <path d="M80 363 H104 V380 H80 Z M80 363 L92 373 L104 363"
        fill="none" stroke="#DDF5FF" strokeWidth={2.1}
        strokeLinejoin="round"/>
      <rect x={81} y={419} width={22} height={22} rx={4}
        stroke="#8DB8D4" strokeWidth={2} fill="none"/>
      <path d="M82 426 H102" stroke="#8DB8D4" strokeWidth={2}/>
      <circle cx={92} cy={487} r={11} stroke="#8DB8D4"
        strokeWidth={2} fill="none"/>
      <path d="M79 509 Q92 494 105 509" fill="none"
        stroke="#8DB8D4" strokeWidth={2}/>
      <path d="M80 554 H103 M80 563 H103 M80 572 H103"
        stroke="#8DB8D4" strokeWidth={2} strokeLinecap="round"/>
      <path d="M127 326 V926" stroke="#1C425D" strokeWidth={1.5}/>
      <text x={150} y={369} fontSize={28}
        fontWeight={820} fill={WHITE}>Inbox</text>
      <rect x={235} y={344} width={39} height={32} rx={15}
        fill="#133D5A" stroke="#356E91" strokeWidth={1}/>
      <text x={254} y={366} fontSize={17} fontWeight={820}
        fill={CYAN} textAnchor="middle">3</text>
      <rect x={304} y={339} width={163} height={42} rx={8}
        fill="#155B91" stroke="#3796CA" strokeWidth={1.3}/>
      <path d="M 322 360 H 339 M 330.5 351.5 V 368.5"
        stroke={WHITE} strokeWidth={2.8} strokeLinecap="round"/>
      <text x={352} y={368} fontSize={17}
        fontWeight={800} fill={WHITE}>New mail</text>
      <text x={148} y={405} fontSize={18}
        fontWeight={820} fill={CYAN}>Focused</text>
      <text x={252} y={405} fontSize={18}
        fontWeight={630} fill="#8EB2CF">Other</text>
      <path d="M148 416 H226" stroke={CYAN} strokeWidth={3}
        strokeLinecap="round"/>
      <g>
        {messages.map((message,i)=>{
          const y=439+i*112;
          const active=i===0;
          return <g key={message.sender}>
            <rect x={137} y={y} width={338} height={106} rx={5}
              fill={active?'#0E2B43':'#091F33'}
              stroke={active?'#2E729B':'#203A52'}
              strokeWidth={active?1.4:.8}/>
            {active&&<rect x={138} y={y+1} width={336} height={104} rx={4}
              fill="#184F76" opacity={selected*.32}/>}
            <rect x={137} y={y} width={active?4:0} height={106}
              fill="#3DABE4" opacity={selected}/>
            <circle cx={155} cy={y+25} r={active?6:5}
              fill={active?MINT:'#547F9D'}/>
            <text x={172} y={y+32} fontSize={19}
              fontWeight={760} fill={WHITE}>{message.sender}</text>
            <text x={453} y={y+32} textAnchor="end" fontSize={14}
              fill="#A5C0D6">{message.time}</text>
            <text x={151} y={y+63} fontSize={18}
              fontWeight={active?770:620} fill="#D9EAF7">
              {message.subject}
            </text>
            <text x={151} y={y+90} fontSize={16}
              fill="#91ADC4">{message.preview}</text>
          </g>;
        })}
      </g>
      <rect x={138} y={792} width={333} height={93} rx={10}
        fill="#0B2F3D" stroke="#236B75" strokeWidth={1.7}/>
      <rect x={138} y={792} width={333} height={93} rx={10}
        fill="#302A25" stroke={AMBER} strokeWidth={1.7}
        opacity={waiting}/>
      <g opacity={waiting}>
          <circle cx={168} cy={826} r={11}
            fill="none" stroke={AMBER} strokeWidth={3.3}
            strokeDasharray="30 12"
            transform={'rotate('+(frame*3%360)+' 168 826)'}/>
          <text x={190} y={833} fill={WHITE} fontSize={19}
            fontWeight={810}>Trying to reconnect</text>
          <text x={152} y={864} fill="#E4BFA2" fontSize={16}>
            Mail is temporarily unavailable
          </text>
        </g>
      <g opacity={1-waiting}>
          <circle cx={165} cy={825} r={6} fill={MINT}
            opacity={.7+.3*blink}/>
          <text x={183} y={832} fill={WHITE} fontSize={19}
            fontWeight={810}>Connected</text>
          <text x={152} y={864} fill={SOFT} fontSize={16}>
            Your inbox is up to date
          </text>
        </g>
    </g>
    <rect x={56} y={157} width={430} height={769} rx={25}
      fill="none" stroke={waiting>.4?AMBER:CYAN}
      strokeWidth={1.5} opacity={.21+.20*waiting}/>
  </g>;
};
