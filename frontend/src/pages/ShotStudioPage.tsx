import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, FileText, LockKeyhole, Mic2, Plus, RotateCcw, Save, Clapperboard } from 'lucide-react';
import { studio, type StudioClip, type StudioShot, type DirectorVisualPlanState } from '../api/studioApi';
import { LegacyShotMirror } from '../components/LegacyShotMirror';
import { loadVoiceClips, voiceClipAudioUrl, type VoiceClipState } from '../api/voiceClipApi';
import { loadRemotionRender, remotionRenderVideoUrl, type RemotionRenderState } from '../api/voiceApi';
import '../styles/shotStudio.css';

const status = (c: StudioClip) => c.approvedAt ? 'VOICE APPROVED' : c.generated ? 'VOICE DRAFT' : c.lockedAt ? 'SCRIPT LOCKED' : 'SCRIPT DRAFT';

export function ShotStudioPage() {
  const [shots,setShots]=useState<StudioShot[]>([]);
  const [shotId,setShotId]=useState('');
  const [clipId,setClipId]=useState('');
  const [newTitle,setNewTitle]=useState('');
  const [newClipText,setNewClipText]=useState('');
  const [narration,setNarration]=useState('');
  const [direction,setDirection]=useState('calm, conversational, confident');
  const [visual,setVisual]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [preview,setPreview]=useState<RemotionRenderState|null>(null);
  const [directorPlan,setDirectorPlan]=useState<DirectorVisualPlanState|null>(null);
  const [sourceVoice,setSourceVoice]=useState<VoiceClipState[]>([]);

  const shot=useMemo(()=>shots.find(x=>x.id===shotId),[shots,shotId]);
  const clip=useMemo(()=>shot?.clips.find(x=>x.id===clipId),[shot,clipId]);
  const canEdit=Boolean(clip&&!clip.lockedAt);
  const voiceReady=Boolean(shot?.clips.length&&shot.clips.every(c=>c.approvedAt));

  const refresh=useCallback(async()=>{
    const next=await studio.shots();
    setShots(next);
    setShotId(id=>next.some(s=>s.id===id)?id:next[0]?.id||'');
    return next;
  },[]);
  useEffect(()=>{
    refresh().catch(e=>setError(String(e))).finally(()=>setLoading(false));
  },[refresh]);
  useEffect(()=>{
    setClipId(id=>shot?.clips.some(c=>c.id===id)?id:shot?.clips[0]?.id||'');
    setVisual(shot?.visualPrompt||'');
  },[shotId,shot?.visualRevision,shot?.visualPrompt,shot?.clips.length]);
  useEffect(()=>{
    setPreview(null);
  },[shotId,shot?.previewRenderId]);
  useEffect(()=>{
    let active=true;
    if(!shot?.id||shot.sourceShotKey!=='SHOT 05'){setDirectorPlan(null);return;}
    studio.loadVisualPlan(shot.id)
      .then(data=>{if(active)setDirectorPlan(data);})
      .catch(()=>{if(active)setDirectorPlan(null);});
    return()=>{active=false;};
  },[shot?.id,shot?.visualPlanRevision,shot?.visualRevision,
     shot?.clips.map(c=>c.generationRevision+':'+c.scriptRevision+':'+Boolean(c.approvedAt)).join(',')]);
  useEffect(()=>{
    if(!shot?.previewRenderId)return;
    let active=true;
    const poll=async()=>{
      try {
        const next=await loadRemotionRender(shot.previewRenderId!);
        if(active)setPreview(next);
        return next.status==='READY'||next.status==='FAILED';
      } catch(e){if(active)setError(e instanceof Error?e.message:String(e));return true;}
    };
    void poll();
    const timer=window.setInterval(()=>{
      void poll().then(done=>{if(done)window.clearInterval(timer);});
    },3500);
    return()=>{active=false;window.clearInterval(timer);};
  },[shot?.previewRenderId]);
  useEffect(()=>{
    let active=true;
    if(!shot?.sourceShotKey||!shot?.sourceScriptRevision){setSourceVoice([]);return;}
    loadVoiceClips(shot.sourceScriptRevision)
      .then(items=>{if(active)setSourceVoice(items.filter(item=>item.shotKey===shot.sourceShotKey));})
      .catch(()=>{if(active)setSourceVoice([]);});
    return ()=>{active=false;};
  },[shot?.sourceShotKey,shot?.sourceScriptRevision]);
  useEffect(()=>{
    setNarration(clip?.narration||'');
    setDirection(clip?.voiceDirection||'calm, conversational, confident');
  },[clipId,clip?.scriptRevision]);

  async function run(action:()=>Promise<unknown>,success:string){
    if(busy)return;
    setBusy(true);setError('');setMessage('');
    try{await action();await refresh();setMessage(success);}
    catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  async function createShot(){
    const title=(newTitle.trim()||'New architecture shot');
    if(busy)return;
    setBusy(true);setError('');
    try{const created=await studio.createShot(title);await refresh();setShotId(created.id);setNewTitle('');
      setMessage(created.shotKey+' created. Add the first voice clip.');
    }catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  async function addClip(){
    if(!shot||!newClipText.trim())return;
    await run(async()=>{await studio.addClip(shot.id,newClipText,'calm, conversational, confident');setNewClipText('');},
      'Clip created. Review its narration, then lock the script.');
  }
  const dirty=Boolean(clip&&(narration.trim()!==clip.narration || direction.trim()!==clip.voiceDirection));
  const visualDirty=Boolean(shot&&visual.trim()!==shot.visualPrompt);
  const isGatewayDirector=shot?.sourceShotKey==='SHOT 05';
  const visualPlanReady=Boolean(isGatewayDirector&&directorPlan?.ready&&!visualDirty);
  const originalClip=shot?.sourceShotKey&&clip ? sourceVoice.find(c=>c.clipKey===clip.clipKey) : undefined;
  async function reuseExistingVoiceClips(){
    if(!shot||busy||!shot.sourceShotKey)return;
    setBusy(true);setError('');setMessage('');
    try{
      const result=await studio.reuseExistingVoices(shot.id);
      await refresh();
      setMessage(result.reusedClips>0
        ? result.reusedClips+' existing recordings restored; '+result.approvedClips+' clips currently voice-approved. Original video and recordings preserved.'
        : 'No additional matching original audio was found. Generate or approve the remaining voice clips.');
    }catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }
  async function openOriginalEditor(opened:StudioShot,sequence:number){
    const updated=await refresh();
    const selected=updated.find(s=>s.id===opened.id)||opened;
    setShotId(selected.id);
    setClipId(selected.clips.find(c=>c.sequence===sequence)?.id||'');
    setMessage('Editable working copy opened. The approved original video is untouched.');
    window.requestAnimationFrame(()=>document.getElementById('studio-working-editor')?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  async function saveLockAndGenerate(){
    if(!clip||busy||!narration.trim())return;
    await run(async()=>{
      if(dirty)await studio.editClip(clip.id,narration,direction);
      await studio.lockClip(clip.id);
      await studio.generateVoice(clip.id);
    },'Voice draft generated for this clip. Listen below and approve it when satisfied.');
  }

  return (
    <main className="studio-page">
      <header className="studio-hero">
        <div><span className="studio-eyebrow">MEDIAOS / EP001 / SHOT-BASED PRODUCTION</span>
          <h1>Shot Studio</h1>
          <p>Create shots and voice clips from approved ChatGPT scripts. Edit content in MediaOS — no GitHub commits or JSON imports.</p>
        </div>
        <div className="studio-stage-tag">VNext · Production workspace</div>
      </header>
      {error&&<div className="studio-alert studio-error" role="alert">{error}</div>}
      {message&&<div className="studio-alert studio-success" role="status">{message}</div>}
      <div className="studio-shell">
        <aside className="studio-sidebar">
          <LegacyShotMirror workingCopies={shots.filter(s=>Boolean(s.sourceShotKey))} onOpenEditor={openOriginalEditor} />
          <div className="studio-section-head"><h2>New Studio Shots</h2><span>{shots.filter(s=>!s.sourceShotKey).length}</span></div>
          <p className="studio-muted">Choose any original shot above to unlock and edit it, or create a new one below. Approved videos remain protected.</p>
          {loading&&<p className="studio-muted">Loading shots…</p>}
          <div className="studio-shot-list">
            {shots.filter(s=>!s.sourceShotKey).map(s=><button key={s.id} type="button"
              className={'studio-shot-tab '+(s.id===shotId?'selected':'')}
              onClick={()=>{setShotId(s.id);setMessage('');setError('');}}>
              <strong>{s.shotKey}</strong><span>{s.title}</span>
              <small>{s.clips.length} clips · {s.clips.filter(c=>c.approvedAt).length} voices approved</small>
            </button>)}
          </div>
          <div className="studio-add-shot">
            <label htmlFor="new-shot-title">Add another shot</label>
            <input id="new-shot-title" maxLength={240} value={newTitle} placeholder="e.g. Payment Authorization"
              onChange={e=>setNewTitle(e.target.value)}/>
            <button type="button" disabled={busy} onClick={()=>void createShot()}><Plus size={16}/> Create Shot</button>
          </div>
          <div className="studio-legacy">
            <strong>EP001 approved production</strong>
            <p>Previous Director locks, voice approvals and rendered shots have not been changed.</p>
            <button type="button" onClick={()=>{window.location.hash='#/agents/script';}}>Open existing Script <ArrowRight size={14}/></button>
          </div>
        </aside>
        <section className="studio-content" id="studio-working-editor">
          {!shot?<div className="studio-empty">
            <h2>Create your first new shot</h2>
            <p>Select an original shot above to unlock a working copy, or create a new shot. Approved video remains intact.</p>
          </div>:<>
            <div className="studio-shot-head"><span>{shot.shotKey}</span><h2>{shot.title}</h2>
              <p>{shot.sourceShotKey
                ? 'Editable Director working version of '+shot.sourceShotKey+' · the original audio and video remain preserved.'
                : 'Every clip has an independent script lock, generation and approval. Editing does not regenerate other clips.'}</p>
            </div>
            <div className="studio-panel">
              <div className="studio-section-head"><h3><FileText size={19}/> Script & Voice</h3><span>{shot.clips.length} clips</span></div>
              {shot.sourceShotKey&&<div className="studio-reuse-panel">
                <div><strong>Reuse existing voice recordings</strong>
                  <p className="studio-muted">Reuse matching original voice recordings without ElevenLabs charges. Existing approvals are kept; unapproved recordings stay drafts. Changed texts and already generated voices are never replaced.</p>
                </div>
                <button type="button" disabled={busy} onClick={()=>void reuseExistingVoiceClips()}>
                  <Check size={16}/> Reuse Original Voices
                </button>
              </div>}
              <div className="studio-clip-tabs">
                {shot.clips.map(c=><button key={c.id} type="button" className={c.id===clipId?'selected':''}
                  onClick={()=>setClipId(c.id)}>{c.clipKey.split('-').at(-1)} <small>{status(c)}</small></button>)}
              </div>
              {clip?<div className="studio-clip-editor">
                <div className="studio-section-head"><h4>{clip.clipKey}</h4><span className="studio-status">{status(clip)}</span></div>
                <label htmlFor="studio-narration">Director-approved narration</label>
                <textarea id="studio-narration" rows={7} value={narration}
                  readOnly={!canEdit} onChange={e=>setNarration(e.target.value)}
                  placeholder="Paste the final text for this voice clip here."/>
                <label htmlFor="studio-voice-direction">Voice direction</label>
                <input id="studio-voice-direction" value={direction} readOnly={!canEdit}
                  onChange={e=>setDirection(e.target.value)}/>
                <div className="studio-buttons">
                  {canEdit?<>
                    <button type="button" disabled={busy||!dirty||!narration.trim()}
                      onClick={()=>void run(()=>studio.editClip(clip.id,narration,direction),'Draft saved without modifying other clips.')}>
                      <Save size={15}/> Save Draft</button>
                    <button type="button" disabled={busy||dirty} className="studio-primary"
                      onClick={()=>void run(()=>studio.lockClip(clip.id),'Script LOCKED. Voice generation is now enabled.')}>
                      <LockKeyhole size={15}/> Lock Script</button>
                    <button type="button" className="studio-primary" disabled={busy||!narration.trim()}
                      onClick={()=>void saveLockAndGenerate()}>
                      <Mic2 size={15}/> {originalClip?.generated?'Regenerate Voice':'Generate Voice'}</button>
                  </>:<>
                    <button type="button" disabled={busy} onClick={()=>{
                      if(window.confirm('Director unlock: archive this clip\'s current audio and approval, then open only this clip for editing?'))
                        void run(()=>studio.unlockClip(clip.id),'Clip unlocked. Previous revision and audio archived.');
                    }}><RotateCcw size={15}/> Director Unlock</button>
                    <button type="button" className="studio-primary" disabled={busy||Boolean(clip.approvedAt)}
                      onClick={()=>void run(()=>studio.generateVoice(clip.id),'ElevenLabs voice draft generated. Listen before approving.')}>
                      <Mic2 size={15}/> {clip.generated?'Regenerate Voice':'Generate Voice'}</button>
                  </>}
                  {clip.generated&&<button type="button" disabled={busy||Boolean(clip.approvedAt)}
                    onClick={()=>void run(()=>studio.approveVoice(clip.id),'Voice approved and locked.')}><Check size={15}/> Approve Voice</button>}
                </div>
                {clip.generated&&<div className="studio-audio">
                  <label>Listen to voice draft · Generation {clip.generationRevision}</label>
                  <audio key={clip.id+':'+clip.generationRevision} controls preload="none"
                    src={studio.audioUrl(clip.id,clip.generationRevision)}/>
                  {clip.approvedAt&&<span>Director voice approval saved</span>}
                </div>}
                {originalClip?.generated&&shot?.sourceScriptRevision&&<div className="studio-audio">
                  <label>Play original {originalClip.approved?'Director-approved':'draft'} voice (preserved)</label>
                  <audio key={originalClip.clipKey+':'+originalClip.generationRevision} controls preload="metadata"
                    src={voiceClipAudioUrl(originalClip.clipKey,shot.sourceScriptRevision,originalClip.generationRevision)}/>
                </div>}
                {dirty&&<p className="studio-muted">Changes remain in this working clip. Other audio and original recordings are untouched.</p>}
              </div>:<p className="studio-muted">Add a clip below to begin the Script → Voice workflow.</p>}
              <div className="studio-add-clip"><label htmlFor="studio-new-clip">Add a voice clip</label>
                <textarea id="studio-new-clip" rows={3} placeholder="Paste the next narration block (C01, C02…)" value={newClipText}
                  onChange={e=>setNewClipText(e.target.value)}/>
                <button type="button" disabled={busy||!newClipText.trim()} onClick={()=>void addClip()}>
                  <Plus size={15}/> Add Clip {String(shot.clips.length+1).padStart(2,'0')}</button>
              </div>
            </div>
            <div className="studio-panel">
              <div className="studio-section-head"><h3><Clapperboard size={19}/> Visual Studio</h3>
                <span>Revision {shot.visualRevision}</span></div>
              <p>Paste the Remotion production directions from ChatGPT. Each edit is versioned in PostgreSQL rather than GitHub.</p>
              <label htmlFor="studio-visual">What the viewer sees · camera, object actions, pacing</label>
              <textarea id="studio-visual" rows={9} value={visual} onChange={e=>setVisual(e.target.value)}
                placeholder="Use the existing living architecture map. Focus on API Gateway on the first spoken words…"/>
              <div className="studio-buttons">
                <button type="button" className="studio-primary" disabled={busy||!visualDirty||!visual.trim()}
                  onClick={()=>void run(()=>studio.saveVisual(shot.id,visual),'Visual directions saved as a versioned production draft.')}>
                  <Save size={15}/> Save Visual Directions</button>
                <span className="studio-muted">{voiceReady?'All voices approved.':'Approve every clip before the final voice-synced render.'}</span>
              </div>
              {isGatewayDirector?<div className="studio-director-workflow">
                <h4>Voice-synchronized Director Visual Plan</h4>
                <p>API Gateway · Existing cinematic Living Map · seven real examples · status codes triggered on the exact spoken word. The registered Director recipe can plan from approved voices automatically; optional saved directions are retained for review. No AI or ElevenLabs charges.</p>
                <div className="studio-buttons">
                  <button type="button" className="studio-primary"
                    disabled={busy||!voiceReady||visualDirty}
                    onClick={()=>void run(async()=>{const result=await studio.generateVisualPlan(shot.id);
                      setDirectorPlan(result);},'Director JSON timeline compiled and validated against approved C01–C07 audio.')}>
                    <FileText size={15}/> Generate Visual Plan
                  </button>
                  <button type="button" className="studio-primary"
                    disabled={busy||!voiceReady||!visualPlanReady}
                    onClick={()=>void run(()=>studio.renderDirectorPlan(shot.id),
                      'Cinematic Director preview queued separately. All original video renders and locks remain unchanged.')}>
                    <Clapperboard size={15}/> Generate Director Preview
                  </button>
                </div>
                {directorPlan?.stale&&<p className="studio-caution">The saved Visual Plan is stale: voice or visual instructions changed. Generate Visual Plan again before rendering.</p>}
                {directorPlan?.ready&&directorPlan.plan&&<div className="studio-director-plan">
                  <strong>Validated timeline · {directorPlan.plan.events.length} voice-aligned beats · {(directorPlan.plan.durationInFrames/30).toFixed(1)} seconds</strong>
                  {directorPlan.plan.events.map((event,i)=><div className="studio-plan-beat" key={event.clipKey+':'+event.kind}>
                    <span>{event.clipKey.split('-').at(-1)} · {(event.frame/30).toFixed(2)}s</span>
                    <div><b>{event.kind.replaceAll('_',' ')}</b>
                      <p>{event.visualExample}</p><small>Spoken trigger: “{event.spokenTrigger}”</small>
                    </div>
                  </div>)}
                  <details><summary>Inspect validated Director JSON</summary>
                    <pre>{JSON.stringify(directorPlan.plan,null,2)}</pre>
                  </details>
                </div>}
                <p className="studio-muted">The renderer reuses the original Gateway cinematic composition; failure cards appear when their HTTP status is spoken. No automated Director video approval.</p>
              </div>:<div className="studio-buttons">
                <button type="button" className="studio-primary" disabled={busy||!voiceReady||!visual.trim()||visualDirty}
                  onClick={()=>void run(()=>studio.generatePreview(shot.id),
                    'A separate Studio Living Map template draft was queued. Original Director videos were not touched.')}>
                  <Clapperboard size={15}/> Generate Template Preview
                </button>
                <span className="studio-muted">This is a reusable template, not a full Director scene.</span>
              </div>}
              {preview&&<div className="studio-preview-result">
                <strong>Isolated Studio draft · {preview.status}</strong>
                {preview.status==='FAILED'&&<p className="studio-error">{preview.error||'Rendering failed; original footage is unchanged.'}</p>}
                {preview.status==='READY'&&<video key={preview.renderId} controls preload="metadata"
                  src={remotionRenderVideoUrl(preview.renderId)} />}
                {preview.status!=='READY'&&preview.status!=='FAILED'&&<p className="studio-muted">Remotion rendering: {Math.round((preview.progress||0)*100)}% — preview is not Director LOCKED.</p>}
              </div>}
              <p className="studio-caution">Only registered cinematic recipes can produce a voice-synchronized Director preview. For other shots the generic template is still limited. No original EP001 LOCKED render is overwritten.</p>
              <button type="button" className="studio-secondary" onClick={()=>{window.location.hash='#/agents/visual';}}>
                Open existing Visual Agent <ArrowRight size={15}/></button>
            </div>
          </>}
        </section>
      </div>
    </main>
  );
}
