import React from 'react';
import {Easing,interpolate,useCurrentFrame} from 'remotion';
import {ATBackground,AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props={
  durationInFrames:number;
  anchors:Record<string,number>;
  clipStarts:number[];
};
type Incident={
  heading:string;
  question:string;
  explanation:string;
  good:string;
  bad:string;
  status:string;
  statusDetail:string;
  rows:{label:string;value:string;flag?:boolean}[];
};

const COLORS={
  background:'#050E1A',
  muted:'#789AB5',
  cyan:'#6BCAFF',
  teal:'#58F1C3',
  violet:'#AF9AFF',
  red:'#FF8C9F',
  white:'#E7F1FF',
};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(f:number,a:number,b:number)=>interpolate(f,[a,Math.max(a+1,b)],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});
const sceneSegments:Incident[]=[
  {heading:'FIRST BACKEND CHECKPOINT',question:'What happens before the password check?',
    explanation:'Rules decide where the request may go.',good:'INCOMING · POST /login',bad:'',
    status:'API GATEWAY',statusDetail:'Password not checked yet',rows:[
      {label:'INCOMING REQUEST',value:'POST /login'},{label:'SERVICE STATE',value:'Auth service waiting'}
    ]},
  {heading:'FIND THE RIGHT SERVICE',question:'What if the new app uses a different address?',
    explanation:'The old route is still configured.',good:'POST /api/v1/login',bad:'POST /api/v2/login',
    status:'404  NO ROUTE',statusDetail:'Auth service was not called',rows:[
      {label:'CONFIGURED PATH',value:'/api/v1/login'},
      {label:'NEW APP PATH',value:'/api/v2/login',flag:true},
      {label:'UPSTREAM',value:'NOT CALLED',flag:true}
    ]},
  {heading:'WHAT ACTION IS REQUESTED?',question:'The address is right. The action is wrong.',
    explanation:'Login details should be sent with POST.',good:'POST /api/v1/login',bad:'GET /api/v1/login',
    status:'405  METHOD NOT ALLOWED',statusDetail:'Same address · wrong action',rows:[
      {label:'ALLOWED ACTION',value:'POST'},
      {label:'RECEIVED ACTION',value:'GET',flag:true},
      {label:'RESULT',value:'REJECTED',flag:true}
    ]},
  {heading:'PROTECT THE SERVERS',question:'Too many login requests arrive at once.',
    explanation:'Short spikes may pass. The larger limit protects capacity.',
    good:'12 / 100 requests',bad:'124 / 100 requests',
    status:'429  TOO MANY REQUESTS',statusDetail:'Extra requests stopped before Auth Service',rows:[
      {label:'ALLOWED PER MINUTE',value:'100'},
      {label:'RECENT REQUESTS',value:'124',flag:true},
      {label:'BACKEND HEALTH',value:'HEALTHY'}
    ]},
  {heading:'CHECK FOR UNSAFE REQUESTS',question:'A rule blocks even a normal login.',
    explanation:'One security rule is too strict.',good:'NORMAL LOGIN · ALLOW',bad:'RULE WAF_LOGIN_1042',
    status:'403  FORBIDDEN',statusDetail:'False positive · normal login blocked',rows:[
      {label:'REQUEST',value:'NORMAL LOGIN'},
      {label:'SECURITY RULE',value:'WAF_LOGIN_1042',flag:true},
      {label:'DECISION',value:'BLOCK',flag:true}
    ]},
  {heading:'DO THE FIELDS MATCH?',question:'The app sends a field with the wrong name.',
    explanation:'The request is safe, but its shape is wrong.',good:'{ "email": "..." }',bad:'{ "userEmail": "..." }',
    status:'400  BAD REQUEST',statusDetail:'Expected field was not found',rows:[
      {label:'EXPECTED JSON',value:'"email"'},
      {label:'RECEIVED JSON',value:'"userEmail"',flag:true},
      {label:'VALIDATION',value:'FAILED',flag:true}
    ]},
  {heading:'CHECKS PASSED',question:'Our real login request is ready to move forward.',
    explanation:'The next step is a healthy service instance.',good:'POST /login · ALLOWED',bad:'',
    status:'FORWARDED',statusDetail:'Next · Load Balancer',rows:[
      {label:'ROUTING',value:'PASSED'},
      {label:'TRAFFIC RULES',value:'PASSED'},
      {label:'SAFETY & FIELDS',value:'PASSED'}
    ]},
];

