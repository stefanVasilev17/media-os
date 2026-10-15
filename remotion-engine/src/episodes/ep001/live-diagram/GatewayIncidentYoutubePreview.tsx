import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {ATCameraRig,AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props={
  durationInFrames:number;
  anchors:Record<string,number>;
  clipStarts:number[];
};

type Case={
  prompt:string;
  outcome:string;
  name:string;
  anchor:string;
};

const FPS=30;
const C={
  bright:'#E9F3FF',
  muted:'#A5BED6',
  dim:'#66809A',
  green:'#5AEFC3',
  amber:'#FFD07C',
  red:'#FF849A',
  purple:'#B59BFF',
  blue:'#73C8FF',
};
const CASES:Case[]=[
  {prompt:'The request reaches its first server-side check',outcome:'PASSWORD NOT CHECKED',name:'API GATEWAY',anchor:'API_GATEWAY'},
  {prompt:'Same service. Two different addresses.',outcome:'404 · NO ROUTE',name:'ROUTING',anchor:'ROUTING'},
  {prompt:'Same address. Different request actions.',outcome:'405 · METHOD NOT ALLOWED',name:'HTTP METHOD',anchor:'METHOD'},
  {prompt:'Retries pile up faster than the limit.',outcome:'429 · TOO MANY REQUESTS',name:'RATE LIMITING',anchor:'RATE_LIMIT'},
  {prompt:'A rule can stop even a normal login.',outcome:'403 · FORBIDDEN',name:'WEB APPLICATION FIREWALL',anchor:'WAF'},
  {prompt:'The expected field cannot be found.',outcome:'400 · BAD REQUEST',name:'SCHEMA VALIDATION',anchor:'SCHEMA'},
  {prompt:'The real request passes every check.',outcome:'ALLOWED',name:'NEXT · HEALTHY SERVER',anchor:'REQUEST_ALLOWED'},
];
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(frame:number,start:number,end:number)=>interpolate(frame,[start,Math.max(start+1,end)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});
const appear=(frame:number,start:number,end:number)=>interpolate(frame,[start,Math.max(start+1,end)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic),
});
const Font:React.CSSProperties={fontFamily:AT_FONT,color:C.bright};
const mono:React.CSSProperties={fontFamily:'Consolas,Menlo,monospace',fontWeight:760};

const SmallPacket:React.FC<{x:number;y:number;color:string;size?:number;opacity?:number}>=({x,y,color,size=12,opacity=1})=>(
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={size+12} fill={color} opacity={.08}/>
    <circle cx={x} cy={y} r={size} fill={color} opacity={.90}/>
    <circle cx={x-3} cy={y-3} r={Math.max(2,size*.25)} fill="white" opacity={.7}/>
  </g>
);

const CasePanel:React.FC<{children:React.ReactNode;opacity:number;phase:number;label:string}>=({children,opacity,phase,label})=>(
  <div style={{position:'absolute',left:1260,top:242,width:556,height:636,borderRadius:25,
    border:'1px solid rgba(100,150,190,.26)',background:'linear-gradient(155deg,rgba(6,20,37,.94),rgba(5,14,28,.96))',
    boxShadow:'0 18px 65px rgba(0,0,0,.19)',opacity,pointerEvents:'none',...Font}}>
    <div style={{margin:'30px 34px 0',fontSize:17,fontWeight:850,letterSpacing:'.14em',color:C.muted}}>
      WORKING EXAMPLE {String(phase).padStart(2,'0')} / 06
    </div>
    <div style={{margin:'12px 34px 0',fontSize:29,lineHeight:1.18,fontWeight:820,maxWidth:472}}>{label}</div>
    <div style={{position:'relative',height:494,margin:'18px 24px 12px',borderTop:'1px solid rgba(115,172,213,.15)'}}>{children}</div>
  </div>
);

