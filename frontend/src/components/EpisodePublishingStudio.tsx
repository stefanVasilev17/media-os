import {useEffect,useRef,useState} from 'react';
import {Check,Copy,Download,History,RefreshCw,Save,Upload,X,Pencil,Image} from 'lucide-react';
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
  {label:'Final QA',fields:[['QA_MASTER','Full Video playback'],['QA_AUDIO','Audio quality'],['QA_EDITORIAL','Editorial accuracy'],['QA_RIGHTS','Rights & trademark'],['QA_CAPTIONS','Caption synchronization'],['QA_UPLOAD','Private YouTube upload'],['QA_RELEASE','Director release approval']]}
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
  const [selected,setSelected]=useState('');
  const dialog=useRef<HTMLDialogElement>(null);
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
      .then(next=>{if(live)accept(next,'');})
      .catch(e=>{if(live)setError(errorText(e));})
      .finally(()=>{if(live)setBusy(false);});
    return()=>{live=false;controller.abort();};
  },[root]);

  useEffect(()=>{
    const modal=dialog.current;
    if(selected&&modal&&!modal.open)modal.showModal();
    if(!selected&&modal?.open)modal.close();
  },[selected]);
  function closeEditor(){
    if(busy)return;
    if((dirty||file)&&!window.confirm('Discard unsaved publishing edits?'))return;
    setSelected('');setHistory(null);setFile(null);setError('');setNotice('');
  }
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
  const get=(key:string)=>data?.items.find(i=>i.fieldKey===key);
  const blocked=(key:string)=>!!data?.blockers.some(b=>b.startsWith(key+':'));
  function friendlyState(x:Item|undefined){
    if(!x||!x.revision)return 'Not added';
    if(displayState(x,master)==='STALE'||(x.state==='PASS'&&(blocked(x.fieldKey)||(x.fieldKey==='QA_RELEASE'&&!data?.releaseRecorded))))return 'Review again';
    switch(x.state){case 'APPROVED':return 'Approved';case 'PASS':return 'Checked';case 'FAIL':return 'Needs attention';case 'PENDING':return 'To review';default:return 'Draft';}
  }
  function status(key:string){
    const x=get(key),label=friendlyState(x);
    return <span className="publishing-status" data-state={label==='Approved'||label==='Checked'?'done':label==='Needs attention'||label==='Review again'?'issue':'pending'}>{label==='Approved'||label==='Checked'?<Check size={13}/>:null}{label}</span>;
  }
  function edit(key:string,label='Edit'){
    return <button type="button" className="publishing-text-button" disabled={busy} onClick={()=>select(key)}><Pencil size={14}/>{label}</button>;
  }
  function copyButton(value:string,label='Copy'){
    return <button type="button" className="publishing-copy" disabled={!value||busy} onClick={()=>void copy(value)}><Copy size={15}/>{label}</button>;
  }
  function row(key:string){
    return <div className="publishing-detail-row" key={key}><span>{labels[key]}</span>{status(key)}{edit(key,key.startsWith('QA_')?'Review':'Open')}</div>;
  }
  const title=get('TITLE'),thumbnail=get('THUMBNAIL_ASSET'),tags=get('TAGS'),comment=get('PINNED_COMMENT'),srt=get('SUBTITLES_SRT');
  const description=data?.assembledDescription??'';
  const reviewKeys=['QA_MASTER','QA_AUDIO','QA_EDITORIAL','QA_RIGHTS','QA_CAPTIONS','QA_UPLOAD'];
  const pendingChecks=reviewKeys.filter(k=>friendlyState(get(k))!=='Checked').length;
  return <section className="director-minimal-panel publishing-studio" aria-label="Publishing Studio">
    <div className="director-minimal-section-head">
      <div><p className="director-minimal-eyebrow">YouTube · {data?.episodeKey??'Episode'}</p><h2>Publishing</h2></div>
      <button type="button" className="publishing-text-button" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={15}/> Refresh</button>
    </div>
    {!selected&&error&&<p role="alert" className="director-minimal-error">{error}</p>}
    {!selected&&notice&&<p role="status" className="director-minimal-success">{notice}</p>}
    {!data&&<p className="director-minimal-muted">{busy?'Loading your publishing package…':'Publishing metadata could not be loaded. Refresh to try again.'}</p>}
    {data&&<>
      <div className="publishing-intro"><div><strong>{data.releaseRecorded?'Release approved':data.readyForDirectorRelease?'Ready for final approval':'Prepare your YouTube upload'}</strong>
        <p>{master?.complete?'Full Video is complete.':'Full Video is not yet complete.'} {data.releaseRecorded?'Publication remains manual.':data.readyForDirectorRelease?'Record your final release approval below.':'Copy the prepared content, add the missing files, then review the final checks.'}</p></div>
        <span className="publishing-status" data-state={data.readyForDirectorRelease?'done':'pending'}>{data.releaseRecorded?'Approved':data.readyForDirectorRelease?'Ready for review':'Not released'}</span>
      </div>
      <section className="publishing-step" aria-label="Title and thumbnail">
        <h3><span>01</span> Title & thumbnail</h3>
        <div className="publishing-hero">
          <div className="publishing-field"><div className="publishing-field-head"><strong>Title</strong>{status('TITLE')}</div>
            <p className="publishing-title-value">{title?.value||'No title added yet.'}</p>
            <div className="publishing-actions">{copyButton(title?.value??'')}{edit('TITLE')}</div>
          </div>
          <div className="publishing-field"><div className="publishing-field-head"><strong>Thumbnail</strong>{status('THUMBNAIL_ASSET')}</div>
            {thumbnail?.thumbnailUrl?<img className="publishing-preview" src={thumbnail.thumbnailUrl} alt="Archived publishing thumbnail"/>:
              <div className="publishing-image-placeholder"><Image size={28}/><strong>No image uploaded</strong><small>Use the approved PNG or JPEG</small></div>}
            <div className="publishing-actions">{thumbnail?.thumbnailUrl&&<a className="publishing-copy" href={thumbnail.thumbnailUrl} download={data.episodeKey+'-thumbnail.'+(thumbnail.objectType==='image/jpeg'?'jpg':'png')}><Download size={15}/> Download</a>}{edit('THUMBNAIL_ASSET',thumbnail?.thumbnailUrl?'Manage image':'Upload image')}{edit('THUMBNAIL_DESIGN','Design')}</div>
          </div>
        </div>
      </section>
      <section className="publishing-step" aria-label="YouTube description">
        <h3><span>02</span> Description</h3>
        <div className="publishing-field">
          <div className="publishing-field-head"><strong>Complete YouTube description</strong>{copyButton(description,'Copy complete description')}</div>
          <p className="publishing-help">Includes the description, chapters, technical sources, disclaimer and hashtags. {['DESCRIPTION','CHAPTERS','SOURCES','DISCLAIMER','HASHTAGS'].every(k=>friendlyState(get(k))==='Approved')?'All sections approved.':'Some sections still need review.'}</p>
          <pre className="publishing-description">{description||'No description added yet.'}</pre>
          <div className="publishing-field-head"><small className="publishing-help">{description.length} / 5000 characters</small><button type="button" className="publishing-text-button" disabled={!description} onClick={()=>downloadText(data.episodeKey+'-youtube-description.txt',description)}><Download size={14}/> Download text</button></div>
          <details className="publishing-more"><summary>Edit description sections</summary>{['DESCRIPTION','CHAPTERS','SOURCES','DISCLAIMER','HASHTAGS'].map(row)}</details>
        </div>
      </section>
      <section className="publishing-step" aria-label="Tags and pinned comment">
        <h3><span>03</span> Tags & pinned comment</h3>
        <div className="publishing-field"><div className="publishing-field-head"><div><strong>SEO tags</strong> {status('TAGS')}</div><div className="publishing-actions">{copyButton(tags?.value??'')}{edit('TAGS')}</div></div>
          <p className="publishing-value">{tags?.value||'No tags added yet.'}</p>
        </div>
        <div className="publishing-field"><div className="publishing-field-head"><div><strong>Pinned comment</strong> {status('PINNED_COMMENT')}</div><div className="publishing-actions">{copyButton(comment?.value??'')}{edit('PINNED_COMMENT')}</div></div>
          <pre className="publishing-comment">{comment?.value||'No pinned comment added yet.'}</pre>
        </div>
      </section>
      <section className="publishing-step" aria-label="Files and settings">
        <h3><span>04</span> Captions & upload settings</h3>
        <div className="publishing-field">
          <div className="publishing-field-head"><div><strong>English subtitles (.srt)</strong><p className="publishing-help">{srt?.value?'Review the saved subtitles before upload.':'Synchronized subtitles still need to be added.'}</p></div>{status('SUBTITLES_SRT')}</div>
          <div className="publishing-actions">{edit('SUBTITLES_SRT',srt?.value?'Review subtitles':'Add subtitles')}{srt?.value&&<button type="button" className="publishing-copy" onClick={()=>downloadText(data.episodeKey+'-subtitles.srt',srt.value)}><Download size={15}/> Download SRT</button>}</div>
          <details className="publishing-more"><summary>Transcript, audio & upload settings</summary>{['TRANSCRIPT','AUDIO_DIRECTION','UPLOAD_SETTINGS'].map(row)}{get('UPLOAD_SETTINGS')?.value&&<pre className="publishing-settings">{get('UPLOAD_SETTINGS')?.value}</pre>}</details>
        </div>
      </section>
      <section className="publishing-step" aria-label="Final review">
        <h3><span>05</span> Final review</h3>
        <div className="publishing-field">
          <div className="publishing-field-head"><strong>{pendingChecks?pendingChecks+' checks to review':'Technical checks recorded'}</strong>{status('QA_RELEASE')}</div>
          <p className="publishing-help">Confirm the actual video, captions and rights before release. No action here publishes externally.</p>
          <details className="publishing-more"><summary>Review checklist</summary>{reviewKeys.map(row)}{row('QA_RELEASE')}</details>
          <details className="publishing-more"><summary>All remaining requirements ({data.blockers.length})</summary>
            {data.blockers.length===0?<p className="publishing-help">All requirements recorded for this master.</p>:<ul>{data.blockers.map((x,i)=><li key={i}>{x.replace(/^([A-Z_]+):/,(m,k)=>labels[k]?labels[k]+':':m)}</li>)}</ul>}
          </details>
          <div className="publishing-actions"><button type="button" className="director-minimal-primary" disabled={busy||!data.readyForDirectorRelease||data.releaseRecorded} onClick={()=>select('QA_RELEASE')}>Review release approval</button></div>
        </div>
      </section>
      {master&&<details className="publishing-lineage"><summary>Technical details & master version</summary><p>{master.shotCount} SHOTs · {master.durationInFrames} frames</p><p>Film ID: {master.filmId}</p><p>SHA-256: {master.sha256}</p></details>}
    </>}
    <dialog ref={dialog} className="publishing-dialog" aria-label={labels[selected]??'Publishing editor'} onCancel={event=>{event.preventDefault();closeEditor();}}>
        {data&&item&&<div className="publishing-editor">
          <div className="publishing-editor-heading"><div><h3>{labels[selected]}</h3>
            <p className="director-minimal-muted">{friendlyState(item)} · Revision {item.revision||'—'}</p></div>
            <button type="button" className="publishing-icon-button" disabled={busy} onClick={closeEditor} aria-label="Close editor"><X size={21}/></button></div>
          {error&&<p role="alert" className="director-minimal-error">{error}</p>}
          {notice&&<p role="status" className="director-minimal-success">{notice}</p>}
          {asset?<div className="publishing-asset">
            {item.thumbnailUrl?<><img src={item.thumbnailUrl} alt="Archived publishing thumbnail"/><p className="publishing-lineage">SHA-256: {item.objectSha256}</p>
              <a className="director-minimal-subtle" href={item.thumbnailUrl} download={data.episodeKey+'-thumbnail.'+(item.objectType==='image/jpeg'?'jpg':'png')}><Download size={15}/> Download image</a></>
              :<p className="director-minimal-muted">No thumbnail image uploaded yet. Upload the approved original PNG/JPEG. Image approval does not grant logo rights.</p>}
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
              disabled={busy||(action==='PASS'&&(!master?.complete||draft.trim().length<12||(selected==='QA_RELEASE'&&!data.readyForDirectorRelease)))} onClick={()=>void change(action)}>{action==='PASS'?<Check size={15}/>:null} {action==='PASS'?'Approve check':action==='FAIL'?'Record issue':'Keep pending'}</button>)}</>:<>
              {!asset&&<button type="button" className="director-minimal-subtle" disabled={busy||!dirty} onClick={()=>void change('SAVE')}><Save size={15}/> Save changes</button>}
              <button type="button" className="director-minimal-primary" disabled={busy||dirty||!item.revision||!item.value.trim()||!master?.complete||(item.state==='APPROVED'&&displayState(item,master)!=='STALE')}
                onClick={()=>void change('APPROVE')}><Check size={15}/> Approve</button>
            </>}
            {!asset&&<><button type="button" className="director-minimal-subtle" disabled={busy||!draft} onClick={()=>void copy(draft)}><Copy size={15}/> Copy</button>
              <button type="button" className="director-minimal-subtle" disabled={busy||!draft} onClick={()=>downloadText(data.episodeKey+'-'+selected.toLowerCase()+(selected==='SUBTITLES_SRT'?'.srt':'.txt'),draft)}><Download size={15}/> Export</button></>}
          </div>
          <button type="button" className="publishing-text-button" disabled={busy||!item.revision} onClick={()=>void loadHistory()}><History size={14}/> Version history</button>
          {history&&<details open className="publishing-history"><summary>Immutable revision history ({history.length})</summary>
            {history.map(x=><details key={x.revision}><summary>Revision {x.revision} · {x.state} · {x.recordedAt?new Date(x.recordedAt).toLocaleString():''}</summary>
              <p className="publishing-lineage">Origin: {x.origin} · Master: {x.masterSha256??'unbound'}</p>
              {x.thumbnailUrl?<img src={x.thumbnailUrl} alt={'Thumbnail revision '+x.revision}/>:<pre>{x.value}</pre>}
            </details>)}</details>}
        </div>}
    </dialog>
  </section>;
}
