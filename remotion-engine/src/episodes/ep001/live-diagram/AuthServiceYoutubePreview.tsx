import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {AT_FONT} from '../../../components/architectural-thinking';
import {NetworkTransitYoutubePreview} from './NetworkTransitYoutubePreview';
import {SHOT04_DURATION_FRAMES} from './shot04Timing';

type Props = {
  durationInFrames: number;
  anchors?: Record<string, number>;
  clipStarts?: number[];
};

const ease = (frame: number, begin: number, end: number) => interpolate(
  frame, [begin, Math.max(begin + 1, end)], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}
);

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const WHITE = '#F0F5FF';
const FAINT = '#8D9DB8';
const MINT = '#62D8BD';
const CYAN = '#64DCFA';
const PURPLE = '#A49CFF';

const status = (text: string, active: boolean, color: string = PURPLE): React.CSSProperties => ({
  border: '1px solid ' + (active ? color : '#3C4F75'),
  borderRadius: 15,
  color: active ? WHITE : FAINT,
  background: active ? 'rgba(60,70,122,.24)' : 'rgba(14,24,43,.85)',
  padding: '15px 17px',
  fontSize: 29,
  fontWeight: 750,
  letterSpacing: .25,
  lineHeight: 1.15,
  minHeight: 86,
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
});

const CARD: React.CSSProperties = {
  position: 'absolute',
  top: 232,
  height: 515,
  borderRadius: 22,
  border: '1.5px solid rgba(115,143,213,.5)',
  background: 'linear-gradient(150deg,rgba(12,27,53,.985),rgba(7,18,38,.99))',
  padding: '30px 25px',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 29,
  fontWeight: 850,
  color: '#EAF2FF',
  letterSpacing: .4,
  marginBottom: 28,
  lineHeight: 1.15,
};

const highlightedField = (highlighted: boolean): React.CSSProperties => ({
  border: highlighted ? '2px solid rgba(104,218,235,.9)' : '1.5px solid rgba(112,151,208,.36)',
  background: highlighted ? 'rgba(40,83,110,.39)' : 'rgba(9,24,46,.92)',
  borderRadius: 13,
  padding: '15px 18px',
  marginTop: 16,
  minHeight: 100,
  boxSizing: 'border-box',
});

const caption: React.CSSProperties = {fontSize: 28, color: FAINT, fontWeight: 650, letterSpacing: .2};
const value: React.CSSProperties = {fontSize: 30, color: WHITE, fontWeight: 760, marginTop: 8};

const CheckRow: React.FC<{title: string; active: boolean; complete: boolean}> = ({title, active, complete}) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 84, marginBottom: 15, padding: '15px 19px', borderRadius: 15,
    boxSizing: 'border-box',
    border: '1.5px solid ' + (active ? 'rgba(95,215,196,.8)' : 'rgba(115,141,196,.29)'),
    background: active ? 'rgba(40,99,87,.25)' : 'rgba(13,28,53,.76)',
  }}>
    <span style={{fontSize: 31, fontWeight: 710, color: active ? WHITE : FAINT}}>{title}</span>
    {complete && <span style={{fontSize: 34, fontWeight: 900, color: MINT, marginLeft: 15}}>✓</span>}
  </div>
);

