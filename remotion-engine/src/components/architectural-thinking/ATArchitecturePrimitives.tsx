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
};

export const ATPrimaryNode: React.FC<ATPrimaryNodeProps> = ({title,subtitle,reveal,active,children,left='50%',top=118,width=820,height=680,compact=false,micro=false}) => {
  const glow = .12+active*.3;
  const scale = .965+reveal*.035+active*.012;
  return (
    <div style={{position:'absolute',left,top,width,height,transform:`translateX(-50%) scale(${scale})`,transformOrigin:'50% 50%',opacity:reveal,zIndex:8,borderRadius:micro?18:compact?28:38,padding:micro?2:compact?3:4,background:'linear-gradient(145deg,#163A66 0%,#2A70B3 38%,#6C37D8 68%,#321585 100%)',boxShadow:`0 28px 80px rgba(0,0,0,.46),0 0 ${36+active*34}px rgba(76,145,255,${glow})`}}>
      <div style={{width:'100%',height:'100%',borderRadius:micro?16:compact?25:34,overflow:'hidden',background:'linear-gradient(180deg,rgba(5,18,31,.995),rgba(3,10,19,.998))',border:'1px solid rgba(155,201,255,.22)',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 0%,rgba(47,116,207,.17),transparent 48%)'}}/>
        <div style={{position:'relative',padding:micro?'10px 12px 0':compact?'20px 24px 0':'30px 36px 0',textAlign:'center',fontFamily:AT_FONT}}>
          <div style={{fontSize:micro?17:compact?28:35,fontWeight:780,letterSpacing:'-.04em',color:'#F7FAFF',textShadow:active>.2?'0 0 18px rgba(163,216,255,.14)':'none'}}>{title}</div>
          {subtitle?<div style={{marginTop:micro?3:compact?6:9,fontSize:micro?9:compact?13:17,fontWeight:520,letterSpacing:'-.01em',color:'rgba(184,205,230,.72)'}}>{subtitle}</div>:null}
        </div>
        <div style={{position:'relative',padding:micro?'7px 8px 8px':compact?'16px 20px 20px':'24px 34px 34px'}}>{children}</div>
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
};

export const ATMiniWorld: React.FC<ATMiniWorldProps> = ({title,reveal,activity,items,tags=[],compact=false,micro=false}) => {
  if(micro){
    return (
      <div style={{borderRadius:11,padding:'5px 6px 5px',border:`1.25px solid rgba(80,150,224,${.20+activity*.48})`,background:'linear-gradient(180deg,rgba(8,25,42,.96),rgba(4,14,26,.985))',boxShadow:`0 8px 20px rgba(0,0,0,.18),0 0 ${6+activity*12}px rgba(47,145,255,${activity*.12})`,opacity:reveal,transform:`translateY(${(1-reveal)*5}px)`,fontFamily:AT_FONT}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
          <div style={{fontSize:10.5,fontWeight:740,letterSpacing:'-.02em',color:'#F5F9FF'}}>{title}</div>
          {tags.length?<div style={{display:'flex',gap:3}}>{tags.map((tag)=><div key={tag} style={{padding:'2px 4px',borderRadius:999,border:'1px solid rgba(96,162,230,.24)',background:'rgba(11,31,51,.72)',fontSize:6.8,fontWeight:700,letterSpacing:'.025em',color:'rgba(175,207,238,.76)'}}>{tag}</div>)}</div>:null}
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(2,Math.max(1,items.length))},minmax(0,1fr))`,gap:4,marginTop:4}}>
          {items.map((item)=>{
            const itemActivity=item.activity??0;
            return <div key={item.label} style={{minHeight:18,borderRadius:6,border:`1px solid rgba(31,224,157,${.18+itemActivity*.74})`,background:itemActivity>.1?'rgba(7,65,45,.82)':'rgba(7,21,35,.94)',boxShadow:itemActivity>.1?`0 0 ${6+itemActivity*10}px rgba(31,230,162,${.07+itemActivity*.22})`:'none',display:'flex',alignItems:'center',justifyContent:'center',padding:'2px 3px',textAlign:'center'}}>
              <div style={{fontSize:7.8,fontWeight:itemActivity>.15?760:620,letterSpacing:'-.01em',color:'#F4FBF8',whiteSpace:'nowrap'}}>{item.masked?'••••••••':item.label}</div>
            </div>;
          })}
        </div>
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
  const travel=((frame*0.012)%1+1)%1;
  const dotX=startX+dx*travel;
  const dotY=startY+dy*travel;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,opacity:reveal,zIndex:7,pointerEvents:'none',overflow:'visible'}}>
      <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="rgba(34,214,194,.14)" strokeWidth={8} strokeLinecap="round"/>
      <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={`rgba(38,224,204,${.48+activity*.34})`} strokeWidth={2.4} strokeLinecap="round"/>
      <circle cx={dotX} cy={dotY} r={5+activity*2.5} fill="rgba(132,255,237,.96)" opacity={.65+activity*.35}/>
      <circle cx={dotX} cy={dotY} r={12+activity*5} fill="rgba(38,224,204,.12)" opacity={.4+activity*.35}/>
      <polygon points="0,-7 15,0 0,7" transform={`translate(${endX} ${endY}) rotate(${angle})`} fill={`rgba(84,239,220,${.66+activity*.28})`}/>
    </svg>
  );
};
