import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './EP004Shot01World.mjs';
import {validateEp004Shot07Production,shot07State} from './EP004Shot07ProductionWorld.mjs';
import {shot06Length,shot06Point} from './EP004Shot06FleetPreview.mjs';

export const EP004_SHOT08_COMPOSITION='EP004-SHOT08-REGIONAL-CONTAINMENT-V1-VISUAL';
export const EP004_SHOT08_PREDECESSOR=Object.freeze({renderId:'c51cbbda-f832-4c46-8a37-cc3116f50e1f',sourceCommit:'232fb7ef9dbcfa2e2d8c3d9e326660ea2a17be56',frames:2606});
export const SHOT08_BEATS=Object.freeze(['SHOT08_P01_B01','SHOT08_P01_B02','SHOT08_P01_B03','SHOT08_P02_B01','SHOT08_P02_B02','SHOT08_P03_B01','SHOT08_P03_B02','SHOT08_P03_B03','SHOT08_P04_B01','SHOT08_P04_B02']);
export const SHOT08_EVENTS=Object.freeze(['BULKHEAD','SEPARATE_ISSUE','WIDER_IMPACT','SERVICE_NAMES','ALTERNATE_RECOVERY','EXCHANGE_CONSTRAINT','USER_CONTRAST']);
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
const mod=(x,m)=>((x%m)+m)%m;
export function validateEp004Shot08Production(p,requireFrame=false){
 const lock=EP004_SHOT08_PREDECESSOR;
 if(!p||p.episodeKey!=='EP004'||p.shotKey!=='SHOT08'||p.previewOnly!==false||p.directorCpuApproved!==true
   ||p.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256||p.previousRenderId!==lock.renderId||p.previousSourceCommit!==lock.sourceCommit
   ||p.previousFrameCount!==lock.frames||p.previousLastEncodedFrame!==lock.frames-1||!Number.isInteger(p.previousWorldStartFrame)
   ||p.worldStartFrame!==p.previousWorldStartFrame+lock.frames-1||!SHA.test(p.previousVideoSha256)
   ||p.breathFrames!==72||!Number.isInteger(p.scriptRevision)||p.scriptRevision<1||!UUID.test(p.voiceTakeId)
   ||!SHA.test(p.narrationSha256)||!SHA.test(p.voiceAudioSha256)||!Number.isInteger(p.voiceAudioBytes)
   ||p.voiceAudioBytes<512||p.voiceAudioBytes>25165824||!COMMIT.test(p.expectedSourceCommit)||!UUID.test(p.packageId)||!UUID.test(p.renderRequestId)
   ||!Number.isInteger(p.durationInFrames)||p.durationInFrames<600||p.durationInFrames>9000)
   throw Error('SHOT08_EXACT_LOCKED_SHOT07_AND_APPROVED_TAKE_REQUIRED');
 const prev=p.previousShot07Props;
 if(!prev||prev.shotKey!=='SHOT07'||prev.expectedSourceCommit!==lock.sourceCommit||prev.durationInFrames!==lock.frames||prev.worldStartFrame!==p.previousWorldStartFrame||prev.sourceSha256!==p.sourceSha256)
   throw Error('SHOT08_PREDECESSOR_PROPS_REQUIRED');
 validateEp004Shot07Production(prev);
 if(!Array.isArray(p.verifiedCues)||p.verifiedCues.length!==10||!Array.isArray(p.visualBeats)||p.visualBeats.length!==10)
   throw Error('SHOT08_TEN_ORIGINAL_BEATS_REQUIRED');
 let last=71;
 p.verifiedCues.forEach((c,i)=>{
   const b=p.visualBeats[i];
   if(!c||!b||c.beatId!==SHOT08_BEATS[i]||c.beatId!==b.beatId||c.anchor!==b.cueAnchor||typeof c.anchor!=='string'||c.anchor.length<6||typeof b.direction!=='string'||b.direction.length<3||!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||c.startFrame<=last||c.endFrame<c.startFrame||c.endFrame>p.durationInFrames-45+8)
     throw Error('SHOT08_ORIGINAL_CUE_MISMATCH_'+i);
   last=c.startFrame;
 });
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame);
 if(!e||Object.keys(e).length!==SHOT08_EVENTS.length)throw Error('SHOT08_REAL_EVENT_FRAMES_REQUIRED');
 last=71;
 for(const k of SHOT08_EVENTS){
   if(!Number.isInteger(e[k])||e[k]<=last||e[k]>=p.durationInFrames-45+8)throw Error('SHOT08_EVENT_CLOCK_INVALID_'+k);
   last=e[k];
 }
 if(e.BULKHEAD<t[2]||e.SEPARATE_ISSUE<t[3]||e.WIDER_IMPACT<t[4]||e.SERVICE_NAMES<t[5]||e.EXCHANGE_CONSTRAINT>=t[7]||e.USER_CONTRAST!==t[9])throw Error('SHOT08_EVENT_BEAT_CAUSALITY');
 if((requireFrame||p.previousLastFrameDataUri!=null)&&(typeof p.previousLastFrameDataUri!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(p.previousLastFrameDataUri)||p.previousLastFrameDataUri.length>12000000))
   throw Error('SHOT08_DECODED_LOCKED_FRAME_REQUIRED');
 return true;
}

