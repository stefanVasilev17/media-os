import {useEffect,useState} from 'react';
import {BookOpenCheck,GitBranch,LockKeyhole,RotateCcw} from 'lucide-react';

type Rule={path:string;role:string};
type StoryBeat={number:number;direction:string};
type Story={
  visualGoal:string;cameraDirection:string;truthContinuity:string;
  assetDirection:string;transition:string;beats:StoryBeat[];
};
type Candidate={
  shotKey:string;title:string;beatCount:number;codeDestination:string;
  narrationRevision:number;narrationSha256:string;approvedTakeId:string|null;
  durationInFrames:number|null;cameraDirection:string;visualGoal:string;
  continuity:string;approvedVisualStory:Story;
};
type RecordedCorrection={
  shotKey:string;changeArea:string;problemObserved:string;
  requestedCorrection:string;recordedAt:string;
};
type Preflight={
  schemaVersion:string;episodeKey:string;inputFingerprint:string;status:string;
  nextShotKey:string|null;previousAcceptedShotKey:string|null;
  followingShotKey:string|null;protectedShot01Path:string;
  acceptedSceneCount:number;remainingSceneCount:number;
  candidate:Candidate|null;mandatoryRuleFiles:Rule[];
  currentDirectorNotes:RecordedCorrection[];blockers:string[];latestPolicyGitVerified:boolean;
  realCueFramesVerified:boolean;readyForCodex:boolean;
  startsCodex:boolean;startsRender:boolean;executableCodexPrompt:string|null;
};

const ENDPOINT='/api/v1/creative/episodes/EP002/visual-codex-preflight';
const descriptions:Record<string,string>={
  ALL_CURRENT_REVISION_DIRECTOR_TAKES_REQUIRED:'Approve current voice Takes for every SHOT',
  ALL_ELEVEN_MEASURED_AUDIO_DURATIONS_REQUIRED:'Verify measured audio duration for all 11 SHOTs',
  REAL_HEAR_SEE_TIMED_CUES_REQUIRED_FOR_ALL_SHOTS:'Map every approved beat to real speech timestamps',
  UNRESOLVED_ELEVENLABS_LEDGER_MUST_BE_RECONCILED:'Resolve historical uncertain ElevenLabs attempts',
  NEXT_SHOT_HAS_UNRESOLVED_SOURCE_OR_VOICE_BLOCKERS:'Resolve the selected SHOT readiness blockers',
  VERSIONED_VISUAL_POLICY_AND_LEDGER_GIT_SHA_NOT_YET_VERIFIED:
    'Verify the latest visual constitution and approved corrections at one Git commit',
    EP002_RENDER_WORKER_AND_FINAL_ASSEMBLY_NOT_CONNECTED:
    'Build and verify the EP002 Remotion worker, preview and Master/Shorts assembly',
};

export function Ep002SequentialVisualPreflightPanel(){
  const [state,setState]=useState<Preflight|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    let active=true;
    void fetch(ENDPOINT,{cache:'no-store'})
      .then(async response=>{
        if(!response.ok)throw new Error('Sequential visual preflight unavailable (HTTP '+response.status+').');
        return await response.json() as Preflight;
      }).then(data=>{if(active){setState(data);setError('');}})
      .catch(reason=>{if(active){setState(null);setError(String(reason));}})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[refresh]);

  return <section className="library-episode-batch" aria-label="EP002 sequential Codex visual preflight">
    <div className="library-episode-batch-heading">
      <div>
        <h2><GitBranch size={21}/> Sequential Remotion — Next SHOT</h2>
        <p>One full-episode visual world, but one Codex Remotion code task at a time.
          Every new scene must read the shared style rules, approved correction history and
          previously accepted visual continuity before any coding.</p>
      </div>
      <span className="library-episode-batch-state">{loading?'CHECKING'
        :state?.readyForCodex?'PREFLIGHT PASSED':'PREFLIGHT ONLY'}</span>
    </div>

    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    {state&&<>
      <div className="library-episode-batch-metrics">
        <div><strong>{state.nextShotKey??'—'}</strong><span>Next candidate</span></div>
        <div><strong>{state.previousAcceptedShotKey??'—'}</strong><span>Prior visual reference</span></div>
        <div><strong>{state.remainingSceneCount}</strong><span>Scenes still awaiting acceptance</span></div>
        <div><strong>{state.mandatoryRuleFiles.length}</strong><span>Required source references</span></div>
      </div>

      {state.candidate&&<details className="library-episode-batch-breakdown" open>
        <summary>{state.candidate.shotKey} — {state.candidate.title} · pre-code storyboard</summary>
        <div className="library-episode-batch-shots">
          <p><strong>Visual goal:</strong> {state.candidate.visualGoal}</p>
          <p><strong>Camera:</strong> {state.candidate.cameraDirection}</p>
          <p><strong>Continuity:</strong> {state.candidate.continuity}</p>
          <p><strong>Remotion proposal path:</strong> {state.candidate.codeDestination}</p>
          <p><strong>Audio:</strong> {state.candidate.approvedTakeId?'Selected':'Not yet selected'} ·
            {' '}Actual frame count: {state.candidate.durationInFrames??'not verified'}</p>
          <ol>{state.candidate.approvedVisualStory.beats.map(beat=>
            <li key={beat.number}>{beat.direction}</li>)}</ol>
        </div>
      </details>}

      <details className="library-episode-batch-breakdown">
        <summary><BookOpenCheck size={16}/> Required visual rules and approved lessons</summary>
        <ul>{state.mandatoryRuleFiles.map(file=>
          <li key={file.path}><strong>{file.path}</strong> — {file.role}</li>)}</ul>
      </details>

      <details className="library-episode-batch-breakdown">
        <summary>Recorded corrections for this SHOT ({state.currentDirectorNotes.length})</summary>
        {state.currentDirectorNotes.length===0
          ?<p>No current-source Director correction notes. Approved global lessons are stored separately.</p>
          :<div className="library-episode-batch-shots">
            {state.currentDirectorNotes.map((note,index)=><div key={index}
              className="library-episode-batch-shot">
              <strong>{note.changeArea} · {note.recordedAt}</strong>
              <p>Observed: {note.problemObserved}</p>
              <p>Requested correction: {note.requestedCorrection}</p>
              <small>Director note only — not yet visually accepted or promoted to a global rule</small>
            </div>)}
          </div>}
      </details>

      <details className="library-episode-batch-breakdown" open>
        <summary><LockKeyhole size={16}/> Why Codex execution is blocked</summary>
        <ul>{state.blockers.map(blocker=>
          <li key={blocker}>{descriptions[blocker]??blocker}</li>)}</ul>
      </details>

      <p className="library-note">This page is a read-only preflight, not a Codex task.
        SHOT01 remains protected; SHOT03 cannot advance without accepted SHOT02.
        Codex Cloud, TTS, AI API, rendering and deployment are not started.
        Source fingerprint: {state.inputFingerprint.slice(0,12)}…</p>
    </>}

    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh" disabled={loading}
        onClick={()=>{setLoading(true);setRefresh(value=>value+1);}}>
        <RotateCcw size={14}/> Refresh next visual preflight
      </button>
    </div>
  </section>;
}
