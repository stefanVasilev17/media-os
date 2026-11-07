import React from 'react';
import {AT_FONT} from '../../components/architectural-thinking';
import {shot02ButtonColors,shot02PressCycle} from './Shot02PressureVisuals';

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

type FieldProps = {
  label: string;
  value: string;
  focused: number;
  icon: 'email' | 'lock';
  masked?: boolean;
};

const Field: React.FC<FieldProps> = ({label,value,focused,icon,masked}) => (
  <div>
    <div style={{
      fontFamily:AT_FONT,fontSize:23,fontWeight:760,color:'#F1F8FF',
      marginBottom:11,letterSpacing:'-.018em',textShadow:'0 1px 9px rgba(122,186,246,.17)',
    }}>{label}</div>
    <div style={{
      height:73,borderRadius:17,
      border:`2.3px solid rgba(${focused>.12?'111,203,255':'105,176,227'},${.84+focused*.13})`,
      background:'linear-gradient(180deg,rgba(16,43,68,.99),rgba(7,25,45,.99))',
      boxShadow:focused>.12
        ?'0 0 28px rgba(41,142,255,.22),inset 0 1px 0 rgba(255,255,255,.08)'
        :'0 8px 22px rgba(0,0,0,.30),inset 0 1px 0 rgba(215,241,255,.08)',
      display:'flex',alignItems:'center',gap:15,padding:'0 17px',color:'#F7FBFF',
    }}>
      <div style={{width:27,height:27,opacity:1,flex:'0 0 auto',filter:'brightness(1.22)'}}>
        {icon==='email'?<EnvelopeIcon/>:<LockIcon/>}
      </div>
      <div style={{
        flex:1,fontFamily:AT_FONT,fontSize:masked?27:21,fontWeight:masked?700:630,
        letterSpacing:masked?'.14em':'-.012em',whiteSpace:'nowrap',
        textShadow:'0 0 11px rgba(179,225,255,.10)',
      }}>{value}</div>
      {masked?<div style={{opacity:1,filter:'brightness(1.22)'}}><EyeIcon/></div>:null}
    </div>
  </div>
);

type LoginButtonProps = {
  frame: number;
  pressure: number;
  pressStartFrame: number;
  localUi: number;
  press: number;
  waiting: number;
  spinner: number;
  realism?: number;
  heroPush?: number;
};

const LoginButton: React.FC<LoginButtonProps> = ({frame,localUi,press,waiting,spinner,pressure,pressStartFrame}) => {
  const working=spinner>.08 || localUi>.15 || waiting>.5;
  const palette=shot02ButtonColors(pressure);
  const motion=shot02PressCycle(frame,pressStartFrame);
  const impact=Math.max(press,motion.compression);
  const bounce=motion.rebound;
  const aura=.20+.24*motion.ripple+.26*impact;
  return (
    <div style={{
      height:88,borderRadius:20,
      border:`2.6px solid ${palette.border}`,
      background:`linear-gradient(135deg,${palette.top} 0%,${palette.bottom} 100%)`,
      boxShadow:`0 ${16-impact*8}px ${35+motion.ripple*10}px ${palette.glow}77,0 0 ${30+32*motion.ripple}px ${palette.glow}66,inset 0 ${2+impact*4}px 0 rgba(255,255,255,.27)`,
      transform:`translateY(${impact*7-bounce*2}px) scale(${1-impact*.052+bounce*.022})`,
      display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',
    }}>
      <div style={{
        position:'absolute',inset:3,borderRadius:16,pointerEvents:'none',
        border:`2px solid rgba(255,255,255,${.12+.45*impact})`,
        boxShadow:`inset 0 0 ${8+12*impact}px ${palette.glow}55`,
        opacity:Math.min(1,.54+aura),
      }}/>
      <div style={{
        position:'absolute',top:-24,bottom:-24,width:'38%',
        left:'-40%',pointerEvents:'none',
        transform:`translateX(${motion.shine*560}px) skewX(-25deg)`,
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,.43),transparent)',
        opacity:motion.active*(.15+.32*motion.ripple),
      }}/>
      <div style={{
        position:'absolute',left:20,right:20,top:1+impact*2,height:2,
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,.52),transparent)',
        opacity:working?.32:.83,
      }}/>
      {working?<div style={{
        width:35,height:35,marginRight:16,flex:'0 0 auto',
        borderRadius:'50%',boxSizing:'border-box',
        border:'4px solid rgba(236,255,253,.24)',
        borderTopColor:'#FFFFFF',borderRightColor:'#D0FFFA',
        boxShadow:'0 0 15px rgba(191,255,248,.32)',
        transform:`rotate(${frame*10}deg)`,
      }}/>:null}
      <span style={{
        fontFamily:AT_FONT,fontSize:working?26:29,fontWeight:850,
        letterSpacing:working?'-.02em':'-.025em',color:'#FFFFFF',
        textShadow:'0 2px 3px rgba(0,44,44,.32)',
        whiteSpace:'nowrap',
      }}>{working?'Logging in ...':'Log in'}</span>
      {!working?<span style={{
        position:'absolute',right:22,fontFamily:AT_FONT,fontSize:33,
        fontWeight:400,lineHeight:1,color:'#FAFFFF',opacity:.98,
      }}>→</span>:null}
    </div>
  );
};

