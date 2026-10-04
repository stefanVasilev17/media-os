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
    <div style={{position:'absolute',left:34,top:22,fontSize:17,fontWeight:700,color:'#F7FAFF',letterSpacing:'-.02em'}}>9:41</div>
    <div style={{position:'absolute',right:31,top:23,display:'flex',alignItems:'center',gap:9}}>
      <div style={{display:'flex',alignItems:'flex-end',gap:2.5,height:14}}>{[5,8,11,14].map((h,i)=><div key={i} style={{width:3,height:h,borderRadius:2,background:i<3?'#F7FAFF':'rgba(247,250,255,.4)'}}/>)}</div>
      <svg width="18" height="14" viewBox="0 0 18 14"><path d="M2 5.4C6 2 12 2 16 5.4M5 8.3c2.4-2 5.6-2 8 0" fill="none" stroke="#F7FAFF" strokeWidth="1.7" strokeLinecap="round"/><circle cx="9" cy="11.5" r="1.2" fill="#F7FAFF"/></svg>
      <div style={{width:27,height:13,border:'1.4px solid rgba(247,250,255,.72)',borderRadius:4,padding:2,position:'relative'}}><div style={{height:'100%',width:'72%',background:'#F7FAFF',borderRadius:2}}/><div style={{position:'absolute',right:-3,top:4,width:2,height:5,borderRadius:1,background:'rgba(247,250,255,.72)'}}/></div>
    </div>
  </>
);

const EnvelopeIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="3" stroke="#A6D1FF" strokeWidth="1.6"/><path d="M4.5 7l7.5 6 7.5-6" stroke="#A6D1FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const LockIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="11" rx="3" stroke="#A6D1FF" strokeWidth="1.6"/><path d="M8 10V7.5A4 4 0 0112 3.5a4 4 0 014 4V10" stroke="#A6D1FF" strokeWidth="1.6" strokeLinecap="round"/><circle cx="12" cy="15.5" r="1.2" fill="#A6D1FF"/></svg>;
const EyeIcon = () => <svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5-9.2-5-9.2-5z" stroke="#A6D1FF" strokeWidth="1.5"/><circle cx="12" cy="12" r="2.4" stroke="#A6D1FF" strokeWidth="1.5"/></svg>;

const Field: React.FC<{label:string;value:string;focused:number;icon:'email'|'lock';masked?:boolean}> = ({label,value,focused,icon,masked}) => (
  <div>
    <div style={{fontFamily:FONT,fontSize:16,fontWeight:640,color:'#CCD9EA',marginBottom:9,letterSpacing:'-.01em'}}>{label}</div>
    <div style={{height:62,borderRadius:16,border:`1.7px solid rgba(${focused>.12?'69,164,255':'48,101,158'},${.70+focused*.25})`,background:'linear-gradient(180deg,rgba(7,22,39,.98),rgba(3,13,25,.99))',boxShadow:focused>.12?`0 0 28px rgba(41,142,255,${.12+focused*.18}),inset 0 1px 0 rgba(255,255,255,.04)`:'inset 0 1px 0 rgba(255,255,255,.025),inset 0 0 24px rgba(20,46,80,.12)',display:'flex',alignItems:'center',gap:14,padding:'0 18px',color:'#F5F8FE'}}>
      <div style={{width:23,height:23,opacity:.96,flex:'0 0 auto'}}>{icon==='email'?<EnvelopeIcon/>:<LockIcon/>}</div>
      <div style={{flex:1,fontFamily:FONT,fontSize:masked?21:16,fontWeight:masked?600:500,letterSpacing:masked?'.16em':'-.01em',whiteSpace:'nowrap'}}>{value}</div>
      {masked?<div style={{opacity:.94}}><EyeIcon/></div>:null}
    </div>
  </div>
);

