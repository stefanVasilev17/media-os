import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot14Production,shot14State,CLIENT_ROUTE,FLEET_ROUTES,EXCHANGE_ROUTES,TEAMS_ROUTE} from './EP004Shot14ProductionWorld.mjs';
import {shot06Length,shot06Point} from './EP004Shot06FleetPreview.mjs';
export const EP004_SHOT15_COMPOSITION='EP004-SHOT15-HUMAN-CONSEQUENCE-V1-VISUAL';
export const EP004_SHOT15_PREDECESSOR=Object.freeze({renderId:'404832c1-0b7d-4de7-a95b-1971445d9a4d',sourceCommit:'e1158d874c63205bffb55e4ea6e0e011e667ea75',frames:2018});
export const SHOT15_BEATS=Object.freeze(["SHOT15_P01_B01","SHOT15_P01_B02","SHOT15_P02_B01","SHOT15_P02_B02","SHOT15_P03_B01","SHOT15_P03_B02"]);
export const SHOT15_EVENTS=Object.freeze(["PERSON","MATTERED","NEEDED","GATEWAYS","CAPACITY","HIDDEN","BEYOND","QUESTION","FAILS","PROTECT","NEXT","FAILOVER","DESIGN","UNCERTAINTY"]);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function validateEp004Shot15Production(p,requireFrame=false){
 const lock=EP004_SHOT15_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT15'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT15_EXACT_LOCKED_SHOT14_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot14Props;
 if(!prev||prev.shotKey!=='SHOT14'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT15_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot14Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==6||!Array.isArray(p.visualBeats)||p.visualBeats.length!==6)
   throw Error('SHOT15_SIX_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT15_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-60+8)
     throw Error('SHOT15_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT15_EVENTS.length)throw Error('SHOT15_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT15_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-60+8)throw Error('SHOT15_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.PERSON!==t[0]||e.NEEDED!==t[1]||e.BEYOND!==t[2]||e.FAILS!==t[3]||e.FAILOVER!==t[4]||e.DESIGN!==t[5])throw Error('SHOT15_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT15_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}









export const SHOT15_TAIL_FRAMES=60;
export const FINAL_MAP=Object.freeze({scale:.855,tx:100,ty:67});
const ramp=(f,a,n=12)=>smooth((f-a)/Math.max(1,n));
const pointOn=(route,t)=>shot06Point(route,shot06Length(route)*clamp(t));
export const inboxPort=zoom=>[100+470*zoom,545];
const fullPath=(zoom,i=1)=>[inboxPort(zoom),[685,545],...FLEET_ROUTES[i],...EXCHANGE_ROUTES[i]];
export function finalCamera(frame,e){
 const close=ramp(frame,e.NEEDED,36)*(1-ramp(frame,e.BEYOND,36));
 const wide=ramp(frame,e.BEYOND,36);
 // One finite move toward the human, then a single pullback. No camera loop.
 return {scale:FINAL_MAP.scale+.145*close-.035*wide,tx:FINAL_MAP.tx-76*close+20*wide,ty:FINAL_MAP.ty-35*close+8*wide};
}
function hero(frame,e,zoom){
 const begin=e.PERSON+12,arrival=Math.max(begin+1,Math.min(e.NEEDED-2,e.MATTERED+Math.floor((e.NEEDED-e.MATTERED)*.30))),returned=e.NEEDED;
 if(frame<begin||frame>=returned)return null;
 const path=fullPath(zoom);
 if(frame<arrival)return {...pointOn(path,(frame-begin)/Math.max(1,arrival-begin)),tone:'cyan',direction:'request',hero:true};
 return {...pointOn(path,1-(frame-arrival)/Math.max(1,returned-arrival)),tone:'green',direction:'response',hero:true};
}
function finalTraffic(frame,e,zoom){
 const out=[],birth=e.FAILOVER+12,period=56;
 for(let n=Math.max(0,Math.floor((frame-birth)/period)-6);n<=Math.floor((frame-birth)/period);n++){
   const age=frame-birth-n*period,route=fullPath(zoom,1),len=shot06Length(route),travel=Math.ceil(len/28);
   if(age<travel)out.push({...pointOn(route,age/travel),tone:'cyan',direction:'request'});
   else if(age>=travel+10&&age<2*travel+10)out.push({...pointOn(route,1-(age-travel-10)/travel),tone:'green',direction:'response'});
 }
 return out;
}
export function shot15State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT15_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,prev=p.previousShot14Props;
 const prior=shot14State(prev.durationInFrames-1+frame,{...prev,durationInFrames:prev.durationInFrames+frame});
 const person=ramp(frame,e.PERSON),pullback=ramp(frame,e.BEYOND,36),quiet=ramp(frame,e.DESIGN,18);
 const zoom=.532+.285*person-.20*pullback;
 const inherited=frame<e.PERSON;
 const packet=hero(frame,e,zoom);
 const capacity=frame>=e.CAPACITY,question=frame>=e.FAILS&&frame<e.FAILOVER;
 const focus=inherited?'inherited':frame<e.NEEDED?'person':frame<e.BEYOND?'behind':frame<e.FAILS?'beyond':frame<e.FAILOVER?'question':frame<e.DESIGN?'resolution':'final';
 const ambient=prior.traffic.filter((x,i)=>frame<e.PERSON+12||i%3===0);
 const traffic=[...ambient,...finalTraffic(frame,e,zoom)];
 return {prior,person,pullback,quiet,zoom,camera:finalCamera(frame,e),focus,capacity,question,delivered:frame>=e.NEEDED,packet,traffic,activity:prior.activity,headroom:question?.38+.15*ramp(frame,e.PROTECT):.53,alternative:frame>=e.BEYOND&&frame<e.DESIGN};
}
export function verifyEp004Shot15ActualMotion(p){
 validateEp004Shot15Production(p);const e=p.eventFrames,s=f=>shot15State(f,p);
 if(s(0).person!==0||s(e.PERSON+12).person!==1||s(e.NEEDED-1).delivered||!s(e.NEEDED).delivered||!s(e.FAILS).question||s(e.FAILOVER).question||s(p.durationInFrames-1).focus!=='final')throw Error('SHOT15_CAUSAL_HUMAN_FINALE_REQUIRED');
 const req=s(e.PERSON+12).packet,resp=s(e.NEEDED-1).packet;
 if(!req||req.direction!=='request'||!resp||resp.direction!=='response')throw Error('SHOT15_REAL_REQUEST_RESPONSE_REQUIRED');
 const last=p.durationInFrames-1;
 if(JSON.stringify(s(last).traffic)===JSON.stringify(s(last-12).traffic))throw Error('SHOT15_LIVING_TAIL_REQUIRED');
 return {status:'PASS',person:e.PERSON,needed:e.NEEDED,beyond:e.BEYOND,fails:e.FAILS,failover:e.FAILOVER,design:e.DESIGN,tailFrames:SHOT15_TAIL_FRAMES};
}
