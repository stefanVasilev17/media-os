import {useCallback, useEffect, useState} from 'react';
import {ArrowLeft, ExternalLink, FileText, Film, Mic2} from 'lucide-react';
import {ep001, ep002, renderVideoUrl} from '../lib/episodeProductionLibrary';
import {studio, type StudioShot, type StudioClip} from '../api/studioApi';
import {loadProductionContract, type ProductionContractState} from '../api/productionContractApi';
import {listEpisodeWorkspaces, type EpisodeSummary} from '../api/episodeWorkspaceApi';
import {type ShotVoiceStatus} from '../components/Ep002VoiceActions';
import {Ep002CreativeShotEditor} from '../components/Ep002CreativeShotEditor';
import {Ep002ProductionContractPanel} from '../components/Ep002ProductionContractPanel';
import {Ep002RemotionSceneContractPanel} from '../components/Ep002RemotionSceneContractPanel';
import {Ep002ProductionFactoryConsole} from '../components/Ep002ProductionFactoryConsole';
import {Ep002LockedCutReviewRoom} from '../components/Ep002LockedCutReviewRoom';
import '../styles/episodeProductionLibrary.css';

type EpisodeKey = 'EP001' | 'EP002';
type VisualShot = {
  shotKey: string; title: string; visualGoal: string;
  visualPlanMarkdown: string; cameraDirection: string; assetDirection: string;
};

const visualShots = (ep002.visualPlan.shots as VisualShot[]);
const shotTitle = (shot: StudioShot) => shot.title || shot.shotKey;
const link = (href: string, name: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{name} <ExternalLink size={14} aria-hidden="true"/></a>
);
const docText = (text: string) => <pre className="library-verbatim">{text}</pre>;

