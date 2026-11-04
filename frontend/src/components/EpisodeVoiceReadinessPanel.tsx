import {useEffect,useState} from 'react';
import {Activity,RefreshCw,ShieldAlert,ShieldCheck} from 'lucide-react';

type VerifiedCue={beatId:string;cueAnchor:string;startSeconds:number;endSeconds:number};
type ShotReadiness={
  shotKey:string;title:string;revision:number;selectedTakeId:string|null;
  measuredDurationSeconds:number|null;approvedCurrentRevision:boolean;
  unresolvedPaidRequest:boolean;status:string;timingStatus:string;
  blockers:string[];verifiedCues:VerifiedCue[];
};
type EpisodeReadiness={
  packageId:string;episodeKey:string;sourceSha256:string;readinessFingerprint:string;
  state:string;totalShots:number;approvedShots:number;readyShots:number;
  blockedShots:number;unresolvedPaidAttempts:number;
  eligibleForAiBudgetReview:boolean;agentExecutionAuthorized:boolean;
  canStartAgent:boolean;nextAction:string;shots:ShotReadiness[];
};
const reasonLabels:Record<string,string>={
  WORKING_SCRIPT_REVISION_MISSING:'Working narration revision is missing',
  DIRECTOR_APPROVED_CURRENT_REVISION_TAKE_MISSING:'No Director-approved Take for the current narration',
  PAID_VOICE_REQUEST_IN_FLIGHT_OR_UNCERTAIN:'A paid ElevenLabs attempt is unresolved',
  MEASURED_AUDIO_DURATION_MISSING:'Selected audio has no measured duration',
  VISUAL_BEATS_MISSING:'HEAR → SEE beats are missing',
  WORKING_NARRATION_MISSING:'Current narration is missing',
  STORY_OR_PROVIDER_TIMING_MALFORMED:'Storyboard or provider timing is invalid',
  PROVIDER_ALIGNMENT_MISSING_OR_INVALID:'Real provider character timestamps are missing or invalid',
  SPOKEN_AUDIO_DIFFERS_FROM_CURRENT_NARRATION:'Saved audio does not match the current narration',
  VISUAL_CUE_NOT_IN_CURRENT_NARRATION:'A visual cue is missing from current narration',
  VISUAL_CUE_NOT_ALIGNED_IN_AUDIO_ORDER:'Voice cues cannot be matched in the approved story order',
  INVALID_CUE_TIME_BOUNDS:'A cue falls outside valid audio timing bounds',
};
async function requestReport(packageId:string):Promise<EpisodeReadiness>{
  const response=await fetch('/api/v1/episode-packages/'+encodeURIComponent(packageId)+
    '/voice-readiness',{cache:'no-store'});
  if(!response.ok)throw Error('Readiness HTTP '+response.status+': '+
    (await response.text()).slice(0,250));
  return response.json() as Promise<EpisodeReadiness>;
}
function label(code:string){return code.replaceAll('_',' ').toLowerCase();}

export function EpisodeVoiceReadinessPanel({packageId,refreshVersion=0}:{
  packageId:string;refreshVersion?:number;
}){
  const [report,setReport]=useState<EpisodeReadiness|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');
    void requestReport(packageId)
      .then(result=>{if(active)setReport(result);})
      .catch(e=>{if(active){setReport(null);setError(String(e));}})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[packageId,refreshVersion]);

  async function refresh(){
    setLoading(true);setError('');
    try{setReport(await requestReport(packageId));}
    catch(e){setReport(null);setError(String(e));}
    finally{setLoading(false);}
  }
  const isReady=report?.state==='READY_FOR_DIRECTOR_AI_AUTHORIZATION';

  return <section className="episode-voice-readiness" aria-label="Whole-episode voice readiness">
    <div className="episode-voice-readiness-header">
      <div>
        <h3><Activity size={19}/> Episode Voice Readiness</h3>
        <p>One check for every imported SHOT. Only real selected-voice timestamps,
          current narration and Director approvals count.</p>
      </div>
      <button type="button" disabled={loading} onClick={()=>void refresh()}>
        <RefreshCw size={15}/> Refresh readiness
      </button>
    </div>
    {loading&&<p role="status">Checking the current voice and timing evidence…</p>}
    {error&&<p role="alert" className="episode-hub-error">{error}</p>}
    {report&&<>
      <div className="episode-voice-readiness-status" role="status">
        {isReady?<ShieldCheck size={21}/>:<ShieldAlert size={21}/>}
        <div>
          <strong>{isReady?'VOICE READY — AWAITING AI BUDGET APPROVAL':
            report.state==='PARTIALLY_READY'?'PARTIALLY READY':'NOT READY — AI BLOCKED'}</strong>
          <p>{report.nextAction}</p>
        </div>
      </div>
      <div className="episode-voice-readiness-metrics">
        <div><strong>{report.readyShots}/{report.totalShots}</strong><span>Voice-ready SHOTs</span></div>
        <div><strong>{report.approvedShots}/{report.totalShots}</strong><span>Current Take approvals</span></div>
        <div><strong>{report.blockedShots}</strong><span>Blocked SHOTs</span></div>
        <div><strong>{report.unresolvedPaidAttempts}</strong><span>Unresolved paid attempts</span></div>
      </div>
      <div className="episode-voice-readiness-progress"
        role="progressbar" aria-label="Episode voice readiness"
        aria-valuemin={0} aria-valuemax={report.totalShots} aria-valuenow={report.readyShots}>
        <div style={{width:(100*report.readyShots/Math.max(1,report.totalShots))+'%'}}/>
      </div>
      <p className="episode-voice-readiness-note">Source identity: {report.sourceSha256.slice(0,14)}…
        {' · '}Current readiness fingerprint: {report.readinessFingerprint.slice(0,16)}…
        {' · '}Agent execution: <strong>NOT AUTHORIZED</strong></p>
      <p className="episode-voice-readiness-note">This panel only checks evidence.
        Even a 100% ready episode cannot start OpenAI agents until a separate
        Director-controlled finite-budget authorization is implemented and approved.
        No paid requests are made by readiness checks.</p>
      <div className="episode-voice-readiness-shots">
        {report.shots.map(shot=><details key={shot.shotKey}
          className={shot.status==='VOICE_READY'?'episode-voice-shot-ready':'episode-voice-shot-blocked'}>
          <summary><span><strong>{shot.shotKey} · {shot.title}</strong>
            <small>Revision {shot.revision}
              {' · '}{shot.selectedTakeId?'Approved Take selected':'No approved Take'}
              {shot.measuredDurationSeconds!=null?' · '+shot.measuredDurationSeconds+'s':''}</small></span>
            <span>{shot.status==='VOICE_READY'?'READY':'BLOCKED'}</span></summary>
          <div className="episode-voice-readiness-detail">
            {shot.blockers.length>0
              ?<ul>{shot.blockers.map(blocker=><li key={blocker}>
                  {reasonLabels[blocker]??label(blocker)}
                </li>)}</ul>
              :<p>Director Take, measured duration and each HEAR → SEE cue are verified.</p>}
            {shot.verifiedCues.length>0&&<details>
              <summary>Verified narration cue timings ({shot.verifiedCues.length})</summary>
              <div className="episode-voice-readiness-cues">
                {shot.verifiedCues.map(cue=><div key={cue.beatId}>
                  <strong>{cue.beatId}</strong> · {cue.startSeconds.toFixed(3)}s–
                  {cue.endSeconds.toFixed(3)}s · {cue.cueAnchor}
                </div>)}
              </div>
            </details>}
          </div>
        </details>)}
      </div>
    </>}
  </section>;
}
