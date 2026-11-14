import {useEffect,useState} from 'react';
import {ExternalLink,PlayCircle,RefreshCcw} from 'lucide-react';

const LATEST_ENDPOINT='/api/v1/remotion/renders/ep003/shot02/latest-successful';
const URL_PREFIX='/api/v1/remotion/renders/';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ReviewStatus='CHECKING'|'READY'|'UNAVAILABLE';
type RenderInfo={
  status?:string;
  renderId?:string;
  renderKey?:string;
  directorLocked?:boolean;
  width?:number;
  height?:number;
  fps?:number;
  durationInFrames?:number;
  videoUrl?:string;
};

export function Ep003Shot02DirectorReview(){
  const [status,setStatus]=useState<ReviewStatus>('CHECKING');
  const [message,setMessage]=useState('');
  const [revision,setRevision]=useState(0);
  const [videoUrl,setVideoUrl]=useState<string|null>(null);
  const [version,setVersion]=useState<'V1'|'V2'|'V3'|'V4'|null>(null);
  const [directorLocked,setDirectorLocked]=useState(false);

  useEffect(()=>{
    const controller=new AbortController();
    setStatus('CHECKING');
    setVideoUrl(null);
    setVersion(null);
    setDirectorLocked(false);
    setMessage('');
    void fetch(LATEST_ENDPOINT,{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error('Render lookup returned HTTP '+response.status);
        return response.json() as Promise<RenderInfo>;
      })
      .then(render=>{
        if(controller.signal.aborted)return;
        if(render.status!=='READY'||!render.renderId||!UUID.test(render.renderId)
          ||!['EP003_SHOT02_V1','EP003_SHOT02_TERMS_V2','EP003_SHOT02_TERMS_V3','EP003_SHOT02_MOTION_V4'].includes(render.renderKey??'')){
          setStatus('UNAVAILABLE');
          setMessage('The EP003 SHOT02 render is not yet ready. No completed Director MP4 was found.');
          return;
        }
        const expected=URL_PREFIX+render.renderId+'/video';
        if(render.videoUrl!==expected||render.width!==1920||render.height!==1080
          ||render.fps!==30||!render.durationInFrames||render.durationInFrames<200){
          setStatus('UNAVAILABLE');
          setMessage('The stored SHOT02 media does not match the verified review profile.');
          return;
        }
        setVideoUrl(expected);
        setVersion(render.renderKey==='EP003_SHOT02_MOTION_V4'?'V4':
          render.renderKey==='EP003_SHOT02_TERMS_V3'?'V3':
          render.renderKey==='EP003_SHOT02_TERMS_V2'?'V2':'V1');
        setDirectorLocked(render.directorLocked===true);
        setStatus('READY');
      })
      .catch(error=>{
        if(controller.signal.aborted)return;
        setStatus('UNAVAILABLE');
        setMessage(error instanceof Error?error.message:'Unable to verify the saved video.');
      });
    return ()=>controller.abort();
  },[revision]);

  return <section className="ep003-director-review" aria-label="EP003 SHOT02 Director review video">
    <header className="ep003-director-review-heading">
      <div>
        <h3><PlayCircle size={21} aria-hidden="true"/> SHOT02 · Director Video Review</h3>
        <p>Find the Real Bottleneck.</p>
      </div>
      <span className="ep003-director-review-status">
        {version==='V4'?(directorLocked?'V4 · SMOOTH CUT · DIRECTOR LOCKED':'V4 · DIRECTOR REVIEW'):
          version==='V3'?(directorLocked
            ?'V3 · LATENCY / THROUGHPUT · 2s LEAD · DIRECTOR LOCKED'
            :'V3 · VERIFY DIRECTOR LOCK'):
          version==='V2'?'V2 · TECHNICAL TERMS ONLY · PRIOR REVIEW':
          version==='V1'?'V1 · PRIOR REVIEW · NOT LOCKED':
          'DIRECTOR REVIEW · NOT LOCKED'}
      </span>
    </header>
    <p className="ep003-director-review-detail">
      Original Director-LOCKED Slow Natural SHOT02 narration · 1920×1080 · 30 fps.
      Full P0 continuity from SHOT01 V2 last encoded frame.
      {version==='V4'?' No static predecessor overlay after frame zero. The live architecture moves from the first frames; the two-second voice lead is preserved.':
        version==='V3'?' The visual world moves 2 seconds before the narration. Latency remains above Throughput throughout their comparison.':
        version==='V2'?' Earlier glossary-only cut; this is not the latest Director revision.':
        version==='V1'?' This is the previous version with general information cards.':''}
      No generation is triggered by this panel.
    </p>
    {status==='CHECKING'&&<p role="status">Checking the latest saved SHOT02 MP4…</p>}
    {status==='UNAVAILABLE'&&<p role="alert">{message}</p>}
    {status==='READY'&&videoUrl&&<video key={videoUrl}
      className="ep003-director-review-video" controls playsInline preload="metadata"
      src={videoUrl} aria-label="EP003 SHOT02 latest Director review MP4">
      Your browser cannot play this MP4. Use the Open MP4 link below.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="SHOT02 review actions">
      {status==='READY'&&videoUrl&&
        <a href={videoUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} aria-hidden="true"/> Open MP4 in new tab
        </a>}
      <button type="button" onClick={()=>setRevision(value=>value+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh render status
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      {version==='V4'&&directorLocked
        ?'The Director explicitly LOCKED this exact SHOT02 V4 MP4. SHOT03 V1 inherits its real final encoded frame 3442.'
        :'Earlier revisions are preserved for historical comparison; only V4 is the current Director-LOCKED SHOT02.'}
      {' '}This player never creates a voice, edits media, or triggers rendering.
    </p>
  </section>;
}
