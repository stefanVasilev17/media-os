import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props={
  durationInFrames:number;
  anchors:Record<string,number>;
  clipStarts:number[];
  voiceEndFrame?:number;
  statusFrames?:Record<string,number>;
};

const FPS=30;
const C={
  bright:'#EFF6FF',muted:'#A3BDD6',green:'#58EAC0',
  purple:'#B7A2FF',amber:'#FFD28B',red:'#FF8EA0',blue:'#86C8F7',
};
const font:React.CSSProperties={fontFamily:AT_FONT,color:C.bright};
const mono:React.CSSProperties={fontFamily:'Consolas,Menlo,monospace',fontWeight:730};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const move=(frame:number,start:number,end:number)=>interpolate(frame,[start,Math.max(start+1,end)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});
const enter=(frame:number,start:number,end:number)=>interpolate(frame,[start,Math.max(start+1,end)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic),
});
const timing=(seconds:Record<string,number>,name:string)=>Number.isFinite(seconds[name])?seconds[name]*FPS:undefined;
const FIRST=38;
const DEFAULT_STARTS=[0,17,38,58,81,101,119];
const NATIVE_PACKET_FINAL_X=1510;
const NATIVE_GATEWAY_ENTRY_X=1660-270/2;
const NATIVE_BALANCER_ENTRY_X=1960-270/2;
const FOCUS=[
  ['Routing','Path'],['Routing','Path'],['Routing','Method'],
  ['Rate Limit','Burst'],['Request Filter','WAF'],['Request Filter','Schema'],
  ['Routing','Path'],
] as const;

const Tile:React.FC<{label:string;value:string;mode?:'active'|'dim'|'good'|'error'|'warning';small?:boolean}>=({
  label,value,mode='dim',small=false
})=>{
  const active=mode!=='dim';
  const color=mode==='error'?C.red:mode==='warning'?C.amber:mode==='good'?C.green:active?C.blue:C.muted;
  return <div style={{borderRadius:14,border:'1px solid '+(active?color+'99':'rgba(89,139,180,.22)'),
    background:active?'rgba(26,62,92,.76)':'rgba(8,26,45,.74)',
    boxShadow:active?'0 0 23px '+color+'18':'none',padding:small?'12px 14px':'18px 20px',
    display:'flex',alignItems:'center',justifyContent:'space-between',gap:15,minHeight:small?59:74}}>
    <span style={{color:active?'#D7E5F4':C.muted,fontSize:small?19:23,fontWeight:670}}>{label}</span>
    <span style={{color,fontSize:small?20:25,...mono,textAlign:'right'}}>{value}</span>
  </div>;
};
const Module:React.FC<{name:string;items:string[];active:string;selected:string}>=({
  name,items,active,selected
})=>{
  const highlighted=name===active;
  return <div style={{borderRadius:20,border:'2px solid '+(highlighted?'rgba(143,193,254,.75)':'rgba(80,121,171,.20)'),
    background:highlighted?'linear-gradient(145deg,rgba(33,64,93,.88),rgba(10,31,56,.96))':'rgba(7,24,44,.71)',
    boxShadow:highlighted?'0 0 25px rgba(110,165,255,.14)':'none',
    padding:'23px 23px 21px',minHeight:150,opacity:highlighted?1:.66}}>
    <div style={{fontSize:23,fontWeight:810,color:highlighted?C.bright:C.muted,
      marginBottom:18,letterSpacing:'.015em'}}>{name}</div>
    <div style={{display:'flex',gap:11}}>
      {items.map(item=><div key={item} style={{flex:1,borderRadius:9,
        background:highlighted&&item===selected?'rgba(37,116,113,.36)':'rgba(4,19,35,.52)',
        border:'1px solid '+(highlighted&&item===selected?C.green+'88':'rgba(86,131,166,.27)'),
        padding:'11px 4px',fontSize:18,textAlign:'center',fontWeight:750,
        color:highlighted&&item===selected?C.green:C.muted}}>{item}</div>)}
    </div>
  </div>;
};

