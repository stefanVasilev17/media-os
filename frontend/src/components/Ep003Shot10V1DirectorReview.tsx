import {useEffect,useState} from 'react';
import {CheckCircle2,PlayCircle,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/shot10/v1/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-SHOT10-MEASUREMENT-V1-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT10_MEASUREMENT_V1';
const ENGINE='EP003_SHOT10_PIN_0fc02175a4ea';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Stored={
 status?:string;renderId?:string;renderKey?:string;compositionId?:string;
 engineVersion?:string;videoUrl?:string;profile?:string;
 fps?:number;width?:number;height?:number;durationInFrames?:number;
 sizeBytes?:number;directorLocked?:boolean;
};
type State={type:'CHECKING'|'READY'|'EMPTY';message?:string;data?:Stored};

export function Ep003Shot10V1DirectorReview(){
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
     setState({type:'EMPTY',message:'SHOT10 V1 is rendering or awaiting verified MP4 storage.'});
     return;
    }
    if(data.status!=='READY'||!data.renderId||!UUID.test(data.renderId)||
       data.renderKey!==RENDER_KEY||data.compositionId!==COMPOSITION||
       data.engineVersion!==ENGINE||data.profile!=='REVIEW'||
       data.width!==1920||data.height!==1080||data.fps!==30||
       data.durationInFrames!==4016||!data.sizeBytes||data.sizeBytes<1000000||
       data.videoUrl!==PREFIX+data.renderId+'/video'||data.directorLocked!==false){
     setState({type:'EMPTY',message:'Saved SHOT10 V1 fails strict selected-source validation. No fallback is displayed.'});
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
  aria-label="EP003 SHOT10 V1 Director video review">
  <header className="ep003-director-review-heading">
   <div>
    <h3><PlayCircle size={21} aria-hidden="true"/> SHOT10 V1 · Director Video Review</h3>
    <p>Prove the Architecture Works. SLI, SLO, p95, RTO and RPO.</p>
   </div>
   <span className="ep003-director-review-status">SHOT10 V1 · REVIEW CANDIDATE · NOT LOCKED</span>
  </header>
  <p className="ep003-director-review-detail">
   Exact decoded final SHOT09 V2 frame at the beginning. Continuous Living
   Architecture World with the same Phone, Gateway, Load Balancer, Auth,
   Shard A and B, replicas, stable camera and engineered Premium Routing.
   Original Director-selected Slow Natural voice is reused without regeneration.
   The 25 real voice anchors explain SLI, SLO, p95 latency, rejection rate,
   database telemetry, failover testing, RTO, RPO and architecture trade-offs.
   Every measured explanation card stays within the established safe layout.
  </p>
  {state.type==='CHECKING'&&<p role="status">Checking saved SHOT10 V1 MP4…</p>}
  {state.type==='EMPTY'&&<p role="status">{state.message}</p>}
  {video&&<>
   <p className="ep003-director-review-detail">
    <CheckCircle2 size={16} aria-hidden="true"/>
    Stored 1920×1080 MP4. 30 fps. 4016 frames. Original Slow Natural voice.
   </p>
   <video key={video} className="ep003-director-review-video"
     controls playsInline preload="metadata" src={video}
     onError={()=>setPlaybackError(true)}
     aria-label="SHOT10 V1 SLI SLO Director review video">
     Your browser cannot play this MP4.
   </video>
   {playbackError&&<p role="alert">Cannot play protected MP4. Check your MediaOS session and refresh.</p>}
  </>}
  <nav className="ep003-director-review-actions" aria-label="SHOT10 V1 review actions">
   <button type="button" onClick={()=>setRevision(x=>x+1)}>
    <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT10 V1
   </button>
   <a href="#/ep003/shot09/v2">View Director-LOCKED SHOT09 V2</a>
   <a href="#/ep003/full">View official 9-SHOT master</a>
  </nav>
  <p className="ep003-director-review-caution">
   SHOT10 V1 is NOT LOCKED. The official nine-shot master remains immutable until your explicit visual approval.
  </p>
 </section>;
}
