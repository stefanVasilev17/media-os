import {useEffect,useState} from 'react';
import {CheckCircle2,PlayCircle,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/shot09/v3/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-SHOT09-FAILOVER-V3-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT09_FAILOVER_V3';
const ENGINE='EP003_SHOT09_PIN_599d23563c9c';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Stored={
 status?:string;renderId?:string;renderKey?:string;compositionId?:string;
 engineVersion?:string;videoUrl?:string;profile?:string;
 fps?:number;width?:number;height?:number;durationInFrames?:number;
 sizeBytes?:number;directorLocked?:boolean;
};
type State={type:'CHECKING'|'READY'|'EMPTY';message?:string;data?:Stored};

export function Ep003Shot09V3DirectorReview(){
 const [revision,setRevision]=useState(0);
 const [state,setState]=useState<State>({type:'CHECKING'});
 const [playbackError,setPlaybackError]=useState(false);
 useEffect(()=>{
  const ctrl=new AbortController();
  setState({type:'CHECKING'});setPlaybackError(false);
  void fetch(ENDPOINT,{method:'GET',credentials:'same-origin',cache:'no-store',signal:ctrl.signal})
   .then(async response=>{
    if(response.status===401||response.status===403)
     throw Error('Sign in to MediaOS on the same domain and refresh SHOT09.');
    if(!response.ok)throw Error('SHOT09 saved MP4 lookup HTTP '+response.status);
    return response.json() as Promise<Stored>;
   }).then(data=>{
    if(ctrl.signal.aborted)return;
    if(data.status==='EMPTY'){
     setState({type:'EMPTY',message:'SHOT09 V3 is rendering or awaiting verified MP4 storage.'});
     return;
    }
    if(data.status!=='READY'||!data.renderId||!UUID.test(data.renderId)||
       data.renderKey!==RENDER_KEY||data.compositionId!==COMPOSITION||
       data.engineVersion!==ENGINE||data.profile!=='REVIEW'||
       data.width!==1920||data.height!==1080||data.fps!==30||
       data.durationInFrames!==3145||!data.sizeBytes||data.sizeBytes<1000000||
       data.videoUrl!==PREFIX+data.renderId+'/video'||data.directorLocked!==false){
     setState({type:'EMPTY',message:'Saved SHOT09 V3 fails strict selected-source validation. No fallback is displayed.'});
     return;
    }
    setState({type:'READY',data});
   }).catch(err=>{
    if(!ctrl.signal.aborted)setState({type:'EMPTY',
     message:err instanceof Error?err.message:String(err)});
   });
  return ()=>ctrl.abort();
 },[revision]);
 const video=state.type==='READY'?state.data?.videoUrl:undefined;
 return <section className="ep003-director-review"
  aria-label="EP003 SHOT09 V3 Director video review">
  <header className="ep003-director-review-heading">
   <div>
    <h3><PlayCircle size={21} aria-hidden="true"/> SHOT09 V3 · Director Video Review</h3>
    <p>When the Primary Disappears. Failover, fencing and correctness.</p>
   </div>
   <span className="ep003-director-review-status">SHOT09 V3 · REVIEW CANDIDATE · NOT LOCKED</span>
  </header>
  <p className="ep003-director-review-detail">
   Corrected premium failover edition. Owner B to Replica B route and the Independent Primary Owners heading use the same aligned geometry as SHOT08 V4.
   The first frame continues from the exact decoded final frame of verified SHOT08 V4. Original SHOT08 V3 and SHOT09 V2 remain Director-LOCKED in the official nine-shot master.
   Original Phone, Gateway, Load Balancer, three Auth instances, Shard A, Shard B
   and database replicas share one continuous Living Architecture World.
   The Primary in Shard A becomes unavailable while Shard B remains healthy.
   Failover, fencing, asynchronous replication lag and correctness appear
   with precise real selected Slow Natural narration cues. Requests follow one shared engineered route grammar, with precise corner turns, stable node anchors, restrained glow and packets sampled on the exact visible centerline. All five technical callouts are content-fitted.
  </p>
  {state.type==='CHECKING'&&<p role="status">Checking saved SHOT09 V3 MP4…</p>}
  {state.type==='EMPTY'&&<p role="status">{state.message}</p>}
  {video&&<>
   <p className="ep003-director-review-detail">
    <CheckCircle2 size={16} aria-hidden="true"/>
    Stored 1920×1080 MP4. 30 fps. 3145 frames. Original Slow Natural voice.
   </p>
   <video key={video} className="ep003-director-review-video"
     controls playsInline preload="metadata" src={video}
     onError={()=>setPlaybackError(true)}
     aria-label="SHOT09 V3 Sharding Director review video">
     Your browser cannot play this MP4.
   </video>
   {playbackError&&<p role="alert">Cannot play protected MP4. Check your MediaOS session and refresh.</p>}
  </>}
  <nav className="ep003-director-review-actions" aria-label="SHOT09 V3 review actions">
   <button type="button" onClick={()=>setRevision(x=>x+1)}>
    <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT09 V3
   </button>
   <a href="#/ep003/shot08/v4">View corrected previous SHOT08 V4</a>
   <a href="#/ep003/shot09/v1">Compare historical SHOT09 V1</a>
   <a href="#/ep003/full">View official 9-SHOT master</a>
  </nav>
  <p className="ep003-director-review-caution">
   SHOT09 V3 is NOT LOCKED. Only the Director can approve the replacement after watching. Official nine-shot source MP4s and original narration remain unchanged.
  </p>
 </section>;
}
