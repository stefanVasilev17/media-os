import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {SHOT01, SHOT01_FPS} from './shot01Timing';

export const phoneFirstPreviewSchema = z.object({showGuides: z.boolean()});
type Props = z.infer<typeof phoneFirstPreviewSchema>;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const out = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

const pulse = (frame: number, start: number, end: number, fade = 12) => {
  const a = out(frame, start, Math.min(start + fade, end));
  const b = 1 - out(frame, Math.max(start, end - fade), end);
  return Math.min(a, b);
};

const email = 'user@example.com';
const passwordLength = 8;

const typedText = (frame: number, start: number, end: number, value: string) => {
  const p = clamp((frame - start) / Math.max(1, end - start));
  const eased = 1 - Math.pow(1 - p, 1.35);
  return value.slice(0, Math.floor(eased * value.length));
};

const SignalIcon = () => (
  <div style={{display: 'flex', alignItems: 'flex-end', gap: 4, height: 22}}>
    {[8, 12, 17, 22].map((h, i) => (
      <div key={i} style={{width: 5, height: h, borderRadius: 2.5, background: i < 3 ? '#F7FAFF' : 'rgba(247,250,255,.38)'}} />
    ))}
  </div>
);

const WifiIcon = () => (
  <svg width="29" height="24" viewBox="0 0 29 24" fill="none">
    <path d="M3 8.5C9.8 2.7 19.2 2.7 26 8.5" stroke="#F7FAFF" strokeWidth="3.2" strokeLinecap="round"/>
    <path d="M7.5 13C11.4 9.7 17.6 9.7 21.5 13" stroke="#F7FAFF" strokeWidth="3.2" strokeLinecap="round"/>
    <circle cx="14.5" cy="18.5" r="2.2" fill="#F7FAFF"/>
  </svg>
);

const BatteryIcon = () => (
  <div style={{position: 'relative', width: 49, height: 23, borderRadius: 7, border: '2px solid rgba(247,250,255,.58)', padding: 3}}>
    <div style={{height: '100%', width: '71%', borderRadius: 4, background: '#F7FAFF'}} />
    <div style={{position: 'absolute', right: -5, top: 6, width: 3, height: 9, borderRadius: 2, background: 'rgba(247,250,255,.58)'}} />
  </div>
);

const InputField: React.FC<{
  label: string;
  value: string;
  focused: number;
  cursor: boolean;
  masked?: boolean;
}> = ({label, value, focused, cursor, masked = false}) => (
  <div style={{position: 'relative', width: '100%'}}>
    <div style={{fontSize: 22, fontWeight: 600, color: `rgba(208,221,239,${0.66 + focused * 0.28})`, marginBottom: 11, letterSpacing: '0.01em'}}>{label}</div>
    <div
      style={{
        height: 92,
        borderRadius: 24,
        border: `2px solid rgba(${focused > 0.15 ? '78,151,255' : '66,88,120'},${0.55 + focused * 0.40})`,
        background: 'linear-gradient(180deg,rgba(8,19,34,.98),rgba(5,13,24,.98))',
        boxShadow: focused > 0.15
          ? `0 0 ${20 + focused * 28}px rgba(50,120,255,${0.10 + focused * 0.18}), inset 0 0 28px rgba(37,93,176,.10)`
          : 'inset 0 0 24px rgba(18,37,65,.20)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        color: '#F4F8FF',
        fontSize: masked ? 34 : 26,
        letterSpacing: masked ? '0.22em' : '0.01em',
        fontWeight: 500,
      }}
    >
      <span>{value}</span>
      {cursor ? (
        <span style={{display: 'inline-block', width: 2, height: 37, marginLeft: 5, background: '#72B7FF', opacity: 0.85, boxShadow: '0 0 10px rgba(86,169,255,.58)'}} />
      ) : null}
    </div>
  </div>
);

