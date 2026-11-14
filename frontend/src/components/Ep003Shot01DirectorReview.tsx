import {useEffect,useState} from 'react';
import {ExternalLink,PlayCircle,RefreshCcw} from 'lucide-react';

const SHOT01_RENDER_ID='078e3f41-5da0-45c2-8b6b-007e004fc491';
const RENDER_ENDPOINT='/api/v1/remotion/renders/'+SHOT01_RENDER_ID;
const VIDEO_ENDPOINT=RENDER_ENDPOINT+'/video';

type ReviewStatus='CHECKING'|'READY'|'UNAVAILABLE';
type RenderInfo={
  status?:string;
  renderId?:string;
  width?:number;
  height?:number;
  fps?:number;
  durationInFrames?:number;
  videoUrl?:string;
};

export function Ep003Shot01DirectorReview(){
  const [status,setStatus]=useState<ReviewStatus>('CHECKING');
  const [message,setMessage]=useState('');
  const [revision,setRevision]=useState(0);

  useEffect(()=>{
    const controller=new AbortController();
    setStatus('CHECKING');
    setMessage('');
    void fetch(RENDER_ENDPOINT,{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw new Error('Render lookup returned HTTP '+response.status);
        return response.json() as Promise<RenderInfo>;
      })
      .then(render=>{
        if(controller.signal.aborted)return;
        const match=render.renderId===undefined||render.renderId===SHOT01_RENDER_ID;
        if(render.status!=='SUCCEEDED'||!match){
          setStatus('UNAVAILABLE');
          setMessage('SHOT01 review MP4 is not currently confirmed available in MediaOS.');
          return;
        }
        if(render.width!==undefined&&render.width!==1920||
           render.height!==undefined&&render.height!==1080){
          setStatus('UNAVAILABLE');
          setMessage('The SHOT01 video dimensions differ from the pinned Director review render.');
          return;
        }
        setStatus('READY');
      })
      .catch(error=>{
        if(controller.signal.aborted)return;
        setStatus('UNAVAILABLE');
        setMessage(error instanceof Error?error.message:'Unable to verify the saved video.');
      });
    return ()=>controller.abort();
  },[revision]);

  return <section className="ep003-director-review" aria-label="EP003 SHOT01 Director review video">
    <header className="ep003-director-review-heading">
      <div>
        <h3><PlayCircle size={21} aria-hidden="true"/> SHOT01 · Director Video Review</h3>
        <p>The System Is Stable. But People Still Cannot Log In.</p>
      </div>
      <span className="ep003-director-review-status">RENDERED · NOT LOCKED</span>
    </header>
    <p className="ep003-director-review-detail">
      Original Director-approved Slow Natural narration · 1920×1080 · 30 fps · 1:23.80.
      This is a preserved review candidate, not a new render request.
    </p>
    {status==='CHECKING'&&<p role="status">Checking saved SHOT01 MP4…</p>}
    {status==='UNAVAILABLE'&&<p role="alert">{message}</p>}
    {status==='READY'&&<video className="ep003-director-review-video"
      controls playsInline preload="metadata"
      src={VIDEO_ENDPOINT}
      aria-label="EP003 SHOT01 Director review MP4">
      Your browser cannot play this MP4. Use the Open MP4 link below.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="SHOT01 review actions">
      <a href={VIDEO_ENDPOINT} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true"/> Open MP4 in new tab
      </a>
      <button type="button" onClick={()=>setRevision(value=>value+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh render status
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      Director approval is still required after watching the actual video. This panel
      performs no paid generation, re-render, or automatic visual LOCK.
    </p>
  </section>;
}
