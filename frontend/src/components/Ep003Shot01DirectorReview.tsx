import {useEffect,useState} from 'react';
import {ExternalLink,PlayCircle,RefreshCcw} from 'lucide-react';

const LATEST_ENDPOINT='/api/v1/remotion/renders/ep003/shot01/latest-successful';
const URL_PREFIX='/api/v1/remotion/renders/';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ReviewStatus='CHECKING'|'READY'|'UNAVAILABLE';
type RenderInfo={
  status?:string;
  renderId?:string;
  renderKey?:string;
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
  const [videoUrl,setVideoUrl]=useState<string|null>(null);
  const [renderKey,setRenderKey]=useState('');

  useEffect(()=>{
    const controller=new AbortController();
    setStatus('CHECKING');
    setVideoUrl(null);
    setRenderKey('');
    setMessage('');
    void fetch(LATEST_ENDPOINT,{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error('Render lookup returned HTTP '+response.status);
        return response.json() as Promise<RenderInfo>;
      })
      .then(render=>{
        if(controller.signal.aborted)return;
        if(render.status!=='READY'||!render.renderId||!UUID.test(render.renderId)
          ||!['EP003_SHOT01_V1','EP003_SHOT01_V2'].includes(render.renderKey??'')){
          setStatus('UNAVAILABLE');
          setMessage('No verified completed EP003 SHOT01 Director MP4 is available yet.');
          return;
        }
        const expected=URL_PREFIX+render.renderId+'/video';
        if(render.videoUrl!==expected||render.width!==1920||render.height!==1080
          ||render.fps!==30||!render.durationInFrames||render.durationInFrames<200){
          setStatus('UNAVAILABLE');
          setMessage('The stored SHOT01 media does not match the verified review profile.');
          return;
        }
        setVideoUrl(expected);
        setRenderKey(render.renderKey??'');
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
      {renderKey==='EP003_SHOT01_V2'
        ?' V2: corrected readable on-screen text.'
        :' Latest stored Director review candidate.'}
      No new render or voice generation is triggered by opening this panel.
    </p>
    {status==='CHECKING'&&<p role="status">Checking the latest saved SHOT01 MP4…</p>}
    {status==='UNAVAILABLE'&&<p role="alert">{message}</p>}
    {status==='READY'&&videoUrl&&<video key={videoUrl}
      className="ep003-director-review-video" controls playsInline preload="metadata"
      src={videoUrl} aria-label="EP003 SHOT01 latest Director review MP4">
      Your browser cannot play this MP4. Use the Open MP4 link below.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="SHOT01 review actions">
      {status==='READY'&&videoUrl&&
        <a href={videoUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} aria-hidden="true"/> Open MP4 in new tab
        </a>}
      <button type="button" onClick={()=>setRevision(value=>value+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh render status
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      Director approval is required after watching the actual video. This panel performs no
      paid generation, re-render or automatic visual LOCK.
    </p>
  </section>;
}
