import {useEffect,useRef,useState} from 'react';
import {Layers3,RotateCcw} from 'lucide-react';

type BatchShot={
  shotKey:string;title:string;beatCount:number;editorialSeconds:number;
  scriptRevision:number;narrationSha256:string;visualSourceSha:string;
  preferredTakeId:string|null;measuredVoiceSeconds:number|null;voiceStatus:string;
  action:string;renderStatus:string;directorVisualLocked:boolean;visualGoal:string;
};
type BatchWave={
  phase:string;operation:string;executionAvailable:boolean;paidOperation:boolean;gate:string;
};
type BatchPlan={
  schemaVersion:string;episodeKey:string;title:string;inputFingerprint:string;
  shotCount:number;visualBeatCount:number;editorialSeconds:number;
  scenesToPrepare:number;protectedScenes:number;preferredVoiceCount:number;
  missingPreferredVoiceCount:number;reusableRenders:number;
  state:string;shots:BatchShot[];waves:BatchWave[];
};
type StoredPlan={
  planId:string;requestId:string;status:string;inputFingerprint:string;
  manifest:BatchPlan;createdAt:string;
};

const ENDPOINT='/api/v1/creative/episodes/EP002/batch-plan';

function asText(raw:string){return raw.replaceAll('_',' ').toLowerCase();}

