import {useEffect,useRef,useState} from 'react';
import {Check,Copy,Download,FileText,Plus,RefreshCw,X,ExternalLink} from 'lucide-react';
import '../styles/episodeDistributionStudio.css';
import {publicationDescription} from '../lib/distributionPublication';

type Platform={key:string;name:string;discovery:string;dependency:string;policy:string;guidance:string;humanOnly:boolean;editorial:boolean};
type Item={id:string;revision:number;platform:string;kind:string;title:string;body:string;sources:string;assets:string;destination:string;launchDay:number;state:string;evidence:string;publishedUrl:string|null;publishedOn:string|null;masterSha256:string|null;actor:string;recordedAt:string};
type Launch={revision:number;videoUrl:string|null;launchDate:string|null};
type View={episodeKey:string;masterSha256:string|null;editorialQa:boolean;launch:Launch;platforms:Platform[];items:Item[];blockers:string[]};
type Draft={platform:string;kind:string;title:string;body:string;sources:string;assets:string;destination:string;launchDay:number};
const empty:Draft={platform:'MEDIUM',kind:'ARTICLE',title:'',body:'',sources:'',assets:'',destination:'',launchDay:0};
const humanResearch=['HN','INFOQ','DZONE','NEWSLETTER','REDDIT'];
const stateLabel:Record<string,string>={DRAFT:'Draft',APPROVED:'Approved',READY_TO_PUBLISH:'Ready to publish',PUBLISHED:'Published',BLOCKED:'Blocked',SKIPPED:'Skipped'};
const day=(n:number)=>n===0?'Launch day':n<0?'Day '+n:'Day +'+n;
const message=(e:unknown)=>e instanceof Error?e.message:String(e);
async function read<T>(r:Response):Promise<T>{
  if(!r.ok)throw Error('Request failed ('+r.status+'). '+(await r.text()).slice(0,350));
  if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('Sign in again to continue.');
  return r.json() as Promise<T>;
}
function exportText(i:Draft){
  return '# '+i.title+'\n\n'+i.body+(i.sources?'\n\n## References\n'+i.sources:'');
}
function download(name:string,text:string){
  const u=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));
  const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(u),1000);
}
export function EpisodeDistributionStudio({packageId}:{packageId:string}){
  const root='/api/v1/episode-packages/'+encodeURIComponent(packageId)+'/distribution';
  const [data,setData]=useState<View|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [selected,setSelected]=useState<Item|null>(null),[opened,setOpened]=useState(false),[editing,setEditing]=useState(false);
  const [draft,setDraft]=useState<Draft>(empty),[history,setHistory]=useState<Item[]|null>(null);
  const [evidence,setEvidence]=useState(''),[author,setAuthor]=useState(false),[policy,setPolicy]=useState(false),[rights,setRights]=useState(false),[human,setHuman]=useState(false);
  const [publishedUrl,setPublishedUrl]=useState(''),[publishedOn,setPublishedOn]=useState('');
  const [launchEdit,setLaunchEdit]=useState(false),[videoUrl,setVideoUrl]=useState(''),[launchDate,setLaunchDate]=useState('');
  const dialog=useRef<HTMLDialogElement>(null),request=useRef(0);
  async function refresh(){
    const seq=++request.current;setBusy(true);setError('');
    try{const x=await read<View>(await fetch(root,{cache:'no-store'}));if(seq===request.current){setData(x);setVideoUrl(x.launch.videoUrl??'');setLaunchDate(x.launch.launchDate??'');}}
    catch(e){if(seq===request.current)setError(message(e));}finally{if(seq===request.current)setBusy(false);}
  }
  useEffect(()=>{void refresh();return()=>{request.current++;};},[root]);
  useEffect(()=>{if(opened&&!dialog.current?.open)dialog.current?.showModal();if(!opened&&dialog.current?.open)dialog.current.close();},[opened]);
  const platform=(key:string)=>data?.platforms.find(p=>p.key===key);
  function open(i:Item|null){
    setSelected(i);setDraft(i?{platform:i.platform,kind:i.kind,title:i.title,body:i.body,sources:i.sources,assets:i.assets,destination:i.destination,launchDay:i.launchDay}:{...empty});
    setEditing(!i);setHistory(null);setEvidence(i?.evidence??'');setAuthor(false);setPolicy(false);setRights(false);setHuman(false);
    setPublishedUrl('');setPublishedOn('');setError('');setNotice('');setOpened(true);
  }
  function close(){
    if(busy)return;
    if(editing&&!window.confirm('Close editor and discard unsaved changes?'))return;
    setOpened(false);setEditing(false);setError('');setNotice('');
  }
  async function copy(value:string){
    try{await navigator.clipboard.writeText(value);setNotice('Copied. Review before publishing.');}
    catch{setError('Clipboard unavailable. Use Download or select the text.');}
  }
  async function post(url:string,body:unknown){
    setBusy(true);setError('');setNotice('');
    try{const x=await read<View>(await fetch(root+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));setData(x);return x;}
    catch(e){setError(message(e));return null;}finally{setBusy(false);}
  }
  async function save(){
    if(!draft.title.trim()||!draft.body.trim())return;
    if(selected&&['APPROVED','READY_TO_PUBLISH'].includes(selected.state)&&!window.confirm('Save a new draft and retain the approved revision in history?'))return;
    const x=await post('/items',{...draft,id:selected?.id??null,expectedRevision:selected?.revision??0,action:'SAVE',confirm:true});
    if(x){const i=selected?x.items.find(y=>y.id===selected.id):x.items.find(y=>!data?.items.some(z=>z.id===y.id));
      if(i)open(i);else setOpened(false);setNotice('Draft saved.');}
  }
  async function review(action:string){
    if(!selected)return;
    if(!window.confirm(action==='PUBLISH'?'Record a publication that already exists? Nothing is sent to the platform.':'Record this editorial decision for the saved revision?'))return;
    const x=await post('/items',{id:selected.id,expectedRevision:selected.revision,action,confirm:true,evidence,authorReview:author,policyReview:policy,rightsReview:rights,humanAuthored:human,publishedUrl:publishedUrl||null,publishedOn:publishedOn||null});
    if(x){const next=x.items.find(i=>i.id===selected.id);if(next)open(next);setNotice('Editorial decision recorded.');}
  }
  async function saveLaunch(){
    if(!data||!window.confirm(videoUrl?'Confirm this is the actual public YouTube URL and launch date.':'Save planned launch date?'))return;
    const x=await post('/launch',{expectedRevision:data.launch.revision,videoUrl:videoUrl||null,launchDate:launchDate||null,confirm:true});
    if(x){setLaunchEdit(false);setNotice('Launch record saved.');}
  }
  async function versions(){
    if(!selected)return;
    setBusy(true);setError('');
    try{setHistory(await read<Item[]>(await fetch(root+'/items/'+selected.id+'/history',{cache:'no-store'})));}
    catch(e){setError(message(e));}finally{setBusy(false);}
  }
  const p=platform(draft.platform);
  const articles=data?.items.filter(i=>i.kind==='ARTICLE')??[];
  const posts=data?.items.filter(i=>i.kind==='POST'||i.kind==='DISCUSSION')??[];
  const research=data?.items.filter(i=>i.kind==='RESEARCH')??[];
  const validReview=!!selected&&!!data?.editorialQa&&!!data.masterSha256&&selected.masterSha256===data.masterSha256&&author&&policy&&rights&&(!p?.humanOnly||human)&&evidence.trim().length>=20;
  function label(i:Item){
    if(i.state!=='PUBLISHED'&&['APPROVED','READY_TO_PUBLISH'].includes(i.state)&&(!data?.editorialQa||i.masterSha256!==data.masterSha256))return 'Review again';
    return stateLabel[i.state]??i.state;
  }
  function card(i:Item){
    const platformInfo=platform(i.platform);
    return <article className="distribution-card" key={i.id}>
      <div className="distribution-row"><div className="distribution-info"><p className="distribution-meta">{platformInfo?.name??i.platform} · {day(i.launchDay)}{i.kind==='ARTICLE'?' · '+i.body.trim().split(/\s+/).length+' words':''}</p>
        <h3>{i.title}</h3><span className="distribution-state" data-state={label(i)}>{label(i)}</span></div>
        <div className="distribution-actions"><button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>open(i)}><FileText size={15}/> Open</button>
        {i.kind!=='RESEARCH'&&<button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>void copy(exportText(i))}><Copy size={15}/> Copy {i.state==='DRAFT'?'draft':'text'}</button>}</div>
      </div>
      {i.publishedUrl&&<a href={i.publishedUrl} target="_blank" rel="noreferrer">Recorded publication <ExternalLink size={13}/></a>}
    </article>;
  }
  return <section className="distribution-studio" aria-label="Distribution Studio">
    <div className="director-minimal-section-head"><div><p className="director-minimal-eyebrow">Post-production · {data?.episodeKey??'Episode'}</p><h2>Publications</h2></div>
      <button type="button" className="publishing-text-button" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={15}/> Refresh</button></div>
    {!opened&&error&&<p role="alert" className="director-minimal-error">{error}</p>}
    {!opened&&notice&&<p role="status" className="director-minimal-success">{notice}</p>}
    {!data&&!error&&<p className="director-minimal-muted">Loading campaign…</p>}
    {data&&<>
      {data.items.some(i=>i.kind!=='RESEARCH'&&i.state!=='PUBLISHED')&&<p className="distribution-meta">Includes drafts. Review before publishing.</p>}
      <details className="distribution-management">
        <summary>Manage publications</summary>
        <div className="distribution-section">
          <div className="distribution-row"><p className="director-minimal-muted">Draft editing, editorial checks and manual publication records.</p><button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>open(null)}><Plus size={16}/> Add content</button></div>
          {[...articles,...posts].map(card)}
      <div className="distribution-card">
        <div className="distribution-row"><div><h3>YouTube launch</h3><p className="distribution-meta">{data.launch.launchDate??'Date not set'} · {data.launch.videoUrl?'Public URL recorded':'Public URL pending'}</p></div>
          <button type="button" className="director-minimal-subtle" onClick={()=>setLaunchEdit(!launchEdit)}>{launchEdit?'Close':'Edit launch'}</button></div>
        {data.launch.videoUrl&&<div className="distribution-actions"><a href={data.launch.videoUrl} target="_blank" rel="noreferrer">Open video</a><button type="button" className="publishing-text-button" onClick={()=>void copy(data.launch.videoUrl!)}>Copy video link</button></div>}
        {launchEdit&&<div className="distribution-form"><label>Launch date<input type="date" value={launchDate} onChange={e=>setLaunchDate(e.target.value)}/></label>
          <label>Actual public YouTube URL (leave blank before launch)<input value={videoUrl} disabled={!!data.launch.videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…"/></label>
          <button type="button" className="director-minimal-primary" disabled={busy} onClick={()=>void saveLaunch()}>Save launch</button></div>}
      </div>
      {research.length>0&&<details className="distribution-details"><summary>Editorial & community research ({research.length})</summary><p className="director-minimal-muted">Research notes, not submitted articles or verified live discussions.</p><div className="distribution-section">{research.map(card)}</div></details>}
      <details className="distribution-details"><summary>Launch calendar</summary>{data.items.filter(i=>!['BLOCKED','SKIPPED'].includes(i.state)).slice().sort((a,b)=>a.launchDay-b.launchDay).map(i=><div className="distribution-calendar" key={i.id}><strong>{day(i.launchDay)}</strong><span>{platform(i.platform)?.name} · {i.title}</span><small>{label(i)}</small></div>)}</details>
      <details className="distribution-details"><summary>Review before launch ({data.blockers.length})</summary>{data.blockers.length?<ul>{data.blockers.map(b=><li key={b}>{b}</li>)}</ul>:<p>Required campaign evidence recorded. Publication is manual.</p>}</details>
      <details className="distribution-details"><summary>Where to publish · Zero-Follower strategy</summary>{data.platforms.map(p=><div key={p.key} className="distribution-calendar"><strong>{p.name}</strong><span>{p.discovery} · {p.dependency==='NONE'?'Independent discovery':'Secondary amplification'}{p.editorial?' · Editorial acceptance':''}</span>{p.policy&&<a href={p.policy} target="_blank" rel="noreferrer">Rules</a>}</div>)}</details>
        </div>
      </details>
      <div className="distribution-publications" aria-label="Publications">
        {[...articles,...posts].map(i=><article className="distribution-publication" key={i.id}>
          <div className="distribution-publication-platform">{platform(i.platform)?.name??i.platform}</div>
          <div className="distribution-publication-field"><span className="distribution-publication-label">Title</span><h3>{i.title}</h3></div>
          <div className="distribution-publication-field"><span className="distribution-publication-label">Description</span><p>{publicationDescription(i.body)||'No description recorded.'}</p></div>
          <div className="distribution-publication-field">
            <div className="distribution-publication-texthead"><span className="distribution-publication-label">Text</span><button type="button" className="publishing-text-button" disabled={busy} onClick={()=>void copy(exportText(i))}><Copy size={14}/> Copy text</button></div>
            <div className="distribution-publication-text">{i.body}</div>
          </div>
        </article>)}
        {!articles.length&&!posts.length&&<p className="director-minimal-muted">No publications yet.</p>}
      </div>
    </>}
    <dialog ref={dialog} className="publishing-dialog distribution-dialog" aria-label="Editorial content" onCancel={e=>{e.preventDefault();close();}}>
      {opened&&<div className="distribution-form">
        <div className="distribution-row"><div><p className="distribution-meta">{p?.name} · {selected?label(selected):'New draft'}</p><h3>{editing?'Edit content':selected?.title}</h3></div><button type="button" className="publishing-icon-button" disabled={busy} onClick={close} aria-label="Close content"><X size={21}/></button></div>
        {error&&<p role="alert" className="director-minimal-error">{error}</p>}
        {notice&&<p role="status" className="director-minimal-success">{notice}</p>}
        {editing?<><label>Platform<select value={draft.platform} onChange={e=>{const key=e.target.value;setDraft({...draft,platform:key,kind:humanResearch.includes(key)?'RESEARCH':['MEDIUM','DEV','HASHNODE'].includes(key)?'ARTICLE':'POST'});}}>{data?.platforms.map(x=><option key={x.key} value={x.key}>{x.name}</option>)}</select></label>
          <label>Content type<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value})}>{(humanResearch.includes(draft.platform)?['RESEARCH']:['MEDIUM','DEV'].includes(draft.platform)?['ARTICLE']:['ARTICLE','POST','RESEARCH','DISCUSSION']).map(k=><option key={k}>{k}</option>)}</select></label>
          <label>Title<input maxLength={200} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
          <label>Full text<textarea rows={18} value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/></label>
          <label>Sources<textarea rows={4} value={draft.sources} onChange={e=>setDraft({...draft,sources:e.target.value})}/></label>
          <label>Existing visual references / captions<textarea rows={3} value={draft.assets} onChange={e=>setDraft({...draft,assets:e.target.value})}/></label>
          <label>Destination / community<input value={draft.destination} onChange={e=>setDraft({...draft,destination:e.target.value})}/></label>
          <label>Day relative to YouTube launch<input type="number" min={-30} max={365} value={draft.launchDay} onChange={e=>setDraft({...draft,launchDay:Number(e.target.value)})}/></label>
          <button type="button" className="director-minimal-primary" disabled={busy||!draft.title.trim()||!draft.body.trim()} onClick={()=>void save()}>Save draft</button>
        </>:selected&&<>
          <div className="distribution-actions">{selected.kind!=='RESEARCH'&&<button type="button" className="director-minimal-subtle" onClick={()=>void copy(exportText(selected))}><Copy size={15}/> Copy text</button>}
            <button type="button" className="director-minimal-subtle" onClick={()=>download((data?.episodeKey??'episode')+'-'+selected.id+'.md',exportText(selected))}><Download size={15}/> Download {selected.kind==='RESEARCH'?'notes':'Markdown'}</button>
            {selected.state!=='PUBLISHED'&&<button type="button" className="director-minimal-primary" disabled={busy} onClick={()=>setEditing(true)}>Edit</button>}</div>
          <pre className="distribution-body">{selected.body}</pre>
          <details className="distribution-details"><summary>Sources & existing visual references</summary><pre>{selected.sources}</pre><pre>{selected.assets}</pre></details>
          <details className="distribution-details"><summary>Destination & platform rules</summary><p>{selected.destination}</p><p>{p?.guidance}</p>{p?.policy&&<a href={p.policy} target="_blank" rel="noreferrer">Read current rules</a>}</details>
          {selected.state!=='PUBLISHED'&&<details className="distribution-details"><summary>Review & publication status</summary>
            {selected.kind==='RESEARCH'?<p>Research only. Human participation or submission takes place outside Media OS.</p>:<>
              <p className="director-minimal-muted">{data?.editorialQa?'Publishing editorial/rights QA recorded.':'Complete editorial and rights checks in Publishing first.'} {p?.humanOnly?'Human original authorship required for this route.':''}</p>
              <label className="distribution-check"><input type="checkbox" checked={author} onChange={e=>setAuthor(e.target.checked)}/> I reviewed the full text and facts.</label>
              <label className="distribution-check"><input type="checkbox" checked={policy} onChange={e=>setPolicy(e.target.checked)}/> I checked the actual destination, current rules, account eligibility and required disclosure.</label>
              <label className="distribution-check"><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)}/> I cleared rights and originality, including any visuals.</label>
              {p?.humanOnly&&<label className="distribution-check"><input type="checkbox" checked={human} onChange={e=>setHuman(e.target.checked)}/> I personally authored the substantive final content; AI support is accurately disclosed.</label>}
              {selected.state==='READY_TO_PUBLISH'&&<><label>Actual published URL<input value={publishedUrl} onChange={e=>setPublishedUrl(e.target.value)}/></label><label>Publication date<input type="date" value={publishedOn} onChange={e=>setPublishedOn(e.target.value)}/></label></>}
            </>}
            <label>Review evidence / policy date / reason<textarea rows={4} value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
            <div className="distribution-actions">{selected.kind!=='RESEARCH'&&<button type="button" className="director-minimal-primary" disabled={busy||!validReview||(selected.state==='READY_TO_PUBLISH'&&(!publishedUrl||!publishedOn))} onClick={()=>void review(selected.state==='READY_TO_PUBLISH'?'PUBLISH':selected.state==='APPROVED'?'READY':'APPROVE')}><Check size={15}/>{selected.state==='READY_TO_PUBLISH'?'Record published':selected.state==='APPROVED'?'Mark ready':'Approve'}</button>}
              <button type="button" className="director-minimal-subtle" disabled={busy||!evidence.trim()} onClick={()=>void review('BLOCK')}>Block</button><button type="button" className="director-minimal-subtle" disabled={busy||!evidence.trim()} onClick={()=>void review('SKIP')}>Skip</button></div>
          </details>}
          <button type="button" className="publishing-text-button" disabled={busy} onClick={()=>void versions()}>Version history</button>
          {history&&<details open className="distribution-details"><summary>{history.length} saved revisions</summary>{history.map(i=><details key={i.revision}><summary>Revision {i.revision} · {stateLabel[i.state]}</summary><pre>{i.body}</pre><p>{i.evidence}</p></details>)}</details>}
        </>}
      </div>}
    </dialog>
  </section>;
}