const HeroButton: React.FC<{frame: number; localUi: number}> = ({frame, localUi}) => {
  const press = pulse(frame, SHOT01.phone.pressStart, SHOT01.phone.pressEnd, 8);
  const afterTap = out(frame, SHOT01.phone.pressEnd - 3, SHOT01.phone.pressEnd + 16);
  const waiting = out(frame, SHOT01.localUiState.waitingStart, SHOT01.localUiState.waitingFull);
  const spinner = out(frame, SHOT01.localUiState.spinnerStart, SHOT01.localUiState.spinnerStart + 14);
  const disabled = localUi * 0.76;
  const shineStart = SHOT01.phone.pressStart - 8;
  const shineP = out(frame, shineStart, SHOT01.phone.pressEnd + 8);
  const shineX = interpolate(shineP, [0, 1], [-130, 460]);

  return (
    <div style={{position: 'relative', width: '100%', height: 108}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 31,
          background: localUi > 0.15
            ? 'linear-gradient(180deg,#0C6E6D 0%,#095552 100%)'
            : 'linear-gradient(135deg,#17E1D2 0%,#12BDAF 42%,#0A8E87 100%)',
          border: `2px solid rgba(91,255,239,${0.52 - disabled * 0.22})`,
          boxShadow: localUi > 0.15
            ? '0 14px 34px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.10)'
            : `0 ${18 - press * 8}px ${48 - press * 12}px rgba(4,203,187,.28), 0 0 42px rgba(28,226,211,.16), inset 0 2px 0 rgba(255,255,255,.24), inset 0 -12px 24px rgba(3,72,70,.18)`,
          transform: `translateY(${press * 6}px) scale(${1 - press * 0.035})`,
          overflow: 'hidden',
        }}
      >
        {localUi < 0.15 ? (
          <div
            style={{
              position: 'absolute',
              top: -25,
              left: shineX,
              width: 120,
              height: 170,
              transform: 'rotate(18deg)',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.26),transparent)',
              filter: 'blur(4px)',
              opacity: shineP > 0 && shineP < 1 ? 1 : 0,
            }}
          />
        ) : null}
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18}}>
          {localUi > 0.15 ? (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '4px solid rgba(255,255,255,.22)',
                borderTopColor: 'rgba(255,255,255,.95)',
                opacity: spinner,
                transform: `rotate(${frame * 12}deg)`,
              }}
            />
          ) : null}
          <span style={{fontSize: 29, fontWeight: 760, letterSpacing: '0.11em', color: '#F8FFFE', textShadow: '0 2px 8px rgba(0,0,0,.16)'}}>
            {waiting > 0.5 ? 'WAITING' : localUi > 0.15 ? 'SUBMITTING' : 'LOG IN'}
          </span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: '2px solid rgba(88,255,237,.55)',
          transform: `translate(-50%,-50%) scale(${0.45 + afterTap * 1.55})`,
          opacity: afterTap * (1 - afterTap) * 1.9,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

