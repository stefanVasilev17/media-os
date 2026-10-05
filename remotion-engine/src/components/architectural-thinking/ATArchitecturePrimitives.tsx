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
};

export const ATPrimaryNode: React.FC<ATPrimaryNodeProps> = ({title,subtitle,reveal,active,children,left='50%',top=118,width=820,height=680}) => {
  const glow = .12+active*.3;
  const scale = .965+reveal*.035+active*.012;
  return (
    <div style={{position:'absolute',left,top,width,height,transform:`translateX(-50%) scale(${scale})`,transformOrigin:'50% 50%',opacity:reveal,zIndex:8,borderRadius:38,padding:4,background:'linear-gradient(145deg,#163A66 0%,#2A70B3 38%,#6C37D8 68%,#321585 100%)',boxShadow:`0 28px 80px rgba(0,0,0,.46),0 0 ${36+active*34}px rgba(76,145,255,${glow})`}}>
      <div style={{width:'100%',height:'100%',borderRadius:34,overflow:'hidden',background:'linear-gradient(180deg,rgba(5,18,31,.995),rgba(3,10,19,.998))',border:'1px solid rgba(155,201,255,.22)',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 0%,rgba(47,116,207,.17),transparent 48%)'}}/>
        <div style={{position:'relative',padding:'30px 36px 0',textAlign:'center',fontFamily:AT_FONT}}>
          <div style={{fontSize:35,fontWeight:780,letterSpacing:'-.04em',color:'#F7FAFF',textShadow:active>.2?'0 0 18px rgba(163,216,255,.14)':'none'}}>{title}</div>
          {subtitle?<div style={{marginTop:9,fontSize:17,fontWeight:520,letterSpacing:'-.01em',color:'rgba(184,205,230,.72)'}}>{subtitle}</div>:null}
        </div>
        <div style={{position:'relative',padding:'24px 34px 34px'}}>{children}</div>
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
};

export const ATMiniWorld: React.FC<ATMiniWorldProps> = ({title,reveal,activity,items,tags=[]}) => (
  <div style={{borderRadius:24,padding:'22px 24px 20px',border:`1.5px solid rgba(80,150,224,${.22+activity*.44})`,background:'linear-gradient(180deg,rgba(8,25,42,.96),rgba(4,14,26,.985))',boxShadow:`0 12px 36px rgba(0,0,0,.24),0 0 ${10+activity*22}px rgba(47,145,255,${activity*.12})`,opacity:reveal,transform:`translateY(${(1-reveal)*14}px) scale(${.985+reveal*.015})`,fontFamily:AT_FONT}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}}>
      <div style={{fontSize:24,fontWeight:740,letterSpacing:'-.025em',color:'#F5F9FF'}}>{title}</div>
      {tags.length?<div style={{display:'flex',gap:8}}>{tags.map((tag)=><div key={tag} style={{padding:'6px 10px',borderRadius:999,border:'1px solid rgba(96,162,230,.28)',background:'rgba(11,31,51,.76)',fontSize:12,fontWeight:680,letterSpacing:'.035em',color:'rgba(175,207,238,.78)'}}>{tag}</div>)}</div>:null}
    </div>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(2,Math.max(1,items.length))},minmax(0,1fr))`,gap:12,marginTop:17}}>
      {items.map((item)=>{
        const itemActivity=item.activity??0;
        return <div key={item.label} style={{minHeight:72,borderRadius:18,border:`1.6px solid rgba(31,224,157,${.18+itemActivity*.74})`,background:itemActivity>.1?'linear-gradient(180deg,rgba(7,65,45,.78),rgba(3,21,16,.96))':'linear-gradient(180deg,rgba(10,28,46,.92),rgba(5,16,29,.98))',boxShadow:itemActivity>.1?`0 0 ${12+itemActivity*22}px rgba(31,230,162,${.08+itemActivity*.24})`:'inset 0 1px 0 rgba(255,255,255,.02)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'10px 14px',textAlign:'center'}}>
          <div style={{fontSize:18,fontWeight:itemActivity>.15?760:620,letterSpacing:'-.015em',color:'#F4FBF8'}}>{item.masked?'••••••••':item.label}</div>
          {item.detail?<div style={{marginTop:5,fontSize:12,fontWeight:520,letterSpacing:'.01em',color:'rgba(171,196,219,.66)'}}>{item.detail}</div>:null}
        </div>;
      })}
    </div>
  </div>
);

type ATRequestPacketProps = {
  reveal: number;
  ready: number;
  left?: number | string;
  top?: number;
};

export const ATRequestPacket: React.FC<ATRequestPacketProps> = ({reveal,ready,left='50%',top=744}) => {
  const lift = (1-reveal)*24;
  return (
    <div style={{position:'absolute',left,top,width:360,height:128,transform:`translateX(-50%) translateY(${lift}px) scale(${.94+reveal*.06+ready*.02})`,opacity:reveal,zIndex:12,fontFamily:AT_FONT}}>
      <div style={{position:'absolute',left:22,right:22,top:6,height:84,borderRadius:22,border:'1px solid rgba(83,150,218,.28)',background:'rgba(7,24,40,.9)',transform:'translateY(-12px) scale(.94)',opacity:.44}}/>
      <div style={{position:'absolute',left:12,right:12,top:10,height:88,borderRadius:22,border:'1px solid rgba(111,80,213,.34)',background:'rgba(12,20,47,.94)',transform:'translateY(-6px) scale(.97)',opacity:.66}}/>
      <div style={{position:'absolute',inset:'10px 0 0',borderRadius:24,padding:3,background:'linear-gradient(135deg,#2A78B8,#7547E6 60%,#1ECB9B)',boxShadow:`0 18px 48px rgba(0,0,0,.34),0 0 ${18+ready*30}px rgba(37,217,164,${.08+ready*.22})`}}>
        <div style={{height:'100%',borderRadius:21,background:'linear-gradient(180deg,#071C2E,#04111D)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',border:'1px solid rgba(178,220,255,.12)'}}>
          <div>
            <div style={{fontSize:12,fontWeight:720,letterSpacing:'.12em',color:'rgba(145,188,224,.68)'}}>STRUCTURED MESSAGE</div>
            <div style={{marginTop:5,fontSize:23,fontWeight:800,letterSpacing:'-.025em',color:'#F8FBFF'}}>RequestPacket</div>
          </div>
          <div style={{display:'flex',gap:6}}>{['P','H','C'].map((label,index)=><div key={label} style={{width:30,height:30,borderRadius:10,border:'1px solid rgba(115,190,227,.24)',background:index===2?'rgba(27,135,109,.28)':'rgba(29,72,118,.48)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#DDF7EF'}}>{label}</div>)}</div>
        </div>
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
