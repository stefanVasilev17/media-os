import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ATControlledRealismLayer,AT_FONT} from '../../components/architectural-thinking';
import {Shot02PressurePhone} from './Shot02PressurePhone';
import {SHOT02_NODES} from './Shot02PremiumLayout';
import {shot04StatusPalette} from './Shot04VisualContract';
import {shot07Ease} from './Shot07VisualContract';
import {Shot07RequestFlows} from './Shot07RequestFlows';
import {SHOT02_AUTH_REPLICA_PORTS} from './Shot02PressureVisuals';

const WHITE='#F5FCFF',SOFT='#B5D2E6',CYAN='#68E5FF';
const MINT=shot04StatusPalette.healthy,AMBER=shot04StatusPalette.waiting;
const RED=shot04StatusPalette.overloaded;
const node=(name:keyof typeof SHOT02_NODES)=>{
  const n=SHOT02_NODES[name];
  return {position:'absolute' as const,left:n.x-n.width/2,top:n.y,
    width:n.width,height:n.height,boxSizing:'border-box' as const};
};
const box=(border:string,glow:string)=>({
  border:'2px solid '+border,borderRadius:19,
  background:'linear-gradient(145deg,rgba(8,32,53,.99),rgba(3,15,30,.998))',
  boxShadow:'0 0 24px '+glow+',inset 0 1px 0 rgba(255,255,255,.09)',
  boxSizing:'border-box' as const,
});
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

export type CleanArchitectureProps={
  frame:number;
  replicaGrowth:number;
  dbStress:number;
  cascadeStartFrame:number;
  criticalPulseStartFrame?:number;
  recoveryLevel?:number;
  showPhone:number;
  showPools:number;
  showLoginBadge?:number;
  showRetryAttempts?:number;
  initialPressure?:boolean;
  flowRetryLevel?:number;
  flowJitterLevel?:number;
};

