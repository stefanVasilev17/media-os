import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  ATBackground,
  ATBackendNode,
  ATCameraRig,
  ATControlledRealismLayer,
  AT_FONT,
} from '../../components/architectural-thinking';
import {Shot01ReadablePhone} from './Shot01ReadablePhone';
import {SHOT02_NODES, SHOT02_TEXT_LANES, assertShot02TextLanes} from './Shot02PremiumLayout';
import {shot02TapPulse,shot02TermHold,shot02FlowIntensity,shot02FocusCamera,shot02FlowClock,
  type Shot02FocusKey,type Shot02FocusWeights} from './Shot02DirectorPacing';

export type Shot02VerifiedCue = {
  beatNumber: number;
  spokenAnchor: string;
  startFrame: number;
  endFrame: number;
};

export type Shot02TermId =
  | 'LOGIN_REQUEST' | 'API_GATEWAY' | 'LOAD_BALANCER'
  | 'AUTH_SERVERS' | 'ARRIVAL_RATE' | 'AUTH_SERVERS_REPRISE' | 'USER_DATABASE';

export type Shot02TermCue = {
  id: Shot02TermId;
  spokenAnchor: string;
  startFrame: number;
  endFrame: number;
};

export type Shot02GeneratedSceneProps = {
  durationInFrames: number;
  voiceTakeId: string;
  timingMode: 'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues: Shot02VerifiedCue[];
  termCues: Shot02TermCue[];
};

const C = {
  cyan: '#59D9F4',
  mint: '#58EAC0',
  violet: '#B3A3FF',
  amber: '#F4BE77',
  ink: '#EAF6FF',
  muted: '#8BA9C3',
};

const WORLD = {
  gatewayX: SHOT02_NODES.gateway.x,
  gatewayY: SHOT02_NODES.gateway.y,
  balancerX: SHOT02_NODES.balancer.x,
  balancerY: SHOT02_NODES.balancer.y,
  authX: SHOT02_NODES.auth.x,
  authY: SHOT02_NODES.auth.y,
  databaseX: SHOT02_NODES.database.x,
  databaseY: SHOT02_NODES.database.y,
} as const;

const SPOKEN_TERMS: readonly {
  id: Shot02TermId;
  anchor: string;
  node: Shot02FocusKey|null;
  color: string;
}[] = [
  {id:'LOGIN_REQUEST',anchor:'Login request',node:null,color:C.cyan},
  {id:'API_GATEWAY',anchor:'API Gateway',node:'gateway',color:C.cyan},
  {id:'LOAD_BALANCER',anchor:'Load Balancer',node:'balancer',color:C.mint},
  {id:'AUTH_SERVERS',anchor:'Auth servers',node:'auth',color:C.violet},
  {id:'ARRIVAL_RATE',anchor:'arrival rate',node:null,color:C.mint},
  {id:'AUTH_SERVERS_REPRISE',anchor:'Auth servers',node:'auth',color:C.violet},
  {id:'USER_DATABASE',anchor:'User Database',node:'database',color:C.violet},
] as const;

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

/**
 * Never derive these frames from editorial 00:40–01:25 or from a percentage of the scene.
 * They must come from a Director-verified MediaOS voice-cue review for the selected Take.
 * Backend provenance checking is separate and is required before rendering.
 */
