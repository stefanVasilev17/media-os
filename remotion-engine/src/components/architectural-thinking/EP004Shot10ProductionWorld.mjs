import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot09Production,shot09State} from './EP004Shot09ProductionWorld.mjs';
import {shot06Length,shot06Point} from './EP004Shot06FleetPreview.mjs';
export const EP004_SHOT10_COMPOSITION='EP004-SHOT10-CONTROLLED-RECOVERY-V1-VISUAL';
export const EP004_SHOT10_PREDECESSOR=Object.freeze({renderId:'e9a8aa58-61e3-4739-a4c1-32efd13d5426',sourceCommit:'85efc3127dc9e40accbee0bea44e9309395e64bb',frames:2457});
export const SHOT10_BEATS=Object.freeze(["SHOT10_P01_B01","SHOT10_P01_B02","SHOT10_P01_B03","SHOT10_P02_B01","SHOT10_P02_B02","SHOT10_P02_B03"]);
export const SHOT10_EVENTS=Object.freeze(["RESTART","RESPONDING","WAITING","RETURNED","FLEET","REPLAY","BACKLOG","ONLINE","RUSH","CONTENTION","RELAPSE","TWICE","CONTROL","GOAL"]);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function validateEp004Shot10Production(p,requireFrame=false){
 const lock=EP004_SHOT10_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT10'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT10_EXACT_LOCKED_SHOT09_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot09Props;
 if(!prev||prev.shotKey!=='SHOT09'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT10_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot09Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==6||!Array.isArray(p.visualBeats)||p.visualBeats.length!==6)
   throw Error('SHOT10_SIX_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT10_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-45+8)
     throw Error('SHOT10_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT10_EVENTS.length)throw Error('SHOT10_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT10_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-45+8)throw Error('SHOT10_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.REPLAY!==t[3]||e.RETURNED>=t[2]||e.CONTROL<=t[5])throw Error('SHOT10_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT10_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}



export const WIDE_ROUTE=Object.freeze([[350,545],[685,545],[1015,545],[1090,545],[1090,418],[1160,418]]);
export const REPLAY_ROUTE=Object.freeze([[640,535],[800,535],[1010,535],[1170,535]]);
export const FLEET_ROUTES=Object.freeze([[[350,545],[685,545],[1015,545],[1090,545],[1090,350],[1240,350]],[[350,545],[685,545],[1015,545],[1240,545]],[[350,545],[685,545],[1015,545],[1090,545],[1090,740],[1240,740]]]);
const packet=(route,d,tone,direction)=>({...shot06Point(route,d),tone,direction});
function flow(route,f,start,stop,period,delay,speed,failedAt=Infinity,limit=18){
 const result=[],len=shot06Length(route);
 if(f<start)return result;
 for(let k=0;k<limit;k++){
   const born=start+k*period;if(born>f||born>=stop)break;
   const d=(f-born)*speed,arrival=born+len/speed,done=arrival+delay;
   if(d<len)result.push(packet(route,d,'cyan','request'));
   else if(arrival>=failedAt||done>=failedAt){
     if(f<arrival+24)result.push(packet(route,len,'amber','waiting'));
     else if(f<arrival+24+len/speed)result.push(packet(route,len-(f-arrival-24)*speed,'red','response'));
   }else if(f>=done&&f<done+len/speed)result.push(packet(route,len-(f-done)*speed,'green','response'));
 }
 return result;
}
export function shot10State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT10_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,prev=p.previousShot09Props;
 const openingMix=smooth((frame-e.RESTART)/36);
 const prior=openingMix<1?shot09State(prev.durationInFrames-1+frame,{...prev,durationInFrames:prev.durationInFrames+frame}):null;
 const stage=frame<e.FLEET?'return':frame<e.REPLAY?'fleet':frame<e.CONTROL?'replay':'controlled';
 const replay=stage==='replay',controlled=stage==='controlled';
 const clear=e.REPLAY+Math.min(42,Math.floor((e.BACKLOG-e.REPLAY)/2));
 const phase=controlled?frame<e.CONTROL+30?'booting':'running':replay?frame<clear?'failed':frame<e.ONLINE?'booting':frame<e.RELAPSE?'running':'failed':frame<e.RESPONDING?'booting':frame<e.FLEET?'running':'failed';
 const demandAt=replay?e.BACKLOG:e.WAITING;
 const release=replay?e.RUSH:e.RETURNED;
 const relapse=replay?e.RELAPSE:e.FLEET;
 const load=controlled?.24+.16*smooth((frame-e.CONTROL-36)/110):phase==='failed'?.94:frame<release?.10:.15+.78*smooth((frame-release)/Math.max(1,relapse-release));
 const route=replay||controlled?REPLAY_ROUTE:WIDE_ROUTE;
 const speed=replay?Math.max(10,shot06Length(route)/Math.max(1,(e.CONTENTION-e.RUSH)*.65)):Math.max(12,shot06Length(route)/Math.max(1,(e.FLEET-e.RETURNED)*.62));
 const admissionStart=controlled?e.CONTROL+36:release;
 const waitingCount=controlled?Math.max(0,8-Math.floor(Math.max(0,frame-admissionStart)/54)):frame<demandAt?0:Math.max(0,Math.min(8,2+Math.floor((frame-demandAt)/20))-(frame<release?0:Math.floor((frame-release)/22)));
 const queue=Array.from({length:waitingCount},(_,i)=>({x:(replay||controlled?788:674)-i*(replay||controlled?18:35),y:replay||controlled?535:545,tone:'amber',direction:'waiting'}));
 const traffic=controlled?flow(route,frame,admissionStart,p.durationInFrames,54,16,17,Infinity,48):flow(route,frame,release,relapse,22,38,speed,relapse,18);
 const fleet=FLEET_ROUTES.flatMap((r,i)=>stage==='fleet'?flow(r,frame,e.FLEET+i*14,e.REPLAY,60,20,18,e.FLEET,5):[]);
 return {stage,prior,openingMix,phase,load,queue,traffic,fleet,contention:replay?frame>=e.CONTENTION:stage==='fleet'||frame>=e.RETURNED+Math.ceil((e.FLEET-e.RETURNED)*.72),activity:.5+.5*Math.sin(frame*.071),goal:frame>=e.GOAL,secondFailure:replay&&frame>=e.TWICE,gateOpen:controlled&&frame>=admissionStart};
}
export function verifyEp004Shot10ActualMotion(p){
 validateEp004Shot10Production(p);const e=p.eventFrames,s=f=>shot10State(f,p);
 if(!s(0).prior||new Set(Array.from({length:30},(_,i)=>JSON.stringify(s(i).prior?.probes))).size<5)throw Error('SHOT10_LIVING_PREDECESSOR_REQUIRED');
 if(s(e.REPLAY).phase!=='failed'||s(e.ONLINE).phase!=='running'||s(e.RELAPSE).phase!=='failed'||s(e.CONTROL-1).stage!=='replay'||s(e.CONTROL).stage!=='controlled'||s(p.durationInFrames-1).phase!=='running')throw Error('SHOT10_CAUSAL_RECOVERY_REQUIRED');
 if(s(e.RUSH-1).traffic.length||s(e.CONTROL).traffic.length||!s(p.durationInFrames-1).goal)throw Error('SHOT10_ADMISSION_ORDER');
 return {status:'PASS',restart:e.RESTART,relapse:e.RELAPSE,control:e.CONTROL,goal:e.GOAL};
}
