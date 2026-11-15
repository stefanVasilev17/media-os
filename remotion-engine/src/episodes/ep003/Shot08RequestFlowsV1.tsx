import React from 'react';
import {
  SHOT02_AUTH_REPLICA_PORTS,SHOT02_AUTH_CARD_LEFT,SHOT02_AUTH_CARD_RIGHT,
  SHOT02_DATABASE_ENTRY,SHOT02_BALANCER_EXIT,
  SHOT02_LOGIN_PARTICLE,shot02CubicPoint,
  SHOT02_PHONE_PIPE,SHOT02_GATEWAY_ENTRY,SHOT02_GATEWAY_EXIT,SHOT02_BALANCER_ENTRY,
} from '../ep002/Shot02PressureVisuals';
import {shot04ReplicaPhase} from '../ep002/Shot04VisualContract';

const CYAN='#68E5FF',MINT='#6FECD4',AMBER='#F5A55A',RED='#EF715B';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const phase=(frame:number,speed:number,offset:number)=>{
  const value=frame*speed+offset;
  return ((value%1)+1)%1;
};
const edge=(t:number)=>clamp(Math.min(t,1-t)*11);

export type Shot08RequestFlowsProps={
  frame:number;
  retryLevel?:number;
  jitterLevel?:number;
  visibility?:number;
  admissionLevel?:number;
  breakerLevel?:number;
  probeLevel?:number;
  legacyDatabaseFlowOpacity?:number;
};

/**
 * Same original SHOT02–04 three-replica coordinates, no extra Auths and no
 * imaginary database egress. Normal login traffic remains moving; only
 * amplification by repeated safe lookups is reduced when the SHOT08
 * shared retry-budget and staggered backoff take effect.
 */
export const Shot08RequestFlows:React.FC<Shot08RequestFlowsProps>=({
  frame,retryLevel=1,jitterLevel=0,visibility=1,
  admissionLevel=1,breakerLevel=0,probeLevel=0,legacyDatabaseFlowOpacity=1,
})=>{
  const retry=clamp(retryLevel),jitter=clamp(jitterLevel),visible=clamp(visibility);
  const legacy=clamp(legacyDatabaseFlowOpacity);
  const allowed=clamp(admissionLevel)*(1-clamp(breakerLevel))
    +clamp(probeLevel)*clamp(breakerLevel)*.12;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    aria-label="Animated incoming login requests through the gateway, load balancer, three Auth instances and one shared User Database"
    style={{position:'absolute',inset:0,zIndex:4,pointerEvents:'none',overflow:'visible',
      opacity:visible}}>
    <path d="M485 532 L521 532 M779 532 L804 532"
      stroke={CYAN} strokeWidth="3.6" opacity=".7" strokeLinecap="round" fill="none"/>
    {[0,1,2].map(packet=>{
      const a=phase(frame,.016,packet/3);
      const b=phase(frame,.019,packet/3+.18);
      const left=SHOT02_PHONE_PIPE.x+
        (SHOT02_GATEWAY_ENTRY.x-SHOT02_PHONE_PIPE.x)*a;
      const right=SHOT02_GATEWAY_EXIT.x+
        (SHOT02_BALANCER_ENTRY.x-SHOT02_GATEWAY_EXIT.x)*b;
      return <g key={packet}>
        <circle cx={left} cy="532" r={SHOT02_LOGIN_PARTICLE.radius*.6}
          fill={MINT} opacity={edge(a)}
          style={{filter:'drop-shadow(0 0 8px rgba(115,255,208,.8))'}}/>
        <circle cx={right} cy="532" r={SHOT02_LOGIN_PARTICLE.radius*.6}
          fill={CYAN} opacity={edge(b)}
          style={{filter:'drop-shadow(0 0 8px rgba(104,229,255,.85))'}}/>
      </g>;
    })}
    {SHOT02_AUTH_REPLICA_PORTS.map((replica,i)=>{
      const entry=SHOT02_BALANCER_EXIT;
      const authEntry={x:SHOT02_AUTH_CARD_LEFT,y:replica.y};
      const authExit={x:SHOT02_AUTH_CARD_RIGHT,y:replica.y};
      const controlIn1={x:1090,y:entry.y},controlIn2={x:1137,y:replica.y};
      const controlOut1={x:1505,y:replica.y},controlOut2={x:1540,y:SHOT02_DATABASE_ENTRY.y};
      const incoming='M'+entry.x+' '+entry.y+' C'+controlIn1.x+' '+controlIn1.y+' '+
        controlIn2.x+' '+controlIn2.y+' '+authEntry.x+' '+authEntry.y;
      const dbLookup='M'+authExit.x+' '+authExit.y+' C'+controlOut1.x+' '+controlOut1.y+' '+
        controlOut2.x+' '+controlOut2.y+' '+SHOT02_DATABASE_ENTRY.x+' '+
        SHOT02_DATABASE_ENTRY.y;
      const phaseShift=i*jitter*.19;
      return <g key={replica.id}>
        <path d={incoming} fill="none" stroke="#286B85" strokeWidth="8" opacity=".4"/>
        <path d={incoming} fill="none" stroke={CYAN} strokeWidth="3.8" opacity=".81"/>
        <path d={dbLookup} fill="none" stroke="#82454B" strokeWidth="7" opacity={.31*legacy}/>
        <path d={dbLookup} fill="none" stroke={AMBER} strokeWidth="3.3" opacity={.72*legacy}/>
        {Array.from({length:3},(_,packet)=>{
          const t=shot04ReplicaPhase(frame+37,i,packet);
          const point=shot02CubicPoint(t,entry,controlIn1,controlIn2,authEntry);
          return <circle key={'in'+packet} cx={point.x} cy={point.y}
            r={SHOT02_LOGIN_PARTICLE.radius*.83}
            fill={SHOT02_LOGIN_PARTICLE.fill} opacity={edge(t)*.9}
            style={{filter:SHOT02_LOGIN_PARTICLE.glow}}/>;
        })}
        {Array.from({length:2},(_,packet)=>{
          const t=phase(frame,.011,(packet/2)+(i*.25)+phaseShift);
          const point=shot02CubicPoint(t,authExit,controlOut1,controlOut2,SHOT02_DATABASE_ENTRY);
          return <circle key={'normal'+packet} cx={point.x} cy={point.y}
            r={SHOT02_LOGIN_PARTICLE.radius*.68}
            fill={MINT} opacity={edge(t)*.88*allowed*legacy}
            style={{filter:'drop-shadow(0 0 8px rgba(112,236,212,.75))'}}/>;
        })}
        {Array.from({length:3},(_,packet)=>{
          const t=phase(frame,.018,(packet/3)+(i*.18)+phaseShift);
          const point=shot02CubicPoint(t,authExit,controlOut1,controlOut2,SHOT02_DATABASE_ENTRY);
          return <circle key={'retry'+packet} cx={point.x} cy={point.y}
            r={SHOT02_LOGIN_PARTICLE.radius*.60}
            fill={RED} opacity={edge(t)*retry*.9*allowed*legacy}
            style={{filter:'drop-shadow(0 0 8px rgba(239,113,91,.68))'}}/>;
        })}
      </g>;
    })}
  </svg>;
};