const LoginButton: React.FC<{frame:number;localUi:number}> = ({frame,localUi}) => {
  const press = pulse(frame,SHOT01.phone.pressStart,SHOT01.phone.pressEnd,7);
  const waiting = out(frame,SHOT01.localUiState.waitingStart,SHOT01.localUiState.waitingFull);
  const spinner = out(frame,SHOT01.localUiState.spinnerStart,SHOT01.localUiState.spinnerStart+12);
  const working = localUi>.15;
  return (
    <div style={{height:70,borderRadius:19,border:`2px solid rgba(154,255,248,${working?.68:.96})`,background:working?'linear-gradient(180deg,#078A84,#075D59)':'linear-gradient(135deg,#34EEE2 0%,#15D2CA 47%,#099FA1 100%)',boxShadow:working?'0 15px 32px rgba(0,0,0,.35),0 0 20px rgba(37,221,207,.14)':'0 19px 40px rgba(0,226,211,.30),0 0 42px rgba(42,236,224,.25),inset 0 2px 0 rgba(255,255,255,.34)',transform:`translateY(${press*5}px) scale(${1-press*.032})`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',left:24,right:24,top:1,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.58),transparent)',opacity:working?.20:.76}}/>
      {working?<div style={{width:18,height:18,marginRight:10,borderRadius:'50%',border:'2.4px solid rgba(255,255,255,.24)',borderTopColor:'#fff',opacity:spinner,transform:`rotate(${frame*12}deg)`}}/>:null}
      <span style={{fontFamily:FONT,fontSize:working?18:22,fontWeight:working?760:860,letterSpacing:working?'.07em':'-.025em',color:'#FAFFFF'}}>{waiting>.5?'Waiting':working?'Logging in...':'Log in'}</span>
      {!working?<span style={{position:'absolute',right:22,fontFamily:FONT,fontSize:32,fontWeight:400,lineHeight:1,color:'#FAFFFF',opacity:.96}}>→</span>:null}
    </div>
  );
};

