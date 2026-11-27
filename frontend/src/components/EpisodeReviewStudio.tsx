import {useEffect,useRef,useState} from 'react';
import {Check,Copy,FileText,Plus,RefreshCw,X} from 'lucide-react';
import '../styles/episodeDistributionStudio.css';

type Gate={name:string;status:string;detail:string};
type Item={id:string;revision:number;kind:string;category:string;scope:string;classification:string;title:string;body:string;applicability:string;evidence:string;metric:string|null;value:number|null;currency:string|null;periodStart:string|null;periodEnd:string|null;state:string;masterSha256:string;contextSha256:string;actor:string;auditId:string;recordedAt:string};
type Previous={episodeKey:string;packageId:string;item:Item};
type View={episodeKey:string;masterSha256:string|null;contextSha256:string;gates:Gate[];blockers:string[];launchRecorded:boolean;launchDate:string|null;items:Item[];previous:Previous[]};
type Draft={kind:string;category:string;scope:string;classification:string;title:string;body:string;applicability:string;evidence:string;metric:string;value:string;currency:string;periodStart:string;periodEnd:string};
const categories=['VISUAL','STORY','TECHNICAL','VOICE','PRODUCTION','PUBLISHING','REELS','DISTRIBUTION','AUDIENCE'];
const metrics=['VIEWS','IMPRESSIONS','CTR_PERCENT','AVD_SECONDS','AVERAGE_PERCENT_VIEWED','AUDIENCE_RETENTION','TRAFFIC_SOURCES','AUDIENCE_GEOGRAPHY','RPM','REELS_PERFORMANCE','ARTICLE_PERFORMANCE','REFERRAL_TRAFFIC','SUBSCRIBERS_GAINED'];
const label=(s:string)=>s.toLowerCase().replaceAll('_',' ').replace(/^./,x=>x.toUpperCase());
const sections=[{name:'What worked well',kind:'STRENGTH'},{name:'Problems & improvements',kind:'PROBLEM'},{name:'Lessons learned',kind:'LESSON'},{name:'Permanent production rules',kind:'RULE'},{name:'Next episode recommendations',kind:'RECOMMENDATION'},{name:'Post-release analytics',kind:'ANALYTICS'},{name:'Final review & Director approval',kind:'CONCLUSION'}];
function blank(kind:string):Draft{return {kind,category:kind==='ANALYTICS'?'AUDIENCE':'PRODUCTION',scope:kind==='RULE'?'CHANNEL':'EPISODE',classification:kind==='RULE'?'PERMANENT_RULE':'OBSERVATION',title:'',body:'',applicability:'',evidence:'',metric:'VIEWS',value:'',currency:'',periodStart:'',periodEnd:''};}
function fromItem(i:Item):Draft{return {...i,metric:i.metric??'VIEWS',value:i.value==null?'':String(i.value),currency:i.currency??'',periodStart:i.periodStart??'',periodEnd:i.periodEnd??''};}
async function read<T>(r:Response):Promise<T>{if(!r.ok)throw Error('Request failed ('+r.status+'). '+(await r.text()).slice(0,350));if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('Sign in again to continue.');return r.json() as Promise<T>;}
const message=(e:unknown)=>e instanceof Error?e.message:String(e);
export function EpisodeReviewStudio({packageId}:{packageId:string}){
 const root='/api/v1/episode-packages/'+encodeURIComponent(packageId)+'/review';
 const [data,setData]=useState<View|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [selected,setSelected]=useState<Item|null>(null),[draft,setDraft]=useState<Draft>(blank('LESSON')),[opened,setOpened]=useState(false),[editing,setEditing]=useState(false);
 const [history,setHistory]=useState<Item[]|null>(null),[category,setCategory]=useState(''),[previous,setPrevious]=useState<Previous[]>([]);
 const dialog=useRef<HTMLDialogElement>(null),seq=useRef(0),previousSeq=useRef(0),pending=useRef(false);
 async function refresh(){const n=++seq.current;setBusy(true);setError('');try{const x=await read<View>(await fetch(root,{cache:'no-store'}));if(n===seq.current){setData(x);setPrevious(x.previous);setCategory('');}}catch(e){if(n===seq.current)setError(message(e));}finally{if(n===seq.current)setBusy(false);}}
 useEffect(()=>{void refresh();return()=>{seq.current++;previousSeq.current++;};},[root]);
 useEffect(()=>{if(opened&&!dialog.current?.open)dialog.current?.showModal();if(!opened&&dialog.current?.open)dialog.current.close();},[opened]);
 function open(i:Item|null,kind:string){setSelected(i);setDraft(i?fromItem(i):blank(kind));setHistory(null);setEditing(!i);setOpened(true);setError('');setNotice('');}
 function close(){if(busy)return;if(editing&&!window.confirm('Discard unsaved review edits?'))return;setOpened(false);setEditing(false);setHistory(null);setError('');}
 function field<K extends keyof Draft>(key:K,value:Draft[K]){setDraft(d=>({...d,[key]:value}));}
 function stale(i:Item){return i.masterSha256!==data?.masterSha256||(i.kind==='CONCLUSION'&&i.contextSha256!==data?.contextSha256);}
 async function post(action:string){
  if(pending.current||!data?.masterSha256)return;
  if(action==='APPROVE'&&!window.confirm('Approve this exact saved review revision? This does not authorize public release.'))return;
  if(action==='RETIRE'&&!window.confirm('Retire this record from active reuse? History is preserved.'))return;
  if(action==='SAVE'&&selected?.state==='APPROVED'&&!window.confirm('Save a new draft and retain the approved revision in history?'))return;
  const analytics=draft.kind==='ANALYTICS';
  const body=action==='SAVE'?{...draft,metric:analytics?draft.metric:null,value:analytics&&draft.value.trim()!==''?Number(draft.value):null,currency:analytics&&draft.metric==='RPM'?draft.currency:null,periodStart:analytics?draft.periodStart||null:null,periodEnd:analytics?draft.periodEnd||null:null}:{};
  pending.current=true;setBusy(true);setError('');setNotice('');
  try{
   const x=await read<View>(await fetch(root+'/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,id:selected?.id??null,expectedRevision:selected?.revision??0,action,confirm:true})}));
   const next=selected?x.items.find(i=>i.id===selected.id):x.items.find(i=>!data.items.some(j=>j.id===i.id));
   setData(x);setPrevious(x.previous);setCategory('');previousSeq.current++;
   if(next){setSelected(next);setDraft(fromItem(next));setEditing(false);setHistory(null);}
   setNotice(action==='SAVE'?'Draft saved.':action==='APPROVE'?'Director approval recorded.':'Record retired.'); 
  }catch(e){setError(message(e));}finally{pending.current=false;setBusy(false);}
 }
 async function filter(next:string){setCategory(next);const n=++previousSeq.current;setPrevious([]);try{const x=await read<Previous[]>(await fetch(root+'/previous'+(next?'?category='+encodeURIComponent(next):''),{cache:'no-store'}));if(n===previousSeq.current)setPrevious(x);}catch(e){if(n===previousSeq.current)setError(message(e));}}
 async function versions(){if(!selected)return;setBusy(true);try{setHistory(await read<Item[]>(await fetch(root+'/items/'+selected.id+'/history',{cache:'no-store'})));}catch(e){setError(message(e));}finally{setBusy(false);}}
 async function copyPrevious(){try{await navigator.clipboard.writeText(previous.map(p=>'## '+p.episodeKey+' — '+p.item.title+'\n'+p.item.kind+' / '+p.item.classification+' / revision '+p.item.revision+'\n'+p.item.body+'\nApplicability: '+p.item.applicability+'\nEvidence: '+p.item.evidence+'\nMaster SHA-256: '+p.item.masterSha256).join('\n\n'));setNotice('Approved records copied. Existing canonical production rules remain binding.');}catch{setError('Clipboard unavailable.');}}
 function display(i:Item){return <><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{i.body}</p>{i.metric&&<p>{label(i.metric)}: {i.value??'See recorded breakdown'} {i.currency??''} · {i.periodStart} – {i.periodEnd}</p>}{i.applicability&&<p><strong>Applicability:</strong> {i.applicability}</p>}<details className="distribution-details"><summary>Evidence & source</summary><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{i.evidence}</p><p>Revision {i.revision} · {i.recordedAt}</p><p style={{overflowWrap:'anywhere'}}>Master SHA-256: {i.masterSha256}</p><p style={{overflowWrap:'anywhere'}}>Audit: {i.auditId}</p></details></>;}
 const currentConclusion=data?.items.find(i=>i.kind==='CONCLUSION'&&i.state==='APPROVED'&&!stale(i));
 return <section className="distribution-studio" aria-label="Review & Learning">
  <div className="director-minimal-section-head"><div><p className="director-minimal-eyebrow">Post-production · {data?.episodeKey??'Episode'}</p><h2>Review & Learning</h2></div><button type="button" className="publishing-text-button" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={15}/> Refresh</button></div>
  {error&&!opened&&<p role="alert" className="director-minimal-error">{error}</p>}{notice&&!opened&&<p role="status">{notice}</p>}
  {!data&&<p>{busy?'Opening review…':'Review not available.'}</p>}
  {data&&<>
   <section className="distribution-section"><h3>Episode review</h3><div className="distribution-card">{data.gates.map(g=><div className="distribution-row" key={g.name} style={{padding:'10px 0'}}><div className="distribution-info"><strong>{g.name}</strong><p className="distribution-meta">{g.detail}</p></div><span className="distribution-state" data-state={g.status==='PASS'?'Approved':g.status==='FAIL'?'Blocked':'Pending'}>{g.status}</span></div>)}
    <details className="distribution-details"><summary>Open checks & release blockers ({data.blockers.length})</summary>{data.blockers.length?data.blockers.map((b,i)=><p key={i}>{b}</p>):<p>No open checks reported by the connected modules.</p>}</details></div>
    {!data.masterSha256&&<p className="distribution-meta">Complete current Full Video before saving new review records. Previous approved conclusions remain available.</p>}
   </section>
   <section className="distribution-section"><div className="distribution-row"><h3>Previous episode conclusions</h3><button type="button" disabled={!previous.length} className="director-minimal-subtle" onClick={()=>void copyPrevious()}><Copy size={15}/> Copy approved records</button></div>
    <div className="distribution-card"><div className="distribution-form"><label>Filter by category<select value={category} onChange={e=>void filter(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label></div>
    <p className="distribution-meta">Latest 50 applicable approved records, permanent rules first. Review these before planning; hypotheses are not binding rules.</p>
    {!previous.length&&<p>No matching approved records in Media OS. Existing GitHub production rules remain mandatory.</p>}
    {previous.map(p=><details className="distribution-details" key={p.packageId+p.item.id}><summary>{p.episodeKey} · {p.item.title} — {label(p.item.kind)}</summary><p>{label(p.item.category)} · {label(p.item.classification)}</p>{display(p.item)}</details>)}</div>
   </section>
   {sections.map(s=>{const list=data.items.filter(i=>i.kind===s.kind&&i.state!=='RETIRED');return <section className="distribution-section" key={s.kind}>
    <div className="distribution-row"><h3>{s.name}</h3><button type="button" className="director-minimal-subtle" disabled={busy||!data.masterSha256||(s.kind==='ANALYTICS'&&!data.launchRecorded)} onClick={()=>open(null,s.kind)}><Plus size={15}/> Add</button></div>
    {s.kind==='ANALYTICS'&&<p className="distribution-meta">{data.launchRecorded?'Manual source-backed observations only. Suggested review periods: 24–48 hours, 7 days, 30 days or later.':'Awaiting recorded public launch. No analytics have been inferred.'}</p>}
    {s.kind==='CONCLUSION'&&<p className="distribution-meta">{currentConclusion?'Current conclusion approved.':'Conclusion pending or requires refreshed review.'} Production conclusions do not need future analytics and never authorize release.</p>}
    {!list.length&&<p className="distribution-meta">No records yet.</p>}
    {list.map(i=><article className="distribution-card" key={i.id}><div className="distribution-row"><div className="distribution-info"><p className="distribution-meta">{label(i.category)} · {label(i.classification)} · {label(i.scope)}</p><h3>{i.title}</h3><span className="distribution-state" data-state={stale(i)?'Review again':i.state==='APPROVED'?'Approved':'Draft'}>{stale(i)?'Review again':label(i.state)}</span></div><button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>open(i,i.kind)}><FileText size={15}/> Open</button></div><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{i.body}</p></article>)}
    </section>;})}
   {data.items.some(i=>i.state==='RETIRED')&&<details className="distribution-details"><summary>Retired records</summary>{data.items.filter(i=>i.state==='RETIRED').map(i=><p key={i.id}><button type="button" className="director-minimal-subtle" onClick={()=>open(i,i.kind)}>{i.title}</button></p>)}</details>}
  </>}
  <dialog ref={dialog} className="publishing-dialog distribution-dialog" onCancel={e=>{e.preventDefault();close();}}>
   <div className="distribution-row"><h3>{selected?.title??sections.find(s=>s.kind===draft.kind)?.name??'Review record'}</h3><button type="button" aria-label="Close review editor" className="director-minimal-subtle" onClick={close}><X size={18}/></button></div>
   {error&&opened&&<p role="alert" className="director-minimal-error">{error}</p>}{notice&&opened&&<p role="status">{notice}</p>}
   {editing?<form className="distribution-form" onSubmit={e=>{e.preventDefault();void post('SAVE');}}>
    <label>Title<input maxLength={200} required value={draft.title} onChange={e=>field('title',e.target.value)}/></label>
    <label>Category<select value={draft.category} onChange={e=>field('category',e.target.value)}>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label>
    <label>Applicability scope<select disabled={['RULE','ANALYTICS','CONCLUSION'].includes(draft.kind)} value={draft.scope} onChange={e=>field('scope',e.target.value)}><option value="EPISODE">Episode-specific</option><option value="CHANNEL">Reusable across channel</option></select></label>
    <label>Evidence classification<select disabled={['RULE','ANALYTICS'].includes(draft.kind)} value={draft.classification} onChange={e=>field('classification',e.target.value)}>{(draft.kind==='RULE'?['PERMANENT_RULE']:['OBSERVATION','HYPOTHESIS','VERIFIED_RESULT']).map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label>
    <label>{draft.kind==='CONCLUSION'?'Conclusion, unresolved blockers, exceptions and next action':'Finding / actionable improvement'}<textarea rows={7} maxLength={8000} required value={draft.body} onChange={e=>field('body',e.target.value)}/></label>
    <label>When to apply<textarea rows={2} maxLength={2000} required={draft.scope==='CHANNEL'} value={draft.applicability} onChange={e=>field('applicability',e.target.value)}/></label>
    <label>Evidence (source, actual test, review or analytics reference)<textarea rows={3} maxLength={4000} required value={draft.evidence} onChange={e=>field('evidence',e.target.value)}/></label>
    {draft.kind==='ANALYTICS'&&<><label>Metric<select value={draft.metric} onChange={e=>{field('metric',e.target.value);field('currency','');}}>{metrics.map(m=><option key={m} value={m}>{label(m)}</option>)}</select></label><label>Measured value (percent as 0–100; seconds for AVD)<input type="number" step="any" value={draft.value} onChange={e=>field('value',e.target.value)}/></label>{draft.metric==='RPM'&&<label>Currency code<input maxLength={3} required value={draft.currency} onChange={e=>field('currency',e.target.value.toUpperCase())}/></label>}<label>Period start<input type="date" min={data?.launchDate??undefined} required value={draft.periodStart} onChange={e=>field('periodStart',e.target.value)}/></label><label>Period end<input type="date" min={draft.periodStart||data?.launchDate||undefined} required value={draft.periodEnd} onChange={e=>field('periodEnd',e.target.value)}/></label></>}
    <button type="submit" className="director-minimal-subtle" disabled={busy}>Save draft</button>
   </form>:selected&&<><p>{label(selected.state)} · {label(selected.classification)}{stale(selected)?' · Source changed; review again':''}</p>{display(selected)}<div className="distribution-actions">
    <button type="button" className="director-minimal-subtle" disabled={busy||!data?.masterSha256} onClick={()=>setEditing(true)}>Edit</button>
    {selected.state==='DRAFT'&&!stale(selected)&&<button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>void post('APPROVE')}><Check size={15}/> Director approve</button>}
    {selected.state!=='RETIRED'&&<button type="button" className="director-minimal-subtle" disabled={busy||!data?.masterSha256} onClick={()=>void post('RETIRE')}>Retire</button>}
    <button type="button" className="director-minimal-subtle" disabled={busy} onClick={()=>void versions()}>Version history</button>
   </div>{history&&<details open className="distribution-details"><summary>Saved revisions</summary>{history.map(i=><details key={i.revision}><summary>Revision {i.revision} · {label(i.state)} · {i.recordedAt}</summary><p>{i.title}</p>{display(i)}</details>)}</details>}</>}
  </dialog>
 </section>;
}