export function requireShot02VerifiedCues(
  durationInFrames: number,
  voiceTakeId: string,
  timingMode: Shot02GeneratedSceneProps['timingMode'],
  verifiedCues: Shot02VerifiedCue[],
): readonly Shot02VerifiedCue[] {
  if (!Number.isInteger(durationInFrames) || durationInFrames < 6 ||
      durationInFrames > 108000 || !voiceTakeId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(voiceTakeId) ||
      timingMode !== 'ELEVENLABS_CHARACTER_TIMESTAMPS' ||
      !Array.isArray(verifiedCues) || verifiedCues.length !== 5) {
    throw new Error('SHOT02_REQUIRES_DIRECTOR_VERIFIED_ELEVENLABS_CUES');
  }

  for (let i = 0; i < 5; i++) {
    const cue = verifiedCues[i];
    if (!cue || cue.beatNumber !== i + 1 ||
        !Number.isInteger(cue.startFrame) || !Number.isInteger(cue.endFrame) ||
        cue.startFrame < 0 || cue.endFrame > durationInFrames ||
        cue.endFrame <= cue.startFrame || !cue.spokenAnchor?.trim() ||
        (i > 0 && (cue.startFrame !== verifiedCues[i - 1].endFrame ||
          cue.startFrame <= verifiedCues[i - 1].startFrame))) {
      throw new Error('SHOT02_VERIFIED_CUE_SEQUENCE_INVALID');
    }
  }
  if (verifiedCues[4].endFrame !== durationInFrames) {
    throw new Error('SHOT02_VERIFIED_CUES_DO_NOT_COVER_AUDIO');
  }
  return verifiedCues;
}

const normalizeTerm = (s:string) => s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

export function requireShot02SpokenTerms(
  duration:number,
  beats:readonly Shot02VerifiedCue[],
  terms:Shot02TermCue[],
):readonly Shot02TermCue[] {
  if(!Array.isArray(terms)||terms.length!==SPOKEN_TERMS.length)
    throw Error('SHOT02_REQUIRES_SEVEN_REAL_SPOKEN_TERM_TIMES');
  for(let i=0;i<terms.length;i++){
    const term=terms[i],expected=SPOKEN_TERMS[i];
    if(!term||term.id!==expected.id
      ||normalizeTerm(term.spokenAnchor)!==normalizeTerm(expected.anchor)
      ||!Number.isInteger(term.startFrame)||!Number.isInteger(term.endFrame)
      ||term.startFrame<0||term.startFrame>=term.endFrame
      ||term.endFrame>duration
      ||(i>0&&term.startFrame<terms[i-1].endFrame))
      throw Error('SHOT02_SPOKEN_TERMS_NOT_REAL_ORDERED_ANCHORS');
  }
  if(terms[0].startFrame<beats[1].startFrame
     ||terms[0].startFrame>=beats[2].endFrame
     ||terms[1].startFrame<beats[2].startFrame
     ||terms[1].startFrame>=beats[2].endFrame
     ||terms[2].startFrame<beats[2].startFrame
     ||terms[2].startFrame>=beats[2].endFrame
     ||terms[3].startFrame<beats[2].startFrame
     ||terms[3].startFrame>=beats[3].startFrame
     ||terms[4].startFrame<beats[3].startFrame
     ||terms[4].startFrame>=beats[3].endFrame
     ||terms[5].startFrame<beats[3].startFrame
     ||terms[5].startFrame>=beats[4].endFrame
     ||terms[6].startFrame<beats[4].startFrame
     ||terms[6].startFrame>=beats[4].endFrame)
    throw Error('SHOT02_TERM_BOUNDARIES_DISAGREE_WITH_DIRECTOR_BEATS');
  return terms;
}

function activeSpokenTerm(
  frame:number,terms:readonly Shot02TermCue[],
):Shot02TermCue|null {
  for(let i=terms.length-1;i>=0;i--){
    const term=terms[i];
    if(frame>=term.startFrame)
      return frame<term.endFrame+36 ? term:null;
  }
  return null;
}

function requestPoint(t: number) {
  const q = 1 - t;
  return {
    x: q * q * q * 725 + 3 * q * q * t * 800 + 3 * q * t * t * 788 + t * t * t * 858,
    y: q * q * q * 590 + 3 * q * q * t * 590 + 3 * q * t * t * 525 + t * t * t * 525,
  };
}

