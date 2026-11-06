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

export type Shot02VerifiedCue = {
  beatNumber: number;
  spokenAnchor: string;
  startFrame: number;
  endFrame: number;
};

export type Shot02GeneratedSceneProps = {
  durationInFrames: number;
  voiceTakeId: string;
  timingMode: 'ELEVENLABS_CHARACTER_TIMESTAMPS';
  verifiedCues: Shot02VerifiedCue[];
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
  gatewayX: 934,
  gatewayY: 420,
  balancerX: 1161,
  balancerY: 420,
  authX: 1510,
  authY: 298,
  databaseX: 2140,
  databaseY: 421,
} as const;

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
        return (
          <g key={y}>
            <path d={branch} fill="none" stroke="#335474" strokeWidth={6} opacity=".38"/>
            <path d={branch} fill="none" stroke={C.mint} strokeWidth={2.1}
              opacity={distribution * (.38 + .18 * Math.sin(frame * .05 + i))}/>
            <circle cx={1280 + 127 * p} cy={525 + (y - 525) * p}
              r={3.1} fill={C.mint} opacity={distribution * density * .66}/>
            <path d={dbPath} fill="none" stroke="#335474" strokeWidth={6}
              opacity={database * .45}/>
            <path d={dbPath} fill="none" stroke={C.violet} strokeWidth={2.1}
              opacity={database * (.4 + .13 * Math.sin(frame * .035 + i))}/>
          </g>
        );
      })}
      <ArrivalWave frame={frame} density={density}/>
    </svg>
  );
};

const ContextLabel: React.FC<{reveal: number}> = ({reveal}) => (
  <div style={{
    position: 'absolute', left: 1460, top: 122, padding: '10px 15px',
    background: 'rgba(8,24,39,.86)', border: '1px solid rgba(244,190,119,.39)',
    borderRadius: 11, opacity: reveal, color: '#FFE4BD', zIndex: 10,
    fontFamily: AT_FONT, fontSize: 17, fontWeight: 720,
    letterSpacing: '.065em',
  }}>
    09:00 · TICKETS ON SALE
  </div>
);

const ArrivalCounter: React.FC<{reveal: number; count: number}> = ({reveal, count}) => (
  <div style={{
    position: 'absolute', left: 780, top: 810, zIndex: 11, width: 375,
    border: '1px solid rgba(83,198,223,.38)', borderRadius: 13,
    background: 'rgba(5,21,35,.92)', padding: '17px 19px',
    boxShadow: '0 10px 30px rgba(0,0,0,.24)', opacity: reveal, fontFamily: AT_FONT,
  }}>
    <div style={{fontSize: 15, letterSpacing: '.055em', color: C.muted}}>
      New Login arrivals/s
    </div>
    <div style={{fontSize: 43, fontWeight: 780, letterSpacing: '-.03em', color: C.ink}}>
      {count}
      <span style={{fontSize: 14, color: C.mint, marginLeft: 14}}>ILLUSTRATIVE</span>
    </div>
  </div>
);

const ArchitectureWorld: React.FC<{
  frame: number; duration: number; starts: readonly number[];
}> = ({frame, duration, starts}) => {
  const context = ease(frame, starts[0], starts[0] + 24);
  const wave = ease(frame, starts[1], starts[1] + 30);
  const gateway = ease(frame, starts[2], starts[2] + 28);
  const distribution = ease(frame, starts[2] + 10, starts[2] + 48);
  const arrival = ease(frame, starts[3], starts[3] + 24);
  const database = ease(frame, starts[4], starts[4] + 33);
  const camGateway = ease(frame, starts[2], starts[2] + 45);
  const camDb = ease(frame, starts[4], starts[4] + 35);

  // The illustration enters a higher rate only after the narrated "arrival rate" beat.
  // Later 650/900 examples belong to SHOT03's separately reviewed spoken cues.
  const arrivalValue = frame < starts[4] ? 100 : 350;
  const density = .2 + wave * .34 + distribution * .19 + database * .20;
  const cameraX = -40 * context - 190 * camGateway - 320 * camDb;
  const cameraY = -8 * camGateway - 12 * camDb;
  const cameraScale = 1.018 - .045 * context + .04 * camGateway + .028 * camDb;
  const lastFrames = Math.max(0, duration - frame);

  return (
    <ATBackground>
      <ATControlledRealismLayer frame={frame} realism={.97}
        architectureReveal={.27 + .42 * context + .23 * database}/>
      <AbsoluteFill style={{zIndex: 2, pointerEvents: 'none'}}>
        <div style={{
          position: 'absolute', left: 80, top: 48, color: 'rgba(161,208,236,.65)',
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
          width={222} height={205} reveal={1} active={gateway}
          quiet={.82 * (1 - gateway)} secondaryReveal={gateway}
          zIndex={5}
          sections={[{title: 'ENTRY', items: [{label: 'Gateway', activity: gateway}]}]}
        />
        <ATBackendNode
          title="Load Balancer" x={WORLD.balancerX} y={WORLD.balancerY}
          width={240} height={205} reveal={1} active={distribution}
          quiet={.82 * (1 - distribution)} secondaryReveal={distribution}
          zIndex={5}
          sections={[{title: 'ROUTING', items: [{label: 'Balancer', activity: distribution}]}]}
        />
        <ATBackendNode
          title="Auth Service" x={WORLD.authX} y={WORLD.authY}
          width={395} height={354} reveal={1}
          active={.13 + .47 * distribution + .18 * database}
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
          width={274} height={224} reveal={database} active={database * .14}
          quiet={.45} secondaryReveal={database} zIndex={7}
          sections={[{
            title: 'SHARED ACCOUNT LOOKUP',
            items: [{label: 'User records', activity: .08}],
          }]}
        />
        <ContextLabel reveal={context}/>
        <ArrivalCounter reveal={arrival} count={arrivalValue}/>
        <div style={{
          position: 'absolute', left: 1735, top: 770, width: 320, zIndex: 9,
          opacity: database * clamp(lastFrames / 20), color: C.muted,
          font: '560 17px ' + AT_FONT,
        }}>SHARED DEPENDENCY · PRESSURE BEGINS</div>
      </ATCameraRig>
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
  return <ArchitectureWorld frame={frame} duration={duration}
    starts={verified.map(cue => cue.startFrame)}/>;
};
