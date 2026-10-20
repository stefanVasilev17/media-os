import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props = {
  durationInFrames: number;
  anchors?: Record<string,number>;
  clipStarts?: number[];
};

const FPS = 30;
const COLOR = {
  white:'#F2F7FF', muted:'#9DB6CE', line:'#91B0D2', violet:'#B7A2FF',
  blue:'#88C6FF', green:'#58EAC0', amber:'#F5BC76', red:'#FF8598',
};
const startsDefault=[0,13,26,38,48,60,72];
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const motion=(f:number,start:number,end:number)=>interpolate(
  f,[start,Math.max(start+1,end)],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)}
);
const show=(f:number,start:number,end:number)=>interpolate(
  f,[start,Math.max(start+1,end)],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)}
);

const NAV=[
  {title:'Traffic Distribution',items:['Route Mode','Hash Key']},
  {title:'Health Checks',items:['Healthy','Timeout']},
  {title:'Target Choice',items:['Instance','Zone']},
] as const;
const FOCUS=[
  ['Traffic Distribution','Route Mode'],
  ['Traffic Distribution','Route Mode'],
  ['Traffic Distribution','Route Mode'],
  ['Traffic Distribution','Hash Key'],
  ['Health Checks','Timeout'],
  ['Target Choice','Instance'],
] as const;

const Navigation:React.FC<{current:number;previous:number;blend:number}>=({current,previous,blend})=>{
  const primary=FOCUS[current];
  const last=FOCUS[previous];
  const alpha=(group:string,item?:string)=>clamp(
    (last[0]===group&&(!item||last[1]===item)?1-blend:0)+
    (primary[0]===group&&(!item||primary[1]===item)?blend:0)
  );
  return <div style={{display:'flex',flexDirection:'column',gap:18}}>
    {NAV.map(group=>{
      const lit=alpha(group.title);
      return <div key={group.title} style={{
        minHeight:155,padding:'24px 21px',borderRadius:19,
        background:'rgba(12,29,52,.96)',
        border:'2px solid rgba(154,166,255,'+(.22+.55*lit)+')',
        boxShadow:'0 0 '+(22*lit)+'px rgba(120,122,240,'+(.19*lit)+')',
        opacity:.72+.28*lit,
      }}>
        <div style={{fontSize:23,fontWeight:820,color:lit>.4?COLOR.white:COLOR.muted,
          marginBottom:17}}>{group.title}</div>
        <div style={{display:'flex',gap:9}}>
          {group.items.map(item=>{
            const strength=alpha(group.title,item);
            return <div key={item} style={{
              flex:1,padding:'11px 5px',borderRadius:9,textAlign:'center',
              fontSize:17,fontWeight:770,
              border:'1px solid rgba(130,189,255,'+(.18+.49*strength)+')',
              background:'rgba(49,92,145,'+(.06+.27*strength)+')',
              color:strength>.48?COLOR.blue:COLOR.muted,
            }}>{item}</div>;
          })}
        </div>
      </div>;
    })}
  </div>;
};

