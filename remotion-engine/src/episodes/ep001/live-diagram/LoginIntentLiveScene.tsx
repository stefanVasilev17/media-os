import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {COLORS} from '../../../design-system/tokens';

export const loginIntentLiveSceneSchema = z.object({showGuides: z.boolean()});
type Props = z.infer<typeof loginIntentLiveSceneSchema>;

const reveal = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

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

const Pill: React.FC<{label: string; active?: boolean; progress: number; width?: number}> = ({label, active = false, progress, width}) => (
  <div
    style={{
      minWidth: width ?? 150,
      height: 52,
      padding: '0 20px',
      borderRadius: 16,
      border: `3px solid ${active ? '#18A56E' : '#0D704C'}`,
      background: active ? 'linear-gradient(180deg,#0C3A2B 0%,#08251D 100%)' : '#07150F',
      boxShadow: active
        ? '0 0 22px rgba(41,218,142,.18), inset 0 0 16px rgba(31,175,113,.11)'
        : 'inset 0 0 12px rgba(23,138,92,.09)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#F5F7FA',
      fontSize: 31,
      fontWeight: active ? 650 : 430,
      letterSpacing: '-0.025em',
      opacity: progress,
      transform: `translateY(${(1 - progress) * 10}px) scale(${0.965 + progress * 0.035})`,
    }}
  >
    {label}
  </div>
);

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  progress: number;
  divider?: boolean;
  children: React.ReactNode;
}> = ({title, icon, progress, divider = true, children}) => (
  <div style={{position: 'relative', padding: '20px 30px 23px'}}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        opacity: progress,
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
          boxShadow: 'inset 0 0 18px rgba(125,92,255,.08)',
        }}
      >
        {icon}
      </div>
      <div style={{fontSize: 34, fontWeight: 650, letterSpacing: '-0.025em', color: COLORS.primaryText}}>{title}</div>
    </div>
    <div style={{display: 'flex', gap: 22, marginTop: 17, alignItems: 'center'}}>{children}</div>
    {divider ? (
      <div
        style={{
          height: 3,
          borderRadius: 99,
          marginTop: 23,
          background: 'linear-gradient(90deg,transparent 0%,#7130CB 13%,#994DF2 50%,#7130CB 87%,transparent 100%)',
          opacity: 0.47 * progress,
          boxShadow: '0 0 16px rgba(146,73,255,.18)',
        }}
      />
    ) : null}
  </div>
);

const LoginPanel: React.FC<{frame: number}> = ({frame}) => {
  const panelP = reveal(frame, 42, 78);
  const intentP = reveal(frame, 72, 112);
  const credentialP = reveal(frame, 158, 198);
  const uiP = reveal(frame, 250, 292);
  const waitingP = reveal(frame, 322, 362);

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
        <Section title="Login Intent" icon={<LoginIcon />} progress={intentP}>
          <Pill label="Validate" active={intentP > 0.76} progress={intentP} width={165}/>
          <Pill label="Submit" progress={intentP} width={160}/>
        </Section>
        <Section title="Credential Input" icon={<KeyIcon />} progress={credentialP}>
          <Pill label="Identifier" progress={credentialP} width={180}/>
          <Pill label="Secret" progress={credentialP} width={155}/>
        </Section>
        <Section title="Local UI State" icon={<DeviceIcon />} progress={uiP} divider={false}>
          <Pill label="Submitting" active={waitingP < 0.5 && uiP > 0.78} progress={uiP} width={192}/>
          <Pill label="Waiting" active={waitingP > 0.25} progress={uiP} width={165}/>
        </Section>
      </div>
    </div>
  );
};

const Phone: React.FC<{frame: number}> = ({frame}) => {
  const enterP = spring({frame, fps: 30, config: {damping: 20, stiffness: 95, mass: 1.1}, durationInFrames: 42});
  const pressP = reveal(frame, 28, 38);
  const submittingP = reveal(frame, 278, 320);
  const waitingP = reveal(frame, 332, 372);
  const buttonScale = 1 - Math.sin(pressP * Math.PI) * 0.035;
  const buttonColor = submittingP > 0.25 ? '#0C6B60' : '#0EA998';

  return (
    <div
      style={{
        width: 535,
        height: 682,
        borderRadius: 76,
        padding: 13,
        background: 'linear-gradient(145deg,#214F8E 0%,#173866 28%,#09182B 64%,#2B4168 100%)',
        boxShadow: '0 34px 78px rgba(0,0,0,.54),0 0 40px rgba(64,133,255,.12)',
        opacity: enterP,
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
        <div style={{position: 'absolute', top: 296, left: 73, right: 73, height: 68, borderRadius: 15, border: '4px solid #4C68A5', background: '#07101A', boxShadow: 'inset 0 0 15px rgba(54,91,155,.14)'}}/>
        <div style={{position: 'absolute', top: 391, left: 73, right: 73, height: 68, borderRadius: 15, border: '4px solid #4C68A5', background: '#07101A', boxShadow: 'inset 0 0 15px rgba(54,91,155,.14)'}}/>
        <div
          style={{
            position: 'absolute',
            top: 522,
            left: 86,
            right: 86,
            height: 72,
            borderRadius: 21,
            background: buttonColor,
            boxShadow: submittingP > 0.25 ? '0 0 20px rgba(24,158,137,.16)' : '0 0 25px rgba(25,208,186,.20)',
            transform: `scale(${buttonScale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 28,
            fontWeight: 650,
            letterSpacing: '0.08em',
          }}
        >
          {waitingP > 0.25 ? 'WAITING' : submittingP > 0.25 ? 'SUBMITTING' : 'LOG IN'}
        </div>
      </div>
    </div>
  );
};

export const LoginIntentLiveScene: React.FC<Props> = ({showGuides}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const panelVisible = reveal(frame, 42, 78);
  const connectorP = reveal(frame, 54, 98);
  const outgoingP = reveal(frame, 90, 126);
  const globalScale = interpolate(frame, [0, 100, 430], [0.79, 0.77, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 4,
          width: 760,
          height: 1420,
          transform: `translateX(-50%) scale(${globalScale})`,
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
          <Phone frame={frame}/>
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
            opacity: 0.28 * outgoingP,
            boxShadow: '0 0 12px rgba(25,184,168,.10)',
          }}
        />
      </div>

      {showGuides ? (
        <div style={{position: 'absolute', left: 26, bottom: 22, color: '#4D6A84', fontSize: 13, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace'}}>
          EP001 · LIVE DIAGRAM SOURCE-PROPORTION PASS · frame {frame} · {width}×{height}
        </div>
      ) : null}

      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 190px rgba(1,5,10,.52)'}}/>
    </AbsoluteFill>
  );
};