export function Ep002EpisodeBatchPlanPanel(){
  const [plan,setPlan]=useState<BatchPlan|null>(null);
  const [saved,setSaved]=useState<StoredPlan|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [info,setInfo]=useState('');
  const pendingRequestId=useRef<string|null>(null);
  const requestInFlight=useRef(false);

  async function refresh(){
    const [planResponse,savedResponse]=await Promise.all([
      fetch(ENDPOINT,{cache:'no-store'}),
      fetch(ENDPOINT+'/latest',{cache:'no-store'}),
    ]);
    if(!planResponse.ok)throw new Error('Batch plan unavailable (HTTP '+planResponse.status+').');
    if(!savedResponse.ok)throw new Error('Saved batch plan unavailable (HTTP '+savedResponse.status+').');
    const nextPlan=await planResponse.json() as BatchPlan;
    const nextSaved=await savedResponse.json() as {status:string;plan?:StoredPlan};
    setPlan(nextPlan);
    setSaved(nextSaved.plan??null);
  }

  useEffect(()=>{
    let active=true;
    Promise.all([
      fetch(ENDPOINT,{cache:'no-store'}).then(async response=>{
        if(!response.ok)throw new Error('Batch plan unavailable (HTTP '+response.status+').');
        return await response.json() as BatchPlan;
      }),
      fetch(ENDPOINT+'/latest',{cache:'no-store'}).then(async response=>{
        if(!response.ok)throw new Error('Batch plan history unavailable (HTTP '+response.status+').');
        return await response.json() as {status:string;plan?:StoredPlan};
      }),
    ]).then(([data,prior])=>{
      if(active){setPlan(data);setSaved(prior.plan??null);}
    }).catch(reason=>{if(active)setError(String(reason));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  async function prepare(){
    if(!plan||saving||requestInFlight.current)return;
    const confirmed=window.confirm(
      'Prepare ONE versioned EP002 production plan for ALL 11 SHOTs? '+
      'This will preserve Director-LOCKED SHOT01 and store a non-executing task manifest. '+
      'No AI coding, voice purchase, render or deployment will start.');
    if(!confirmed)return;
    const requestId=pendingRequestId.current??window.crypto.randomUUID();
    pendingRequestId.current=requestId;
    requestInFlight.current=true;
    setSaving(true);setError('');setInfo('');
    try{
      const response=await fetch(ENDPOINT+'/prepare',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId,expectedFingerprint:plan.inputFingerprint,confirmNoExecution:true,
        }),
      });
      if(!response.ok)throw new Error(
        'Could not prepare episode batch (HTTP '+response.status+'): '+(await response.text()).slice(0,240));
      const result=await response.json() as StoredPlan;
      setSaved(result);
      pendingRequestId.current=null;
      setInfo('All 11 SHOTs captured in one immutable production plan. '+
        'No agent execution, voice purchase or video render was started.');
    }catch(reason){setError(String(reason));}
    finally{requestInFlight.current=false;setSaving(false);}
  }

  const current=saved?.inputFingerprint===plan?.inputFingerprint;

  return <section className="library-episode-batch" aria-label="Episode batch planning">
    <div className="library-episode-batch-heading">
      <div>
        <h2><Layers3 size={21}/> Episode Batch Planner</h2>
        <p>Plan all eleven scenes in one operation. SHOT01 is protected; the other
          ten are candidates for future batch-agent code generation.</p>
      </div>
      <span className="library-episode-batch-state">{loading?'Loading…':current
        ?'PLAN PREPARED':'PLANNING ONLY'}</span>
    </div>

    {error&&<p role="alert" className="library-voice-error">{error}</p>}
    {info&&<p role="status" className="library-voice-ok">{info}</p>}

    {plan&&<>
      <div className="library-episode-batch-metrics">
        <div><strong>{plan.shotCount}</strong><span>SHOTs in one plan</span></div>
        <div><strong>{plan.visualBeatCount}</strong><span>Approved visual beats</span></div>
        <div><strong>{plan.scenesToPrepare}</strong><span>New scene candidates</span></div>
        <div><strong>{plan.protectedScenes}</strong><span>Protected SHOT</span></div>
      </div>
      <p className="library-note">Editorial target: {Math.round(plan.editorialSeconds/60)} min
        {' · '}Preferred voice recordings: {plan.preferredVoiceCount}/{plan.shotCount}
        {' · '}Verified reusable previews: {plan.reusableRenders}.
        Missing selected audio never triggers automatic ElevenLabs spending.</p>

      <details className="library-episode-batch-breakdown">
        <summary>View the entire {plan.shotCount}-SHOT production plan</summary>
        <div className="library-episode-batch-shots">
          {plan.shots.map(shot=><div key={shot.shotKey} className="library-episode-batch-shot">
            <strong>{shot.shotKey} · {shot.title}</strong>
            <span>{shot.directorVisualLocked?'VISUAL LOCKED — REUSE':'BATCH SCENE CANDIDATE'}</span>
            <small>{shot.beatCount} beats · {shot.editorialSeconds}s editorial
              {' · '}{asText(shot.voiceStatus)}</small>
            <small>{asText(shot.renderStatus)}</small>
          </div>)}
        </div>
      </details>
      <details className="library-episode-batch-breakdown">
        <summary>View planned execution waves and safety gates</summary>
        <ol>{plan.waves.map(wave=><li key={wave.phase}>
          <strong>{asText(wave.operation)}</strong> · <span>Not enabled yet</span>
          <p>{wave.gate}</p>
        </li>)}</ol>
      </details>
      <div className="library-episode-batch-actions">
        <button type="button" className="library-voice-button"
          onClick={()=>void prepare()} disabled={saving||loading||!!current}>
          {saving?'Preparing…':current?'Plan already prepared':'Prepare all 11 SHOTs (no AI cost)'}
        </button>
        <button type="button" className="library-voice-refresh" disabled={saving||loading}
          onClick={()=>{
            setLoading(true);setError('');setInfo('');
            void refresh().catch(reason=>setError(String(reason)))
              .finally(()=>setLoading(false));
          }}>
          <RotateCcw size={14}/> Refresh full episode
        </button>
      </div>
      <p className="library-note">This action saves a complete, versioned, read-only execution plan.
        It does not generate TSX files, start agents, deploy code or render the episode.
        A protected multi-SHOT executor and explicit Director cost gates are the next implementation.</p>
      {saved&&<p className="library-note">Latest saved batch: {saved.planId} ·
        {' '}{asText(saved.status)} · {saved.createdAt}
        {!current?' · source changed since preparation; refresh and prepare a new snapshot.':''}</p>}
    </>}
  </section>;
}
