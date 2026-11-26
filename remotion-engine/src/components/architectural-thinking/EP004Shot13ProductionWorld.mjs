import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot12Production,shot12State} from './EP004Shot12ProductionWorld.mjs';
import {shot06Length,shot06Point} from './EP004Shot06FleetPreview.mjs';
export const EP004_SHOT13_COMPOSITION='EP004-SHOT13-RESILIENT-DESIGN-V1-VISUAL';
export const EP004_SHOT13_PREDECESSOR=Object.freeze({renderId:'9728581f-632b-421f-b004-f96281b00569',sourceCommit:'00d06593da7c6d8893618f2d90daaba0a3de725f',frames:2613});
export const SHOT13_BEATS=Object.freeze(["SHOT13_P01_B01","SHOT13_P01_B02","SHOT13_P02_B01","SHOT13_P02_B02","SHOT13_P02_B03"]);
export const SHOT13_EVENTS=Object.freeze(["QUESTION","NO","SYSTEM","SHARED","SPARE","GENERAL","GUARANTEE","HOOK","HEALTHY","FAILOVER","REGIONS","WEAKNESS","SPREAD","RESTART","REPEAT","PROTECT","CAPACITY","ISOLATE","STAGED","OUTPUT"]);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function validateEp004Shot13Production(p,requireFrame=false){
 const lock=EP004_SHOT13_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT13'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT13_EXACT_LOCKED_SHOT12_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot12Props;
 if(!prev||prev.shotKey!=='SHOT12'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT13_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot12Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==5||!Array.isArray(p.visualBeats)||p.visualBeats.length!==5)
   throw Error('SHOT13_FIVE_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT13_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-45+8)
     throw Error('SHOT13_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT13_EVENTS.length)throw Error('SHOT13_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT13_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-45+8)throw Error('SHOT13_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.QUESTION!==t[0]||e.GENERAL!==t[1]||e.HOOK!==t[2]||e.SPREAD!==t[3]||e.ISOLATE!==t[4])throw Error('SHOT13_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT13_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}







export const DESIGN_INPUT=Object.freeze([[350,545],[685,545]]);
export const DESIGN_ROUTES=Object.freeze([352,545,738].map(y=>[[1015,545],[1100,545],[1100,y],[1190,y]]));
export const ISOLATED_ROUTE=Object.freeze([[350,545],[480,545],[480,850],[1110,850],[1110,738],[1190,738]]);
const phase=(at,e,i)=>{
 if(at<e.NO)return 'running';
 if(at<e.HOOK)return i===1&&at>=e.NO+24&&at<Math.min(e.HOOK,e.SYSTEM+65)?'failed':'running';
 if(at<e.WEAKNESS)return 'running';
 if(at<e.RESTART)return i===0?'failed':'running';
 if(at<e.REPEAT)return i===0&&at<e.RESTART+36?'booting':'running';
 if(at<e.CAPACITY)return i===0?'failed':'running';
 if(at<e.STAGED)return i===0?'failed':'running';
 return i===0&&at<e.STAGED+36?'booting':'running';
};
const admitted=(at,n,e)=>at<e.CAPACITY||at>=e.ISOLATE&&n%3===2||n%Math.max(1,at<e.STAGED?3:at<e.STAGED+90?2:1)===0;
function decision(born,n,e){
 const at=born+24;
 if(at>=e.ISOLATE&&n%3===2)return 2;
 const eligible=[0,1,2].filter(i=>phase(at,e,i)==='running'&&(at<e.ISOLATE||i!==2));
 if(!eligible.length)return -1;
 if(at<e.HOOK)return eligible.includes(1)?1:eligible[0];
 return eligible[n%eligible.length];
}
function traffic(frame,e){
 const out=[],period=24,speed=15,start=e.NO;
 for(let n=Math.max(0,Math.floor((frame-start)/period)-12);n<=Math.floor((frame-start)/period);n++){
  const born=start+n*period,age=frame-born,selected=decision(born,n,e);
  if(selected<0)continue;
  const isolated=selected===2&&born+24>=e.ISOLATE;
  const route=isolated?ISOLATED_ROUTE:[...DESIGN_INPUT,...DESIGN_ROUTES[selected]];
  const len=shot06Length(route),travel=Math.ceil(len/speed),complete=born+travel+12;
  const allowed=admitted(born+24,n,e);
  if(!allowed){if(age<22)out.push({...shot06Point(DESIGN_INPUT,Math.min(shot06Length(DESIGN_INPUT),age*speed)),tone:'cyan',direction:'request'});else if(age<42)out.push({x:655-(n%3)*25,y:545,tone:'amber',direction:'waiting'});continue;}
  const success=phase(born+travel,e,selected)==='running'&&phase(complete,e,selected)==='running'&&(isolated||!(complete>=e.SPREAD&&complete<e.CAPACITY&&n%3!==0));
  if(age<travel)out.push({...shot06Point(route,age*speed),tone:'cyan',direction:'request'});
  else if(success&&age>=travel+12&&age<2*travel+12)out.push({...shot06Point(route,Math.max(0,len-(age-travel-12)*speed)),tone:'green',direction:'response'});
  else if(!success&&age<travel+36)out.push({...shot06Point(route,len),tone:'amber',direction:'waiting'});
 }
 return out.filter(x=>x.x<=685||x.x>=1015||x.y>=820);
}
export function shot13State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT13_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,prev=p.previousShot12Props;
 const prior=shot12State(prev.durationInFrames-1+frame,{...prev,durationInFrames:prev.durationInFrames+frame});
 const openingMix=smooth((frame-e.QUESTION)/Math.max(1,Math.min(12,e.NO-e.QUESTION)));
 const fleet=smooth((frame-e.NO)/12);
 const compact=smooth((frame-e.HOOK)/24);
 const phases=[0,1,2].map(i=>phase(frame,e,i));
 const weak=frame>=e.WEAKNESS&&frame<e.CAPACITY;
 const safe=frame>=e.CAPACITY,isolated=frame>=e.ISOLATE,staged=frame>=e.STAGED;
 const aperture=safe?(staged?.34+.52*smooth((frame-e.STAGED)/120):.34):.94;
 return {prior,openingMix,fleet,compact,phases,weak,safe,isolated,staged,aperture,traffic:frame<e.NO?prior.traffic:traffic(frame,e),general:frame>=e.QUESTION,output:frame>=e.OUTPUT,activity:.5+.5*Math.sin((prev.durationInFrames-1+frame)*.071),pressure:weak?.91:safe?.33:.48,hook:frame>=e.HOOK};
}
export function verifyEp004Shot13ActualMotion(p){
 validateEp004Shot13Production(p);const e=p.eventFrames,s=f=>shot13State(f,p);
 if(s(0).openingMix!==0||s(e.QUESTION+12).openingMix!==1||!s(e.WEAKNESS).weak||!s(e.CAPACITY).safe||!s(e.ISOLATE).isolated||!s(e.STAGED).staged||!s(e.OUTPUT).output)throw Error('SHOT13_CAUSAL_DESIGN_REQUIRED');
 return {status:'PASS',general:e.GENERAL,hook:e.HOOK,capacity:e.CAPACITY,isolation:e.ISOLATE,staged:e.STAGED,output:e.OUTPUT};
}
