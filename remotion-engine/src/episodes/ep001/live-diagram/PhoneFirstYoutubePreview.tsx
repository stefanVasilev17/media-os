import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {ATBackground, AT_FONT, ATPhone, ATSecondaryStack} from '../../../components/architectural-thinking';
import {SHOT01, SHOT01_FPS} from './shot01Timing';

export const phoneFirstYoutubePreviewSchema = z.object({showGuides: z.boolean()});
type Props = z.infer<typeof phoneFirstYoutubePreviewSchema>;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const out = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
const pulse = (frame: number, start: number, end: number, fade = 10) => Math.min(out(frame, start, Math.min(start + fade, end)), 1 - out(frame, Math.max(start, end - fade), end));

const EMAIL = 'user@example.com';
const typed = (frame: number, start: number, end: number, value: string) => {
  const p = clamp((frame - start) / Math.max(1, end - start));
  return value.slice(0, Math.floor((1 - Math.pow(1 - p, 1.35)) * value.length));
};

export const PhoneFirstYoutubePreview: React.FC<Props> = ({showGuides}) => {
  const frame = useCurrentFrame();
  const reveal = ease(frame,SHOT01.camera.worldRevealStart,SHOT01.camera.worldRevealEnd);
  const credential = ease(frame,SHOT01.credentialInput.start,SHOT01.credentialInput.revealEnd);
  const ui = ease(frame,SHOT01.localUiState.start,SHOT01.localUiState.revealEnd);
  const intro = spring({frame,fps:SHOT01_FPS,config:{damping:18,stiffness:95,mass:1.05},durationInFrames:42});
  const requestHint = out(frame,SHOT01.requestAssemblyHint.start,SHOT01.requestAssemblyHint.end);

  const emailValue = typed(frame,18,86,EMAIL);
  const passwordP = clamp((frame-SHOT01.phone.passwordStart)/Math.max(1,SHOT01.phone.passwordReady-SHOT01.phone.passwordStart));
  const passwordDots = '•'.repeat(Math.floor(passwordP*8));
  const emailFocus = frame<104?out(frame,12,27)*(1-out(frame,91,105)):0;
  const passwordFocus = out(frame,95,110)*(1-out(frame,158,171));
  const localUi = out(frame,SHOT01.localUiState.start,SHOT01.localUiState.revealEnd);
  const press = pulse(frame,SHOT01.phone.pressStart,SHOT01.phone.pressEnd,7);
  const waiting = out(frame,SHOT01.localUiState.waitingStart,SHOT01.localUiState.waitingFull);
  const spinner = out(frame,SHOT01.localUiState.spinnerStart,SHOT01.localUiState.spinnerStart+12);

  const intent = out(frame,SHOT01.loginIntent.start,SHOT01.loginIntent.panelRevealEnd);
  const validate = pulse(frame,SHOT01.loginIntent.validateGlowStart,SHOT01.loginIntent.validateGlowEnd);
  const submit = pulse(frame,SHOT01.loginIntent.submitGlowStart,SHOT01.loginIntent.submitGlowEnd);
  const identifier = pulse(frame,SHOT01.credentialInput.identifierGlowStart,SHOT01.credentialInput.identifierGlowEnd);
  const secret = pulse(frame,SHOT01.credentialInput.secretGlowStart,SHOT01.credentialInput.secretGlowEnd);
  const submitting = pulse(frame,SHOT01.localUiState.submittingStart,SHOT01.localUiState.submittingEnd);
  const stackWaiting = out(frame,SHOT01.localUiState.waitingStart,SHOT01.localUiState.waitingFull);
  const height = 205 + credential*180 + ui*180;
  const panelTop = 30;
  const phoneTop = 332 + (468-332)*credential + (592-468)*ui;
  const connectorHeight = Math.max(20,phoneTop-(panelTop+height));

  return (
    <ATBackground>
      <div style={{opacity:intro}}>
        <ATSecondaryStack
          frame={frame}
          intent={intent}
          height={height}
          panelTop={panelTop}
          connectorHeight={connectorHeight}
          sections={[
            {
              title:'Login Intent',
              items:[
                {label:'Validate',activity:validate},
                {label:'Submit',activity:submit},
              ],
              reveal:1,
              divider:credential,
            },
            {
              title:'Credential Input',
              items:[
                {label:'Identifier',activity:identifier},
                {label:'Secret',activity:secret},
              ],
              reveal:credential,
              divider:ui,
            },
            {
              title:'Local UI State',
              items:[
                {label:'Submitting',activity:submitting},
                {label:'Waiting',activity:stackWaiting},
              ],
              reveal:ui,
              divider:0,
            },
          ]}
        />
        <ATPhone
          frame={frame}
          reveal={reveal}
          credential={credential}
          ui={ui}
          emailValue={emailValue}
          passwordDots={passwordDots}
          emailFocus={emailFocus}
          passwordFocus={passwordFocus}
          localUi={localUi}
          press={press}
          waiting={waiting}
          spinner={spinner}
        />
      </div>
      <div style={{position:'absolute',right:84,bottom:58,opacity:requestHint*.20,transform:`translateX(${(1-requestHint)*18}px)`,fontFamily:AT_FONT,fontSize:17,fontWeight:650,letterSpacing:'.06em',color:'#8AA9C8'}}>REQUEST ASSEMBLY →</div>
      {showGuides?<div style={{position:'absolute',inset:40,border:'1px dashed rgba(255,255,255,.20)',pointerEvents:'none'}}/>:null}
    </ATBackground>
  );
};
