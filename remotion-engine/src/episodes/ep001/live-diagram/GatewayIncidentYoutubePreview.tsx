import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props={
  durationInFrames:number;
  anchors:Record<string,number>;
  clipStarts:number[];
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
  return <div style={{marginTop:16,borderRadius:16,border:'2px solid '+color+'A0',
    background:allowed?'rgba(9,65,57,.68)':'rgba(69,24,43,.63)',minHeight:102,
    padding:'20px 26px',opacity:visibility,
    transform:'translateY('+((1-visibility)*11)+'px)',
    display:'flex',alignItems:'center',gap:24}}>
      <span style={{color,fontSize:36,fontWeight:900,...mono}}>{code}</span>
      <span style={{color:C.bright,fontSize:24,fontWeight:760}}>{caption}</span>
  </div>;
};

const Bullet:React.FC<{children:React.ReactNode;soft?:boolean}>=({children,soft=false})=>(
  <div style={{fontSize:23,color:soft?C.muted:C.bright,lineHeight:1.5}}>{children}</div>
);

const CaseStudy:React.FC<{phase:number;local:number;segmentFrames:number;statusAt:number}>=({
  phase,local,segmentFrames,statusAt
})=>{
  const show=enter(local,10,24);
  const compare=enter(local,Math.max(20,segmentFrames*.22),Math.max(34,segmentFrames*.36));
  const failure=enter(local,statusAt,statusAt+13);
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
  return <div style={{height:'100%',display:'flex',flexDirection:'column',gap:18,pointerEvents:'none'}}>
    <div style={{letterSpacing:'.12em',color:C.purple,fontSize:17,fontWeight:810}}>
      {phase===0?'FIRST SERVER-SIDE CHECKPOINT':'LIVE EXAMPLE '+String(phase).padStart(2,'0')+' / 05'}
    </div>
    <div style={{fontSize:32,fontWeight:870,lineHeight:1.2,color:C.bright}}>{caseNames[phase]}</div>
    <div style={{fontSize:21,color:C.muted,marginTop:-9,lineHeight:1.35}}>{subtitles[phase]}</div>
    <div style={{height:2,background:'linear-gradient(to right,rgba(141,188,238,.48),rgba(141,188,238,0))',margin:'3px 0 0'}}/>
    <div style={{display:'flex',flexDirection:'column',gap:14,flex:1,justifyContent:'flex-start'}}>
    {phase===0&&<>
      <div style={{opacity:show}}>{row('INCOMING REQUEST','POST /api/v1/login',C.green)}</div>
      <div style={{opacity:show,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <Tile label="Path" value="/api/v1/login" mode="good"/>
        <Tile label="Method" value="POST" mode="good"/>
      </div>
      <div style={{opacity:compare,marginTop:6,...full,border:'1px solid '+C.purple+'99',
        display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}}>
        <Bullet>Routing, rate limits and filters run before authentication</Bullet>
        <span style={{color:C.amber,fontSize:20,fontWeight:820,whiteSpace:'nowrap'}}>PASSWORD NOT CHECKED</span>
      </div>
      <div style={{opacity:compare,color:C.muted,fontSize:21}}>The Auth Service has not received the request.</div>
    </>}
    {phase===1&&<>
      <div style={{opacity:show}}>{row('KNOWN ROUTE','POST /api/v1/login',C.green)}</div>
      <div style={{opacity:compare}}>{row('DIAGNOSTIC REQUEST','POST /api/v2/login',C.amber)}</div>
      <div style={{opacity:compare,display:'flex',gap:17,alignItems:'center',fontSize:22}}>
        <span style={{color:C.green}}>v1 configured</span>
        <span style={{color:C.muted}}>≠</span>
        <span style={{color:C.amber}}>v2 requested</span>
        <span style={{marginLeft:'auto',color:C.red,fontWeight:800}}>NO MATCHING ROUTE</span>
      </div>
      <Status code="404" caption="Not Found · Auth Service not reached" visibility={failure}/>
    </>}
    {phase===2&&<>
      <div style={{opacity:show}}>{row('PATH','/api/v1/login  ✓',C.green)}</div>
      <div style={{opacity:compare,display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}}>
        <Tile label="Expected" value="POST" mode="good"/>
        <Tile label="Received" value="GET" mode="error"/>
      </div>
      <div style={{opacity:compare,fontSize:22,color:C.muted}}>POST sends login details. GET requests a resource.</div>
      <Status code="405" caption="Method Not Allowed · path exists, action is wrong" visibility={failure}/>
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
      <Status code="429" caption="Too Many Requests · retry rejected" visibility={failure}/>
    </>}
    {phase===4&&<>
      <div style={{opacity:show}}>{row('DIAGNOSTIC SAMPLE','Normal-looking login',C.green)}</div>
      <div style={{opacity:compare}}>{row('CONFIGURED WAF RULE','WAF_LOGIN_1042',C.purple)}</div>
      <div style={{opacity:compare,fontSize:22,color:C.amber,fontWeight:760}}>
        Broad rule matched a legitimate sample → FALSE POSITIVE
      </div>
      <Status code="403" caption="Forbidden · sample blocked before Auth Service" visibility={failure}/>
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
      <Status code="400" caption="Bad Request · configured schema rejected the body" visibility={failure}/>
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
  </div>;
};

export const GatewayIncidentYoutubePreview:React.FC<Props>=({
  durationInFrames,anchors,clipStarts,statusFrames
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
  const out=phase===6?move(local,Math.max(30,segmentFrames*.63),
    Math.max(40,segmentFrames*.92)):0;
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
  const packetEnter=move(frame,FIRST,FIRST+52);
  const handoff=phase===6?move(local,Math.max(20,segmentFrames*.60),
    Math.max(42,segmentFrames*.96)):0;
  const interiorOpacity=clamp(inside*(1-out));

  return <div style={{position:'absolute',inset:0,overflow:'hidden',background:'#050F1E',...font}}>
    <div style={{position:'absolute',inset:0,opacity:1-.28*screenFocus}}>
      <NetworkTransitYoutubePreview showGuides={false} frameOverride={SHOT04_DURATION_FRAMES-1}/>
    </div>
    <div style={{position:'absolute',inset:0,
      background:'radial-gradient(ellipse at 49% 49%,rgba(4,17,33,.94),rgba(2,9,22,.98))',
      opacity:.92*screenFocus,pointerEvents:'none'}}/>
    <div style={{position:'absolute',left:875,top:303,width:420,textAlign:'center',
      opacity:clamp(enter(frame,FIRST,FIRST+24)*(1-inside)),
      fontSize:31,color:C.green,fontWeight:870}}>
      API Gateway · first server-side checkpoint
    </div>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080"
      style={{position:'absolute',inset:0,pointerEvents:'none',
        opacity:clamp(packetEnter*(1-screenFocus))}}>
      <path d="M 748 632 H 936" fill="none" stroke={C.green} strokeWidth={4}
        strokeDasharray={(Math.round(188*packetEnter))+' 188'} strokeLinecap="round"/>
      <circle cx={748+188*packetEnter} cy={632} r={12} fill={C.green}/>
      <path d="M 991 632 H 1042" stroke={C.green} strokeWidth={4}
        strokeDasharray={(Math.round(51*handoff))+' 51'} opacity={handoff}/>
    </svg>
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
        display:'grid',gridTemplateColumns:'391px 1fr',gap:31}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Module name="Routing" items={['Path','Method']} active={active[0]} selected={active[1]}/>
          <Module name="Rate Limit" items={['Burst','Quota']} active={active[0]} selected={active[1]}/>
          <Module name="Request Filter" items={['WAF','Schema']} active={active[0]} selected={active[1]}/>
        </div>
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
    {phase===6&&<div style={{position:'absolute',right:135,top:352,zIndex:12,
      padding:'23px 30px',borderRadius:17,
      border:'2px solid '+C.green+'99',background:'rgba(8,42,48,.94)',
      fontSize:31,fontWeight:840,color:C.green,opacity:handoff,
      transform:'translateY('+((1-handoff)*12)+'px)'}}>
      LOAD BALANCER · NEXT
    </div>}
  </div>;
};
