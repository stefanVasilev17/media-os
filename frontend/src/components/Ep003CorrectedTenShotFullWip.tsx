import {useEffect,useState} from 'react';
import {CheckCircle2,Film,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/cumulative/wip-corrected-ten/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-CUMULATIVE-WIP-CORRECTED-TEN-SHOT';
const RENDER_KEY='EP003_CUMULATIVE_WIP_CORRECTED_SHOTS_01_TO_10';
const ENGINE='EP003_WIP_OWNER_B_V2';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Render={
 status?:string;renderId?:string;renderKey?:string;compositionId?:string;
 engineVersion?:string;videoUrl?:string;profile?:string;
 width?:number;height?:number;fps?:number;durationInFrames?:number;
 sizeBytes?:number;directorLocked?:boolean;
};
type State={type:'LOADING'|'READY'|'EMPTY';message?:string;render?:Render;pending?:boolean};
export function Ep003CorrectedTenShotFullWip(){
 const [revision,setRevision]=useState(0);
 const [state,setState]=useState<State>({type:'LOADING'});
 const [playbackError,setPlaybackError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  setState({type:'LOADING'});setPlaybackError(false);
  void fetch(ENDPOINT,{method:'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal})
   .then(async response=>{
    if(response.status===401||response.status===403)throw Error('Sign in to MediaOS to review the protected EP003 film.');
    if(!response.ok)throw Error('Corrected EP003 WIP lookup HTTP '+response.status);
    return response.json() as Promise<Render>;
   })
   .then(render=>{
    if(controller.signal.aborted)return;
    if(render.status==='EMPTY'){
     setState({type:'EMPTY',pending:true,message:'The corrected 10-SHOT WIP master has not passed all render and seam checks yet. This page automatically rechecks for the verified saved MP4. The official nine-shot master remains available separately.'});
     return;
    }
    if(render.status!=='READY'||!render.renderId||!UUID.test(render.renderId)
      ||render.renderKey!==RENDER_KEY||render.compositionId!==COMPOSITION
      ||render.engineVersion!==ENGINE||render.profile!=='REVIEW'
      ||render.fps!==30||render.width!==1920||render.height!==1080
      ||render.durationInFrames!==35489||!render.sizeBytes||render.sizeBytes<2000000
      ||render.videoUrl!==PREFIX+render.renderId+'/video'||render.directorLocked!==false){
     setState({type:'EMPTY',message:'WIP master failed exact corrected-source and saved-MP4 validation. No historical fallback is shown.'});
     return;
    }
    setState({type:'READY',render});
   })
   .catch(e=>{if(!controller.signal.aborted)setState({type:'EMPTY',message:e instanceof Error?e.message:String(e)});});
  return ()=>controller.abort();
 },[revision]);
 useEffect(()=>{
  if(state.type!=='EMPTY'||!state.pending)return;
  const timer=window.setTimeout(()=>setRevision(n=>n+1),30000);
  return ()=>window.clearTimeout(timer);
 },[state.type,state.pending,revision]);
 const movie=state.type==='READY'?state.render?.videoUrl:undefined;
 return <section className="ep003-director-review" aria-label="EP003 corrected ten-shot full WIP director review">
  <header className="ep003-director-review-heading">
   <div>
    <h3><Film size={22} aria-hidden="true"/> EP003 · Archived Director Review · 10 SHOTs</h3>
    <p>SHOT01–07 original Director LOCKs + corrected SHOT08 V4, SHOT09 V3, SHOT10 V2.</p>
   </div>
   <span className="ep003-director-review-status">ARCHIVED 10-SHOT REVIEW · SUPERSEDED BY OFFICIAL 11-SHOT MASTER</span>
  </header>
  <p className="ep003-director-review-detail">
   One continuous 19:42.97 film using original Slow Natural audio, actual saved SHOT videos and no video or audio regeneration during assembly.
   Owner B travels from its exact center to Replica B top-center. INDEPENDENT PRIMARY OWNERS is repositioned.
   The ten-shot version has nine decoded boundary checks and never changes the official nine-shot Director-LOCKED master.
   Earlier SHOT03–07 legacy line-style corrections are still a separate pending review.
  </p>
  {state.type==='LOADING'&&<p role="status">Checking verified corrected ten-shot video…</p>}
  {state.type==='EMPTY'&&<p role="status">{state.message}</p>}
  {movie&&<>
   <p className="ep003-director-review-detail"><CheckCircle2 size={16} aria-hidden="true"/>
    Saved and verified 35,489 frames · 1920×1080 · 30 fps · H264/AAC.
   </p>
   <video className="ep003-director-review-video" key={movie} controls playsInline preload="metadata"
    src={movie} aria-label="EP003 corrected 10-SHOT full director WIP video"
    onError={()=>setPlaybackError(true)}>Your browser cannot play this MP4.</video>
   {playbackError&&<p role="alert">The protected MP4 could not play. Verify your MediaOS session and refresh.</p>}
  </>}
  <nav className="ep003-director-review-actions" aria-label="Corrected full film actions">
   <button type="button" onClick={()=>setRevision(x=>x+1)}><RefreshCcw size={15} aria-hidden="true"/> Refresh corrected full film</button>
   <a href="#/ep003/full">Open latest official 11-SHOT master</a>
   {movie&&<a href={movie} target="_blank" rel="noopener noreferrer">Open complete MP4</a>}
  </nav>
  <p className="ep003-director-review-caution">Historical ten-shot WIP review is preserved for comparison. The Director approved its shots, and the latest official 11-SHOT full master is available under EP003 / Full. Original saved videos remain immutable.</p>
 </section>;
}
