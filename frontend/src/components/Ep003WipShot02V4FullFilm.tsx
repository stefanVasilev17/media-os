import {useEffect,useState} from 'react';
import {Film,RefreshCcw,ExternalLink,AlertCircle} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/cumulative/wip-latest';
const PREFIX='/api/v1/remotion/renders/';
const KEY='EP003_WIP_SHOT01_LOCKED_PLUS_SHOT02_MOTION_V4_02';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
type Result={status?:string;renderId?:string;renderKey?:string;
  videoUrl?:string;durationInFrames?:number;width?:number;height?:number;fps?:number};
type State={kind:'LOADING'|'READY'|'EMPTY';render?:Result;message?:string};

export function Ep003WipShot02V4FullFilm(){
  const [revision,setRevision]=useState(0);
  const [state,setState]=useState<State>({kind:'LOADING'});
  useEffect(()=>{
    const ctrl=new AbortController();
    setState({kind:'LOADING'});
    void fetch(ENDPOINT,{cache:'no-store',signal:ctrl.signal})
      .then(async response=>{
        if(!response.ok)throw Error('WIP film lookup HTTP '+response.status);
        return response.json() as Promise<Result>;
      })
      .then(x=>{
        if(ctrl.signal.aborted)return;
        if(x.status==='EMPTY'){
          setState({kind:'EMPTY',message:'The corrected complete-film WIP review is not saved yet. The locked 2-SHOT film above remains available.'});
          return;
        }
        if(x.status!=='READY'||x.renderKey!==KEY||!x.renderId||!UUID.test(x.renderId)
          ||x.videoUrl!==PREFIX+x.renderId+'/video'
          ||x.width!==1920||x.height!==1080||x.fps!==30
          ||x.durationInFrames!==5957){
          setState({kind:'EMPTY',message:'The WIP film does not pass verified Full-HD 30fps and version checks.'});
          return;
        }
        setState({kind:'READY',render:x});
      })
      .catch(e=>{if(!ctrl.signal.aborted)setState({kind:'EMPTY',message:String(e)});});
    return ()=>ctrl.abort();
  },[revision]);

  const url=state.kind==='READY'?state.render?.videoUrl:undefined;
  return <section className="ep003-director-review"
    aria-label="EP003 full film correction SHOT01 locked plus SHOT02 V4 not locked">
    <header className="ep003-director-review-heading">
      <div>
        <h3><Film size={21} aria-hidden="true"/> EP003 · Full Video WIP — Seam Fix V4</h3>
        <p>Archived WIP comparison of SHOT01 V2 → SHOT02 V4 · V4 is now officially LOCKED</p>
      </div>
      <span className="ep003-director-review-status">HISTORICAL WIP · SUPERSEDED BY LOCKED V4 MASTER</span>
    </header>
    <p className="ep003-director-review-detail">
      This is an older WIP assembly retained for reference. SHOT02 V4 was later approved
      and promoted into the official Director-LOCKED master above. The original V3
      remains an archive. This WIP copy is not a second active master.
    </p>
    {state.kind==='LOADING'&&<p role="status">Checking real WIP MP4…</p>}
    {state.kind==='EMPTY'&&<p role="status"><AlertCircle size={16} aria-hidden="true"/> {state.message}</p>}
    {url&&<video key={url} className="ep003-director-review-video"
      controls playsInline preload="metadata" src={url}
      aria-label="EP003 full-film SHOT01 V2 plus unapproved SHOT02 V4 correction">
      Your browser cannot play this MP4. Use the open MP4 link.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="Full film WIP actions">
      {url&&<a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true"/> Open corrected full film MP4
      </a>}
      <button type="button" onClick={()=>setRevision(x=>x+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh WIP video
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      This review is NEVER automatically approved. Only a separate Director LOCK can
      replace the permanent full-episode master. No paid generation is triggered.
    </p>
  </section>;
}
