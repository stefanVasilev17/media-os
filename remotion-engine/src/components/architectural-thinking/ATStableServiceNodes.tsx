import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ATBackendNode,ATPrimaryNode} from './ATArchitecturePrimitives';
import {AT_FONT} from './ATVisualPrimitives';

const MINT='#6FECD4',AMBER='#F5A55A',CYAN='#68E5FF';
const clamp=(n:number)=>Math.min(1,Math.max(0,n));

export const EP004_LOCKED_EP003_NODE_BOUNDS={
  gateway:{x:650,y:410,width:258,height:250},
  balancer:{x:927,y:410,width:246,height:250},
  auth:{x:1326,y:315,width:350,height:348},
  database:{x:1697,y:368,width:252,height:280},
} as const;

export const EP004_LOCKED_EP003_REPLICA_Y=[412,498,584] as const;

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
  frame,blocked,failover,spillover,serviceTitle,requestLabel,instanceLabel,showOtherServices,
})=>{
  const waiting=clamp(blocked);
  const reroute=clamp(failover);
  const spreading=clamp(spillover);
  const pulse=.5+.5*Math.sin(frame*.035);
  const nodes=EP004_LOCKED_EP003_NODE_BOUNDS;
  return <AbsoluteFill style={{pointerEvents:'none',fontFamily:AT_FONT}}>
    <ATBackendNode title="API Gateway"
      x={nodes.gateway.x} y={nodes.gateway.y}
      width={nodes.gateway.width} height={nodes.gateway.height}
      reveal={1} quiet={.08} active={waiting*.20}
      sections={[]}
      gatewayIntro={{frame,arrival:.30,inspection:.30+.38*waiting}}/>
    <ATBackendNode title="Load Balancer"
      x={nodes.balancer.x} y={nodes.balancer.y}
      width={nodes.balancer.width} height={nodes.balancer.height}
      reveal={1} quiet={.08} active={reroute*.18}
      sections={[]}
      balancerIntro={{
        frame,arrival:.23,selected:reroute,
        handoff:reroute,unhealthy:reroute*.4,flow:.20+.36*reroute,
      }}/>
    <ATPrimaryNode title={serviceTitle}
      left={nodes.auth.x} top={nodes.auth.y}
      width={nodes.auth.width} height={nodes.auth.height}
      compact reveal={1} active={spreading*.22} quiet={.04}>
      <div style={{display:'flex',flexDirection:'column',gap:0}}>
        {[0,1,2].map((i)=>{
          const pressure=clamp(i===0?reroute:spreading*(.78+.1*Math.sin(frame*.025+i)));
          const signal=pressure>.32?AMBER:MINT;
          const state=i===0&&reroute>.55?'DEGRADED':i>0&&spreading>.4?'RISING LOAD':'AVAILABLE';
          return <div key={i} style={{
            height:65,display:'flex',alignItems:'center',gap:10,
            borderBottom:'1px solid rgba(115,160,207,.21)',
            padding:'0 2px',boxSizing:'border-box',
          }}>
            <svg viewBox="0 0 38 34" width={38} height={34}
              style={{flexShrink:0,overflow:'visible'}}>
              <rect x={2} y={3} width={34} height={28} rx={5}
                fill="#0C2340" stroke={signal} strokeWidth={2}/>
              <path d="M 9 13 H 29 M 9 20 H 24"
                stroke={signal} strokeWidth={2} strokeLinecap="round"/>
              <circle cx={29} cy={25} r={3} fill={signal}
                opacity={.55+.4*pulse}/>
            </svg>
            <div style={{display:'flex',flexDirection:'column',
              gap:4,flex:1,minWidth:0}}>
              <div style={{fontSize:20,fontWeight:760,color:'#F7FAFF',
                whiteSpace:'nowrap'}}>{instanceLabel} 0{i+1}</div>
              <div style={{fontSize:17,fontWeight:650,
                color:pressure>.32?'#F3BF93':'#A6C4DE',
                whiteSpace:'nowrap'}}>{state}</div>
            </div>
            <div style={{width:8,height:8,borderRadius:'50%',
              background:signal,boxShadow:'0 0 8px '+signal,
              opacity:.6+.3*pulse}}/>
          </div>;
        })}
      </div>
    </ATPrimaryNode>
    <ATPrimaryNode title="Other services"
      left={nodes.database.x} top={nodes.database.y}
      width={nodes.database.width} height={nodes.database.height}
      compact reveal={.28+.58*clamp(showOtherServices)}
      quiet={.8} active={0}>
      <svg viewBox="0 0 100 82" width="100%" height={96}
        style={{display:'block',margin:'2px auto'}}>
        {[0,1,2].map((i)=><rect key={i}
          x={10+i*29} y={14+i*9} width={22} height={38}
          rx={6} stroke="#5590BB" strokeWidth={2} fill="#0B253F"/>)}
        <path d="M 12 71 H 90" stroke="#4B8AAE"
          strokeWidth={3} strokeLinecap="round"/>
      </svg>
      <div style={{color:'#B5D2E6',fontSize:17,textAlign:'center',
        lineHeight:'23px'}}>Availability varies</div>
    </ATPrimaryNode>
  </AbsoluteFill>;
};
