import {useCallback,useEffect,useRef,useState} from 'react';
import {CheckCircle2,Clapperboard,Copy,ExternalLink,GitPullRequest,
  RefreshCcw,ShieldAlert,Video,VideoOff} from 'lucide-react';

type Shot={
  shotKey:string;shotIndex:number;durationFrames:number;selectedTakeId:string;
  expectedCodePath:string;rendered:boolean;directorApproved:boolean;renderId:string|null;
  sceneInputSha256:string|null;sourceBlobSha:string|null;
};
type Output={
  kind:'MASTER'|'SHORT';ordinal:number;startFrame:number;endFrame:number;
  status:string;renderId:string|null;
};
type Feedback={
  feedbackId:string;shotKey:string|null;changeArea:string;feedback:string;state:string;createdAt:string;
};
type Run={
  runId:string;packageId:string;handoffId:string;episodeKey:string;state:string;
  sourceManifestSha256:string;sourceCommit:string|null;sourceScopeSha256:string|null;
  sourceScopeVerified:boolean;buildVerified:boolean;currentVoiceMatches:boolean;
  providerDispatchEnabled:boolean;cpuRenderAuthorized:boolean;
  shots:number;totalFrames:number;renderedShots:number;approvedShots:number;
  shotStates:Shot[];outputPlans:Output[];openFeedback:Feedback[];
  feedbackCodexTask:string|null;blockers:string[];createdAt:string;
};
type Handoff={
  handoffId:string;packageId:string;episodeKey:string;status:string;
  manifestSha256:string;currentVoiceMatches:boolean;pullRequestUrl:string|null;
  pullRequestNumber:number|null;
};
type AuditResult={
  runId:string;state:string;github:{
    status:string;mergedCommit:string|null;digest:string|null;
    blockers:string[];sourceScopeVerified:boolean;buildVerified:boolean;
    files:Array<{path:string;blobSha:string;status:string}>;
  }|null;
  pipeline:Run;
};
type BuildEvidence={verified:boolean;workerCommit:string|null;compiledShots:number;blockers:string[]};
type QueueReceipt={runId:string;kind:string;jobsSubmitted:number;existingJobsReused:number;
  sourceCommit:string;approvalRequestId:string;providerDispatchEnabled:boolean;nextAction:string};

const areas=['CAMERA','MOTION','LAYOUT','COLOR','TEXT','TIMING','AUDIO','TRANSITION','OTHER'];
async function json<T>(response:Response):Promise<T>{
  if(!response.ok)throw Error('MediaOS HTTP '+response.status+': '+(await response.text()).slice(0,600));
  return response.json() as Promise<T>;
}

