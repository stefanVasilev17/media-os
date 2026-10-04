import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS} from '../../../design-system/tokens';
import {SHOT01, SHOT01_FPS} from './shot01Timing';

export const loginIntentLiveSceneSchema = z.object({showGuides: z.boolean()});
type Props = z.infer<typeof loginIntentLiveSceneSchema>;

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

const LoginIcon = () => (
  <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
    <path d="M29 14H16C12.7 14 10 16.7 10 20V44C10 47.3 12.7 50 16 50H29" stroke="#C178FF" strokeWidth="4" strokeLinecap="round"/>
    <path d="M28 32H53M44 23L53 32L44 41" stroke="#E2B4FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
    <circle cx="24" cy="24" r="11" stroke="#D7D5FF" strokeWidth="4"/>
    <path d="M32 32L52 52M43 43L49 37M48 48L54 42" stroke="#D7D5FF" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

const DeviceIcon = () => (
  <svg width="50" height="50" viewBox="0 0 64 64" fill="none">
    <rect x="15" y="10" width="34" height="44" rx="5" stroke="#D7D5FF" strokeWidth="4"/>
    <path d="M24 17H40M25 46H39" stroke="#D7D5FF" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const Pill: React.FC<{
  label: string;
  progress: number;
  activity?: number;
  width?: number;
}> = ({label, progress, activity = 0, width}) => {
  const lift = activity * 2;
  const brightness = 0.84 + activity * 0.28;
  const borderAlpha = 0.55 + activity * 0.45;
  const glowAlpha = 0.04 + activity * 0.26;

  return (
    <div
      style={{
        minWidth: width ?? 150,
        height: 52,
        padding: '0 20px',
        borderRadius: 16,
        border: `3px solid rgba(24,165,110,${borderAlpha})`,
        background: `linear-gradient(180deg,rgba(12,58,43,${0.22 + activity * 0.72}) 0%,rgba(7,21,15,.98) 100%)`,
        boxShadow: `0 0 ${12 + activity * 24}px rgba(41,218,142,${glowAlpha}), inset 0 0 ${12 + activity * 10}px rgba(31,175,113,${0.06 + activity * 0.12})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F5F7FA',
        fontSize: 31,
        fontWeight: activity > 0.45 ? 650 : 470,
        letterSpacing: '-0.025em',
        opacity: progress,
        filter: `brightness(${brightness})`,
        transform: `translateY(${(1 - progress) * 10 - lift}px) scale(${0.965 + progress * 0.035 + activity * 0.012})`,
      }}
    >
      {label}
    </div>
  );
};

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  progress: number;
  focus: number;
  divider?: boolean;
  children: React.ReactNode;
}> = ({title, icon, progress, focus, divider = true, children}) => (
  <div
    style={{
      position: 'relative',
      padding: '20px 30px 23px',
      opacity: progress,
      filter: `brightness(${0.78 + focus * 0.28})`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 6,
        borderRadius: 22,
        background: `radial-gradient(circle at 34% 45%,rgba(117,69,214,${0.04 + focus * 0.09}) 0%,transparent 68%)`,
        opacity: progress,
      }}
    />
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        transform: `translateX(${(1 - progress) * -16}px)`,
      }}
    >
      <div
        style={{
          width: 59,
          height: 59,
          borderRadius: 12,
          background: '#07101B',
          display: 'grid',
          placeItems: 'center',
          boxShadow: `0 0 ${8 + focus * 18}px rgba(151,92,255,${0.05 + focus * 0.16}), inset 0 0 18px rgba(125,92,255,.08)`,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: focus > 0.45 ? 690 : 610,
          letterSpacing: '-0.025em',
          color: COLORS.primaryText,
          textShadow: `0 0 ${focus * 18}px rgba(213,190,255,${focus * 0.16})`,
        }}
      >
        {title}
      </div>
    </div>
    <div style={{position: 'relative', display: 'flex', gap: 22, marginTop: 17, alignItems: 'center'}}>{children}</div>
    {divider ? (
      <div
        style={{
          position: 'relative',
          height: 3,
          borderRadius: 99,
          marginTop: 23,
          background: 'linear-gradient(90deg,transparent 0%,#7130CB 13%,#994DF2 50%,#7130CB 87%,transparent 100%)',
          opacity: 0.34 + focus * 0.28,
          boxShadow: `0 0 ${12 + focus * 12}px rgba(146,73,255,${0.10 + focus * 0.12})`,
        }}
      />
    ) : null}
  </div>
);

const LoginPanel: React.FC<{frame: number}> = ({frame}) => {
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
        width: 590,
        borderRadius: 38,
        padding: '11px 12px 13px',
        background: 'linear-gradient(145deg,rgba(96,31,169,.99),rgba(117,43,195,.87) 55%,rgba(76,24,142,.98))',
        boxShadow: '0 24px 62px rgba(24,8,53,.54),0 0 36px rgba(127,48,214,.15)',
        opacity: panelP,
        transform: `translateY(${(1 - panelP) * -22}px) scale(${0.97 + panelP * 0.03})`,
      }}
    >
      <div
        style={{
          borderRadius: 29,
          overflow: 'hidden',
          background: 'linear-gradient(180deg,#071421 0%,#07121E 100%)',
          border: '2px solid rgba(157,86,240,.22)',
          boxShadow: 'inset 0 0 42px rgba(24,51,79,.16)',
        }}
      >
        <Section title="Login Intent" icon={<LoginIcon/>} progress={intentP} focus={intentFocus}>
          <Pill label="Validate" progress={intentP} activity={validateActivity} width={165}/>
          <Pill label="Submit" progress={intentP} activity={submitActivity} width={160}/>
        </Section>
        <Section title="Credential Input" icon={<KeyIcon/>} progress={credentialP} focus={credentialFocus}>
          <Pill label="Identifier" progress={credentialP} activity={identifierActivity} width={180}/>
          <Pill label="Secret" progress={credentialP} activity={secretActivity} width={155}/>
        </Section>
        <Section title="Local UI State" icon={<DeviceIcon/>} progress={uiP} focus={uiFocus} divider={false}>
          <Pill label="Submitting" progress={uiP} activity={submittingActivity} width={192}/>
          <Pill label="Waiting" progress={uiP} activity={waitingActivity} width={165}/>
        </Section>
      </div>
    </div>
  );
};

const Spinner: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => (
  <div
    style={{
      width: 27,
      height: 27,
      borderRadius: '50%',
      border: '4px solid rgba(255,255,255,.20)',
      borderTopColor: 'rgba(255,255,255,.88)',
      opacity,
      transform: `rotate(${frame * 13}deg)`,
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
  const buttonScale = 1 - pressActivity * 0.045;
  const buttonColor = localUiP > 0.22 ? '#0A7468' : '#0EA998';
  const fieldEcho = focusWindow(frame, SHOT01.credentialInput.start, SHOT01.credentialInput.focusEnd, 18);

  return (
    <div
      style={{
        width: 535,
        height: 682,
        borderRadius: 76,
        padding: 13,
        background: 'linear-gradient(145deg,#214F8E 0%,#173866 28%,#09182B 64%,#2B4168 100%)',
        boxShadow: `0 34px 78px rgba(0,0,0,.54),0 0 ${26 + attention * 28}px rgba(64,133,255,${0.07 + attention * 0.09})`,
        opacity: enterP * (0.76 + attention * 0.24),
        filter: `brightness(${0.88 + attention * 0.12})`,
        transform: `translateY(${(1 - enterP) * 50}px) scale(${0.965 + enterP * 0.035})`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: 64,
          background: 'radial-gradient(circle at 50% 28%,#0A1A27 0%,#06111C 52%,#050C14 100%)',
          border: '2px solid rgba(100,137,191,.40)',
          boxShadow: 'inset 0 0 62px rgba(12,38,62,.44)',
        }}
      >
        <div style={{position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', width: 146, height: 29, borderRadius: 22, background: '#050A11'}}>
          <div style={{position: 'absolute', right: 17, top: 9, width: 10, height: 10, borderRadius: '50%', background: '#263D83', boxShadow: '0 0 9px rgba(81,93,255,.65)'}}/>
        </div>
        <div style={{position: 'absolute', top: 142, left: 0, right: 0, textAlign: 'center', color: '#F7F9FC', fontSize: 62, fontWeight: 500, letterSpacing: '0.02em'}}>LOGIN</div>
        <div
          style={{
            position: 'absolute',
            top: 296,
            left: 73,
            right: 73,
            height: 68,
            borderRadius: 15,
            border: `4px solid rgba(76,104,165,${0.88 + fieldEcho * 0.12})`,
            background: '#07101A',
            boxShadow: `0 0 ${fieldEcho * 22}px rgba(88,130,213,${fieldEcho * 0.16}), inset 0 0 15px rgba(54,91,155,.14)`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            color: '#C8D4E7',
            fontSize: 23,
            opacity: 0.92,
          }}
        >
          <span style={{opacity: emailP}}>user@example.com</span>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 391,
            left: 73,
            right: 73,
            height: 68,
            borderRadius: 15,
            border: `4px solid rgba(76,104,165,${0.88 + fieldEcho * 0.12})`,
            background: '#07101A',
            boxShadow: `0 0 ${fieldEcho * 22}px rgba(88,130,213,${fieldEcho * 0.16}), inset 0 0 15px rgba(54,91,155,.14)`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            color: '#D7DFEB',
            fontSize: 27,
            letterSpacing: '0.20em',
          }}
        >
          {'•'.repeat(passwordDots)}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 522,
            left: 86,
            right: 86,
            height: 72,
            borderRadius: 21,
            background: buttonColor,
            boxShadow: localUiP > 0.2 ? '0 0 19px rgba(24,158,137,.14)' : '0 0 25px rgba(25,208,186,.20)',
            transform: `scale(${buttonScale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            color: 'white',
            fontSize: 27,
            fontWeight: 650,
            letterSpacing: '0.08em',
            opacity: 1 - localUiP * 0.13,
          }}
        >
          {localUiP > 0.15 ? <Spinner frame={frame} opacity={spinnerP}/> : null}
          <span>{waitingP > 0.45 ? 'WAITING' : localUiP > 0.15 ? 'SUBMITTING' : 'LOG IN'}</span>
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

export const LoginIntentLiveScene: React.FC<Props> = ({showGuides}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const worldReveal = reveal(frame, SHOT01.camera.worldRevealStart, SHOT01.camera.worldRevealEnd);
  const credentialMove = reveal(frame, SHOT01.camera.credentialMoveStart, SHOT01.camera.credentialMoveEnd);
  const localUiMove = reveal(frame, SHOT01.camera.localUiMoveStart, SHOT01.camera.localUiMoveEnd);

  const cameraScale = 0.98 + (0.72 - 0.98) * worldReveal + (0.80 - 0.72) * credentialMove + (0.79 - 0.80) * localUiMove;
  const cameraTop = -510 + (18 - -510) * worldReveal + (105 - 18) * credentialMove + (-5 - 105) * localUiMove;

  const panelVisible = reveal(frame, SHOT01.loginIntent.start, SHOT01.loginIntent.panelRevealEnd);
  const connectorP = panelVisible;
  const outgoingP = reveal(frame, SHOT01.requestAssemblyHint.start, SHOT01.requestAssemblyHint.end);

  const phoneAttention = frame < SHOT01.loginIntent.start
    ? 1
    : frame < SHOT01.credentialInput.start
      ? 0.70
      : frame < SHOT01.localUiState.start
        ? 0.64
        : 0.96;

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 45%,#0A1725 0%,#07111F 52%,#050B13 100%)',
        fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif',
        color: COLORS.primaryText,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.13,
          backgroundImage: 'linear-gradient(rgba(55,84,116,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(55,84,116,.13) 1px,transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(circle at 50% 52%,black 24%,transparent 78%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 14,
          width: 900,
          height: 900,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(92,54,178,.15) 0%,rgba(12,25,40,.02) 58%,transparent 74%)',
          filter: 'blur(18px)',
          opacity: 0.5 + panelVisible * 0.5,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: cameraTop,
          width: 760,
          height: 1480,
          transform: `translateX(-50%) scale(${cameraScale})`,
          transformOrigin: '50% 0%',
        }}
      >
        <div style={{position: 'absolute', left: 85, top: 0}}>
          <LoginPanel frame={frame}/>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 377,
            top: 548,
            width: 6,
            height: 222 * connectorP,
            borderRadius: 99,
            background: 'linear-gradient(180deg,#5A2D94 0%,#30205E 58%,#18334E 100%)',
            opacity: 0.43 * panelVisible,
            boxShadow: '0 0 14px rgba(126,62,206,.18)',
          }}
        />

        <div style={{position: 'absolute', left: 112, top: 766}}>
          <Phone frame={frame} attention={phoneAttention}/>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 647,
            top: 1094,
            width: 190 * outgoingP,
            height: 8,
            borderRadius: 99,
            background: 'linear-gradient(90deg,#0B655F 0%,#08756B 54%,rgba(8,117,107,0) 100%)',
            opacity: 0.20 * outgoingP,
            boxShadow: '0 0 12px rgba(25,184,168,.08)',
          }}
        />
      </div>

      {showGuides ? (
        <div
          style={{
            position: 'absolute',
            left: 26,
            bottom: 22,
            color: '#6C89A5',
            fontSize: 14,
            fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
            lineHeight: 1.55,
          }}
        >
          <div>EP001 · SHOT 01 · SCRIPT + VISUAL PASS TIMING</div>
          <div>{currentBeat(frame)}</div>
          <div>frame {frame} · {(frame / SHOT01_FPS).toFixed(2)}s · {width}×{height}</div>
        </div>
      ) : null}

      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 190px rgba(1,5,10,.52)'}}/>
    </AbsoluteFill>
  );
};