function LegacyStudioArchive() {
  const [shots, setShots] = useState<StudioShot[]>([]);
  const [contract, setContract] = useState<ProductionContractState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void Promise.allSettled([studio.shots(), loadProductionContract()]).then(results => {
      if (!active) return;
      if (results[0].status === 'fulfilled') setShots(results[0].value);
      else setErrors(errors => [...errors, 'Studio shot details could not be loaded.']);
      if (results[1].status === 'fulfilled') setContract(results[1].value);
      else setErrors(errors => [...errors, 'Legacy HEAR → SEE contract could not be loaded.']);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const studioShots = shots.filter(s => s.shotNumber >= 1 && s.shotNumber <= 12
    && !s.sourceShotKey).sort((a,b) => a.shotNumber - b.shotNumber);
  return <section className="library-section">
    <div className="library-section-title"><Mic2 size={19}/><h2>Studio narration, voice and HEAR → SEE reference</h2></div>
    <p>Live Studio data is read-only here. Historical Studio numbering and the legacy production contract are not substitutes for the Director-approved 12-shot final master. Original voice clips and locked render files remain untouched.</p>
    {loading && <p>Loading existing Studio and production-contract records…</p>}
    {errors.map((error,i) => <p role="alert" key={i}>{error}</p>)}
    {studioShots.length === 0 && !loading && <p>No Studio shot data was returned. Use the source documents and protected render references above.</p>}
    {studioShots.map(shot => <details key={shot.id} className="library-shot">
      <summary><span className="library-shot-key">{shot.shotKey}</span><strong>{shotTitle(shot)}</strong><span>{shot.clips.filter(c=>c.approvedAt).length}/{shot.clips.length} voice clips approved</span></summary>
      <div className="library-shot-body">
        <p><strong>Stored Studio visual direction</strong></p>
        {shot.visualPrompt ? docText(shot.visualPrompt) : <p>Not available in this Studio record.</p>}
        {shot.previewRenderId && <p>{link(renderVideoUrl(shot.previewRenderId), 'Open Studio preview (availability not verified)')}</p>}
        <h3>Original Studio narration clips</h3>
        {[...shot.clips].sort((a,b)=>a.sequence-b.sequence).map((clip: StudioClip) => <div className="library-clip" key={clip.id}>
          <p><strong>{clip.clipKey}</strong> · {clip.lockedAt ? 'Script LOCK recorded' : 'Draft'} · {clip.approvedAt ? 'Voice approved' : 'Voice not approved'}</p>
          {docText(clip.narration)}
          <p><strong>Voice direction:</strong> {clip.voiceDirection || 'Not recorded'}</p>
          {clip.generated && <audio controls preload="none" src={studio.audioUrl(clip.id,clip.generationRevision)}>Audio playback unavailable.</audio>}
        </div>)}
      </div>
    </details>)}
    <details className="library-shot library-historical">
      <summary><strong>Historical 16-SHOT screenplay and HEAR → SEE contract</strong><span>Archive · not current</span></summary>
      <div className="library-shot-body">
        <p>This earlier timeline predates the approved successful-login-only cut. The old SHOT numbers must not be treated as the final twelve-shot order.</p>
        {contract?.payload?.timeline?.length
          ? contract.payload.timeline.map((segment,i) => <details key={segment.segmentId || i} className="library-clip">
              <summary>{segment.shotKey} · {segment.clipKey} · {segment.startSecond}–{segment.endSecond}s</summary>
              <h3>HEAR</h3>{docText(segment.hear)}
              <h3>SEE / camera / objects</h3>{docText(JSON.stringify(segment.visual,null,2))}
            </details>)
          : <p>No legacy production contract available.</p>}
      </div>
    </details>
  </section>;
}

function Ep001Library({production}: {production?: EpisodeSummary}) {
  return <>
    <div className="library-facts">
      <div><strong>12</strong><span>Director-locked SHOT masters</span></div>
      <div><strong>20:56.767</strong><span>Final-polish review duration</span></div>
      <div><strong>30 fps</strong><span>1080p H264/AAC QA</span></div>
    </div>
    <section className="library-section">
      <div className="library-section-title"><FileText size={19}/><h2>Current editorial source of truth</h2></div>
      <p>{ep001.scope}</p>
      <div className="library-links">
        {link(ep001.editorialApproval,'Director editorial scope LOCK · 21 Oct')}
        {link(ep001.shotAssembly,'Exact 12-SHOT assembly and source render IDs')}
        {link(ep001.finalReview,'Final 12-SHOT technical QA and corrections')}
      </div>
      <p className="library-warning">All twelve individual creative SHOT locks are preserved. The complete assembled review film passed technical QA, but its final end-to-end Director watch/LOCK was not recorded. This page does not grant one.</p>
    </section>
    <section className="library-section">
      <div className="library-section-title"><Film size={19}/><h2>Approved source videos and final review master</h2></div>
      <p>{link(renderVideoUrl(ep001.finalReviewRenderId), 'Play final-polish 12-SHOT review master')}</p>
      <p className="library-note">Existing files only. No render or ElevenLabs generation is triggered. Media retention can affect older playback URLs.</p>
      <div className="library-reference-list">
        {ep001.renderReferences.map(item => <div key={item.renderId}>
          <strong>{item.label}</strong>
          {link(renderVideoUrl(item.renderId),'View original render')}
        </div>)}
      </div>
      <p>{link(ep001.finalShotDocs[11], 'SHOT 11 V5 — exact voice and visual Director LOCK')}</p>
      <p>{link(ep001.finalShotDocs[12], 'SHOT 12 V5 — exact voice and visual Director LOCK')}</p>
    </section>
    <LegacyStudioArchive />
    <section className="library-section">
      <h2>Native MediaOS workspace</h2>
      <p>{production ? 'The production database contains EP001. Its legacy script stage still contains the historical timeline and must not replace the current 12-shot creative masters.' : 'EP001 production record not found in the latest catalog read.'}</p>
      {production && <a className="library-primary-link" href={'#/episodes/'+production.id+'/director'}>Open native / historical Director workspace</a>}
    </section>
  </>;
}

function Ep002Library({production}: {production?: EpisodeSummary}) {
  const [shotVoiceStatuses,setShotVoiceStatuses] = useState<Record<string,ShotVoiceStatus>>({});
  const onVoiceStatus = useCallback((shotKey:string,status:ShotVoiceStatus)=>{
    setShotVoiceStatuses(previous => previous[shotKey] === status
      ? previous : {...previous,[shotKey]:status});
  },[]);
  const [contractEpochs,setContractEpochs]=useState<Record<string,number>>({});
  const onProductionChanged=useCallback((shotKey:string)=>{
    setContractEpochs(previous=>({...previous,[shotKey]:(previous[shotKey]??0)+1}));
  },[]);
  const lockedCount = Object.values(shotVoiceStatuses).filter(s=>s==='locked').length;
  return <>
    <div className="library-facts">
      <div><strong>11</strong><span>Director-locked script SHOTs</span></div>
      <div><strong>{ep002.wordCount}</strong><span>Approved English words</span></div>
      <div><strong>59</strong><span>Visual beats in approved NEW Visual Pass</span></div>
    </div>
    <Ep002LockedCutReviewRoom/>
    <Ep002ProductionFactoryConsole/>
    
    
    
    
    <section className="library-section">
      <div className="library-section-title"><FileText size={19}/><h2>Full Script v5.0 — Recovery SHOT08–11 and HEAR → SEE</h2></div>
      <p>Original Script v4.0 is preserved as a historical source. Current Director-approved
        v5.0 keeps SHOT01–07 word-for-word and introduces recovery scripts for
        SHOT08–11. Their new text and 24 spoken beat anchors are already prepared
        in the Voice Studio. Generate the FIRST Take directly in Slow Natural mode.
        Beat inputs are populated automatically; you only listen and confirm before
        real ElevenLabs character timestamps are accepted.</p>
      <div className="library-links">
        {link(ep002.editorialApproval,'Archived Full Script v4.0 — Director LOCK event')}
        {link('https://github.com/stefanVasilev17/media-os/pull/239',
          'Recovery Script SHOT08–11 v5.0 — Director-approved text')}
        {link(ep002.scriptAssembly,'Complete original script assembly and technical guardrails')}
        {link(ep002.visualApproval,'Visual Pass v1.0 — Director creative approval')}
        {link(ep002.qaAudit,'Research/Script/Scene QA database audit and provenance')}
      </div>
      <p className="library-warning">The original v4.0 narration, previously approved Takes, and Visual Pass v1.0
        remain in the archive. The new recovery SHOT08–11 scripts are imported as
        separate traceable revisions, never overwriting old recordings. Each new
        Slow Natural Take requires your own explicit paid confirmation. The old
        SHOT08 3-to-6 Auth scaling render has been retired.</p>
      <p className="library-voice-overview" role="status">
        <strong>{lockedCount} / 11 voice SHOTs LOCKED</strong> ·
        Green border means the selected voice take is approved for the current text version. You can still edit and save a newer version whenever you want.
      </p>
      <div className="library-shot-list">
        {ep002.shots.map((shot,index) => {
          const visual = visualShots.find(item => item.shotKey === shot.shotKey);
          const voiceStatus=shotVoiceStatuses[shot.shotKey];
          return <details key={shot.shotKey}
            className={'library-shot library-ep002-shot'+(voiceStatus==='locked'?' library-shot-voice-locked':'')}>
            <summary>
              <span className="library-shot-key">{shot.shotKey}</span>
              <strong>{shot.title}</strong>
              <span className="library-shot-meta">{shot.editorialStart}–{shot.editorialEnd}
                {voiceStatus==='locked' && <b className="library-shot-locked-text">VOICE LOCKED</b>}
                {voiceStatus==='generated' && <b className="library-shot-recorded-text">TAKE READY</b>}
              </span>
            </summary>
            <div className="library-shot-body">
              <p><strong>Original approved source revision:</strong> {shot.directorScriptRevision} · <strong>Editorial duration:</strong> {shot.editorialDurationSeconds}s · <strong>Words:</strong> {shot.wordCount}</p>
              <Ep002CreativeShotEditor shot={shot} onVoiceStatus={onVoiceStatus}
                onProductionChanged={onProductionChanged}/>
              <Ep002ProductionContractPanel shotKey={shot.shotKey}
                refreshToken={contractEpochs[shot.shotKey]??0}/>
              {shot.shotKey==='SHOT01' &&
                <Ep002RemotionSceneContractPanel refreshToken={contractEpochs[shot.shotKey]??0}/>}

              <h3>SEE — {index<7?'Director-approved Visual Pass v1.0':
                'Recovery v5.0 — automatically prepared spoken beats'}</h3>
              {visual ? docText(visual.visualPlanMarkdown) : <p>Visual source unavailable for this SHOT.</p>}
              <p className="library-note">Current script source audio: {shot.audioStatus}. Earlier recordings remain
                visible in history; only a Take for the current revision can be approved.</p>
              {index===0 && <p className="library-note">All source text is rendered without AI rewriting.</p>}
            </div>
          </details>;
        })}
      </div>
      <details className="library-shot library-historical">
        <summary><strong>Complete approved visual document / continuity</strong><span>11 SHOTs · 59 beats</span></summary>
        <div className="library-shot-body">{docText(String(ep002.visualPlan.originalApprovedVisualPassMarkdown || 'Unavailable'))}</div>
      </details>
    </section>
    <section className="library-section">
      <h2>Native production workspace</h2>
      {production ? <>
        <p>EP002 also has a native production workspace. Stage status: <strong>{production.currentStage}</strong>. Creative editing and voice on this page work independently of stage LOCKs.</p>
        <a className="library-primary-link" href={'#/episodes/'+production.id+'/prepare'}>Open production episode preparation</a>
      </> : <>
        <p>This Creative Draft page now saves script versions and audio directly in the existing production PostgreSQL, independently of the native Episode Factory stage workflow. A native EP002 preparation workspace is optional for this creative editing and voice flow.</p>
        <details className="library-shot"><summary>Optional: set up native Episode Factory production stages</summary>
          <p>The editable script and voice studio above are already operational independently of stage approvals.</p>
          <a className="library-primary-link" href="#/episodes/new?template=EP002">Open optional EP002 preparation workflow</a>
        </details>
      </>}
    </section>
  </>;
}

export function EpisodeProductionLibraryPage({episodeKey}: {episodeKey: EpisodeKey}) {
  const [catalog,setCatalog] = useState<EpisodeSummary[]>([]);
  const [catalogError,setCatalogError] = useState('');
  useEffect(() => {
    let active = true;
    listEpisodeWorkspaces().then(rows => {if(active)setCatalog(rows);})
      .catch(() => {if(active)setCatalogError('Live catalog could not be loaded; approved source documents remain available.');});
    return () => {active = false;};
  },[]);
  const production = catalog.find(item => item.episodeNumber === episodeKey);
  return <main className="media-os-page episode-library">
    <nav className="library-topnav">
      <button type="button" onClick={() => {window.location.hash = '#/episodes';}}><ArrowLeft size={17}/> Episodes</button>
      <div className="library-switch">
        <a className={episodeKey==='EP001'?'selected':''} href="#/library/EP001">EP001</a>
        <a className={episodeKey==='EP002'?'selected':''} href="#/library/EP002">EP002</a>
      </div>
    </nav>
    <header className="library-header">
      <p>ARCHITECTURAL THINKING / DIRECTOR SOURCE LIBRARY / {episodeKey==='EP001'?'READ ONLY':'VOICE STUDIO'}</p>
      <h1>{episodeKey} — {episodeKey==='EP001'?ep001.title:ep002.title}</h1>
      <p>{episodeKey==='EP001'?'Final approved 12-SHOT happy-path production':'Director-approved v5.0 recovery SHOT08–11 · First-Take Slow Natural Voice Studio · automatic HEAR → SEE beats'}</p>
    </header>
    {catalogError && <p role="alert" className="library-warning">{catalogError}</p>}
    {episodeKey==='EP001'?<Ep001Library production={production}/>:<Ep002Library production={production}/>}
    <footer className="library-footer">Source records remain immutable. {episodeKey==='EP001' ? 'Read-only EP001 archive.' : 'Voice is a separately confirmed paid action for any saved Creative Draft version; no script or scene LOCK is needed.'}</footer>
  </main>;
}
