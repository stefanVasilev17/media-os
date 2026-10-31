import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { WorkspaceContext, WorkspaceStage } from '../api/episodeWorkspaceApi';
import { episodePreparationApi, type AgentPreview, type EpisodeBrief } from '../api/episodePreparationApi';
import '../styles/episodeDirectorHub.css';
import '../styles/episodePreparationQuiet.css';

type PreparationStage = 'RESEARCH' | 'SCRIPT' | 'SCENE';
const stages: PreparationStage[] = ['RESEARCH','SCRIPT','SCENE'];
const stageNames: Record<PreparationStage,string> = {
  RESEARCH:'Research & Truth', SCRIPT:'Script', SCENE:'Video Plan'
};

function stringValue(value: unknown) { return typeof value === 'string' ? value : ''; }
function listValue(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function artifactSummary(stage: PreparationStage, artifact: Record<string,unknown>) {
  if (stage === 'RESEARCH')
    return {
      heading:'Truth Map',
      main:listValue(artifact.truthMap),
      secondary:listValue(artifact.unresolvedQuestions),
      secondaryHeading:'Unresolved questions'
    };
  if (stage === 'SCRIPT')
    return {
      heading:'Script timeline',
      main:listValue(artifact.timeline),
      secondary:[] as unknown[],
      secondaryHeading:''
    };
  return {
    heading:'Shot plans',
    main:listValue(artifact.shots),
    secondary:[] as unknown[],
    secondaryHeading:''
  };
}

function ReviewArtifact({ stage, state }: { stage: PreparationStage; state: WorkspaceStage }) {
  const result = artifactSummary(stage, state.artifact || {});
  return (
    <div className="episode-preparation-artifact">
      <h3>{result.heading}</h3>
      {result.main.length === 0 && <p>No draft yet.</p>}
      {result.main.map((item, index) => (
        <div className="episode-preparation-artifact-row" key={index}>
          {typeof item === 'string'
            ? <p>{item}</p>
            : item && typeof item === 'object'
              ? <div>
                  <strong>{stringValue((item as Record<string,unknown>).shotKey)
                      || stringValue((item as Record<string,unknown>).sectionTitle)
                      || stringValue((item as Record<string,unknown>).title)
                      || 'Section ' + (index+1)}</strong>
                  <p>{stringValue((item as Record<string,unknown>).narration)
                      || stringValue((item as Record<string,unknown>).visualGoal)
                      || stringValue((item as Record<string,unknown>).summary)}</p>
                </div>
              : null}
        </div>
      ))}
      {result.secondary.length > 0 && <>
        <h3>{result.secondaryHeading}</h3>
        {result.secondary.map((entry,index) =>
          <p key={index} className="episode-preparation-artifact-row">{String(entry)}</p>)}
      </>}
      <details className="episode-preparation-details">
        <summary>Full production artifact</summary>
        <pre>{JSON.stringify(state.artifact,null,2)}</pre>
      </details>
    </div>
  );
}

export function EpisodePreparationPage({ episodeId }: { episodeId: string }) {
  const [context, setContext] = useState<WorkspaceContext | null>(null);
  const [original, setOriginal] = useState<EpisodeBrief | null>(null);
  const [idea, setIdea] = useState('');
  const [sources, setSources] = useState('');
  const [amendedSources, setAmendedSources] = useState('');
  const [scopeBoundary, setScopeBoundary] = useState('');
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<AgentPreview | null>(null);
  const [previewStage, setPreviewStage] = useState<PreparationStage | null>(null);
  const [previewAction, setPreviewAction] = useState<'GENERATE' | 'REVISE'>('GENERATE');
  const [revising, setRevising] = useState(false);
  const [correction, setCorrection] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [ctx, brief] = await Promise.all([
      episodePreparationApi.context(episodeId), episodePreparationApi.brief(episodeId)
    ]);
    setContext(ctx);
    setOriginal(brief);
    setIdea(brief.brief);
    setSources(brief.sources);
  }

  useEffect(() => {
    let active = true;
    Promise.all([episodePreparationApi.context(episodeId),episodePreparationApi.brief(episodeId)])
      .then(([ctx,brief]) => {
        if (!active) return;
        setContext(ctx);
        setOriginal(brief);
        setIdea(brief.brief);
        setSources(brief.sources);
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { active = false; };
  }, [episodeId]);

  async function perform(work: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await work();
      await load();
      setPreview(null);
      setPreviewStage(null);
      setRevising(false);
      setCorrection('');
      setApprovalOpen(false);
      setApprovalNote('');
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setBusy(false); }
  }

  const currentStage: PreparationStage | undefined = stages.find(stage =>
    context?.stages.find(item => item.stageKey === stage)?.status !== 'LOCKED'
  );
  const current = context?.stages.find(item => item.stageKey === currentStage);
  const canEditBrief = context?.stages.find(item => item.stageKey === 'RESEARCH')?.revision === 0;
  const upstream = currentStage === 'SCRIPT' ? 'RESEARCH' : currentStage === 'SCENE' ? 'SCRIPT' : null;
  const upstreamLocked = !upstream || context?.stages.some(item =>
    item.stageKey === upstream && item.status === 'LOCKED');
  const readyToLock = current?.status === 'READY_FOR_REVIEW' && (current.revision || 0) > 0;
  const researchSources = listValue(context?.stages.find(item => item.stageKey === 'RESEARCH')?.artifact?.technicalSources);
  const hasSources = researchSources.length > 0;
  const hasBoundary = listValue(context?.stages.find(item => item.stageKey === 'RESEARCH')?.artifact?.outOfScope).length > 0;
  const canApprove = readyToLock && approvalNote.trim().length >= 10;

  async function requestPreview() {
    if (!currentStage || !current || busy) return;
    const action = revising && currentStage !== 'RESEARCH' ? 'REVISE' : 'GENERATE';
    const message = action === 'REVISE' ? correction.trim() : '';
    if (action === 'REVISE' && !message) {
      setError('Write the correction before preparing a revision.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await episodePreparationApi.preview(
        episodeId,currentStage,current.revision,action,message);
      setPreview(response);
      setPreviewStage(currentStage);
      setPreviewAction(action);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setBusy(false); }
  }

  return (
    <main className="media-os-page episode-hub episode-preparation">
      <nav className="episode-preparation-nav">
        <button type="button" onClick={() => { window.location.hash = '#/episodes'; }}>
          <ArrowLeft size={18}/> Episodes
        </button>
        <button type="button" onClick={() => {
          window.location.hash = '#/episodes/' + episodeId + '/director';
        }}>Director</button>
      </nav>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {!context && <p className="episode-preparation-message">Opening episode…</p>}

      {context && <>
        <header className="episode-preparation-header">
          <h1>{context.episode.episodeNumber} — {context.episode.title}</h1>
        </header>
        <section className="episode-preparation-brief">
          <div className="episode-preparation-section-heading">
            <h2>Episode Brief</h2>
            {canEditBrief && <button type="button" className="episode-preparation-secondary"
              onClick={() => setEditing(value => !value)}>{editing ? 'Cancel' : 'Edit'}</button>}
          </div>
          {!editing ? <>
            <p>{original?.brief}</p>
            {original?.sources && <details className="episode-preparation-details">
              <summary>Technical sources</summary>
              <p>{original.sources}</p>
            </details>}
          </> : <form className="episode-preparation-form" onSubmit={event => {
            event.preventDefault();
            if (!original) return;
            void perform(() => episodePreparationApi.saveBrief(
              episodeId,idea,sources,original.revision));
          }}>
            <label htmlFor="preparation-brief">Episode idea</label>
            <textarea id="preparation-brief" rows={7} value={idea} maxLength={10000}
              onChange={event => setIdea(event.target.value)}/>
            <label htmlFor="preparation-sources">Technical sources</label>
            <textarea id="preparation-sources" rows={4} value={sources} maxLength={12000}
              onChange={event => setSources(event.target.value)}/>
            <button type="submit" className="episode-preparation-primary"
              disabled={busy || idea.trim().length < 20}>Save Brief</button>
          </form>}
        </section>

        <section className="episode-preparation-pipeline">
          <h2>Production Preparation</h2>
          {stages.map(stage => {
            const item = context.stages.find(value => value.stageKey === stage);
            const locked = item?.status === 'LOCKED';
            const active = stage === currentStage;
            return <div className="episode-preparation-stage" key={stage}>
              <div className="episode-preparation-stage-title">
                <h3>{stageNames[stage]}</h3>
                <span className={locked ? 'episode-preparation-locked' : 'episode-preparation-pending'}>
                  {locked ? 'Locked' : active ? 'Current' : 'Waiting'}
                </span>
              </div>
              {active && item && <>
                {item.revision > 0 && <ReviewArtifact stage={stage} state={item}/>}
                {stage === 'RESEARCH' && !hasSources && <>
                  <p className="episode-preparation-message">
                    Research needs technical references before Director LOCK. AI output is not a verified source.
                  </p>
                  {item.revision > 0 && <form className="episode-preparation-form"
                    onSubmit={event => {
                      event.preventDefault();
                      void perform(() => episodePreparationApi.attachResearchSources(
                        episodeId,item.revision,amendedSources));
                    }}>
                    <label htmlFor="research-source-notes">Add technical references</label>
                    <textarea id="research-source-notes" rows={3} value={amendedSources}
                      onChange={event => setAmendedSources(event.target.value)}
                      placeholder="One official reference or technical source per line." />
                    <button type="submit" className="episode-preparation-primary"
                      disabled={busy || !amendedSources.trim()}>Save references (no AI cost)</button>
                  </form>}
                </>}
                {stage === 'RESEARCH' && item.revision > 0 && !hasBoundary && <>
                  <p className="episode-preparation-message">
                    Define at least one topic outside this episode's scope before approval.
                  </p>
                  <form className="episode-preparation-form"
                    onSubmit={event => {
                      event.preventDefault();
                      const boundaries = scopeBoundary.split('\n').map(x => x.trim()).filter(Boolean);
                      if (boundaries.length === 0) return;
                      void perform(() => episodePreparationApi.saveResearchBoundaries(
                        episodeId,item.artifact,item.summary,item.revision,boundaries));
                    }}>
                    <label htmlFor="research-scope-boundary">Out-of-scope boundaries</label>
                    <textarea id="research-scope-boundary" rows={3} value={scopeBoundary}
                      onChange={event => setScopeBoundary(event.target.value)}
                      placeholder="One clear topic we will not explain in this episode."/>
                    <button type="submit" className="episode-preparation-primary"
                      disabled={busy || !scopeBoundary.trim()}>Save boundaries (no AI cost)</button>
                  </form>
                </>}
                {!upstreamLocked && <p className="episode-preparation-message">
                  Approve {upstream} before generating this stage.
                </p>}

                {upstreamLocked && !approvalOpen && <>
                  {readyToLock && stage !== 'RESEARCH' && !revising &&
                    <button type="button" className="episode-preparation-secondary"
                      onClick={() => { setRevising(true);setPreview(null);setPreviewStage(null); }}>
                      Improve Draft
                    </button>}
                  {revising && stage !== 'RESEARCH' && <div className="episode-preparation-form">
                    <label htmlFor="episode-creator-correction">Describe your correction</label>
                    <textarea id="episode-creator-correction" rows={4} maxLength={6000}
                      value={correction} onChange={event => {
                        setCorrection(event.target.value);
                        setPreview(null);setPreviewStage(null);
                      }}
                      placeholder="Пример: SHOT 04 трябва да обясни защо retry влошава проблема."/>
                    <button type="button" className="episode-preparation-secondary"
                      onClick={() => { setRevising(false);setCorrection('');
                        setPreview(null);setPreviewStage(null); }}>Cancel revision</button>
                  </div>}
                  <div className="episode-preparation-actions">
                    {(!readyToLock || revising || stage === 'RESEARCH') &&
                      (!preview || previewStage !== stage
                        ? <button type="button" className="episode-preparation-secondary"
                            disabled={busy || (revising && !correction.trim())}
                            onClick={() => void requestPreview()}>
                            Preview {revising ? 'Revision' : 'Generation'}
                          </button>
                        : <button type="button" className="episode-preparation-primary"
                            disabled={busy || !preview.canRun || !preview.authorizationToken}
                            onClick={() => void perform(() => episodePreparationApi.generate(
                              episodeId,stage,item.revision,preview.authorizationToken!,
                              previewAction,previewAction === 'REVISE' ? correction.trim() : ''))}>
                            {revising ? 'Generate Revision' : 'Generate Draft'} (paid AI)
                          </button>)}
                    {readyToLock && !revising &&
                      <button type="button" className="episode-preparation-secondary"
                        disabled={busy} onClick={() => {
                          setApprovalOpen(true);setPreview(null);setPreviewStage(null);
                        }}>Review & Lock</button>}
                  </div>
                  {preview && previewStage === stage && !preview.canRun &&
                    <p className="episode-preparation-message">{preview.blockers.join(' ')}</p>}
                </>}

                {approvalOpen && <div className="episode-preparation-approval">
                  <h3>Director Approval</h3>
                  <label htmlFor="episode-stage-approval">Decision note</label>
                  <textarea id="episode-stage-approval" rows={3} value={approvalNote}
                    onChange={event => setApprovalNote(event.target.value)}
                    placeholder="Кои факти и резултати провери и одобряваш?" />
                  <div className="episode-preparation-actions">
                    <button type="button" className="episode-preparation-primary"
                      disabled={!canApprove || busy || (stage === 'RESEARCH' && (!hasSources || !hasBoundary))}
                      onClick={() => void perform(() => episodePreparationApi.approveStage(
                        episodeId,stage,item.revision,approvalNote))}>Director LOCK</button>
                    <button type="button" className="episode-preparation-secondary"
                      onClick={() => setApprovalOpen(false)}>Cancel</button>
                  </div>
                </div>}
              </>}
            </div>;
          })}
          {!currentStage && <div className="episode-preparation-actions">
            <button type="button" className="episode-preparation-primary"
              onClick={() => { window.location.hash = '#/episodes/' + episodeId + '/director'; }}>
              Open Director Overview
            </button>
          </div>}
        </section>
      </>}
    </main>
  );
}
