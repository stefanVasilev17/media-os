import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AT_FONT} from './ATVisualPrimitives';
import {SHOT02_NODES} from '../../episodes/ep002/Shot02PremiumLayout';
import {SHOT02_AUTH_REPLICA_PORTS} from '../../episodes/ep002/Shot02PressureVisuals';

const WHITE='#F5FCFF';
const SOFT='#B5D2E6';
const CYAN='#68E5FF';
const MINT='#6FECD4';
const AMBER='#F5A55A';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));

const node=(name:keyof typeof SHOT02_NODES)=>{
  const n=SHOT02_NODES[name];
  return {
    position:'absolute' as const,
    left:n.x-n.width/2,
    top:n.y,
    width:n.width,
    height:n.height,
    boxSizing:'border-box' as const
  };
};
const box=(border:string,glow:string)=>({
  border:'2px solid '+border,
  borderRadius:19,
  background:'linear-gradient(145deg,rgba(8,32,53,.99),rgba(3,15,30,.998))',
  boxShadow:'0 0 24px '+glow+',inset 0 1px 0 rgba(255,255,255,.09)',
  boxSizing:'border-box' as const
});

export type ATStableServiceNodesProps={
  frame:number;
  blocked:number;
  failover:number;
  spillover:number;
  serviceTitle:string;
  requestLabel:string;
  instanceLabel:string;
  showOtherServices:number;
};

export const ATStableServiceNodes:React.FC<ATStableServiceNodesProps>=({
  frame,blocked,failover,spillover,serviceTitle,requestLabel,instanceLabel,showOtherServices
})=>{
  const reroute=clamp(failover);
  const spreading=clamp(spillover);
  const waiting=clamp(blocked);
  const pulse=.5+.5*Math.sin(frame*.034);
  const rows=[1,2,3];
  return <AbsoluteFill style={{pointerEvents:'none',fontFamily:AT_FONT}}>
    <div style={{
      ...node('gateway'),
      ...box('#5DCEE8','rgba(42,176,223,.21)'),
      zIndex:9,padding:'27px 20px'
    }}>
      <b style={{color:WHITE,fontSize:24}}>API Gateway</b>
      <div style={{marginTop:24,color:MINT,fontSize:17,fontWeight:800}}>● ONLINE</div>
      <div style={{borderTop:'1px solid #376A89',marginTop:30,paddingTop:19,
        fontSize:17,color:SOFT}}>{requestLabel}</div>
      <div style={{marginTop:11,fontSize:17,fontWeight:830,color:WHITE}}>
        {waiting>.6?'Request waiting':'Accepting requests'}
      </div>
    </div>
    <div style={{
      ...node('balancer'),
      ...box('#5DCEE8','rgba(42,176,223,.21)'),
      zIndex:9,padding:'26px 18px'
    }}>
      <b style={{color:WHITE,fontSize:23}}>Load Balancer</b>
      <div style={{marginTop:21,color:reroute>.4?AMBER:MINT,
        fontSize:16,fontWeight:810}}>
        ● {reroute>.4?'REROUTING':'ROUTING'}
      </div>
      <div style={{borderTop:'1px solid #376A89',marginTop:28,paddingTop:15,
        fontSize:19,fontWeight:860,color:WHITE}}>
        3 service instances
      </div>
      <div style={{display:'flex',gap:6,marginTop:19}}>
        {rows.map((row)=><div key={row} style={{
          width:57,height:12,borderRadius:7,
          background:reroute>.4&&row===1?AMBER:CYAN,
          boxShadow:'0 0 10px rgba(75,215,255,.29)'
        }}/>)}
      </div>
    </div>
    <div style={{
      ...node('auth'),
      ...box('#9184FF','rgba(125,111,255,.29)'),
      zIndex:9,
      background:'linear-gradient(150deg,rgba(11,22,50,.995),rgba(4,13,34,.998))'
    }}>
      <div style={{height:65,display:'flex',alignItems:'center',
        justifyContent:'center',color:WHITE,fontSize:27,fontWeight:870}}>
        {serviceTitle}
      </div>
      {rows.map((n,i)=>{
        const y=SHOT02_AUTH_REPLICA_PORTS[i].y-SHOT02_NODES.auth.y-35;
        const affected=clamp(i===0?reroute:spreading*(.70+.22*Math.sin(frame*.03+i)));
        const accent=affected>.28?AMBER:'#498CB7';
        return <div key={n} style={{
          position:'absolute',left:40,top:y,width:268,height:71,
          boxSizing:'border-box',display:'flex',flexDirection:'column',
          justifyContent:'center',padding:'8px 11px',
          border:'2px solid '+accent,borderRadius:11,
          background:'linear-gradient(140deg,rgba(10,47,71,.99),rgba(5,26,48,.99))',
          boxShadow:affected>.28?
            '0 0 '+(12+10*pulse)+'px rgba(243,152,92,.29)':
            '0 0 9px rgba(55,202,252,.16)'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{height:10,width:10,borderRadius:3,
              background:affected>.28?AMBER:MINT,
              boxShadow:affected>.28?'0 0 11px '+AMBER:'0 0 8px '+MINT}}/>
            <span style={{fontSize:18,fontWeight:850,color:WHITE,
              whiteSpace:'nowrap'}}>{instanceLabel} 0{n}</span>
          </div>
          <div style={{fontSize:16,fontWeight:800,marginTop:6,
            color:SOFT,letterSpacing:'.02em'}}>
            {i===0&&reroute>.4?'DEGRADED':i>0&&spreading>.3?'RISING LOAD':'AVAILABLE CAPACITY'}
          </div>
        </div>;
      })}
    </div>
    <div style={{
      ...node('database'),
      ...box('#39758D','rgba(42,120,162,.13)'),
      zIndex:9,
      opacity:.20+.48*clamp(showOtherServices),
      background:'linear-gradient(150deg,rgba(9,26,44,.99),rgba(11,31,47,.99))'
    }}>
      <div style={{marginTop:29,textAlign:'center',fontWeight:880,
        fontSize:25,color:WHITE}}>Other services</div>
      <svg width="96" height="92" viewBox="0 0 96 92"
        style={{display:'block',margin:'17px auto 0'}}>
        {[0,1,2].map((i)=><rect key={i} x={10+i*29} y={19+i*10}
          width={22} height={39} rx={5} fill="#0B283E"
          stroke="#5296B9" strokeWidth={2.5}/>)}
        <path d="M11 75 H86" stroke="#5296B9" strokeWidth={3}
          strokeLinecap="round"/>
      </svg>
      <div style={{margin:'5px 15px 0',fontSize:18,fontWeight:740,
        lineHeight:'24px',textAlign:'center',color:SOFT}}>
        Availability may differ
      </div>
    </div>
  </AbsoluteFill>;
};
