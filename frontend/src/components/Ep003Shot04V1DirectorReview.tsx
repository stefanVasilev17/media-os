import {useEffect,useState} from 'react';
import {ExternalLink,PlayCircle,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/shot04/v1/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const COMPOSITION='EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE';
const RENDER_KEY='EP003_SHOT04_READ_WRITE_SPLITTING_V1';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

type RecordV1={
  status?:string;renderId?:string;renderKey?:string;compositionId?:string;
  videoUrl?:string;profile?:string;fps?:number;width?:number;height?:number;
  durationInFrames?:number;sizeBytes?:number;directorLocked?:boolean;
};
type State={kind:'CHECKING'|'READY'|'EMPTY';record?:RecordV1;message?:string};

export function Ep003Shot04V1DirectorReview(){
  const [revision,setRevision]=useState(0);
  const [state,setState]=useState<State>({kind:'CHECKING'});
  useEffect(()=>{
    const ctrl=new AbortController();
    setState({kind:'CHECKING'});
    void fetch(ENDPOINT,{cache:'no-store',signal:ctrl.signal})
      .then(async response=>{
        if(!response.ok)throw Error('SHOT04 V1 saved video lookup HTTP '+response.status);
        return response.json() as Promise<RecordV1>;
      })
      .then(record=>{
        if(ctrl.signal.aborted)return;
        if(record.status==='EMPTY'){
          setState({kind:'EMPTY',message:'SHOT04 V1 candidate is not saved yet. The official 3-SHOT Director-LOCKED master above remains available.'});
          return;
        }
        if(record.status!=='READY'||!record.renderId||!UUID.test(record.renderId)||
          record.renderKey!==RENDER_KEY||record.compositionId!==COMPOSITION||
          record.profile!=='REVIEW'||record.width!==1920||record.height!==1080||
          record.fps!==30||!Number.isInteger(record.durationInFrames)||record.durationInFrames<1500||record.durationInFrames>7200||
          record.videoUrl!==PREFIX+record.renderId+'/video'||
          !record.sizeBytes||record.sizeBytes<1000000||record.directorLocked===true){
          setState({kind:'EMPTY',message:'The SHOT04 V1 candidate fails exact saved MP4 quality checks. The existing locked master remains unchanged.'});
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
  return <section className="ep003-director-review" aria-label="EP003 SHOT04 V1 Director review video">
    <header className="ep003-director-review-heading">
      <div>
        <h3><PlayCircle size={21} aria-hidden="true"/> SHOT04 V1 · Director Video Review</h3>
        <p>Read / Write Splitting · Authoritative Primary vs. Suitable Replica Reads</p>
      </div>
      <span className="ep003-director-review-status">V1 · RENDERED CANDIDATE · NOT LOCKED</span>
    </header>
    <p className="ep003-director-review-detail">
      “Who Decides Which Database Gets the Query?” — a continuous Living Architecture shot.
      The existing Primary Database and both small database replicas stay in the same
      visual world. Critical authentication checks follow the authoritative Primary;
      suitable preference reads follow real database query paths to Replica A or B.
      No free-floating Login request packets, no nested boxes, no clipped card copy.
      Original Director-selected Slow Natural voice and exact SHOT03 V4 last-frame
      handoff are preserved. Review the actual MP4 before deciding whether to LOCK.
    </p>
    {state.kind==='CHECKING'&&<p role="status">Checking stored SHOT04 V1 MP4…</p>}
    {state.kind==='EMPTY'&&<p role="status">{state.message}</p>}
    {video&&<video key={video} className="ep003-director-review-video"
      controls playsInline preload="metadata" src={video}
      aria-label="EP003 SHOT04 V1 Primary Database clarity Director review video">
      Your browser cannot play the MP4. Open it in a new tab.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="SHOT04 V1 review actions">
      {video&&<a href={video} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true"/> Open SHOT04 V1 MP4
      </a>}
      <button type="button" onClick={()=>setRevision(x=>x+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh SHOT04 V1
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      SHOT04 V1 is NOT LOCKED. Only the Director may approve it after viewing.
      SHOT01 V2, SHOT02 V4 and SHOT03 V4 remain immutable; the official
      three-shot full-video master is not modified.
    </p>
  </section>;
}
