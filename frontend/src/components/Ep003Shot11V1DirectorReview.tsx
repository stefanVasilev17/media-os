import {useEffect,useState} from 'react';
import {CheckCircle2,PlayCircle,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/shot11/v1/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-SHOT11-FINALE-V1-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT11_FINALE_V1';
const ENGINE='EP003_SHOT11_PIN_140398af1c5b';
const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
type Saved={
 status?:string;renderId?:string;renderKey?:string;compositionId?:string;
 engineVersion?:string;profile?:string;videoUrl?:string;
 width?:number;height?:number;fps?:number;durationInFrames?:number;
 sizeBytes?:number;directorLocked?:boolean;
};
type Result={status:'LOADING'|'READY'|'EMPTY';render?:Saved;message?:string;pending?:boolean};
export function Ep003Shot11V1DirectorReview(){
 const [revision,setRevision]=useState(0);
 const [result,setResult]=useState<Result>({status:'LOADING'});
 const [mediaError,setMediaError]=useState(false);
 useEffect(()=>{
  const ctrl=new AbortController();
  setResult({status:'LOADING'});setMediaError(false);
  void fetch(ENDPOINT,{method:'GET',credentials:'same-origin',cache:'no-store',signal:ctrl.signal})
   .then(async response=>{
    if(response.status===401||response.status===403)
     throw Error('Sign in to MediaOS to watch the protected Director video.');
    if(!response.ok)throw Error('SHOT11 saved MP4 HTTP '+response.status);
    return response.json() as Promise<Saved>;
   }).then(data=>{
    if(ctrl.signal.aborted)return;
    if(data.status==='EMPTY'){
     setResult({status:'EMPTY',pending:true,message:'SHOT11 rendering and encoded seam checks are not finished. MediaOS checks automatically for the saved MP4.'});
     return;
    }
    if(data.status!=='READY'||!data.renderId||!UUID.test(data.renderId)
      ||data.compositionId!==COMPOSITION||data.renderKey!==RENDER_KEY
      ||data.engineVersion!==ENGINE||data.profile!=='REVIEW'
      ||data.width!==1920||data.height!==1080||data.fps!==30
      ||data.durationInFrames!==3104||!data.sizeBytes||data.sizeBytes<1000000
      ||data.directorLocked!==false
      ||data.videoUrl!==PREFIX+data.renderId+'/video'){
     setResult({status:'EMPTY',message:'Saved SHOT11 failed exact Director source/version verification. No old MP4 fallback is shown.'});
     return;
    }
    setResult({status:'READY',render:data});
   }).catch(error=>{
    if(!ctrl.signal.aborted)setResult({status:'EMPTY',message:error instanceof Error?error.message:String(error)});
   });
  return ()=>ctrl.abort();
 },[revision]);
 useEffect(()=>{
  if(result.status!=='EMPTY'||!result.pending)return;
  const id=window.setTimeout(()=>setRevision(n=>n+1),30000);
  return ()=>window.clearTimeout(id);
 },[result.status,result.pending,revision]);
 const video=result.status==='READY'?result.render?.videoUrl:undefined;
 return <section className="ep003-director-review" aria-label="EP003 SHOT11 V1 Director video review">
  <header className="ep003-director-review-heading">
   <div>
    <h3><PlayCircle size={21} aria-hidden="true"/> SHOT11 V1 · Director Review</h3>
    <p>What One Login Teaches Us About Architecture · Human-first finale.</p>
   </div>
   <span className="ep003-director-review-status">SHOT11 V1 · DIRECTOR CANDIDATE · NOT LOCKED</span>
  </header>
  <p className="ep003-director-review-detail">
   The exact final SHOT10 V2 decoded frame is the opening frame of SHOT11.
   The same Living Architecture World, Phone, Gateway, Auth Service, Owners and
   replicas continue without a scene reset. All moving request dots follow
   the true premium connection paths. The six summary cards reuse SHOT09/10
   layout, typography and colors and remain in their safe content region.
   Original selected Slow Natural voice · 24 real aligned narration cues · no regeneration.
  </p>
  {result.status==='LOADING'&&<p role="status">Checking verified SHOT11 MP4…</p>}
  {result.status==='EMPTY'&&<p role="status">{result.message}</p>}
  {video&&<>
    <p className="ep003-director-review-detail"><CheckCircle2 size={16} aria-hidden="true"/>
     Verified 3104 frames · 1920×1080 · 30 fps · original H264/AAC production voice.
    </p>
    <video key={video} className="ep003-director-review-video" controls
      playsInline preload="metadata" src={video}
      onError={()=>setMediaError(true)}
      aria-label="SHOT11 human-first finale Director full video">
      Your browser cannot play this MP4.
    </video>
    {mediaError&&<p role="alert">Protected MP4 playback failed. Verify your MediaOS session.</p>}
  </>}
  <nav className="ep003-director-review-actions" aria-label="SHOT11 actions">
    <button type="button" onClick={()=>setRevision(n=>n+1)}>
     <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT11 V1
    </button>
    <a href="#/ep003/full">View official 10-SHOT Director LOCK</a>
    {video&&<a href={video} target="_blank" rel="noopener noreferrer">Open SHOT11 MP4</a>}
  </nav>
  <p className="ep003-director-review-caution">
   Director review only. SHOT11 is not LOCKED until your explicit approval.
   The original SHOT01–10 official master is never changed by this player.
  </p>
 </section>;
}