const Result:React.FC<{text:string;progress:number;color?:string;top?:number}>=({text,progress,color=C.red,top=395})=>(
  <div style={{position:'absolute',left:22,right:22,top,padding:'17px 20px',borderRadius:13,
    border:`1px solid ${color}88`,background:'rgba(12,26,42,.94)',opacity:progress,
    transform:`translateY(${(1-progress)*13}px)`,fontSize:29,fontWeight:850,color}}>{text}</div>
);

const CaseAnimation:React.FC<{phase:number;local:number;segmentFrames:number}>=({phase,local,segmentFrames})=>{
  const q=(fraction:number)=>Math.round(segmentFrames*fraction);
  const step=(a:number,b:number)=>appear(local,q(a),q(b));
  const before=step(.11,.29);
  const mismatch=step(.30,.52);
  const error=step(.57,.75);
  const line:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 18px',
    border:'1px solid rgba(118,172,212,.23)',borderRadius:12,background:'rgba(13,34,57,.8)',fontSize:23};
  if(phase===1){
    return <>
      <div style={{position:'absolute',top:29,left:18,right:18,opacity:before,...line}}>
        <span style={{color:C.green,...mono}}>POST /api/v1/login</span><span style={{color:C.green,fontSize:21}}>✓</span>
      </div>
      <svg viewBox="0 0 508 280" width="508" height="280" style={{position:'absolute',top:107,left:0}}>
        <path d="M 44 52 H 210 Q 233 52 233 77 V 91 H 387" fill="none" stroke={C.green} strokeWidth="3" opacity={before}/>
        <rect x="343" y="76" width="147" height="56" rx="11" fill="rgba(36,104,86,.35)" stroke={C.green} opacity={before}/>
        <text x="416" y="110" textAnchor="middle" fontSize="21" fill={C.green} opacity={before}>auth-service</text>
        <path d="M 44 186 H 240" fill="none" stroke={C.amber} strokeWidth="3" strokeDasharray="9 9" opacity={mismatch}/>
        <circle cx="261" cy="186" r="17" stroke={C.red} strokeWidth="3" fill="none" opacity={error}/>
        <path d="M 251 176 L 271 196 M 271 176 L 251 196" stroke={C.red} strokeWidth="3" opacity={error}/>
        <SmallPacket x={44+190*step(.31,.58)} y={186} color={C.amber} opacity={mismatch*(1-error*.65)}/>
        <text x="44" y="166" fontSize="21" fill={C.amber} opacity={mismatch}>POST /api/v2/login</text>
        <text x="279" y="194" fontSize="20" fill={C.red} opacity={error}>NO PATH</text>
      </svg>
      <Result text="404 · UPSTREAM NOT CALLED" progress={error} top={391}/>
    </>;
  }
  if(phase===2){
    return <>
      <div style={{position:'absolute',top:27,left:22,right:22,padding:16,borderRadius:12,fontSize:25,textAlign:'center',border:'1px solid rgba(103,158,195,.23)',opacity:before,...mono}}> /api/v1/login </div>
      <div style={{position:'absolute',top:120,left:25,width:202,padding:'25px 10px',borderRadius:14,
        background:'rgba(26,86,72,.45)',border:`2px solid ${C.green}`,textAlign:'center',fontSize:32,fontWeight:880,opacity:before,color:C.green}}>POST → ✓</div>
      <div style={{position:'absolute',top:120,right:25,width:202,padding:'25px 10px',borderRadius:14,
        background:'rgba(106,48,60,.35)',border:`2px solid ${C.red}`,textAlign:'center',fontSize:32,fontWeight:880,opacity:mismatch,color:C.red}}>GET → ✕</div>
      <svg width="508" height="100" viewBox="0 0 508 100" style={{position:'absolute',top:244,left:0}}>
        <path d="M 125 0 V 55 H 252" stroke={C.green} strokeWidth="4" fill="none" opacity={before}/>
        <path d="M 385 0 V 55 H 268" stroke={C.red} strokeWidth="4" fill="none" strokeDasharray="8 7" opacity={mismatch}/>
        <rect x="194" y="40" width="120" height="49" rx="11" fill="#142A47" stroke={C.purple}/>
        <text x="254" y="70" textAnchor="middle" fill={C.bright} fontSize="21">POST ONLY</text>
      </svg>
      <Result text="405 · SAME PATH, WRONG ACTION" progress={error} top={385}/>
    </>;
  }
  if(phase===3){
    const count=Math.round(12+112*step(.18,.66));
    return <>
      <div style={{position:'absolute',left:18,top:31,right:18,padding:'21px 14px',textAlign:'center',
        borderRadius:14,border:`1px solid ${count>100?C.red:C.blue}88`,fontSize:31,fontWeight:870}}>
        <span style={{color:count>100?C.red:C.blue,...mono}}>{count} / 100</span>
        <div style={{fontSize:17,marginTop:6,color:C.muted}}>requests per minute · illustrative quota</div>
      </div>
      <svg width="508" height="195" viewBox="0 0 508 195" style={{position:'absolute',top:160,left:0}}>
        <path d="M 20 98 H 489" stroke="rgba(104,151,194,.32)" strokeWidth="3" />
        {[0,1,2,3,4,5,6].map((i)=><SmallPacket key={i} x={35+i*66*step(.12,.65)} y={98}
          color={i>3?C.amber:C.blue} size={9} opacity={clamp((local-i*5)/15)}/>) }
        <path d="M 318 98 V 152 H 476" stroke={C.red} strokeWidth="3" opacity={error}/>
        <text x="334" y="185" fill={C.red} opacity={error} fontSize="22">OVER QUOTA → 429</text>
      </svg>
      <div style={{position:'absolute',left:27,top:360,color:C.muted,fontSize:21,opacity:before}}>Small burst: 5 requests / 10 seconds</div>
      <Result text="429 · EXCESS RETRIES REJECTED" progress={error} top={404}/>
    </>;
  }
  if(phase===4){
    return <>
      <div style={{position:'absolute',left:18,right:18,top:27,...line,opacity:before}}>
        <span>NORMAL LOGIN</span><span style={{color:C.green,fontSize:24}}>ALLOWED ✓</span>
      </div>
      <svg width="508" height="235" viewBox="0 0 508 235" style={{position:'absolute',top:112,left:0}}>
        <path d="M 28 90 H 475" stroke="rgba(129,157,193,.24)" strokeWidth="4" />
        <rect x="210" y="40" width="110" height="112" rx="18" fill="rgba(113,75,173,.25)" stroke={C.purple} strokeWidth="3" opacity={mismatch}/>
        <text x="264" y="73" textAnchor="middle" fill={C.bright} fontSize="20" opacity={mismatch}>RULE</text>
        <text x="264" y="105" textAnchor="middle" fill={C.purple} fontSize="19" opacity={mismatch}>1042</text>
        <path d="M 270 152 V 205 H 410" stroke={C.red} strokeWidth="3" opacity={error}/>
        <SmallPacket x={36+207*step(.1,.55)} y={90} color={C.amber} opacity={mismatch}/>
        <text x="322" y="207" fill={C.red} fontSize="20" opacity={error}>FALSE POSITIVE</text>
      </svg>
      <div style={{position:'absolute',left:22,right:22,top:351,opacity:mismatch,fontSize:22,color:C.purple,textAlign:'center'}}>Configured rule: WAF_LOGIN_1042</div>
      <Result text="403 · NORMAL LOGIN BLOCKED" progress={error} top={397}/>
    </>;
  }
  if(phase===5){
    return <>
      <div style={{position:'absolute',left:18,top:23,right:18,display:'flex',gap:12}}>
        <div style={{flex:1,borderRadius:15,border:'1px solid rgba(106,183,208,.45)',padding:18,
          background:'rgba(11,40,62,.78)',opacity:before}}>
          <div style={{fontSize:17,color:C.muted,marginBottom:20}}>EXPECTED</div>
          <div style={{...mono,fontSize:26,color:C.green}}>{'{ "email": "..." }'}</div>
        </div>
        <div style={{flex:1,borderRadius:15,border:'1px solid rgba(245,172,123,.45)',padding:18,
          background:'rgba(57,33,45,.69)',opacity:mismatch}}>
          <div style={{fontSize:17,color:C.muted,marginBottom:20}}>RECEIVED</div>
          <div style={{...mono,fontSize:22,color:C.amber}}>{'{ "userEmail": "..." }'}</div>
        </div>
      </div>
      <svg width="508" height="150" viewBox="0 0 508 150" style={{position:'absolute',top:197,left:0}}>
        <path d="M 137 0 V 66 H 254 M 367 0 V 66 H 254" stroke="rgba(156,171,210,.61)" strokeWidth="3" fill="none" opacity={mismatch}/>
        <circle cx="254" cy="86" r="31" fill="#172B40" stroke={C.red} strokeWidth="3" opacity={error}/>
        <text x="254" y="97" textAnchor="middle" fontSize="33" fill={C.red} opacity={error}>✕</text>
        <text x="254" y="144" textAnchor="middle" fontSize="21" fill={C.muted} opacity={error}>REQUIRED FIELD NOT FOUND</text>
      </svg>
      <Result text="400 · VALIDATION REJECTED" progress={error} top={393}/>
    </>;
  }
  return null;
};