const Status:React.FC<{code:string;caption:string;visibility:number;allowed?:boolean}>=({
  code,caption,visibility,allowed=false
})=>{
  const color=allowed?C.green:C.red;
  return <div style={{marginTop:0,borderRadius:16,border:'2px solid '+color+'C0',
    background:allowed?'rgba(9,65,57,.68)':'rgba(69,24,43,.80)',height:90,boxSizing:'border-box',
    padding:'14px 23px',opacity:visibility,
    transform:'translateY('+((1-visibility)*11)+'px)',
    display:'flex',alignItems:'center',gap:24}}>
      <span style={{color,fontSize:42,fontWeight:900,...mono}}>{code}</span>
      <span style={{color:C.bright,fontSize:23,fontWeight:760}}>{caption}</span>
  </div>;
};

const Bullet:React.FC<{children:React.ReactNode;soft?:boolean}>=({children,soft=false})=>(
  <div style={{fontSize:23,color:soft?C.muted:C.bright,lineHeight:1.5}}>{children}</div>
);


const GatewayArrivalVisual:React.FC<{frame:number;segmentFrames:number}>=({frame,segmentFrames})=>{
  const travel=move(frame,Math.max(100,segmentFrames*.16),Math.max(165,segmentFrames*.43));
  const gatewayReady=enter(frame,Math.max(165,segmentFrames*.43),Math.max(195,segmentFrames*.53));
  const inspectionCue=enter(frame,Math.max(205,segmentFrames*.57),Math.max(260,segmentFrames*.76));
  const pulse=.62+.38*Math.sin(Math.max(0,frame-155)*.075)**2;
  const packetX=354+363*travel;
  const arrival=enter(frame,55,96);
  return <div style={{display:'flex',flexDirection:'column',gap:15,minHeight:0,height:'100%'}}>
    <div style={{fontSize:19,letterSpacing:'.10em',fontWeight:790,color:C.purple,opacity:arrival}}>
      ONE REQUEST · THE NEXT BOUNDARY IN THE SYSTEM
    </div>
    <svg viewBox="0 0 1100 300" width="100%" height="315" preserveAspectRatio="xMidYMid meet"
      style={{display:'block',overflow:'visible',flex:'0 0 auto'}}>
      <defs>
        <linearGradient id="shot05-intro-gateway" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#173C64"/>
          <stop offset="100%" stopColor="#101A40"/>
        </linearGradient>
        <linearGradient id="shot05-intro-flow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#218F83"/>
          <stop offset="100%" stopColor="#58EAC0"/>
        </linearGradient>
      </defs>
      <rect x="12" y="66" width="324" height="170" rx="19" fill="rgba(8,52,51,.83)"
        stroke="rgba(88,234,192,.68)" strokeWidth="2"/>
      <text x="174" y="123" fontSize="28" fontWeight="850" textAnchor="middle"
        fontFamily={AT_FONT} fill={C.green}>LOGIN REQUEST</text>
      <text x="174" y="161" fontSize="22" textAnchor="middle" fontFamily={AT_FONT}
        fill={C.muted}>Travelling from the network</text>
      <rect x="48" y="184" width="252" height="14" rx="7" fill="rgba(24,121,105,.23)"/>
      <rect x="48" y="184" width={252*travel} height="14" rx="7" fill="rgba(88,234,192,.75)"/>
      <path d="M 341 150 H 719" stroke="rgba(102,159,187,.40)"
        strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M 341 150 H 719" stroke="rgba(88,234,192,.9)"
        strokeWidth="5" strokeLinecap="round" fill="none" pathLength="1"
        strokeDasharray={travel+' 1'} style={{filter:'drop-shadow(0 0 8px rgba(88,234,192,.37))'}}/>
      <circle cx={packetX} cy="150" r={10+3*Math.sin(frame*.18)**2}
        opacity={arrival} fill={C.green}
        style={{filter:'drop-shadow(0 0 12px rgba(88,234,192,.88))'}}/>
      <rect x="730" y="34" width="354" height="234" rx="24"
        fill="url(#shot05-intro-gateway)"
        stroke={gatewayReady>.01?C.purple:'#42668C'}
        strokeWidth={2+gatewayReady*1.5}
        style={{filter:gatewayReady>.01?'drop-shadow(0 0 '+(7+13*pulse*gatewayReady)+'px rgba(183,162,255,.48))':'none'}}/>
      <rect x="748" y="54" width="318" height="194" rx="15"
        fill="rgba(6,19,39,.60)" stroke="rgba(145,168,209,.17)"/>
      <rect x="752" y="58" width="6" height="186" rx="3"
        fill={C.green} opacity={.2+.75*gatewayReady*pulse}/>
      <text x="908" y="108" fontSize="36" fontWeight="850" textAnchor="middle"
        fontFamily={AT_FONT} fill={C.bright}>API GATEWAY</text>
      <text x="908" y="148" fontSize="22" fontWeight="720" textAnchor="middle"
        fontFamily={AT_FONT} fill={C.purple}>First server-side checkpoint</text>
      <rect x="784" y="172" width="248" height="49" rx="11"
        fill="rgba(25,50,73,.86)" stroke="rgba(152,181,223,.40)"/>
      <text x="908" y="203" fontSize="21" fontWeight="830" textAnchor="middle"
        fontFamily={AT_FONT} fill={gatewayReady>.1?C.green:C.amber}>
        {gatewayReady>.95?'REQUEST RECEIVED':'AWAITING REQUEST'}
      </text>
      <rect x="786" y="171" width={244*inspectionCue} height="3" rx="2"
        fill={C.purple} opacity={.7*inspectionCue}/>
      <text x="908" y="294" fontSize="17" fontWeight="790" textAnchor="middle"
        fontFamily={AT_FONT} fill={C.muted} opacity={inspectionCue}>
        INSPECTION IS NEXT · NO AUTHENTICATION YET
      </text>
    </svg>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,opacity:inspectionCue}}>
      <Tile label="Gateway boundary" value="REACHED" mode="good"/>
      <Tile label="Auth Service" value="NOT REACHED" mode="warning"/>
    </div>
    <div style={{fontSize:21,lineHeight:1.4,fontWeight:720,color:C.muted,opacity:inspectionCue}}>
      The request must pass gateway checks before it can continue toward authentication.
    </div>
  </div>;
};

