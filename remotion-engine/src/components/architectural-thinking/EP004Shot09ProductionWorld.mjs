import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot08Production,shot08State} from './EP004Shot08ProductionWorld.mjs';
import {shot06Length,shot06Point} from './EP004Shot06FleetPreview.mjs';
export const EP004_SHOT09_COMPOSITION='EP004-SHOT09-HEALTH-VS-READINESS-V1-VISUAL';
export const EP004_SHOT09_PREDECESSOR=Object.freeze({renderId:'a6625262-8567-4d14-993e-6d83816b2272',sourceCommit:'702da20aeaac0b60b12048395d61287d57796bda',frames:2719});
export const SHOT09_BEATS=Object.freeze(["SHOT09_P01_B01","SHOT09_P01_B02","SHOT09_P02_B01","SHOT09_P02_B02","SHOT09_P02_B03","SHOT09_P03_B01","SHOT09_P03_B02","SHOT09_P04_B01","SHOT09_P04_B02","SHOT09_P05_B01","SHOT09_P05_B02"]);
export const SHOT09_EVENTS=Object.freeze(["UNRESPONSIVE","RESTART","RUNNING","PROBE","WAITING_TRAFFIC","COMPARE","HEALTH_CHECK","PRODUCTION_LOAD","READINESS","INCIDENT","GREEN_NOT_ENOUGH","CONTENTION","RUNNING_QUESTION","USEFUL_WORK","GREEN_ENDPOINT","CAPACITY"]);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function validateEp004Shot09Production(p,requireFrame=false){
 const lock=EP004_SHOT09_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT09'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT09_EXACT_LOCKED_SHOT08_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot08Props;
 if(!prev||prev.shotKey!=='SHOT08'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT09_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot08Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==11||!Array.isArray(p.visualBeats)||p.visualBeats.length!==11)
   throw Error('SHOT09_ELEVEN_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT09_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-45+8)
     throw Error('SHOT09_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT09_EVENTS.length)throw Error('SHOT09_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT09_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-45+8)throw Error('SHOT09_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.COMPARE!==t[2]||e.INCIDENT!==t[5]||e.GREEN_NOT_ENOUGH!==t[6]||e.RUNNING_QUESTION!==t[7]||e.USEFUL_WORK!==t[8]||e.GREEN_ENDPOINT!==t[9]||e.CAPACITY!==t[10])throw Error('SHOT09_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT09_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}


export const PROBE_ROUTE=Object.freeze([[340,284],[1045,284],[1045,354],[1160,354]]);
export const WORK_ROUTE=Object.freeze([[350,545],[685,545],[1015,545],[1090,545],[1090,418],[1160,418]]);
export const WORK_QUEUE=Object.freeze([[350,545],[685,545]]);
export const CUT_PROBE_ROUTE=Object.freeze([[340,284],[520,284],[520,390],[680,390],[1140,390]]);
export const CUT_WORK_ROUTE=Object.freeze([[350,545],[520,545],[520,566],[680,566],[1120,566]]);
function trips(path,frame,epoch,period,delay,tone,stop=Infinity,speed=9){
 const len=shot06Length(path),out=[];
 if(frame<epoch)return out;
 for(let born=epoch+Math.floor((frame-epoch)/period)*period;born>=Math.max(epoch,frame-420);born-=period){
  if(born>=stop)continue;
  const d=(frame-born)*speed;
  if(d<=len)out.push({...shot06Point(path,d),tone:'cyan',direction:'request'});
  else if(d>=len+delay*speed&&d<=2*len+delay*speed)out.push({...shot06Point(path,2*len+delay*speed-d),tone,direction:'response'});
 }
 return out;
}
export function shot09State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT09_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,prev=p.previousShot08Props;
 const first=p.verifiedCues[0].startFrame;
 const openingMix=smooth((frame-first)/72);
 // Continue the predecessor's real request phase and keep its exact last camera pose.
 const prior=openingMix<1?shot08State(prev.durationInFrames-1+frame,{...prev,durationInFrames:prev.durationInFrames+frame}):null;
 const inherited=prior?{...prior,focus:shot08State(prev.durationInFrames-1,prev).focus}:null;
 const stage=frame<e.COMPARE?'recovery':frame<e.GREEN_NOT_ENOUGH?'comparison':frame<e.RUNNING_QUESTION?'contention':'proof';
 const processState=frame<e.RESTART?'failed':frame<e.RUNNING?'booting':'running';
 const health=frame>=e.PROBE,probeStart=p.verifiedCues[1].startFrame,probeStarted=frame>=probeStart;
 const waiting=frame>=e.WAITING_TRAFFIC;
 const speed=14,arrive=e.READINESS+Math.ceil(shot06Length(WORK_ROUTE)/speed);
 const load=frame>=arrive?.20+.37*smooth((frame-arrive)/120)+.15*smooth((frame-e.CONTENTION-Math.ceil(shot06Length(CUT_WORK_ROUTE)/speed))/85)+.10*smooth((frame-e.USEFUL_WORK-Math.ceil(shot06Length(WORK_ROUTE)/speed))/100):0;
 const probeSpeed=2*shot06Length(PROBE_ROUTE)/Math.max(1,e.PROBE-probeStart-8);
 const probes=probeStarted?trips(PROBE_ROUTE,frame,probeStart,78,8,'green',Infinity,probeSpeed):[];
 const work=frame>=e.READINESS?trips(WORK_ROUTE,frame,e.READINESS,34,42,'amber',e.INCIDENT,speed):[];
 if(frame>=e.USEFUL_WORK)work.push(...trips(WORK_ROUTE,frame,e.USEFUL_WORK,24,52,'amber',Infinity,speed));
 const cutProbes=stage==='contention'?trips(CUT_PROBE_ROUTE,frame,e.GREEN_NOT_ENOUGH-80,70,8,'green',Infinity,18):[];
 const cutWork=stage==='contention'&&frame>=e.CONTENTION?trips(CUT_WORK_ROUTE,frame,e.CONTENTION,23,56,'amber',Infinity,speed):[];
 const waitCount=Math.min(7,2+Math.floor((frame-e.WAITING_TRAFFIC)/33));
 const admitted=frame>=e.USEFUL_WORK?Math.floor((frame-e.USEFUL_WORK)/55):frame>=e.READINESS?2:0;
 const queued=waiting?Array.from({length:Math.max(2,waitCount-admitted)},(_,i)=>({x:654-i*38,y:545,tone:'amber',direction:'waiting'})):[];
 return {stage,inherited,openingMix,processState,health,probeStarted,waiting,load,probes,work,cutProbes,cutWork,queued,contention:frame>=e.CONTENTION,incident:frame>=e.INCIDENT&&frame<e.RUNNING_QUESTION,question:frame>=e.RUNNING_QUESTION,capacity:frame>=e.CAPACITY,activity:.5+.5*Math.sin(frame*.071)};
}
export function verifyEp004Shot09ActualMotion(p){
 validateEp004Shot09Production(p);const e=p.eventFrames,s=f=>shot09State(f,p);
 if(!s(0).inherited||new Set(Array.from({length:30},(_,i)=>JSON.stringify(s(i).inherited?.outcome))).size<20)throw Error('SHOT09_OPENING_LIVING_OUTCOME_REQUIRED');
 if(s(e.RESTART-1).processState!=='failed'||s(e.RESTART).processState!=='booting'||s(e.RUNNING).processState!=='running'||s(e.PROBE-1).health||!s(e.PROBE).health||s(e.READINESS-1).work.length||s(e.CONTENTION-1).contention||!s(e.CONTENTION).contention)throw Error('SHOT09_RECOVERY_CAUSALITY');
 if(s(p.durationInFrames-1).processState!=='running'||!s(p.durationInFrames-1).health||!s(p.durationInFrames-1).capacity||s(p.durationInFrames-1).load<.5)throw Error('SHOT09_GREEN_IS_NOT_CAPACITY');
 return {status:'PASS',restart:e.RESTART,running:e.RUNNING,probe:e.PROBE,readiness:e.READINESS,contention:e.CONTENTION,capacity:e.CAPACITY};
}
