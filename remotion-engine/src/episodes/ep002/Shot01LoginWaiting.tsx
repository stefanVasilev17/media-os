import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  ATBackground,
  ATBackendNode,
  ATCameraRig,
  ATControlledRealismLayer,
  AT_FONT,
  ATPhone,
} from '../../components/architectural-thinking';

export type Shot01LoginWaitingProps = {
  durationInFrames: number;
  presentation: 'STORYBOARD_PREVIEW_V1';
  beatStartFrames?: number[];
  timingMode?: 'ELEVENLABS_CHARACTER_TIMESTAMPS' | 'PROVISIONAL_STORYBOARD';
};

const C = {
  cyan: '#59D9F4',
  turquoise: '#54E9D8',
  violet: '#B3A3FF',
  green: '#58EAC0',
  amber: '#F4BE77',
  ink: '#EAF6FF',
  muted: '#8BA9C3',
};

const ease = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const shot01CueStarts = (duration: number, input?: number[]): number[] => {
  if (input?.length === 5 && input.every((value, index) =>
    Number.isInteger(value) && value >= 0 && value < duration &&
    (index === 0 || value > input[index - 1]))) {
    return input;
  }
  return [0.04, 0.19, 0.37, 0.57, 0.84].map((value) =>
    Math.min(duration - 1, Math.round(duration * value)));
};

const TimeRail: React.FC<{frame: number; reveal: number; rewind: number}> = ({frame, reveal, rewind}) => {
  const shimmer = 0.5 + 0.5 * Math.sin(frame * 0.045);
  return (
    <div style={{
      position: 'absolute', left: 335, top: 930, width: 520, height: 82,
      opacity: reveal, transform: `translateY(${(1 - reveal) * 12}px) scaleX(${1 - rewind * 0.88})`,
      transformOrigin: '12% 50%', fontFamily: AT_FONT, zIndex: 13,
    }}>
      <div style={{
        position: 'absolute', top: 15, left: 0, width: '100%', height: 2,
        background: 'linear-gradient(90deg,rgba(244,190,119,.70),rgba(244,190,119,.25) 68%,rgba(244,190,119,0))',
        boxShadow: '0 0 19px rgba(244,190,119,.16)',
      }}/>
      {[0, 1, 2, 3, 4, 5, 6].map((tick) => (
        <div key={tick} style={{
          position: 'absolute', top: tick % 2 === 0 ? 7 : 11, left: tick * 68,
          width: 2, height: tick % 2 === 0 ? 18 : 10,
          background: 'rgba(244,190,119,.42)', borderRadius: 2,
        }}/>
      ))}
      <div style={{
        position: 'absolute', top: 10, left: 22 + shimmer * 355,
        height: 11, width: 11, borderRadius: '50%',
        background: C.amber, boxShadow: '0 0 20px rgba(244,190,119,.63)',
      }}/>
      <div style={{
        position: 'absolute', top: 44, left: 0, fontSize: 17, fontWeight: 690,
        letterSpacing: '.10em', color: 'rgba(248,206,147,.88)',
      }}>TIME PASSES · NO RESPONSE</div>
    </div>
  );
};

const RewindMarker: React.FC<{reveal: number; frame: number}> = ({reveal, frame}) => (
  <div style={{
    position: 'absolute', left: 1428, top: 114, width: 294, height: 142,
    opacity: reveal, transform: `translateY(${(1 - reveal) * 24}px) scale(${0.93 + 0.07 * reveal})`,
    transformOrigin: '50% 50%', zIndex: 17, pointerEvents: 'none', fontFamily: AT_FONT,
  }}>
    <div style={{
      position: 'absolute', left: 0, top: 11, width: 122, height: 122, borderRadius: '50%',
      border: '2px solid rgba(244,190,119,.68)',
      boxShadow: '0 0 32px rgba(244,190,119,.12),inset 0 0 30px rgba(244,190,119,.06)',
      transform: `rotate(${-reveal * 75}deg)`,
    }}>
      <div style={{
        position: 'absolute', top: 13, left: 7, width: 21, height: 2,
        background: C.amber, transform: 'rotate(-25deg)',
        boxShadow: '0 0 10px rgba(244,190,119,.65)',
      }}/>
      <div style={{
        position: 'absolute', top: 50, left: 46, fontSize: 34, fontWeight: 550,
        color: C.amber, opacity: .82,
      }}>↶</div>
    </div>
    <div style={{
      position: 'absolute', left: 143, top: 33, color: C.amber, fontSize: 17,
      fontWeight: 730, letterSpacing: '.12em',
    }}>REWIND</div>
    <div style={{
      position: 'absolute', left: 139, top: 61, color: C.ink,
      fontSize: 48, fontWeight: 810, letterSpacing: '-.045em',
      textShadow: '0 0 26px rgba(129,197,255,.14)',
    }}>09:00</div>
  </div>
);