export const Shot07CleanArchitectureWorld:React.FC<CleanArchitectureProps>=({
  frame,replicaGrowth,dbStress,cascadeStartFrame,criticalPulseStartFrame=-1,
  recoveryLevel=0,showPhone,showPools,showLoginBadge=0,
  showRetryAttempts=0,initialPressure=false,
  flowRetryLevel=1,flowJitterLevel=0,
})=>{
  const growth=clamp(replicaGrowth);
  const recovery=clamp(recoveryLevel);
  const dbPulseStart=criticalPulseStartFrame>=0
    ?criticalPulseStartFrame:cascadeStartFrame;
  const dbPulseAge=Math.max(0,frame-dbPulseStart);
  const dbWave=dbPulseStart>=0
    ?shot07Ease(frame,dbPulseStart,14)*(.42+.58*Math.sin(dbPulseAge*.088)**2)
        *(1-.72*recovery)
    :initialPressure?.33:0;
  const dbGlow=.12+.36*clamp(dbStress)+.46*dbWave;
  const replicas=['AUTH 01','AUTH 02','AUTH 03','AUTH 04','AUTH 05','AUTH 06'];
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <ATControlledRealismLayer frame={frame+2400} realism={.85} architectureReveal={.96}/>
    <Shot07RequestFlows frame={frame} retryLevel={flowRetryLevel}
      jitterLevel={flowJitterLevel}/>
    <div style={{...node('gateway'),...box('#5DCEE8','rgba(42,176,223,.21)'),
      zIndex:9,padding:'27px 20px',fontFamily:AT_FONT}}>
      <b style={{color:WHITE,fontSize:24}}>API Gateway</b>
      <div style={{marginTop:24,color:MINT,fontSize:17,fontWeight:800}}>● ONLINE</div>
      <div style={{borderTop:'1px solid #376A89',marginTop:30,paddingTop:19,
        fontSize:17,color:SOFT}}>LOGIN REQUESTS</div>
      <div style={{marginTop:11,fontSize:17,fontWeight:830,color:WHITE}}>Still arriving</div>
    </div>
    <div style={{...node('balancer'),...box('#5DCEE8','rgba(42,176,223,.21)'),
      zIndex:9,padding:'26px 18px',fontFamily:AT_FONT}}>
      <b style={{color:WHITE,fontSize:23}}>Load Balancer</b>
      <div style={{marginTop:21,color:MINT,fontSize:16,fontWeight:810}}>● ROUTING</div>
      <div style={{borderTop:'1px solid #376A89',marginTop:28,paddingTop:15,
        fontSize:19,fontWeight:860,color:WHITE}}>
        {growth>.99?'6 Auth replicas':growth>.03?'3 → 6 replicas':'3 Auth replicas'}
      </div>
      <div style={{display:'flex',gap:6,marginTop:19,flexWrap:'wrap'}}>
        {replicas.map((_,i)=><div key={i} style={{
          width:57,height:12,borderRadius:7,
          background:i<3?CYAN:MINT,
          opacity:i<3?1:shot07Ease(growth*100,i*9,32),
          boxShadow:'0 0 10px rgba(75,215,255,.29)',
        }}/>)}
      </div>
    </div>
    <div style={{...node('auth'),...box('#9184FF','rgba(125,111,255,.29)'),
      zIndex:9,fontFamily:AT_FONT,
      background:'linear-gradient(150deg,rgba(11,22,50,.995),rgba(4,13,34,.998))'}}>
      <div style={{height:65,display:'flex',alignItems:'center',
        justifyContent:'center',color:WHITE,fontSize:27,fontWeight:870}}>
        Auth Service
      </div>
      {replicas.map((label,i)=>{
        const entering=i>=3;
        const appear=entering?shot07Ease(growth*100,(i-3)*17,40):1;
        const row=i%3;
        const y=SHOT02_AUTH_REPLICA_PORTS[row].y-SHOT02_NODES.auth.y-35;
        const oldLeft=40,smallLeft=11;
        const left=entering?179:oldLeft+(smallLeft-oldLeft)*growth;
        const width=entering?158:268-110*growth;
        const surge=cascadeStartFrame<0?0:
          shot07Ease(frame,cascadeStartFrame+44+row*24,18);
        const wave=surge*(.55+.45*Math.sin(Math.max(0,frame-cascadeStartFrame-row*24)*.14)**2)
          *(1-.72*recovery);
        return <div key={label} style={{
          position:'absolute',left,top:y,width,height:71,
          boxSizing:'border-box',display:'flex',flexDirection:'column',
          justifyContent:'center',padding:'8px 11px',
          border:'2px solid '+(wave>.35?AMBER:'#498CB7'),
          borderRadius:11,
          background:'linear-gradient(140deg,rgba(10,47,71,.99),rgba(5,26,48,.99))',
          boxShadow:wave>.2?'0 0 '+(12+16*wave)+'px rgba(243,152,92,'+(.21+.28*wave)+')'
              :'0 0 9px rgba(55,202,252,.16)',
          opacity:appear,
          transform:'scale('+(0.96+.04*appear)+')',
          transformOrigin:'50% 50%',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{height:10,width:10,borderRadius:3,
              background:wave>.25?AMBER:MINT,
              boxShadow:wave>.25?'0 0 11px '+AMBER:'0 0 8px '+MINT}}/>
            <span style={{fontSize:18,fontWeight:850,color:WHITE,
              whiteSpace:'nowrap'}}>{label}</span>
          </div>
          {showPools>.03&&<div style={{
            opacity:showPools,fontSize:13,fontWeight:800,marginTop:7,
            color:SOFT,letterSpacing:'.02em'}}>POOL · UP TO 8 DB CONN</div>}
        </div>;
      })}
    </div>
    <div style={{...node('database'),...box(RED,
      'rgba(243,91,77,'+dbGlow.toFixed(3)+')'),
      borderWidth:3+2*dbWave,zIndex:10,fontFamily:AT_FONT,
      boxShadow:'0 0 '+(24+32*dbWave)+'px rgba(243,91,77,'+dbGlow.toFixed(3)+
        '),0 0 '+(12+35*dbWave)+'px rgba(255,126,76,'+
        (.10+.24*dbWave).toFixed(3)+'),inset 0 1px 0 rgba(255,255,255,.09)',
      transform:'scale('+(1+.018*dbWave)+')',
      background:'linear-gradient(150deg,rgba(9,26,44,.99),rgba(57,24,31,.99))'}}>
      <div style={{marginTop:24,textAlign:'center',fontWeight:880,
        fontSize:26,color:WHITE}}>User Database</div>
      <svg width="90" height="91" viewBox="0 0 90 90"
        style={{display:'block',margin:'18px auto 0',overflow:'visible',
          filter:'drop-shadow(0 0 '+(7+25*dbWave)+'px '+RED+')'}}>
        <ellipse cx="45" cy="17" rx="29" ry="11" fill="none" stroke={RED} strokeWidth="4"/>
        <path d="M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40"
          fill="none" stroke={RED} strokeWidth="4"/>
        <ellipse cx="45" cy="65" rx="29" ry="11" fill="none" stroke={RED} strokeWidth="4"/>
      </svg>
      <div style={{margin:'15px 13px 0',height:40,border:'1.7px solid '+RED,
        borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:15,fontWeight:880,color:'#FFE4D8',
        background:'rgba(6,25,43,.79)'}}>SATURATED · RUNNING</div>
      <div style={{position:'absolute',bottom:9,left:0,right:0,
        textAlign:'center',fontSize:12,fontWeight:780,color:MINT}}>
        ● STILL COMPLETING
      </div>
    </div>
    <AbsoluteFill style={{zIndex:10,
      transform:'translate3d(-680px,-150px,0) scale(1)',
      transformOrigin:'50% 50%',opacity:clamp(showPhone)}}>
      <Shot02PressurePhone frame={frame+4800} reveal={1}
        credential={.22} ui={0}
        emailValue="user@example.com" passwordDots="••••••••"
        emailFocus={0} passwordFocus={0} localUi={0}
        press={0} pressStartFrame={Number.POSITIVE_INFINITY}
        waiting={0} spinner={0} pressure={.74}
        realism={1} heroPush={0}/>
    </AbsoluteFill>
    {showLoginBadge>0&&<div style={{position:'absolute',left:1157,
      top:215,width:338,height:79,zIndex:23,
      ...box('#68E5FF','rgba(30,146,215,.14)'),
      opacity:clamp(showLoginBadge),padding:'10px 17px',
      fontFamily:AT_FONT,boxSizing:'border-box'}}>
      <div style={{fontSize:18,fontWeight:870,color:WHITE}}>SAME ACTIVE LOGIN</div>
      {showRetryAttempts>.03&&<div style={{
        display:'flex',gap:24,marginTop:11,
        fontSize:15,fontWeight:850,opacity:clamp(showRetryAttempts)}}>
        <span style={{color:MINT}}>ATTEMPT 1</span>
        <span style={{color:CYAN}}>ATTEMPT 2</span>
      </div>}
    </div>}
  </AbsoluteFill>;
};
