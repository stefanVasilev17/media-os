import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,FileJson2,Upload,RotateCcw} from 'lucide-react';
import '../styles/episodePreparationQuiet.css';
import '../styles/episodePackageImport.css';
import {EpisodePackageVoiceStudioPanel} from '../components/EpisodePackageVoiceStudioPanel';
import {EpisodeVoiceReadinessPanel} from '../components/EpisodeVoiceReadinessPanel';
import {EpisodeAiAuthorizationPanel} from '../components/EpisodeAiAuthorizationPanel';
import {EpisodeMultiShotExecutionPanel} from '../components/EpisodeMultiShotExecutionPanel';
import {EpisodeCodexCloudPanel} from '../components/EpisodeCodexCloudPanel';
import {EpisodeFactoryProductionPanel} from '../components/EpisodeFactoryProductionPanel';
import {Ep003Shot01DirectorReview} from '../components/Ep003Shot01DirectorReview';
import {Ep003Shot02DirectorReview} from '../components/Ep003Shot02DirectorReview';
import {Ep003Shot03DirectorReview} from '../components/Ep003Shot03DirectorReview';
import {Ep003Shot03V2DirectorReview} from '../components/Ep003Shot03V2DirectorReview';
import {Ep003Shot03V3DirectorReview} from '../components/Ep003Shot03V3DirectorReview';
import {Ep003Shot03V4DirectorReview} from '../components/Ep003Shot03V4DirectorReview';
import {Ep003Shot04V1DirectorReview} from '../components/Ep003Shot04V1DirectorReview';
import {Ep003Shot05V1DirectorReview} from '../components/Ep003Shot05V1DirectorReview';
import {Ep003Shot06V1DirectorReview} from '../components/Ep003Shot06V1DirectorReview';
import {Ep003Shot07V1DirectorReview} from '../components/Ep003Shot07V1DirectorReview';
import {Ep003Shot07V2DirectorReview} from '../components/Ep003Shot07V2DirectorReview';
import {Ep003Shot07V3DirectorReview} from '../components/Ep003Shot07V3DirectorReview';
import {Ep003Shot08V1DirectorReview} from '../components/Ep003Shot08V1DirectorReview';
import {Ep003Shot08V2DirectorReview} from '../components/Ep003Shot08V2DirectorReview';
import {Ep003Shot09V1DirectorReview} from '../components/Ep003Shot09V1DirectorReview';
import {Ep003Shot08V3DirectorReview} from '../components/Ep003Shot08V3DirectorReview';
import {Ep003Shot09V2DirectorReview} from '../components/Ep003Shot09V2DirectorReview';
import {Ep003Shot10V1DirectorReview} from '../components/Ep003Shot10V1DirectorReview';
import {Ep003Shot08V4DirectorReview} from '../components/Ep003Shot08V4DirectorReview';
import {Ep003Shot09V3DirectorReview} from '../components/Ep003Shot09V3DirectorReview';
import {Ep003CumulativeFullVideo} from '../components/Ep003CumulativeFullVideo';
import {Ep003Shot11V1DirectorReview} from '../components/Ep003Shot11V1DirectorReview';

type Shot={shotKey:string;title:string;narration:string;voiceDirection:string;visualStory:unknown;voiceTaskStatus:string};
type Imported={packageId:string;episodeKey:string;title:string;status:string;shotCount:number;beatCount:number;sourceSha256:string;shots:Shot[]};
type Entry={packageId:string;episodeKey:string;title:string;status:string;shotCount:number;beatCount:number};
type Preview={raw:string;hash:string;title:string;episodeKey:string;shots:number;beats:number};
const BASE='/api/v1/episode-packages';

async function json<T>(response:Response):Promise<T>{
  if(!response.ok)throw Error('MediaOS HTTP '+response.status+': '+(await response.text()).slice(0,300));
  return response.json() as Promise<T>;
}

