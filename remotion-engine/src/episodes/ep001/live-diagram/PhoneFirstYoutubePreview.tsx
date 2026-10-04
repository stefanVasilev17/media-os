import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {SHOT01, SHOT01_FPS} from './shot01Timing';

export const phoneFirstYoutubePreviewSchema = z.object({showGuides: z.boolean()});
type Props = z.infer<typeof phoneFirstYoutubePreviewSchema>;

const FONT = 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const out = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
const pulse = (frame: number, start: number, end: number, fade = 10) => Math.min(out(frame, start, Math.min(start + fade, end)), 1 - out(frame, Math.max(start, end - fade), end));

const EMAIL = 'user@example.com';
const typed = (frame: number, start: number, end: number, value: string) => {
  const p = clamp((frame - start) / Math.max(1, end - start));
  return value.slice(0, Math.floor((1 - Math.pow(1 - p, 1.35)) * value.length));
};

const StatusBar: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: 38, top: 24, fontSize: 17, fontWeight: 700, color: '#F7FAFF', letterSpacing: '-.02em'}}>10:28</div>
    <div style={{position: 'absolute', right: 34, top: 25, display: 'flex', alignItems: 'center', gap: 9}}>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 14}}>
        {[5, 8, 11, 14].map((h, i) => <div key={i} style={{width: 3, height: h, borderRadius: 2, background: i < 3 ? '#F7FAFF' : 'rgba(247,250,255,.4)'}} />)}
      </div>
      <svg width="18" height="14" viewBox="0 0 18 14">
        <path d="M2 5.4C6 2 12 2 16 5.4M5 8.3c2.4-2 5.6-2 8 0" fill="none" stroke="#F7FAFF" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="9" cy="11.5" r="1.2" fill="#F7FAFF" />
      </svg>
      <div style={{width: 27, height: 13, border: '1.4px solid rgba(247,250,255,.72)', borderRadius: 4, padding: 2, position: 'relative'}}>
        <div style={{height: '100%', width: '72%', background: '#F7FAFF', borderRadius: 2}} />
        <div style={{position: 'absolute', right: -3, top: 4, width: 2, height: 5, borderRadius: 1, background: 'rgba(247,250,255,.72)'}} />
      </div>
    </div>
  </>
);

const EnvelopeIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="3" stroke="#9CC9FF" strokeWidth="1.6" />
    <path d="M4.5 7l7.5 6 7.5-6" stroke="#9CC9FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="10" width="14" height="11" rx="3" stroke="#9CC9FF" strokeWidth="1.6" />
    <path d="M8 10V7.5A4 4 0 0112 3.5a4 4 0 014 4V10" stroke="#9CC9FF" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="15.5" r="1.2" fill="#9CC9FF" />
  </svg>
);

const EyeIcon: React.FC = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
    <path d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5-9.2-5-9.2-5z" stroke="#9CC9FF" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2.4" stroke="#9CC9FF" strokeWidth="1.5" />
  </svg>
);

const Field: React.FC<{label: string; value: string; focused: number; icon: 'email' | 'lock'; masked?: boolean}> = ({label, value, focused, icon, masked}) => (
  <div>
    <div style={{fontFamily: FONT, fontSize: 16, fontWeight: 650, color: '#C7D5E8', marginBottom: 9, letterSpacing: '-.01em'}}>{label}</div>
    <div style={{height: 62, borderRadius: 16, border: `1.7px solid rgba(${focused > .12 ? '66,155,255' : '48,91,145'},${.66 + focused * .28})`, background: 'linear-gradient(180deg,rgba(7,22,39,.96),rgba(3,13,25,.98))', boxShadow: focused > .12 ? `0 0 27px rgba(40,135,255,${.12 + focused * .16}), inset 0 1px 0 rgba(255,255,255,.035)` : 'inset 0 1px 0 rgba(255,255,255,.025), inset 0 0 25px rgba(20,46,80,.12)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', color: '#F4F8FF'}}>
      <div style={{width: 23, height: 23, opacity: .94, flex: '0 0 auto'}}>{icon === 'email' ? <EnvelopeIcon /> : <LockIcon />}</div>
      <div style={{flex: 1, fontFamily: FONT, fontSize: masked ? 21 : 16, fontWeight: masked ? 600 : 500, letterSpacing: masked ? '.16em' : '-.01em', whiteSpace: 'nowrap'}}>{value}</div>
      {masked ? <div style={{opacity: .92}}><EyeIcon /></div> : null}
    </div>
  </div>
);

