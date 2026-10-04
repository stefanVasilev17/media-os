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
  <svg width="58" height="58" viewBox="0 0 64 64" fill="none">
    <path d="M29 14H16C12.7 14 10 16.7 10 20V44C10 47.3 12.7 50 16 50H29" stroke="#C178FF" strokeWidth="4" strokeLinecap="round"/>
    <path d="M28 32H53M44 23L53 32L44 41" stroke="#E2B4FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="58" height="58" viewBox="0 0 64 64" fill="none">
    <circle cx="24" cy="24" r="11" stroke="#D7D5FF" strokeWidth="4"/>
    <path d="M32 32L52 52M43 43L49 37M48 48L54 42" stroke="#D7D5FF" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

const DeviceIcon = () => (
  <svg width="58" height="58" viewBox="0 0 64 64" fill="none">
    <rect x="15" y="10" width="34" height="44" rx="5" stroke="#D7D5FF" strokeWidth="4"/>
    <path d="M24 17H40M25 46H39" stroke="#D7D5FF" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const Pill: React.FC<{label: string; active?: boolean; progress: number; width?: number}> = ({label, active = false, progress, width}) => (
  <div
    style={{
      minWidth: width ?? 170,
      height: 62,
      padding: '0 24px',
      borderRadius: 18,
      border: `3px solid ${active ? '#18A56E' : '#107451'}`,
      background: active ? 'linear-gradient(180deg,#0C3A2B 0%,#08251D 100%)' : '#081711',
      boxShadow: active ? '0 0 26px rgba(41,218,142,.20), inset 0 0 18px rgba(31,175,113,.12)' : 'inset 0 0 14px rgba(23,138,92,.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#F5F7FA',
      fontSize: 38,
      fontWeight: active ? 650 : 430,
      letterSpacing: '-0.025em',
      opacity: progress,
      transform: `translateY(${(1 - progress) * 12}px) scale(${0.96 + progress * 0.04})`,
    }}
  >
    {label}
  </div>
);

const Section: React.FC<{title: string; icon: React.ReactNode; progress: number; divider?: boolean; children: React.ReactNode}> = ({title, icon, progress, divider = true, children}) => (
  <div style={{position: 'relative', padding: '24px 34px 28px'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: progress, transform: `translateX(${(1 - progress) * -18}px)`}}>
      <div style={{width: 68, height: 68, borderRadius: 14, background: '#07101B', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 20px rgba(125,92,255,.08)'}}>{icon}</div>
      <div style={{fontSize: 39, fontWeight: 650, letterSpacing: '-0.025em', color: COLORS.primaryText}}>{title}</div>
    </div>
    <div style={{display: 'flex', gap: 26, marginTop: 22, alignItems: 'center'}}>{children}</div>
    {divider ? <div style={{height: 3, borderRadius: 99, marginTop: 28, background: 'linear-gradient(90deg,transparent 0%,#7D38D9 14%,#A055FF 50%,#7D38D9 86%,transparent 100%)', opacity: 0.46 * progress, boxShadow: '0 0 18px rgba(146,73,255,.20)'}} /> : null}
  </div>
);

const LoginPanel: React.FC<{frame: number}> = ({frame}) => {
  const panelP = reveal(frame, 42, 78);
  const intentP = reveal(frame, 72, 112);
  const credentialP = reveal(frame, 158, 198);
  const uiP = reveal(frame, 250, 292);
  const waitingP = reveal(frame, 322, 362);
  return (
    <div style={{width: 650, borderRadius: 44, padding: '12px 14px 16px', background: 'linear-gradient(145deg,rgba(101,35,176,.98),rgba(117,45,195,.84) 55%,rgba(83,29,150,.96))', boxShadow: '0 28px 70px rgba(24,8,53,.55),0 0 40px rgba(127,48,214,.16)', opacity: panelP, transform: `translateY(${(1 - panelP) * -24}px) scale(${0.965 + panelP * 0.035})`}}>
      <div style={{borderRadius: 34, overflow: 'hidden', background: 'linear-gradient(180deg,#071422 0%,#08131F 100%)', border: '2px solid rgba(157,86,240,.24)', boxShadow: 'inset 0 0 46px rgba(24,51,79,.18)'}}>
        <Section title="Login Intent" icon={<LoginIcon />} progress={intentP}>
          <Pill label="Validate" active={intentP > 0.76} progress={intentP} width={190}/>
          <Pill label="Submit" progress={intentP} width={190}/>
        </Section>
        <Section title="Credential Input" icon={<KeyIcon />} progress={credentialP}>
          <Pill label="Identifier" progress={credentialP} width={205}/>
          <Pill label="Secret" progress={credentialP} width={180}/>
        </Section>
        <Section title="Local UI State" icon={<DeviceIcon />} progress={uiP} divider={false}>
          <Pill label="Submitting" active={waitingP < 0.5 && uiP > 0.78} progress={uiP} width={220}/>
          <Pill label="Waiting" active={waitingP > 0.25} progress={uiP} width={190}/>
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
    <div style={{width: 386, height: 530, borderRadius: 62, padding: 12, background: 'linear-gradient(145deg,#1D4B8A 0%,#163565 28%,#0A182C 64%,#2B4168 100%)', boxShadow: '0 32px 75px rgba(0,0,0,.52),0 0 36px rgba(64,133,255,.11)', opacity: enterP, transform: `translateY(${(1 - enterP) * 48}px) scale(${0.96 + enterP * 0.04})`}}>
      <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 52, background: 'radial-gradient(circle at 50% 30%,#0A1A27 0%,#06111C 50%,#050C14 100%)', border: '2px solid rgba(100,137,191,.38)', boxShadow: 'inset 0 0 55px rgba(12,38,62,.42)'}}>
        <div style={{position: 'absolute', top: 17, left: '50%', transform: 'translateX(-50%)', width: 120, height: 26, borderRadius: 20, background: '#050A11'}}><div style={{position: 'absolute', right: 14, top: 8, width: 9, height: 9, borderRadius: '50%', background: '#263D83', boxShadow: '0 0 9px rgba(81,93,255,.65)'}}/></div>
        <div style={{position: 'absolute', top: 112, left: 0, right: 0, textAlign: 'center', color: '#F7F9FC', fontSize: 55, fontWeight: 500, letterSpacing: '0.02em'}}>LOGIN</div>
        <div style={{position: 'absolute', top: 232, left: 58, right: 58, height: 60, borderRadius: 14, border: '4px solid #4C68A5', background: '#07101A', boxShadow: 'inset 0 0 14px rgba(54,91,155,.14)'}}/>
        <div style={{position: 'absolute', top: 315, left: 58, right: 58, height: 60, borderRadius: 14, border: '4px solid #4C68A5', background: '#07101A', boxShadow: 'inset 0 0 14px rgba(54,91,155,.14)'}}/>
        <div style={{position: 'absolute', top: 414, left: 86, right: 86, height: 64, borderRadius: 18, background: buttonColor, boxShadow: submittingP > 0.25 ? '0 0 20px rgba(24,158,137,.16)' : '0 0 24px rgba(25,208,186,.20)', transform: `scale(${buttonScale})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 25, fontWeight: 650, letterSpacing: '0.08em'}}>
          {waitingP > 0.25 ? 'WAITING' : submittingP > 0.25 ? 'SUBMITTING' : 'LOGIN'}
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
  const globalScale = interpolate(frame, [0, 100, 430], [1.11, 1.07, 1.04], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%,#0A1725 0%,#07111F 52%,#050B13 100%)', fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif', color: COLORS.primaryText, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'linear-gradient(rgba(55,84,116,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(55,84,116,.14) 1px,transparent 1px)', backgroundSize: '54px 54px', maskImage: 'radial-gradient(circle at 50% 52%,black 25%,transparent 78%)'}}/>
      <div style={{position: 'absolute', left: '50%', top: 48, width: 850, height: 850, transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle,rgba(92,54,178,.16) 0%,rgba(12,25,40,.02) 58%,transparent 74%)', filter: 'blur(16px)'}}/>
      <div style={{position: 'absolute', left: '50%', top: 14, transform: `translateX(-50%) scale(${globalScale})`, transformOrigin: '50% 38%', width: 820, height: 1040}}>
        <div style={{position: 'absolute', left: 85, top: 0}}><LoginPanel frame={frame}/></div>
        <div style={{position: 'absolute', left: 407, top: 602, width: 6, height: 92 * connectorP, borderRadius: 99, background: 'linear-gradient(180deg,#62349D 0%,#3A216A 62%,#1A3755 100%)', opacity: 0.46 * panelVisible, boxShadow: '0 0 16px rgba(126,62,206,.20)'}}/>
        <div style={{position: 'absolute', left: 217, top: 680}}><Phone frame={frame}/></div>
      </div>
      {showGuides ? <div style={{position: 'absolute', left: 26, bottom: 22, color: '#4D6A84', fontSize: 13, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace'}}>EP001 · LIVE DIAGRAM RECONSTRUCTION · frame {frame} · {width}×{height}</div> : null}
      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 190px rgba(1,5,10,.52)'}}/>
    </AbsoluteFill>
  );
};