export const AuthServiceYoutubePreview: React.FC<Props> = ({durationInFrames, anchors = {}, clipStarts = []}) => {
  const frame = useCurrentFrame();
  const total = Math.max(1, durationInFrames);
  const fallback = [0, .20, .39, .60, .79].map(x => Math.round(total * x));
  const starts = fallback.map((x, index) => Number.isFinite(clipStarts[index]) ? clipStarts[index] : x);
  const cues = (key: string, base: number, offset: number) =>
    Number.isFinite(anchors[key]) ? Math.round(anchors[key] * 30) : starts[base] + offset;

  const opening = ease(frame, Math.max(12, starts[0] + 3), Math.max(72, starts[0] + 74));
  const info = ease(frame, cues('INBOX_OPEN', 1, 12), cues('INBOX_OPEN', 1, 12) + 22);
  const email = ease(frame, cues('IDENTIFIER_ROLE', 1, 49) - 8, cues('IDENTIFIER_ROLE', 1, 49) + 16);
  const password = ease(frame, cues('SECRET_ROLE', 1, 75) - 8, cues('SECRET_ROLE', 1, 75) + 16);
  const validation = ease(frame, cues('VALIDATION_NAME', 2, 8), cues('VALIDATION_NAME', 2, 8) + 22);
  const required = ease(frame, cues('REQUIRED_CHECK', 2, 80), cues('REQUIRED_CHECK', 2, 80) + 18);
  const structure = ease(frame, cues('STRUCTURE_CHECK', 2, 115), cues('STRUCTURE_CHECK', 2, 115) + 18);
  const limits = ease(frame, cues('LIMITS_CHECK', 2, 151), cues('LIMITS_CHECK', 2, 151) + 18);
  const valid = ease(frame, cues('VALID_NOT_LOGIN', 2, 175), cues('VALID_NOT_LOGIN', 2, 175) + 15);
  const missing = ease(frame, cues('GET_FACTS', 3, 75), cues('GET_FACTS', 3, 75) + 25);
  const lookupPrepared = ease(frame, cues('LOOKUP_BORN', 3, 110), cues('LOOKUP_BORN', 3, 110) + 22);
  const lookupMoving = ease(frame, cues('LOOKUP_TRAVELS', 4, 39), cues('LOOKUP_TRAVELS', 4, 39) + 80);
  const exit = ease(frame, starts[4] + 54, starts[4] + 111);
  const panel = clamp(opening * (1 - exit));
  const showEmail = info > .03;
  const showPassword = info > .03;
  const showChecks = validation > .02;
  const lineOpacity = .4 + .6 * panel;

  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: AT_FONT, color: WHITE, background: '#05101D'}}>
    <div style={{position: 'absolute', inset: 0, opacity: 1 - panel * .40}}>
      <NetworkTransitYoutubePreview
        showGuides={false}
        frameOverride={SHOT04_DURATION_FRAMES - 1}
        gatewayHandoff={315}
        balancerHandoff={300}
        balancerActive={.3 + .34 * (1 - opening)}
        balancerIntroArrival={1}
        balancerIntroSelected={1}
        balancerIntroFlow={1}
        balancerIntroFrame={5100}
        balancerIntroHandoff={1}
        authActive={1}
        networkActiveMultiplier={0}
      />
    </div>
    <div style={{position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 52% 49%,rgba(2,9,23,.96),rgba(2,6,15,.99))',
      opacity: .95 * panel, pointerEvents: 'none'}}/>
    <div style={{
      position: 'absolute', left: 130, top: 105, width: 1660, height: 860,
      borderRadius: 29, border: '2px solid rgba(145,141,246,.7)',
      boxShadow: '0 33px 125px rgba(0,0,0,.67),0 0 75px rgba(107,115,218,.17)',
      background: 'linear-gradient(155deg,rgba(9,23,48,.98),rgba(4,12,28,.995))',
      opacity: panel, transform: 'translateY(' + ((1 - opening) * 36) + 'px)',
      overflow: 'hidden', boxSizing: 'border-box',
    }}>
      <div style={{position: 'absolute', left: 64, top: 44, right: 64,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: 53, fontWeight: 875, letterSpacing: -.7}}>Auth Service</div>
        <div style={{width: 325, ...status('IDENTITY\nUNVERIFIED', true),
          whiteSpace: 'pre-line', fontSize: 28, justifyContent: 'center', textAlign: 'center',
        }}>IDENTITY{'\n'}UNVERIFIED</div>
      </div>
      <div style={{...CARD, left: 56, width: 400}}>
        <div style={sectionLabel}>LOGIN REQUEST</div>
        <div style={highlightedField(email > .15 && password < .65)}>
          <div style={caption}>ACCOUNT IDENTIFIER</div>
          <div style={value}>{showEmail ? 'alex@example.com' : '—'}</div>
        </div>
        <div style={highlightedField(password > .15)}>
          <div style={caption}>PASSWORD</div>
          <div style={value}>{showPassword ? '••••••••••' : '—'}</div>
        </div>
        <div style={{marginTop: 26, ...status('RECEIVED', info > .3, MINT), justifyContent: 'center'}}>
          RECEIVED
        </div>
      </div>
      <div style={{...CARD, left: 511, width: 567, borderColor: validation > .02 ? 'rgba(118,224,197,.68)' : 'rgba(115,143,213,.4)'}}>
        <div style={sectionLabel}>REQUEST VALIDATION</div>
        <div style={{opacity: showChecks ? 1 : .33}}>
          <CheckRow title="REQUIRED FIELDS" active={required > .5} complete={required > .93}/>
          <CheckRow title="EXPECTED FORMAT" active={structure > .5} complete={structure > .93}/>
          <CheckRow title="INPUT LIMITS" active={limits > .5} complete={limits > .93}/>
        </div>
        <div style={{...status('REQUEST VALID', valid > .7, MINT), marginTop: 22,
          justifyContent: 'center', opacity: valid > .01 ? 1 : .18}}>
          REQUEST VALID
        </div>
      </div>
      <div style={{...CARD, left: 1133, width: 471, borderColor: 'rgba(143,140,234,.58)'}}>
        <div style={sectionLabel}>AUTH DECISION</div>
        <div style={{...status('NOT\nAUTHENTICATED', valid > .4), whiteSpace: 'pre-line',
          justifyContent: 'center', textAlign: 'center', minHeight: 115}}>
          NOT{'\n'}AUTHENTICATED
        </div>
        <div style={{marginTop: 24, fontSize: 30, fontWeight: 750, color: FAINT,
          lineHeight: 1.36, opacity: missing > .01 ? 1 : .38}}>
          {missing > .01 ? <>ACCOUNT DATA<br/>NEEDED</> : <>PROOF STILL<br/>REQUIRED</>}
        </div>
        {lookupPrepared > .01 && <div style={{marginTop: 35, ...status('USER LOOKUP', lookupPrepared > .7, CYAN),
          justifyContent: 'center', opacity: lookupPrepared}}>
          USER LOOKUP
        </div>}
      </div>
      <div style={{position: 'absolute', top: 785, left: 75, width: 1510,
        display: 'flex', justifyContent: 'space-between',
        borderTop: '1px solid rgba(118,142,203,.3)', paddingTop: 27, color: FAINT,
        fontSize: 28, fontWeight: 710, opacity: lineOpacity}}>
        <div style={{color: MINT}}>REQUEST RECEIVED</div>
        <div style={{color: validation > .7 ? MINT : FAINT}}>STRUCTURE CHECK</div>
        <div style={{color: PURPLE}}>IDENTITY NOT YET PROVEN</div>
      </div>
    </div>
    {lookupMoving > .01 && <svg width="1920" height="1080" viewBox="0 0 1920 1080"
      style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 25,
        opacity: clamp(exit * 1.15)}}>
      <path d="M 1200 672 H 1693" stroke={CYAN} strokeOpacity=".34" strokeWidth="5"
        strokeDasharray="12 13" fill="none"/>
      <circle cx={1200 + 460 * lookupMoving} cy={672} r={14} fill={CYAN}
        stroke="#DAF8FF" strokeWidth={3}/>
      <text x="1230" y="622" fill={CYAN} fontSize={29} fontWeight={750}>USER LOOKUP</text>
    </svg>}
  </div>;
};
