import {useEffect,useState} from 'react';
import {CheckCircle2,PlayCircle,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/shot07/v3/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-SHOT07-BOTTLENECK-V3-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT07_BOTTLENECK_V3';
const ENGINE='EP003_SHOT07_PIN_316d8573072a';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

type RecordV3={
  status?:string;renderId?:string;renderKey?:string;compositionId?:string;
  engineVersion?:string;videoUrl?:string;profile?:string;
  width?:number;height?:number;fps?:number;durationInFrames?:number;
  sizeBytes?:number;directorLocked?:boolean;
};
type Review={kind:'CHECKING'|'READY'|'EMPTY';record?:RecordV3;message?:string};

export function Ep003Shot07V3DirectorReview(){
  const [revision,setRevision]=useState(0);
  const [review,setReview]=useState<Review>({kind:'CHECKING'});
  const [playbackError,setPlaybackError]=useState(false);
  useEffect(()=>{
    const ctrl=new AbortController();
    setReview({kind:'CHECKING'});
    setPlaybackError(false);
    void fetch(ENDPOINT,{method:'GET',credentials:'same-origin',cache:'no-store',signal:ctrl.signal})
      .then(async response=>{
        if(response.status===401||response.status===403)
          throw Error('Sign in to MediaOS on this domain, then refresh the Director review.');
        if(!response.ok)throw Error('SHOT07 V3 video lookup HTTP '+response.status);
        return response.json() as Promise<RecordV3>;
      })
      .then(record=>{
        if(ctrl.signal.aborted)return;
        if(record.status==='EMPTY'){
          setReview({kind:'EMPTY',message:'SHOT07 V3 is still rendering or awaiting verified MP4 storage. No older video is substituted.'});
          return;
        }
        if(record.status!=='READY'||!record.renderId||!UUID.test(record.renderId)||
          record.renderKey!==RENDER_KEY||record.compositionId!==COMPOSITION||
          record.engineVersion!==ENGINE||record.profile!=='REVIEW'||
          record.width!==1920||record.height!==1080||
          record.fps!==30||record.durationInFrames!==3476||
          !record.sizeBytes||record.sizeBytes<1000000||
          record.videoUrl!==PREFIX+record.renderId+'/video'||record.directorLocked===true){
          setReview({kind:'EMPTY',message:'SHOT07 V3 verification failed. No unverified candidate or fallback is shown.'});
          return;
        }
        setReview({kind:'READY',record});
      })
      .catch(error=>{
        if(!ctrl.signal.aborted)setReview({kind:'EMPTY',
          message:error instanceof Error?error.message:String(error)});
      });
    return ()=>ctrl.abort();
  },[revision]);
  const video=review.kind==='READY'?review.record?.videoUrl:undefined;
  return <section className="ep003-director-review"
    aria-label="EP003 SHOT07 V3 Director review video">
    <header className="ep003-director-review-heading">
      <div>
        <h3><PlayCircle size={21} aria-hidden="true"/> SHOT07 V3 · Director Video Review</h3>
        <p>Subtle Auth focus. Voice-cued Primary and two Replicas. Readable glossary.</p>
      </div>
      <span className="ep003-director-review-status">V3 · CANDIDATE · NOT LOCKED</span>
    </header>
    <p className="ep003-director-review-detail">
      Three Auth servers receive a smaller scale effect, keeping the Auth Service
      heading visible. Primary Database and both read replicas receive their own
      voice-synchronized focus. The Read Replica definition uses periods, not semicolons.
      Original Slow Natural selected voice is preserved. The locked six-shot
      master is not changed.
    </p>
    {review.kind==='CHECKING'&&<p role="status">Checking the saved SHOT07 V3 MP4…</p>}
    {review.kind==='EMPTY'&&<p role="status">{review.message}</p>}
    {video&&<>
      <p className="ep003-director-review-detail">
        <CheckCircle2 size={16} aria-hidden="true"/>
        Saved 1920×1080 H264/AAC · 30 fps · 3476 frames · 1:55.87.
      </p>
      <video key={video} className="ep003-director-review-video"
        controls playsInline preload="metadata" src={video}
        onError={()=>setPlaybackError(true)}
        aria-label="SHOT07 V3 corrected Auth and database focus Director review video">
        Your browser cannot play this MP4.
      </video>
      {playbackError&&<p role="alert">
        This video requires a valid MediaOS session on the current domain.
        Sign in and refresh. The stored MP4 is unchanged.
      </p>}
    </>}
    <nav className="ep003-director-review-actions" aria-label="SHOT07 V3 review actions">
      <button type="button" onClick={()=>setRevision(v=>v+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT07 V3
      </button>
      <a href="#/ep003/shot07/v2">Compare previous V2</a>
    </nav>
    <p className="ep003-director-review-caution">
      SHOT07 V3 is NOT LOCKED. The six original Director-LOCKED shots,
      official master, original narration and all old render artifacts
      remain immutable. Director visual approval is required before LOCK.
    </p>
  </section>;
}