export const REGION_X=Object.freeze([390,960,1530]);
export const REGION_ROUTES=Object.freeze(REGION_X.flatMap(x=>[-115,115].map(dx=>[[x,332],[x,405],[x+dx,405],[x+dx,510]])));
export const PRODUCT_NAMES=Object.freeze(['Exchange Online','Teams','OneDrive','SharePoint','Office']);
export const PRODUCT_Y=Object.freeze([330,480,600,720,840]);
export const PRIMARY_ROUTES=Object.freeze(PRODUCT_Y.map(y=>[[430,y],[610,y],[610,390],[875,390]]));
export const ALT_ROUTES=Object.freeze(PRODUCT_Y.map(y=>[[430,y],[705,y],[705,735],[875,735]]));
export const OUTCOME_MAIL=[[575,470],[805,470],[805,380],[1160,380]];
export const OUTCOME_OTHER=[[830,704],[900,704],[900,730],[1160,730]];
function moving(path,frame,epoch,period,reverse=false){
 if(frame<epoch)return [];
 const len=shot06Length(path),speed=10,items=[];
 for(let born=epoch+Math.floor((frame-epoch)/period)*period;born>=Math.max(epoch,frame-180);born-=period){
  const d=(frame-born)*speed;
  if(d<=len)items.push({...shot06Point(path,reverse?len-d:d),reverse});
 }
 return items;
}
export function shot08State(frame,p){
 if(!Number.isInteger(frame)||frame<0||frame>=p.durationInFrames)throw Error('SHOT08_FRAME_OUTSIDE_PRODUCTION');
 const e=p.eventFrames,t=p.verifiedCues.map(c=>c.startFrame),prev=p.previousShot07Props;
 const opening=frame<t[0]+48;
 const inherited=opening?shot07State(prev.durationInFrames-1-72+mod(frame,72),prev):null;
 const stage=frame<t[5]?'regions':frame<t[8]?'dependencies':'outcome';
 const incident=frame>=t[3],lost=frame>=e.SEPARATE_ISSUE;
 const levels=[1,lost?smooth((frame-e.SEPARATE_ISSUE)/60):0,frame>=e.WIDER_IMPACT?smooth((frame-e.WIDER_IMPACT)/60):0];
 const regions=REGION_ROUTES.flatMap((path,i)=>{
   const bad=levels[Math.floor(i/2)]>.5;
   return moving(path,frame,t[0],24+i%2*6).map(pt=>({...pt,tone:bad?'red':'cyan'}));
 });
 const moved=frame>=e.ALTERNATE_RECOVERY,primary=[],alternate=[];
 PRODUCT_Y.forEach((y,i)=>{
   const migration=e.ALTERNATE_RECOVERY+i*8;
   {
      // Requests already on the primary route finish their trip before the new branch takes over.
      const path=PRIMARY_ROUTES[i],limit=i===0?Infinity:migration;
      const begin=t[5];
      for(let born=begin+Math.floor((frame-begin)/28)*28;born>=Math.max(begin,frame-320);born-=28){
       if(born>=limit)continue;
       const d=(frame-born)*10,len=shot06Length(path);
       if(d<=len)primary.push({...shot06Point(path,d),tone:'cyan'});
       else if(d<=len*2+120)primary.push({...shot06Point(path,Math.min(len,Math.max(0,len-(d-len-120)))),tone:'red'});
      }
   }
   if(i>0&&frame>=migration){
      const path=ALT_ROUTES[i],len=shot06Length(path);
      for(let born=migration+Math.floor((frame-migration)/27)*27;born>=Math.max(migration,frame-180);born-=27){
       const d=(frame-born)*10;
       if(d<=len)alternate.push({...shot06Point(path,d),tone:'cyan'});
       else if(d<=2*len)alternate.push({...shot06Point(path,2*len-d),tone:'green'});
      }
   }
 });
 const user=frame>=e.USER_CONTRAST;
 const outcome=[...moving(OUTCOME_MAIL,frame,t[8],28).map(pt=>({...pt,tone:'cyan'})),...moving(OUTCOME_MAIL,frame,t[8]+60,28,true).map(pt=>({...pt,tone:'red'})),...(user?moving(OUTCOME_OTHER,frame,e.USER_CONTRAST,28).map(pt=>({...pt,tone:'green'})):[])];
 return {stage,inherited,openingMix:smooth((frame-t[0])/48),incident,lost,levels,bulkhead:frame>=e.BULKHEAD&&frame<t[3],regions,primary,alternate,moved,serviceNames:frame>=e.SERVICE_NAMES,exchange:frame>=e.EXCHANGE_CONSTRAINT,user,outcome,focus:stage==='outcome'?smooth((frame-Math.max(e.USER_CONTRAST,p.durationInFrames-100))/100):0};
}
export function verifyEp004Shot08ActualMotion(p){
 validateEp004Shot08Production(p);const e=p.eventFrames,s=f=>shot08State(f,p);
 if(!s(0).inherited||new Set(Array.from({length:30},(_,i)=>JSON.stringify(s(i).inherited?.packets))).size<20)throw Error('SHOT08_OPENING_LIVING_REEL_REQUIRED');
 if(s(e.SEPARATE_ISSUE-1).lost||!s(e.SEPARATE_ISSUE).lost||s(e.WIDER_IMPACT-1).levels[2]!==0)throw Error('SHOT08_CONTAINMENT_CAUSALITY');
 if(s(e.ALTERNATE_RECOVERY-1).alternate.length!==0||s(e.EXCHANGE_CONSTRAINT-1).exchange||!s(e.EXCHANGE_CONSTRAINT).exchange||!s(p.durationInFrames-1).user)throw Error('SHOT08_RECOVERY_CAUSALITY');
 return {status:'PASS',bulkhead:e.BULKHEAD,containmentLost:e.SEPARATE_ISSUE,alternateRecovery:e.ALTERNATE_RECOVERY,exchangeConstraint:e.EXCHANGE_CONSTRAINT,userContrast:e.USER_CONTRAST};
}
