import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,Check,ChevronRight,Film,Headphones,Play,RefreshCw,Save,Volume2} from 'lucide-react';
import '../styles/directorQuietEpisode.css';

type Shot={shotKey:string;title:string};
type Episode={packageId:string;episodeKey:string;title:string;shots:Shot[]};
type Take={id:string;takeNumber:number;revision:number;durationSeconds:number|null;deliveryMode?:string};
type Voice={
  shotKey:string;revision:number;narration:string;voiceDirection:string;
  narrationSha256:string;takes:Take[];selectedTakeId:string|null;
  approvedCurrentRevision:boolean;canGenerate:boolean;canGenerateSlow:boolean;
  generationStatus:string;blockedReason:string;
};
type Readiness={
  ready:boolean;episodeKey:string;shotKey:string;selectedTakeId:string|null;
  narrationSha256:string|null;expectedSourceCommit:string;durationInFrames:number;
  blockers:string[];nextAction:string;
};
type Render={renderId:string;status:string;progress?:number;videoUrl?:string;compositionId?:string};
type SavedRender={renderId:string;shotKey:string;status:'READY';videoUrl:string;
  durationInFrames:number;scriptRevision:number;sourceCommit:string;
  finishedAt:string;canLock:boolean;locked:boolean};
type ShotLock={shotKey:string;renderId:string;lockedAt:string};
type FilmState={locks:ShotLock[];shotCount:number;videoUrl:string|null;
  state:string;renderIds:string[];durationInFrames:number;error?:string;preferOriginalPlayback?:boolean};

const base='/api/v1/episode-packages';
const compositions:Record<string,string>={
  SHOT01:'EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL',
  SHOT02:'EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL',
  SHOT03:'EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL',
  SHOT04:'EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL',
  SHOT05:'EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL',
  SHOT06:'EP004-SHOT06-SERVER-FLEET-V1-VISUAL',
  SHOT07:'EP004-SHOT07-CASCADING-FAILURE-V1-VISUAL',
  SHOT08:'EP004-SHOT08-REGIONAL-CONTAINMENT-V1-VISUAL',
  SHOT09:'EP004-SHOT09-HEALTH-VS-READINESS-V1-VISUAL',
  SHOT10:'EP004-SHOT10-CONTROLLED-RECOVERY-V1-VISUAL',
  SHOT11:'EP004-SHOT11-INCIDENT-CLOCK-V1-VISUAL',
  SHOT12:'EP004-SHOT12-CONTROLLED-RESTORATION-V1-VISUAL',
  SHOT13:'EP004-SHOT13-RESILIENT-DESIGN-V1-VISUAL',
  SHOT14:'EP004-SHOT14-ARCHITECTURE-PARADOX-V1-VISUAL'
};
async function result<T>(response:Response):Promise<T>{
  if(!response.ok)throw Error('HTTP '+response.status+': '+(await response.text()).slice(0,270));
  return response.json() as Promise<T>;
}
const errorText=(cause:unknown)=>cause instanceof Error?cause.message:String(cause);
const lockedVideoUrl=(renderId:string)=>
  '/api/v1/remotion/renders/'+encodeURIComponent(renderId)+'/video';

