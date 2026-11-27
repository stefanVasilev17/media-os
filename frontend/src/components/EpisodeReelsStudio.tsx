import {useEffect,useRef,useState} from 'react';
import {Check,Download,Film,Play,Plus,RefreshCw,Scissors,X} from 'lucide-react';
import '../styles/episodeReelsStudio.css';

type Master={filmId:string;sha256:string;frames:number;videoUrl:string};
type Candidate={shotKey:string;title:string;startFrame:number;endFrame:number;recommended:boolean};
type Reel={id:string;filmId:string;title:string;startFrame:number;endFrame:number;state:string;
  method:string|null;issue:string|null;sha256:string|null;byteCount:number|null;videoUrl:string|null};
type View={episodeKey:string;master:Master|null;candidates:Candidate[];reels:Reel[];message:string|null};
type Segment={title:string;startFrame:number;endFrame:number};
const clock=(frame:number)=>{const s=frame/30;return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');};
const precise=(frame:number)=>(frame/30).toFixed(3);
const duration=(s:Segment)=>clock(s.endFrame-s.startFrame);
const same=(a:Segment,b:Segment)=>a.startFrame===b.startFrame&&a.endFrame===b.endFrame;
async function json<T>(r:Response):Promise<T>{
  if(!r.ok)throw Error('Request failed ('+r.status+'). '+(await r.text()).slice(0,250));
  if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('Sign in again to continue.');
  return r.json() as Promise<T>;
}
function IntervalPlayer({master,segment}:{master:Master;segment:Segment}){
  const player=useRef<HTMLVideoElement>(null);
  const start=segment.startFrame/30,end=segment.endFrame/30;
  return <div className="reels-preview">
    <video ref={player} src={master.videoUrl} controls preload="metadata" playsInline
      onLoadedMetadata={e=>{e.currentTarget.currentTime=start;}}
      onPlay={e=>{const v=e.currentTarget;if(v.currentTime<start||v.currentTime>=end)v.currentTime=start;}}
      onTimeUpdate={e=>{const v=e.currentTarget;if(v.currentTime>=end){v.pause();v.currentTime=end;}}}
      onSeeked={e=>{const v=e.currentTarget;if(v.currentTime<start-.04||v.currentTime>end+.04)v.currentTime=start;}}/>
    <p>Source preview · {clock(segment.startFrame)} – {clock(segment.endFrame)} · This is not an exported clip.</p>
  </div>;
}
export function EpisodeReelsStudio({packageId}:{packageId:string}){
  const root='/api/v1/episode-packages/'+encodeURIComponent(packageId)+'/reels';
  const [data,setData]=useState<View|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [preview,setPreview]=useState<Segment|null>(null);
  const [playing,setPlaying]=useState<string|null>(null);
  const [custom,setCustom]=useState(false);
  const [title,setTitle]=useState('');
  const [start,setStart]=useState('');
  const [end,setEnd]=useState('');
  const requestId=useRef(0);
  async function refresh(){
    const seq=++requestId.current;
    try{const view=await json<View>(await fetch(root,{cache:'no-store'}));if(seq===requestId.current)setData(view);}
    catch(e){if(seq===requestId.current)setError(e instanceof Error?e.message:String(e));}
  }
  useEffect(()=>{void refresh();return()=>{requestId.current++;};},[root]);
  const active=!!data?.reels.some(r=>r.state==='QUEUED'||r.state==='RUNNING');
  useEffect(()=>{
    if(!active||busy)return;
    const interval=window.setInterval(()=>void refresh(),5000);
    return()=>window.clearInterval(interval);
  },[active,busy,root]);
  async function post(url:string,body:unknown,success:string){
    setBusy(true);setError('');setNotice('');requestId.current++;
    try{const view=await json<View>(await fetch(root+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
      setData(view);setNotice(success);}
    catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  async function extract(s:Segment){
    if(!data?.master||busy)return;
    if(!window.confirm('Extract this exact interval from the original Full Video? This uses bounded FFmpeg CPU and private storage. No new animation, voice, or aspect-ratio change.'))return;
    await post('/extract',{masterSha256:data.master.sha256,startFrame:s.startFrame,endFrame:s.endFrame,title:s.title,confirm:true},'Extraction requested. The ready clip will appear here.');
    setCustom(false);
  }
  async function lock(r:Reel){
    if(busy||!r.sha256)return;
    if(!window.confirm('Confirm you reviewed this actual clip, including narration, visual continuity and standalone value. Lock the exact original-format MP4?'))return;
    await post('/'+r.id+'/lock',{sha256:r.sha256,confirm:true},'Clip locked.');
  }
  function showSource(s:Segment){
    setPlaying(null);setPreview(old=>old&&same(old,s)?null:s);
  }
  function showClip(r:Reel){setPreview(null);setPlaying(old=>old===r.id?null:r.id);}
  function editRange(s?:Segment){
    setTitle(s?.title??'');setStart(s?precise(s.startFrame):'');setEnd(s?precise(s.endFrame):'');setCustom(true);
  }
  const master=data?.master??null;
  const current=data?.reels.filter(r=>r.filmId===master?.filmId)??[];
  const previous=data?.reels.filter(r=>r.filmId!==master?.filmId)??[];
  const locked=current.filter(r=>r.state==='LOCKED').length;
  const available=data?.candidates.filter(c=>!current.some(r=>same(r,c)&&r.state!=='FAILED'))??[];
  const recommended=available.filter(c=>c.recommended);
  const others=available.filter(c=>!c.recommended);
  const segment:Segment={title:title.trim(),startFrame:Math.round(Number(start)*30),endFrame:Math.round(Number(end)*30)};
  const valid=!!master&&!!title.trim()&&title.trim().length<=160&&start.trim()!==''&&end.trim()!==''&&
    Number.isFinite(segment.startFrame)&&Number.isFinite(segment.endFrame)&&segment.startFrame>=0&&
    segment.endFrame>segment.startFrame&&segment.endFrame<=master.frames&&segment.endFrame-segment.startFrame<=5400;
  function candidate(c:Candidate){
    return <article className="reels-card" key={c.shotKey}>
      <div className="reels-row"><div className="reels-info"><h3>{c.title}</h3><p>{c.shotKey} · {clock(c.startFrame)} – {clock(c.endFrame)} · {duration(c)}</p></div>
        <div className="reels-actions"><button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>showSource(c)}><Play size={15}/> Preview</button>
          <button type="button" className="director-minimal-primary" disabled={busy} onClick={()=>void extract(c)}><Scissors size={15}/> Extract</button></div>
      </div>
      {preview&&same(preview,c)&&master&&<><IntervalPlayer key={master.filmId+'-'+c.startFrame} master={master} segment={c}/>
        <button type="button" className="publishing-text-button" onClick={()=>editRange(c)}>Adjust cut</button></>}
    </article>;
  }
  function extracted(r:Reel,old=false){
    return <article className="reels-card" key={r.id}>
      <div className="reels-row"><div className="reels-info"><h3>{r.title}</h3><p>{clock(r.startFrame)} – {clock(r.endFrame)} · {duration(r)} · {old?'Earlier master · ':''}{r.state==='LOCKED'?'Locked':r.state==='READY'?'Ready for review':r.state==='FAILED'?'Needs retry':r.state==='RUNNING'?'Extracting…':'Queued'}</p></div>
        <div className="reels-actions">
          {r.videoUrl&&<button type="button" className="director-minimal-subtle" onClick={()=>showClip(r)}><Play size={15}/> Preview</button>}
          {r.state==='READY'&&!old&&<button type="button" className="director-minimal-primary" disabled={busy||playing!==r.id} onClick={()=>void lock(r)}><Check size={15}/> Lock</button>}
          {r.state==='LOCKED'&&<a className="reels-download" href={r.videoUrl+'?download=true'}><Download size={15}/> Download</a>}
          {r.state==='FAILED'&&!old&&<button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>void extract(r)}>Retry</button>}
        </div>
      </div>
      {r.issue&&<p className="director-minimal-muted">{r.issue}</p>}
      {playing===r.id&&r.videoUrl&&<div className="reels-preview"><video src={r.videoUrl} controls playsInline preload="metadata"/><p>Original 16:9 · {r.method==='STREAM_COPY'?'Verified stream copy':'Technical encode'} · Review before locking.</p></div>}
    </article>;
  }
  return <section className="reels-studio" aria-label="Reels Studio">
    <div className="director-minimal-section-head"><div><p className="director-minimal-eyebrow">Post-production · {data?.episodeKey??'Episode'}</p><h2>Reels</h2></div>
      <button type="button" className="publishing-text-button" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={15}/> Refresh</button></div>
    {error&&<p role="alert" className="director-minimal-error">{error}</p>}
    {notice&&<p role="status" className="director-minimal-success">{notice}</p>}
    {!data&&!error&&<p className="director-minimal-muted">Loading Full Video and candidates…</p>}
    {data&&<>
      <div className="reels-intro"><div><strong>{locked} locked clips</strong><p>Minimum 3. More are encouraged whenever they stand alone. Cut directly from Full Video, without new creative work.</p></div>
        <button type="button" className="director-minimal-subtle" disabled={!master||busy} onClick={()=>editRange()}><Plus size={16}/> Custom cut</button></div>
      <p className="reels-format">Original 16:9 extracts. Vertical or square packaging requires separate approval; these are not automatically eligible YouTube Shorts.</p>
      {data.message&&<p className="director-minimal-muted">{data.message}</p>}
      {custom&&master&&<article className="reels-card reels-custom">
        <div className="reels-row"><h3>Custom cut</h3><button type="button" className="publishing-text-button" onClick={()=>setCustom(false)} aria-label="Close custom cut"><X size={18}/></button></div>
        <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={160}/></label>
        <div className="reels-cut-inputs"><label>Start (seconds)<input type="number" step="0.001" min="0" value={start} onChange={e=>setStart(e.target.value)}/></label>
          <label>End (seconds)<input type="number" step="0.001" min="0" value={end} onChange={e=>setEnd(e.target.value)}/></label></div>
        <p className="director-minimal-muted">{valid?'Exact frame range: '+segment.startFrame+' – '+segment.endFrame+' (end exclusive)':'Select up to 3 minutes inside the current Full Video.'}</p>
        <div className="reels-actions"><button type="button" className="director-minimal-subtle" disabled={!valid||busy} onClick={()=>showSource(segment)}><Play size={15}/> Preview</button>
          <button type="button" className="director-minimal-primary" disabled={!valid||busy} onClick={()=>void extract(segment)}><Scissors size={15}/> Extract</button></div>
        {valid&&preview&&same(preview,segment)&&<IntervalPlayer key={'custom-'+segment.startFrame+'-'+segment.endFrame} master={master} segment={segment}/>}
      </article>}
      {current.length>0&&<section className="reels-section"><h3>Extracted & requested</h3>{current.map(r=>extracted(r))}</section>}
      {master&&recommended.length>0&&<section className="reels-section"><h3>Recommended cuts <small>{recommended.length}</small></h3>
        <p className="director-minimal-muted">Full SHOT candidates. Preview and shorten where needed before final approval.</p>{recommended.map(candidate)}</section>}
      {master&&others.length>0&&<details className="reels-other"><summary>Other SHOTs to review ({others.length})</summary><div className="reels-section">{others.map(candidate)}</div></details>}
      {previous.length>0&&<details className="reels-other"><summary>Earlier master extracts ({previous.length})</summary><div className="reels-section">{previous.map(r=>extracted(r,true))}</div></details>}
      {master&&<details className="publishing-lineage"><summary><Film size={14}/> Source details</summary><p>{master.frames} frames at 30 fps · {clock(master.frames)}</p><p>SHA-256: {master.sha256}</p></details>}
    </>}
  </section>;
}