const terms=[
  {name:'ROUTING',anchor:'ROUTING'},
  {name:'METHOD',anchor:'METHOD'},
  {name:'RATE LIMIT',anchor:'RATE_LIMIT'},
  {name:'WAF',anchor:'WAF'},
  {name:'SCHEMA',anchor:'SCHEMA'},
] as const;

const sharedText:React.CSSProperties={fontFamily:AT_FONT,color:COLORS.white};
const border=(color='rgba(106,171,226,.22)')=>'1px solid '+color;

const Mono:React.FC<{children:React.ReactNode;size?:number;color?:string;weight?:number}>=({children,size=24,color=COLORS.white,weight=720})=>(
  <span style={{fontFamily:'SFMono-Regular,Consolas,Menlo,monospace',fontSize:size,color,fontWeight,letterSpacing:'-.03em'}}>{children}</span>
);

export const GatewayIncidentYoutubePreview:React.FC<Props>=({durationInFrames,anchors,clipStarts})=>{
  const frame=useCurrentFrame();
  const total=Math.max(1,durationInFrames);
  const starts=Array.from({length:7},(_,i)=>Number.isFinite(clipStarts[i])
    ?clipStarts[i]:Math.round(total*[0,.13,.30,.45,.63,.78,.92][i]));
  const phase=starts.reduce((n,start,i)=>frame>=start?i:n,0);
  const local=frame-starts[phase];
  const segmentLength=Math.max(12,(starts[phase+1]??total)-starts[phase]);
  const appear=ease(local,0,14);
  const exit=1-ease(local,segmentLength-16,segmentLength-2);
  const panelOpacity=clamp(appear*exit);
  const incident=sceneSegments[phase];
  const isDiagnostic=phase>=1&&phase<=5;
  const errorPulse=clamp(ease(local,Math.min(18,segmentLength*.24),Math.min(33,segmentLength*.45)));
  const xGreen=phase===6?interpolate(ease(local,0,Math.max(22,segmentLength-8)),[0,1],[614,1160]):610+24*ease(local,12,55);
  const stableAlpha=1-ease(frame,4,50);
  const centerPulse=.45+.18*Math.sin(frame/18);
  const labelTime=(key:string,defaultFrame:number)=>{
    const seconds=anchors[key];
    return Number.isFinite(seconds)?Math.round(seconds*30):defaultFrame;
  };
  const revealed=(key:string,sectionIndex:number)=>{
    if(phase<sectionIndex+1)return false;
    if(phase>sectionIndex+1)return true;
    return frame>=labelTime(key,starts[phase]+Math.round(segmentLength*.70));
  };
  const errorColor=isDiagnostic?COLORS.red:COLORS.teal;
  const currentFocus=phase===0?-1:phase===6?5:phase-1;
  return (
    <ATBackground>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 47% 49%,rgba(28,61,105,.18),transparent 52%)'}}/>
      <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        {Array.from({length:8},(_,i)=>(
          <React.Fragment key={i}>
            <path d={`M 0 ${132+i*116} H 1920`} stroke="rgba(58,108,147,.058)" strokeWidth="1"/>
            <path d={`M ${148+i*242} 0 V 1080`} stroke="rgba(58,108,147,.047)" strokeWidth="1"/>
          </React.Fragment>
        ))}
        <path d="M 465 570 H 715" stroke="rgba(58,198,167,.18)" strokeWidth="3" fill="none"/>
        <path d="M 465 570 H 715" stroke="rgba(95,241,194,.65)" strokeWidth="2" fill="none" pathLength={1}
              strokeDasharray={`${.30+.58*ease(frame,4,40)} 1`} strokeLinecap="round"/>
        <circle cx={xGreen} cy="570" r="10" fill={COLORS.teal}
                filter="url(#shot05-glow)"/>
        <circle cx={xGreen} cy="570" r="23" fill="rgba(73,245,190,.10)"/>
        {isDiagnostic&&[0,1,2].map((index)=>(
          <circle key={index} cx={770+index*36} cy={645+index*34}
                  r={8} fill={COLORS.red} opacity={errorPulse*(1-index*.20)}
                  filter="url(#shot05-glow)"/>
        ))}
        {phase===6&&<path d="M 1130 570 H 1255" stroke={COLORS.teal} strokeWidth="3"
                  strokeDasharray="12 14" fill="none" opacity={ease(local,14,44)}/>}
        <defs>
          <filter id="shot05-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>

      <div style={{position:'absolute',left:88,top:66,right:90,display:'flex',justifyContent:'space-between',alignItems:'center',...sharedText}}>
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          <div style={{width:8,height:8,borderRadius:99,background:COLORS.teal,boxShadow:'0 0 17px rgba(84,244,193,.5)'}}/>
          <span style={{fontSize:22,fontWeight:850,letterSpacing:'.16em',color:'#A8BED2'}}>LIVING ARCHITECTURE MAP</span>
        </div>
        <span style={{fontSize:19,fontWeight:690,color:'#819AB1',letterSpacing:'.08em'}}>EP001  /  05  —  BACKEND ENTRY</span>
      </div>

      <div style={{position:'absolute',left:85,top:252,width:390,...sharedText}}>
        <div style={{fontSize:20,letterSpacing:'.15em',color:COLORS.muted,fontWeight:850,marginBottom:28}}>FROM NETWORK TRANSIT</div>
        <div style={{padding:26,borderRadius:24,border:border('rgba(68,210,168,.36)'),
                     background:'linear-gradient(140deg,rgba(5,36,37,.86),rgba(3,17,30,.97))',
                     boxShadow:'0 0 36px rgba(49,220,168,.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:19,fontWeight:780,color:'#89C1BC'}}>LIVE REQUEST</span>
            <span style={{fontSize:17,fontWeight:720,color:COLORS.teal}}>● ACTIVE</span>
          </div>
          <div style={{marginTop:22,marginBottom:18}}><Mono size={25}>POST /login</Mono></div>
          <div style={{height:2,background:'linear-gradient(90deg,#438D82,transparent)',marginBottom:19}}/>
          <div style={{fontSize:21,lineHeight:1.4,color:'#A2B7C9'}}>The real request continues through the system.</div>
        </div>
        <div style={{fontSize:19,lineHeight:1.5,color:'#7290A6',marginTop:30,paddingLeft:10}}>Diagnostic examples are separate from the green request.</div>
      </div>

      <div style={{position:'absolute',left:528,top:199,width:646,height:688,borderRadius:39,
                   border:border('rgba(126,127,252,.26)'),
                   background:'linear-gradient(150deg,rgba(16,28,60,.84),rgba(5,17,38,.91) 61%,rgba(11,37,54,.81))',
                   boxShadow:'0 0 90px rgba(76,81,206,.08),inset 0 0 72px rgba(67,99,166,.045)',
                   ...sharedText}}>
        <div style={{position:'absolute',left:21,top:27,bottom:27,width:5,borderRadius:9,
                     background:'linear-gradient(180deg,rgba(172,146,255,.12),#897BFF 48%,rgba(72,216,235,.18))',
                     boxShadow:`0 0 ${16+24*centerPulse}px rgba(122,108,255,.36)`}}/>
        <div style={{padding:'38px 45px 29px 60px'}}>
          <div style={{fontSize:19,letterSpacing:'.20em',fontWeight:800,color:'#989FD5'}}>BACKEND INGRESS</div>
          <div style={{fontSize:42,fontWeight:880,letterSpacing:'-.04em',marginTop:12}}>API Gateway</div>
          <div style={{fontSize:19,color:'#859FC5',marginTop:9}}>First rules before authentication</div>
        </div>
        <div style={{position:'absolute',left:64,right:45,top:182,height:1,background:'rgba(130,152,213,.22)'}}/>
        <div style={{position:'absolute',left:62,top:207,right:44,display:'flex',flexDirection:'column',gap:15}}>
          {terms.map((term,i)=>{
            const focused=i===currentFocus;
            const named=revealed(term.anchor,i);
            return <div key={term.anchor} style={{
              borderRadius:17,minHeight:65,display:'flex',alignItems:'center',
              padding:'12px 19px',gap:20,
              border:border(focused?'rgba(155,139,255,.65)':'rgba(94,122,168,.15)'),
              background:focused?'linear-gradient(90deg,rgba(111,81,215,.22),rgba(39,65,99,.14))':'rgba(17,29,49,.44)',
              boxShadow:focused?'0 0 30px rgba(125,114,243,.09)':'none',opacity:focused?1:.43,
            }}>
              <div style={{width:42,height:42,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',
                           border:border(focused?'rgba(153,152,255,.63)':'rgba(90,131,174,.36)'),fontSize:21,fontWeight:800,color:'#A1B8E9'}}>
                {String(i+1).padStart(2,'0')}
              </div>
              <div style={{flex:1,fontSize:24,fontWeight:820,letterSpacing:'.025em'}}>
                {named?term.name:['DESTINATION','REQUEST ACTION','TRAFFIC CONTROL','SAFETY CHECK','REQUEST FIELDS'][i]}
              </div>
              {focused&&<div style={{width:11,height:11,borderRadius:'50%',background:COLORS.violet,
                                     boxShadow:'0 0 18px rgba(157,135,255,.6)'}}/>}
            </div>;
          })}
        </div>
        <div style={{position:'absolute',left:65,bottom:23,right:44,display:'flex',justifyContent:'space-between',fontSize:17,color:'#9AA9D5'}}>
          <span>REQUEST RULES</span><span>{phase===6?'PASS ✓':'CHECKING'}</span>
        </div>
      </div>

      <div style={{position:'absolute',left:1234,top:195,width:605,height:706,overflow:'hidden',
                   borderRadius:29,border:border('rgba(88,131,186,.34)'),
                   background:'linear-gradient(165deg,rgba(8,22,42,.97),rgba(6,15,30,.98))',
                   boxShadow:'0 0 45px rgba(15,50,99,.10)',...sharedText}}>
        <div style={{padding:'34px 39px',opacity:panelOpacity}}>
          <div style={{fontSize:19,color:'#81A8C9',letterSpacing:'.14em',fontWeight:860}}>PRODUCTION EXAMPLE  /  {String(phase+1).padStart(2,'0')}</div>
          <div style={{fontSize:26,fontWeight:870,letterSpacing:'.01em',marginTop:17,color:'#E6F1FF'}}>{incident.heading}</div>
          <div style={{fontSize:24,lineHeight:1.36,color:'#A8C0D8',marginTop:11,minHeight:73}}>{incident.question}</div>
          <div style={{marginTop:15,borderTop:border('rgba(80,130,170,.20)'),paddingTop:21,display:'flex',flexDirection:'column',gap:12}}>
            {incident.rows.map((row,i)=><div key={i} style={{
              minHeight:61,padding:'10px 16px',borderRadius:12,
              display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,
              background:row.flag?'rgba(91,35,56,.27)':'rgba(22,48,72,.54)',
              border:border(row.flag?'rgba(227,114,146,.25)':'rgba(79,133,172,.20)'),
              opacity:ease(local,12+i*7,23+i*7)}}>
              <div style={{fontSize:17,color:'#98B5CE',fontWeight:750,maxWidth:245}}>{row.label}</div>
              <Mono size={row.value.length>18?18:23} color={row.flag?COLORS.red:COLORS.white}>{row.value}</Mono>
            </div>)}
          </div>
          <div style={{marginTop:23,padding:'21px 18px',borderRadius:16,
                       background:isDiagnostic?'rgba(84,36,52,.33)':'rgba(23,76,69,.27)',
                       border:border(isDiagnostic?'rgba(248,130,150,.37)':'rgba(84,215,176,.28)'),
                       opacity:errorPulse}}>
            <div style={{fontSize:29,fontWeight:870,color:errorColor,letterSpacing:'-.01em'}}>{incident.status}</div>
            <div style={{fontSize:20,color:'#C0C8D6',marginTop:9}}>{incident.statusDetail}</div>
          </div>
        </div>
      </div>
      <div style={{position:'absolute',left:1260,right:107,bottom:90,display:'flex',alignItems:'center',justifyContent:'space-between',
                   opacity:panelOpacity,...sharedText}}>
        <span style={{fontSize:19,color:'#769CB7',letterSpacing:'.06em'}}>ILLUSTRATIVE PRODUCTION CASE</span>
        <span style={{fontSize:18,color:COLORS.teal}}>CANONICAL LOGIN ✓</span>
      </div>

      <div style={{position:'absolute',inset:0,opacity:stableAlpha,pointerEvents:'none',zIndex:40}}>
        <NetworkTransitYoutubePreview showGuides={false} frameOverride={SHOT04_DURATION_FRAMES-1}/>
      </div>
    </ATBackground>
  );
};
