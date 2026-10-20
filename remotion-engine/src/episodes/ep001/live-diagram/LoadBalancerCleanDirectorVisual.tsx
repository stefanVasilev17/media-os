import React from 'react';
import {Easing, interpolate} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';

const P={
  white:'#F2F7FF',muted:'#9AB3CD',line:'#7194B9',
  violet:'#B6A5FF',blue:'#87C8FF',green:'#58EAC0',
  amber:'#F1B56F',red:'#FA8191',
};
const smooth=(f:number,a:number,b:number)=>interpolate(f,[a,Math.max(a+1,b)],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)});
const clip=(x:number)=>Math.max(0,Math.min(1,x));
const Y=[120,286,452];
type Diagnostic={instance:number;progress:number;id:number;color:string};
type Props={phase:number;local:number;frames:number;previousPhase?:number;frozen?:boolean};

const point=(instance:number,t:number)=>{
  const x0=315,x1=440,x2=525,x3=745;
  const y0=286,y3=Y[instance];
  const t0=1-t;
  return {
    x:t0*t0*t0*x0+3*t0*t0*t*x1+3*t0*t*t*x2+t*t*t*x3,
    y:t0*t0*t0*y0+3*t0*t0*t*286+3*t0*t*t*y3+t*t*t*y3
  };
};
const route=(y:number)=>'M 315 286 C 440 286 525 '+y+' 745 '+y;

const ModeNavigation:React.FC<{phase:number;previous:number;blend:number}>=({
  phase,previous,blend
})=>{
  const tabs=[
    ['Traffic Distribution',['Route Mode','Hash Key']],
    ['Health Checks',['Healthy','Timeout']],
    ['Target Choice',['Instance','Zone']]
  ] as const;
  const focus=(p:number):[string,string]=>p<=2?['Traffic Distribution','Route Mode']:
    p===3?['Traffic Distribution','Hash Key']:
    p===4?['Health Checks','Timeout']:['Target Choice','Instance'];
  const now=focus(phase),before=focus(previous);
  const intensity=(category:string,item?:string)=>clip(
    (category===before[0]&&(!item||item===before[1])?1-blend:0)+
    (category===now[0]&&(!item||item===now[1])?blend:0));
  return <div style={{display:'flex',flexDirection:'column',gap:19,width:'100%',height:'100%'}}>
    {tabs.map(([name,items])=>{
      const on=intensity(name);
      return <div key={name} style={{flex:1,minHeight:0,borderRadius:21,
        border:'2px solid rgba(151,177,252,'+(.20+.46*on)+')',
        background:'rgba(11,28,53,.95)',padding:'23px 22px',
        boxShadow:'0 0 '+(18*on)+'px rgba(135,143,245,'+(.17*on)+')',
        opacity:.70+.30*on}}>
        <div style={{fontSize:24,fontWeight:830,color:on>.50?P.white:P.muted,
          paddingBottom:20}}>{name}</div>
        <div style={{display:'flex',gap:9}}>
          {items.map(item=>{
            const hit=intensity(name,item);
            return <div key={item} style={{flex:1,padding:'13px 4px',fontSize:18,fontWeight:760,
              textAlign:'center',borderRadius:11,
              border:'1px solid rgba(113,204,253,'+(.16+.48*hit)+')',
              background:'rgba(34,90,147,'+(.08+.32*hit)+')',
              color:hit>.5?P.blue:P.muted}}>{item}</div>;
          })}
        </div>
      </div>;
    })}
  </div>;
};