const DiagnosticFlow:React.FC<{phase:number;local:number;elapsed:number}>=({phase,local,elapsed})=>{
  const healthyC=phase<4?1:1-motion(local,85,145);
  const activeChoice=phase>=5?1:0;
  const highlight=phase===2?((Math.floor(Math.max(0,local-30)/52))%3):
    phase===3?1:phase>=5?1:-1;
  const canonicalTravel=phase===5?motion(local,58,205):0;
  const lane=[123,246,369];
  const diagnostic=[];
  if(phase===1){
    diagnostic.push({lane:0,progress:motion(local,35,112),key:'first'});
    diagnostic.push({lane:1,progress:motion(local,115,194),key:'second'});
    diagnostic.push({lane:0,progress:motion(local,205,290),key:'third'});
  }else if(phase===2){
    for(let i=0;i<3;i++) diagnostic.push({
      lane:i,progress:motion(local,26+i*73,95+i*73),key:'turn-'+i,
    });
  }else if(phase===3){
    diagnostic.push({lane:1,progress:motion(local,31,116),key:'matching-1'});
    diagnostic.push({lane:1,progress:motion(local,146,225),key:'matching-2'});
  }
  const status=phase===4?'HEALTH CHECKS':phase===5?'TARGET CHOICE':
    phase===3?'HASH KEY':phase===2?'ROUTE MODE':
    phase===1?'TRAFFIC DISTRIBUTION':'THREE AVAILABLE INSTANCES';
  return <div style={{width:'100%',height:'100%',position:'relative',fontFamily:AT_FONT}}>
    <div style={{fontSize:33,fontWeight:850,letterSpacing:'-.015em',color:COLOR.white,
      paddingBottom:15}}>{status}</div>
    {phase===0&&<div style={{fontSize:25,fontWeight:700,color:COLOR.muted,
      paddingTop:4}}>Which instance should receive this login?</div>}
    {phase===2&&<div style={{fontSize:25,fontWeight:760,color:COLOR.blue,
      paddingTop:3}}>Round Robin</div>}
    {phase===3&&<div style={{display:'flex',gap:18,paddingTop:3}}>
      <div style={{fontSize:25,fontWeight:780,color:COLOR.blue}}>Key: client-42</div>
      <div style={{fontSize:24,fontWeight:680,color:COLOR.muted}}>Same key → Instance B</div>
    </div>}
    {phase===4&&<div style={{fontSize:25,fontWeight:730,color:COLOR.muted,
      paddingTop:3}}>An unresponsive instance leaves the eligible pool.</div>}
    {phase===5&&<div style={{fontSize:27,fontWeight:800,color:COLOR.green,
      paddingTop:3}}>Healthy target → Instance B · Zone B</div>}
    <svg width="100%" height="510" viewBox="0 0 910 510"
      style={{marginTop:16,overflow:'visible',display:'block'}}>
      <defs>
        <linearGradient id="lb-source" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#162E56"/>
          <stop offset="1" stopColor="#091B36"/>
        </linearGradient>
        <linearGradient id="lb-target" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#19365B"/>
          <stop offset="1" stopColor="#0A1B33"/>
        </linearGradient>
      </defs>
      <rect x="24" y="183" width="205" height="125" rx="22" fill="url(#lb-source)"
        stroke="rgba(143,167,252,.65)" strokeWidth="2.5"/>
      <text x="126" y="237" textAnchor="middle" fill={COLOR.white}
        fontFamily={AT_FONT} fontSize="26" fontWeight="850">LOAD</text>
      <text x="126" y="270" textAnchor="middle" fill={COLOR.white}
        fontFamily={AT_FONT} fontSize="26" fontWeight="850">BALANCER</text>
      <circle cx="247" cy="245" r="9" fill={COLOR.violet}
        style={{filter:'drop-shadow(0 0 8px rgba(183,162,255,.45))'}}/>
      {lane.map((y,index)=>{
        const targetHealth=index===2?healthyC:1;
        const isSelected=index===1&&activeChoice===1;
        const strong=phase===2&&index===highlight||
          phase===3&&index===1||
          phase===5&&index===1;
        return <g key={index}>
          <path d={'M 256 245 C 382 245 406 '+y+' 544 '+y+' H 625'}
            fill="none"
            stroke={isSelected?COLOR.green:strong?COLOR.blue:'rgba(101,142,195,.47)'}
            strokeWidth={strong||isSelected?4.4:2.5}
            opacity={index===2?.22+.78*targetHealth:.90}/>
          <rect x="643" y={y-51} width="244" height="102" rx="18"
            fill="url(#lb-target)"
            stroke={isSelected?COLOR.green:index===2&&phase>=4?COLOR.amber:'rgba(139,168,222,.52)'}
            strokeWidth={isSelected?3.5:2}
            opacity={index===2?.38+.62*targetHealth:1}/>
          <rect x="661" y={y-35} width="6" height="70" rx="3"
            fill={isSelected?COLOR.green:index===2&&phase>=4?COLOR.amber:COLOR.blue}
            opacity={.36+.64*(isSelected?1:targetHealth)}/>
          <text x="775" y={y-9} textAnchor="middle" fill={COLOR.white}
            fontFamily={AT_FONT} fontSize="25" fontWeight="840">
            {'INSTANCE '+String.fromCharCode(65+index)}
          </text>
          <text x="775" y={y+24} textAnchor="middle"
            fill={index===2&&phase>=4?COLOR.amber:
              isSelected?COLOR.green:COLOR.muted}
            fontFamily={AT_FONT} fontSize="21" fontWeight="760">
            {index===2&&phase>=4?(targetHealth<.2?'TIMEOUT':'CHECKING'):
              isSelected?'ZONE B':'HEALTHY'}
          </text>
          <circle cx="625" cy={y} r={isSelected?9:5.5}
            fill={isSelected?COLOR.green:COLOR.blue}
            opacity={index===2?.2+.8*targetHealth:.82}/>
        </g>;
      })}
      {diagnostic.map(sample=>{
        const p=clamp(sample.progress);
        const y=lane[sample.lane];
        const x=256+380*p;
        return <g key={sample.key} opacity={show(p,0,.07)*(1-motion(p,.94,1))}>
          <circle cx={x} cy={245+(y-245)*motion(p,.10,.9)} r={12}
            fill={COLOR.blue} stroke="#D4EAFF" strokeWidth={2}
            style={{filter:'drop-shadow(0 0 10px rgba(136,198,255,.40))'}}/>
        </g>;
      })}
      <circle cx={256+380*canonicalTravel} cy="245" r={14}
        fill={COLOR.green} stroke="#C0FFEA" strokeWidth={2}
        opacity={phase>=5?1:1}
        style={{filter:'drop-shadow(0 0 13px rgba(88,234,192,.50))'}}/>
      {phase>=5&&<path d="M 256 245 H 625" fill="none"
        stroke={COLOR.green} strokeWidth={4.5}
        pathLength={1} strokeDasharray={String(canonicalTravel)+' 1'}
        opacity=".90"/>}
      {phase===4&&<g opacity={show(local,58,95)}>
        <circle cx="625" cy={lane[2]} r="18" fill="none"
          stroke={COLOR.amber} strokeWidth={3} opacity={1-healthyC}/>
        <path d="M 615 360 L 635 380 M 635 360 L 615 380"
          stroke={COLOR.amber} strokeWidth={4}
          strokeLinecap="round" opacity={1-healthyC}/>
      </g>}
    </svg>
    {phase===3&&<div style={{fontSize:27,color:COLOR.white,
      fontWeight:790,paddingLeft:20,marginTop:-8}}>Two diagnostic requests. One configured destination.</div>}
    {phase===4&&<div style={{fontSize:27,color:COLOR.amber,
      fontWeight:780,paddingLeft:20,marginTop:-8,opacity:show(local,100,150)}}>
      Instance C removed from eligible routes
    </div>}
    {phase===5&&<div style={{fontSize:27,color:COLOR.green,
      fontWeight:790,paddingLeft:20,marginTop:-8,opacity:show(local,100,170)}}>
      Login Request → Instance B
    </div>}
  </div>;
};

