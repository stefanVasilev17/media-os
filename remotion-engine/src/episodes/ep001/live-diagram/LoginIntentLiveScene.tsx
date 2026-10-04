import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS} from '../../../design-system/tokens';
import {SHOT01, SHOT01_FPS} from './shot01Timing';

export const loginIntentLiveSceneSchema = z.object({
  showGuides: z.boolean(),
  viewMode: z.enum(['shot', 'world']),
});

type Props = z.infer<typeof loginIntentLiveSceneSchema>;

const SECTION_HEIGHT = 148;
const PANEL_BORDER = 7;
const PANEL_WIDTH = 570;
const WORLD_WIDTH = 760;
const WORLD_HEIGHT = 1620;
const PANEL_BOTTOM = 650;
const PHONE_TOP = 850;

const reveal = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

const pulse = (frame: number, start: number, end: number, fade = 12) => {
  const on = reveal(frame, start, Math.min(start + fade, end));
  const off = 1 - reveal(frame, Math.max(start, end - fade), end);
  return Math.min(on, off);
};

const focusWindow = (frame: number, start: number, end: number, fade = 18) => {
  const enter = reveal(frame, start, start + fade);
  const exit = 1 - reveal(frame, Math.max(start + fade, end - fade), end);
  return Math.min(enter, exit);
};

const panelMetrics = (frame: number) => {
  const credentialExpand = reveal(
    frame,
    SHOT01.credentialInput.start - 10,
    SHOT01.credentialInput.revealEnd,
  );
  const uiExpand = reveal(
    frame,
    SHOT01.localUiState.start - 10,
    SHOT01.localUiState.revealEnd,
  );
  const innerHeight = SECTION_HEIGHT * (1 + credentialExpand + uiExpand);
  return {
    height: innerHeight + PANEL_BORDER * 2,
    credentialExpand,
    uiExpand,
  };
};