const PremiumPhone: React.FC<{frame: number; revealP: number}> = ({frame, revealP}) => {
  const emailStart = 24;
  const emailEnd = 88;
  const passwordStart = 104;
  const passwordEnd = 154;
  const emailValue = typedText(frame, emailStart, emailEnd, email);
  const passwordP = clamp((frame - passwordStart) / Math.max(1, passwordEnd - passwordStart));
  const passwordDots = Math.floor(passwordP * passwordLength);
  const emailFocus = frame < passwordStart ? out(frame, 14, 30) * (1 - out(frame, 93, 107)) : 0;
  const passwordFocus = out(frame, 95, 111) * (1 - out(frame, 158, 172));
  const cursorBlink = Math.floor(frame / 14) % 2 === 0;
  const localUi = out(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);
  const heroScale = 1.08 + (0.64 - 1.08) * revealP;
  const heroTop = 360 + (1510 - 360) * revealP;
  const heroGlow = 1 - revealP * 0.58;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: heroTop,
        width: 760,
        height: 1560,
        transform: `translateX(-50%) scale(${heroScale})`,
        transformOrigin: '50% 0%',
        zIndex: 6,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 118,
          padding: 14,
          background: 'linear-gradient(145deg,#5576A6 0%,#1C365B 16%,#0B1524 48%,#315A8D 82%,#6D8FBD 100%)',
          boxShadow: `0 44px 105px rgba(0,0,0,.62),0 0 ${60 + heroGlow * 70}px rgba(44,122,255,${0.12 + heroGlow * 0.12}), inset 0 1px 0 rgba(255,255,255,.18)`,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: 105,
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 17%,#0B2237 0%,#071725 40%,#040C15 100%)',
            border: '2px solid rgba(123,164,222,.30)',
            boxShadow: 'inset 0 0 90px rgba(9,43,74,.34)',
          }}
        >
          <div style={{position: 'absolute', top: 31, left: 47, fontSize: 27, fontWeight: 650, color: '#F7FAFF'}}>10:28</div>
          <div style={{position: 'absolute', top: 31, right: 47, display: 'flex', alignItems: 'center', gap: 18}}>
            <SignalIcon/><WifiIcon/><BatteryIcon/>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 24,
              width: 230,
              height: 64,
              transform: 'translateX(-50%)',
              borderRadius: 34,
              background: '#02070D',
              boxShadow: 'inset 0 0 10px rgba(255,255,255,.02),0 3px 13px rgba(0,0,0,.45)',
            }}
          >
            <div style={{position: 'absolute', right: 23, top: 24, width: 12, height: 12, borderRadius: '50%', background: '#0D1A32', boxShadow: '0 0 7px rgba(55,77,180,.7)'}}/>
          </div>

          <div style={{position: 'absolute', left: 76, right: 76, top: 174}}>
            <div style={{width: 76, height: 76, borderRadius: 24, background: 'linear-gradient(145deg,#172F52,#0A1729)', border: '1px solid rgba(109,169,255,.32)', display: 'grid', placeItems: 'center', boxShadow: '0 0 30px rgba(55,123,230,.16)'}}>
              <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                <path d="M9 12.5C9 9.46 11.46 7 14.5 7h7C24.54 7 27 9.46 27 12.5V16" stroke="#75B7FF" strokeWidth="3.2" strokeLinecap="round"/>
                <path d="M16 20h16M26 14l6 6-6 6" stroke="#6EF0DD" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M27 24v3.5A5.5 5.5 0 0121.5 33h-7A5.5 5.5 0 019 27.5V20" stroke="#75B7FF" strokeWidth="3.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{marginTop: 38, fontSize: 70, fontWeight: 720, letterSpacing: '-0.045em', color: '#F7FAFF'}}>Welcome back</div>
            <div style={{marginTop: 14, fontSize: 27, color: 'rgba(198,216,238,.68)', lineHeight: 1.4}}>Sign in to continue to your account.</div>

            <div style={{marginTop: 72, display: 'flex', flexDirection: 'column', gap: 34}}>
              <InputField label="Email" value={emailValue} focused={emailFocus} cursor={emailFocus > 0.25 && cursorBlink}/>
              <InputField label="Password" value={'•'.repeat(passwordDots)} focused={passwordFocus} cursor={passwordFocus > 0.25 && cursorBlink} masked/>
            </div>

            <div style={{marginTop: 58}}>
              <HeroButton frame={frame} localUi={localUi}/>
            </div>

            <div style={{marginTop: 34, textAlign: 'center', color: 'rgba(169,192,220,.50)', fontSize: 22}}>Secure authentication</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SmallIcon: React.FC<{type: 'login'|'key'|'device'}> = ({type}) => {
  if (type === 'login') {
    return (
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
        <path d="M18 10H11a5 5 0 00-5 5v16a5 5 0 005 5h7" stroke="#DAA4FF" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18 23h21M32 16l7 7-7 7" stroke="#FFCDFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (type === 'key') {
    return (
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
        <circle cx="17" cy="16" r="8" stroke="#E7E7FF" strokeWidth="3"/>
        <path d="M23 22l16 16M31 30l5-5" stroke="#E7E7FF" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    );
  }
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
      <rect x="11" y="6" width="24" height="34" rx="4" stroke="#E7E7FF" strokeWidth="3"/>
      <path d="M17 12h12M18 34h10" stroke="#E7E7FF" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
};

const MiniPill: React.FC<{label: string; progress: number; activity: number; width?: number}> = ({label, progress, activity, width = 210}) => (
  <div
    style={{
      width,
      height: 70,
      borderRadius: 22,
      border: `3px solid rgba(29,220,153,${0.64 + activity * 0.34})`,
      background: `linear-gradient(180deg,rgba(10,54,39,${0.62 + activity * 0.28}) 0%,rgba(5,23,18,.98) 100%)`,
      boxShadow: `0 0 ${18 + activity * 28}px rgba(31,236,157,${0.06 + activity * 0.25}), inset 0 0 18px rgba(27,176,119,${0.08 + activity * 0.12})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#F7FFFC',
      fontSize: 31,
      fontWeight: activity > 0.3 ? 680 : 520,
      opacity: progress,
      transform: `translateY(${(1 - progress) * 16 - activity * 2}px) scale(${0.94 + progress * 0.06 + activity * 0.015})`,
      filter: `brightness(${0.90 + activity * 0.24})`,
    }}
  >
    {label}
  </div>
);

const Section: React.FC<{
  title: string;
  icon: 'login'|'key'|'device';
  progress: number;
  activityA: number;
  activityB: number;
  labels: [string,string];
}> = ({title, icon, progress, activityA, activityB, labels}) => (
  <div style={{height: 315, padding: '30px 42px 28px', opacity: progress, transform: `translateY(${(1 - progress) * 18}px)`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 64, height: 64, borderRadius: 18, background: '#070F1B', border: '1px solid rgba(148,101,255,.22)', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 18px rgba(113,73,220,.10)'}}>
        <SmallIcon type={icon}/>
      </div>
      <div style={{fontSize: 39, fontWeight: 720, letterSpacing: '-0.028em', color: '#F8F9FF'}}>{title}</div>
    </div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28}}>
      <MiniPill label={labels[0]} progress={progress} activity={activityA} width={title === 'Local UI State' ? 270 : 235}/>
      <MiniPill label={labels[1]} progress={progress} activity={activityB} width={205}/>
    </div>
    <div style={{height: 3, borderRadius: 999, marginTop: 34, background: 'linear-gradient(90deg,transparent,#7F33E9 12%,#B25CFF 50%,#7F33E9 88%,transparent)', opacity: 0.63, boxShadow: '0 0 18px rgba(178,92,255,.21)'}}/>
  </div>
);

const SecondaryStack: React.FC<{frame: number; revealP: number}> = ({frame, revealP}) => {
  const intentP = out(frame, SHOT01.loginIntent.start, SHOT01.loginIntent.panelRevealEnd);
  const credentialP = out(frame, SHOT01.credentialInput.start, SHOT01.credentialInput.revealEnd);
  const uiP = out(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);
  const validate = pulse(frame, SHOT01.loginIntent.validateGlowStart, SHOT01.loginIntent.validateGlowEnd, 10);
  const submit = pulse(frame, SHOT01.loginIntent.submitGlowStart, SHOT01.loginIntent.submitGlowEnd, 10);
  const identifier = pulse(frame, SHOT01.credentialInput.identifierGlowStart, SHOT01.credentialInput.identifierGlowEnd, 10);
  const secret = pulse(frame, SHOT01.credentialInput.secretGlowStart, SHOT01.credentialInput.secretGlowEnd, 10);
  const submitting = pulse(frame, SHOT01.localUiState.submittingStart, SHOT01.localUiState.submittingEnd, 10);
  const waiting = out(frame, SHOT01.localUiState.waitingStart, SHOT01.localUiState.waitingFull);
  const panelHeight = 350 + credentialP * 315 + uiP * 315;
  const borderGlow = 0.68 + Math.max(intentP, credentialP, uiP) * 0.32;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 126,
          width: 850,
          height: panelHeight,
          transform: `translateX(-50%) scale(${0.96 + intentP * 0.04})`,
          transformOrigin: '50% 0%',
          borderRadius: 54,
          padding: 10,
          background: 'linear-gradient(145deg,#7328D9 0%,#A446FF 46%,#6120C7 100%)',
          boxShadow: `0 24px 72px rgba(32,4,73,.56),0 0 52px rgba(157,66,255,${0.12 + borderGlow * 0.12})`,
          opacity: intentP,
          overflow: 'hidden',
          zIndex: 4,
        }}
      >
        <div style={{width: '100%', height: '100%', borderRadius: 45, overflow: 'hidden', background: 'linear-gradient(180deg,#071524 0%,#06111E 100%)', border: '2px solid rgba(201,137,255,.34)', boxShadow: 'inset 0 0 60px rgba(37,57,95,.18)'}}>
          <Section title="Login Intent" icon="login" progress={intentP} activityA={validate} activityB={submit} labels={['Validate','Submit']}/>
          <Section title="Credential Input" icon="key" progress={credentialP} activityA={identifier} activityB={secret} labels={['Identifier','Secret']}/>
          <Section title="Local UI State" icon="device" progress={uiP} activityA={submitting} activityB={waiting} labels={['Submitting','Waiting']}/>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 126 + panelHeight - 2,
          width: 8,
          height: Math.max(0, 1510 - (126 + panelHeight) + 55),
          transform: 'translateX(-50%)',
          borderRadius: 99,
          background: 'linear-gradient(180deg,#8E3AFF 0%,#4C2B92 46%,#173B5A 100%)',
          opacity: intentP * 0.42,
          boxShadow: '0 0 18px rgba(144,65,255,.18)',
          zIndex: 2,
        }}
      />
    </>
  );
};

export const PhoneFirstPreview: React.FC<Props> = ({showGuides}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const revealP = ease(frame, SHOT01.camera.worldRevealStart, SHOT01.camera.worldRevealEnd);
  const intro = spring({frame, fps: SHOT01_FPS, config: {damping: 18, stiffness: 95, mass: 1.05}, durationInFrames: 42});

  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 38%,#0B1D31 0%,#071321 42%,#040A12 100%)', overflow: 'hidden', fontFamily: 'Inter,ui-sans-serif,system-ui,sans-serif'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'linear-gradient(rgba(58,93,130,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(58,93,130,.18) 1px,transparent 1px)', backgroundSize: '72px 72px', maskImage: 'radial-gradient(circle at 50% 48%,black 26%,transparent 82%)'}}/>
      <div style={{position: 'absolute', left: '50%', top: 140, width: 1180, height: 1180, transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle,rgba(46,107,220,.16) 0%,rgba(8,23,40,.02) 58%,transparent 76%)', filter: 'blur(24px)', opacity: (1 - revealP) * 0.88 + 0.25}}/>
      <div style={{position: 'absolute', left: '50%', top: 50, width: 1100, height: 1200, transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle,rgba(137,62,255,.10) 0%,transparent 69%)', filter: 'blur(28px)', opacity: revealP * 0.9}}/>

      <div style={{opacity: intro}}>
        <SecondaryStack frame={frame} revealP={revealP}/>
        <PremiumPhone frame={frame} revealP={revealP}/>
      </div>

      {showGuides ? (
        <div style={{position: 'absolute', left: 26, bottom: 24, color: '#6C89A5', fontSize: 15, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', lineHeight: 1.5}}>
          <div>EP001 · PHONE-FIRST CINEMATIC PREVIEW</div>
          <div>frame {frame} · {(frame / SHOT01_FPS).toFixed(2)}s · {width}×{height}</div>
        </div>
      ) : null}

      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 230px rgba(0,3,8,.52)'}}/>
    </AbsoluteFill>
  );
};
