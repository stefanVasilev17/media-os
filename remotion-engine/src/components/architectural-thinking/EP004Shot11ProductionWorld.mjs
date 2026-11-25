import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot10Production,shot10State} from './EP004Shot10ProductionWorld.mjs';
import {shot06Length,shot06Point} from './EP004Shot06FleetPreview.mjs';
export const EP004_SHOT11_COMPOSITION='EP004-SHOT11-INCIDENT-CLOCK-V1-VISUAL';
export const EP004_SHOT11_PREDECESSOR=Object.freeze({renderId:'bc8ff415-a943-447c-a883-25751462d8a9',sourceCommit:'636e13f05dd26184c88ad13e15e827aa3dc31aff',frames:2059});
export const SHOT11_BEATS=Object.freeze(["SHOT11_P01_B01","SHOT11_P01_B02","SHOT11_P01_B03","SHOT11_P02_B01","SHOT11_P02_B02","SHOT11_P02_B03","SHOT11_P03_B01","SHOT11_P03_B02"]);
export const SHOT11_EVENTS=Object.freeze(["SHIFT","LOAD","DETECT","REDIRECT","ALERT","EVENING","RESTART","PROBE","CAPACITY","RELAPSE","PATTERN","LOOP","DEFECT","END"]);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function validateEp004Shot11Production(p,requireFrame=false){
 const lock=EP004_SHOT11_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT11'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT11_EXACT_LOCKED_SHOT10_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot10Props;
 if(!prev||prev.shotKey!=='SHOT10'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT11_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot10Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==8||!Array.isArray(p.visualBeats)||p.visualBeats.length!==8)
   throw Error('SHOT11_EIGHT_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT11_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-45+8)
     throw Error('SHOT11_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT11_EVENTS.length)throw Error('SHOT11_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT11_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-45+8)throw Error('SHOT11_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.EVENING!==t[3]||e.PATTERN!==t[6]||e.SHIFT>=t[1]||e.REDIRECT<t[2])throw Error('SHOT11_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT11_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}




export const INCIDENT_ROUTES=Object.freeze([[[340,366],[570,366],[570,545],[685,545]],[[340,604],[570,604],[570,545],[685,545]],[[1015,545],[1100,545],[1100,356],[1240,356]],[[1015,545],[1240,545]],[[1015,545],[1100,545],[1100,734],[1240,734]]]);
export const CLOCK_MARKS=Object.freeze(['01:07','16:03','16:17','16:20','19:20','Near midnight']);
const pathFlow=(route,f,period,tone,reply=false)=>{const len=shot06Length(route),out=[];for(let i=0;i<3;i++){const d=((f*12+i*len/3)%len+len)%len;out.push({...shot06Point(route,reply?len-d:d),tone,direction:reply?'response':'request'});}return out};
export function shot11State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT11_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,prev=p.previousShot10Props;
 const openingMix=smooth((frame-e.SHIFT)/36);
 const prior=openingMix<1?shot10State(prev.durationInFrames-1+frame,{...prev,durationInFrames:prev.durationInFrames+frame}):null;
 const stage=frame<e.EVENING?'clock':frame<e.PATTERN?'fleet':'connection';
 const marks=[e.SHIFT,e.DETECT,e.REDIRECT,e.ALERT,e.CAPACITY,e.RELAPSE];
 const activeMark=marks.reduce((n,k,i)=>frame>=k?i:n,-1);
 const pressure=frame<e.LOAD?.22:frame<e.DETECT?.22+.66*smooth((frame-e.LOAD)/Math.max(1,e.DETECT-e.LOAD)):frame<e.CAPACITY?.78:.94;
 const failures=frame<e.LOAD?0:frame<e.DETECT?1:frame<e.CAPACITY?2:3;
 const phase=frame<e.LOOP?'failed':frame<e.LOOP+36?'booting':frame<e.LOOP+90?'running':'failed';
 const traffic=INCIDENT_ROUTES.flatMap((r,i)=>{if(i===1&&frame<e.SHIFT)return [];if(i===3&&frame<e.REDIRECT)return [];if(i===4&&frame<e.REDIRECT)return [];const tone=i===1?'violet':i>=2&&frame>=e.ALERT?'amber':'cyan';return [...pathFlow(r,frame,60,tone),...(i<2||frame<e.DETECT||i===3&&frame<e.CAPACITY?pathFlow(r,frame+19,60,'green',true):[])];});
 return {prior,openingMix,stage,activeMark,pressure,failures,phase,traffic,activity:.5+.5*Math.sin(frame*.071),redirect:frame>=e.REDIRECT,alert:frame>=e.ALERT,probe:frame>=e.PROBE,relapse:frame>=e.RELAPSE,defect:frame>=e.DEFECT,end:frame>=e.END};
}
export function verifyEp004Shot11ActualMotion(p){
 validateEp004Shot11Production(p);const e=p.eventFrames,s=f=>shot11State(f,p);
 if(!s(0).prior||new Set(Array.from({length:30},(_,i)=>JSON.stringify(s(i).prior?.traffic))).size<5)throw Error('SHOT11_LIVING_PREDECESSOR_REQUIRED');
 if(s(e.SHIFT).activeMark!==0||s(e.REDIRECT).activeMark!==2||s(e.ALERT).activeMark!==3||s(e.CAPACITY).activeMark!==4||s(e.RELAPSE).activeMark!==5||s(e.PATTERN).stage!=='connection'||!s(p.durationInFrames-1).end)throw Error('SHOT11_CAUSAL_CLOCK_REQUIRED');
 return {status:'PASS',shift:e.SHIFT,detect:e.DETECT,redirect:e.REDIRECT,alert:e.ALERT,capacity:e.CAPACITY,relapse:e.RELAPSE,pattern:e.PATTERN};
}