const HealthProbes: React.FC<{reveal: number; quiet: number; frame: number}> = ({reveal, quiet, frame}) => {
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.13);
  return (
    <div style={{
      position: 'absolute', left: 1335, top: 685, width: 360, zIndex: 13,
      opacity: reveal * (1 - quiet * .63),
      transform: `translateY(${(1 - reveal) * 14}px)`,
      fontFamily: AT_FONT, pointerEvents: 'none',
    }}>
      <div style={{
        color: 'rgba(131,182,192,.8)', fontWeight: 700, letterSpacing: '.10em',
        fontSize: 13, marginBottom: 12,
      }}>ILLUSTRATIVE SHALLOW HEALTH PROBES</div>
      {['Liveness: PASS', 'Readiness: PASS'].map((label, index) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 9,
          padding: '10px 14px', borderRadius: 13,
          background: 'linear-gradient(90deg,rgba(4,36,33,.84),rgba(4,27,30,.58))',
          border: '1px solid rgba(88,234,192,.35)',
          boxShadow: `0 0 ${9 + pulse * 10}px rgba(88,234,192,.045)`,
        }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: C.green, opacity: .75 + pulse * .25,
            boxShadow: `0 0 ${9 + pulse * 8}px rgba(88,234,192,.44)`,
          }}/>
          <span style={{
            fontSize: 19, fontWeight: 690, color: '#B8FFE6', letterSpacing: '-.015em',
          }}>{label}</span>
          <span style={{marginLeft: 'auto', color: 'rgba(135,218,198,.49)', fontSize: 14}}>
            0{index + 1}
          </span>
        </div>
      ))}
    </div>
  );
};

