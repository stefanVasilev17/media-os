import React from 'react';
import {AT_FONT} from './ATVisualPrimitives';

type ATCameraRigProps = {
  children: React.ReactNode;
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  zIndex?: number;
};

export const ATCameraRig: React.FC<ATCameraRigProps> = ({children,x=0,y=0,scale=1,opacity=1,zIndex=1}) => (
  <div style={{position:'absolute',inset:0,transform:`translate3d(${x}px,${y}px,0) scale(${scale})`,transformOrigin:'50% 50%',opacity,zIndex}}>
    {children}
  </div>
);

type ATPrimaryNodeProps = {
  title: string;
  subtitle?: string;
  reveal: number;
  active: number;
  children?: React.ReactNode;
  left?: number | string;
  top?: number;
  width?: number;
  height?: number;
  compact?: boolean;
  micro?: boolean;
  visualScale?: number;
  quiet?: number;
  zIndex?: number;
};

export const ATPrimaryNode: React.FC<ATPrimaryNodeProps> = ({title,subtitle,reveal,active,children,left='50%',top=118,width=820,height=680,compact=false,micro=false,visualScale=1,quiet=0,zIndex=8}) => {
  const glow = .12+active*.3;
  const scale = .965+reveal*.035+active*.012;
  return (
    <div style={{position:'absolute',left,top,width,height,transform:`translateX(-50%) scale(${scale*visualScale})`,transformOrigin:'50% 50%',opacity:reveal*(1-quiet*.42),filter:`saturate(${1-quiet*.72}) brightness(${1-quiet*.16})`,zIndex,borderRadius:micro?18:compact?28:38,padding:micro?2:compact?3:4,background:'linear-gradient(145deg,#163A66 0%,#2A70B3 38%,#6C37D8 68%,#321585 100%)',boxShadow:`0 28px 80px rgba(0,0,0,.46),0 0 ${36+active*34}px rgba(76,145,255,${glow})`}}>
      <div style={{width:'100%',height:'100%',borderRadius:micro?16:compact?25:34,overflow:'hidden',background:'linear-gradient(180deg,rgba(5,18,31,.995),rgba(3,10,19,.998))',border:'1px solid rgba(155,201,255,.22)',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 0%,rgba(47,116,207,.17),transparent 48%)'}}/>
        <div style={{position:'relative',padding:micro?'11px 12px 0':compact?'20px 24px 0':'30px 36px 0',textAlign:'center',fontFamily:AT_FONT}}>
          <div style={{fontSize:micro?19:compact?28:35,fontWeight:780,letterSpacing:'-.04em',color:'#F7FAFF',textShadow:active>.2?'0 0 18px rgba(163,216,255,.14)':'none'}}>{title}</div>
          {subtitle?<div style={{marginTop:micro?3:compact?6:9,fontSize:micro?9:compact?13:17,fontWeight:520,letterSpacing:'-.01em',color:'rgba(184,205,230,.72)'}}>{subtitle}</div>:null}
        </div>
        <div style={{position:'relative',padding:micro?'8px 9px 9px':compact?'16px 20px 20px':'24px 34px 34px'}}>{children}</div>
      </div>
    </div>
  );
};

type ATMiniWorldItem = {
  label: string;
  detail?: string;
  activity?: number;
  masked?: boolean;
};

type ATMiniWorldProps = {
  title: string;
  reveal: number;
  activity: number;
  items: ATMiniWorldItem[];
  tags?: string[];
  compact?: boolean;
  micro?: boolean;
  footer?: React.ReactNode;
  footerReveal?: number;
};

export const ATMiniWorld: React.FC<ATMiniWorldProps> = ({title,reveal,activity,items,tags=[],compact=false,micro=false,footer,footerReveal=1}) => {
  if(micro){
    return (
      <div style={{borderRadius:12,padding:'6px 7px 6px',border:`1.25px solid rgba(80,150,224,${.20+activity*.48})`,background:'linear-gradient(180deg,rgba(8,25,42,.96),rgba(4,14,26,.985))',boxShadow:`0 8px 20px rgba(0,0,0,.18),0 0 ${6+activity*12}px rgba(47,145,255,${activity*.12})`,opacity:reveal,transform:`translateY(${(1-reveal)*5}px)`,fontFamily:AT_FONT}}>
        <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',minHeight:16}}>
          <div style={{fontSize:12,fontWeight:740,letterSpacing:'-.02em',color:'#F5F9FF',textAlign:'center'}}>{title}</div>
          {tags.length?<div style={{position:'absolute',right:0,display:'flex',gap:3}}>{tags.map((tag)=><div key={tag} style={{padding:'2px 4px',borderRadius:999,border:'1px solid rgba(96,162,230,.24)',background:'rgba(11,31,51,.72)',fontSize:7.5,fontWeight:700,letterSpacing:'.025em',color:'rgba(175,207,238,.76)'}}>{tag}</div>)}</div>:null}
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(2,Math.max(1,items.length))},minmax(0,1fr))`,gap:5,marginTop:5}}>
          {items.map((item)=>{
            const itemActivity=item.activity??0;
            return <div key={item.label} style={{minHeight:22,borderRadius:7,border:`1px solid rgba(31,224,157,${.18+itemActivity*.74})`,background:itemActivity>.1?'rgba(7,65,45,.82)':'rgba(7,21,35,.94)',boxShadow:itemActivity>.1?`0 0 ${6+itemActivity*10}px rgba(31,230,162,${.07+itemActivity*.22})`:'none',display:'flex',alignItems:'center',justifyContent:'center',padding:'3px 4px',textAlign:'center'}}>
              <div style={{fontSize:9.2,fontWeight:itemActivity>.15?760:620,letterSpacing:'-.01em',color:'#F4FBF8',whiteSpace:'nowrap'}}>{item.masked?'••••••••':item.label}</div>
            </div>;
          })}
        </div>
        {footer?<div style={{
          marginTop:6*footerReveal,
          maxHeight:48*footerReveal,
          opacity:footerReveal,
          overflow:'hidden',
        }}>{footer}</div>:null}
      </div>
    );
  }

  return (
    <div style={{borderRadius:compact?18:24,padding:compact?'13px 16px 12px':'22px 24px 20px',border:`1.5px solid rgba(80,150,224,${.22+activity*.44})`,background:'linear-gradient(180deg,rgba(8,25,42,.96),rgba(4,14,26,.985))',boxShadow:`0 12px 36px rgba(0,0,0,.24),0 0 ${10+activity*22}px rgba(47,145,255,${activity*.12})`,opacity:reveal,transform:`translateY(${(1-reveal)*(compact?8:14)}px) scale(${.985+reveal*.015})`,fontFamily:AT_FONT}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:compact?12:20}}>
        <div style={{fontSize:compact?18:24,fontWeight:740,letterSpacing:'-.025em',color:'#F5F9FF'}}>{title}</div>
        {tags.length?<div style={{display:'flex',gap:compact?5:8}}>{tags.map((tag)=><div key={tag} style={{padding:compact?'4px 7px':'6px 10px',borderRadius:999,border:'1px solid rgba(96,162,230,.28)',background:'rgba(11,31,51,.76)',fontSize:compact?10:12,fontWeight:680,letterSpacing:'.035em',color:'rgba(175,207,238,.78)'}}>{tag}</div>)}</div>:null}
      </div>
      <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(2,Math.max(1,items.length))},minmax(0,1fr))`,gap:compact?8:12,marginTop:compact?10:17}}>
        {items.map((item)=>{
          const itemActivity=item.activity??0;
          return <div key={item.label} style={{minHeight:compact?48:72,borderRadius:compact?13:18,border:`1.6px solid rgba(31,224,157,${.18+itemActivity*.74})`,background:itemActivity>.1?'linear-gradient(180deg,rgba(7,65,45,.78),rgba(3,21,16,.96))':'linear-gradient(180deg,rgba(10,28,46,.92),rgba(5,16,29,.98))',boxShadow:itemActivity>.1?`0 0 ${12+itemActivity*22}px rgba(31,230,162,${.08+itemActivity*.24})`:'inset 0 1px 0 rgba(255,255,255,.02)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:compact?'7px 10px':'10px 14px',textAlign:'center'}}>
            <div style={{fontSize:compact?14:18,fontWeight:itemActivity>.15?760:620,letterSpacing:'-.015em',color:'#F4FBF8'}}>{item.masked?'••••••••':item.label}</div>
            {item.detail?<div style={{marginTop:compact?3:5,fontSize:compact?10:12,fontWeight:520,letterSpacing:'.01em',color:'rgba(171,196,219,.66)'}}>{item.detail}</div>:null}
          </div>;
        })}
      </div>
    </div>
  );
};

