import {useEffect,useState} from 'react';
import {ExternalLink,Film,RefreshCcw,CheckCircle2} from 'lucide-react';

const ENDPOINT='/api/v1/remotion/renders/ep003/cumulative/latest-successful';
const URL_PREFIX='/api/v1/remotion/renders/';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCKED_PREFIX=/^EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_(\d{2})$/;

type Master={status?:string;renderId?:string;renderKey?:string;videoUrl?:string;
  fps?:number;width?:number;height?:number;durationInFrames?:number;sizeBytes?:number};
type FilmState={type:'CHECKING'|'READY'|'EMPTY';message?:string;master?:Master;shotCount?:number};

export function Ep003CumulativeFullVideo(){
  const [revision,setRevision]=useState(0);
  const [film,setFilm]=useState<FilmState>({type:'CHECKING'});

  useEffect(()=>{
    const controller=new AbortController();
    setFilm({type:'CHECKING'});
    void fetch(ENDPOINT,{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error('Full episode lookup: HTTP '+response.status);
        return response.json() as Promise<Master>;
      })
      .then(data=>{
        if(controller.signal.aborted)return;
        if(data.status==='EMPTY'){
          setFilm({type:'EMPTY',message:'No verified sequential full episode is saved yet. Individual locked SHOT videos remain available.'});
          return;
        }
        const match=LOCKED_PREFIX.exec(data.renderKey??'');
        const shotCount=match?Number(match[1]):0;
        if(data.status!=='READY'||!data.renderId||!UUID.test(data.renderId)
          ||!match||shotCount<2||shotCount>30||data.fps!==30
          ||data.width!==1920||data.height!==1080
          ||!Number.isInteger(data.durationInFrames)||!data.durationInFrames
          ||data.durationInFrames<3000
          ||data.videoUrl!==URL_PREFIX+data.renderId+'/video'){
          setFilm({type:'EMPTY',message:'The stored episode does not pass verified contiguous Director-LOCKED video checks.'});
          return;
        }
        setFilm({type:'READY',master:data,shotCount});
      })
      .catch(error=>{
        if(controller.signal.aborted)return;
        setFilm({type:'EMPTY',message:error instanceof Error?error.message:String(error)});
      });
    return ()=>controller.abort();
  },[revision]);

  const master=film.type==='READY'?film.master:undefined;
  const video=master?.videoUrl??null;
  const count=film.shotCount??0;
  const minutes=Math.floor((master?.durationInFrames??0)/30/60);
  const seconds=((master?.durationInFrames??0)/30)%60;
  const sequence=Array.from({length:count},(_,i)=>'SHOT'+String(i+1).padStart(2,'0')).join(' → ');

  return <section className="ep003-director-review" aria-label="EP003 latest continuous full episode">
    <header className="ep003-director-review-heading">
      <div>
        <h3><Film size={22} aria-hidden="true"/> EP003 · Full Video (latest)</h3>
        <p>One living architecture film · every sequential Director-LOCKED SHOT</p>
      </div>
      <span className="ep003-director-review-status">
        {master?'SAVED · '+count+' OF 11 SHOTS · DIRECTOR-LOCKED SOURCES':'EPISODE MASTER'}
      </span>
    </header>
    {master&&<div className="ep003-director-review-detail">
      <p><CheckCircle2 size={16} aria-hidden="true"/> {sequence}</p>
      <p>{minutes}:{seconds.toFixed(2).padStart(5,'0')} · 1920×1080 · 30 fps · H.264/AAC.
        Original Director-approved voices and animation preserved without re-rendering the source SHOTs.</p>
      <p>When a new consecutive SHOT is Director-LOCKED, a fresh immutable cumulative MP4
        replaces this latest view; previous film versions are retained.</p>
    </div>}
    {film.type==='CHECKING'&&<p role="status">Checking the latest complete EP003 video…</p>}
    {film.type==='EMPTY'&&<p role="status">{film.message}</p>}
    {video&&<video key={video} className="ep003-director-review-video"
      controls playsInline preload="metadata" src={video}
      aria-label="EP003 all Director locked SHOTs in one continuous video">
      Your browser cannot play this MP4. Use Open complete MP4 instead.
    </video>}
    <nav className="ep003-director-review-actions" aria-label="Full EP003 film actions">
      {video&&<a href={video} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={16} aria-hidden="true"/> Open complete MP4
      </a>}
      <button type="button" onClick={()=>setRevision(x=>x+1)}>
        <RefreshCcw size={15} aria-hidden="true"/> Refresh latest full video
      </button>
    </nav>
    <p className="ep003-director-review-caution">
      This player only reads verified saved episode masters. It never generates a voice,
      modifies a locked SHOT, or starts a paid render.
    </p>
  </section>;
}
