import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {AT_FONT} from '../../components/architectural-thinking';

export type Shot01LoginWaitingProps = {
  durationInFrames: number;
  presentation: 'STORYBOARD_PREVIEW_V1';
};

const C={
  bg:'#030B17',panel:'#0C1B31',panel2:'#10233E',stroke:'#34577B',
  cyan:'#36D3EF',violet:'#9B8BF6',green:'#4ADFB1',amber:'#F1BC70',
  white:'#EDF5FF',dim:'#7893B4',muted:'#253C59'
};
const smooth=(start:number,end:number,at:number)=>interpolate(at,[start,end],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)
});
const blend=(a:number,b:number,t:number)=>a+(b-a)*t;
const font={fontFamily:AT_FONT};
const Label:React.FC<{x:number;y:number;size?:number;color?:string;children:React.ReactNode;weight?:number}>=
  ({x,y,size=26,color=C.white,children,weight=650})=>
    <text x={x} y={y} fontFamily={AT_FONT} fontSize={size} fill={color} fontWeight={weight}>{children}</text>;

function World({frame,duration}:{frame:number;duration:number}){
  const at=frame/Math.max(1,duration-1);
  // Editorial storyboard windows only. These are NOT measured voice-word cue frames.
  const press=smooth(.04,.09,at);
  const phoneReturn=smooth(.57,.70,at);
  const authFocus=smooth(.37,.50,at)*(1-phoneReturn);
  const phoneOpacity=blend(.98,.62,authFocus);
  const authEmphasis=smooth(.34,.46,at)*(1-smooth(.66,.77,at));
  const railVisibility=smooth(.19,.26,at)*(1-smooth(.84,.92,at));
  const rewind=smooth(.84,.94,at);
  const pulse=.5+.5*Math.sin(frame*.14);
  const spinner=frame*9;
  const zoom=1+authEmphasis*.16+rewind*.07;
  const cx=authEmphasis*130-rewind*80;
  const cy=authEmphasis*12;
  const showProbe=smooth(.43,.52,at)*(1-smooth(.70,.78,at));
  const spinnerOpacity=smooth(.07,.14,at);

  return <AbsoluteFill style={{backgroundColor:C.bg,overflow:'hidden'}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%"
      style={{position:'absolute',inset:0,...font}} aria-label="Login is waiting while Auth passes shallow health checks">
      <defs>
        <radialGradient id="ep002-bg"><stop offset="0%" stopColor="#102743"/><stop offset="100%" stopColor={C.bg}/></radialGradient>
        <filter id="ep002-glow"><feGaussianBlur stdDeviation="12"/></filter>
        <linearGradient id="ep002-route" x1="0" x2="1"><stop offset="0%" stopColor={C.cyan}/><stop offset="100%" stopColor={C.violet}/></linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#ep002-bg)"/>
      {Array.from({length:13},(_,i)=><line key={'v'+i} x1={130+i*145} x2={130+i*145}
        y1={75} y2={1000} stroke="#274463" strokeOpacity=".16"/>)}
      {Array.from({length:7},(_,i)=><line key={'h'+i} x1={90} x2={1840}
        y1={135+i*142} y2={135+i*142} stroke="#274463" strokeOpacity=".16"/>)}
      <Label x={111} y={92} size={24} color="#A9C6E3">ARCHITECTURAL THINKING</Label>
      <Label x={110} y={146} size={43} weight={720}>LOGIN REQUEST / UNRESOLVED</Label>
      <rect x={111} y={170} width={650} height={3} rx={2} fill={C.cyan} opacity=".8"/>
      <g transform={`translate(${960+cx},${545+cy}) scale(${zoom}) translate(-960,-545)`}>
        <path d="M 674 520 C 865 520 1070 520 1290 520"
          fill="none" stroke="url(#ep002-route)" strokeWidth="8" strokeOpacity=".14"
          strokeDasharray="15 18"/>
        <path d="M 674 520 C 865 520 1070 520 1290 520"
          fill="none" stroke={C.cyan} strokeWidth="3" strokeOpacity={.15+authEmphasis*.16}/>
        <g opacity={phoneOpacity}>
          <rect x={245} y={236} width={436} height={647} rx={56}
            fill="#00040D" stroke={C.cyan} strokeWidth={4}/>
          <rect x={265} y={263} width={395} height={592} rx={40}
            fill="#0C1E34" stroke="#265274" strokeWidth={2}/>
          <rect x={404} y={281} width={120} height={9} rx={4.5} fill="#517B9E"/>
          <Label x={332} y={372} size={30} color="#D8ECFF">YOUR ACCOUNT</Label>
          <rect x={325} y={420} width={274} height={57} rx={12} fill="#172D48" stroke="#335878"/>
          <rect x={325} y={499} width={274} height={57} rx={12} fill="#172D48" stroke="#335878"/>
          <rect x={327} y={613} width={270} height={93} rx={18}
            fill={press>.6?'#183953':'#12628D'} stroke={C.cyan} strokeWidth={2}/>
          <Label x={383} y={669} size={31} color={C.white} weight={750}>LOGIN</Label>
          <g opacity={spinnerOpacity} transform="translate(465 771)">
            <circle r={24} fill="none" stroke="#294F73" strokeWidth={7}/>
            <g transform={`rotate(${spinner})`}>
              <path d="M 0 -24 A24 24 0 0 1 24 0" stroke={C.cyan}
                strokeWidth={7} strokeLinecap="round" fill="none"/>
            </g>
          </g>
          <rect x={327} y={811} width={271} height={8} rx={4} fill="#143451"/>
          <rect x={327} y={811} width={100+railVisibility*76} height={8} rx={4}
            fill={C.cyan} opacity={railVisibility*.7}/>
          <Label x={325} y={906} size={20} color={C.cyan}>PHONE / LOGIN CLIENT</Label>
        </g>
        <g opacity={.38+authEmphasis*.62}>
          <rect x={1260} y={345} width={438} height={350} rx={35}
            fill={C.panel} stroke={C.violet} strokeWidth={authEmphasis?3:2}/>
          <rect x={1300} y={388} width={359} height={75} rx={16}
            fill="#1D2549" stroke="#776CC9"/>
          <Label x={1322} y={435} size={32} color="#D6CFFF">AUTH SERVICE</Label>
          <g stroke="#6B89AF" strokeWidth={2} fill="#172C4C">
            <rect x={1310} y={512} width={115} height={88} rx={11}/>
            <rect x={1443} y={512} width={115} height={88} rx={11}/>
            <rect x={1576} y={512} width={82} height={88} rx={11}/>
          </g>
          <circle cx={1655} cy={369} r={16} fill={C.green}
            opacity={.34+authEmphasis*(.40+.20*pulse)}/>
          <Label x={1310} y={645} size={18} color="#AA9EF5">AUTH / KNOWN IDENTITY</Label>
        </g>
      </g>
      <g opacity={showProbe}>
        <rect x={1262} y={744} width={500} height={145} rx={20}
          fill="#102C35" stroke={C.green} strokeWidth={2}/>
        <Label x={1302} y={805} color={C.green} size={27}>Liveness: PASS</Label>
        <Label x={1302} y={850} color={C.green} size={27}>Readiness: PASS</Label>
      </g>
      <g opacity={railVisibility}>
        <rect x={284} y={961} width={1282} height={4} rx={2} fill={C.dim}/>
        <rect x={284} y={961} width={railVisibility*800} height={4} rx={2} fill={C.amber}/>
        <Label x={292} y={1005} color={C.amber} size={24}>TIME PASSES — NO RESPONSE</Label>
      </g>
      <g opacity={rewind}>
        <rect x={1340} y={105} width={420} height={125} rx={20}
          fill="#112A44" stroke={C.amber} strokeWidth={2}/>
        <Label x={1390} y={158} color={C.amber} size={24}>REWIND</Label>
        <Label x={1390} y={209} color={C.white} size={51}>09:00</Label>
      </g>
      <rect x={91} y={1024} width={1736} height={2} fill="#2C4B68"/>
      <Label x={112} y={1060} color={C.dim} size={17}>
        ILLUSTRATIVE SHALLOW HEALTH PROBES — NOT END-TO-END LOGIN SUCCESS
      </Label>
      <g opacity={Math.max(0,1-smooth(.07,.1,at))}>
        <circle cx={460} cy={661} r={30+press*15} fill="none" stroke={C.cyan}
          strokeWidth={4} opacity={1-press}/>
      </g>
    </svg>
  </AbsoluteFill>;
}

export const Shot01LoginWaiting:React.FC<Shot01LoginWaitingProps>=({durationInFrames})=>{
  const frame=useCurrentFrame();
  const config=useVideoConfig();
  const total=Math.max(1,durationInFrames||config.durationInFrames);
  return <World frame={frame} duration={total}/>;
};