const ArrivalWave: React.FC<{
  clock:number;density:number;acceleration:number;tap:number;
}>=({clock,density,acceleration,tap})=>(
  <g>
    {Array.from({length:32},(_,i)=>{
      const available=clamp(density*2.3)>(i/32);
      const p=((clock+i*.173)%1+1)%1;
      const trunk=p<.27?requestPoint(p/.27):{
        x:858+(1330-858)*((p-.27)/.73),y:525,
      };
      const edge=clamp(Math.min(p,1-p)*11);
      const boost=.6+.4*acceleration;
      return <circle key={i} cx={trunk.x} cy={trunk.y}
        r={2.8+1.8*acceleration+1.6*tap*(i%5===0?1:0)}
        fill={i%3===0?C.mint:C.cyan}
        opacity={available?clamp(density*1.4)*edge*boost:0}
        style={{filter:'drop-shadow(0 0 6px rgba(88,234,192,.66))'}}/>;
    })}
  </g>
);

const FlowPaths: React.FC<{
  frame:number;active:number;distribution:number;database:number;
  density:number;acceleration:number;tap:number;clock:number;
}>=({frame,active,distribution,database,density,acceleration,tap,clock})=>{
  const authYs=[416,493,571] as const;
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080"
    style={{position:'absolute',inset:0,zIndex:1,overflow:'visible',pointerEvents:'none'}}>
    <defs>
      <linearGradient id="ep002-s02-main-path" x1="0%" x2="100%">
        <stop offset="0%" stopColor={C.cyan}/>
        <stop offset="55%" stopColor={C.mint}/>
        <stop offset="100%" stopColor={C.violet}/>
      </linearGradient>
    </defs>
    <path d="M 725 590 C 810 590 786 525 858 525 H 1045 C 1112 525 1100 525 1150 525 H 1330"
      fill="none" stroke="#244565" strokeWidth={9} strokeLinecap="round" opacity=".58"/>
    <path d="M 725 590 C 810 590 786 525 858 525 H 1045 C 1112 525 1100 525 1150 525 H 1330"
      fill="none" stroke="url(#ep002-s02-main-path)" strokeWidth={2.7}
      strokeLinecap="round" opacity={clamp(.18+active*.44+acceleration*.22)}/>
    {authYs.map((y,i)=>{
      const branch='M 1280 525 C 1358 525 1360 '+y+' 1407 '+y;
      const destination=i===0?400:i===1?475:552;
      const dbPath='M 1708 '+destination+' C 1870 '+destination+' 1910 531 2015 531';
      const dots=Array.from({length:8},(_,k)=>{
        const p=((clock*.82+i/3+k/8)%1+1)%1,q=1-p;
        const branchX=q*q*q*1280+3*q*q*p*1358+3*q*p*p*1360+p*p*p*1407;
        const branchY=q*q*q*525+3*q*q*p*525+3*q*p*p*y+p*p*p*y;
        const dbX=q*q*q*1708+3*q*q*p*1870+3*q*p*p*1910+p*p*p*2015;
        const dbY=q*q*q*destination+3*q*q*p*destination+
          3*q*p*p*531+p*p*p*531;
        const visibility=clamp(density*(.62+acceleration*.52))*
          clamp(Math.min(p,1-p)*12);
        return <g key={k}>
          <circle cx={branchX} cy={branchY} r={3.1+1.4*acceleration}
            fill={C.mint} opacity={distribution*visibility}
            style={{filter:'drop-shadow(0 0 5px rgba(88,234,192,.72))'}}/>
          <circle cx={dbX} cy={dbY} r={3.1+1.3*acceleration}
            fill={k%2===0?C.mint:C.violet}
            opacity={database*visibility}
            style={{filter:'drop-shadow(0 0 5px rgba(179,163,255,.65))'}}/>
        </g>;
      });
      return <g key={y}>
        <path d={branch} fill="none" stroke="#335474" strokeWidth={6} opacity=".38"/>
        <path d={branch} fill="none" stroke={C.mint} strokeWidth={2.2}
          opacity={distribution*(.35+.14*Math.sin(frame*.05+i)+.18*acceleration)}/>
        <path d={dbPath} fill="none" stroke="#335474" strokeWidth={6}
          opacity={database*.45}/>
        <path d={dbPath} fill="none" stroke={C.violet} strokeWidth={2.1}
          opacity={database*(.38+.12*Math.sin(frame*.035+i)+.19*acceleration)}/>
        {dots}
      </g>;
    })}
    <ArrivalWave clock={clock} density={density}
      acceleration={acceleration} tap={tap}/>
  </svg>;
};

