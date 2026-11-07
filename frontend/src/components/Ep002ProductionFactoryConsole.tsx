import {useEffect,useState} from 'react';
import {BookOpenCheck,Clapperboard,Film,Layers3,MessageSquareText,ShieldCheck} from 'lucide-react';
import {Ep002EpisodeBatchPlanPanel} from './Ep002EpisodeBatchPlanPanel';
import {Ep002DirectorVoiceCuePanel} from './Ep002DirectorVoiceCuePanel';
import {Ep002FactoryReadinessBridgePanel} from './Ep002FactoryReadinessBridgePanel';
import {Ep002SequentialVisualPreflightPanel} from './Ep002SequentialVisualPreflightPanel';
import {Ep002CodexAutomationPanel} from './Ep002CodexAutomationPanel';
import {MediaOsVerificationPanel} from './MediaOsVerificationPanel';
import {MediaOsVerificationAutopilotPanel} from './MediaOsVerificationAutopilotPanel';
import {Ep002VisualDirectorFeedbackPanel} from './Ep002VisualDirectorFeedbackPanel';
import {Ep002DirectorVisualAcceptancePanel} from './Ep002DirectorVisualAcceptancePanel';
import {Ep002Shot02RenderPanel} from './Ep002Shot02RenderPanel';

type Stage='VOICE'|'CODEX'|'CORRECTIONS'|'APPROVAL';
type Status={nextShotKey:string|null;remainingSceneCount:number;
  readyForCodex:boolean;realCueFramesVerified:boolean;blockers:string[]};
const stages=[
  {key:'VOICE' as Stage,title:'Episode + Voice',icon:Layers3},
  {key:'CODEX' as Stage,title:'Next Remotion SHOT',icon:Clapperboard},
  {key:'CORRECTIONS' as Stage,title:'Director Corrections',icon:MessageSquareText},
  {key:'APPROVAL' as Stage,title:'Verified Preview Approval',icon:ShieldCheck},
];

export function Ep002ProductionFactoryConsole(){
  const [stage,setStage]=useState<Stage>('VOICE');
  const [status,setStatus]=useState<Status|null>(null);
  const [error,setError]=useState('');
  const [cycle,setCycle]=useState(0);

  useEffect(()=>{
    let live=true;
    void fetch('/api/v1/creative/episodes/EP002/visual-codex-preflight',
      {cache:'no-store'}).then(async r=>{
      if(!r.ok)throw Error('Current production state unavailable (HTTP '+r.status+').');
      return await r.json() as Status;
    }).then(data=>{if(live){setStatus(data);setError('');}})
      .catch(e=>{if(live)setError(String(e));});
    return()=>{live=false;};
  },[cycle]);

  return <section className="library-section" aria-label="EP002 unified production factory">
    <div className="library-section-title">
      <Film size={20}/><h2>EP002 — Unified Production Factory</h2>
    </div>
    <p>One locked episode. All voices prepared together. Exactly one Remotion
      SHOT built and visually reviewed at a time. Every Director correction feeds
      the next scene. Final Master and three Shorts require real render evidence
      and separate authorization.</p>
    <div className="library-episode-batch-metrics">
      <div><strong>11</strong><span>Approved SHOT plans</span></div>
      <div><strong>59</strong><span>HEAR → SEE beats</span></div>
      <div><strong>{status?.nextShotKey??'—'}</strong><span>Next visual candidate</span></div>
      <div><strong>{status?.remainingSceneCount??'—'}</strong>
        <span>Scenes awaiting Director acceptance</span></div>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    <p className="library-note"><BookOpenCheck size={15} aria-hidden="true"/>
      {' '}Product state: {status?.readyForCodex?'Prerequisites reviewed — confirm Codex workflow'
        :'Not yet production-ready'}.
      {status&&!status.realCueFramesVerified
        ?' Verified all-episode audio cue mapping is still missing.':''}
      {' '}The approved SHOT01 remains protected. Viewing these panels never starts paid TTS, Codex Cloud, CPU rendering,
      deployment or publishing. SHOT02 preview CPU requires a separate
      explicit Director click and a pinned, verified Worker release.</p>
    <div className="library-episode-batch-actions" role="group"
      aria-label="EP002 production workflow stages">
      {stages.map(tab=><button key={tab.key} type="button"
        className={stage===tab.key?'library-voice-button':'library-voice-refresh'}
        aria-pressed={stage===tab.key} onClick={()=>{
          setStage(tab.key);setCycle(n=>n+1);
        }}>
        <tab.icon size={15}/>{tab.title}
      </button>)}
    </div>
    {stage==='VOICE'&&<>
      <Ep002EpisodeBatchPlanPanel/>
      <Ep002FactoryReadinessBridgePanel/>
      <Ep002DirectorVoiceCuePanel/>
    </>}
    {stage==='CODEX'&&<><MediaOsVerificationAutopilotPanel/><MediaOsVerificationPanel/><Ep002CodexAutomationPanel/><Ep002SequentialVisualPreflightPanel/></>}
    {stage==='CORRECTIONS'&&<Ep002VisualDirectorFeedbackPanel/>}
    {stage==='APPROVAL'&&<><Ep002Shot02RenderPanel/><Ep002DirectorVisualAcceptancePanel/></>}
    <p className="library-note">The complete product acceptance contract remains:
      verified voice + cues → one scoped Codex Remotion PR per SHOT →
      SHA-matching compiled Worker and Director-reviewed MP4 → next SHOT →
      Master and three separately reviewed Shorts. Blocked stages are not
      represented as completed work.</p>
  </section>;
}