const LoginIcon = () => (
  <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
    <path d="M29 14H16C12.7 14 10 16.7 10 20V44C10 47.3 12.7 50 16 50H29" stroke="#C96BFF" strokeWidth="4" strokeLinecap="round"/>
    <path d="M28 32H53M44 23L53 32L44 41" stroke="#F0CEFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
    <circle cx="24" cy="24" r="11" stroke="#E0D8FF" strokeWidth="4"/>
    <path d="M32 32L52 52M43 43L49 37M48 48L54 42" stroke="#E0D8FF" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

const DeviceIcon = () => (
  <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
    <rect x="15" y="10" width="34" height="44" rx="5" stroke="#DCD9FF" strokeWidth="4"/>
    <path d="M24 17H40M25 46H39" stroke="#DCD9FF" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const Pill: React.FC<{
  label: string;
  progress: number;
  activity?: number;
  width?: number;
}> = ({label, progress, activity = 0, width}) => {
  const lift = activity * 2;
  const borderAlpha = 0.78 + activity * 0.22;
  const glowAlpha = 0.06 + activity * 0.28;

  return (
    <div
      style={{
        minWidth: width ?? 146,
        height: 47,
        padding: '0 17px',
        borderRadius: 14,
        border: `3px solid rgba(31,212,149,${borderAlpha})`,
        background: `linear-gradient(180deg,rgba(12,76,55,${0.42 + activity * 0.48}) 0%,rgba(6,28,20,.98) 100%)`,
        boxShadow: `0 0 ${10 + activity * 28}px rgba(40,238,163,${glowAlpha}), inset 0 1px 0 rgba(112,255,205,${0.08 + activity * 0.14}), inset 0 -8px 18px rgba(0,0,0,.18)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F8FFFC',
        fontSize: 29,
        fontWeight: activity > 0.45 ? 680 : 520,
        letterSpacing: '-0.025em',
        opacity: progress,
        filter: `brightness(${0.96 + activity * 0.18}) saturate(${1.05 + activity * 0.18})`,
        transform: `translateY(${(1 - progress) * 9 - lift}px) scale(${0.97 + progress * 0.03 + activity * 0.012})`,
      }}
    >
      {label}
    </div>
  );
};

const Section: React.FC<{
  top: number;
  title: string;
  icon: React.ReactNode;
  progress: number;
  focus: number;
  divider?: boolean;
  children: React.ReactNode;
}> = ({top, title, icon, progress, focus, divider = true, children}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left: 0,
      right: 0,
      height: SECTION_HEIGHT,
      padding: '13px 20px 12px',
      boxSizing: 'border-box',
      opacity: progress,
      filter: `brightness(${0.84 + focus * 0.20})`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 4,
        borderRadius: 18,
        background: `radial-gradient(circle at 32% 44%,rgba(139,75,255,${0.035 + focus * 0.10}) 0%,transparent 67%)`,
      }}
    />
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transform: `translateX(${(1 - progress) * -13}px)`,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 11,
          background: 'linear-gradient(180deg,#0A1525 0%,#060D18 100%)',
          display: 'grid',
          placeItems: 'center',
          border: '1px solid rgba(156,97,255,.18)',
          boxShadow: `0 0 ${8 + focus * 20}px rgba(171,92,255,${0.07 + focus * 0.16}), inset 0 0 16px rgba(125,92,255,.10)`,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: focus > 0.45 ? 710 : 630,
          letterSpacing: '-0.025em',
          color: COLORS.primaryText,
          textShadow: `0 0 ${focus * 18}px rgba(226,202,255,${focus * 0.18})`,
        }}
      >
        {title}
      </div>
    </div>
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        gap: 18,
        marginTop: 10,
        alignItems: 'center',
      }}
    >
      {children}
    </div>
    {divider ? (
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 0,
          height: 3,
          borderRadius: 99,
          background: 'linear-gradient(90deg,transparent 0%,#8A36F2 10%,#BE6CFF 50%,#8A36F2 90%,transparent 100%)',
          opacity: 0.50 + focus * 0.30,
          boxShadow: `0 0 ${12 + focus * 14}px rgba(181,83,255,${0.14 + focus * 0.16})`,
        }}
      />
    ) : null}
  </div>
);

const LoginPanel: React.FC<{frame: number; height: number}> = ({frame, height}) => {
  const panelP = reveal(frame, SHOT01.loginIntent.start, SHOT01.loginIntent.panelRevealEnd);
  const intentP = panelP;
  const credentialP = reveal(frame, SHOT01.credentialInput.start, SHOT01.credentialInput.revealEnd);
  const uiP = reveal(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);

  const intentFocus = focusWindow(frame, SHOT01.loginIntent.start, SHOT01.loginIntent.focusEnd, 20);
  const credentialFocus = focusWindow(frame, SHOT01.credentialInput.start, SHOT01.credentialInput.focusEnd, 18);
  const uiFocus = reveal(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);

  const validateActivity = pulse(frame, SHOT01.loginIntent.validateGlowStart, SHOT01.loginIntent.validateGlowEnd, 12);
  const submitActivity = pulse(frame, SHOT01.loginIntent.submitGlowStart, SHOT01.loginIntent.submitGlowEnd, 12);
  const identifierActivity = pulse(frame, SHOT01.credentialInput.identifierGlowStart, SHOT01.credentialInput.identifierGlowEnd, 12);
  const secretActivity = pulse(frame, SHOT01.credentialInput.secretGlowStart, SHOT01.credentialInput.secretGlowEnd, 12);
  const submittingActivity = focusWindow(frame, SHOT01.localUiState.submittingStart, SHOT01.localUiState.submittingEnd, 10);
  const waitingActivity = reveal(frame, SHOT01.localUiState.waitingStart, SHOT01.localUiState.waitingFull);

  return (
    <div
      style={{
        width: PANEL_WIDTH,
        height,
        borderRadius: 32,
        padding: PANEL_BORDER,
        boxSizing: 'border-box',
        background: 'linear-gradient(145deg,#B45CFF 0%,#8A37F0 32%,#6E22D6 67%,#5413AE 100%)',
        boxShadow: '0 22px 58px rgba(30,7,62,.62),0 0 34px rgba(171,67,255,.30),0 0 8px rgba(220,169,255,.22)',
        opacity: panelP,
        transform: `translateY(${(1 - panelP) * -18}px) scale(${0.975 + panelP * 0.025})`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 25,
          overflow: 'hidden',
          background: 'linear-gradient(180deg,#071725 0%,#06101B 100%)',
          border: '1px solid rgba(214,165,255,.34)',
          boxShadow: 'inset 0 0 36px rgba(44,31,79,.28),inset 0 1px 0 rgba(255,255,255,.035)',
        }}
      >
        <Section top={0} title="Login Intent" icon={<LoginIcon/>} progress={intentP} focus={intentFocus}>
          <Pill label="Validate" progress={intentP} activity={validateActivity} width={154}/>
          <Pill label="Submit" progress={intentP} activity={submitActivity} width={148}/>
        </Section>
        <Section top={SECTION_HEIGHT} title="Credential Input" icon={<KeyIcon/>} progress={credentialP} focus={credentialFocus}>
          <Pill label="Identifier" progress={credentialP} activity={identifierActivity} width={170}/>
          <Pill label="Secret" progress={credentialP} activity={secretActivity} width={145}/>
        </Section>
        <Section top={SECTION_HEIGHT * 2} title="Local UI State" icon={<DeviceIcon/>} progress={uiP} focus={uiFocus} divider={false}>
          <Pill label="Submitting" progress={uiP} activity={submittingActivity} width={182}/>
          <Pill label="Waiting" progress={uiP} activity={waitingActivity} width={154}/>
        </Section>
      </div>
    </div>
  );
};

const Spinner: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => (
  <div
    style={{
      width: 25,
      height: 25,
      borderRadius: '50%',
      border: '4px solid rgba(255,255,255,.22)',
      borderTopColor: 'rgba(255,255,255,.96)',
      opacity,
      transform: `rotate(${frame * 13}deg)`,
      boxShadow: '0 0 8px rgba(255,255,255,.12)',
    }}
  />
);

const Phone: React.FC<{frame: number; attention: number}> = ({frame, attention}) => {
  const enterP = spring({frame, fps: SHOT01_FPS, config: {damping: 20, stiffness: 95, mass: 1.1}, durationInFrames: 42});
  const pressActivity = pulse(frame, SHOT01.phone.pressStart, SHOT01.phone.pressEnd, 8);
  const emailP = reveal(frame, SHOT01.phone.emailVisible, SHOT01.phone.emailVisible + 12);
  const passwordP = reveal(frame, SHOT01.phone.passwordStart, SHOT01.phone.passwordReady);
  const passwordDots = Math.max(0, Math.min(8, Math.round(passwordP * 8)));
  const localUiP = reveal(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);
  const waitingP = reveal(frame, SHOT01.localUiState.waitingStart, SHOT01.localUiState.waitingFull);
  const spinnerP = reveal(frame, SHOT01.localUiState.spinnerStart, SHOT01.localUiState.spinnerStart + 14);
  const fieldEcho = focusWindow(frame, SHOT01.credentialInput.start, SHOT01.credentialInput.focusEnd, 18);
  const buttonScale = 1 - pressActivity * 0.048;
  const disabledMix = Math.min(1, localUiP * 0.82);
  const buttonGradient = localUiP > 0.15
    ? 'linear-gradient(180deg,#1DBAA9 0%,#0D8E84 52%,#076E69 100%)'
    : 'linear-gradient(180deg,#43F0DA 0%,#17CFBC 43%,#079E93 100%)';

  return (
    <div
      style={{
        width: 535,
        height: 682,
        borderRadius: 76,
        padding: 12,
        background: 'linear-gradient(145deg,#2F7CFF 0%,#1C5CC3 26%,#102A52 58%,#315B9E 100%)',
        boxShadow: `0 34px 80px rgba(0,0,0,.56),0 0 ${28 + attention * 34}px rgba(55,132,255,${0.13 + attention * 0.13}),0 0 10px rgba(112,181,255,.18)`,
        opacity: enterP * (0.78 + attention * 0.22),
        filter: `brightness(${0.94 + attention * 0.08}) saturate(1.12)`,
        transform: `translateY(${(1 - enterP) * 48}px) scale(${0.965 + enterP * 0.035})`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: 64,
          background: 'radial-gradient(circle at 50% 27%,#0B2031 0%,#06131F 50%,#040B13 100%)',
          border: '2px solid rgba(121,177,255,.56)',
          boxShadow: 'inset 0 0 66px rgba(14,52,86,.48),inset 0 1px 0 rgba(190,218,255,.08)',
        }}
      >
        <div style={{position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', width: 146, height: 29, borderRadius: 22, background: '#03070C', boxShadow: '0 1px 0 rgba(255,255,255,.05)'}}>
          <div style={{position: 'absolute', right: 17, top: 9, width: 10, height: 10, borderRadius: '50%', background: '#3155D2', boxShadow: '0 0 10px rgba(87,108,255,.76)'}}/>
        </div>
        <div style={{position: 'absolute', top: 138, left: 0, right: 0, textAlign: 'center', color: '#FBFDFF', fontSize: 62, fontWeight: 520, letterSpacing: '0.02em', textShadow: '0 0 18px rgba(115,180,255,.08)'}}>LOGIN</div>
        <div
          style={{
            position: 'absolute',
            top: 294,
            left: 70,
            right: 70,
            height: 68,
            borderRadius: 15,
            border: `4px solid rgba(104,139,255,${0.90 + fieldEcho * 0.10})`,
            background: 'linear-gradient(180deg,#07121E 0%,#050D16 100%)',
            boxShadow: `0 0 ${8 + fieldEcho * 24}px rgba(94,146,255,${0.10 + fieldEcho * 0.16}), inset 0 0 16px rgba(61,104,189,.18)`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            color: '#D6E2F2',
            fontSize: 23,
          }}
        >
          <span style={{opacity: emailP}}>user@example.com</span>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 389,
            left: 70,
            right: 70,
            height: 68,
            borderRadius: 15,
            border: `4px solid rgba(104,139,255,${0.90 + fieldEcho * 0.10})`,
            background: 'linear-gradient(180deg,#07121E 0%,#050D16 100%)',
            boxShadow: `0 0 ${8 + fieldEcho * 24}px rgba(94,146,255,${0.10 + fieldEcho * 0.16}), inset 0 0 16px rgba(61,104,189,.18)`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            color: '#E1E8F1',
            fontSize: 27,
            letterSpacing: '0.20em',
          }}
        >
          {'•'.repeat(passwordDots)}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 518,
            left: 74,
            right: 74,
            height: 78,
            borderRadius: 23,
            border: `1px solid rgba(101,255,235,${0.64 - disabledMix * 0.20})`,
            background: buttonGradient,
            boxShadow: localUiP > 0.15
              ? '0 10px 24px rgba(0,0,0,.30),0 0 22px rgba(21,190,171,.22),inset 0 1px 0 rgba(191,255,247,.30),inset 0 -7px 18px rgba(0,49,45,.24)'
              : '0 13px 30px rgba(0,0,0,.34),0 0 34px rgba(44,239,215,.32),inset 0 2px 0 rgba(220,255,250,.44),inset 0 -8px 18px rgba(0,85,77,.22)',
            transform: `translateY(${pressActivity * 3}px) scale(${buttonScale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            overflow: 'hidden',
            color: localUiP > 0.15 ? '#EFFFFC' : '#03211D',
            fontSize: 27,
            fontWeight: 760,
            letterSpacing: '0.10em',
            opacity: 1 - localUiP * 0.08,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              top: 4,
              height: '40%',
              borderRadius: 18,
              background: 'linear-gradient(180deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 100%)',
              opacity: 0.72 - disabledMix * 0.28,
            }}
          />
          <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 14}}>
            {localUiP > 0.15 ? <Spinner frame={frame} opacity={spinnerP}/> : null}
            <span>{waitingP > 0.45 ? 'WAITING' : localUiP > 0.15 ? 'SUBMITTING' : 'LOG IN'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const currentBeat = (frame: number) => {
  if (frame < SHOT01.loginIntent.start) return '00:00–00:07 · HUMAN ACTION / PHONE';
  if (frame < SHOT01.credentialInput.start) return '00:07–00:17 · LOGIN INTENT';
  if (frame < SHOT01.localUiState.start) return '00:17–00:24 · CREDENTIAL INPUT';
  return '00:24–00:31 · LOCAL UI STATE';
};

export const LoginIntentLiveScene: React.FC<Props> = ({showGuides, viewMode}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const metrics = panelMetrics(frame);

  const worldReveal = reveal(frame, SHOT01.camera.worldRevealStart, SHOT01.camera.worldRevealEnd);
  const credentialMove = reveal(frame, SHOT01.camera.credentialMoveStart, SHOT01.camera.credentialMoveEnd);
  const localUiMove = reveal(frame, SHOT01.camera.localUiMoveStart, SHOT01.camera.localUiMoveEnd);

  const shotScale = 1.05 + (0.78 - 1.05) * worldReveal + (0.85 - 0.78) * credentialMove + (0.80 - 0.85) * localUiMove;
  const shotTop = -610 + (-70 - -610) * worldReveal + (-35 - -70) * credentialMove + (-80 - -35) * localUiMove;
  const worldScale = viewMode === 'world' ? 1.49 : shotScale;
  const worldTop = viewMode === 'world' ? 54 : shotTop;

  const panelVisible = reveal(frame, SHOT01.loginIntent.start, SHOT01.loginIntent.panelRevealEnd);
  const outgoingP = reveal(frame, SHOT01.requestAssemblyHint.start, SHOT01.requestAssemblyHint.end);

  const panelTop = PANEL_BOTTOM - metrics.height;
  const connectorHeight = PHONE_TOP - PANEL_BOTTOM;

  const phoneAttention = frame < SHOT01.loginIntent.start
    ? 1
    : frame < SHOT01.credentialInput.start
      ? 0.72
      : frame < SHOT01.localUiState.start
        ? 0.66
        : 0.98;

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 44%,#0B1C2D 0%,#071321 48%,#040A12 100%)',
        fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif',
        color: COLORS.primaryText,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: viewMode === 'world' ? 0.18 : 0.14,
          backgroundImage: 'linear-gradient(rgba(67,104,145,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(67,104,145,.16) 1px,transparent 1px)',
          backgroundSize: viewMode === 'world' ? '72px 72px' : '54px 54px',
          maskImage: 'radial-gradient(circle at 50% 50%,black 30%,transparent 82%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: viewMode === 'world' ? 260 : 10,
          width: viewMode === 'world' ? 1180 : 920,
          height: viewMode === 'world' ? 1600 : 920,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(111,53,211,.20) 0%,rgba(17,46,77,.05) 52%,transparent 74%)',
          filter: 'blur(22px)',
          opacity: 0.42 + panelVisible * 0.58,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: worldTop,
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `translateX(-50%) scale(${worldScale})`,
          transformOrigin: '50% 0%',
        }}
      >
        <div style={{position: 'absolute', left: 95, top: panelTop}}>
          <LoginPanel frame={frame} height={metrics.height}/>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 377,
            top: PANEL_BOTTOM,
            width: 6,
            height: connectorHeight,
            borderRadius: 99,
            background: 'linear-gradient(180deg,#7C35D5 0%,#4D2590 56%,#1C4670 100%)',
            opacity: 0.52 * panelVisible,
            boxShadow: '0 0 16px rgba(151,70,240,.26)',
          }}
        />

        <div style={{position: 'absolute', left: 112, top: PHONE_TOP}}>
          <Phone frame={frame} attention={phoneAttention}/>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 647,
            top: 1172,
            width: 190 * outgoingP,
            height: 8,
            borderRadius: 99,
            background: 'linear-gradient(90deg,#0BA59B 0%,#10C2B3 48%,rgba(16,194,179,0) 100%)',
            opacity: 0.30 * outgoingP,
            boxShadow: '0 0 16px rgba(27,222,202,.14)',
          }}
        />
      </div>

      {showGuides ? (
        <div
          style={{
            position: 'absolute',
            left: 26,
            bottom: 22,
            color: '#7FA0BE',
            fontSize: viewMode === 'world' ? 22 : 14,
            fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
            lineHeight: 1.55,
          }}
        >
          <div>EP001 · SHOT 01 · LOCKED ART DIRECTION</div>
          <div>{currentBeat(frame)}</div>
          <div>frame {frame} · {(frame / SHOT01_FPS).toFixed(2)}s · {width}×{height} · {viewMode}</div>
        </div>
      ) : null}

      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: viewMode === 'world' ? 'inset 0 0 260px rgba(1,5,10,.50)' : 'inset 0 0 190px rgba(1,5,10,.52)'}}/>
    </AbsoluteFill>
  );
};