const ContextLabel: React.FC<{reveal: number}> = ({reveal}) => (
  <div style={{
    position:'absolute',...SHOT02_TEXT_LANES.time,zIndex:25,opacity:reveal,
    display:'flex',alignItems:'center',gap:17,pointerEvents:'none',
    transform:'translateY('+((1-reveal)*9)+'px)',
    fontFamily:AT_FONT,whiteSpace:'nowrap',overflow:'hidden',
  }}>
    <span style={{fontSize:31,fontWeight:810,letterSpacing:'-.03em',
      color:'#FFE0AA',textShadow:'0 0 24px rgba(244,190,119,.28)'}}>09:00</span>
    <span style={{height:31,width:2,background:'rgba(244,190,119,.47)'}}/>
    <span style={{fontSize:17,fontWeight:720,letterSpacing:'.065em',
      color:'#F2D3A9'}}>TICKETS ON SALE</span>
  </div>
);

const ArrivalCounter: React.FC<{reveal:number;value:number;frame:number}> = ({reveal,value,frame}) => (
  <div style={{
    position:'absolute',...SHOT02_TEXT_LANES.metric,zIndex:24,pointerEvents:'none',
    opacity:reveal,transform:'translateY('+((1-reveal)*16)+'px)',
    fontFamily:AT_FONT,whiteSpace:'nowrap',overflow:'hidden',
    background:'linear-gradient(90deg,rgba(3,14,27,.80),rgba(3,14,27,.08))',
    borderLeft:'2px solid rgba(88,234,192,.68)',padding:'11px 0 0 19px',
  }}>
    <div style={{fontSize:16,fontWeight:670,letterSpacing:'.045em',color:C.muted}}>
      ARRIVAL RATE · LOGIN REQUESTS / SECOND
    </div>
    <div style={{display:'flex',alignItems:'baseline',gap:17,marginTop:5}}>
      <span style={{fontSize:43,fontWeight:790,letterSpacing:'-.045em',
        color:C.ink,filter:'drop-shadow(0 0 '+(4+7*Math.abs(Math.sin(frame*.06)))+'px rgba(88,234,192,.22))'}}>
        {value}
      </span>
    </div>
  </div>
);

const SpokenRequestMarker:React.FC<{
  frame:number;cue:Shot02TermCue;nextStart:number;duration:number;
}>=({frame,cue,nextStart,duration})=>{
  const focus=shot02TermHold(frame,cue,nextStart,duration);
  if(focus<=.005)return null;
  return <div style={{
    position:'absolute',left:792,top:645,width:204,height:46,zIndex:14,
    display:'flex',alignItems:'center',justifyContent:'center',
    borderRadius:11,border:'1.5px solid '+C.cyan,
    background:'rgba(5,25,41,.96)',boxShadow:'0 0 15px rgba(89,217,244,.2)',
    fontFamily:AT_FONT,fontSize:17.5,fontWeight:780,
    letterSpacing:'.015em',color:C.ink,whiteSpace:'nowrap',
    opacity:focus,transform:'translateY('+((1-focus)*7)+'px)',
    pointerEvents:'none',
  }}>LOGIN REQUEST</div>;
};

const SemanticNodeHalo:React.FC<{cue:Shot02TermCue|null;frame:number}>=({cue,frame})=>{
  const term=cue?SPOKEN_TERMS.find(x=>x.id===cue.id):null;
  const node=term?.node?SHOT02_NODES[term.node]:null;
  if(!node||!cue||!term)return null;
  const appear=ease(frame,cue.startFrame,cue.startFrame+9);
  const disappear=1-ease(frame,cue.endFrame+16,cue.endFrame+38);
  const opacity=appear*disappear;
  return <div style={{
    position:'absolute',left:node.x-node.width/2-8,top:node.y-8,
    width:node.width+16,height:node.height+16,zIndex:13,
    border:'2px solid '+term.color,borderRadius:22,
    opacity:opacity*.80,pointerEvents:'none',
    boxShadow:'0 0 20px '+term.color+'33,inset 0 0 16px '+term.color+'16',
    transform:'scale('+(1.01+.012*appear)+')',
    transformOrigin:'50% 50%',
  }}/>;
};

