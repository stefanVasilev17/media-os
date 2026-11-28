import {useEffect,useRef,useState} from 'react';
import {Check,Download,Film,Play,RefreshCw} from 'lucide-react';
import {directorMutation} from '../auth/localSession';
type Source={id:string;title:string;sha256:string|null;state:string};
type Vertical={reelId:string;title:string;state:string;templateVersion:string;sourceSha256:string;sha256:string|null;byteCount:number|null;issue:string|null;videoUrl:string|null;focusStartFrame:number|null};
const VERSION="AT_VERTICAL_V2";
async function read(r:Response):Promise<Vertical[]>{
  if(!r.ok)throw Error('Request failed ('+r.status+'). '+(await r.text()).slice(0,250));
  if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('Sign in again.');
  return r.json() as Promise<Vertical[]>;
}
export function VerticalReelsPanel({root,sources}:{root:string;sources:Source[]}){
  const [rows,setRows]=useState<Vertical[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[playing,setPlaying]=useState<string|null>(null);
  const seq=useRef(0);
  async function refresh(){
    const n=++seq.current;
    try{const value=await read(await fetch(root+'/vertical',{cache:'no-store'}));if(n===seq.current)setRows(value);}
    catch(e){if(n===seq.current)setError(e instanceof Error?e.message:String(e));}
  }
  useEffect(()=>{void refresh();return()=>{seq.current++;};},[root]);
  const active=rows.some(r=>r.state==='QUEUED'||r.state==='RUNNING');
  useEffect(()=>{if(!active||busy)return;const id=window.setInterval(()=>void refresh(),5000);return()=>window.clearInterval(id);},[active,busy,root]);
  async function mutate(source:Source,action:'package'|'lock',sha:string){
    const message=action==='package'?'Create a separate AT Vertical V2 1080 × 1920 MP4 using bounded FFmpeg CPU and private storage? The locked original and its audio remain unchanged. Only a verified compact scene may be enlarged; all other frames keep the full picture.':'Confirm you watched the actual vertical MP4 on a phone-sized screen and verified legibility, narration and safe placement. Lock this exact artifact?';
    if(busy||!window.confirm(message))return;
    setBusy(true);setError('');seq.current++;
    try{setRows(await read(await directorMutation(root+'/'+source.id+'/vertical/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action==='package'?{sourceSha256:sha,confirm:true}:{sha256:sha,confirm:true})})));}
    catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  const eligible=sources.filter(s=>s.state==='LOCKED'&&s.sha256);
  const locked=eligible.filter(s=>rows.some(r=>r.reelId===s.id&&r.templateVersion===VERSION&&r.state==='LOCKED'&&r.sourceSha256===s.sha256)).length;
  return <section className="reels-section" aria-label="Vertical packaging">
    <div className="reels-intro"><div><strong>{locked} / {eligible.length} vertical clips locked</strong><p>AT Vertical V1 · 1080 × 1920 · Full view by default · verified compact-stage focus · original narration · no new animation.</p></div>
      <button type="button" className="publishing-text-button" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={15}/> Refresh</button></div>
    {error&&<p role="alert" className="director-minimal-error">{error}</p>}
    <p className="reels-format">Start with one clip. Review actual mobile readability before packaging the others. Platform overlays vary; check in the native app before publishing.</p>
    {eligible.map(s=>{
      const r=rows.find(v=>v.reelId===s.id&&v.sourceSha256===s.sha256&&v.templateVersion===VERSION);
      const earlier=rows.filter(v=>v.reelId===s.id&&v.sourceSha256===s.sha256&&v.templateVersion!==VERSION);
      return <article className="reels-card" key={s.id}>
        <div className="reels-row"><div className="reels-info"><h3>{s.title}</h3><p>Source locked · {r?.state==='LOCKED'?'Vertical locked':r?.state==='READY'?'Ready for review':r?.state==='RUNNING'?'Packaging…':r?.state==='QUEUED'?'Queued':r?.state==='FAILED'?'Needs retry':'Vertical pending'}</p></div>
          <div className="reels-actions">
            {(!r||r.state==='FAILED')&&<button type="button" disabled={busy} className="director-minimal-primary" onClick={()=>void mutate(s,'package',s.sha256!)}><Film size={15}/> {r?'Retry':'Package'}</button>}
            {r?.videoUrl&&<button type="button" className="director-minimal-subtle" onClick={()=>setPlaying(old=>old===s.id?null:s.id)}><Play size={15}/> Preview</button>}
            {r?.state==='READY'&&r.sha256&&<button type="button" disabled={busy||playing!==s.id} className="director-minimal-primary" onClick={()=>void mutate(s,'lock',r.sha256!)}><Check size={15}/> Lock</button>}
            {r?.state==='LOCKED'&&r.videoUrl&&<a className="reels-download" href={r.videoUrl+'&download=true'}><Download size={15}/> Download</a>}
          </div></div>
        {r?.focusStartFrame!=null&&<p className="director-minimal-muted">Verified focus begins at {(r.focusStartFrame/30).toFixed(2)}s.</p>}
        {r?.issue&&<p className="director-minimal-muted">{r.issue}</p>}
        {playing===s.id&&r?.videoUrl&&<div className="reels-vertical-preview"><video src={r.videoUrl} controls playsInline preload="metadata"/><p>Actual AT Vertical V2 MP4 · Review all framing changes on a phone-sized screen.</p></div>}
        {earlier.length>0&&<details className="reels-other"><summary>Earlier packaging ({earlier.length})</summary>{earlier.map(v=><div key={v.templateVersion}><p>{v.templateVersion} · {v.state}</p>{v.videoUrl&&<div className="reels-vertical-preview"><video src={v.videoUrl} controls playsInline preload="none"/></div>}</div>)}</details>}
      </article>;
    })}
    {eligible.length===0&&<p className="director-minimal-muted">Lock an original extract first.</p>}
  </section>;
}