type ATConnectionPathProps = {
  reveal: number;
  left: number;
  top: number;
  width: number;
  label: string;
  nodeOpacity?: number;
};

export const ATConnectionPath: React.FC<ATConnectionPathProps> = ({reveal,left,top,width,label,nodeOpacity=.28}) => (
  <div style={{position:'absolute',left,top,width,height:110,opacity:reveal,zIndex:4,fontFamily:AT_FONT}}>
    <div style={{position:'absolute',left:0,top:54,width:width-124,height:2,borderRadius:999,background:'linear-gradient(90deg,rgba(59,131,191,.72),rgba(74,91,138,.32))',boxShadow:'0 0 10px rgba(58,132,196,.12)'}}/>
    <div style={{position:'absolute',right:0,top:14,width:124,height:82,borderRadius:21,border:'1px solid rgba(87,132,175,.22)',background:'linear-gradient(180deg,rgba(8,24,39,.78),rgba(4,13,24,.9))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:720,letterSpacing:'.025em',color:'rgba(161,190,216,.72)',opacity:nodeOpacity}}>{label}</div>
  </div>
);


type ATFlowArrowProps = {
  frame: number;
  reveal: number;
  activity: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export const ATFlowArrow: React.FC<ATFlowArrowProps> = ({frame,reveal,activity,startX,startY,endX,endY}) => {
  const dx=endX-startX;
  const dy=endY-startY;
  const angle=Math.atan2(dy,dx)*180/Math.PI;
  const headX=startX+dx*reveal;
  const headY=startY+dy*reveal;
  const breathe=.82+Math.sin(frame*.11)*.18;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,zIndex:7,pointerEvents:'none',overflow:'visible'}}>
      <line x1={startX} y1={startY} x2={headX} y2={headY} stroke="rgba(50,119,177,.16)" strokeWidth={6} strokeLinecap="round"/>
      <line x1={startX} y1={startY} x2={headX} y2={headY} stroke={`rgba(91,186,238,${.58+activity*.24})`} strokeWidth={2.2} strokeLinecap="round"/>
      <circle cx={headX} cy={headY} r={3.8+activity*1.8} fill="rgba(171,226,255,.92)" opacity={reveal*(.62+activity*.28)*breathe}/>
      <polygon points="0,-6 13,0 0,6" transform={`translate(${headX} ${headY}) rotate(${angle})`} fill={`rgba(124,207,250,${reveal*(.68+activity*.22)})`}/>
    </svg>
  );
};