export function EpisodePackageImportPage(){
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState<Preview|null>(null);
  const [confirmed,setConfirmed]=useState(false);
  const [saved,setSaved]=useState<Entry[]>([]);
  const [details,setDetails]=useState<Imported|null>(null);
  const [activeVoiceShot,setActiveVoiceShot]=useState<string|null>(null);
  const [readinessRefresh,setReadinessRefresh]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const requestId=useRef<string|null>(null);
  const inFlight=useRef(false);

  async function refresh(){setSaved(await json<Entry[]>(await fetch(BASE,{cache:'no-store'})));}
  useEffect(()=>{
    if(window.location.hash.startsWith('#/episode-packages/import?ep003=1')){
      setBusy(true);
      void fetch(BASE+'/prepare-ep003',{
        method:'POST',headers:{'Content-Type':'application/json'},body:'{}'
      }).then(json<Imported>).then(episode=>{
        setDetails(episode);
        setActiveVoiceShot('SHOT01');
        setNotice('EP003 prepared: 11 Director-locked voice SHOTs. Generate Slow Intake one SHOT at a time; paid calls require your approval.');
        return refresh();
      }).catch(e=>setError(String(e))).finally(()=>setBusy(false));
    }else{void refresh().catch(e=>setError(String(e)));}
  },[]);

  async function choose(next:File|null){
    setFile(next);setPreview(null);setConfirmed(false);setError('');setNotice('');requestId.current=null;
    if(!next)return;
    if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,139}\.json$/.test(next.name) ||
      next.name.length>140 || next.size===0 || next.size>512*1024){
      setError('Use a simple .json file name and a file smaller than 512 KiB.');return;
    }
    try{
      const raw=await next.text();
      const digest=await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
      const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
      const data=JSON.parse(raw) as {schemaVersion?:string;episode?:{title?:string;episodeKey?:string};
        shots?:Array<{visualBeats?:unknown[]}>};
      if(data.schemaVersion!=='mediaos.episode-package.v1' || !data.episode?.title ||
        !data.episode.episodeKey || !Array.isArray(data.shots))throw Error('Not a v1 Episode Package.');
      setPreview({raw,hash,title:data.episode.title,episodeKey:data.episode.episodeKey,
        shots:data.shots.length,beats:data.shots.reduce((sum,x)=>sum+(x.visualBeats?.length??0),0)});
    }catch(e){setError(String(e));}
  }

  async function importPackage(){
    if(!file||!preview||!confirmed||busy||inFlight.current)return;
    if(!window.confirm('Import '+preview.episodeKey+' and prepare '+preview.shots+
      ' PENDING_VOICE tasks? No OpenAI, ElevenLabs or render will run.'))return;
    const id=requestId.current??window.crypto.randomUUID();
    requestId.current=id;inFlight.current=true;setBusy(true);setError('');
    try{
      const result=await json<Imported>(await fetch(BASE+'/import',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({requestId:id,fileName:file.name,sourceText:preview.raw,
          expectedSha256:preview.hash,confirmSourceImport:true}),
      }));
      requestId.current=null;setDetails(result);setActiveVoiceShot(null);setPreview(null);setFile(null);setConfirmed(false);
      setNotice(result.shotCount+' SHOT source records and voice tasks were stored with no paid API calls.');
      await refresh();
    }catch(e){setError(String(e)+' Retry the same file to reuse the pending request ID.');}
    finally{inFlight.current=false;setBusy(false);}
  }

  async function show(id:string,preserveOpenVoice=false){
    try{
      setDetails(await json<Imported>(await fetch(BASE+'/'+encodeURIComponent(id),{cache:'no-store'})));
      if(!preserveOpenVoice)setActiveVoiceShot(null);
    }catch(e){setError(String(e));}
  }

  return <main className="media-os-page episode-hub episode-preparation episode-package-import">
    <nav className="episode-preparation-nav"><button type="button"
      onClick={()=>{window.location.hash='#/episodes';}}><ArrowLeft size={17}/> Episodes</button></nav>
    <header className="episode-preparation-header">
      <h1>Import Episode Package</h1>
      <p>Upload one Director-approved JSON file containing the complete script and visual story.
        All SHOT and voice preparation tasks are created together. Import makes no paid calls.</p>
    </header>
    {error&&<p role="alert" className="episode-hub-error">{error}</p>}
    {notice&&<p role="status" className="episode-package-notice">{notice}</p>}
    <section className="episode-package-panel">
      <h2><FileJson2 size={22}/> New source file</h2>
      <label htmlFor="episode-package-file">Episode Package v1 (.json, up to 512 KiB)</label>
      <input id="episode-package-file" type="file" accept=".json,application/json"
        disabled={busy} onChange={e=>void choose(e.target.files?.[0]??null)}/>
      {preview&&<>
        <div className="episode-package-overview">
          <strong>{preview.episodeKey} · {preview.title}</strong>
          <p>{preview.shots} SHOTs · {preview.beats} HEAR → SEE beats</p>
          <small>SHA-256: {preview.hash}</small>
        </div>
        <label className="episode-package-confirm"><input type="checkbox" checked={confirmed}
          onChange={e=>setConfirmed(e.target.checked)} disabled={busy}/>
          I approve importing this source as immutable. Voice generation and OpenAI Agent Executor
          require separate future authorization.</label>
        <button type="button" className="episode-preparation-primary"
          disabled={!confirmed||busy} onClick={()=>void importPackage()}>
          <Upload size={17}/> {busy?'Importing…':'Import all SHOTs · No paid calls'}
        </button>
      </>}
    </section>
    <section className="episode-package-panel">
      <div className="episode-package-heading">
        <h2>Imported episode packages</h2>
        <button type="button" className="episode-preparation-secondary"
          onClick={()=>void refresh().catch(e=>setError(String(e)))}>
          <RotateCcw size={15}/> Refresh</button>
      </div>
      {saved.length===0?<p>No imported sources yet. EP001 and EP002 remain untouched.</p>
        :saved.map(x=><button className="episode-package-entry" type="button" key={x.packageId}
          onClick={()=>void show(x.packageId)}>
          <strong>{x.episodeKey} · {x.title}</strong>
          <span>{x.shotCount} SHOTs · {x.beatCount} beats · {x.status}</span>
        </button>)}
    </section>
    {details&&<section className="episode-package-panel">
      <h2>{details.episodeKey} · All voice tasks</h2>
      <p>{details.status} · {details.shots.filter(shot=>
        shot.voiceTaskStatus==='VOICE_APPROVED_TIMING_REVIEW_REQUIRED').length}/{details.shotCount}
        {' '}SHOTs have a Director-selected current-revision Take.
        The imported source remains immutable. Provider alignment and timing still require
        separate validation before any future OpenAI batch authorization.</p>
      {details.episodeKey==='EP003'&&<Ep003CumulativeFullVideo/>}
      {false&&<>
      {details.episodeKey==='EP003'&&<Ep003Shot11V1DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot01DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot02DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot03V4DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot04V1DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot05V1DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot06V1DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot09V3DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot08V4DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot10V1DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot09V2DirectorReview/>}
      {details.episodeKey==='EP003'&&<Ep003Shot08V3DirectorReview/>}
      {details.episodeKey==='EP003'&&<details className="episode-package-shot"><summary>Historical SHOT09 V1 · NOT LOCKED</summary><Ep003Shot09V1DirectorReview/></details>}
      {details.episodeKey==='EP003'&&<Ep003Shot08V2DirectorReview/>}
      {details.episodeKey==='EP003'&&<details className="episode-package-shot"><summary>Historical SHOT08 V1 · NOT LOCKED</summary><Ep003Shot08V1DirectorReview/></details>}
      {details.episodeKey==='EP003'&&<Ep003Shot07V3DirectorReview/>}
      {details.episodeKey==='EP003'&&<details className="episode-package-shot"><summary>Historical SHOT07 V2 · NOT LOCKED</summary><Ep003Shot07V2DirectorReview/></details>}
      {details.episodeKey==='EP003'&&<details className="episode-package-shot"><summary>Historical SHOT07 V1 · NOT LOCKED</summary><Ep003Shot07V1DirectorReview/></details>}
      {details.episodeKey==='EP003'&&<details className="episode-package-shot"><summary>Historical SHOT03 V3 · previous primary wording · NOT LOCKED</summary><Ep003Shot03V3DirectorReview/></details>}
      {details.episodeKey==='EP003'&&<details className="episode-package-shot"><summary>Historical SHOT03 V2 · approved database replica shapes · not LOCKED</summary><Ep003Shot03V2DirectorReview/></details>}
      {details.episodeKey==='EP003'&&<details className="episode-package-shot"><summary>Historical SHOT03 V1 · blue service-style replicas</summary><Ep003Shot03DirectorReview/></details>}
      </>}
      <EpisodeVoiceReadinessPanel packageId={details.packageId}
        refreshVersion={readinessRefresh}/>
      <EpisodeCodexCloudPanel packageId={details.packageId}
        refreshVersion={readinessRefresh}/>
      <EpisodeFactoryProductionPanel packageId={details.packageId}
        refreshVersion={readinessRefresh}/>
      <EpisodeAiAuthorizationPanel packageId={details.packageId}
        refreshVersion={readinessRefresh}/>
      <EpisodeMultiShotExecutionPanel packageId={details.packageId}
        refreshVersion={readinessRefresh}
        onStatusChanged={()=>setReadinessRefresh(v=>v+1)}/>
      {details.shots.map(shot=><details className="episode-package-shot" key={shot.shotKey}>
        <summary>{shot.shotKey} · {shot.title} <span>{shot.voiceTaskStatus}</span></summary>
        <p><strong>Original approved narration:</strong> {shot.narration}</p>
        <p><strong>Original voice direction:</strong> {shot.voiceDirection}</p>
        <button type="button" className="episode-package-voice-primary"
          onClick={()=>setActiveVoiceShot(previous=>
            previous===shot.shotKey?null:shot.shotKey)}>
          {activeVoiceShot===shot.shotKey?'Close Voice Studio':'Open Voice Studio · Edit / Takes / Approve'}
        </button>
        {activeVoiceShot===shot.shotKey&&
          <EpisodePackageVoiceStudioPanel packageId={details.packageId}
            episodeKey={details.episodeKey} shotKey={shot.shotKey}
            onStatusChanged={()=>{void show(details.packageId,true);
              setReadinessRefresh(v=>v+1);}}/>}
        <details className="episode-package-visual-source"><summary>Original visual storyline</summary>
          <pre>{JSON.stringify(shot.visualStory,null,2)}</pre>
        </details>
      </details>)}
    </section>}
  </main>;
}