export const GatewayIncidentYoutubePreview:React.FC<Props>=({durationInFrames,anchors,clipStarts})=>{
  const frame=useCurrentFrame();
  const total=Math.max(1,durationInFrames);
  const planning=[0,17,38,58,81,101,119];
  const starts=planning.map((seconds,i)=>Number.isFinite(clipStarts[i])?clipStarts[i]:Math.min(total-1,Math.round(seconds*FPS)));
  const phase=starts.reduce((index,start,i)=>frame>=start?i:index,0);
  const local=Math.max(0,frame-starts[phase]);
  const segmentFrames=Math.max(20,(starts[phase+1]??total)-starts[phase]);
  const openingLeadIn=38;
  const arrival=appear(frame,openingLeadIn,openingLeadIn+145);
  const focus=appear(frame,openingLeadIn+66,openingLeadIn+320);
  const story=appear(frame,openingLeadIn+160,openingLeadIn+405);
  const handoff=phase===6?ease(local,segmentFrames*.2,segmentFrames*.92):0;
  const termFrame=anchors[CASES[phase].anchor];
  const termAt=Number.isFinite(termFrame)?termFrame*FPS:starts[phase]+Math.round(segmentFrames*.80);
  const termReveal=appear(frame,termAt,termAt+16);
  const panelOpen=phase===0?0:phase===6?0:clamp(appear(local,0,20)*(1-ease(local,segmentFrames-18,segmentFrames)));
  const casePrompt=CASES[phase];
  const canonicalX=phase===6?1016+(1264-1016)*handoff:756+(1016-756)*arrival;
  const canonicalY=632;
  const cameraX=-96*focus+38*handoff;
  const cameraY=18*focus;
  const cameraScale=1+.075*focus-.065*handoff;
  const softLayer=clamp(story*(1-handoff));
  return <div style={{position:'absolute',inset:0,overflow:'hidden',background:'#050F1E',...Font}}>
    <ATCameraRig x={cameraX} y={cameraY} scale={cameraScale}>
      <NetworkTransitYoutubePreview showGuides={false} frameOverride={SHOT04_DURATION_FRAMES-1}/>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:softLayer,
        background:'radial-gradient(ellipse at 70% 42%,rgba(11,17,44,.15),transparent 63%)'}}/>
      <svg viewBox="0 0 1920 1080" width="1920" height="1080"
        style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:16}}>
        <defs>
          <filter id="gwysoftglow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="M 744 632 H 1015" stroke={C.green} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${Math.round(271*arrival)} 271`} opacity={arrival*.75}/>
        <rect x="1003" y="510" width="244" height="235" rx="23" fill="none"
          stroke={C.purple} strokeWidth="3.5" opacity={arrival*.45+focus*.37}
          filter="url(#gwysoftglow)"/>
        <path d="M 1247 632 H 1333" fill="none" stroke={C.green} strokeWidth="4"
          strokeDasharray={`${Math.round(86*handoff)} 86`} opacity={handoff}/>
        <SmallPacket x={canonicalX} y={canonicalY} color={C.green} size={12} opacity={frame<openingLeadIn?0:arrival*.9} />
        {phase===6&&<SmallPacket x={1332} y={632} color={C.green} size={13} opacity={handoff*.68}/>}
      </svg>
      <div style={{position:'absolute',left:864,top:383,width:379,zIndex:19,opacity:clamp(arrival*(1-handoff*.25)),
        textAlign:'center',pointerEvents:'none'}}>
        <div style={{fontSize:19,color:C.purple,letterSpacing:'.13em',fontWeight:800,opacity:story}}>FIRST SERVER CHECKPOINT</div>
        <div style={{marginTop:11,fontSize:32,fontWeight:870,opacity:phase===0?termReveal:1}}>API Gateway</div>
        <div style={{marginTop:9,fontSize:20,fontWeight:650,color:C.muted,opacity:story}}>Password not checked here</div>
      </div>
      {phase>=1&&phase<=5&&<CasePanel phase={phase} label={casePrompt.prompt} opacity={panelOpen}>
        <CaseAnimation phase={phase} local={local} segmentFrames={segmentFrames}/>
      </CasePanel>}
      {phase>=1&&phase<=5&&<div style={{position:'absolute',left:846,top:780,width:366,zIndex:25,
        padding:'14px 19px',borderRadius:13,background:'rgba(10,24,42,.93)',border:'1px solid rgba(168,138,255,.42)',
        boxShadow:'0 10px 33px rgba(0,0,0,.19)',opacity:clamp(termReveal*(1-handoff)),pointerEvents:'none'}}>
        <div style={{fontSize:17,color:C.muted,letterSpacing:'.14em',fontWeight:700}}>THIS CHECK IS CALLED</div>
        <div style={{fontSize:28,color:C.purple,fontWeight:870,marginTop:7}}>{casePrompt.name}</div>
      </div>}
      {phase===0&&<div style={{position:'absolute',left:1250,top:422,zIndex:18,opacity:story,
        border:'1px solid rgba(116,193,200,.24)',background:'rgba(8,29,46,.80)',borderRadius:17,
        padding:'24px 26px',fontSize:26,color:C.muted,pointerEvents:'none'}}>
        Request reaches the server <span style={{color:C.green}}>→</span> rules first
      </div>}
      {phase===6&&<div style={{position:'absolute',left:1280,top:446,zIndex:20,
        opacity:handoff,pointerEvents:'none',padding:'22px 27px',borderRadius:17,
        border:'1px solid rgba(84,238,188,.43)',background:'rgba(11,47,49,.86)'}}>
        <div style={{fontSize:28,color:C.green,fontWeight:860}}>✓ CHECKS PASSED</div>
        <div style={{fontSize:23,color:C.muted,marginTop:10}}>Which healthy server receives it next?</div>
      </div>}
    </ATCameraRig>
    {frame>openingLeadIn&&<div style={{position:'absolute',left:82,bottom:72,zIndex:30,
      opacity:appear(frame,openingLeadIn+40,openingLeadIn+112)*(1-handoff*.8),
      color:C.dim,fontSize:19,fontWeight:690,letterSpacing:'.06em'}}>
      ONE CANONICAL REQUEST · DIAGNOSTIC EXAMPLES ARE SEPARATE
    </div>}
  </div>;
};