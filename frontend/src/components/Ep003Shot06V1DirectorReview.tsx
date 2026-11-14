import {useEffect,useState} from 'react';
import {ExternalLink,PlayCircle,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/shot06/v1/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-SHOT06-CORRECTNESS-V1-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT06_CORRECTNESS_V1';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

type RecordV1={
  status?:string;renderId?:string;renderKey?:string;compositionId?:string;
  videoUrl?:string;profile?:string;fps?:number;width?:number;height?:number;
  durationInFrames?:number;sizeBytes?:number;directorLocked?:boolean;
};
type State={kind:'CHECKING'|'READY'|'EMPTY';record?:RecordV1;message?:string};

export function Ep003Shot06V1DirectorReview(){
  const [revision,setRevision]=useState(0);
  const [state,setState]=useState<State>({kind:'CHECKING'});
  useEffect(()=>{
    const ctrl=new AbortController();
    setState({kind:'CHECKING'});
    void fetch(ENDPOINT,{cache:'no-store',signal:ctrl.signal})
      .then(async response=>{
        if(!response.ok)throw Error('SHOT06 V1 saved video lookup HTTP '+response.status);
        return response.json() as Promise<RecordV1>;
      })
      .then(record=>{
        if(ctrl.signal.aborted)return;
        if(record.status==='EMPTY'){
          setState({kind:'EMPTY',message:'SHOT06 V1 candidate is not saved yet. The official 5-SHOT Director-LOCKED master is unchanged.'});
          return;
        }
        if(record.status!=='READY'||!record.renderId||!UUID.test(record.renderId)||
          record.renderKey!==RENDER_KEY||record.compositionId!==COMPOSITION||
          record.profile!=='REVIEW'||record.width!==1920||record.height!==1080||
          record.fps!==30||typeof record.durationInFrames!=='number'||!Number.isInteger(record.durationInFrames)||record.durationInFrames<1500||record.durationInFrames>7200||
          record.videoUrl!==PREFIX+record.renderId+'/video'||
          !record.sizeBytes||record.sizeBytes<1000000||record.directorLocked===true){
          setState({kind:'EMPTY',message:'SHOT06 V1 does not pass the saved 1080p MP4 review contract. The official master remains unchanged.'});
          return;
        }
        setState({kind:'READY',record});
      })
      .catch(error=>{
        if(!ctrl.signal.aborted)setState({kind:'EMPTY',message:error instanceof Error?error.message:String(error)});
      });
    return ()=>ctrl.abort();
  },[revision]);

  const video=state.kind==='READY'?state.record?.videoUrl:null;
  return <section className="ep003-director-review" aria-label="EP003 SHOT06 V1 Director review video">
    <header className="ep003-director-review-heading">
      <div>
        <h3><PlayCircle size={21} aria-hidden="true"/> SHOT06 V1 · Director Video Review</h3>
        <p>Consistency Guarantees · Version Checks · Fail Closed</p>
      </div>
      <span className="ep003-director-review-status">V1 · RENDERED CANDIDATE · NOT LOCKED</span>
    </header>
    <p className="ep003-director-review-detail">
      “Correctness Before Speed” — an uninterrupted continuation of the same Living
      Architecture World. Exact SHOT05 V1 final decoded frame and inherited camera,
      Primary Database, Replica A/B cylinders and physical request/replication paths.
      The narrative compares consistency requirements, verified security reads,
      version checks, authoritative fallback and fail-closed authentication.
      All text remains content-fit; there are no nested containers or stray request dots.
      Original Director-selected Slow Natural narration, no TTS regeneration.
    </p>
    {state.kind==='CHECKING'&&<p role="status">Checking stored SHOT06 V1 MP4…</p>}
    {state.kind==='EMPTY'&&<p role="status">{state.message}</p>}
    {video&&<video key={video} className="ep003-director-review-video"
      controls playsInline preload="metadata" src={video}
      aria-label="EP003 SHOT06 V1 Primary Database clarity Director review video">
      Your browser cannot play the MP4. Open it in a new tab.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="SHOT06 V1 review actions">
      {video&&<a href={video} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true"/> Open SHOT06 V1 MP4
      </a>}
      <button type="button" onClick={()=>setRevision(x=>x+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT06 V1
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      SHOT06 V1 is NOT LOCKED. The Director alone may approve the actual MP4.
      SHOT01 V2, SHOT02 V4, SHOT03 V4, SHOT04 V1 and SHOT05 V1 remain
      immutable in the official five-shot full-video master.
    </p>
  </section>;
}