export function DirectorQuietEpisodePage({packageId}:{packageId:string}){
  const [episode,setEpisode]=useState<Episode|null>(null);
  const [activeShot,setActiveShot]=useState('SHOT01');
  const [tab,setTab]=useState<'SHOT'|'FULL'>('SHOT');
  const [voice,setVoice]=useState<Voice|null>(null);
  const [script,setScript]=useState('');
  const [direction,setDirection]=useState('');
  const [chosenTake,setChosenTake]=useState('');
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [render,setRender]=useState<Render|null>(null);
  const [savedRenders,setSavedRenders]=useState<SavedRender[]>([]);
  const [checkingSaved,setCheckingSaved]=useState(false);
  const [film,setFilm]=useState<FilmState|null>(null);
  const [fullPlaybackError,setFullPlaybackError]=useState('');
  const [fallbackIndex,setFallbackIndex]=useState<number|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [voiceConsent,setVoiceConsent]=useState(false);
  const [cpuConsent,setCpuConsent]=useState(false);
  const voiceRequest=useRef<string|null>(null);
  const cpuRequest=useRef<string|null>(null);
  const serial=useRef(0);
  const savedSerial=useRef(0);
  const root=base+'/'+encodeURIComponent(packageId);
  const shotRoot=root+'/shots/'+encodeURIComponent(activeShot);
  const editing=!!voice&&(script!==voice.narration||direction!==voice.voiceDirection);
  const target=compositions[activeShot];
  const renderMatches=!!voice?.approvedCurrentRevision&&!!readiness?.ready
    &&readiness.episodeKey===episode?.episodeKey&&readiness.shotKey===activeShot
    &&readiness.selectedTakeId===voice.selectedTakeId
    &&readiness.narrationSha256===voice.narrationSha256;

  const refreshFilm=useCallback(async()=>{
    if(episode?.episodeKey==='EP003'){
      const legacy=await result<{status:string;videoUrl?:string;durationInFrames?:number}>(
        await fetch('/api/v1/remotion/renders/ep003/cumulative/latest-successful',
          {cache:'no-store'}));
      setFilm({locks:[],shotCount:legacy.status==='READY'?11:0,
        videoUrl:legacy.status==='READY'?legacy.videoUrl??null:null,
        state:legacy.status==='READY'?'READY':'EMPTY',renderIds:[],
        durationInFrames:legacy.durationInFrames??0});
      return;
    }
    const data=await result<FilmState>(await fetch(root+'/film',{cache:'no-store'}));
    setFilm(data);
  },[root,episode?.episodeKey]);

  useEffect(()=>{
    let active=true;
    const params=new URLSearchParams(window.location.hash.split('?',2)[1]||'');
    const requested=params.get('shot');
    setLoading(true);setError('');
    void fetch(root,{cache:'no-store'}).then(result<Episode>).then(data=>{
      if(!active)return;
      setEpisode(data);
      setActiveShot(requested&&data.shots.some(s=>s.shotKey===requested)
        ?requested:data.shots[0]?.shotKey??'SHOT01');
    }).catch(e=>{if(active)setError(errorText(e));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[root]);

  const refreshVoice=useCallback(async()=>{
    const shot=activeShot;
    const data=await result<Voice>(await fetch(root+'/shots/'+encodeURIComponent(shot)+'/voice',
      {cache:'no-store'}));
    if(data.shotKey!==shot)throw Error('Voice returned a different SHOT. No action was taken.');
    setVoice(data);setScript(data.narration);setDirection(data.voiceDirection);
    setChosenTake(data.selectedTakeId??'');setVoiceConsent(false);
    return data;
  },[root,activeShot]);

  const refreshSavedRenders=useCallback(async()=>{
    const shot=activeShot;
    const request=++savedSerial.current;
    setCheckingSaved(true);
    try{
      const videos=await result<SavedRender[]>(await fetch(
        root+'/film/candidates/'+encodeURIComponent(shot),{cache:'no-store'}));
      if(request!==savedSerial.current)return;
      if(!Array.isArray(videos)||videos.some(item=>item.shotKey!==shot
          ||item.status!=='READY'))
        throw Error('MediaOS returned unexpected saved MP4 data.');
      setSavedRenders(videos);
    }finally{
      if(request===savedSerial.current)setCheckingSaved(false);
    }
  },[root,activeShot]);

  useEffect(()=>{
    if(episode?.episodeKey!=='EP004')return;
    setSavedRenders([]);
    void refreshSavedRenders().catch(reason=>setError(
      'Saved videos could not be loaded: '+errorText(reason)));
    return()=>{savedSerial.current++;};
  },[episode?.episodeKey,refreshSavedRenders]);

  const refreshRender=useCallback(async()=>{
    const shot=activeShot;
    if(episode?.episodeKey!=='EP004'||!compositions[shot]){
      setReadiness(null);setRender(null);return;
    }
    const ready=await result<Readiness>(await fetch(root+'/shots/'+shot+'/render-readiness',
      {cache:'no-store'}));
    if(ready.episodeKey!=='EP004'||ready.shotKey!==shot)
      throw Error('Wrong SHOT returned by render readiness.');
    const composition=compositions[shot];
    const latest=/^[a-f0-9]{40}$/.test(ready.expectedSourceCommit)
      ?await result<Render>(await fetch('/api/v1/remotion/renders/compositions/'
        +encodeURIComponent(composition)+'/latest?profile=REVIEW&sourceCommit='
        +encodeURIComponent(ready.expectedSourceCommit),{cache:'no-store'})):null;
    setReadiness(ready);setCpuConsent(false);
    setRender(latest?.status==='EMPTY'?null:latest);
  },[root,activeShot,episode?.episodeKey]);

  useEffect(()=>{
    if(!episode)return;
    const current=++serial.current;let active=true;
    setVoice(null);setRender(null);setReadiness(null);
    setError('');setNotice('');setCpuConsent(false);setVoiceConsent(false);
    const filmRequest=episode.episodeKey==='EP003'
      ?fetch('/api/v1/remotion/renders/ep003/cumulative/latest-successful',
        {cache:'no-store'}).then(result<{status:string;videoUrl?:string;durationInFrames?:number}>)
        .then(legacy=>({locks:[],shotCount:legacy.status==='READY'?11:0,
          videoUrl:legacy.status==='READY'?legacy.videoUrl??null:null,
          state:legacy.status==='READY'?'READY':'EMPTY',renderIds:[],
          durationInFrames:legacy.durationInFrames??0} as FilmState))
      :fetch(root+'/film',{cache:'no-store'}).then(result<FilmState>);
    void Promise.all([
      fetch(root+'/shots/'+encodeURIComponent(activeShot)+'/voice',{cache:'no-store'})
        .then(result<Voice>),filmRequest
    ]).then(([v,f])=>{
      if(!active||current!==serial.current)return;
      if(v.shotKey!==activeShot)throw Error('Wrong SHOT voice response.');
      setVoice(v);setScript(v.narration);setDirection(v.voiceDirection);
      setChosenTake(v.selectedTakeId??'');setFilm(f);
    }).catch(e=>{if(active&&current===serial.current)setError(errorText(e));});
    return()=>{active=false;serial.current++;};
  },[activeShot,root,episode?.episodeKey]);

  useEffect(()=>{
    if(tab!=='FULL'||episode?.episodeKey!=='EP004'
        ||film?.state==='READY'||film?.state==='ASSEMBLY_FAILED'
        ||(film?.locks.length??0)<2)return;
    const timer=window.setInterval(()=>{
      void refreshFilm().catch(reason=>setError(errorText(reason)));
    },4000);
    return()=>window.clearInterval(timer);
  },[tab,episode?.episodeKey,film?.state,film?.locks.length,refreshFilm]);

  useEffect(()=>{
    if(!voice?.approvedCurrentRevision||episode?.episodeKey!=='EP004')return;
    void refreshRender().catch(e=>setError(errorText(e)));
  },[voice?.approvedCurrentRevision,voice?.selectedTakeId,episode?.episodeKey,refreshRender]);

  async function saveScript(){
    if(!voice||!editing||busy)return;
    setBusy('save');setError('');setNotice('');
    try{
      const updated=await result<Voice>(await fetch(shotRoot+'/voice/script',{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:voice.revision,narration:script,
          voiceDirection:direction})
      }));
      setVoice(updated);setScript(updated.narration);setDirection(updated.voiceDirection);
      setChosenTake(updated.selectedTakeId??'');
      setReadiness(null);setRender(null);setCpuConsent(false);
      setNotice('Script saved · revision '+updated.revision+'. Generate or select a Take for this revision.');
    }catch(e){setError(errorText(e));}finally{setBusy('');}
  }

  async function generateVoice(){
    if(!voice||editing||busy||!voiceConsent||!voice.canGenerateSlow)return;
    if(!window.confirm('Generate one paid ElevenLabs Slow Natural Take for '+activeShot
      +' revision '+voice.revision+'? This uses the current saved script.'))return;
    const id=voiceRequest.current??window.crypto.randomUUID();voiceRequest.current=id;
    setBusy('voice');setError('');setNotice('');
    try{
      const updated=await result<Voice>(await fetch(shotRoot+'/voice/generate',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:voice.revision,
          expectedNarrationSha256:voice.narrationSha256,requestId:id,
          confirmPaidElevenLabs:true,deliveryMode:'SLOW_NATURAL'})
      }));
      voiceRequest.current=null;
      setVoice(updated);setChosenTake(updated.selectedTakeId??'');
      setVoiceConsent(false);
      setNotice('Voice generated. Listen and approve the Take you want to use.');
    }catch(e){setError('Voice request outcome needs review: '+errorText(e)
      +'. Refresh this SHOT before requesting any additional paid Take.');}
    finally{setBusy('');}
  }

  async function approveVoice(){
    if(!voice||!chosenTake||editing||busy)return;
    if(!window.confirm('Approve selected voice Take for '+activeShot+'?'))return;
    setBusy('approve');setError('');setNotice('');
    try{
      const updated=await result<Voice>(await fetch(shotRoot+'/voice/approve',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:voice.revision,
          takeId:chosenTake,decision:'DIRECTOR_APPROVE'})
      }));
      setVoice(updated);setChosenTake(updated.selectedTakeId??'');
      setNotice('Voice Take approved. Video rendering can now be checked.');
    }catch(e){setError(errorText(e));}finally{setBusy('');}
  }

  async function startRender(){
    if(!voice||!renderMatches||!readiness||!cpuConsent||editing||busy)return;
    if(!window.confirm('Render '+activeShot+' at 1920×1080 using the approved Take? '
      +'This consumes Railway CPU and private storage, but no ElevenLabs call.'))return;
    const id=cpuRequest.current??window.crypto.randomUUID();cpuRequest.current=id;
    setBusy('render');setError('');setNotice('');
    try{
      const job=await result<Render>(await fetch(shotRoot+'/render',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({requestId:id,expectedNarrationSha256:readiness.narrationSha256,
          expectedVoiceTakeId:readiness.selectedTakeId,
          expectedSourceCommit:readiness.expectedSourceCommit,
          maximumFrames:readiness.durationInFrames,confirmCpuRender:true})
      }));
      if(job.compositionId!==target)throw Error('Render returned the wrong composition.');
      cpuRequest.current=null;setRender(job);setCpuConsent(false);
      setNotice(job.status==='READY'?'Existing render found. No new job was started.'
        :job.status==='QUEUED'?'Render queued.':'Render status: '+job.status);
    }catch(e){setError('Render request must be checked before retrying: '+errorText(e));}
    finally{setBusy('');}
  }

  async function lockShot(renderId:string){
    if(!renderId||busy)return;
    if(!window.confirm('Director LOCK '+activeShot+' using this exact rendered MP4? '
      +'The consecutive locked SHOTs will be assembled into one full-video file.'))return;
    setBusy('lock');setError('');setNotice('');
    try{
      const current=await result<FilmState>(await fetch(
        root+'/film/locks/'+encodeURIComponent(activeShot),{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({renderId,confirmLock:true})
      }));
      setFilm(current);
      void refreshSavedRenders().catch(reason=>setError(errorText(reason)));
      setNotice(current.state==='READY'
        ?activeShot+' locked. The Full Video tab has the latest continuous MP4.'
        :current.state==='ASSEMBLING'
          ?activeShot+' locked. The full episode is joining automatically; no video is re-rendered.'
          :activeShot+' locked. Full Video starts with SHOT01 and includes only consecutive locked SHOTs.');
    }catch(e){setError('Lock or film assembly did not finish: '+errorText(e)
      +'. Refresh Full Video to inspect saved state; do not render the SHOT again.');}
    finally{setBusy('');}
  }

  async function retryFilm(){
    if(!film||film.state!=='ASSEMBLY_FAILED'||busy)return;
    if(!window.confirm('Retry joining the already locked SHOT MP4s? '
      +'This uses small assembly CPU and storage, but no new Remotion or ElevenLabs call.'))return;
    setBusy('film');setError('');setNotice('');
    try{
      const response=await fetch(root+'/film/retry',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({confirmRetry:true})});
      setFilm(await result<FilmState>(response));
      setNotice('The existing locked SHOTs were queued for a new lossless join.');
    }catch(e){setError(errorText(e));}
    finally{setBusy('');}
  }

  const archived=episode?.episodeKey==='EP003';
  const active=episode?.shots.find(s=>s.shotKey===activeShot);
  const locked=film?.locks.find(s=>s.shotKey===activeShot);
  const fullUrl=film?.videoUrl??null;
  const fallbackClips=(film?.renderIds??[]).map(id=>film?.locks.find(lock=>lock.renderId===id));
  const canPlayOriginals=episode?.episodeKey==='EP004'&&fallbackClips.length>0&&
    fallbackClips.every(Boolean);
  const fallbackClip=fallbackIndex===null?undefined:fallbackClips[fallbackIndex];
  useEffect(()=>{
    setFallbackIndex(film?.preferOriginalPlayback&&canPlayOriginals?0:null);setFullPlaybackError('');
  },[fullUrl,film?.preferOriginalPlayback,canPlayOriginals]);
  const selectedVideo=locked
    ?savedRenders.find(item=>item.renderId===locked.renderId)
    :(savedRenders.find(item=>item.canLock)??savedRenders[0]);
  const shotVideoUrl=locked?lockedVideoUrl(locked.renderId):selectedVideo?.videoUrl??null;
  return <main className="director-minimal">
    <header className="director-minimal-top">
      <button type="button" className="director-minimal-back"
        onClick={()=>{window.location.hash='#/episodes';}}><ArrowLeft size={18}/> Episodes</button>
      <span className="director-minimal-mark">MediaOS · Director</span>
    </header>
    {loading&&<p className="director-minimal-muted">Opening episode…</p>}
    {episode&&<>
      <header className="director-minimal-heading">
        <div><p className="director-minimal-eyebrow">{episode.episodeKey}</p>
          <h1>{episode.title}</h1></div>
        <span className="director-minimal-counter">
          {archived?'Finished episode':(film?.locks.length??0)+' / '+episode.shots.length+' locked'}
        </span>
      </header>
      <div className="director-minimal-body">
        <aside className="director-minimal-sidebar" aria-label="Choose SHOT">
          <p className="director-minimal-eyebrow">Shots</p>
          {episode.shots.map((shot,index)=>{
            const isLocked=film?.locks.some(l=>l.shotKey===shot.shotKey);
            return <button type="button" key={shot.shotKey}
              aria-current={activeShot===shot.shotKey&&tab==='SHOT'?'page':undefined}
              className={'director-minimal-shot'+(activeShot===shot.shotKey&&tab==='SHOT'?' selected':'')}
              onClick={()=>{
                if(editing&&!window.confirm('Discard unsaved script edits?'))return;
                setActiveShot(shot.shotKey);setTab('SHOT');
              }}>
              <span className="director-minimal-shot-number">{String(index+1).padStart(2,'0')}</span>
              <span className="director-minimal-shot-name"><strong>{shot.shotKey}</strong>
                <small>{shot.title}</small></span>
              {isLocked?<Check size={17} aria-label="Locked"/>:<ChevronRight size={16}/>}
            </button>;
          })}
          <button type="button"
            className={'director-minimal-full'+(tab==='FULL'?' selected':'')}
            onClick={()=>{
              if(editing&&!window.confirm('Discard unsaved script edits?'))return;
              setTab('FULL');void refreshFilm().catch(e=>setError(errorText(e)));
            }}><Film size={18}/> Full Video</button>
        </aside>
        <div className="director-minimal-main">
          {error&&<p className="director-minimal-error" role="alert">{error}</p>}
          {notice&&<p className="director-minimal-success" role="status">{notice}</p>}
          {tab==='FULL'?<section className="director-minimal-panel">
            <div className="director-minimal-section-head">
              <div><p className="director-minimal-eyebrow">Your finished shots</p>
                <h2>Full Video</h2></div>
              <button type="button" className="director-minimal-subtle"
                onClick={()=>void refreshFilm().catch(e=>setError(errorText(e)))}>
                <RefreshCw size={15}/> Refresh</button>
            </div>
            <p className="director-minimal-muted">
              {episode.episodeKey==='EP003'
                ?'The finished Director-approved episode.'
                :(film?.locks.length??0)+' locked SHOTs. Only the combined MP4 of the currently locked sequence is shown.'}
            </p>
            {!fullUrl&&(film?.locks.length??0)>=2
              &&film?.state!=='ASSEMBLY_FAILED'&&
              <p role="status" className="director-minimal-muted">
                Preparing one continuous Full Video from the locked SHOTs.
                The combined MP4 will appear automatically in this single player.
              </p>}
            {fullUrl&&<p role="status" className="director-minimal-muted">
              {film?.preferOriginalPlayback?'The combined MP4 is under repair. Review the original locked SHOTs below.':'Full Video is ready. Watch the complete continuous MP4 below.'}
            </p>}
            {fullUrl&&!fallbackClip&&<video key={fullUrl} controls playsInline preload="metadata"
              className="director-minimal-video" src={fullUrl}
              onError={event=>setFullPlaybackError('Playback error '+(event.currentTarget.error?.code??'unknown')+
                ': '+(event.currentTarget.error?.message||'Browser could not load the combined video.'))}
              onPlaying={()=>setFullPlaybackError('')}
              aria-label="Full Video assembled from consecutive locked SHOTs"/>}
            {fullPlaybackError&&<p className="director-minimal-error" role="alert">{fullPlaybackError}</p>}
            {canPlayOriginals&&!fallbackClip&&<button type="button" className="director-minimal-subtle"
                onClick={()=>{setFullPlaybackError('');setFallbackIndex(0);}}>
                <Play size={15}/> Play original SHOTs in sequence
              </button>}
            {fallbackClip&&<div className="director-minimal-render">
              <p className="director-minimal-muted">Original locked videos · {fallbackClip.shotKey} ·
                {' '+((fallbackIndex??0)+1)+' / '+fallbackClips.length}</p>
              <video key={fallbackClip.renderId} controls playsInline autoPlay preload="auto" className="director-minimal-video"
                src={lockedVideoUrl(fallbackClip.renderId)}
                aria-label="Sequential original SHOT playback"
                onEnded={()=>setFallbackIndex(index=>index!==null&&index+1<fallbackClips.length?index+1:index)}
                onError={event=>setFullPlaybackError('Original '+fallbackClip.shotKey+' playback error '+
                  (event.currentTarget.error?.code??'unknown'))}
                onPlaying={()=>setFullPlaybackError('')}/>
              <button type="button" className="director-minimal-subtle"
                disabled={(fallbackIndex??0)===0}
                onClick={()=>setFallbackIndex(index=>Math.max(0,(index??0)-1))}>Previous SHOT</button>
              <button type="button" className="director-minimal-subtle"
                disabled={(fallbackIndex??0)+1>=fallbackClips.length}
                onClick={()=>setFallbackIndex(index=>Math.min(fallbackClips.length-1,(index??0)+1))}>Next SHOT</button>
              {!film?.preferOriginalPlayback&&<button type="button" className="director-minimal-subtle"
                onClick={()=>{setFallbackIndex(null);setFullPlaybackError('');}}>Return to Full Video</button>}
            </div>}
            {!fullUrl&&(film?.locks.length??0)===0&&
              <p className="director-minimal-empty">No SHOTs are locked yet. The full film appears here when consecutive SHOTs starting with SHOT01 are locked.</p>}
            {!fullUrl&&(film?.locks.length??0)>0&&film?.state!=='ASSEMBLY_FAILED'&&
              <p className="director-minimal-muted">Locked SHOTs are preserved. Only the complete combined MP4 will appear here.</p>}
            {film?.state==='ASSEMBLY_FAILED'&&<>
              <p role="alert" className="director-minimal-error">
                Assembly needs attention. Locked SHOT MP4s are preserved. {film.error}</p>
              <button type="button" className="director-minimal-subtle"
                disabled={!!busy} onClick={()=>void retryFilm()}>
                <RefreshCw size={15}/> Retry joining Full Video
              </button>
            </>}
          </section>:<div className="director-minimal-sections">
            <div className="director-minimal-shot-heading">
              <div><p className="director-minimal-eyebrow">{activeShot}</p>
                <h2>{active?.title}</h2></div>
              {locked&&<span className="director-minimal-locked"><Check size={14}/> Locked MP4</span>}
            </div>
            <section className="director-minimal-panel">
              <div className="director-minimal-section-head">
                <div><p className="director-minimal-eyebrow">01 · Script</p><h3>Your narration</h3></div>
                <button type="button" className="director-minimal-primary"
                  disabled={!!archived||!editing||!!busy||script.trim().length<20||direction.trim().length<8}
                  onClick={()=>void saveScript()}><Save size={17}/> Save script</button>
              </div>
              <textarea aria-label="SHOT narration" value={script}
                onChange={e=>setScript(e.target.value)} disabled={!!archived||!voice||!!busy}
                className="director-minimal-script" rows={11}/>
              {voice&&<p className="director-minimal-muted">
                Revision {voice.revision}.
                {episode.episodeKey==='EP003'
                  ?' This archived episode keeps its original locked source.'
                  :' You can edit your script anytime. Saving a new revision does not delete audio or locked videos.'}
              </p>}
              <details className="director-minimal-advanced">
                <summary>Voice direction</summary>
                <textarea aria-label="Voice direction" value={direction}
                  onChange={e=>setDirection(e.target.value)} disabled={!!archived||!voice||!!busy} rows={3}/>
              </details>
            </section>
            <section className="director-minimal-panel">
              <div className="director-minimal-section-head">
                <div><p className="director-minimal-eyebrow">02 · Voice</p>
                  <h3>ElevenLabs</h3></div>
                <button type="button" className="director-minimal-subtle"
                  disabled={!!busy} onClick={()=>void refreshVoice().catch(e=>setError(errorText(e)))}>
                  <RefreshCw size={15}/> Refresh</button>
              </div>
              <label className="director-minimal-confirm">
                <input type="checkbox" checked={voiceConsent}
                  disabled={!!archived||!voice?.canGenerateSlow||editing||!!busy}
                  onChange={e=>setVoiceConsent(e.target.checked)}/>
                I approve one paid ElevenLabs voice generation.
              </label>
              <button type="button" className="director-minimal-primary"
                disabled={!!archived||!voice?.canGenerateSlow||!voiceConsent||editing||!!busy}
                onClick={()=>void generateVoice()}>
                <Volume2 size={17}/>{busy==='voice'?'Generating…':'Generate voice'}
              </button>
              {voice&&voice.takes.length===0&&<p className="director-minimal-muted">
                No recorded Takes yet.</p>}
              {voice?.takes.map(take=><div className="director-minimal-take" key={take.id}>
                <label><input type="radio" name={'take-'+activeShot} value={take.id}
                  checked={chosenTake===take.id}
                  disabled={!!busy||editing||take.revision!==voice.revision}
                  onChange={()=>setChosenTake(take.id)}/>
                  Take {take.takeNumber} {take.id===voice.selectedTakeId&&voice.approvedCurrentRevision?' · Approved':''}
                </label>
                <audio controls preload="none" src={shotRoot+'/voice/takes/'
                  +encodeURIComponent(take.id)+'/audio'} aria-label={'Listen to Take '+take.takeNumber}/>
              </div>)}
              {!!voice?.takes.length&&<button type="button" className="director-minimal-subtle"
                disabled={!!busy||editing||!chosenTake||
                  voice?.takes.every(t=>t.id!==chosenTake||t.revision!==voice.revision)||
                  (voice.approvedCurrentRevision&&chosenTake===voice.selectedTakeId)}
                onClick={()=>void approveVoice()}>
                <Check size={16}/> {voice?.approvedCurrentRevision&&chosenTake===voice.selectedTakeId
                  ?'Voice approved':'Approve selected Take'}
              </button>}
              {voice?.blockedReason&&!voice.canGenerateSlow&&<p className="director-minimal-muted">
                {voice.blockedReason}</p>}
            </section>
            <section className="director-minimal-panel">
              <div className="director-minimal-section-head">
                <div><p className="director-minimal-eyebrow">03 · Video</p>
                  <h3>Video</h3></div>
                {target&&<button type="button" className="director-minimal-subtle"
                  disabled={!!busy||checkingSaved}
                  onClick={()=>{
                    void refreshSavedRenders().catch(e=>setError(errorText(e)));
                    void refreshRender().catch(e=>setError(errorText(e)));
                  }}><RefreshCw size={15}/> Refresh videos</button>}
              </div>
              {!target?<p className="director-minimal-muted">The visual scene is not
                ready yet. Script and voice editing remain available.</p>:<>
                {checkingSaved&&<p className="director-minimal-muted" role="status">
                  Finding previously rendered videos. No new rendering is needed.
                </p>}
                {shotVideoUrl&&<div className="director-minimal-render">
                  <p className="director-minimal-muted">
                    {locked?'This SHOT is locked and included in Full Video.'
                      :'Video ready to review. Lock it to include it in Full Video.'}
                  </p>
                  <video key={shotVideoUrl} controls playsInline preload="metadata"
                    src={shotVideoUrl} className="director-minimal-video"
                    aria-label={activeShot+' video preview'}/>
                  {locked?<span className="director-minimal-locked">
                    <Check size={14}/> SHOT locked</span>:
                    selectedVideo?.canLock?<button type="button"
                      className="director-minimal-lock" disabled={!!busy}
                      onClick={()=>void lockShot(selectedVideo.renderId)}>
                      <Check size={16}/> Lock SHOT & add to Full Video
                    </button>:
                    <p className="director-minimal-muted">
                      This video cannot be locked because its original voice approval
                      could not be verified. No new render has been started.
                    </p>}
                </div>}
                <details className="director-minimal-advanced"
                  open={!checkingSaved&&!shotVideoUrl}>
                  <summary>{shotVideoUrl
                    ?'Render new video (optional)'
                    :'No saved MP4 available — render video'}</summary>
                  <div className="director-minimal-render director-minimal-new-render">
                    <p className="director-minimal-muted">
                      {readiness?.ready?'Ready for a new Director render'
                        :readiness?.blockers.length
                          ?'Not ready: '+readiness.blockers.join(' · ')
                          :'Approve the current voice Take to render a new version.'}
                    </p>
                    <label className="director-minimal-confirm">
                      <input type="checkbox" checked={cpuConsent}
                        disabled={!renderMatches||!!busy||editing}
                        onChange={e=>setCpuConsent(e.target.checked)}/>
                      I approve one new video render using Railway CPU.
                    </label>
                    <button type="button" className="director-minimal-primary"
                      disabled={!cpuConsent||!renderMatches||!!busy||editing}
                      onClick={()=>void startRender()}><Play size={16}/>
                      {busy==='render'?'Queuing…':'Render video'}</button>
                    {render&&<div className="director-minimal-render">
                      <p role="status">New video: {render.status}
                        {typeof render.progress==='number'?' · '+render.progress+'%':''}</p>
                      {render.videoUrl&&<video key={render.videoUrl} controls playsInline
                        preload="metadata" className="director-minimal-video"
                        src={render.videoUrl}
                        aria-label={'Newly rendered '+activeShot+' video'}/>}
                      {episode.episodeKey==='EP004'&&render.status==='READY'&&
                        <button type="button" className="director-minimal-lock"
                          disabled={!!busy||locked?.renderId===render.renderId}
                          onClick={()=>void lockShot(render.renderId)}>
                          <Check size={16}/>
                          {locked?.renderId===render.renderId
                            ?'SHOT locked':'Lock SHOT & add to Full Video'}
                        </button>}
                    </div>}
                  </div>
                </details>
              </>}
            </section>
          </div>}
        </div>
      </div>
    </>}
  </main>;
}