export const LoadBalancerYoutubePreview:React.FC<Props>=({
  durationInFrames,anchors={},clipStarts=[]
})=>{
  const frame=useCurrentFrame();
  const duration=Math.max(1,durationInFrames);
  const starts=startsDefault.map((seconds,index)=>{
    const supplied=clipStarts[index];
    return Number.isFinite(supplied)?Math.min(duration-1,supplied):Math.min(duration-1,seconds*FPS);
  });
  const phase=starts.reduce((found,start,index)=>frame>=start?index:found,0);
  const activePhase=Math.min(5,phase);
  const priorPhase=Math.max(0,activePhase-1);
  const local=Math.max(0,frame-starts[phase]);
  const previousLocal=Math.max(0,starts[activePhase]-starts[priorPhase]-1);
  const entrance=show(frame,95,150);
  const exit=phase===6?motion(frame,starts[6]+6,starts[6]+45):0;
  const panelVisible=clamp(entrance*(1-exit));
  const focusIn=phase>0&&phase<6?motion(frame,starts[phase],starts[phase]+18):1;
  const centerIn=phase>0&&phase<6?motion(frame,starts[phase]+8,starts[phase]+25):1;
  const beginningZoom=show(frame,10,110);
  const leaving=motion(frame,starts[6]+15,starts[6]+110);
  const cameraZoom=beginningZoom*(1-leaving);
  const selectedOnMap=phase===6?show(frame,starts[6]+35,starts[6]+75):0;
  const handoff=phase===6?300*motion(frame,starts[6]+83,Math.min(duration-1,starts[6]+204)):0;
  const centerTitle=phase===6?5:activePhase;
  return <div style={{position:'absolute',inset:0,overflow:'hidden',
    background:'#050E1D',fontFamily:AT_FONT,color:COLOR.white}}>
    <div style={{position:'absolute',inset:0,opacity:1-.22*panelVisible}}>
      <NetworkTransitYoutubePreview showGuides={false}
        frameOverride={SHOT04_DURATION_FRAMES-1}
        gatewayHandoff={315}
        balancerCinema={cameraZoom}
        balancerActive={1-leaving*.78}
        balancerIntroArrival={show(frame,4,39)}
        balancerIntroSelected={selectedOnMap}
        balancerHandoff={handoff}
        authActive={phase===6?motion(frame,starts[6]+120,Math.min(duration-1,starts[6]+211)):0}
        networkActiveMultiplier={0}/>
    </div>
    <div style={{position:'absolute',inset:0,
      background:'radial-gradient(ellipse at 51% 50%,rgba(4,13,31,.98),rgba(1,7,18,.99))',
      opacity:panelVisible*.93,pointerEvents:'none'}}/>
    <div style={{position:'absolute',left:236,top:119,width:1448,height:838,zIndex:12,
      border:'3px solid rgba(134,133,248,.80)',borderRadius:30,overflow:'hidden',
      background:'linear-gradient(135deg,rgba(11,30,59,.985),rgba(6,15,34,.988))',
      boxShadow:'0 0 85px rgba(122,114,245,.24),0 30px 130px rgba(0,0,0,.65)',
      opacity:panelVisible,transformOrigin:'center center',
      transform:'translateY('+((1-entrance)*56)+'px) scale('+(0.88+.12*entrance)+')',
      pointerEvents:'none'}}>
      <div style={{position:'absolute',left:47,top:35,fontSize:49,
        fontWeight:880,color:COLOR.white}}>Load Balancer</div>
      <div style={{position:'absolute',left:43,right:43,top:139,bottom:48,
        display:'grid',gridTemplateColumns:'389px 1fr',columnGap:28}}>
        <Navigation current={activePhase} previous={priorPhase} blend={focusIn}/>
        <div style={{borderRadius:21,border:'1px solid rgba(110,153,215,.38)',
          background:'linear-gradient(155deg,rgba(13,34,61,.96),rgba(7,19,39,.98))',
          padding:'25px 26px',overflow:'hidden',position:'relative'}}>
          {phase>=2&&phase<=5&&centerIn<1&&<div style={{
            position:'absolute',inset:'25px 26px',opacity:1-centerIn,pointerEvents:'none'}}>
            <DiagnosticFlow phase={priorPhase} local={previousLocal} elapsed={frame}/>
          </div>}
          <div style={{opacity:centerIn,width:'100%',height:'100%'}}>
            <DiagnosticFlow phase={centerTitle}
              local={phase===6?Math.max(0,starts[6]-starts[5]-1):local}
              elapsed={frame}/>
          </div>
        </div>
      </div>
    </div>
  </div>;
};