export const LoadBalancerCenter:React.FC<Props>=({phase,local,frames})=>{
  const unit=clip(local/Math.max(1,frames));
  const title=[
    'Three servers. One request.',
    'Traffic Distribution',
    'Round Robin',
    'Hash Key',
    'Health Checks',
    'Target Choice'
  ][Math.min(phase,5)];
  const diag:Diagnostic[]=[];
  if(phase===1){
    for(let i=0;i<3;i++)diag.push({instance:i,progress:smooth(unit,.12+i*.24,.31+i*.24),
      id:i+1,color:P.blue});
  }
  if(phase===2){
    for(let i=0;i<3;i++)diag.push({instance:i,progress:smooth(unit,.13+i*.24,.32+i*.24),
      id:i+1,color:P.blue});
  }
  if(phase===3){
    for(let i=0;i<2;i++)diag.push({instance:1,progress:smooth(unit,.16+i*.40,.41+i*.40),
      id:i+1,color:P.blue});
  }
  const failure=phase===4?smooth(unit,.48,.76):phase>4?1:0;
  const probeOne=phase===4?smooth(unit,.10,.27):0;
  const probeTwo=phase===4?smooth(unit,.32,.49):0;
  const choice=phase===5?smooth(unit,.23,.39):0;
  const canonical=phase===5?smooth(unit,.45,.86):0;
  const showPrompt=phase===0;
  return <div style={{width:'100%',height:'100%',position:'relative',
    fontFamily:AT_FONT,display:'flex',flexDirection:'column'}}>
    <div style={{flex:'0 0 auto',fontSize:39,fontWeight:880,color:P.white,
      lineHeight:1.12,marginBottom:12}}>{title}</div>
    <div style={{height:56,fontSize:25,fontWeight:700,
      color:phase===5?P.green:phase===4?P.amber:P.muted}}>
      {showPrompt?'Which server should receive our login?':
       phase===1?'Three separate example requests':
       phase===2?'Request 1 → A     Request 2 → B     Request 3 → C':
       phase===3?'Same key: client-42':
       phase===4?(failure>.9?'Instance C is now unhealthy':
                    unit>.30?'Health probes: no response':'Health probe sent to C'):
       'Instance B · Zone B'}
    </div>
    <svg width="100%" viewBox="0 0 960 585" style={{display:'block',
      overflow:'visible',maxHeight:560,flex:'1 1 auto'}}>
      <defs>
        <linearGradient id="lb-v2-node" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#18385E"/>
          <stop offset="100%" stopColor="#091C36"/>
        </linearGradient>
      </defs>
      <rect x="16" y="205" width="276" height="163" rx="25"
        fill="url(#lb-v2-node)" stroke={P.violet} strokeWidth="2.5"/>
      <text x="154" y="275" fill={P.white} fontSize="35" fontFamily={AT_FONT}
        fontWeight="860" textAnchor="middle">LOAD</text>
      <text x="154" y="316" fill={P.white} fontSize="35" fontFamily={AT_FONT}
        fontWeight="860" textAnchor="middle">BALANCER</text>
      <circle cx="310" cy="286" r="9" fill={P.violet}/>
      {Y.map((y,index)=>{
        const unhealthy=index===2&&failure>.90;
        const selected=index===1&&choice>.10;
        return <g key={index}>
          <path d={route(y)} fill="none"
            stroke={unhealthy?'rgba(117,125,144,.23)':
              selected?P.green:'rgba(106,143,198,.55)'}
            strokeWidth={selected?5:3}
            strokeDasharray={unhealthy?'7 12':undefined}/>
          <rect x="756" y={y-56} width="192" height={112} rx="18"
            fill="url(#lb-v2-node)"
            stroke={unhealthy?P.red:selected?P.green:'rgba(125,171,222,.62)'}
            strokeWidth={selected?4:2} opacity={unhealthy?.41:1}/>
          <rect x="767" y={y-40} width={6} height={80} rx={3}
            fill={unhealthy?P.red:selected?P.green:P.blue}
            opacity={unhealthy?.45:1}/>
          <text x="856" y={y-8} fill={P.white} fontFamily={AT_FONT}
            fontSize="26" fontWeight="840" textAnchor="middle"
            opacity={unhealthy?.64:1}>{'INSTANCE '+String.fromCharCode(65+index)}</text>
          <text x="856" y={y+28} fontFamily={AT_FONT} fontSize="22"
            fontWeight="760" textAnchor="middle"
            fill={unhealthy?P.red:selected?P.green:P.muted}>
            {unhealthy?'UNHEALTHY':selected?'ZONE B':'HEALTHY'}
          </text>
          {phase===2&&unit>.23+index*.24&&
            <circle cx="745" cy={y} r="14" fill={P.blue}
              opacity={clip((unit-(.23+index*.24))*12)}/>}
          {phase===3&&index===1&&unit>.41&&
            <text x="700" y={y-28} textAnchor="middle"
              fill={P.blue} fontFamily={AT_FONT} fontSize="26" fontWeight="850">
              {unit>.81?'2 REQUESTS':'1 REQUEST'}
            </text>}
        </g>;
      })}
      {diag.map(packet=>{
        const pt=point(packet.instance,packet.progress);
        const opacity=clip(packet.progress*13)*(1-smooth(packet.progress,.96,1));
        return <g key={packet.id} opacity={opacity}>
          <circle cx={pt.x} cy={pt.y} r={13} fill={packet.color}
            stroke="#D8EBFF" strokeWidth="2"/>
          <text x={pt.x} y={pt.y+5} textAnchor="middle" fontFamily={AT_FONT}
            fontSize={13} fontWeight="900" fill="#082039">{packet.id}</text>
        </g>;
      })}
      {phase===4&&[probeOne,probeTwo].map((p,i)=>{
        const pos=point(2,p);
        return <g key={i} opacity={clip(p*8)*(1-smooth(p,.9,1))}>
          <circle cx={pos.x} cy={pos.y} r={12}
            fill={P.amber} stroke="#FFDEAE" strokeWidth={2}/>
        </g>;
      })}
      {phase===4&&unit>.26&&<g opacity={smooth(unit,.28,.45)}>
        <text x="670" y="516" textAnchor="middle" fontFamily={AT_FONT}
          fontSize="31" fontWeight="850" fill={P.amber}>
          {failure>.95?'C REMOVED FROM ELIGIBLE ROUTES':
            unit>.49?'TIMEOUT':'NO RESPONSE'}
        </text>
      </g>}
      <circle cx={canonical>0?point(1,canonical).x:310}
        cy={canonical>0?point(1,canonical).y:286}
        r={14} fill={P.green} stroke="#CBFFE8" strokeWidth="2.8"
        style={{filter:'drop-shadow(0 0 11px rgba(88,234,192,.58))'}}/>
      {phase===5&&<path d={route(Y[1])} pathLength={1}
        stroke={P.green} strokeWidth={4} fill="none"
        strokeDasharray={String(canonical)+' 1'} opacity={.82}/>}
      {phase<=4&&<text x="310" y="250" textAnchor="middle"
        fontSize="20" fontFamily={AT_FONT} fill={P.green} fontWeight="820">
        LOGIN REQUEST
      </text>}
      {phase===5&&choice>.95&&<text x="615" y="253"
        textAnchor="middle" fontFamily={AT_FONT} fontWeight="830"
        fontSize={27} fill={P.green}>SELECTED</text>}
    </svg>
    {phase===4&&<div style={{marginTop:3,textAlign:'center',
      fontSize:28,fontWeight:790,color:failure>.9?P.green:P.amber}}>
      {failure>.9?'Eligible: A + B':'Waiting for the configured failure threshold'}
    </div>}
  </div>;
};

export {ModeNavigation};
