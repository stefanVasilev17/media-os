import {useEffect,useState} from 'react';
import {AlertCircle,CheckCircle2,GitBranch,RotateCcw,ShieldCheck} from 'lucide-react';

type SourceBeat={number:number;direction:string};
type SourceVisual={
  visualGoal:string;cameraDirection:string;assetDirection:string;
  truthContinuity:string;transition:string;beats:SourceBeat[];
};
type ShotReadiness={
  shotKey:string;title:string;shotIndex:number;beatCount:number;
  directorVisualLocked:boolean;action:string;existingScenePath:string|null;
  proposedScenePath:string|null;scriptRevision:number;
  preferredTakeId:string|null;measuredVoiceSeconds:number|null;
  durationFrames:number|null;currentVoiceApproved:boolean;
  hearSeeTimingVerified:boolean;timingAuthority:string;renderStatus:string;
  approvedVisualStory:SourceVisual;blockers:string[];
};
type FactoryBridge={
  schemaVersion:string;episodeKey:string;scriptVersion:string;
  visualPassVersion:string;inputFingerprint:string;
  shotCount:number;approvedBeatCount:number;editorialSeconds:number;
  protectedScenes:number;sceneCandidates:number;selectedVoiceTakes:number;
  measuredVoiceTakes:number;verifiedTimedShots:number;
  sourceVerified:boolean;eligibleForCodexCloud:boolean;canRender:boolean;
  startsPaidOperation:boolean;blockers:string[];shots:ShotReadiness[];
};

const ENDPOINT='/api/v1/creative/episodes/EP002/factory-bridge';

const blockerLabels:Record<string,string>={
  CURRENT_NARRATION_REVISION_NOT_SAVED_FOR_VOICE:'Save the current working narration',
  DIRECTOR_SELECTED_TAKE_REQUIRED:'Select and approve a current voice Take',
  MEASURED_AUDIO_DURATION_REQUIRED:'Measured audio duration is missing',
  ELEVENLABS_IN_FLIGHT_OR_UNCERTAIN_MUST_BE_RECONCILED:'Resolve an uncertain earlier paid voice attempt',
  SHOT01_CUE_AND_EXISTING_RENDER_REVIEW_REQUIRED:'Verify the existing SHOT01 timing and reusable preview',
  APPROVED_HEAR_SEE_BEATS_NEED_VERIFIED_AUDIO_CUE_MAPPING:'Map the approved HEAR → SEE beats to real spoken timestamps',
};

export function Ep002FactoryReadinessBridgePanel(){
  const [snapshot,setSnapshot]=useState<FactoryBridge|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [refreshKey,setRefreshKey]=useState(0);

  useEffect(()=>{
    let active=true;
    void fetch(ENDPOINT,{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error('EP002 factory bridge unavailable (HTTP '+response.status+').');
      return await response.json() as FactoryBridge;
    }).then(result=>{
      if(active){setSnapshot(result);setError('');}
    }).catch(reason=>{
      if(active){setError(String(reason));setSnapshot(null);}
    }).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[refreshKey]);

  return <section className="library-episode-batch" aria-label="EP002 unified factory readiness">
    <div className="library-episode-batch-heading">
      <div>
        <h2><GitBranch size={21}/> EP002 → Unified Factory: Readiness</h2>
        <p>One protected SHOT01 + ten proposed Remotion scenes, grounded in the existing
          Director-locked script, approved visual choreography and current saved voice choices.
          This bridge reads existing production records; it does not copy EP002 into EP003.</p>
      </div>
      <span className="library-episode-batch-state">{loading?'CHECKING'
        :snapshot?.eligibleForCodexCloud?'VOICE READY':'NOT READY TO EXECUTE'}</span>
    </div>
    {error&&<p role="alert" className="library-voice-error">{error}</p>}
    {snapshot&&<>
      <div className="library-episode-batch-metrics">
        <div><strong>{snapshot.protectedScenes}</strong><span>Locked scene preserved</span></div>
        <div><strong>{snapshot.sceneCandidates}</strong><span>Scenes to build later</span></div>
        <div><strong>{snapshot.measuredVoiceTakes}/{snapshot.shotCount}</strong><span>Approved measured voices</span></div>
        <div><strong>{snapshot.verifiedTimedShots}/{snapshot.shotCount}</strong><span>Verified timed SHOTs</span></div>
      </div>
      <p className="library-note"><ShieldCheck size={15} aria-hidden="true"/>
        {' '}Script {snapshot.scriptVersion} and Visual Pass {snapshot.visualPassVersion} are
        verified from protected EP002 sources. SHOT01 stays read-only.
        {' '}Editorial duration is not measured audio duration.</p>
      <p className="library-note"><AlertCircle size={15} aria-hidden="true"/>
        {' '}Codex Cloud and CPU rendering remain blocked until real voice/cue verification,
        the EP002-specific factory code route, independent build checks and separate
        Director approvals. This page performs no paid action.</p>
      <details className="library-episode-batch-breakdown">
        <summary>Readiness by SHOT — all {snapshot.shotCount} scenes</summary>
        <div className="library-episode-batch-shots">
          {snapshot.shots.map(shot=><div key={shot.shotKey} className="library-episode-batch-shot">
            <strong>{shot.shotKey} · {shot.title}</strong>
            <span>{shot.directorVisualLocked?'PRESERVED — NO CODE REGENERATION'
              :'PROPOSED — NO CODE EXECUTION'}</span>
            <small>{shot.beatCount} approved visual beats ·
              {' '}Voice: {shot.currentVoiceApproved?'selected':'not selected'} ·
              {' '}Duration: {shot.measuredVoiceSeconds===null?'not measured':shot.measuredVoiceSeconds+'s'} ·
              {' '}HEAR → SEE: {shot.hearSeeTimingVerified?'verified':'not verified'}</small>
            <small>Source: {shot.existingScenePath??shot.proposedScenePath}</small>
            <ul>{shot.blockers.map(code=><li key={code}>{blockerLabels[code]??code}</li>)}</ul>
            <details>
              <summary>Approved visual instructions</summary>
              <p>{shot.approvedVisualStory.visualGoal}</p>
              <p><strong>Camera:</strong> {shot.approvedVisualStory.cameraDirection}</p>
              <p><strong>Continuity:</strong> {shot.approvedVisualStory.truthContinuity}</p>
              <ol>{shot.approvedVisualStory.beats.map(beat=>
                <li key={beat.number}>{beat.direction}</li>)}</ol>
            </details>
          </div>)}
        </div>
      </details>
      <p className="library-note"><CheckCircle2 size={15} aria-hidden="true"/>
        {' '}Source integrity is checked, but this is a read-only engineering milestone,
        not a generated Codex task, render authorization or finished film.</p>
    </>}
    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh" disabled={loading}
        onClick={()=>{setLoading(true);setRefreshKey(key=>key+1);}}>
        <RotateCcw size={14}/> Refresh current voice and scene readiness
      </button>
    </div>
  </section>;
}
