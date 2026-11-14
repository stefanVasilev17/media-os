import {useEffect,useState} from 'react';
import {ExternalLink,Film,RefreshCcw} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/cumulative/wip-3shot-v4/latest-successful';
const PREFIX='/api/v1/remotion/renders/';
const KEY='EP003_WIP_LOCKED_01_02_PLUS_SHOT03_WORDING_V4_03';
const COMPOSITION='EP003-CUMULATIVE-WIP-REVIEW';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
type Wip={status?:string;renderId?:string;renderKey?:string;compositionId?:string;
  videoUrl?:string;profile?:string;width?:number;height?:number;fps?:number;
  durationInFrames?:number;sizeBytes?:number;directorLocked?:boolean};
type WipState={state:'CHECKING'|'READY'|'EMPTY';message?:string;video?:Wip};

export function Ep003Shot03V4ThreeShotWipFilm(){
  const [revision,setRevision]=useState(0);
  const [result,setResult]=useState<WipState>({state:'CHECKING'});
  useEffect(()=>{
    const controller=new AbortController();
    setResult({state:'CHECKING'});
    void fetch(ENDPOINT,{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error('EP003 WIP 3-shot review HTTP '+response.status);
        return response.json() as Promise<Wip>;
      }).then(info=>{
        if(controller.signal.aborted)return;
        if(info.status==='EMPTY'){
          setResult({state:'EMPTY',message:'The 3-shot WIP has not passed real MP4 and seam checks yet. The official 2-shot Director-LOCKED master above remains unchanged.'});
          return;
        }
        if(info.status!=='READY'||!info.renderId||!UUID.test(info.renderId)||
          info.renderKey!==KEY||info.compositionId!==COMPOSITION||
          info.profile!=='REVIEW'||info.width!==1920||info.height!==1080||
          info.fps!==30||info.durationInFrames!==9037||
          info.videoUrl!==PREFIX+info.renderId+'/video'||
          !info.sizeBytes||info.sizeBytes<2000000||info.directorLocked===true){
          setResult({state:'EMPTY',message:'The full WIP has not passed the exact 3-shot video contract. No earlier film is substituted.'});
          return;
        }
        setResult({state:'READY',video:info});
      }).catch(error=>{
        if(!controller.signal.aborted)setResult({state:'EMPTY',message:error instanceof Error?error.message:String(error)});
      });
    return ()=>controller.abort();
  },[revision]);

  const video=result.state==='READY'?result.video?.videoUrl:null;
  return <section className="ep003-director-review"
    aria-label="EP003 three-shot WIP full film for SHOT01 SHOT02 SHOT03 V4">
    <header className="ep003-director-review-heading">
      <div>
        <h3><Film size={22} aria-hidden="true"/> EP003 · Full Video WIP — 3 SHOTs</h3>
        <p>SHOT01 V2 → SHOT02 V4 → SHOT03 V4 · Watch both real transitions</p>
      </div>
      <span className="ep003-director-review-status">WIP · NOT LOCKED · DIRECTOR REVIEW</span>
    </header>
    <div className="ep003-director-review-detail">
      <p>5:01.23 · 1920×1080 · 30 fps · H.264/AAC · original selected Slow Natural voices.
        The source SHOTs are concatenated without video or voice re-generation.</p>
      <p>Transition 01 → 02: <strong>1:23.80</strong>. Transition 02 → 03:
        <strong> 3:18.57</strong>. This video contains exactly the two approved locked SHOTs
        followed by the unapproved SHOT03 V4 wording correction.</p>
      <p>SHOT03's card says “Accepts writes. Replica copy changes”. This film is a
        separate WIP review and never replaces the official 2-shot Director-LOCKED master.</p>
    </div>
    {result.state==='CHECKING'&&<p role="status">Checking the saved three-shot WIP MP4 and both validated joins…</p>}
    {result.state==='EMPTY'&&<p role="status">{result.message}</p>}
    {video&&<video key={video} className="ep003-director-review-video"
      controls playsInline preload="metadata" src={video}
      aria-label="EP003 WIP full film SHOT01 V2 plus SHOT02 V4 plus SHOT03 V4">
      Your browser cannot play this MP4. Use Open WIP MP4 instead.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="Three-shot WIP controls">
      {video&&<a href={video} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true"/> Open full three-shot WIP MP4
      </a>}
      <button type="button" onClick={()=>setRevision(x=>x+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh WIP video
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      Two SHOTs are Director-LOCKED, SHOT03 V4 is NOT LOCKED. The WIP MP4 is
      a separate saved artifact for transition review. No render, voice generation,
      or automatic promotion starts from this panel.
    </p>
  </section>;
}