function ArchitectureWorld({
  frame, duration, beatStartFrames,
}: {
  frame: number; duration: number; beatStartFrames?: number[];
}) {
  const cues = shot01CueStarts(duration, beatStartFrames);
  const press = ease(frame, cues[0] - 3, cues[0] + 6) *
    (1 - ease(frame, cues[0] + 7, cues[0] + 16));
  const working = ease(frame, cues[0] + 5, cues[0] + 16);
  const focusReturn = ease(frame, cues[3], cues[3] + 34);
  const focusAuth = ease(frame, cues[2], cues[2] + 49) * (1 - focusReturn);
  const health = ease(frame, cues[2] + 12, cues[2] + 45);
  const timeRail = ease(frame, cues[1], cues[1] + 31);
  const rewind = ease(frame, cues[4], Math.min(duration - 1, cues[4] + 28));
  const railVisible = timeRail * (1 - rewind);
  const cameraX = -115 * focusAuth + 76 * rewind;
  const cameraY = 10 * focusAuth - 25 * rewind;
  const cameraScale = 1.018 + .043 * focusAuth - .067 * rewind;
  const phoneEmphasis = clamp(1 - .33 * focusAuth);
  const authEmphasis = .42 + .58 * focusAuth + .17 * health * (1 - focusAuth);
  const healthQuiet = focusReturn;
  const breathe = .55 + .45 * Math.sin(frame * .065);

  return (
    <ATBackground>
      <ATControlledRealismLayer
        frame={frame} realism={.96}
        architectureReveal={.10 + focusAuth * .45}
      />
      <AbsoluteFill style={{zIndex: 2, pointerEvents: 'none'}}>
        <div style={{
          position: 'absolute', top: 48, left: 80, color: 'rgba(142,196,223,.52)',
          font: `650 16px ${AT_FONT}`, letterSpacing: '.19em',
        }}>ARCHITECTURAL THINKING</div>
        <div style={{
          position: 'absolute', top: 82, left: 80, height: 1, width: 258,
          background: 'linear-gradient(90deg,rgba(83,178,221,.46),transparent)',
        }}/>
        <div style={{
          position: 'absolute', inset: '30% 5% 1% 12%', opacity: .30,
          background: 'radial-gradient(ellipse at 45% 85%,rgba(33,95,160,.15),transparent 64%)',
        }}/>
      </AbsoluteFill>
      <ATCameraRig x={cameraX} y={cameraY} scale={cameraScale} zIndex={3}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080"
          style={{position: 'absolute', inset: 0, overflow: 'visible', zIndex: 1}}>
          <defs>
            <linearGradient id="ep002-v2-path" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3BCACB" stopOpacity=".46"/>
              <stop offset="50%" stopColor="#5A83CD" stopOpacity=".30"/>
              <stop offset="100%" stopColor="#AB92FF" stopOpacity=".45"/>
            </linearGradient>
            <radialGradient id="ep002-v2-depth">
              <stop offset="0%" stopColor="#2D5682" stopOpacity=".11"/>
              <stop offset="100%" stopColor="#010711" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="1190" cy="570" rx="755" ry="390" fill="url(#ep002-v2-depth)"/>
          <path d="M 725 590 C 810 590 786 525 858 525 H 1045 C 1112 525 1100 525 1150 525 H 1330"
            stroke="#162F4A" strokeWidth="9" strokeLinecap="round" fill="none" opacity=".53"/>
          <path d="M 725 590 C 810 590 786 525 858 525 H 1045 C 1112 525 1100 525 1150 525 H 1330"
            stroke="url(#ep002-v2-path)" strokeWidth="2.2" strokeLinecap="round"
            fill="none" opacity={.26 + focusAuth * .19}/>
          <path d="M 1090 552 L 1090 767 L 1280 767"
            stroke="#31517B" strokeWidth="1.5" opacity=".16" strokeDasharray="11 16"
            fill="none"/>
          <path d="M 1280 767 L 1510 767" stroke="#31517B" strokeWidth="1.3"
            opacity=".11" fill="none"/>
          <circle cx="857" cy="525" r="4" fill="#6BC1E3" opacity=".38"/>
          <circle cx="1324" cy="525" r="5" fill={C.violet} opacity={.25 + focusAuth * .34}/>
          <path d="M 330 897 Q 760 838 1190 917 T 1880 932"
            stroke="#477BA9" strokeOpacity=".10" strokeWidth="1.2" fill="none"/>
        </svg>
        <div style={{position: 'absolute', inset: 0, opacity: .17, filter: 'saturate(.58) brightness(.64)', zIndex: 2}}>
          <ATBackendNode
            title="API Gateway" x={934} y={420} width={222} height={205}
            reveal={1} active={0} quiet={.95} zIndex={2}
            sections={[{title: 'ENTRY', items: [{label: 'Gateway'}]}]}
          />
          <ATBackendNode
            title="Load Balancer" x={1161} y={420} width={240} height={205}
            reveal={1} active={0} quiet={.95} zIndex={2}
            sections={[{title: 'ROUTING', items: [{label: 'Balancer'}]}]}
          />
        </div>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 4, opacity: authEmphasis,
          filter: `saturate(${.72 + focusAuth * .28}) brightness(${.79 + focusAuth * .21})`,
        }}>
          <ATBackendNode
            title="Auth Service" x={1510} y={298} width={395} height={354}
            reveal={1} active={.1 + health * .28 + focusAuth * .34}
            quiet={.58 * (1 - focusAuth)}
            secondaryReveal={.66 + focusAuth * .34}
            zIndex={4}
            sections={[{
              title: 'KNOWN IDENTITY',
              items: [{label: 'Auth01', activity: .10 + health * .29}, {label: 'Service', activity: 0}],
            }]}
          />
          <div style={{
            position: 'absolute', left: 1669, top: 314, width: 13, height: 13,
            borderRadius: '50%', background: C.green, opacity: health * (.56 + breathe * .44),
            boxShadow: `0 0 ${10 + breathe * 18}px rgba(88,234,192,.58)`, zIndex: 7,
          }}/>
        </div>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 8,
          transform: 'translate3d(-400px,-107px,0) scale(1.08)',
          transformOrigin: '50% 50%', opacity: phoneEmphasis,
          filter: `brightness(${1 - focusAuth * .11})`,
        }}>
          <ATPhone
            frame={frame} reveal={1} credential={.22} ui={0}
            emailValue="user@example.com" passwordDots="••••••••"
            emailFocus={0} passwordFocus={0} localUi={working}
            press={press} waiting={working} spinner={working}
            realism={1} heroPush={0}
          />
        </div>
        <HealthProbes reveal={health} quiet={healthQuiet} frame={frame}/>
        <TimeRail frame={frame} reveal={railVisible} rewind={rewind}/>
        <RewindMarker reveal={rewind} frame={frame}/>
      </ATCameraRig>
      <div style={{
        position: 'absolute', left: 90, bottom: 43, zIndex: 9,
        fontFamily: AT_FONT, fontSize: 14, fontWeight: 610,
        color: 'rgba(156,189,214,.45)', letterSpacing: '.045em',
      }}>SHALLOW HEALTH DOES NOT GUARANTEE LOGIN COMPLETION</div>
    </ATBackground>
  );
}

export const Shot01LoginWaiting: React.FC<Shot01LoginWaitingProps> = ({
  durationInFrames, beatStartFrames,
}) => {
  const frame = useCurrentFrame();
  const config = useVideoConfig();
  const duration = Math.max(1, durationInFrames || config.durationInFrames);
  return <ArchitectureWorld frame={frame} duration={duration} beatStartFrames={beatStartFrames}/>;
};
