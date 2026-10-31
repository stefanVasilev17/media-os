import React from 'react';
import {AT_FONT, ATSemanticPill} from './ATVisualPrimitives';

export type ATRequestAssemblySection = {
  title: string;
  items: string[];
  reveal: number;
  activity: number;
  tags?: string[];
};

export type ATRequestAssemblyPanelProps = {
  frame: number;
  reveal: number;
  collapse: number;
  sections: ATRequestAssemblySection[];
};

export const ATRequestAssemblyPanel: React.FC<ATRequestAssemblyPanelProps> = ({frame,reveal,collapse,sections}) => {
  const scale = .94 + reveal*.06 - collapse*.08;
  return (
    <div style={{position:'absolute',left:838,top:105,width:770,height:760,opacity:reveal*(1-collapse*.82),transform:`translateY(${(1-reveal)*24+collapse*18}px) scale(${scale})`,transformOrigin:'50% 45%',zIndex:7}}>
      <div style={{position:'absolute',inset:0,borderRadius:38,padding:5,background:'linear-gradient(145deg,#0A8D9B 0%,#24E4DE 48%,#096477 100%)',boxShadow:'0 28px 82px rgba(0,0,0,.48),0 0 48px rgba(25,220,215,.18)'}}>
        <div style={{position:'relative',width:'100%',height:'100%',borderRadius:33,overflow:'hidden',background:'linear-gradient(180deg,rgba(4,20,31,.997),rgba(2,10,19,.997))',border:'1px solid rgba(148,255,247,.25)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.035)'}}>
          <div style={{height:92,display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid rgba(63,221,218,.22)',background:'linear-gradient(180deg,rgba(8,82,91,.20),rgba(4,17,28,0))'}}>
            <div style={{fontFamily:AT_FONT,fontSize:31,fontWeight:760,letterSpacing:'.055em',color:'#F5FFFF',textShadow:'0 0 18px rgba(70,237,230,.14)'}}>REQUEST ASSEMBLY</div>
          </div>
          <div style={{padding:'10px 42px 24px'}}>
            {sections.map((section,index)=>(
              <div key={section.title} style={{height:206,opacity:section.reveal,transform:`translateY(${(1-section.reveal)*14}px)`,position:'relative'}}>
                <div style={{height:58,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontFamily:AT_FONT,fontSize:27,fontWeight:720,letterSpacing:'-.025em',color:'#F5F8FD'}}>{section.title}</div>
                  {section.tags?.length?<div style={{display:'flex',gap:8}}>{section.tags.map((tag)=><div key={tag} style={{padding:'6px 10px',borderRadius:9,border:'1px solid rgba(91,210,228,.35)',background:'rgba(7,44,57,.58)',fontFamily:AT_FONT,fontSize:13,fontWeight:760,letterSpacing:'.08em',color:'#9DEDF1'}}>{tag}</div>)}</div>:null}
                </div>
                <div style={{display:'flex',gap:22,alignItems:'center',justifyContent:'center',paddingTop:15}}>
                  {section.items.map((item)=><ATSemanticPill key={item} label={item} activity={section.activity} frame={frame}/>)}
                </div>
                {index<sections.length-1?<div style={{position:'absolute',left:8,right:8,bottom:0,height:1,background:'linear-gradient(90deg,transparent,rgba(51,190,199,.32),transparent)'}}/>:null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export type ATRequestPacketProps = {
  frame: number;
  formation: number;
  travel: number;
};

export const ATRequestPacket: React.FC<ATRequestPacketProps> = ({frame,formation,travel}) => {
  const x = 1130 + travel*300;
  const y = 486 - travel*18;
  const runner = ((frame*8)%250)-80;
  return (
    <div style={{position:'absolute',left:x,top:y,width:300,height:142,opacity:formation,transform:`translate(-50%,-50%) scale(${.78+formation*.22})`,zIndex:12}}>
      <div style={{position:'absolute',inset:0,borderRadius:24,border:'2px solid rgba(104,244,236,.92)',background:'linear-gradient(180deg,rgba(6,43,53,.98),rgba(2,18,29,.995))',boxShadow:'0 18px 44px rgba(0,0,0,.45),0 0 34px rgba(38,230,218,.20)',overflow:'hidden'}}>
        <div style={{position:'absolute',left:runner,top:-24,width:70,height:190,transform:'rotate(16deg)',background:'linear-gradient(90deg,transparent,rgba(155,255,244,.26),transparent)',filter:'blur(8px)',opacity:.72}}/>
        <div style={{height:42,display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid rgba(103,232,224,.24)',fontFamily:AT_FONT,fontSize:15,fontWeight:820,letterSpacing:'.11em',color:'#DFFFFA'}}>LOGIN REQUEST</div>
        <div style={{height:96,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,padding:9}}>
          {['PAYLOAD','HEADERS','CONTEXT'].map((label)=><div key={label} style={{borderRadius:12,border:'1px solid rgba(60,210,190,.36)',background:'rgba(6,59,49,.50)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:AT_FONT,fontSize:12,fontWeight:760,letterSpacing:'.065em',color:'#A8F5DD'}}>{label}</div>)}
        </div>
      </div>
      <div style={{position:'absolute',right:-18,top:'50%',width:28,height:3,transform:'translateY(-50%)',borderRadius:99,background:'#66F1E8',boxShadow:'0 0 14px rgba(84,240,231,.55)'}}/>
      <div style={{position:'absolute',right:-20,top:'50%',width:9,height:9,borderTop:'3px solid #66F1E8',borderRight:'3px solid #66F1E8',transform:'translateY(-50%) rotate(45deg)'}}/>
    </div>
  );
};
