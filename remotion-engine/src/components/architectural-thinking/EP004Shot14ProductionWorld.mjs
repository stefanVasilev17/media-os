import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot13Production,shot13State} from './EP004Shot13ProductionWorld.mjs';
import {shot06Length,shot06Point} from './EP004Shot06FleetPreview.mjs';
export const EP004_SHOT14_COMPOSITION='EP004-SHOT14-ARCHITECTURE-PARADOX-V1-VISUAL';
export const EP004_SHOT14_PREDECESSOR=Object.freeze({renderId:'c9eb0abc-ef56-42c7-8733-b47be4122384',sourceCommit:'c97825b00ccdfec07a41737999def2e4c87feb24',frames:2078});
export const SHOT14_BEATS=Object.freeze(["SHOT14_P01_B01","SHOT14_P01_B02","SHOT14_P01_B03","SHOT14_P02_B01","SHOT14_P02_B02","SHOT14_P02_B03","SHOT14_P03_B01","SHOT14_P03_B02","SHOT14_P03_B03"]);
export const SHOT14_EVENTS=Object.freeze(["LOOK","LATENT","TEAMS","REDUCED","PEAK","DEFECT","UNRESPONSIVE","REDIRECT","DESTINATIONS","SHARED","PRESSURE","RESTART","RELAPSE","RECOVERY","PARADOX","LOCAL","GLOBAL","SUCCESS","NEXT","RELATIONSHIPS"]);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function validateEp004Shot14Production(p,requireFrame=false){
 const lock=EP004_SHOT14_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT14'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT14_EXACT_LOCKED_SHOT13_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot13Props;
 if(!prev||prev.shotKey!=='SHOT13'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT14_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot13Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==9||!Array.isArray(p.visualBeats)||p.visualBeats.length!==9)
   throw Error('SHOT14_NINE_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT14_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-45+8)
     throw Error('SHOT14_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT14_EVENTS.length)throw Error('SHOT14_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT14_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-45+8)throw Error('SHOT14_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.LOOK!==t[0]||e.TEAMS!==t[1]||e.PEAK!==t[2]||e.REDIRECT!==t[3]||e.SHARED!==t[4]||e.RELAPSE!==t[5]||e.PARADOX!==t[6]||e.GLOBAL!==t[7]||e.NEXT!==t[8])throw Error('SHOT14_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT14_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}








export const CLIENT_ROUTE=Object.freeze([[350,545],[685,545]]);
export const TEAMS_ROUTE=Object.freeze([[350,325],[430,325],[650,325],[650,545],[685,545]]);
export const FLEET_ROUTES=Object.freeze([352,545,738].map(y=>[[1015,545],[1100,545],[1100,y],[1190,y]]));
export const EXCHANGE_ROUTES=Object.freeze([352,545,738].map(y=>[[1645,y],[1780,y],[1780,545],[1850,545]]));
const mix=(f,a,n=12)=>smooth((f-a)/Math.max(1,n));
const phase=(f,e,i)=>{
 if(f<e.UNRESPONSIVE)return 'running';
 if(f<e.SHARED)return i===1?'failed':'running';
 if(f<e.RESTART)return i===1||i===0&&f>=e.PRESSURE?'failed':'running';
 if(f<e.RELAPSE)return i===1&&f<e.RESTART+30?'booting':i===0?'failed':'running';
 if(f<e.RECOVERY)return i===2?'running':'failed';
 if(f<e.PARADOX)return i===0&&f<e.RECOVERY+35?'booting':'running';
 if(f<e.GLOBAL)return i===1?'failed':'running';
 if(f<e.RELATIONSHIPS)return i===2?'running':'failed';
 return 'running';
};
function routeFor(born,n,e){
 const at=born+22;
 if(at<e.REDIRECT)return 1;
 if(at<e.SHARED)return n%2===0?0:2;
 if(at<e.RESTART)return 2;
 if(at<e.RECOVERY)return 1;
 if(at<e.PARADOX)return n%3;
 if(at<e.RELATIONSHIPS)return 0;
 return n%3;
}
function flow(frame,e){
 const dots=[],start=e.LOOK+12;
 for(let n=Math.max(0,Math.floor((frame-start)/13)-32);n<=Math.floor((frame-start)/13);n++){
  const born=start+n*13,age=frame-born;
  if(born<e.PEAK&&n%2===1||born>=e.RECOVERY&&n%3!==0)continue;
  const teams=born>=e.TEAMS+12&&n%2===0,selected=routeFor(born,n,e);
  const ingress=[...(teams?TEAMS_ROUTE:CLIENT_ROUTE),...FLEET_ROUTES[selected]],gatewayArrival=born+Math.ceil(shot06Length(ingress)/14);
  const success=phase(gatewayArrival,e,selected)==='running'&&!(gatewayArrival>=e.DEFECT&&gatewayArrival<e.RECOVERY&&n%3!==0);
  const route=success?[...ingress,...EXCHANGE_ROUTES[selected]]:ingress,len=shot06Length(route),travel=Math.ceil(len/14),completion=born+travel+12;
  const completed=success&&phase(completion,e,selected)==='running';
  if(age<travel)dots.push({...shot06Point(route,age*14),tone:teams?'violet':'cyan',direction:'request'});
  else if(completed&&age>=travel+12&&age<2*travel+12)dots.push({...shot06Point(route,Math.max(0,len-(age-travel-12)*14)),tone:'green',direction:'response'});
  else if(!completed&&age<travel+28)dots.push({...shot06Point(route,len),tone:'amber',direction:'waiting'});
 }
 return dots.filter(p=>(p.x<=685||p.x>=1015)&&!(p.x>430&&p.x<650&&p.y>280&&p.y<370)&&!(p.x>1190&&p.x<1645&&p.y>=286&&p.y<=804));
}
export function shot14State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT14_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,prev=p.previousShot13Props;
 const prior=shot13State(prev.durationInFrames-1+frame,{...prev,durationInFrames:prev.durationInFrames+frame});
 const openingMix=mix(frame,e.LOOK),wide=mix(frame,e.LOOK,36),teams=mix(frame,e.TEAMS),home=mix(frame,e.RELATIONSHIPS,45);
 const phases=[0,1,2].map(i=>phase(frame,e,i));
 const focus=frame<e.LOOK?'inherited':frame<e.TEAMS?'latent':frame<e.REDUCED?'teams':frame<e.PEAK?'capacity':frame<e.DEFECT?'peak':frame<e.REDIRECT?'defect':frame<e.RESTART?'cascade':frame<e.RECOVERY?'relapse':frame<e.PARADOX?'recovery':frame<e.GLOBAL?'local':frame<e.RELATIONSHIPS?'global':'relationships';
 return {prior,openingMix,wide,teams,home,phases,focus,latent:frame>=e.LATENT&&frame<e.RECOVERY,constrained:frame>=e.REDUCED&&frame<e.RECOVERY,contention:frame>=e.DEFECT&&frame<e.RECOVERY,controlled:frame>=e.RECOVERY&&frame<e.PARADOX,local:frame>=e.LOCAL&&frame<e.RELATIONSHIPS,global:frame>=e.GLOBAL&&frame<e.RELATIONSHIPS,traffic:openingMix<1?prior.traffic:flow(frame,e),activity:.5+.5*Math.sin((prev.durationInFrames-1+frame)*.071)};
}
export function verifyEp004Shot14ActualMotion(p){
 validateEp004Shot14Production(p);const e=p.eventFrames,s=f=>shot14State(f,p);
 if(s(0).openingMix!==0||s(e.LOOK+12).openingMix!==1||s(e.TEAMS-1).teams!==0||!s(e.REDUCED).constrained||!s(e.DEFECT).contention||s(e.UNRESPONSIVE).phases[1]!=='failed'||!s(e.RECOVERY).controlled||!s(e.LOCAL).local||!s(e.GLOBAL).global||s(p.durationInFrames-1).focus!=='relationships')throw Error('SHOT14_CAUSAL_PARADOX_REQUIRED');
 return {status:'PASS',look:e.LOOK,teams:e.TEAMS,defect:e.DEFECT,cascade:e.REDIRECT,recovery:e.RECOVERY,local:e.LOCAL,global:e.GLOBAL,relationships:e.RELATIONSHIPS};
}
