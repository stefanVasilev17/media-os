import {useEffect,useState} from 'react';
import {ExternalLink,PlayCircle,RefreshCcw} from 'lucide-react';

const RENDER_ID='4d73e27a-94bb-497a-8b11-c934962917b2';
const RENDER_ENDPOINT='/api/v1/remotion/renders/'+RENDER_ID;
const VIDEO_URL=RENDER_ENDPOINT+'/video';
const RENDER_KEY='EP003_SHOT03_PRIMARY_REPLICAS_V1';
const COMPOSITION='EP003-SHOT03-PRIMARY-REPLICAS-V1-DIRECTOR-CANDIDATE';

type ReviewInfo={
  status?:string;renderId?:string;renderKey?:string;compositionId?:string;
  profile?:string;width?:number;height?:number;fps?:number;
  durationInFrames?:number;videoUrl?:string;sizeBytes?:number;directorLocked?:boolean;
};
type ReviewState={kind:'LOADING'|'READY'|'ERROR';message?:string};

export function Ep003Shot03DirectorReview(){
  const [revision,setRevision]=useState(0);
  const [state,setState]=useState<ReviewState>({kind:'LOADING'});

  useEffect(()=>{
    const controller=new AbortController();
    setState({kind:'LOADING'});
    void fetch(RENDER_ENDPOINT,{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error('SHOT03 video lookup HTTP '+response.status);
        return response.json() as Promise<ReviewInfo>;
      })
      .then(record=>{
        if(controller.signal.aborted)return;
        if(record.status!=='READY'||record.renderId!==RENDER_ID||
          record.renderKey!==RENDER_KEY||record.compositionId!==COMPOSITION||
          record.profile!=='REVIEW'||record.width!==1920||record.height!==1080||
          record.fps!==30||record.durationInFrames!==3080||
          record.videoUrl!==VIDEO_URL||!record.sizeBytes||record.sizeBytes<1000000||
          record.directorLocked===true){
          setState({kind:'ERROR',message:
            'Stored SHOT03 V1 does not match the exact completed, unapproved Director review MP4. No fallback to another render is allowed.'});
          return;
        }
        setState({kind:'READY'});
      })
      .catch(error=>{
        if(controller.signal.aborted)return;
        setState({kind:'ERROR',message:error instanceof Error?error.message:String(error)});
      });
    return ()=>controller.abort();
  },[revision]);

  return <section className="ep003-director-review"
    aria-label="EP003 SHOT03 V1 Director review candidate">
    <header className="ep003-director-review-heading">
      <div>
        <h3><PlayCircle size={21} aria-hidden="true"/> SHOT03 · Director Video Review</h3>
        <p>One Primary. Two Replicas.</p>
      </div>
      <span className="ep003-director-review-status">V1 · RENDERED · NOT LOCKED</span>
    </header>
    <p className="ep003-director-review-detail">
      Original selected Slow Natural voice · 1:42.67 · 1920×1080 · 30 fps · 3,080 frames.
      Real last-frame handoff from Director-LOCKED SHOT02 V4. Two seconds of moving
      architecture before narration. First-frame continuity passed 44.21 dB PSNR;
      early motion passed 23/23 decoded steps. Watch the cut and visual layout before
      approving. This panel never creates a new voice or starts a render.
    </p>
    {state.kind==='LOADING'&&<p role="status">Checking the saved SHOT03 V1 MP4…</p>}
    {state.kind==='ERROR'&&<p role="alert">{state.message}</p>}
    {state.kind==='READY'&&<video key={RENDER_ID}
      className="ep003-director-review-video" controls playsInline preload="metadata"
      src={VIDEO_URL} aria-label="EP003 SHOT03 V1 Primary and two replicas Director review MP4">
      Your browser cannot play this MP4. Use Open SHOT03 MP4 below.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="SHOT03 V1 review actions">
      {state.kind==='READY'&&<a href={VIDEO_URL} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true"/> Open SHOT03 V1 MP4
      </a>}
      <button type="button" onClick={()=>setRevision(value=>value+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT03
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      SHOT01 V2 and SHOT02 V4 remain Director-LOCKED. SHOT03 V1 is review only.
      Only the Director can approve and LOCK it. No automatic master replacement.
    </p>
  </section>;
}
