import {useEffect,useState} from 'react';
import {CheckCircle2,PlayCircle,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/shot08/v1/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-SHOT08-SHARDING-V1-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT08_SHARDING_V1';
const ENGINE='EP003_SHOT08_PIN_8f0b2a80734a';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Stored={
 status?:string;renderId?:string;renderKey?:string;compositionId?:string;
 engineVersion?:string;videoUrl?:string;profile?:string;
 fps?:number;width?:number;height?:number;durationInFrames?:number;
 sizeBytes?:number;directorLocked?:boolean;
};
type State={type:'CHECKING'|'READY'|'EMPTY';message?:string;data?:Stored};

export function Ep003Shot08V1DirectorReview(){
 const [revision,setRevision]=useState(0);
 const [state,setState]=useState<State>({type:'CHECKING'});
 const [playbackError,setPlaybackError]=useState(false);
 useEffect(()=>{
  const ctrl=new AbortController();
  setState({type:'CHECKING'});setPlaybackError(false);
  void fetch(ENDPOINT,{method:'GET',credentials:'same-origin',cache:'no-store',signal:ctrl.signal})
   .then(async response=>{
    if(response.status===401||response.status===403)
     throw Error('Sign in to MediaOS on the same domain and refresh SHOT08.');
    if(!response.ok)throw Error('SHOT08 saved MP4 lookup HTTP '+response.status);
    return response.json() as Promise<Stored>;
   }).then(data=>{
    if(ctrl.signal.aborted)return;
    if(data.status==='EMPTY'){
     setState({type:'EMPTY',message:'SHOT08 V1 is rendering or awaiting verified MP4 storage.'});
     return;
    }
    if(data.status!=='READY'||!data.renderId||!UUID.test(data.renderId)||
       data.renderKey!==RENDER_KEY||data.compositionId!==COMPOSITION||
       data.engineVersion!==ENGINE||data.profile!=='REVIEW'||
       data.width!==1920||data.height!==1080||data.fps!==30||
       data.durationInFrames!==5372||!data.sizeBytes||data.sizeBytes<1000000||
       data.videoUrl!==PREFIX+data.renderId+'/video'||data.directorLocked!==false){
     setState({type:'EMPTY',message:'Saved SHOT08 V1 fails strict selected-source validation. No fallback is displayed.'});
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
  aria-label="EP003 SHOT08 V1 Director video review">
  <header className="ep003-director-review-heading">
   <div>
    <h3><PlayCircle size={21} aria-hidden="true"/> SHOT08 V1 · Director Video Review</h3>
    <p>When Copies Are Not Enough. Independent Primary owners. Sharding and routing.</p>
   </div>
   <span className="ep003-director-review-status">SHOT08 V1 · CANDIDATE · NOT LOCKED</span>
  </header>
  <p className="ep003-director-review-detail">
   One uninterrupted Living Architecture World. The first frame is the
   exact last decoded frame of the Director-LOCKED SHOT07 V3.
   Phone, Gateway, Load Balancer and three Auth instances are preserved.
   Primary owners split into Shard A and Shard B. Every moving request
   stays on an actual login route. Technical glossary cards are fitted
   to readable text. Original selected Slow Natural narration is preserved.
  </p>
  {state.type==='CHECKING'&&<p role="status">Checking saved SHOT08 V1 MP4…</p>}
  {state.type==='EMPTY'&&<p role="status">{state.message}</p>}
  {video&&<>
   <p className="ep003-director-review-detail">
    <CheckCircle2 size={16} aria-hidden="true"/>
    Stored 1920×1080 MP4. 30 fps. 5372 frames. Original Slow Natural voice.
   </p>
   <video key={video} className="ep003-director-review-video"
     controls playsInline preload="metadata" src={video}
     onError={()=>setPlaybackError(true)}
     aria-label="SHOT08 V1 Sharding Director review video">
     Your browser cannot play this MP4.
   </video>
   {playbackError&&<p role="alert">Cannot play protected MP4. Check your MediaOS session and refresh.</p>}
  </>}
  <nav className="ep003-director-review-actions" aria-label="SHOT08 V1 review actions">
   <button type="button" onClick={()=>setRevision(x=>x+1)}>
    <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT08 V1
   </button>
   <a href="#/ep003/full">View locked 7-SHOT master</a>
  </nav>
  <p className="ep003-director-review-caution">
   SHOT08 V1 is NOT LOCKED. Only the Director can approve it.
   Previously accepted SHOT01–07 and the complete official master are immutable.
  </p>
 </section>;
}
