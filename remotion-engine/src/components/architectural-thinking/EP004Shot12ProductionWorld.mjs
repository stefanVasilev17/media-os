import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot11Production,shot11State} from './EP004Shot11ProductionWorld.mjs';
import {shot06Length,shot06Point} from './EP004Shot06FleetPreview.mjs';
export const EP004_SHOT12_COMPOSITION='EP004-SHOT12-CONTROLLED-RESTORATION-V1-VISUAL';
export const EP004_SHOT12_PREDECESSOR=Object.freeze({renderId:'a20700eb-ed28-4136-a26c-d25554e53cd5',sourceCommit:'61bc9e27b686201fdd8102b009d7cc33ed89ef16',frames:2637});
export const SHOT12_BEATS=Object.freeze(["SHOT12_P01_B01","SHOT12_P01_B02","SHOT12_P01_B03","SHOT12_P02_B01","SHOT12_P02_B02","SHOT12_P02_B03","SHOT12_P03_B01","SHOT12_P03_B02","SHOT12_P04_B01","SHOT12_P04_B02"]);
export const SHOT12_EVENTS=Object.freeze(["IDENTIFY","FIX","ROLLOUT","RESTART","ADMISSION","CAPACITY","TWO_JOBS","CODE","DEMAND","CODE_ONLY","TRAFFIC_ONLY","MORNING","REGIONS","IMPACT_END","DELAYED","USER","INBOX","MESSAGE","REPLY","LESSON"]);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function validateEp004Shot12Production(p,requireFrame=false){
 const lock=EP004_SHOT12_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT12'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT12_EXACT_LOCKED_SHOT11_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot11Props;
 if(!prev||prev.shotKey!=='SHOT11'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT12_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot11Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==10||!Array.isArray(p.visualBeats)||p.visualBeats.length!==10)
   throw Error('SHOT12_TEN_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT12_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-45+8)
     throw Error('SHOT12_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT12_EVENTS.length)throw Error('SHOT12_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT12_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-45+8)throw Error('SHOT12_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.TWO_JOBS!==t[3]||e.MORNING!==t[6]||e.USER!==t[8])throw Error('SHOT12_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT12_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}






export const ADMISSION_ROUTE=Object.freeze([[350,545],[685,545],[1015,545],[1190,545]]);
export const GROUP_ROUTES=Object.freeze([330,485,640,795].map(y=>[[1015,545],[1100,545],[1100,y],[1260,y]]));
export const MAIL_ROUTE=Object.freeze([[570,545],[685,545],[1015,545],[1190,545]]);
export const DELAYED_ROUTE=Object.freeze([[1260,795],[1140,795],[1140,860],[370,860],[370,585],[350,585]]);
const join=(a,b)=>[...a,...b];
const phase=(f,start,span)=>f<start?'failed':f<start+span?'booting':'running';
const mix=(f,a,b)=>smooth((f-a)/Math.max(1,b-a));
const toneAt=(f,e)=>f<e.FIX?'red':f<e.DEMAND?'amber':'green';
function rollout(f,e,regional=false){
 const a=regional?e.MORNING:e.RESTART,b=regional?e.IMPACT_END:e.TWO_JOBS;
 const gap=Math.max(15,Math.floor((b-a)/5)),span=Math.max(12,Math.min(46,Math.floor(gap*.65)));
 return Array.from({length:4},(_,i)=>phase(f,a+i*gap,span));
}
function packets(route,frame,start,period,eligible,tone='cyan',stop=Infinity,reverse=false,success=()=>true){
 if(frame<start)return [];
 const len=shot06Length(route),speed=14,travel=Math.ceil(len/speed),delay=12,out=[];
 const latest=Math.floor((frame-start)/period),lookback=Math.ceil((2*travel+delay+15)/period);
 for(let i=Math.max(0,latest-lookback);i<=latest;i++){
  const born=start+i*period;if(born>=stop||!eligible(born,born+travel,i))continue;
  const age=frame-born;
  if(reverse){if(age<travel)out.push({...shot06Point(route,Math.min(len,age*speed)),tone,direction:'request'});continue;}
  if(age<travel)out.push({...shot06Point(route,Math.min(len,age*speed)),tone,direction:'request'});
  else if(age>=travel+delay&&age<2*travel+delay&&success(born,born+travel+delay))out.push({...shot06Point(route,Math.max(0,len-(age-travel-delay)*speed)),tone:'green',direction:'response'});
 }
 return out.filter(p=>p.x<=685||p.x>=1015||p.y<414||p.y>630);
}
export function shot12State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT12_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,prev=p.previousShot11Props;
 const prior=shot11State(prev.durationInFrames-1+frame,{...prev,durationInFrames:prev.durationInFrames+frame},'connection');
 const openingMix=mix(frame,e.IDENTIFY,e.FIX);
 const stage=frame<e.ROLLOUT?'repair':frame<e.TWO_JOBS?'rollout':frame<e.MORNING?'controls':frame<e.USER?'regions':'user';
 const regional=stage==='regions'||stage==='user';
 const groups=rollout(frame,e,regional);
 const available=groups.filter(g=>g==='running').length;
 const codeFixed=frame>=e.FIX && !(frame>=e.TRAFFIC_ONLY&&frame<e.MORNING);
 const illustrative=frame>=e.CODE_ONLY&&frame<e.MORNING;
 const controlled=frame>=e.ADMISSION && !(frame>=e.CODE_ONLY&&frame<e.TRAFFIC_ONLY);
 const admission=frame<e.ADMISSION?.18:controlled?.28+.48*mix(frame,e.CAPACITY,e.TWO_JOBS):.94;
 const pressure=stage==='controls'?controlled?.36:.93:stage==='regions'||stage==='user'?.27:Math.max(.24,1-available*.18);
 let traffic=[];
 if(stage==='rollout'||stage==='regions'){
  const start=regional?e.MORNING:e.ROLLOUT;
  for(let i=0;i<4;i++){
   const route=join([[350,545],[685,545]],GROUP_ROUTES[i]);
   traffic.push(...packets(route,frame,start,26,(born,arrival,n)=>{
    const selected=rollout(born+24,e,regional).flatMap((v,j)=>v==='running'?[j]:[]);
    return selected[n%selected.length]===i&&rollout(arrival,e,regional)[i]==='running';
   }));
  }
 }else if(stage==='controls'){
  traffic=packets(ADMISSION_ROUTE,frame,e.TWO_JOBS,18,(born)=>born<e.DEMAND||born>=e.CODE_ONLY&&born<e.TRAFFIC_ONLY||Math.floor((born-e.TWO_JOBS)/18)%3===0,'cyan',e.MORNING,false,(born,completed)=>completed<e.TRAFFIC_ONLY&&!(born>=e.CODE_ONLY&&Math.floor((born-e.TWO_JOBS)/18)%3!==0));
 }else if(stage==='user'){
  const length=shot06Length(MAIL_ROUTE);
  const send=(a,b,reverse,tone)=>{
    if(frame<a||frame>=b)return;
    const x=clamp((frame-a)/Math.max(1,b-a));
    const p=shot06Point(MAIL_ROUTE,length*(reverse?1-x:x));
    if(p.x<=685||p.x>=1015)traffic.push({...p,tone,direction:reverse?'response':'request'});
  };
  send(e.USER,e.INBOX,false,'cyan');
  send(e.INBOX,e.MESSAGE,true,'green');
  send(e.REPLY,Math.min(e.LESSON,e.REPLY+28),false,'cyan');
  send(Math.min(e.LESSON,e.REPLY+28),Math.min(p.durationInFrames-1,e.REPLY+56),true,'green');
  if(frame>=e.LESSON)traffic.push(...packets(MAIL_ROUTE,frame,e.LESSON,78,()=>true));
 }
 const delayed=frame>=e.DELAYED;
 const backlog=delayed?1-.65*mix(frame,e.DELAYED,p.durationInFrames-1):1;
 if(delayed&&stage==='regions')traffic.push(...packets(DELAYED_ROUTE,frame,e.DELAYED,78,()=>true,'amber',e.USER,true));
 return {prior,openingMix,stage,groups,available,codeFixed,controlled,illustrative,admission,pressure,traffic,delayed,backlog,impactEnded:frame>=e.IMPACT_END,message:frame>=e.MESSAGE,reply:frame>=Math.min(p.durationInFrames-1,e.REPLY+56),lesson:frame>=e.LESSON,activity:.5+.5*Math.sin(frame*.071),tone:toneAt(frame,e)};
}
export function verifyEp004Shot12ActualMotion(p){
 validateEp004Shot12Production(p);const e=p.eventFrames,s=f=>shot12State(f,p);
 if(s(0).prior.stage!=='connection'||s(0).openingMix!==0||!s(e.FIX).codeFixed||s(e.ROLLOUT).stage!=='rollout'||s(e.CODE_ONLY).controlled||s(e.TRAFFIC_ONLY).codeFixed||!s(e.IMPACT_END).impactEnded||!s(e.DELAYED).delayed||!s(p.durationInFrames-1).lesson)throw Error('SHOT12_CAUSAL_RECOVERY_REQUIRED');
 return {status:'PASS',repair:e.FIX,admission:e.ADMISSION,regions:e.REGIONS,impactEnd:e.IMPACT_END,delayed:e.DELAYED,user:e.USER};
}