export type Shot02PressurePhoneProps = {
  pressure: number;
  pressStartFrame: number;
  frame: number;
  reveal: number;
  credential: number;
  ui: number;
  emailValue: string;
  passwordDots: string;
  emailFocus: number;
  passwordFocus: number;
  localUi: number;
  press: number;
  waiting: number;
  spinner: number;
  realism?: number;
  heroPush?: number;
};

export const Shot02PressurePhone: React.FC<Shot02PressurePhoneProps> = ({frame,reveal,credential,ui,emailValue,passwordDots,emailFocus,passwordFocus,localUi,press,waiting,spinner,pressure,pressStartFrame,realism=1,heroPush=0}) => {
  const scale = .91 + heroPush*.016*(1-reveal) + (.70-.91)*reveal + (.60-.70)*credential + (.53-.60)*ui + .115;
  const top = 66 + (332-66)*reveal + (468-332)*credential + (592-468)*ui - 28;
  const rotateY = -2.2 + reveal*.8 + credential*.25 + ui*.15;
  const rotateX = .65 - reveal*.28;
  const material = Math.max(0,Math.min(1,realism));
  const glassSheen = 18 + Math.sin(frame*.014)*3;

  return (
    <div style={{position:'absolute',left:'50%',top,width:500,height:900,transform:`translateX(-50%) perspective(1600px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`,transformOrigin:'50% 0%',zIndex:5}}>
      <div style={{position:'absolute',left:-28,right:-28,top:-34,height:126,borderRadius:'50%',background:`radial-gradient(ellipse,rgba(123,198,255,${.12*material}) 0%,rgba(77,137,204,${.045*material}) 46%,transparent 72%)`,pointerEvents:'none'}}/>
      <div style={{position:'absolute',left:-6,top:147,width:6,height:66,borderRadius:'5px 0 0 5px',background:'linear-gradient(180deg,#B5C7D7,#334B62 47%,#8EA7BE)'}}/>
      <div style={{position:'absolute',left:-6,top:242,width:6,height:108,borderRadius:'5px 0 0 5px',background:'linear-gradient(180deg,#B5C7D7,#334B62 47%,#8EA7BE)'}}/>
      <div style={{position:'absolute',right:-6,top:202,width:6,height:142,borderRadius:'0 5px 5px 0',background:'linear-gradient(180deg,#B5C7D7,#334B62 47%,#8EA7BE)'}}/>
      <div style={{position:'absolute',inset:0,borderRadius:70,padding:7,background:'linear-gradient(145deg,#DCE8F2 0%,#7893AA 9%,#1B2A39 24%,#060C12 47%,#2E4358 71%,#B4C8D8 91%,#E8F0F6 100%)',border:'1px solid rgba(226,241,252,.95)',boxShadow:`0 ${38+material*8}px ${76+material*10}px rgba(0,0,0,${.56+material*.06}),0 0 30px rgba(89,153,218,.13),inset 0 1px 0 rgba(255,255,255,.76),inset 0 -1px 0 rgba(0,0,0,.72)`}}>
        <div style={{position:'absolute',inset:4,borderRadius:67,border:'1px solid rgba(13,21,29,.94)',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.10)',pointerEvents:'none'}}/>
        <div style={{position:'relative',width:'100%',height:'100%',borderRadius:63,overflow:'hidden',background:'radial-gradient(circle at 50% 17%,#0A2036 0%,#061521 38%,#030911 100%)',border:'2px solid rgba(119,164,202,.42)',boxShadow:'inset 0 0 82px rgba(8,40,70,.27)'}}>
          <div style={{position:'absolute',width:620,height:620,left:-305,top:-165,borderRadius:'50%',border:'2px solid rgba(39,117,255,.35)',boxShadow:'0 0 42px rgba(26,91,255,.09)',transform:'rotate(-18deg)'}}/>
          <div style={{position:'absolute',width:570,height:570,right:-380,bottom:-190,borderRadius:'50%',border:'2px solid rgba(10,168,255,.47)',boxShadow:'0 0 42px rgba(20,126,255,.10)'}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(128deg,rgba(28,79,170,.13) 0%,transparent 31%,transparent 68%,rgba(0,127,217,.08) 100%)'}}/>
          <div style={{position:'absolute',left:`${glassSheen}%`,top:-120,width:148,height:1120,transform:'rotate(15deg)',background:`linear-gradient(90deg,transparent,rgba(220,241,255,${.055*material}),rgba(255,255,255,${.018*material}),transparent)`,pointerEvents:'none'}}/>
          <div style={{position:'absolute',inset:0,borderRadius:63,boxShadow:`inset 10px 0 24px rgba(148,211,255,${.025*material}),inset -12px 0 30px rgba(0,0,0,${.15+.08*material})`,pointerEvents:'none'}}/>
          <StatusBar/>
          <div style={{position:'absolute',left:'50%',top:14,width:116,height:34,transform:'translateX(-50%)',borderRadius:21,background:'#01050A',boxShadow:'0 3px 12px rgba(0,0,0,.58)'}}><div style={{position:'absolute',right:12,top:12,width:7,height:7,borderRadius:'50%',background:'#10213B',boxShadow:'0 0 4px rgba(61,107,190,.35)'}}/></div>
          <div style={{position:'absolute',left:44,right:44,top:124,bottom:46}}>
            <div style={{textAlign:'center',fontFamily:AT_FONT,fontSize:43,fontWeight:720,letterSpacing:'-.04em',color:'#F8FAFE'}}>Log in</div>
            <div style={{marginTop:10,textAlign:'center',fontFamily:AT_FONT,fontSize:16,fontWeight:450,letterSpacing:'-.01em',color:'rgba(191,207,229,.78)'}}>Access your secure workspace.</div>
            <div style={{marginTop:86,display:'flex',flexDirection:'column',gap:27}}>
              <Field label="Email" value={emailValue} focused={emailFocus} icon="email"/>
              <Field label="Password" value={passwordDots} focused={passwordFocus} icon="lock" masked/>
            </div>
            <div style={{position:'absolute',left:0,right:0,bottom:28}}><LoginButton frame={frame} localUi={localUi} press={press} waiting={waiting} spinner={spinner} pressure={pressure} pressStartFrame={pressStartFrame}/></div>
          </div>
        </div>
      </div>
      <div style={{position:'absolute',left:'10%',right:'8%',bottom:-28,height:50,borderRadius:'50%',background:`radial-gradient(ellipse,rgba(25,123,255,${.18+.16*material}) 0%,rgba(20,82,160,${.05+.05*material}) 47%,transparent 75%)`,transform:'rotateX(68deg)',opacity:.78+material*.22}}/>
    </div>
  );
};
