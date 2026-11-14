import {useEffect,useState} from 'react';
import {ExternalLink,PlayCircle,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/shot05/v1/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-SHOT05-STALE-READ-V1-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT05_STALE_READ_V1';
const LOCKED_RENDER_ID='04b9f55a-7705-4f23-b9f7-a0103e8c955b';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

type RecordV1={
  status?:string;renderId?:string;renderKey?:string;compositionId?:string;
  videoUrl?:string;profile?:string;fps?:number;width?:number;height?:number;
  durationInFrames?:number;sizeBytes?:number;directorLocked?:boolean;
};
type State={kind:'CHECKING'|'READY'|'EMPTY';record?:RecordV1;message?:string};

export function Ep003Shot05V1DirectorReview(){
  const [revision,setRevision]=useState(0);
  const [state,setState]=useState<State>({kind:'CHECKING'});
  useEffect(()=>{
    const ctrl=new AbortController();
    setState({kind:'CHECKING'});
    void fetch(ENDPOINT,{cache:'no-store',signal:ctrl.signal})
      .then(async response=>{
        if(!response.ok)throw Error('SHOT05 V1 saved video lookup HTTP '+response.status);
        return response.json() as Promise<RecordV1>;
      })
      .then(record=>{
        if(ctrl.signal.aborted)return;
        if(record.status==='EMPTY'){
          setState({kind:'EMPTY',message:'The exact Director-LOCKED SHOT05 V1 MP4 could not be found.'});
          return;
        }
        if(record.status!=='READY'||!record.renderId||!UUID.test(record.renderId)||
          record.renderKey!==RENDER_KEY||record.renderId!==LOCKED_RENDER_ID||record.compositionId!==COMPOSITION||
          record.profile!=='REVIEW'||record.width!==1920||record.height!==1080||
          record.fps!==30||typeof record.durationInFrames!=='number'||!Number.isInteger(record.durationInFrames)||record.durationInFrames<1500||record.durationInFrames>7200||
          record.videoUrl!==PREFIX+record.renderId+'/video'||
          !record.sizeBytes||record.sizeBytes<1000000){
          setState({kind:'EMPTY',message:'The saved SHOT05 V1 MP4 does not match the pinned Director-LOCKED render. No fallback.'});
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
  return <section className="ep003-director-review" aria-label="EP003 SHOT05 V1 Director review video">
    <header className="ep003-director-review-heading">
      <div>
        <h3><PlayCircle size={21} aria-hidden="true"/> SHOT05 V1 · Director-LOCKED Source</h3>
        <p>Replication Lag · Stale Reads · Eventual Consistency</p>
      </div>
      <span className="ep003-director-review-status">V1 · DIRECTOR-LOCKED · OFFICIAL MASTER</span>
    </header>
    <p className="ep003-director-review-detail">
      “The Replica That Gives the Wrong Answer” — the same continuous Living
      Architecture World from SHOT04. Primary writes the locked account status,
      while Replica A temporarily exposes an older version. The read/write paths
      remain physically attached to the existing architecture; an unsafe replica
      security check is only illustrated as a hypothetical path, not as a new
      free-moving Login request particle. Original Director-selected Slow Natural
      voice and the exact final frame of SHOT04 V1 are preserved.
      Director approved this MP4 after reviewing all five SHOTs together.
      All four real transitions passed frame-accurate QA.
    </p>
    {state.kind==='CHECKING'&&<p role="status">Checking stored SHOT05 V1 MP4…</p>}
    {state.kind==='EMPTY'&&<p role="status">{state.message}</p>}
    {video&&<video key={video} className="ep003-director-review-video"
      controls playsInline preload="metadata" src={video}
      aria-label="EP003 SHOT05 V1 Primary Database clarity Director review video">
      Your browser cannot play the MP4. Open it in a new tab.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="SHOT05 V1 review actions">
      {video&&<a href={video} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true"/> Open SHOT05 V1 MP4
      </a>}
      <button type="button" onClick={()=>setRevision(x=>x+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT05 V1
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      SHOT05 V1 is now Director-LOCKED and is the fifth immutable source in
      the official cumulative master. SHOT01 V2, SHOT02 V4, SHOT03 V4 and SHOT04 V1
      remain unchanged.
    </p>
  </section>;
}