export type ATBackendMiniWorldSection = {
  title:string;
  items:{label:string;detail?:string;activity?:number}[];
};

export type ATBackendNodeProps = {
  title:string;
  x:number;
  y:number;
  reveal:number;
  sections:ATBackendMiniWorldSection[];
  active?:number;
  quiet?:number;
  secondaryReveal?:number;
  sectionReveals?:Record<string,number>;
  dnsLookup?:{hostname:string;address:string;reveal:number;found:number};
  gatewayIntro?:{arrival:number;inspection:number;frame:number};
  balancerIntro?:{arrival:number;selected:number;flow?:number;frame?:number;handoff?:number;unhealthy?:number};
  zIndex?:number;
  width?:number;
  height?:number;
};

export const ATBackendNode:React.FC<ATBackendNodeProps> = ({
  title,x,y,reveal,sections,active=0,quiet=.55,secondaryReveal=0,sectionReveals,dnsLookup,gatewayIntro,balancerIntro,zIndex,width=270,height=244,
}) => (
  <ATPrimaryNode
    title={title} left={x} top={y} width={width} height={height}
    reveal={reveal} active={active} quiet={quiet} zIndex={zIndex} micro
  >
    <div style={{
      position:'relative',display:'flex',flexDirection:'column',gap:5,
    }}>
      {balancerIntro?<div style={{height:157,position:'relative',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <svg width="100%" height={146} viewBox="0 0 232 146"
          style={{display:'block',overflow:'visible'}}>
          <defs>
            <linearGradient id="lb-native-spine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#58EAC0"/><stop offset=".48" stopColor="#4AE4E5"/>
              <stop offset="1" stopColor="#AC9DFF"/>
            </linearGradient>
          </defs>
          <path d="M 7 74 H 67" fill="none" stroke="rgba(83,239,198,.25)"
            strokeWidth={7} strokeLinecap="round"/>
          <path d="M 7 74 H 67" stroke="url(#lb-native-spine)"
            strokeWidth={2.6} fill="none" strokeLinecap="round"
            opacity={.4+.55*balancerIntro.arrival}/>
          <circle cx={67} cy={74} r={12} fill="rgba(167,148,255,.13)"/>
          <circle cx={67} cy={74} r={5} fill="#AFA3FF" stroke="#E2D9FF" strokeWidth={1.4}/>
          {[29,73,117].map((y,index)=>{
            const eligible=index!==1||(balancerIntro.unhealthy??0)<.65;
            const selected=index===2&&(balancerIntro.selected??0)>.1;
            const d='M 67 74 C 97 74 102 '+y+' 149 '+y;
            const strength=(balancerIntro.flow??0);
            const out=(balancerIntro.handoff??0);
            const useRoute=selected||index===0&&out>.01;
            return <g key={index} opacity={index===1?1-.65*(balancerIntro.unhealthy??0):1}>
              <path d={d} fill="none" stroke="rgba(87,146,216,.36)" strokeWidth={5}/>
              <path d={d} fill="none" stroke={selected?'#58EAC0':'rgba(94,191,247,.75)'}
                strokeWidth={selected?2.8:1.7} opacity={index===1&&!eligible?.17:.47+.5*strength}/>
              {Array.from({length:5},(_,k)=>{
                const cycle=(((balancerIntro.frame??0)*(.009+.001*index)+k/5+index*.21)%1+1)%1;
                const p=cycle,q=1-p;
                const px=q*q*q*67+3*q*q*p*97+3*q*p*p*102+p*p*p*149;
                const py=q*q*q*74+3*q*q*p*74+3*q*p*p*y+p*p*p*y;
                const visible=eligible&&(strength>.05||out>.05);
                const hue=selected&&k===0?'#58EAC0':k%3===0?'#8BAAFF':k%3===1?'#55D5F9':'#7BE7D9';
                return <rect key={k} x={px-4} y={py-1.7} width={8} height={3.4} rx={1.7}
                  fill={hue} opacity={visible?(.3+.65*Math.min(1,strength+out))*(1-Math.pow(Math.abs(2*p-1),5)):0}
                  style={{filter:'drop-shadow(0 0 3px '+hue+')'}}/>;
              })}
              <rect x={153} y={y-13} width={59} height={26} rx={7}
                fill={selected?'rgba(14,73,62,.93)':'rgba(14,33,62,.96)'}
                stroke={selected?'#58EAC0':eligible?'rgba(120,173,240,.72)':'rgba(228,133,137,.37)'}
                strokeWidth={selected?2.2:1.3}/>
              <circle cx={167} cy={y} r={4} fill={selected?'#58EAC0':eligible?'#78BDEA':'#F1A6AB'}/>
              <path d={'M 178 '+(y-5)+' H 201 M 178 '+(y+4)+' H 196'}
                stroke={selected?'#58EAC0':'#6A99CA'} strokeWidth={2.3}
                strokeLinecap="round" opacity={eligible?.9:.3}/>
              {useRoute&&out>.05&&<path d={'M 212 '+y+' C 219 '+y+' 216 73 227 73'}
                stroke={selected?'#58EAC0':'#79BEEA'} strokeWidth={selected?2.3:1.5}
                opacity={out} fill="none"/>}
            </g>;
          })}
          {Array.from({length:5},(_,k)=>{
            const p=(((balancerIntro.frame??0)*.022+k/5)%1+1)%1;
            const hue=k%3===0?'#5EEFC2':k%3===1?'#62DBF5':'#A695FF';
            return <rect key={'in'+k} x={8+54*p} y={72.5} width={k%2===0?8:5} height={3} rx={1.5}
              fill={hue} opacity={(balancerIntro.flow??0)*(.35+.55*(1-Math.abs(2*p-1)))}
              style={{filter:'drop-shadow(0 0 3px '+hue+')'}}/>;
          })}
          {(()=>{
            const travel=Math.max(0,Math.min(1,balancerIntro.handoff??0));
            const branch=Math.min(1,travel/.70);
            const exit=Math.max(0,(travel-.70)/.30);
            const x=travel===0?9+58*Math.min(1,balancerIntro.arrival):
              exit>0?149+78*exit:67+82*branch;
            const y=travel===0?74:exit>0?117-44*exit:74+43*branch;
            return <circle cx={x} cy={y} r={4.7}
              fill="#58EAC0" opacity={balancerIntro.arrival*(1-.85*Math.max(0,(travel-.91)/.09))}
              stroke="#C2FFEB" strokeWidth={1.1}
              style={{filter:'drop-shadow(0 0 5px rgba(88,234,192,.68))'}}/>;
          })()}
        </svg>
      </div>:gatewayIntro?<div style={{height:157,position:'relative',display:'flex',
        flexDirection:'column',justifyContent:'center',gap:12,padding:'8px 8px 0'}}>
        <svg viewBox="0 0 224 115" width="100%" height={114}
          style={{display:'block',overflow:'visible'}}>
          <path d="M 12 54 H 207" fill="none" stroke="rgba(90,144,188,.28)"
            strokeWidth={3} strokeLinecap="round"/>
          {[0,1,2,3,4].map((index)=>{
            const x=43+index*39;
            const lit=Math.max(0,Math.min(1,(gatewayIntro.inspection*5-index)*2.2));
            const waiting=index===0&&gatewayIntro.arrival>.1&&gatewayIntro.inspection<.03;
            return <g key={index}>
              <rect x={x-9} y={29} width={18} height={52} rx={6}
                fill="rgba(11,37,57,.95)"
                stroke={lit>.15?'rgba(88,234,192,.90)':waiting?'rgba(183,162,255,.88)':'rgba(114,153,192,.32)'}
                strokeWidth={lit>.15||waiting?2:1.4}/>
              <path d={`M ${x} 38 V 72`}
                stroke={lit>.15?'rgba(88,234,192,.88)':waiting?'rgba(183,162,255,.65)':'rgba(95,139,174,.40)'}
                strokeWidth={2.5} strokeLinecap="round"/>
              <circle cx={x} cy={54} r={lit>.15?4.3:3.5}
                fill={lit>.15?'#58EAC0':waiting?'#B7A2FF':'#608CA9'} opacity={waiting?.95:.35+lit*.65}/>
            </g>;
          })}
          <path d="M 12 54 H 207" stroke="rgba(88,234,192,.65)"
            strokeWidth={2.6} pathLength={1}
            strokeDasharray={`${Math.min(1,gatewayIntro.inspection*.82+.16)} 1`}
            fill="none" opacity={gatewayIntro.arrival*gatewayIntro.inspection}/>
          <circle cx={43+160*gatewayIntro.inspection} cy={54} r={5}
            fill="#58EAC0" opacity={gatewayIntro.arrival}
            style={{filter:'drop-shadow(0 0 6px rgba(88,234,192,.62))'}}/>
        </svg>
        <div style={{fontSize:11,fontFamily:AT_FONT,letterSpacing:'.10em',
          textAlign:'center',color:gatewayIntro.arrival>.9?'#78E6C1':'#8FA9C2',
          fontWeight:740}}>
          {gatewayIntro.inspection>=.999?'CHECKS PASSED':gatewayIntro.arrival>.9?'REQUEST HELD AT FIRST GATE':'AWAITING REQUEST'}
        </div>
      </div>:sections.map(section=>(
        <div key={section.title} style={{
          opacity:.20+.80*Math.max(0,Math.min(1,sectionReveals?.[section.title]??secondaryReveal)),
        }}>
          <ATMiniWorld
            title={section.title} items={section.items}
            reveal={1} activity={active} micro
            footerReveal={section.title==='DNS Resolution'&&dnsLookup?Math.max(0,Math.min(1,dnsLookup.reveal)):1}
            footer={section.title==='DNS Resolution'&&dnsLookup?(
              <div style={{
                display:'flex',alignItems:'center',justifyContent:'space-between',gap:4,
                borderRadius:6,padding:'5px 4px',minHeight:24,
                background:'rgba(3,15,28,.85)',border:'1px solid rgba(79,140,194,.32)',
                opacity:Math.max(0,Math.min(1,dnsLookup.reveal)),
              }}>
                <span style={{fontSize:9,fontWeight:720,letterSpacing:'-.03em',color:'#C5E3F8',whiteSpace:'nowrap'}}>
                  {dnsLookup.hostname}
                </span>
                <span style={{fontSize:12,color:'#65B5DF'}}>→</span>
                <span style={{
                  fontSize:9,fontWeight:740,letterSpacing:'-.04em',whiteSpace:'nowrap',
                  color:'#77F4CF',opacity:Math.max(0,Math.min(1,dnsLookup.found)),
                  textShadow:dnsLookup.found>.5?'0 0 9px rgba(75,227,184,.4)':'none',
                }}>{dnsLookup.address}</span>
              </div>
            ):undefined}
          />
        </div>
      ))}
    </div>
  </ATPrimaryNode>
);