const Iphone: React.FC<{frame:number;reveal:number;credential:number;ui:number}> = ({frame,reveal,credential,ui}) => {
  const emailValue = typed(frame,18,86,EMAIL);
  const passwordP = clamp((frame-SHOT01.phone.passwordStart)/Math.max(1,SHOT01.phone.passwordReady-SHOT01.phone.passwordStart));
  const dots = '•'.repeat(Math.floor(passwordP*8));
  const emailFocus = frame<104?out(frame,12,27)*(1-out(frame,91,105)):0;
  const passwordFocus = out(frame,95,110)*(1-out(frame,158,171));
  const localUi = out(frame,SHOT01.localUiState.start,SHOT01.localUiState.revealEnd);
  const scale = .91 + (.70-.91)*reveal + (.60-.70)*credential + (.53-.60)*ui;
  const top = 66 + (332-66)*reveal + (468-332)*credential + (592-468)*ui;
  const rotateY = -2.2 + reveal*.8 + credential*.25 + ui*.15;
  const rotateX = .65 - reveal*.28;

  return (
    <div style={{position:'absolute',left:'50%',top,width:500,height:900,transform:`translateX(-50%) perspective(1600px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`,transformOrigin:'50% 0%',zIndex:5}}>
      <div style={{position:'absolute',left:-6,top:147,width:6,height:66,borderRadius:'5px 0 0 5px',background:'linear-gradient(180deg,#B5C7D7,#334B62 47%,#8EA7BE)'}}/>
      <div style={{position:'absolute',left:-6,top:242,width:6,height:108,borderRadius:'5px 0 0 5px',background:'linear-gradient(180deg,#B5C7D7,#334B62 47%,#8EA7BE)'}}/>
      <div style={{position:'absolute',right:-6,top:202,width:6,height:142,borderRadius:'0 5px 5px 0',background:'linear-gradient(180deg,#B5C7D7,#334B62 47%,#8EA7BE)'}}/>
      <div style={{position:'absolute',inset:0,borderRadius:70,padding:7,background:'linear-gradient(145deg,#DCE8F2 0%,#7893AA 9%,#1B2A39 24%,#060C12 47%,#2E4358 71%,#B4C8D8 91%,#E8F0F6 100%)',border:'1px solid rgba(226,241,252,.95)',boxShadow:'0 40px 100px rgba(0,0,0,.62),0 0 35px rgba(89,153,218,.14),inset 0 1px 0 rgba(255,255,255,.76),inset 0 -1px 0 rgba(0,0,0,.72)'}}>
        <div style={{position:'absolute',inset:4,borderRadius:67,border:'1px solid rgba(13,21,29,.94)',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.10)',pointerEvents:'none'}}/>
        <div style={{position:'relative',width:'100%',height:'100%',borderRadius:63,overflow:'hidden',background:'radial-gradient(circle at 50% 17%,#0A2036 0%,#061521 38%,#030911 100%)',border:'2px solid rgba(119,164,202,.42)',boxShadow:'inset 0 0 82px rgba(8,40,70,.27)'}}>
          <div style={{position:'absolute',width:620,height:620,left:-305,top:-165,borderRadius:'50%',border:'2px solid rgba(39,117,255,.35)',boxShadow:'0 0 42px rgba(26,91,255,.09)',transform:'rotate(-18deg)'}}/>
          <div style={{position:'absolute',width:570,height:570,right:-380,bottom:-190,borderRadius:'50%',border:'2px solid rgba(10,168,255,.47)',boxShadow:'0 0 42px rgba(20,126,255,.10)'}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(128deg,rgba(28,79,170,.13) 0%,transparent 31%,transparent 68%,rgba(0,127,217,.08) 100%)'}}/>
          <StatusBar/>
          <div style={{position:'absolute',left:'50%',top:14,width:116,height:34,transform:'translateX(-50%)',borderRadius:21,background:'#01050A',boxShadow:'0 3px 12px rgba(0,0,0,.58)'}}><div style={{position:'absolute',right:12,top:12,width:7,height:7,borderRadius:'50%',background:'#10213B',boxShadow:'0 0 4px rgba(61,107,190,.35)'}}/></div>
          <div style={{position:'absolute',left:44,right:44,top:124,bottom:46}}>
            <div style={{textAlign:'center',fontFamily:FONT,fontSize:43,fontWeight:720,letterSpacing:'-.04em',color:'#F8FAFE'}}>Log in</div>
            <div style={{marginTop:10,textAlign:'center',fontFamily:FONT,fontSize:16,fontWeight:450,letterSpacing:'-.01em',color:'rgba(191,207,229,.78)'}}>Access your secure workspace.</div>
            <div style={{marginTop:100,display:'flex',flexDirection:'column',gap:30}}>
              <Field label="Email" value={emailValue} focused={emailFocus} icon="email"/>
              <Field label="Password" value={dots} focused={passwordFocus} icon="lock" masked/>
            </div>
            <div style={{position:'absolute',left:0,right:0,bottom:28}}><LoginButton frame={frame} localUi={localUi}/></div>
          </div>
        </div>
      </div>
      <div style={{position:'absolute',left:'12%',right:'10%',bottom:-24,height:40,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(25,123,255,.30) 0%,rgba(20,82,160,.08) 47%,transparent 75%)',filter:'blur(8px)',transform:'rotateX(68deg)'}}/>
    </div>
  );
};

const Pill: React.FC<{label:string;activity:number;frame:number}> = ({label,activity,frame}) => {
  const runner = ((frame*7)%310)-100;
  const breathing = .88+Math.sin(frame*.16)*.12;
  const scale = 1+activity*.035*breathing;
  return (
    <div style={{width:182,height:52,borderRadius:16,border:`2px solid rgba(30,237,166,${.78+activity*.22})`,background:`linear-gradient(180deg,rgba(8,65,45,${.76+activity*.18}),rgba(3,21,16,.99))`,boxShadow:`0 0 ${12+activity*32}px rgba(29,242,172,${.08+activity*.34}),inset 0 1px 0 rgba(255,255,255,.05)`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FONT,fontSize:22,fontWeight:activity>.3?760:560,letterSpacing:'-.015em',color:'#F6FFFC',position:'relative',overflow:'hidden',transform:`scale(${scale})`}}>
      <div style={{position:'absolute',left:runner,top:-18,width:76,height:88,transform:'rotate(18deg)',background:'linear-gradient(90deg,transparent,rgba(135,255,217,.78),transparent)',filter:'blur(7px)',opacity:activity*.95}}/>
      <div style={{position:'absolute',left:runner+10,top:0,width:38,height:'100%',background:'linear-gradient(90deg,transparent,rgba(183,255,233,.30),transparent)',opacity:activity*.90}}/>
      <div style={{position:'absolute',left:8,right:8,top:3,height:1,borderRadius:99,background:'linear-gradient(90deg,transparent,rgba(180,255,236,.72),transparent)',opacity:.30+activity*.58}}/>
      <span style={{position:'relative',zIndex:2,textShadow:activity>.2?'0 0 11px rgba(201,255,239,.24)':'none'}}>{label}</span>
    </div>
  );
};

const Section: React.FC<{title:string;a:string;b:string;activityA:number;activityB:number;divider:number;frame:number}> = ({title,a,b,activityA,activityB,divider,frame}) => (
  <div style={{height:180,padding:'24px 38px 0'}}>
    <div style={{textAlign:'center',fontFamily:FONT,fontSize:29,fontWeight:720,letterSpacing:'-.035em',color:'#F8F9FD'}}>{title}</div>
    <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:19}}><Pill label={a} activity={activityA} frame={frame}/><Pill label={b} activity={activityB} frame={frame}/></div>
    <div style={{height:2,marginTop:22,borderRadius:999,background:'linear-gradient(90deg,transparent,#7230D4 17%,#B34FFF 50%,#7230D4 83%,transparent)',opacity:.64*divider,boxShadow:'0 0 13px rgba(179,79,255,.18)'}}/>
  </div>
);

const Stack: React.FC<{frame:number}> = ({frame}) => {
  const intent = out(frame,SHOT01.loginIntent.start,SHOT01.loginIntent.panelRevealEnd);
  const credential = out(frame,SHOT01.credentialInput.start,SHOT01.credentialInput.revealEnd);
  const ui = out(frame,SHOT01.localUiState.start,SHOT01.localUiState.revealEnd);
  const validate = pulse(frame,SHOT01.loginIntent.validateGlowStart,SHOT01.loginIntent.validateGlowEnd);
  const submit = pulse(frame,SHOT01.loginIntent.submitGlowStart,SHOT01.loginIntent.submitGlowEnd);
  const identifier = pulse(frame,SHOT01.credentialInput.identifierGlowStart,SHOT01.credentialInput.identifierGlowEnd);
  const secret = pulse(frame,SHOT01.credentialInput.secretGlowStart,SHOT01.credentialInput.secretGlowEnd);
  const submitting = pulse(frame,SHOT01.localUiState.submittingStart,SHOT01.localUiState.submittingEnd);
  const waiting = out(frame,SHOT01.localUiState.waitingStart,SHOT01.localUiState.waitingFull);
  const h = 205 + credential*180 + ui*180;
  const panelTop = 30;
  const phoneTop = 332 + (468-332)*credential + (592-468)*ui;
  const connectorHeight = Math.max(20,phoneTop-(panelTop+h));

  return <>
    <div style={{position:'absolute',left:'50%',top:panelTop,width:650,height:h,transform:`translateX(-50%) scale(${.965+intent*.035})`,transformOrigin:'50% 0%',borderRadius:35,padding:5,background:'linear-gradient(145deg,#691AD4 0%,#A943FF 48%,#5413C0 100%)',boxShadow:'0 24px 68px rgba(30,3,75,.58),0 0 44px rgba(160,58,255,.25)',opacity:intent,zIndex:4,overflow:'hidden'}}>
      <div style={{width:'100%',height:'100%',borderRadius:30,overflow:'hidden',background:'linear-gradient(180deg,rgba(5,18,31,.995),rgba(3,11,21,.995))',border:'1px solid rgba(207,145,255,.32)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.03)'}}>
        <Section title="Login Intent" a="Validate" b="Submit" activityA={validate} activityB={submit} divider={credential} frame={frame}/>
        <div style={{opacity:credential,transform:`translateY(${(1-credential)*12}px)`}}><Section title="Credential Input" a="Identifier" b="Secret" activityA={identifier} activityB={secret} divider={ui} frame={frame}/></div>
        <div style={{opacity:ui,transform:`translateY(${(1-ui)*12}px)`}}><Section title="Local UI State" a="Submitting" b="Waiting" activityA={submitting} activityB={waiting} divider={0} frame={frame}/></div>
      </div>
    </div>
    <div style={{position:'absolute',left:'50%',top:panelTop+h-1,width:3,height:connectorHeight+17,transform:'translateX(-50%)',borderRadius:999,background:'linear-gradient(180deg,#9235FF 0%,#59218F 52%,#1B4166 100%)',opacity:intent*.66,boxShadow:'0 0 12px rgba(146,53,255,.22)',zIndex:2}}/>
  </>;
};

export const PhoneFirstYoutubePreview: React.FC<Props> = ({showGuides}) => {
  const frame = useCurrentFrame();
  const reveal = ease(frame,SHOT01.camera.worldRevealStart,SHOT01.camera.worldRevealEnd);
  const credential = ease(frame,SHOT01.credentialInput.start,SHOT01.credentialInput.revealEnd);
  const ui = ease(frame,SHOT01.localUiState.start,SHOT01.localUiState.revealEnd);
  const intro = spring({frame,fps:SHOT01_FPS,config:{damping:18,stiffness:95,mass:1.05},durationInFrames:42});
  const requestHint = out(frame,SHOT01.requestAssemblyHint.start,SHOT01.requestAssemblyHint.end);

  return <AbsoluteFill style={{background:'#010711',overflow:'hidden',fontFamily:FONT}}>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 48%,rgba(8,28,48,.42) 0%,rgba(2,11,21,.13) 43%,transparent 72%)'}}/>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 36%,rgba(0,2,7,.36) 100%)'}}/>
    <div style={{opacity:intro}}><Stack frame={frame}/><Iphone frame={frame} reveal={reveal} credential={credential} ui={ui}/></div>
    <div style={{position:'absolute',right:84,bottom:58,opacity:requestHint*.20,transform:`translateX(${(1-requestHint)*18}px)`,fontFamily:FONT,fontSize:17,fontWeight:650,letterSpacing:'.06em',color:'#8AA9C8'}}>REQUEST ASSEMBLY →</div>
    {showGuides?<div style={{position:'absolute',inset:40,border:'1px dashed rgba(255,255,255,.20)',pointerEvents:'none'}}/>:null}
  </AbsoluteFill>;
};