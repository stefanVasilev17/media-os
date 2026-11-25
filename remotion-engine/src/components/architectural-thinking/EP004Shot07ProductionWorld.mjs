import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot06Production} from './EP004Shot06ProductionWorld.mjs';
import {SHOT06_INPUTS,SHOT06_OUTPUTS,SHOT06_FLEET,SHOT06_EMISSION_INTERVAL,shot06Length,shot06Point,shot06PreviewState} from './EP004Shot06FleetPreview.mjs';

export const EP004_SHOT07_COMPOSITION='EP004-SHOT07-CASCADING-FAILURE-V1-VISUAL';
export const EP004_SHOT07_PREDECESSOR=Object.freeze({renderId:'2b68bda7-8f0d-471f-a2d5-78e5765ac63e',sourceCommit:'cf0945e58f4e420c744d0006b665d9bc7edff97d',frames:2373});
export const SHOT07_BEATS=Object.freeze(['SHOT07_P01_B01','SHOT07_P01_B02','SHOT07_P01_B03','SHOT07_P02_B01','SHOT07_P02_B02','SHOT07_P03_B01','SHOT07_P03_B02','SHOT07_P03_B03']);
export const SHOT07_EVENTS=Object.freeze(['FLEET_B_FAIL','AFFECTED_PERCENT','ELAPSED_PERIOD','REEL_START','REEL_RESCUE','REEL_PRESSURE','REEL_B_FAIL','REEL_REDIRECT','LOCAL_VS_GLOBAL','PAYOFF']);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
const mod=(x,m)=>((x%m)+m)%m;
export const REEL_INPUT=Object.freeze([[960,246],[960,330]]);
export const REEL_OUTPUTS=Object.freeze([
 [[960,488],[960,522],[862,522],[787,522],[764,545],[764,643]],
 [[960,488],[960,643]],
 [[960,488],[960,522],[1058,522],[1133,522],[1156,545],[1156,643]]
]);
export function validateEp004Shot07Production(p,requireFrame=false){
 const lock=EP004_SHOT07_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT07'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT07_EXACT_LOCKED_SHOT06_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot06Props;
 if(!prev||prev.shotKey!=='SHOT06'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT07_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot06Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==8||!Array.isArray(p.visualBeats)||p.visualBeats.length!==8)
   throw Error('SHOT07_EIGHT_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT07_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-45+8)
     throw Error('SHOT07_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT07_EVENTS.length)throw Error('SHOT07_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT07_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-45+8)throw Error('SHOT07_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.FLEET_B_FAIL<t[2]||e.FLEET_B_FAIL>=t[3]||e.AFFECTED_PERCENT<t[3]||e.REEL_START!==t[5]||e.REEL_PRESSURE!==t[6]||e.REEL_REDIRECT>=t[7]||e.LOCAL_VS_GLOBAL<t[7])throw Error('SHOT07_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT07_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}
function oldState(frame,p){
 const prev=p.previousShot06Props,last=prev.durationInFrames-1;
 // The exact stable SHOT06 tail has a 72-frame request destination cycle.
 // Its phase continues forward from the real final encoded frame.
 return shot06PreviewState(last-72+mod(frame,72),prev.verifiedCues,prev.durationInFrames);
}
function fleetPackets(frame,p){
 const clock=p.previousLastEncodedFrame+frame,origin=p.previousLastEncodedFrame;
 const t=p.verifiedCues.map(c=>c.startFrame),e=p.eventFrames,packets=[];
 for(let born=Math.floor(clock/SHOT06_EMISSION_INTERVAL)*SHOT06_EMISSION_INTERVAL;born>=clock-240;born-=SHOT06_EMISSION_INTERVAL){
   const id=Math.round(born/SHOT06_EMISSION_INTERVAL),lane=mod(id,2),input=SHOT06_INPUTS[lane],speed=10;
   const inLength=shot06Length(input),d=(clock-born)*speed,arrival=born+Math.ceil(inLength/speed)+24;
   if(d<=inLength){packets.push({id,lane,phase:'INGRESS',...shot06Point(input,d)});continue;}
   if(clock<arrival)continue;
   const dispatched=arrival-origin;
   const dest=dispatched>=e.FLEET_B_FAIL?2:dispatched>=t[1]?(mod(id,4)===0?2:1):1+mod(Math.floor(id/2),2);
   const path=SHOT06_OUTPUTS[dest],length=shot06Length(path),travel=(clock-arrival)*speed;
   if(travel<=length)packets.push({id,lane,destination:dest,phase:'TO_SERVER',...shot06Point(path,travel)});
   else if(dest===1&&frame>=e.FLEET_B_FAIL&&travel<=length+40)packets.push({id,lane,destination:dest,phase:'STOPPED',...shot06Point(path,length)});
   else if(frame<e.FLEET_B_FAIL||dest===2){
     const wait=dest===1&&frame>=t[1]?25:12,returnDistance=travel-length-wait*speed;
     if(returnDistance>=0&&returnDistance<length&&mod(id,3)===0)
       packets.push({id,lane,destination:dest,phase:'RESPONSE',...shot06Point(path,length-returnDistance)});
   }
 }
 return packets;
}
function reelPackets(frame,p){
 const e=p.eventFrames,packets=[],speed=6;
 const start=e.REEL_START;
 // Bind each new token to its destination at the router, never mid-flight.
 for(let born=start+Math.max(0,Math.floor((frame-start)/18))*18;born>=Math.max(start,frame-200);born-=18){
   const id=(born-start)/18,lane=0,age=frame-born,inputLen=shot06Length(REEL_INPUT);
   if(age*speed<=inputLen){packets.push({id,lane,phase:'INGRESS',...shot06Point(REEL_INPUT,age*speed)});continue;}
   const dispatch=born+Math.ceil(inputLen/speed)+26;
   if(frame<dispatch||dispatch<e.REEL_RESCUE)continue;
   if(dispatch>=e.REEL_B_FAIL&&dispatch<e.REEL_REDIRECT)continue;
   const dest=dispatch>=e.REEL_REDIRECT?2:1,path=REEL_OUTPUTS[dest],length=shot06Length(path),travel=(frame-dispatch)*speed;
   if(travel<=length){packets.push({id,lane,destination:dest,phase:'TO_SERVER',...shot06Point(path,travel)});continue;}
   if(dest===1&&frame>=e.REEL_B_FAIL){
     if(travel<length+35*speed)packets.push({id,lane,destination:dest,phase:'STOPPED',...shot06Point(path,length)});
     continue;
   }
   const returnDistance=travel-length-12*speed;
   if(dest===1&&frame<e.REEL_PRESSURE&&returnDistance>=0&&returnDistance<length)
     packets.push({id,lane,destination:dest,phase:'RESPONSE',...shot06Point(path,length-returnDistance)});
 }
 return packets;
}
export function shot07State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT07_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(frame<t[1]){
   const old=oldState(frame,p);
   return {stage:'fleet',headline:frame<t[0]?old.headline:'FAILOVER REDIRECTS NEW REQUESTS',states:old.serverStates,packets:old.packets,focus:0,percentage:false,elapsed:false,routerGood:true,globalBad:false};
 }
 const bFailed=frame>=e.FLEET_B_FAIL;
 const pressure=smooth((frame-t[1])/Math.max(1,e.FLEET_B_FAIL-t[1]));
 const cPressure=smooth((frame-e.FLEET_B_FAIL)/Math.max(1,Math.min(75,t[3]-e.FLEET_B_FAIL)));
 const states=[{id:'A',status:'Unresponsive',load:0},{id:'B',status:bFailed?'Unresponsive':'Higher load',load:bFailed?0:.75+.25*pressure},{id:'C',status:'Higher load',load:.75+.25*cPressure}];
 if(frame<e.REEL_START){
   return {stage:frame<t[3]?'fleet':'overview',headline:bFailed?'FEWER DESTINATIONS. MORE PRESSURE.':'THE SURVIVING SERVER TAKES MORE WORK',states,packets:fleetPackets(frame,p),focus:smooth((frame-t[1])/65)*(1-smooth((frame-e.FLEET_B_FAIL)/65)),percentage:frame>=e.AFFECTED_PERCENT,elapsed:frame>=e.ELAPSED_PERIOD,routerGood:true,globalBad:bFailed};
 }
 const reelFailed=frame>=e.REEL_B_FAIL,redirect=frame>=e.REEL_REDIRECT,reelPressure=smooth((frame-e.REEL_PRESSURE)/Math.max(1,e.REEL_B_FAIL-e.REEL_PRESSURE)),nextPressure=smooth((frame-e.REEL_REDIRECT)/65);
 return {stage:'reel',headline:frame<e.REEL_RESCUE?'A BACKUP IS NOT AUTOMATICALLY A RESCUE':frame<e.REEL_PRESSURE?'THE ROUTER MAKES A VALID DECISION':frame<e.REEL_B_FAIL?'THE SAME WEAKNESS UNDER MORE LOAD':frame<e.LOCAL_VS_GLOBAL?'THE PRESSURE MOVES AGAIN':'LOCAL RESCUE. GLOBAL FAILURE.',states:[{id:'A',status:'Unresponsive',load:0},{id:'B',status:reelFailed?'Unresponsive':frame>=e.REEL_PRESSURE?'Higher load':'Serving',load:reelFailed?0:.42+.58*reelPressure},{id:'C',status:redirect?'Higher load':'Serving',load:.4+.59*nextPressure}],packets:reelPackets(frame,p),focus:0,percentage:false,elapsed:false,routerGood:true,globalBad:frame>=e.LOCAL_VS_GLOBAL,payoff:frame>=e.PAYOFF,redirect};
}
export function verifyEp004Shot07ActualMotion(p){
 validateEp004Shot07Production(p);
 const e=p.eventFrames,s=f=>shot07State(f,p);
 if(s(0).states[0].status!=='Unresponsive'||s(e.FLEET_B_FAIL-1).states[1].status==='Unresponsive'||s(e.FLEET_B_FAIL).states[1].status!=='Unresponsive')throw Error('SHOT07_FLEET_CAUSE_ORDER');
 if(s(e.AFFECTED_PERCENT-1).percentage||!s(e.AFFECTED_PERCENT).percentage||s(e.ELAPSED_PERIOD-1).elapsed||!s(e.ELAPSED_PERIOD).elapsed)throw Error('SHOT07_FACTS_PREMATURE');
 if(s(e.REEL_START).stage!=='reel'||s(e.REEL_B_FAIL-1).states[1].status==='Unresponsive'||s(e.REEL_B_FAIL).states[1].status!=='Unresponsive')throw Error('SHOT07_REEL_CAUSE_ORDER');
 const end=s(p.durationInFrames-1);
 if(!end.payoff||!end.globalBad||!end.routerGood||end.states[2].status!=='Higher load')throw Error('SHOT07_FINAL_CONTRAST_REQUIRED');
 return {status:'PASS',fleetFailure:e.FLEET_B_FAIL,affectedPercent:e.AFFECTED_PERCENT,reelStart:e.REEL_START,reelFailure:e.REEL_B_FAIL,payoff:e.PAYOFF};
}