const LoginButton: React.FC<{frame: number; localUi: number}> = ({frame, localUi}) => {
  const press = pulse(frame, SHOT01.phone.pressStart, SHOT01.phone.pressEnd, 7);
  const waiting = out(frame, SHOT01.localUiState.waitingStart, SHOT01.localUiState.waitingFull);
  const spinner = out(frame, SHOT01.localUiState.spinnerStart, SHOT01.localUiState.spinnerStart + 12);
  const working = localUi > .15;
  return (
    <div style={{height: 70, borderRadius: 19, border: `2px solid rgba(147,255,247,${working ? .60 : .92})`, background: working ? 'linear-gradient(180deg,#08716C,#07534F)' : 'linear-gradient(135deg,#2CE5DA 0%,#13C9C4 47%,#0A999B 100%)', boxShadow: working ? '0 14px 30px rgba(0,0,0,.35), 0 0 18px rgba(34,207,196,.10)' : '0 18px 38px rgba(0,220,208,.27), 0 0 38px rgba(38,228,218,.23), inset 0 2px 0 rgba(255,255,255,.30)', transform: `translateY(${press * 5}px) scale(${1 - press * .032})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: '1px 22px auto', height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)', opacity: working ? .20 : .72}} />
      {working ? <div style={{width: 18, height: 18, marginRight: 10, borderRadius: '50%', border: '2.4px solid rgba(255,255,255,.22)', borderTopColor: '#fff', opacity: spinner, transform: `rotate(${frame * 12}deg)`}} /> : null}
      <span style={{fontFamily: FONT, fontSize: 17, fontWeight: 700, letterSpacing: working ? '.10em' : '-.01em', color: '#F9FFFF'}}>{waiting > .5 ? 'Waiting' : working ? 'Submitting' : 'Log in'}</span>
      {!working ? <span style={{position: 'absolute', right: 22, fontFamily: FONT, fontSize: 30, fontWeight: 300, lineHeight: 1, color: '#F9FFFF', opacity: .92}}>→</span> : null}
    </div>
  );
};

const Iphone: React.FC<{frame: number; reveal: number; credential: number; ui: number}> = ({frame, reveal, credential, ui}) => {
  const emailValue = typed(frame, 18, 86, EMAIL);
  const passwordP = clamp((frame - SHOT01.phone.passwordStart) / Math.max(1, SHOT01.phone.passwordReady - SHOT01.phone.passwordStart));
  const dots = '•'.repeat(Math.floor(passwordP * 8));
  const emailFocus = frame < 104 ? out(frame, 12, 27) * (1 - out(frame, 91, 105)) : 0;
  const passwordFocus = out(frame, 95, 110) * (1 - out(frame, 158, 171));
  const localUi = out(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);

  const scale = 1 + (.72 - 1) * reveal + (.61 - .72) * credential + (.48 - .61) * ui;
  const top = 58 + (330 - 58) * reveal + (470 - 330) * credential + (602 - 470) * ui;

  return (
    <div style={{position: 'absolute', left: '50%', top, width: 590, height: 930, transform: `translateX(-50%) scale(${scale})`, transformOrigin: '50% 0%', zIndex: 5}}>
      <div style={{position: 'absolute', left: -7, top: 151, width: 7, height: 68, borderRadius: '5px 0 0 5px', background: 'linear-gradient(180deg,#8FA9C2,#1D334A 48%,#7A96B4)'}} />
      <div style={{position: 'absolute', left: -7, top: 249, width: 7, height: 111, borderRadius: '5px 0 0 5px', background: 'linear-gradient(180deg,#91ABC4,#1D334A 48%,#7290AF)'}} />
      <div style={{position: 'absolute', right: -7, top: 208, width: 7, height: 145, borderRadius: '0 5px 5px 0', background: 'linear-gradient(180deg,#91ABC4,#1D334A 48%,#7290AF)'}} />

      <div style={{position: 'absolute', inset: 0, borderRadius: 79, padding: 8, background: 'linear-gradient(145deg,#D3E2EF 0%,#6F8FAB 9%,#172535 24%,#050B11 47%,#263B50 70%,#A9BED1 90%,#E0EBF4 100%)', border: '1px solid rgba(223,239,251,.92)', boxShadow: '0 36px 95px rgba(0,0,0,.62), 0 0 34px rgba(85,145,210,.12), inset 0 1px 0 rgba(255,255,255,.72), inset 0 -1px 0 rgba(0,0,0,.72)'}}>
        <div style={{position: 'absolute', inset: 4, borderRadius: 75, border: '1px solid rgba(13,21,29,.92)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)', pointerEvents: 'none'}} />
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 70, overflow: 'hidden', background: 'radial-gradient(circle at 48% 18%,#0A2035 0%,#061522 37%,#030A12 100%)', border: '2px solid rgba(112,151,185,.40)', boxShadow: 'inset 0 0 80px rgba(8,40,70,.25)'}}>
          <div style={{position: 'absolute', width: 680, height: 680, left: -330, top: -170, borderRadius: '50%', border: '2px solid rgba(39,107,255,.34)', boxShadow: '0 0 40px rgba(26,91,255,.08)', transform: 'rotate(-18deg)'}} />
          <div style={{position: 'absolute', width: 600, height: 600, right: -395, bottom: -195, borderRadius: '50%', border: '2px solid rgba(10,159,255,.45)', boxShadow: '0 0 38px rgba(20,120,255,.09)'}} />
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(128deg,rgba(28,79,170,.12) 0%,transparent 31%,transparent 68%,rgba(0,127,217,.07) 100%)'}} />

          <StatusBar />
          <div style={{position: 'absolute', left: '50%', top: 15, width: 126, height: 36, transform: 'translateX(-50%)', borderRadius: 22, background: '#01050A', boxShadow: '0 3px 12px rgba(0,0,0,.55)'}}>
            <div style={{position: 'absolute', right: 13, top: 13, width: 7, height: 7, borderRadius: '50%', background: '#10213B', boxShadow: '0 0 4px rgba(61,107,190,.35)'}} />
          </div>

          <div style={{position: 'absolute', left: 52, right: 52, top: 128, bottom: 50}}>
            <div style={{textAlign: 'center', fontFamily: FONT, fontSize: 45, fontWeight: 720, letterSpacing: '-.04em', color: '#F7F9FD'}}>Log in</div>
            <div style={{marginTop: 9, textAlign: 'center', fontFamily: FONT, fontSize: 17, fontWeight: 450, letterSpacing: '-.01em', color: 'rgba(187,204,226,.76)'}}>Access your secure account.</div>

            <div style={{marginTop: 72, display: 'flex', flexDirection: 'column', gap: 28}}>
              <Field label="Email" value={emailValue} focused={emailFocus} icon="email" />
              <Field label="Password" value={dots} focused={passwordFocus} icon="lock" masked />
            </div>

            <div style={{position: 'absolute', left: 0, right: 0, bottom: 34}}>
              <LoginButton frame={frame} localUi={localUi} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pill: React.FC<{label: string; activity: number}> = ({label, activity}) => (
  <div style={{width: 152, height: 44, borderRadius: 14, border: `2px solid rgba(30,230,163,${.74 + activity * .24})`, background: `linear-gradient(180deg,rgba(8,58,40,${.72 + activity * .20}),rgba(3,20,15,.98))`, boxShadow: `0 0 ${10 + activity * 22}px rgba(29,242,172,${.06 + activity * .24}), inset 0 1px 0 rgba(255,255,255,.04)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 20, fontWeight: activity > .3 ? 700 : 520, letterSpacing: '-.015em', color: '#F5FFFB'}}>
    {label}
  </div>
);

const Section: React.FC<{title: string; a: string; b: string; activityA: number; activityB: number; divider: number}> = ({title, a, b, activityA, activityB, divider}) => (
  <div style={{height: 168, padding: '23px 38px 0'}}>
    <div style={{textAlign: 'center', fontFamily: FONT, fontSize: 28, fontWeight: 720, letterSpacing: '-.035em', color: '#F7F8FD'}}>{title}</div>
    <div style={{display: 'flex', justifyContent: 'center', gap: 22, marginTop: 18}}>
      <Pill label={a} activity={activityA} />
      <Pill label={b} activity={activityB} />
    </div>
    <div style={{height: 2, marginTop: 21, borderRadius: 999, background: 'linear-gradient(90deg,transparent,#7130D2 17%,#B04EFF 50%,#7130D2 83%,transparent)', opacity: .62 * divider, boxShadow: '0 0 12px rgba(176,78,255,.17)'}} />
  </div>
);

const Stack: React.FC<{frame: number}> = ({frame}) => {
  const intent = out(frame, SHOT01.loginIntent.start, SHOT01.loginIntent.panelRevealEnd);
  const credential = out(frame, SHOT01.credentialInput.start, SHOT01.credentialInput.revealEnd);
  const ui = out(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);
  const validate = pulse(frame, SHOT01.loginIntent.validateGlowStart, SHOT01.loginIntent.validateGlowEnd);
  const submit = pulse(frame, SHOT01.loginIntent.submitGlowStart, SHOT01.loginIntent.submitGlowEnd);
  const identifier = pulse(frame, SHOT01.credentialInput.identifierGlowStart, SHOT01.credentialInput.identifierGlowEnd);
  const secret = pulse(frame, SHOT01.credentialInput.secretGlowStart, SHOT01.credentialInput.secretGlowEnd);
  const submitting = pulse(frame, SHOT01.localUiState.submittingStart, SHOT01.localUiState.submittingEnd);
  const waiting = out(frame, SHOT01.localUiState.waitingStart, SHOT01.localUiState.waitingFull);
  const h = 190 + credential * 168 + ui * 168;
  const panelTop = 38;
  const phoneTop = 330 + (470 - 330) * credential + (602 - 470) * ui;
  const connectorHeight = Math.max(24, phoneTop - (panelTop + h));

  return (
    <>
      <div style={{position: 'absolute', left: '50%', top: panelTop, width: 610, height: h, transform: `translateX(-50%) scale(${.965 + intent * .035})`, transformOrigin: '50% 0%', borderRadius: 34, padding: 5, background: 'linear-gradient(145deg,#6A1BD4 0%,#A740FF 48%,#5514C2 100%)', boxShadow: '0 22px 65px rgba(30,3,75,.56), 0 0 40px rgba(160,58,255,.24)', opacity: intent, zIndex: 4, overflow: 'hidden'}}>
        <div style={{width: '100%', height: '100%', borderRadius: 29, overflow: 'hidden', background: 'linear-gradient(180deg,rgba(5,18,31,.99),rgba(3,12,22,.99))', border: '1px solid rgba(205,143,255,.30)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.025)'}}>
          <Section title="Login Intent" a="Validate" b="Submit" activityA={validate} activityB={submit} divider={credential} />
          <div style={{opacity: credential, transform: `translateY(${(1 - credential) * 12}px)`}}>
            <Section title="Credential Input" a="Identifier" b="Secret" activityA={identifier} activityB={secret} divider={ui} />
          </div>
          <div style={{opacity: ui, transform: `translateY(${(1 - ui) * 12}px)`}}>
            <Section title="Local UI State" a="Submitting" b="Waiting" activityA={submitting} activityB={waiting} divider={0} />
          </div>
        </div>
      </div>

      <div style={{position: 'absolute', left: '50%', top: panelTop + h - 1, width: 3, height: connectorHeight + 18, transform: 'translateX(-50%)', borderRadius: 999, background: 'linear-gradient(180deg,#8D31FF 0%,#56218D 52%,#1C4164 100%)', opacity: intent * .62, boxShadow: '0 0 11px rgba(142,51,255,.20)', zIndex: 2}} />
    </>
  );
};

export const PhoneFirstYoutubePreview: React.FC<Props> = ({showGuides}) => {
  const frame = useCurrentFrame();
  const reveal = ease(frame, SHOT01.camera.worldRevealStart, SHOT01.camera.worldRevealEnd);
  const credential = ease(frame, SHOT01.credentialInput.start, SHOT01.credentialInput.revealEnd);
  const ui = ease(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);
  const intro = spring({frame, fps: SHOT01_FPS, config: {damping: 18, stiffness: 95, mass: 1.05}, durationInFrames: 42});
  const requestHint = out(frame, SHOT01.requestAssemblyHint.start, SHOT01.requestAssemblyHint.end);

  return (
    <AbsoluteFill style={{background: '#010711', overflow: 'hidden', fontFamily: FONT}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 48%,rgba(8,28,48,.42) 0%,rgba(2,11,21,.13) 43%,transparent 72%)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,transparent 36%,rgba(0,2,7,.34) 100%)'}} />

      <div style={{opacity: intro}}>
        <Stack frame={frame} />
        <Iphone frame={frame} reveal={reveal} credential={credential} ui={ui} />
      </div>

      <div style={{position: 'absolute', right: 84, bottom: 58, opacity: requestHint * .22, transform: `translateX(${(1 - requestHint) * 18}px)`, fontFamily: FONT, fontSize: 17, fontWeight: 650, letterSpacing: '.06em', color: '#8AA9C8'}}>REQUEST ASSEMBLY →</div>

      {showGuides ? <div style={{position: 'absolute', inset: 40, border: '1px dashed rgba(255,255,255,.20)', pointerEvents: 'none'}} /> : null}
    </AbsoluteFill>
  );
};
