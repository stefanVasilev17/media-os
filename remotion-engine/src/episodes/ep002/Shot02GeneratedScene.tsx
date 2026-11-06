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
  headline: string;
  detail: string;
  node: 'gateway'|'balancer'|'auth'|'database'|null;
  color: string;
}[] = [
  {id:'LOGIN_REQUEST',anchor:'Login request',headline:'LOGIN REQUEST',
    detail:'ONE NEW REQUEST ENTERS THE SYSTEM',node:null,color:C.cyan},
  {id:'API_GATEWAY',anchor:'API Gateway',headline:'API GATEWAY',
    detail:'ENTRY BOUNDARY',node:'gateway',color:C.cyan},
  {id:'LOAD_BALANCER',anchor:'Load Balancer',headline:'LOAD BALANCER',
    detail:'DISTRIBUTES REQUESTS',node:'balancer',color:C.mint},
  {id:'AUTH_SERVERS',anchor:'Auth servers',headline:'AUTH SERVERS',
    detail:'THREE AUTH REPLICAS',node:'auth',color:C.violet},
  {id:'ARRIVAL_RATE',anchor:'arrival rate',headline:'ARRIVAL RATE',
    detail:'NEW LOGIN REQUESTS PER SECOND',node:null,color:C.mint},
  {id:'AUTH_SERVERS_REPRISE',anchor:'Auth servers',headline:'AUTH SERVERS',
    detail:'THREE SERVICES · ONE SHARED DATABASE',node:'auth',color:C.violet},
  {id:'USER_DATABASE',anchor:'User Database',headline:'USER DATABASE',
    detail:'SHARED ACCOUNT LOOKUP',node:'database',color:C.violet},
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
     ||terms[0].startFrame>=beats[2].startFrame
     ||terms[1].startFrame!==beats[2].startFrame
     ||terms[4].startFrame!==beats[3].startFrame
     ||terms[6].startFrame!==beats[4].startFrame
     ||terms[3].startFrame>=beats[3].startFrame
     ||terms[5].startFrame>=beats[4].startFrame)
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

const ArrivalWave: React.FC<{frame: number; density: number}> = ({frame, density}) => (
  <g>
    {Array.from({length: 18}, (_, i) => {
      const available = density * 18 > i;
      const progress = ((frame * .013 + i * .187) % 1 + 1) % 1;
      const p = requestPoint(progress);
      return (
        <g key={i} opacity={available ? clamp(density * 1.15) * (.22 + .55 * (1 - Math.abs(2 * progress - 1))) : 0}>
          <circle cx={p.x} cy={p.y} r={3.2} fill={i % 3 === 0 ? C.mint : C.cyan}/>
        </g>
      );
    })}
  </g>
);

const FlowPaths: React.FC<{
  frame: number; active: number; distribution: number; database: number; density: number;
}> = ({frame, active, distribution, database, density}) => {
  const authYs = [416, 493, 571] as const;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080"
      style={{position: 'absolute', inset: 0, zIndex: 1, overflow: 'visible', pointerEvents: 'none'}}>
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
        fill="none" stroke="url(#ep002-s02-main-path)" strokeWidth={2.5}
        strokeLinecap="round" opacity={.27 + active * .48}/>
      {authYs.map((y, i) => {
        const branch = 'M 1280 525 C 1358 525 1360 ' + y + ' 1407 ' + y;
        const destination = i === 0 ? 400 : i === 1 ? 475 : 552;
        const dbPath = 'M 1708 ' + destination + ' C 1870 ' + destination + ' 1910 531 2015 531';
        const p = ((frame * .010 + i / 3) % 1 + 1) % 1;
        const q = 1 - p;
        const branchX=q*q*q*1280+3*q*q*p*1358+3*q*p*p*1360+p*p*p*1407;
        const branchY=q*q*q*525+3*q*q*p*525+3*q*p*p*y+p*p*p*y;
        const dbX=q*q*q*1708+3*q*q*p*1870+3*q*p*p*1910+p*p*p*2015;
        const dbY=q*q*q*destination+3*q*q*p*destination
          +3*q*p*p*531+p*p*p*531;
        return (
          <g key={y}>
            <path d={branch} fill="none" stroke="#335474" strokeWidth={6} opacity=".38"/>
            <path d={branch} fill="none" stroke={C.mint} strokeWidth={2.1}
              opacity={distribution * (.38 + .18 * Math.sin(frame * .05 + i))}/>
            <circle cx={branchX} cy={branchY}
              r={3.3} fill={C.mint} opacity={distribution * density * .66}
              style={{filter:'drop-shadow(0 0 4px rgba(88,234,192,.48))'}}/>
            <path d={dbPath} fill="none" stroke="#335474" strokeWidth={6}
              opacity={database * .45}/>
            <path d={dbPath} fill="none" stroke={C.violet} strokeWidth={2.1}
              opacity={database * (.4 + .13 * Math.sin(frame * .035 + i))}/>
            <circle cx={dbX} cy={dbY} r={3.8} fill={i%2===0?C.mint:C.violet}
              opacity={database * density * (.50 + .22*Math.sin(frame*.03+i))}
              style={{filter:'drop-shadow(0 0 6px rgba(179,163,255,.42))'}}/>
          </g>
        );
      })}
      <ArrivalWave frame={frame} density={density}/>
    </svg>
  );
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
      NEW LOGIN ARRIVALS / SECOND
    </div>
    <div style={{display:'flex',alignItems:'baseline',gap:17,marginTop:5}}>
      <span style={{fontSize:43,fontWeight:790,letterSpacing:'-.045em',
        color:C.ink,filter:'drop-shadow(0 0 '+(4+7*Math.abs(Math.sin(frame*.06)))+'px rgba(88,234,192,.22))'}}>
        {value}
      </span>
      <span style={{fontSize:13,letterSpacing:'.085em',fontWeight:690,color:C.mint}}>
        ILLUSTRATIVE · NOT LIVE TELEMETRY
      </span>
    </div>
  </div>
);