export function EpisodeFactoryProductionPanel({packageId,refreshVersion=0}:{
  packageId:string;refreshVersion?:number;
}){
  const base='/api/v1/episode-packages/'+encodeURIComponent(packageId);
  const api=base+'/factory-production';
  const [handoffs,setHandoffs]=useState<Handoff[]>([]);
  const [runs,setRuns]=useState<Run[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [build,setBuild]=useState<BuildEvidence|null>(null);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [feedbackShot,setFeedbackShot]=useState('');
  const [feedbackArea,setFeedbackArea]=useState('CAMERA');
  const [feedbackText,setFeedbackText]=useState('');
  const [revisionPr,setRevisionPr]=useState('');
  const busy=useRef(false);
  const request=useRef<string|null>(null);

  const refresh=useCallback(async()=>{
    const [saved,existing]=await Promise.all([
      fetch(base+'/codex-cloud-handoffs',{cache:'no-store'}).then(json<Handoff[]>),
      fetch(api+'/runs',{cache:'no-store'}).then(json<Run[]>),
    ]);
    setHandoffs(saved);setRuns(existing);
    setSelected(previous=>previous&&existing.some(r=>r.runId===previous)
      ?previous:(existing[0]?.runId??null));
  },[api,base]);
  useEffect(()=>{
    let alive=true;
    setError('');setPending(true);setHandoffs([]);setRuns([]);setSelected(null);
    void Promise.all([
      fetch(base+'/codex-cloud-handoffs',{cache:'no-store'}).then(json<Handoff[]>),
      fetch(api+'/runs',{cache:'no-store'}).then(json<Run[]>),
    ]).then(([saved,existing])=>{
      if(alive){setHandoffs(saved);setRuns(existing);setSelected(existing[0]?.runId??null);}
    }).catch(e=>{if(alive)setError(String(e));})
      .finally(()=>{if(alive)setPending(false);});
    return()=>{alive=false;};
  },[api,base,refreshVersion]);

  const active=runs.find(r=>r.runId===selected)??null;
  useEffect(()=>{
    if(!active)return;
    let alive=true;
    void fetch(api+'/runs/'+encodeURIComponent(active.runId)+'/build-evidence',
      {cache:'no-store'}).then(json<BuildEvidence>)
      .then(value=>{if(alive)setBuild(value);})
      .catch(()=>{if(alive)setBuild(null);});
    return()=>{alive=false;};
  },[api,active?.runId,active?.sourceCommit,active?.buildVerified]);

  const candidates=handoffs.filter(h=>h.currentVoiceMatches &&
    !runs.some(r=>r.handoffId===h.handoffId));
  const call=async<T,>(url:string,body?:unknown):Promise<T>=>json<T>(await fetch(url,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body??{}),
  }));

  async function execute(action:()=>Promise<unknown>,success:string){
    if(busy.current)return;
    busy.current=true;setPending(true);setError('');setNotice('');
    try{await action();await refresh();setNotice(success);setBuild(null);}
    catch(e){setError(String(e));}
    finally{busy.current=false;setPending(false);}
  }

  async function createRun(h:Handoff){
    if(!window.confirm('Prepare one whole-episode post-Code production run for '+h.episodeKey+
      '? This only records QA/SHOT/master/Shorts state. No AI, TTS, CPU rendering or code merge.'))return;
    const id=request.current??crypto.randomUUID();request.current=id;
    await execute(async()=>{
      await call<Run>(api+'/runs',{requestId:id,handoffId:h.handoffId,
        expectedManifestSha256:h.manifestSha256,confirmProductionIntake:true});
      request.current=null;
    },'Saved one complete SHOT → code QA → Director feedback → master → 3 Shorts production run.');
  }

  async function verifyGit(){
    if(!active||!window.confirm('Verify the exact merged GitHub PR and every EP003+ SHOT blob SHA? '
      +'Read-only GitHub access may be blocked until MEDIA_OS_GITHUB_READ_TOKEN is available. '
      +'No GitHub Action, API-generation cost, CPU render or merge will run.'))return;
    await execute(async()=>{
      const result=await call<AuditResult>(api+'/runs/'+active.runId+'/verify-github');
      if(result.github&&!result.github.sourceScopeVerified){
        throw Error('Source audit BLOCKED: '+result.github.blockers.join(', '));
      }
    },'GitHub PR source scope verified. Rendering still requires matching worker build and explicit CPU approval.');
  }

  async function submitFeedback(){
    if(!active||feedbackText.trim().length<12)return;
    if(!window.confirm('Record this scoped Director feedback? Existing approved voice Takes remain untouched. '
      +'A separate reviewed Codex PR will be needed before the changed SHOTs can be rendered.'))return;
    const text=feedbackText.trim();
    await execute(async()=>{
      await call<Run>(api+'/runs/'+active.runId+'/feedback',{
        requestId:crypto.randomUUID(),shotKey:feedbackShot||null,
        changeArea:feedbackArea,feedback:text,confirmScopedRevision:true});
      setFeedbackText('');
    },'Saved scoped Director feedback. Copy the new revision task when Codex is connected.');
  }

  async function linkRevision(){
    if(!active||!active.sourceScopeSha256||!revisionPr.trim())return;
    if(!window.confirm('Link an additional GitHub PR for Director feedback? '
      +'The link is initially UNVERIFIED; it must be merged and audited before rendering.'))return;
    await execute(async()=>{
      await call<Run>(api+'/runs/'+active.runId+'/revision-pr',{
        requestId:crypto.randomUUID(),pullRequestUrl:revisionPr.trim(),
        expectedSourceDigest:active.sourceScopeSha256,confirmManualPrLink:true});
      setRevisionPr('');
    },'Feedback PR linked. Use Verify GitHub PR after reviewing and merging it.');
  }

  async function copyPrompt(prompt:string){
    try{await navigator.clipboard.writeText(prompt);
      setNotice('Scoped revision instructions copied for the Codex Cloud task.');
      setError('');
    }catch(e){setError('Clipboard failed: '+String(e));}
  }

  async function cpu(kind:'SHOTS'|'MASTER'|'SHORTS'){
    if(!active||!active.sourceScopeSha256)return;
    const frames=kind==='SHOTS'||kind==='MASTER'?active.totalFrames
      :active.outputPlans.filter(x=>x.kind==='SHORT')
        .reduce((acc,x)=>acc+x.endFrame-x.startFrame,0);
    if(!window.confirm('AUTHORIZE CPU RENDERING: '+kind+' · '+frames+
      ' frames, 30fps. Railway rendering uses infrastructure CPU and storage. '
      +'This does NOT use OpenAI tokens or ElevenLabs. No automatic retry or publishing. '
      +'Proceed with this one bounded batch?'))return;
    const route=kind==='SHOTS'?'queue-shots':kind==='MASTER'?'queue-master':'queue-shorts';
    await execute(async()=>{
      const result=await call<QueueReceipt>(api+'/runs/'+active.runId+'/'+route,{
        requestId:crypto.randomUUID(),expectedSourceDigest:active.sourceScopeSha256,
        maximumFrames:frames,authorizeCpuSpend:true,
      });
      setNotice(result.jobsSubmitted+' jobs queued, '+result.existingJobsReused+' reused.');
    },kind+' CPU render requested. Inspect actual MP4s and refresh to see status.');
  }

  async function approve(kind:'SHOTS'|'FINAL'){
    if(!active||!active.sourceScopeSha256)return;
    const action=kind==='SHOTS'?'approve-shots':'approve-final';
    if(!window.confirm('DIRECTOR VISUAL APPROVAL: Confirm you have personally watched '
      +(kind==='SHOTS'?'ALL current SHOT MP4s':'the full master AND all THREE vertical Shorts')+
      ', checked timing, visual composition and voice sync. '
      +'This saves your approval; it does NOT publish the video.'))return;
    await execute(async()=>{await call<Run>(api+'/runs/'+active.runId+'/'+action,{
      requestId:crypto.randomUUID(),expectedSourceDigest:active.sourceScopeSha256,
      confirmWatchedAndApproved:true,
    });},'Director '+kind.toLowerCase()+' approval recorded for this exact code/video version.');
  }

  const current=active?.currentVoiceMatches&&active.sourceScopeVerified&&active.buildVerified
    &&active.openFeedback.length===0;
  const shotsReady=!!active&&active.shots>0&&active.renderedShots===active.shots;
  const reviewed=shotsReady&&active!.approvedShots===active!.shots;
  const master=active?.outputPlans.find(x=>x.kind==='MASTER');
  const shorts=active?.outputPlans.filter(x=>x.kind==='SHORT')??[];
  const allOutputs=!!master?.renderId&&master.status==='RENDERED_PENDING_DIRECTOR'
    &&shorts.length===3&&shorts.every(x=>x.renderId&&x.status==='RENDERED_PENDING_DIRECTOR');

  return <section className="episode-factory-production" aria-label="Integrated Post-Codex Production">
    <header className="episode-factory-production-head">
      <div>
        <h3><Clapperboard size={22}/> Unified Production · QA → SHOTs → Master → Shorts</h3>
        <p>One production run for the whole episode. Source and compiled worker checks
          are separate. Rendering is never authorized by merely linking a PR.</p>
      </div>
      <button type="button" disabled={pending} onClick={()=>void execute(
        async()=>{await refresh();},'Production status refreshed.')}>
        <RefreshCcw size={16}/> Refresh
      </button>
    </header>
    {error&&<p role="alert" className="episode-hub-error">{error}</p>}
    {notice&&<p role="status" className="episode-package-notice">{notice}</p>}
    {candidates.map(h=><div className="episode-factory-production-intake" key={h.handoffId}>
      <p><strong>{h.episodeKey}</strong> · Ready Codex source snapshot
        {' · '}PR: {h.pullRequestNumber??'not linked yet'}</p>
      <button type="button" disabled={pending} onClick={()=>void createRun(h)}>
        Create one whole-episode production run · No CPU cost
      </button>
    </div>)}
    {runs.length>1&&<label className="episode-factory-run-select">Production run
      <select disabled={pending} value={selected??''}
        onChange={e=>setSelected(e.target.value)}>
        {runs.map(r=><option key={r.runId} value={r.runId}>
          {r.episodeKey} · {r.state} · {r.createdAt}</option>)}
      </select>
    </label>}
    {!active?<p>No post-Codex production run yet. First save an all-SHOT Codex Cloud
      handoff, then create a production run here. No Codex account is needed to
      prepare this pipeline.</p>:<>
      <div className="episode-factory-production-summary">
        <strong>{active.episodeKey} · {active.state.replaceAll('_',' ')}</strong>
        <p>{active.shots} SHOTs · {active.renderedShots} rendered · {active.approvedShots} Director-approved
          {' · '}{(active.totalFrames/30/60).toFixed(1)} minutes measured source</p>
        <small>Verified source: {active.sourceScopeSha256??'NOT VERIFIED'}
          {' · '}Git commit: {active.sourceCommit??'—'}</small>
      </div>
      <div className="episode-factory-production-phase">
        <h4><GitPullRequest size={18}/> 1. Automatic code QA</h4>
        <p>Real GitHub PR diff and merge hash must contain every generated SHOT.
          Only episode-local files may change. A separate source-commit-matching
          Remotion worker build must report all compiled compositions.</p>
        <div className="episode-factory-production-chips">
          <span>Git PR: {active.sourceScopeVerified?'SCOPED + MERGED':'UNVERIFIED'}</span>
          <span>Worker build: {active.buildVerified?'MATCHED':'NOT READY'}</span>
          <span>Voice: {active.currentVoiceMatches?'CURRENT':'STALE'}</span>
        </div>
        <button disabled={pending||!active.currentVoiceMatches}
          onClick={()=>void verifyGit()}>Verify merged PR + all Git blobs (read-only)</button>
        {build&&!build.verified&&<p>Worker: {build.blockers.join(', ')}</p>}
        {!active.sourceScopeVerified&&<p>GitHub private repo read access is required
          for automatic code verification. No access means rendering stays blocked.</p>}
      </div>
      <div className="episode-factory-production-phase">
        <h4><Video size={18}/> 2. Bounded SHOT rendering & Director review</h4>
        <p>Render only with a matching compiled worker SHA and separate CPU approval.
          All outputs are linked to exact voice, source and frame fingerprints.</p>
        <div className="episode-factory-production-actions">
          <button disabled={!current||pending||active.shots===0}
            onClick={()=>void cpu('SHOTS')}>Authorize & queue SHOT renders</button>
          <button disabled={!current||pending||!shotsReady}
            onClick={()=>void approve('SHOTS')}>Approve ALL rendered SHOTs</button>
        </div>
        {active.shotStates.map(shot=><details className="episode-factory-shot" key={shot.shotKey}>
          <summary><strong>{shot.shotKey}</strong> · {shot.durationFrames} frames
            {' · '}{shot.directorApproved?'Director approved':
              shot.rendered?'Rendered, needs review':'Not yet rendered'}</summary>
          <p>Expected code: <code>{shot.expectedCodePath}</code></p>
          <p>Take: <code>{shot.selectedTakeId}</code></p>
          {shot.renderId&&shot.rendered
            ?<video controls preload="none"
              src={'/api/v1/remotion/renders/'+encodeURIComponent(shot.renderId)+'/video'}/>
            :<p><VideoOff size={15}/> No verified current MP4 yet.</p>}
        </details>)}
      </div>
      <div className="episode-factory-production-phase">
        <h4><Clapperboard size={18}/> 3. Full-film assembly</h4>
        <p>All SHOT previews must be personally approved first. Assembly preserves
          the current source order and voice. MP4 upload has an existing 256MB
          storage cap, so large full-resolution outputs can be blocked.</p>
        <button disabled={!current||pending||!reviewed}
          onClick={()=>void cpu('MASTER')}>Authorize separate master assembly CPU</button>
        {master&&<p>Master · {master.endFrame/30} seconds
          {' · '}{master.status}
          {master.renderId&&<> · <a target="_blank" rel="noopener noreferrer"
              href={'/api/v1/remotion/renders/'+master.renderId+'/video'}>
              <ExternalLink size={14}/> Open MP4</a></>}</p>}
      </div>
      <div className="episode-factory-production-phase">
        <h4><Video size={18}/> 4. Three Shorts drafts (9:16)</h4>
        <p>Three distinct, nonoverlapping 20–45 second windows are derived from the
          verified full-episode frame timeline. Vertical framing uses a full-diagram
          foreground with a soft background. Director must confirm the hooks and
          visual composition; these are drafts, not approved published Shorts.</p>
        <button disabled={!current||pending||!reviewed||shorts.length!==3}
          onClick={()=>void cpu('SHORTS')}>Authorize & queue THREE vertical Shorts</button>
        {shorts.map(c=><p key={c.ordinal}>Short {c.ordinal}
          {' · '}{(c.startFrame/30).toFixed(1)}–{(c.endFrame/30).toFixed(1)}s
          {' · '}{c.status}
          {c.renderId&&<> · <a target="_blank" rel="noopener noreferrer"
            href={'/api/v1/remotion/renders/'+c.renderId+'/video'}>
            <ExternalLink size={14}/> Open vertical MP4</a></>}</p>)}
      </div>
      <div className="episode-factory-production-phase">
        <h4><ShieldAlert size={18}/> 5. Director feedback → scoped Codex PR → selective rerender</h4>
        <p>Your changes are stored with the current source SHA. New Codex work
          targets only the affected episode-local scenes. Unchanged SHOT MP4s are
          reused when their compiled code/voice fingerprint remains identical.</p>
        <div className="episode-factory-production-form">
          <label>Target SHOT
            <select value={feedbackShot} onChange={e=>setFeedbackShot(e.target.value)}>
              <option value="">WHOLE EPISODE</option>
              {active.shotStates.map(shot=><option key={shot.shotKey}
                value={shot.shotKey}>{shot.shotKey}</option>)}
            </select>
          </label>
          <label>Change area<select value={feedbackArea}
            onChange={e=>setFeedbackArea(e.target.value)}>
            {areas.map(area=><option key={area} value={area}>{area}</option>)}
          </select></label>
          <label className="episode-factory-form-wide">Director feedback
            <textarea rows={3} maxLength={4000} value={feedbackText}
              onChange={e=>setFeedbackText(e.target.value)}
              placeholder="In SHOT03 slow the camera by 30% and enlarge Redis by 20%. Preserve all other scenes."/>
          </label>
          <button type="button" disabled={pending||!active.currentVoiceMatches||feedbackText.trim().length<12}
            onClick={()=>void submitFeedback()}>Save scoped Director feedback</button>
        </div>
        {active.openFeedback.length>0&&<>
          <p>{active.openFeedback.length} change(s) pending new source revision.</p>
          {active.openFeedback.map(f=><p key={f.feedbackId}><strong>
            {f.shotKey??'WHOLE EPISODE'} · {f.changeArea}</strong>: {f.feedback}</p>)}
          {active.feedbackCodexTask&&<button disabled={pending}
            onClick={()=>void copyPrompt(active.feedbackCodexTask!)}>
            <Copy size={16}/> Copy all feedback as ONE scoped Codex task
          </button>}
          <label>Revised Codex GitHub PR URL
            <input type="url" value={revisionPr}
              placeholder="https://github.com/stefanVasilev17/media-os/pull/176"
              onChange={e=>setRevisionPr(e.target.value)}/></label>
          <button disabled={!revisionPr.trim()||pending||!active.sourceScopeSha256}
            onClick={()=>void linkRevision()}>Record scoped revision PR (unverified)</button>
        </>}
      </div>
      <div className="episode-factory-production-phase">
        <h4><CheckCircle2 size={18}/> 6. Final Director approval</h4>
        <p>Final approval is possible only after the full master and all three
          Shorts are actual successful MP4s and every SHOT has been approved.
          Publication is always a separate action.</p>
        <button disabled={!current||pending||!reviewed||!allOutputs}
          onClick={()=>void approve('FINAL')}>
          Approve complete master + 3 Shorts (no publishing)
        </button>
        {active.state==='FINAL_DIRECTOR_APPROVED'&&
          <p role="status">Final Director approval saved for this exact source and four rendered artifacts.</p>}
      </div>
      <details className="episode-factory-blockers">
        <summary><ShieldAlert size={16}/> Blockers and production safety checks
          {' · '}{active.blockers.length}</summary>
        {active.blockers.length===0?<p>No outstanding blockers in the current snapshot.</p>
          :<ul>{active.blockers.map(reason=><li key={reason}>{reason}</li>)}</ul>}
      </details>
    </>}
  </section>;
}
