import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {SHOT01, SHOT01_FPS} from './shot01Timing';

export const phoneFirstYoutubePreviewSchema = z.object({showGuides: z.boolean()});
type Props = z.infer<typeof phoneFirstYoutubePreviewSchema>;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const out = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
const pulse = (frame: number, start: number, end: number, fade = 10) => Math.min(out(frame, start, Math.min(start + fade, end)), 1 - out(frame, Math.max(start, end - fade), end));

const email = 'user@example.com';
const typed = (frame: number, start: number, end: number, value: string) => {
  const p = clamp((frame - start) / Math.max(1, end - start));
  return value.slice(0, Math.floor((1 - Math.pow(1 - p, 1.35)) * value.length));
};

const StatusBar = () => (
  <>
    <div style={{position: 'absolute', left: 34, top: 22, fontSize: 18, fontWeight: 700, color: '#F8FAFF'}}>10:28</div>
    <div style={{position: 'absolute', right: 31, top: 23, display: 'flex', alignItems: 'center', gap: 9}}>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 2, height: 14}}>{[5,8,11,14].map((h,i)=><div key={i} style={{width: 3, height: h, borderRadius: 2, background: i < 3 ? '#F8FAFF' : 'rgba(248,250,255,.35)'}}/>)}</div>
      <svg width="18" height="14" viewBox="0 0 18 14"><path d="M2 5.4C6 2 12 2 16 5.4M5 8.3c2.4-2 5.6-2 8 0" fill="none" stroke="#F8FAFF" strokeWidth="1.7" strokeLinecap="round"/><circle cx="9" cy="11.5" r="1.2" fill="#F8FAFF"/></svg>
      <div style={{width: 27, height: 13, border: '1.4px solid rgba(248,250,255,.68)', borderRadius: 4, padding: 2, position: 'relative'}}><div style={{height: '100%', width: '72%', background: '#F8FAFF', borderRadius: 2}}/><div style={{position:'absolute',right:-3,top:4,width:2,height:5,borderRadius:1,background:'rgba(248,250,255,.65)'}}/></div>
    </div>
  </>
);

const Field: React.FC<{label: string; value: string; focused: number; masked?: boolean}> = ({label, value, focused, masked}) => (
  <div>
    <div style={{fontSize: 15, fontWeight: 650, color: 'rgba(198,216,238,.70)', marginBottom: 8}}>{label}</div>
    <div style={{height: 58, borderRadius: 15, border: `1.6px solid rgba(${focused > .15 ? '83,158,255' : '55,76,105'},${.56 + focused * .34})`, background: 'linear-gradient(180deg,#081524,#050E18)', boxShadow: focused > .15 ? `0 0 24px rgba(50,120,255,${.10 + focused*.16})` : 'inset 0 0 20px rgba(19,38,65,.18)', display:'flex',alignItems:'center',padding:'0 18px',fontSize: masked ? 22 : 16,letterSpacing: masked ? '.20em' : '0',color:'#F3F7FF'}}>{value}</div>
  </div>
);