const CaseStudy:React.FC<{phase:number;local:number;segmentFrames:number;statusAt:number}>=({
  phase,local,segmentFrames,statusAt
})=>{
  const show=enter(local,10,24);
  const compare=enter(local,Math.max(20,segmentFrames*.22),Math.max(34,segmentFrames*.36));
  const failure=enter(local,statusAt,statusAt+13);
  const responses:Record<number,[string,string]>={
    1:['404','Not Found · Auth Service not reached'],
    2:['405','Method Not Allowed · path exists, action is wrong'],
    3:['429','Too Many Requests · retry rejected'],
    4:['403','Forbidden · sample blocked before Auth Service'],
    5:['400','Bad Request · configured schema rejected the body'],
  };
  const response=responses[phase];
  const caseNames=['ARRIVAL','PATH / ROUTING','HTTP METHOD','RATE LIMIT','WAF FILTER','SCHEMA','SUCCESSFUL HANDOFF'];
  const subtitles=[
    'The request has reached its first server-side checkpoint',
    'Same service. A different address.',
    'Same address. A different HTTP action.',
    'A retry storm crosses a configured policy limit.',
    'A valid login can be blocked by an overbroad rule.',
    'The field name is wrong, even though the data looks valid.',
    'The original green request is allowed to continue.',
  ];
  const full:React.CSSProperties={borderRadius:17,border:'1px solid rgba(97,151,191,.30)',
    padding:22,background:'rgba(7,25,44,.70)'};
  const row=(left:string,right:string,tone:string)=>(
    <div style={{...full,display:'flex',alignItems:'center',justifyContent:'space-between',gap:15,
      fontSize:24,fontWeight:750}}>
      <span style={{color:C.muted}}>{left}</span>
      <span style={{color:tone,...mono}}>{right}</span>
    </div>
  );
  return <div style={{height:'100%',display:'flex',flexDirection:'column',gap:12,pointerEvents:'none',overflow:'hidden'}}>
    <div style={{letterSpacing:'.12em',color:C.purple,fontSize:17,fontWeight:810}}>
      {phase===0?'FIRST SERVER-SIDE CHECKPOINT':'LIVE EXAMPLE '+String(phase).padStart(2,'0')+' / 05'}
    </div>
    <div style={{fontSize:32,fontWeight:870,lineHeight:1.2,color:C.bright}}>{caseNames[phase]}</div>
    <div style={{fontSize:21,color:C.muted,marginTop:-9,lineHeight:1.35}}>{subtitles[phase]}</div>
    <div style={{height:2,background:'linear-gradient(to right,rgba(141,188,238,.48),rgba(141,188,238,0))',margin:'3px 0 0'}}/>
    <div style={{display:'flex',flexDirection:'column',gap:11,flex:1,minHeight:0,overflow:'hidden',justifyContent:'flex-start'}}>
    {phase===0&&<GatewayArrivalVisual frame={local} segmentFrames={segmentFrames}/>}
    {phase===1&&<>
      <div style={{opacity:show}}>{row('KNOWN ROUTE','POST /api/v1/login',C.green)}</div>
      <div style={{opacity:compare}}>{row('DIAGNOSTIC REQUEST','POST /api/v2/login',C.amber)}</div>
      <div style={{opacity:compare,display:'flex',gap:17,alignItems:'center',fontSize:22}}>
        <span style={{color:C.green}}>v1 configured</span>
        <span style={{color:C.muted}}>≠</span>
        <span style={{color:C.amber}}>v2 requested</span>
        <span style={{marginLeft:'auto',color:C.red,fontWeight:800}}>NO MATCHING ROUTE</span>
      </div>
    </>}
    {phase===2&&<>
      <div style={{opacity:show}}>{row('PATH','/api/v1/login  ✓',C.green)}</div>
      <div style={{opacity:compare,display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
        <Tile label="Expected" value="POST" mode="good"/>
        <Tile label="Received" value="GET" mode="error"/>
      </div>
      <div style={{opacity:compare,fontSize:22,color:C.muted}}>POST sends login details. GET requests a resource.</div>
    </>}
    {phase===3&&<>
      <div style={{opacity:show}}>{row('CONFIGURED BURST WINDOW','5 requests / 10 seconds',C.blue)}</div>
      <div style={{opacity:compare,...full,display:'flex',alignItems:'center',gap:18}}>
        {Array.from({length:6},(_,i)=>{
          const arrived=enter(local,Math.round(segmentFrames*.2)+i*10,
            Math.round(segmentFrames*.2)+i*10+10);
          const blocked=i===5;
          return <div key={i} style={{flex:1,borderRadius:14,
            border:'2px solid '+(blocked?C.red:C.green)+'99',
            color:blocked?C.red:C.green,background:'rgba(17,49,60,.79)',
            fontSize:27,fontWeight:850,textAlign:'center',padding:'17px 0',
            opacity:arrived*.94}}>{i+1}</div>;
        })}
        <span style={{fontSize:22,color:C.red,opacity:failure,fontWeight:870}}>6 / 5</span>
      </div>
      <div style={{opacity:compare,display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
        <Tile label="Burst" value="6 / 5" mode="error"/>
        <Tile label="Quota" value="43 / 100 min" mode="active"/>
      </div>
      <div style={{fontSize:17,color:C.muted,opacity:compare}}>Illustrative example policy, not a universal gateway default.</div>
    </>}
    {phase===4&&<>
      <div style={{opacity:show}}>{row('DIAGNOSTIC SAMPLE','Normal-looking login',C.green)}</div>
      <div style={{opacity:compare}}>{row('CONFIGURED WAF RULE','WAF_LOGIN_1042',C.purple)}</div>
      <div style={{opacity:compare,fontSize:22,color:C.amber,fontWeight:760}}>
        Broad rule matched a legitimate sample → FALSE POSITIVE
      </div>
      <div style={{opacity:compare,fontSize:17,color:C.muted}}>This configured example is not a universal WAF behavior.</div>
    </>}
    {phase===5&&<>
      <div style={{opacity:show,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div style={{...full,border:'1px solid '+C.green+'80'}}>
          <div style={{fontSize:18,color:C.muted,marginBottom:15}}>EXPECTED BODY</div>
          <div style={{fontSize:23,color:C.green,...mono}}>email</div>
          <div style={{fontSize:19,color:C.muted,marginTop:7}}>user@example.com</div>
          <div style={{fontSize:18,color:C.muted,marginTop:20}}>password: ••••••••</div>
        </div>
        <div style={{...full,border:'1px solid '+C.amber+'88',opacity:compare}}>
          <div style={{fontSize:18,color:C.muted,marginBottom:15}}>ACTUAL BODY</div>
          <div style={{fontSize:23,color:C.amber,...mono}}>userEmail</div>
          <div style={{fontSize:19,color:C.muted,marginTop:7}}>user@example.com</div>
          <div style={{fontSize:18,color:C.muted,marginTop:20}}>password: ••••••••</div>
        </div>
      </div>
      <div style={{opacity:compare,color:C.red,fontSize:22,fontWeight:770}}>
        Required field “email” was not provided
      </div>
    </>}
    {phase===6&&<>
      <div style={{opacity:show}}>{row('ORIGINAL GREEN REQUEST','POST /api/v1/login',C.green)}</div>
      <div style={{opacity:compare,display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:9}}>
        {['PATH','METHOD','RATE','WAF','SCHEMA'].map((key,i)=><div key={key} style={{
          border:'1px solid '+C.green+'77',borderRadius:11,background:'rgba(21,71,61,.57)',
          textAlign:'center',padding:'17px 4px',fontSize:18,fontWeight:800,
          color:C.green,opacity:enter(local,30+i*10,45+i*10)}}>✓ {key}</div>)}
      </div>
      <div style={{opacity:compare,padding:'22px 25px',borderRadius:14,
        border:'1px solid '+C.green+'80',background:'rgba(14,62,60,.62)',fontSize:27,
        fontWeight:840,color:C.green}}>Gateway → Load Balancer</div>
      <div style={{opacity:compare,fontSize:19,color:C.muted}}>Next: choose a healthy server. Password validation has not started.</div>
    </>}
    </div>
    {response&&<div style={{flex:'0 0 90px',minHeight:90,position:'relative',zIndex:3}}>
      <Status code={response[0]} caption={response[1]} visibility={failure}/>
    </div>}
  </div>;
};

export const GatewayIncidentYoutubePreview:React.FC<Props>=({
  durationInFrames,anchors,clipStarts,voiceEndFrame,statusFrames
})=>{
  const frame=useCurrentFrame();
  const total=Math.max(1,durationInFrames);
  const starts=DEFAULT_STARTS.map((sec,i)=>
    Number.isFinite(clipStarts[i])?clipStarts[i]:Math.min(total-1,sec*FPS));
  const phase=starts.reduce((n,start,i)=>frame>=start?i:n,0);
  const local=Math.max(0,frame-starts[phase]);
  const segmentFrames=Math.max(21,(starts[phase+1]??total)-starts[phase]);
  const focusEntry=move(frame,FIRST+14,FIRST+112);
  const inside=enter(frame,FIRST+45,FIRST+105);
  const confirmedVoiceEnd=Math.max(starts[6]+1,Math.min(total,voiceEndFrame??total));
  const hasFinalHold=total-confirmedVoiceEnd>=90;
  const finalExitStart=hasFinalHold?confirmedVoiceEnd+60:Math.max(starts[6]+50,total-28);
  const finalExitEnd=hasFinalHold?confirmedVoiceEnd+86:total-1;
  const out=phase===6?move(frame,finalExitStart,finalExitEnd):0;
  const screenFocus=clamp(inside*(1-out));
  const active=FOCUS[phase];
  const statusKind=['','ROUTE_404','METHOD_405','RATE_LIMIT_429','WAF_403','SCHEMA_400',''];
  const anchorStatus=['','ROUTE_404','METHOD_405','RATE_LIMIT_429','WAF_403','SCHEMA_400',''];
  const exact=statusFrames?.[statusKind[phase]] ??
    timing(anchors,anchorStatus[phase]);
  const approvedVoiceCueSeconds=[0,9.20,5.43,10.97,10.23,11.60,0];
  const resultAt=Number.isFinite(exact)
    ?Math.max(0,exact!-starts[phase])
    :Math.round(approvedVoiceCueSeconds[phase]*FPS);
  const resultLocal=Math.max(25,Math.min(segmentFrames-14,resultAt));
  const panelScale=.18+.82*focusEntry;
  const gatewayArrival=move(frame,5,68);
  const handoff=phase===6?move(frame,hasFinalHold?confirmedVoiceEnd+70:Math.max(starts[6]+55,total-36),
    Math.max(hasFinalHold?confirmedVoiceEnd+102:total-2,starts[6]+56)):0;
  const nativePacketOffset=(NATIVE_GATEWAY_ENTRY_X-NATIVE_PACKET_FINAL_X)*gatewayArrival+
    (NATIVE_BALANCER_ENTRY_X-NATIVE_GATEWAY_ENTRY_X)*handoff;
  const interiorOpacity=clamp(inside*(1-out));
  const leftRailReveal=phase===0?0:enter(local,8,22);

  return <div style={{position:'absolute',inset:0,overflow:'hidden',background:'#050F1E',...font}}>
    <div style={{position:'absolute',inset:0,opacity:1-.28*screenFocus}}>
      <NetworkTransitYoutubePreview showGuides={false} frameOverride={SHOT04_DURATION_FRAMES-1}
        gatewayHandoff={nativePacketOffset}
        gatewayActive={gatewayArrival*(1-handoff)} balancerActive={handoff}
        networkActiveMultiplier={1-gatewayArrival}/>
    </div>
    <div style={{position:'absolute',inset:0,
      background:'radial-gradient(ellipse at 49% 49%,rgba(4,17,33,.94),rgba(2,9,22,.98))',
      opacity:.92*screenFocus,pointerEvents:'none'}}/>
    <div style={{position:'absolute',left:875,top:303,width:420,textAlign:'center',
      opacity:clamp(enter(frame,FIRST,FIRST+24)*(1-inside)),
      fontSize:31,color:C.green,fontWeight:870}}>
      API Gateway · first server-side checkpoint
    </div>
    <div style={{position:'absolute',left:234,top:122,width:1452,height:834,zIndex:10,
      opacity:interiorOpacity,
      transformOrigin:'center center',
      transform:'translate('+(-100*(1-focusEntry))+'px,'+(70*(1-focusEntry))+'px) scale('+panelScale+')',
      pointerEvents:'none',borderRadius:30,
      border:'3px solid rgba(117,145,246,.77)',
      background:'linear-gradient(145deg,rgba(11,33,56,.98),rgba(4,14,30,.98))',
      boxShadow:'0 0 70px rgba(98,102,240,.22),0 30px 125px rgba(0,0,0,.65)',
      overflow:'hidden'}}>
      <div style={{position:'absolute',top:36,left:44,right:44,
        display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}}>
        <div>
          <div style={{fontSize:16,color:C.purple,letterSpacing:'.16em',fontWeight:840}}>
            INSIDE THE SYSTEM
          </div>
          <div style={{fontSize:47,color:C.bright,fontWeight:880,marginTop:5}}>API Gateway</div>
        </div>
        <div style={{padding:'14px 21px',borderRadius:13,
          border:'1px solid rgba(127,164,216,.34)',background:'rgba(7,27,45,.75)',
          fontSize:20,color:C.muted,fontWeight:720}}>
          REQUEST CHECKPOINT · NOT PASSWORD VALIDATION
        </div>
      </div>
      <div style={{position:'absolute',left:44,right:44,top:162,bottom:67,
        display:'grid',gridTemplateColumns:phase===0?'1fr':'391px 1fr',gap:31}}>
        {phase!==0&&<div style={{display:'flex',flexDirection:'column',gap:16,opacity:leftRailReveal}}>
          <Module name="Routing" items={['Path','Method']} active={active[0]} selected={active[1]}/>
          <Module name="Rate Limit" items={['Burst','Quota']} active={active[0]} selected={active[1]}/>
          <Module name="Request Filter" items={['WAF','Schema']} active={active[0]} selected={active[1]}/>
        </div>}
        <div style={{borderRadius:21,border:'1px solid rgba(103,164,213,.34)',
          background:'linear-gradient(160deg,rgba(14,39,65,.88),rgba(7,20,39,.93))',
          padding:'27px 32px 17px',overflow:'hidden'}}>
          <CaseStudy phase={phase} local={local} segmentFrames={segmentFrames} statusAt={resultLocal}/>
        </div>
      </div>
      <div style={{position:'absolute',bottom:24,left:46,right:46,
        display:'flex',justifyContent:'space-between',color:C.muted,fontSize:16,
        fontWeight:700,letterSpacing:'.045em'}}>
        <span>ONE CANONICAL REQUEST · FAILED SAMPLES ARE SEPARATE</span>
        <span>GATEWAY CHECKS · {phase+1} / 7</span>
      </div>
    </div>
  </div>;
};
