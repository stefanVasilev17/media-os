import {useEffect,useState} from 'react';
import {Check,Copy,Download,FileText,History,RefreshCw,Save,Upload} from 'lucide-react';
import '../styles/episodePublishingStudio.css';

type Item={fieldKey:string;revision:number;value:string;state:string;origin:string;
  masterSha256:string|null;recordedAt:string|null;objectSha256:string|null;
  objectBytes:number|null;objectType:string|null;thumbnailUrl:string|null};
type Master={filmId:string;sha256:string;durationInFrames:number;shotCount:number;complete:boolean};
type Studio={packageId:string;episodeKey:string;master:Master|null;items:Item[];
  blockers:string[];readyForDirectorRelease:boolean;releaseRecorded:boolean;assembledDescription:string};
const sections=[
  {label:'Identity',fields:[['TITLE','YouTube title'],['THUMBNAIL_DESIGN','Thumbnail design'],['THUMBNAIL_ASSET','Thumbnail image']]},
  {label:'Publishing package',fields:[['DESCRIPTION','Description'],['CHAPTERS','Chapters'],['TAGS','SEO tags'],['HASHTAGS','Hashtags'],['SOURCES','Technical sources'],['DISCLAIMER','Editorial disclaimer'],['PINNED_COMMENT','Pinned comment'],['UPLOAD_SETTINGS','Upload settings']]},
  {label:'Narration & captions',fields:[['AUDIO_DIRECTION','Audio direction'],['TRANSCRIPT','English transcript'],['SUBTITLES_SRT','English SRT']]},
  {label:'Final QA',fields:[['QA_MASTER','Master QA'],['QA_AUDIO','Audio QA'],['QA_EDITORIAL','Editorial accuracy'],['QA_RIGHTS','Rights & trademark'],['QA_CAPTIONS','Caption QA'],['QA_UPLOAD','Private upload QA'],['QA_RELEASE','Director release approval']]}
];
const labels:Record<string,string>=Object.fromEntries(sections.flatMap(s=>s.fields));
const errorText=(e:unknown)=>e instanceof Error?e.message:String(e);
async function result<T>(r:Response):Promise<T>{
  if(!r.ok)throw Error('HTTP '+r.status+': '+(await r.text()).slice(0,350));
  if(!(r.headers.get('content-type')||'').includes('application/json'))
    throw Error('Your Director session may have expired. Reload the workspace and sign in.');
  return r.json() as Promise<T>;
}
function downloadText(filename:string,body:string){
  const url=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=filename;
  document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function displayState(item:Item,master:Master|null){
  if((item.state==='APPROVED'||item.state==='PASS')&&master?.sha256!==item.masterSha256)return 'STALE';
  return item.state;
}

export function EpisodePublishingStudio({packageId}:{packageId:string}){
  const root='/api/v1/episode-packages/'+encodeURIComponent(packageId)+'/publishing';
  const [data,setData]=useState<Studio|null>(null);
  const [selected,setSelected]=useState('TITLE');
  const [draft,setDraft]=useState('');
  const [history,setHistory]=useState<Item[]|null>(null);
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const item=data?.items.find(i=>i.fieldKey===selected);
  const dirty=!!item&&draft!==item.value;
  const qa=selected.startsWith('QA_');
  const asset=selected==='THUMBNAIL_ASSET';

  function accept(next:Studio,field:string){
    if(next.packageId!==packageId)throw Error('Publishing response has the wrong episode.');
    setData(next);setDraft(next.items.find(i=>i.fieldKey===field)?.value??'');
    setHistory(null);setFile(null);
  }
  useEffect(()=>{
    let live=true;const controller=new AbortController();
    setBusy(true);setError('');setData(null);
    void fetch(root,{cache:'no-store',signal:controller.signal}).then(result<Studio>)
      .then(next=>{if(live)accept(next,'TITLE');})
      .catch(e=>{if(live)setError(errorText(e));})
      .finally(()=>{if(live)setBusy(false);});
    return()=>{live=false;controller.abort();};
  },[root]);

  function select(key:string){
    if(busy||key===selected)return;
    if((dirty||file)&&!window.confirm('Discard unsaved publishing edits?'))return;
    setSelected(key);setDraft(data?.items.find(x=>x.fieldKey===key)?.value??'');
    setHistory(null);setFile(null);setError('');setNotice('');
  }
  async function refresh(){
    if(busy||((dirty||file)&&!window.confirm('Discard unsaved edits and reload saved publishing data?')))return;
    setBusy(true);setError('');setNotice('');
    try{accept(await result<Studio>(await fetch(root,{cache:'no-store'})),selected);}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  }
  async function change(action:string){
    if(!item||busy)return;
    if(action==='APPROVE'&&dirty)return;
    const needsConfirmation=action!=='SAVE'||item.state==='APPROVED';
    if(needsConfirmation&&!window.confirm(action==='APPROVE'
      ?'Approve this exact saved revision for the current Full Video?'
      :action==='PASS'?'Record your evidence-based Director QA result? This does not publish to YouTube.'
      :action==='SAVE'?'Create a new draft revision? The approved version stays in history.'
      :'Record this QA status?'))return;
    setBusy(true);setError('');setNotice('');
    try{
      const next=await result<Studio>(await fetch(root+'/items/'+encodeURIComponent(selected),{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:item.revision,action,value:action==='APPROVE'?item.value:draft,confirm:needsConfirmation})
      }));
      accept(next,selected);setNotice('Saved '+labels[selected]+' · '+(next.items.find(x=>x.fieldKey===selected)?.state??''));
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  }
  async function upload(){
    if(!item||!file||busy)return;
    if(file.size>2*1024*1024){setError('Thumbnail must be no larger than 2 MiB.');return;}
    if(!window.confirm('Archive this exact PNG/JPEG in existing private storage? No image generation or video rendering.'))return;
    const form=new FormData();form.append('file',file);form.append('expectedRevision',String(item.revision));form.append('confirm','true');
    setBusy(true);setError('');setNotice('');
    try{
      accept(await result<Studio>(await fetch(root+'/thumbnail',{method:'POST',body:form})),selected);
      setNotice('Thumbnail archived. Preview and approve the saved image revision.');
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  }
  async function loadHistory(){
    if(!item||busy)return;
    setBusy(true);setError('');
    try{setHistory(await result<Item[]>(await fetch(root+'/items/'+encodeURIComponent(selected)+'/history',{cache:'no-store'})));}
    catch(e){setError(errorText(e));}finally{setBusy(false);}
  }
  async function copy(value:string){
    try{await navigator.clipboard.writeText(value);setNotice('Copied to clipboard.');setError('');}
    catch(e){setError('Clipboard unavailable. Select the text or download it instead.');}
  }
  async function loadSrt(input:File|null){
    if(!input)return;
    if(input.size>262144){setError('SRT file exceeds the 256 KiB text limit.');return;}
    try{setDraft(await input.text());setError('');}catch(e){setError(errorText(e));}
  }
  const master=data?.master??null;
  const approved=data?.items.filter(x=>displayState(x,master)==='APPROVED'||displayState(x,master)==='PASS').length??0;
  return <section className="director-minimal-panel publishing-studio" aria-label="Publishing Studio">
    <div className="director-minimal-section-head">
      <div><p className="director-minimal-eyebrow">Post-production · TIER++</p><h2>Publishing Studio</h2></div>
      <button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={15}/> Refresh</button>
    </div>
    <p className="director-minimal-muted">Edit and approve the publishing package. Technical QA remains separate. No action here publishes externally or modifies the Full Video.</p>
    {error&&<p role="alert" className="director-minimal-error">{error}</p>}
    {notice&&<p role="status" className="director-minimal-success">{notice}</p>}
    {!data&&<p className="director-minimal-muted">{busy?'Opening publishing metadata…':'Publishing metadata could not be loaded.'}</p>}
    {data&&<>
      <div className="publishing-summary">
        <div><span>Master</span><strong>{master?.complete?'Complete':'Not ready'}</strong></div>
        <div><span>Approved / QA pass</span><strong>{approved} / {data.items.length}</strong></div>
        <div><span>Publishing status</span><strong>{data.releaseRecorded?'Director approval recorded':data.readyForDirectorRelease?'Ready for Director review':'QA pending'}</strong></div>
      </div>
      {master&&<details className="publishing-lineage"><summary>Current master · {master.shotCount} SHOTs · {master.durationInFrames} frames</summary>
        <p>Film ID: {master.filmId}</p><p>SHA-256: {master.sha256}</p>
      </details>}
      <div className="publishing-workspace">
        <nav className="publishing-nav" aria-label="Publishing fields">
          {sections.map(s=><div key={s.label}><h3>{s.label}</h3>
            {s.fields.map(([key,label])=>{const x=data.items.find(y=>y.fieldKey===key);return <button
              type="button" key={key} className={selected===key?'publishing-nav-item selected':'publishing-nav-item'}
              aria-current={selected===key?'page':undefined} disabled={busy} onClick={()=>select(key)}>
              <span>{label}</span><small data-state={x?displayState(x,master):'DRAFT'}>{x?displayState(x,master):'DRAFT'}</small>
            </button>;})}
          </div>)}
        </nav>
        {item&&<div className="publishing-editor">
          <div className="publishing-editor-heading"><div><h3>{labels[selected]}</h3>
            <p className="director-minimal-muted">Revision {item.revision||'—'} · {displayState(item,master)}{item.origin==='DIRECTOR_CHAT_2026_11_27'?' · Approved package import (chat)':''}</p></div>
            <button type="button" className="director-minimal-subtle" disabled={busy||!item.revision} onClick={()=>void loadHistory()}><History size={15}/> History</button></div>
          {asset?<div className="publishing-asset">
            {item.thumbnailUrl?<><img src={item.thumbnailUrl} alt="Archived publishing thumbnail"/><p className="publishing-lineage">SHA-256: {item.objectSha256}</p>
              <a className="director-minimal-subtle" href={item.thumbnailUrl} download={data.episodeKey+'-thumbnail.'+(item.objectType==='image/jpeg'?'jpg':'png')}><Download size={15}/> Download image</a></>
              :<p className="director-minimal-muted">No thumbnail binary archived yet. Upload the approved original PNG/JPEG. The thumbnail design approval is separate from rights clearance.</p>}
            <label>Archive exact image <input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e=>setFile(e.currentTarget.files?.[0]??null)}/></label>
            <button type="button" className="director-minimal-subtle" disabled={!file||busy} onClick={()=>void upload()}><Upload size={15}/> Upload image</button>
          </div>:<>
            {qa&&<p className="director-minimal-muted">Record the actual evidence, review method and conclusion. PASS is a Director attestation, not an automated technical test.</p>}
            {selected==='SUBTITLES_SRT'&&<label className="publishing-file">Import synchronized SRT <input type="file" accept=".srt,text/plain" disabled={busy} onChange={e=>void loadSrt(e.currentTarget.files?.[0]??null)}/></label>}
            <textarea aria-label={labels[selected]} className="director-minimal-script publishing-text" rows={selected==='TITLE'?2:selected==='TRANSCRIPT'||selected==='SUBTITLES_SRT'?17:12} value={draft} disabled={busy}
              onChange={e=>setDraft(e.target.value)}/>
            <p className="director-minimal-muted">{draft.length} characters{selected==='TITLE'?' / 100':selected==='TAGS'?' / 500':selected==='DESCRIPTION'?' / 5000':''}{dirty?' · Unsaved edits':''}</p>
          </>}
          <div className="publishing-actions">
            {qa?<>{['PENDING','FAIL','PASS'].map(action=><button type="button" className={action==='PASS'?'director-minimal-primary':'director-minimal-subtle'} key={action}
              disabled={busy||(action==='PASS'&&(!master?.complete||draft.trim().length<12||(selected==='QA_RELEASE'&&!data.readyForDirectorRelease)))} onClick={()=>void change(action)}>{action==='PASS'?<Check size={15}/>:null} Record {action}</button>)}</>:<>
              {!asset&&<button type="button" className="director-minimal-subtle" disabled={busy||!dirty} onClick={()=>void change('SAVE')}><Save size={15}/> Save new revision</button>}
              <button type="button" className="director-minimal-primary" disabled={busy||dirty||!item.revision||!item.value.trim()||!master?.complete||(item.state==='APPROVED'&&displayState(item,master)!=='STALE')}
                onClick={()=>void change('APPROVE')}><Check size={15}/> Director approve</button>
            </>}
            {!asset&&<><button type="button" className="director-minimal-subtle" disabled={busy||!draft} onClick={()=>void copy(draft)}><Copy size={15}/> Copy</button>
              <button type="button" className="director-minimal-subtle" disabled={busy||!draft} onClick={()=>downloadText(data.episodeKey+'-'+selected.toLowerCase()+(selected==='SUBTITLES_SRT'?'.srt':'.txt'),draft)}><Download size={15}/> Export</button></>}
          </div>
          {history&&<details open className="publishing-history"><summary>Immutable revision history ({history.length})</summary>
            {history.map(x=><details key={x.revision}><summary>Revision {x.revision} · {x.state} · {x.recordedAt?new Date(x.recordedAt).toLocaleString():''}</summary>
              <p className="publishing-lineage">Origin: {x.origin} · Master: {x.masterSha256??'unbound'}</p>
              {x.thumbnailUrl?<img src={x.thumbnailUrl} alt={'Thumbnail revision '+x.revision}/>:<pre>{x.value}</pre>}
            </details>)}</details>}
        </div>}
      </div>
      <details className="publishing-combined">
        <summary><FileText size={16}/> Complete YouTube description ({data.assembledDescription.length} / 5000)</summary>
        <pre>{data.assembledDescription}</pre>
        <div className="publishing-actions"><button type="button" className="director-minimal-subtle" onClick={()=>void copy(data.assembledDescription)}><Copy size={15}/> Copy complete description</button>
          <button type="button" className="director-minimal-subtle" onClick={()=>downloadText(data.episodeKey+'-youtube-description.txt',data.assembledDescription)}><Download size={15}/> Export</button></div>
      </details>
      <details className="publishing-blockers" open={data.blockers.length>0}>
        <summary>Final publishing blockers ({data.blockers.length})</summary>
        {data.blockers.length===0?<p>Technical and editorial review attestations are recorded for this master. Public release is a separate manual action.</p>:
          <ul>{data.blockers.map((x,i)=><li key={i}>{x}</li>)}</ul>}
      </details>
    </>}
  </section>;
}