const LoginButton: React.FC<{frame:number; localUi:number}> = ({frame, localUi}) => {
  const press = pulse(frame, SHOT01.phone.pressStart, SHOT01.phone.pressEnd, 7);
  const waiting = out(frame, SHOT01.localUiState.waitingStart, SHOT01.localUiState.waitingFull);
  const spinner = out(frame, SHOT01.localUiState.spinnerStart, SHOT01.localUiState.spinnerStart + 12);
  return (
    <div style={{height:70,borderRadius:20,border:`2px solid rgba(117,255,244,${.88-localUi*.22})`,background:localUi>.15?'linear-gradient(180deg,#0B7773,#07524F)':'linear-gradient(135deg,#27E7DA 0%,#14C9BA 46%,#078E87 100%)',boxShadow:localUi>.15?'0 12px 28px rgba(0,0,0,.28),0 0 18px rgba(40,214,196,.12)':'0 16px 36px rgba(4,203,187,.28),0 0 34px rgba(28,226,211,.19),inset 0 2px 0 rgba(255,255,255,.28)',transform:`translateY(${press*5}px) scale(${1-press*.032})`,display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
      {localUi>.15 ? <div style={{width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,.22)',borderTopColor:'#fff',opacity:spinner,transform:`rotate(${frame*12}deg)`}}/> : null}
      <span style={{fontSize:16,fontWeight:800,letterSpacing:'.16em',color:'#F8FFFE'}}>{waiting>.5?'WAITING':localUi>.15?'SUBMITTING':'LOG IN'}</span>
    </div>
  );
};

const Iphone: React.FC<{frame:number; reveal:number; credential:number; ui:number}> = ({frame,reveal,credential,ui}) => {
  const emailValue = typed(frame, 24, 88, email);
  const passwordP = clamp((frame - 104) / 50);
  const dots = '•'.repeat(Math.floor(passwordP * 8));
  const emailFocus = frame < 104 ? out(frame,14,30)*(1-out(frame,93,107)) : 0;
  const passwordFocus = out(frame,95,111)*(1-out(frame,158,172));
  const localUi = out(frame, SHOT01.localUiState.start, SHOT01.localUiState.revealEnd);
  const scale = 1.0 + (.70-1.0)*reveal + (.64-.70)*credential + (.59-.64)*ui;
  const top = 82 + (395-82)*reveal + (480-395)*credential + (535-480)*ui;
  return (
    <div style={{position:'absolute',left:'50%',top,width:540,height:860,transform:`translateX(-50%) scale(${scale})`,transformOrigin:'50% 0%',zIndex:5}}>
      <div style={{position:'absolute',left:-8,top:140,width:8,height:82,borderRadius:'6px 0 0 6px',background:'linear-gradient(180deg,#2B4D75,#0F223A)'}}/>
      <div style={{position:'absolute',left:-8,top:242,width:8,height:120,borderRadius:'6px 0 0 6px',background:'linear-gradient(180deg,#2B4D75,#0F223A)'}}/>
      <div style={{position:'absolute',right:-8,top:205,width:8,height:150,borderRadius:'0 6px 6px 0',background:'linear-gradient(180deg,#2B4D75,#0F223A)'}}/>
      <div style={{position:'absolute',inset:0,borderRadius:72,padding:9,background:'linear-gradient(145deg,#8DB9F0 0%,#335F97 12%,#112B4B 31%,#081421 53%,#2A568E 78%,#A7C9F3 100%)',border:'1px solid rgba(182,222,255,.86)',boxShadow:'0 36px 90px rgba(0,0,0,.58),0 0 42px rgba(46,134,255,.18),inset 0 1px 0 rgba(255,255,255,.45)'}}>
        <div style={{position:'relative',width:'100%',height:'100%',borderRadius:63,overflow:'hidden',background:'radial-gradient(circle at 50% 16%,#0B2237 0%,#071725 40%,#040C15 100%)',border:'2px solid rgba(144,193,255,.42)',boxShadow:'inset 0 0 70px rgba(9,43,74,.30)'}}>
          <StatusBar/>
          <div style={{position:'absolute',left:'50%',top:13,width:126,height:36,transform:'translateX(-50%)',borderRadius:22,background:'#02070D',boxShadow:'0 3px 10px rgba(0,0,0,.45)'}}><div style={{position:'absolute',right:13,top:13,width:7,height:7,borderRadius:'50%',background:'#10213B'}}/></div>
          <div style={{position:'absolute',left:48,right:48,top:104,bottom:42}}>
            <div style={{textAlign:'center',fontSize:44,fontWeight:760,letterSpacing:'-.035em',color:'#F7FAFF'}}>Log in</div>
            <div style={{marginTop:8,textAlign:'center',fontSize:16,color:'rgba(198,216,238,.65)'}}>Sign in to continue to your account.</div>
            <div style={{marginTop:38,display:'flex',flexDirection:'column',gap:22}}>
              <Field label="Email" value={emailValue} focused={emailFocus}/>
              <Field label="Password" value={dots} focused={passwordFocus} masked/>
            </div>
            <div style={{position:'absolute',left:0,right:0,bottom:44}}><LoginButton frame={frame} localUi={localUi}/><div style={{marginTop:15,textAlign:'center',fontSize:13,color:'rgba(169,192,220,.44)'}}>Secure authentication</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pill:React.FC<{label:string;activity:number;width?:number}>=({label,activity,width=150})=><div style={{width,height:42,borderRadius:13,border:`2px solid rgba(29,220,153,${.65+activity*.32})`,background:`linear-gradient(180deg,rgba(10,54,39,${.65+activity*.24}),rgba(5,23,18,.98))`,boxShadow:`0 0 ${10+activity*20}px rgba(31,236,157,${.06+activity*.22})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:activity>.3?700:520,color:'#F7FFFC'}}>{label}</div>;

const Section:React.FC<{title:string;a:string;b:string;activityA:number;activityB:number;showDivider:number}>=({title,a,b,activityA,activityB,showDivider})=>(
  <div style={{height:150,padding:'18px 34px 0'}}>
    <div style={{textAlign:'center',fontSize:27,fontWeight:740,letterSpacing:'-.025em',color:'#F8F9FF'}}>{title}</div>
    <div style={{display:'flex',justifyContent:'center',gap:20,marginTop:17}}><Pill label={a} activity={activityA}/><Pill label={b} activity={activityB}/></div>
    <div style={{height:2,marginTop:20,borderRadius:999,background:'linear-gradient(90deg,transparent,#7F33E9 15%,#B25CFF 50%,#7F33E9 85%,transparent)',opacity:.58*showDivider,boxShadow:'0 0 12px rgba(178,92,255,.18)'}}/>
  </div>
);

const Stack:React.FC<{frame:number}>=({frame})=>{
  const intent=out(frame,SHOT01.loginIntent.start,SHOT01.loginIntent.panelRevealEnd);
  const credential=out(frame,SHOT01.credentialInput.start,SHOT01.credentialInput.revealEnd);
  const ui=out(frame,SHOT01.localUiState.start,SHOT01.localUiState.revealEnd);
  const validate=pulse(frame,SHOT01.loginIntent.validateGlowStart,SHOT01.loginIntent.validateGlowEnd);
  const submit=pulse(frame,SHOT01.loginIntent.submitGlowStart,SHOT01.loginIntent.submitGlowEnd);
  const identifier=pulse(frame,SHOT01.credentialInput.identifierGlowStart,SHOT01.credentialInput.identifierGlowEnd);
  const secret=pulse(frame,SHOT01.credentialInput.secretGlowStart,SHOT01.credentialInput.secretGlowEnd);
  const submitting=pulse(frame,SHOT01.localUiState.submittingStart,SHOT01.localUiState.submittingEnd);
  const waiting=out(frame,SHOT01.localUiState.waitingStart,SHOT01.localUiState.waitingFull);
  const h=170+credential*150+ui*150;
  return <>
    <div style={{position:'absolute',left:'50%',top:48,width:560,height:h,transform:`translateX(-50%) scale(${.97+intent*.03})`,transformOrigin:'50% 0%',borderRadius:32,padding:6,background:'linear-gradient(145deg,#7425DA,#A446FF 48%,#6120C7)',boxShadow:'0 18px 55px rgba(32,4,73,.52),0 0 35px rgba(157,66,255,.18)',opacity:intent,zIndex:4,overflow:'hidden'}}>
      <div style={{width:'100%',height:'100%',borderRadius:27,overflow:'hidden',background:'linear-gradient(180deg,#071524,#06111E)',border:'1px solid rgba(201,137,255,.34)'}}>
        <Section title="Login Intent" a="Validate" b="Submit" activityA={validate} activityB={submit} showDivider={credential}/>
        <div style={{opacity:credential,transform:`translateY(${(1-credential)*10}px)`}}><Section title="Credential Input" a="Identifier" b="Secret" activityA={identifier} activityB={secret} showDivider={ui}/></div>
        <div style={{opacity:ui,transform:`translateY(${(1-ui)*10}px)`}}><Section title="Local UI State" a="Submitting" b="Waiting" activityA={submitting} activityB={waiting} showDivider={0}/></div>
      </div>
    </div>
    <div style={{position:'absolute',left:'50%',top:48+h-1,width:4,height:190,transform:'translateX(-50%)',borderRadius:99,background:'linear-gradient(180deg,#8E3AFF,#4C2B92 48%,#173B5A)',opacity:intent*.52,boxShadow:'0 0 12px rgba(144,65,255,.18)',zIndex:2}}/>
  </>;
};

export const PhoneFirstYoutubePreview:React.FC<Props>=({showGuides})=>{
  const frame=useCurrentFrame();
  const reveal=ease(frame,SHOT01.camera.worldRevealStart,SHOT01.camera.worldRevealEnd);
  const credential=ease(frame,SHOT01.credentialInput.start,SHOT01.credentialInput.revealEnd);
  const ui=ease(frame,SHOT01.localUiState.start,SHOT01.localUiState.revealEnd);
  const intro=spring({frame,fps:SHOT01_FPS,config:{damping:18,stiffness:95,mass:1.05},durationInFrames:42});
  return <AbsoluteFill style={{background:'#020811',overflow:'hidden',fontFamily:'Inter,ui-sans-serif,system-ui,sans-serif'}}>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 48%,rgba(10,29,49,.34) 0%,rgba(4,13,24,.10) 43%,transparent 72%)'}}/>
    <div style={{opacity:intro}}><Stack frame={frame}/><Iphone frame={frame} reveal={reveal} credential={credential} ui={ui}/></div>
    {showGuides?<div style={{position:'absolute',left:24,bottom:20,color:'#526A82',fontSize:13}}>EP001 · YOUTUBE WIDESCREEN PREVIEW</div>:null}
  </AbsoluteFill>;
};