const SemanticTermHud:React.FC<{frame:number;cue:Shot02TermCue|null}>=({frame,cue})=>{
  const term=cue?SPOKEN_TERMS.find(x=>x.id===cue.id):null;
  if(!cue||!term)return null;
  const appear=ease(frame,cue.startFrame,cue.startFrame+8);
  const fade=1-ease(frame,cue.endFrame+15,cue.endFrame+36);
  const opacity=appear*fade;
  return <div style={{
    position:'absolute',...SHOT02_TEXT_LANES.term,zIndex:26,
    fontFamily:AT_FONT,opacity,pointerEvents:'none',
    overflow:'hidden',whiteSpace:'nowrap',
    transform:'translate3d('+((1-appear)*18)+'px,0,0)',
  }}>
    <div style={{display:'flex',alignItems:'center',gap:12,marginTop:7}}>
      <div style={{width:8,height:8,borderRadius:'50%',background:term.color,
        boxShadow:'0 0 20px '+term.color}}/>
      <span style={{fontSize:14,fontWeight:740,letterSpacing:'.17em',
        color:'rgba(177,207,230,.72)'}}>NOW IN FOCUS</span>
    </div>
    <div style={{fontSize:38,fontWeight:790,letterSpacing:'-.037em',marginTop:5,
      lineHeight:'1.22',color:C.ink,textShadow:'0 0 28px rgba(72,155,207,.13)'}}>
      {term.headline}
    </div>
    <div style={{fontSize:17,fontWeight:640,letterSpacing:'.07em',marginTop:5,
      color:term.color}}>{term.detail}</div>
    <div style={{position:'absolute',bottom:0,left:0,height:2,width:(appear*100)+'%',
      maxWidth:510,background:'linear-gradient(90deg,'+term.color+',transparent)',
      opacity:.65}}/>
  </div>;
};

const SemanticNodeHalo:React.FC<{cue:Shot02TermCue|null;frame:number}>=({cue,frame})=>{
  const term=cue?SPOKEN_TERMS.find(x=>x.id===cue.id):null;
  const node=term?.node?SHOT02_NODES[term.node]:null;
  if(!node||!cue)return null;
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
  const cameraX=-55*context-215*camGateway-280*camDb;
  const cameraY=-8*camGateway-12*camDb;
  const cameraScale=1.018-.045*context+.04*camGateway+.028*camDb;
  const requestMention=ease(frame,terms[0].startFrame,terms[0].startFrame+15);
  const density=.21*context+.25*wave+.11*requestMention+.18*distribution+.17*database;
  const active=activeSpokenTerm(frame,terms);
  const named=active?.id??null;
  const countTransition=ease(frame,terms[4].endFrame+4,
    Math.max(terms[4].endFrame+10,terms[6].startFrame-10));
  const arrivalValue=Math.round((100+250*countTransition)/10)*10;
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
          distribution={distribution} database={database} density={density}/>
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
            press={0} waiting={0} spinner={0}
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
        <SemanticNodeHalo cue={active} frame={frame}/>
      </ATCameraRig>
      <ContextLabel reveal={context}/>
      <ArrivalCounter reveal={arrival} value={arrivalValue} frame={frame}/>
      <SemanticTermHud frame={frame} cue={active}/>
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
