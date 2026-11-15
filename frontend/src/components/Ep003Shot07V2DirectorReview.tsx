import {useEffect,useState} from 'react';
import {CheckCircle2,PlayCircle,RefreshCcw} from 'lucide-react';

const RENDER_ID='4b8e414f-a74f-4e38-b78c-bd8a3101062a';
const API='/api/v1/remotion/renders/'+RENDER_ID;
const VIDEO=API+'/video';
const COMPOSITION='EP003-SHOT07-BOTTLENECK-V2-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT07_BOTTLENECK_V2';
const MP4_SIZE=16455606;
const MP4_FRAMES=3476;

type Render={
  renderId?:string;renderKey?:string;compositionId?:string;
  status?:string;videoUrl?:string;profile?:string;
  width?:number;height?:number;fps?:number;durationInFrames?:number;sizeBytes?:number;
  directorLocked?:boolean;
};
type Review={kind:'CHECKING'|'READY'|'EMPTY';detail:string};

export function Ep003Shot07V2DirectorReview(){
  const [revision,setRevision]=useState(0);
  const [review,setReview]=useState<Review>({kind:'CHECKING',detail:''});
  const [playbackError,setPlaybackError]=useState(false);

  useEffect(()=>{
    const ctrl=new AbortController();
    setReview({kind:'CHECKING',detail:''});
    setPlaybackError(false);
    void fetch(API,{method:'GET',credentials:'same-origin',cache:'no-store',signal:ctrl.signal})
      .then(async response=>{
        if(response.status===401||response.status===403)
          throw Error('MediaOS session required. Sign in on this same domain, then refresh the review.');
        if(!response.ok)throw Error('Saved SHOT07 V2 lookup returned HTTP '+response.status);
        return response.json() as Promise<Render>;
      })
      .then(data=>{
        if(ctrl.signal.aborted)return;
        if(data.status!=='READY'||data.renderId!==RENDER_ID||
          data.renderKey!==RENDER_KEY||data.compositionId!==COMPOSITION||
          data.profile!=='REVIEW'||data.width!==1920||data.height!==1080||
          data.fps!==30||data.durationInFrames!==MP4_FRAMES||
          data.sizeBytes!==MP4_SIZE||data.videoUrl!==VIDEO||
          data.directorLocked===true){
          setReview({kind:'EMPTY',
            detail:'Stored SHOT07 V2 does not match the exact verified MP4. No fallback or substitution.'});
          return;
        }
        setReview({kind:'READY',detail:''});
      })
      .catch(error=>{
        if(!ctrl.signal.aborted)setReview({kind:'EMPTY',
          detail:error instanceof Error?error.message:String(error)});
      });
    return ()=>ctrl.abort();
  },[revision]);

  return <section className="ep003-director-review"
    aria-label="EP003 SHOT07 V2 Director review video">
    <header className="ep003-director-review-heading">
      <div>
        <h3><PlayCircle size={21} aria-hidden="true"/> SHOT07 V2 · Director Video Review</h3>
        <p>Interview glossary · Voice-synced Auth 01–03 focus · 1:55.87</p>
      </div>
      <span className="ep003-director-review-status">V2 · RENDERED · QA PASS · NOT LOCKED</span>
    </header>
    <p className="ep003-director-review-detail">
      This is the exact saved Director candidate (4b8e414f-a74f-4e38-b78c-bd8a3101062a), not a new render.
      The approved Slow Natural voice and 60-frame breathing remain unchanged.
      Technical glossary cards explain READ REPLICA, CRITICAL PATH and THE REAL BOTTLENECK.
      Auth 01–03 rise in sequence when the narration introduces the three servers.
      The first frame is pinned to the original Director-LOCKED SHOT06.
    </p>
    {review.kind==='CHECKING'&&<p role="status">Checking the saved SHOT07 V2 MP4 and session…</p>}
    {review.kind==='EMPTY'&&<p role="alert">{review.detail}</p>}
    {review.kind==='READY'&&<>
      <p className="ep003-director-review-detail">
        <CheckCircle2 size={16} aria-hidden="true"/> Verified 1920×1080 · 30 fps ·
        3476 frames · H264/AAC · SHOT06 seam 43.18 dB.
      </p>
      <video key={VIDEO} className="ep003-director-review-video"
        controls playsInline preload="metadata" src={VIDEO}
        onError={()=>setPlaybackError(true)}
        aria-label="SHOT07 V2 Director review video, original selected voice">
        Your browser cannot play this saved MP4.
      </video>
      {playbackError&&<p role="alert">
        The browser could not load the protected video. Check your MediaOS login
        in this browser and refresh. The stored MP4 is not deleted.
      </p>}
    </>}
    <nav className="ep003-director-review-actions" aria-label="SHOT07 V2 review actions">
      <button type="button" onClick={()=>setRevision(v=>v+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT07 V2
      </button>
      <a href="#/episode-packages/import">Open EP003 episode workspace</a>
    </nav>
    <p className="ep003-director-review-caution">
      SHOT07 V2 is NOT LOCKED. The six Director-LOCKED SHOTs and
      their official continuous master are immutable. This page never
      regenerates voices, re-renders media or changes access permissions.
    </p>
  </section>;
}