const FocusedNodeInterior:React.FC<{
  node:Shot02FocusKey;focus:number;frame:number;
}>=({node,focus,frame})=>{
  if(focus<=.005)return null;
  const box=SHOT02_NODES[node];
  const auth=node==='auth';
  const rows=auth?['AUTH 01','AUTH 02','AUTH 03']:
    node==='gateway'?['REQUEST ENTRY','GATEWAY']:
    node==='balancer'?['DISTRIBUTION','AUTH ROUTING']:
      ['USER RECORDS','SHARED LOOKUP'];
  const color=node==='gateway'?C.cyan:node==='balancer'?C.mint:C.violet;
  const height=auth?230:Math.min(130,box.height-70);
  return <div style={{
    position:'absolute',left:box.x-box.width/2+12,top:box.y+58,
    width:box.width-24,height,zIndex:12,
    borderRadius:13,border:'1.5px solid '+color+'99',
    boxSizing:'border-box',
    background:'linear-gradient(180deg,rgba(6,28,45,.985),rgba(4,14,27,.998))',
    boxShadow:'0 0 '+(12+focus*24)+'px '+color+'33',
    transform:'translateY('+((1-focus)*9)+'px) scale('+(0.975+.025*focus)+')',
    transformOrigin:'50% 15%',opacity:focus,
    display:'flex',flexDirection:'column',justifyContent:'center',gap:auth?10:8,
    padding:auth?'13px 16px':'10px 12px',
    pointerEvents:'none',fontFamily:AT_FONT,overflow:'hidden',
  }}>
    {rows.map((label,i)=><div key={label} style={{
      minHeight:auth?47:38,borderRadius:8,display:'flex',
      alignItems:'center',justifyContent:'center',gap:9,
      border:'1px solid '+color+'66',
      background:'rgba(12,43,62,.95)',
      color:C.ink,fontSize:auth?19:node==='database'?16:16,
      fontWeight:770,letterSpacing:'-.025em',whiteSpace:'nowrap',
      boxShadow:'inset 0 0 14px '+color+'13',
    }}>
      <span style={{width:7,height:7,borderRadius:'50%',background:color,
        opacity:.65+.25*Math.sin(frame*.055+i*1.1)}}/>
      {label}
    </div>)}
  </div>;
};

const ReplicaRail:React.FC<{frame:number;reveal:number;focus:number}>=
({frame,reveal,focus})=>(
  <div style={{
    position:'absolute',left:WORLD.authX-185,top:687,width:370,height:66,
    display:'flex',gap:10,zIndex:10,pointerEvents:'none',
    opacity:reveal,transform:'translateY('+((1-reveal)*8)+'px)',
  }}>
    {['AUTH 01','AUTH 02','AUTH 03'].map((label,index)=>{
      const beat=.55+.45*Math.sin(frame*.075-index*.78);
      return <div key={label} style={{
        width:116,height:43,display:'flex',alignItems:'center',justifyContent:'center',
        borderRadius:9,fontFamily:AT_FONT,fontSize:16,fontWeight:720,
        letterSpacing:'.035em',color:C.ink,
        background:'rgba(8,26,41,.92)',
        border:'1.5px solid rgba(103,202,220,'+(.34+.46*focus)+')',
        boxShadow:'0 0 '+(5+focus*10)+'px rgba(88,234,192,'+(focus*beat*.12)+')',
      }}>
        <span style={{width:6,height:6,marginRight:8,borderRadius:'50%',
          background:C.mint,opacity:.45+.5*reveal}}/>
        {label}
      </div>;
    })}
  </div>
);

