import {useCallback,useEffect,useRef,useState} from 'react';
import {CheckCircle2,Cloud,Copy,ExternalLink,GitPullRequest,RefreshCw,ShieldAlert} from 'lucide-react';

type CloudPreview={
  status:string;reason:string;manifestSha256:string|null;
  readinessFingerprint:string;readyShots:number;totalShots:number;
  unresolvedAssets:number;taskPrompt:string|null;
  usesOpenAiApi:boolean;startsCloudTask:boolean;
};
type CloudHandoff={
  handoffId:string;packageId:string;episodeKey:string;status:string;
  manifestSha256:string;readinessFingerprint:string;shotCount:number;
  taskPrompt:string;pullRequestUrl:string|null;pullRequestNumber:number|null;
  createdAt:string;currentVoiceMatches:boolean;
  usesOpenAiApi:boolean;startsCloudTask:boolean;
};

async function parse<T>(response:Response):Promise<T>{
  if(!response.ok)throw Error('MediaOS HTTP '+response.status+': '+(await response.text()).slice(0,450));
  return response.json() as Promise<T>;
}

export function EpisodeCodexCloudPanel({packageId,refreshVersion=0}:{
  packageId:string;refreshVersion?:number;
}){
  const prefix='/api/v1/episode-packages/'+encodeURIComponent(packageId)+'/codex-cloud-handoffs';
  const [preview,setPreview]=useState<CloudPreview|null>(null);
  const [history,setHistory]=useState<CloudHandoff[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [prHandoffId,setPrHandoffId]=useState<string|null>(null);
  const [prUrl,setPrUrl]=useState('');
  const requestId=useRef<string|null>(null);
  const saving=useRef(false);

  const refresh=useCallback(async()=>{
    const [live,stored]=await Promise.all([
      fetch(prefix+'/preview',{cache:'no-store'}).then(parse<CloudPreview>),
      fetch(prefix,{cache:'no-store'}).then(parse<CloudHandoff[]>),
    ]);
    setPreview(live);setHistory(stored);
  },[prefix]);

  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');setPreview(null);setHistory([]);
    void Promise.all([
      fetch(prefix+'/preview',{cache:'no-store'}).then(parse<CloudPreview>),
      fetch(prefix,{cache:'no-store'}).then(parse<CloudHandoff[]>),
    ]).then(([a,b])=>{if(active){setPreview(a);setHistory(b);}})
      .catch(e=>{if(active)setError(String(e));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[prefix,refreshVersion]);

  const current=history.find(x=>x.manifestSha256===preview?.manifestSha256&&
    x.currentVoiceMatches);
  const ready=preview?.status==='READY_FOR_MANUAL_CODEX_CLOUD_TASK' &&
    !!preview.manifestSha256;
  async function save(){
    if(!ready||current||saving.current||busy||!preview)return;
    if(!window.confirm('Create one immutable Codex Cloud task handoff for ALL '+
      preview.totalShots+' voice-ready SHOTs? No OpenAI API token charges, '
      +'no local runner, and NO automatic Codex launch. You will copy the '
      +'complete task and start it manually in your ChatGPT Codex Cloud environment.'))return;
    setError('');setNotice('');setBusy(true);saving.current=true;
    const id=requestId.current??window.crypto.randomUUID();
    requestId.current=id;
    try{
      const stored=await parse<CloudHandoff>(await fetch(prefix,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({requestId:id,expectedManifestSha256:preview.manifestSha256,
          confirmSubscriptionCloudHandoff:true}),
      }));
      requestId.current=null;
      await refresh();
      setNotice('Saved immutable handoff for '+stored.shotCount+
        ' SHOTs. Copy the prompt and start a separate task in Codex Cloud.');
    }catch(e){
      setError(String(e)+
        ' If the request reached MediaOS, refresh saved handoffs before another attempt.');
    }finally{saving.current=false;setBusy(false);}
  }
  async function copy(text:string){
    try{
      await navigator.clipboard.writeText(text);
      setNotice('Full all-SHOT Codex task copied. Paste it into a published Codex Cloud environment.');
      setError('');
    }catch(e){setError('Clipboard not accessible: '+String(e));}
  }
  async function linkPr(handoff:CloudHandoff){
    if(busy||saving.current||!handoff.currentVoiceMatches)return;
    if(!window.confirm('Record the GitHub Pull Request URL as manually supplied evidence? '
      +'MediaOS does NOT verify this private PR, inspect its diff, merge it or render. '
      +'Open GitHub separately and review exact SHOT paths, tests and protected files.'))return;
    setBusy(true);setError('');setNotice('');
    try{
      const updated=await parse<CloudHandoff>(await fetch(
        prefix+'/'+encodeURIComponent(handoff.handoffId)+'/record-pr',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({pullRequestUrl:prUrl,
          expectedManifestSha256:handoff.manifestSha256,
          confirmManuallyReviewedGitHubUrl:true}),
      }));
      setPrHandoffId(null);setPrUrl('');
      await refresh();
      setNotice('PR #'+updated.pullRequestNumber+
        ' linked as UNVERIFIED. Verify files, tests and visual output in GitHub before approval.');
    }catch(e){setError(String(e));}
    finally{setBusy(false);}
  }

  return <section className="episode-codex-cloud" aria-label="Codex Cloud subscription episode handoff">
    <div className="episode-codex-cloud-head">
      <div>
        <h3><Cloud size={20}/> Codex Cloud · Full-Episode Subscription Workflow</h3>
        <p>One voice-ready EP003+ episode → one immutable Codex task → one GitHub PR.
          This route does not need an OpenAI API budget, a local laptop or Railway GitHub credentials.</p>
      </div>
      <button type="button" disabled={loading||busy}
        onClick={()=>{setLoading(true);void refresh().catch(e=>setError(String(e)))
          .finally(()=>setLoading(false));}}><RefreshCw size={16}/> Refresh</button>
    </div>
    <div className="episode-codex-cloud-info">
      <ShieldAlert size={19}/>
      <span><strong>Manual cloud launch, no provider dispatch.</strong> MediaOS creates and
        stores the complete task; only your action inside Codex Cloud starts AI work.
        Your ChatGPT subscription limits apply. No automatic GitHub merge or render.</span>
    </div>
    {loading&&<p role="status">Reading current approved voice/cue evidence…</p>}
    {error&&<p role="alert" className="episode-hub-error">{error}</p>}
    {notice&&<p role="status" className="episode-package-notice">{notice}</p>}
    {preview&&<div className="episode-codex-cloud-preview">
      <strong>{preview.status.replaceAll('_',' ')}</strong>
      <p>{preview.readyShots}/{preview.totalShots} SHOTs voice-ready
        {' · '}{preview.unresolvedAssets} asset decisions for GitHub PR
        {' · '}OpenAI API calls: <strong>0</strong></p>
      <p>{preview.reason}</p>
      {preview.manifestSha256&&<small>Current manifest SHA-256:
        {' '}{preview.manifestSha256}</small>}
      <div className="episode-codex-cloud-actions">
        <button type="button" disabled={!ready||!!current||busy||loading}
          onClick={()=>void save()}>
          {busy?'Saving…':current?'Current manifest saved':'Save one complete Codex Cloud handoff'}
        </button>
        <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16}/> Open ChatGPT / Codex Cloud
        </a>
      </div>
    </div>}
    <div className="episode-codex-cloud-steps">
      <p><strong>Cloud setup (once):</strong> Open ChatGPT on web → Work in → Cloud
        → Create environment → connect <code>stefanVasilev17/media-os</code>.
        Ensure Java 21, Maven, Node and Remotion dependencies work; Publish environment.</p>
      <p><strong>Every episode:</strong> Copy the saved full-episode task below; start
        one Codex Cloud task in your published environment, paste and submit.
        Codex checks Git and generates an episode-only PR. Review that PR in GitHub,
        then record its link below. Closing your laptop does not stop cloud work.</p>
    </div>
    <h4>Saved, immutable cloud handoffs</h4>
    {history.length===0?<p>No cloud handoff is stored yet.</p>:
      history.map(h=><details className="episode-codex-cloud-job" key={h.handoffId}>
        <summary>
          <span><strong>{h.episodeKey} · {h.shotCount} SHOTs · {h.status.replaceAll('_',' ')}</strong>
            <small>{h.currentVoiceMatches?'Current voice/source':'STALE: voice/catalog changed'}
              {' · '}{h.createdAt}</small></span>
          {h.currentVoiceMatches?<CheckCircle2 size={18}/>:<ShieldAlert size={18}/>}
        </summary>
        <div className="episode-codex-cloud-body">
          <p>Input SHA: <code>{h.manifestSha256}</code>. The snapshot keeps the
            exact approved narration, real 30fps cues, asset decisions and output paths.</p>
          {!h.currentVoiceMatches&&<p role="alert">
            This saved task is stale. Recheck voice/source and create a new current handoff;
            never start or link PR work using an old snapshot.</p>}
          <div className="episode-codex-cloud-actions">
            <button type="button" disabled={!h.currentVoiceMatches}
              onClick={()=>void copy(h.taskPrompt)}>
              <Copy size={16}/> Copy ALL SHOT Codex Cloud instructions
            </button>
            <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">
              <Cloud size={16}/> Start task in cloud
            </a>
          </div>
          <details><summary>Inspect full task before copying</summary>
            <pre>{h.taskPrompt}</pre></details>
          {h.pullRequestUrl
            ?<p><strong>PR link (not independently verified): </strong>
              <a href={h.pullRequestUrl} target="_blank" rel="noopener noreferrer">
                <GitPullRequest size={16}/> GitHub PR #{h.pullRequestNumber}
              </a></p>
            :<div className="episode-codex-cloud-pr">
              <button type="button" disabled={!h.currentVoiceMatches||busy}
                onClick={()=>{setPrHandoffId(prHandoffId===h.handoffId?null:h.handoffId);
                  setPrUrl('');}}>
                <GitPullRequest size={16}/> Record Codex-produced GitHub PR
              </button>
              {prHandoffId===h.handoffId&&<>
                <label htmlFor={'codex-cloud-pr-'+h.handoffId}>Exact GitHub PR URL</label>
                <input id={'codex-cloud-pr-'+h.handoffId} type="url"
                  placeholder="https://github.com/stefanVasilev17/media-os/pull/123"
                  value={prUrl} onChange={e=>setPrUrl(e.target.value)} disabled={busy}/>
                <button type="button" disabled={!prUrl.trim()||busy}
                  onClick={()=>void linkPr(h)}>
                  Record link as unverified — no merge or render
                </button>
              </>}
            </div>}
        </div>
      </details>)}
  </section>;
}
