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
      reveal={1} quiet={.045} active={.08+.17*reroute}
      sections={[]}
      balancerIntro={{
        frame:frame*.40,arrival:.82,selected:reroute,
        handoff:.08*reroute,unhealthy:reroute*.24,flow:.01+.095*reroute,
      }}/>
    <ATPrimaryNode title={serviceTitle}
      left={nodes.auth.x} top={nodes.auth.y}
      width={nodes.auth.width} height={nodes.auth.height}
      compact reveal={1} active={spreading*.22} quiet={.04}>
      <div style={{display:'flex',flexDirection:'column',gap:0}}>
        {[0,1,2].map((i)=>{
          const pressure=clamp(i===0?reroute:spreading*(.74+.10*i));
          const signal=pressure>.32?AMBER:MINT;
          const state=i===0&&reroute>.55?'DEGRADED':i>0&&spreading>.4?'RISING LOAD':'AVAILABLE';
          const activity=clamp(.20+pressure*.58);
          return <div key={i} style={{
            height:67,display:'flex',alignItems:'center',gap:11,
            borderBottom:i<2?'1px solid rgba(117,164,210,.20)':'none',
            padding:'0 4px',boxSizing:'border-box',
          }}>
            <svg viewBox="0 0 36 36" width={36} height={36}
              style={{flexShrink:0,overflow:'visible'}}>
              <rect x={2} y={2} width={32} height={32} rx={8}
                fill="#081E35" stroke="rgba(107,163,216,.65)" strokeWidth={1.35}/>
              {[10,18,26].map(y=><g key={y}>
                <path d={'M 9 '+y+' H 27'} stroke="#416F97"
                  strokeWidth={2} strokeLinecap="round"/>
                <circle cx={26} cy={y} r={2.2} fill={signal}
                  opacity={.45+.40*pulse}/>
              </g>)}
              <path d="M 8 5 H 28" stroke="rgba(178,218,247,.18)"
                strokeWidth={1.2} strokeLinecap="round"/>
            </svg>
            <div style={{display:'flex',flexDirection:'column',
              justifyContent:'center',gap:5,flex:1,minWidth:0}}>
              <div style={{fontSize:20,fontWeight:765,letterSpacing:'-.015em',
                color:'#F7FAFF',whiteSpace:'nowrap'}}>
                {instanceLabel} 0{i+1}
              </div>
              <div style={{fontSize:18,fontWeight:660,letterSpacing:'-.012em',
                color:pressure>.32?'#F3BF93':'#B6D4EB',whiteSpace:'nowrap'}}>
                {state}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:3,
              width:34,height:21,flexShrink:0}}>
              {[0,1,2,3].map(j=><div key={j} style={{
                width:6,height:8+j*4,borderRadius:3,
                background:j/4<activity ? signal : '#31516D',
                boxShadow:j/4<activity ? '0 0 7px '+signal : 'none',
                opacity:j/4<activity ? .7+.3*pulse : .46,
              }}/>)}
            </div>
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