const ArchitectureWorld: React.FC<{
  frame:number;duration:number;starts:readonly number[];terms:readonly Shot02TermCue[];
}> = ({frame,duration,starts,terms}) => {
  const context=ease(frame,starts[0],starts[0]+22);
  const wave=ease(frame,starts[1],starts[1]+25);
  const gateway=ease(frame,terms[1].startFrame,terms[1].startFrame+24);
  const distribution=ease(frame,terms[2].startFrame,terms[2].startFrame+25);
  const authActivity=ease(frame,terms[3].startFrame,terms[3].startFrame+20);
  const arrival=ease(frame,terms[4].startFrame,terms[4].startFrame+22);
  const database=ease(frame,terms[6].startFrame,terms[6].startFrame+33);
  const camGateway=ease(frame,terms[1].startFrame,terms[1].startFrame+40);
  const camDb=ease(frame,terms[6].startFrame,terms[6].startFrame+42);
  const baseCamera={
    x:-55*context-215*camGateway-280*camDb,
    y:-8*camGateway-12*camDb,
    scale:1.018-.045*context+.04*camGateway+.028*camDb,
  };
  const focusWeights:Shot02FocusWeights={
    gateway:shot02TermHold(frame,terms[1],terms[2].startFrame,duration),
    balancer:shot02TermHold(frame,terms[2],terms[3].startFrame,duration),
    auth:Math.max(
      shot02TermHold(frame,terms[3],terms[4].startFrame,duration),
      shot02TermHold(frame,terms[5],terms[6].startFrame,duration)),
    database:shot02TermHold(frame,terms[6],duration+1,duration),
  };
  const {x:cameraX,y:cameraY,scale:cameraScale}=
    shot02FocusCamera(baseCamera,focusWeights);
  const tapStart=starts[2];
  const tapEnd=Math.max(tapStart+18,
    Math.min(terms[1].startFrame-2,terms[0].endFrame+45));
  const repeatedTap=shot02TapPulse(frame,tapStart,tapEnd);
  const requestMention=ease(frame,terms[0].startFrame,terms[0].startFrame+15);
  const flowBoost=shot02FlowIntensity(frame,terms[4].startFrame,
    terms[4].endFrame+32);
  const density=clamp(.18*context+.19*wave+.12*requestMention
    +.16*distribution+.15*database+.20*flowBoost);
  const active=activeSpokenTerm(frame,terms);
  const named=active?.id??null;
  const flowClock=shot02FlowClock(frame,terms[4].startFrame);
  const arrivalValue=Math.round((100+250*flowBoost)/10)*10;
  assertShot02TextLanes({x:cameraX,y:cameraY,scale:cameraScale});

  return (
    <ATBackground>
      <ATControlledRealismLayer frame={frame} realism={.97}
        architectureReveal={.27 + .42 * context + .23 * database}/>
      <AbsoluteFill style={{zIndex: 2, pointerEvents: 'none'}}>
        <div style={{
          position: 'absolute', ...SHOT02_TEXT_LANES.brand,
          color: 'rgba(161,208,236,.65)',
          font: '650 16px ' + AT_FONT, letterSpacing: '.19em',
        }}>ARCHITECTURAL THINKING</div>
        <div style={{
          position: 'absolute', left: 80, top: 82, height: 1, width: 258,
          background: 'linear-gradient(90deg,rgba(83,178,221,.46),transparent)',
        }}/>
      </AbsoluteFill>
      <ATCameraRig x={cameraX} y={cameraY} scale={cameraScale} zIndex={3}>
        <FlowPaths frame={frame} active={wave + gateway * .32}
          distribution={distribution} database={database} density={density}
          acceleration={flowBoost} tap={repeatedTap} clock={flowClock}/>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          transform: 'translate3d(-400px,-107px,0) scale(1.08)',
          transformOrigin: '50% 50%', opacity: 1 - .50 * camDb,
          filter: 'brightness(1.02) contrast(1.09) saturate(1.06)',
        }}>
          <Shot01ReadablePhone
            frame={frame} reveal={1} credential={.22} ui={0}
            emailValue="user@example.com" passwordDots="••••••••"
            emailFocus={0} passwordFocus={0} localUi={0}
            press={repeatedTap} waiting={0} spinner={0}
            realism={1} heroPush={0}
          />
        </div>
        <ATBackendNode
          title="API Gateway" x={WORLD.gatewayX} y={WORLD.gatewayY}
          width={SHOT02_NODES.gateway.width} height={SHOT02_NODES.gateway.height} reveal={1}
          active={clamp(gateway + (named==='API_GATEWAY' ? .36 : 0))}
          quiet={.82 * (1 - gateway)} secondaryReveal={gateway}
          zIndex={5}
          sections={[{title: 'ENTRY', items: [{label: 'Gateway', activity: gateway}]}]}
        />
        <ATBackendNode
          title="Load Balancer" x={WORLD.balancerX} y={WORLD.balancerY}
          width={SHOT02_NODES.balancer.width} height={SHOT02_NODES.balancer.height} reveal={1}
          active={clamp(distribution + (named==='LOAD_BALANCER' ? .35 : 0))}
          quiet={.82 * (1 - distribution)} secondaryReveal={distribution}
          zIndex={5}
          sections={[{title: 'ROUTING', items: [{label: 'Balancer', activity: distribution}]}]}
        />
        <ATBackendNode
          title="Auth Service" x={WORLD.authX} y={WORLD.authY}
          width={SHOT02_NODES.auth.width} height={SHOT02_NODES.auth.height} reveal={1}
          active={clamp(.10+.35*authActivity+.26*distribution+
            (named==='AUTH_SERVERS'||named==='AUTH_SERVERS_REPRISE'?.28:0))}
          quiet={.42 * (1 - distribution)} secondaryReveal={.68 + .32 * distribution}
          zIndex={6}
          sections={[{
            title: 'THREE AUTH REPLICAS',
            items: [
              {label: 'Auth01', activity: distribution},
              {label: 'Auth02', activity: distribution},
              {label: 'Auth03', activity: distribution},
            ],
          }]}
        />
        <ATBackendNode
          title="User Database" x={WORLD.databaseX} y={WORLD.databaseY}
          width={SHOT02_NODES.database.width} height={SHOT02_NODES.database.height}
          reveal={database} active={database*(named==='USER_DATABASE'?.75:.35)}
          quiet={.45} secondaryReveal={database} zIndex={7}
          sections={[{
            title: 'SHARED ACCOUNT LOOKUP',
            items: [{label: 'User records', activity: .08}],
          }]}
        />
        <ReplicaRail frame={frame} reveal={authActivity} focus={
          named==='AUTH_SERVERS'||named==='AUTH_SERVERS_REPRISE'?1:.3}/>
        <FocusedNodeInterior node="gateway" focus={focusWeights.gateway} frame={frame}/>
        <FocusedNodeInterior node="balancer" focus={focusWeights.balancer} frame={frame}/>
        <FocusedNodeInterior node="auth" focus={focusWeights.auth} frame={frame}/>
        <FocusedNodeInterior node="database" focus={focusWeights.database} frame={frame}/>
        <SpokenRequestMarker frame={frame} cue={terms[0]}
          nextStart={terms[1].startFrame} duration={duration}/>
        <SemanticNodeHalo cue={active} frame={frame}/>
      </ATCameraRig>
      <ContextLabel reveal={context}/>
      <ArrivalCounter reveal={arrival} value={arrivalValue} frame={frame}/>
    </ATBackground>
  );
};

export const Shot02GeneratedScene: React.FC<Shot02GeneratedSceneProps> = (props) => {
  const frame = useCurrentFrame();
  const video = useVideoConfig();
  const duration = props.durationInFrames;
  if (video.fps !== 30 || video.durationInFrames !== duration) {
    throw new Error('SHOT02_REQUIRES_30FPS_EXACT_VOICE_DURATION');
  }
  const verified = requireShot02VerifiedCues(
    duration, props.voiceTakeId, props.timingMode, props.verifiedCues,
  );
  const terms = requireShot02SpokenTerms(duration, verified, props.termCues);
  return <ArchitectureWorld frame={frame} duration={duration}
    starts={verified.map(cue => cue.startFrame)} terms={terms}/>;
};
