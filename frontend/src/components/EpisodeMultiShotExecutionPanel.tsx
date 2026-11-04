import {useCallback,useEffect,useRef,useState} from 'react';
import {Layers3,RefreshCw,ShieldAlert,XCircle} from 'lucide-react';

type Authorization={
  authorizationId:string;effectiveStatus:string;state:string;
  matchesCurrentReadiness:boolean;readinessFingerprint:string;
  maxBudgetUsd:number;maxTotalTokens:number;maxAttempts:number;shotKeys:string[];
};
type Overview={
  currentReadinessFingerprint:string;eligibleForBudgetApproval:boolean;
  totalShots:number;readyShots:number;authorizations:Authorization[];
};
type ShotTask={
  shotKey:string;shotIndex:number;narrationRevision:number;approvedTakeId:string;
  measuredAudioSeconds:number;state:string;verifiedCues:number;
};
type Job={
  jobId:string;requestId:string;authorizationId:string;episodeKey:string;
  state:string;effectiveStatus:string;readinessFingerprint:string;sourceSha256:string;
  repository:string;codePathPrefix:string;maxBudgetUsd:number;
  maxTotalTokens:number;maxAttempts:number;totalTasks:number;readyForAgentTasks:number;
  atRiskUsd:number;atRiskTokens:number;attemptedCalls:number;
  providerDispatchEnabled:boolean;canStartAgent:boolean;createdAt:string;tasks:ShotTask[];
};

async function checked<T>(r:Response):Promise<T>{
  if(!r.ok)throw Error('MediaOS HTTP '+r.status+': '+(await r.text()).slice(0,300));
  return r.json() as Promise<T>;
}
const display=(s:string)=>s.replaceAll('_',' ').toLowerCase();

export function EpisodeMultiShotExecutionPanel({packageId,refreshVersion=0,
  onStatusChanged}:{
  packageId:string;refreshVersion?:number;onStatusChanged?:()=>void;
}){
  const prefix='/api/v1/episode-packages/'+encodeURIComponent(packageId);
  const [overview,setOverview]=useState<Overview|null>(null);
  const [jobs,setJobs]=useState<Job[]>([]);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const pendingRequest=useRef<string|null>(null);
  const busy=useRef(false);

  const refresh=useCallback(async()=>{
    const [auth,jobsResponse]=await Promise.all([
      fetch(prefix+'/ai-authorization',{cache:'no-store'}),
      fetch(prefix+'/execution-jobs',{cache:'no-store'}),
    ]);
    const authData=await checked<Overview>(auth);
    const jobData=await checked<Job[]>(jobsResponse);
    setOverview(authData);setJobs(jobData);
  },[prefix]);

  useEffect(()=>{
    let active=true;setLoading(true);setError('');
    void Promise.all([
      fetch(prefix+'/ai-authorization',{cache:'no-store'}).then(checked<Overview>),
      fetch(prefix+'/execution-jobs',{cache:'no-store'}).then(checked<Job[]>),
    ]).then(([a,j])=>{if(active){setOverview(a);setJobs(j);}})
      .catch(e=>{if(active)setError(String(e));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[prefix,refreshVersion]);

  const pending=overview?.authorizations.find(a=>
    a.state==='AUTHORIZED_PENDING_EXECUTOR' &&
    a.effectiveStatus==='AUTHORIZED_PENDING_EXECUTOR' &&
    a.matchesCurrentReadiness &&
    a.readinessFingerprint===overview.currentReadinessFingerprint);
  const alreadyPrepared=jobs.some(j=>j.state==='PREPARED_NO_DISPATCH');
  const allowed=!!pending && overview?.readyShots===overview?.totalShots &&
    !alreadyPrepared && !working && !loading;

  async function prepare(){
    if(!allowed||!pending||busy.current||!overview)return;
    const yes=window.confirm('Prepare one versioned Multi-SHOT execution job for ALL '+
      pending.shotKeys.length+' approved SHOTs? This consumes the selected one-use '+
      'Director authorization and creates a QUEUED/NOT DISPATCHED task snapshot. '+
      'It does NOT call OpenAI, spend tokens, create a GitHub branch or render anything.');
    if(!yes)return;
    busy.current=true;setWorking(true);setError('');setMessage('');
    const id=pendingRequest.current??window.crypto.randomUUID();
    pendingRequest.current=id;
    try{
      const saved=await checked<Job>(await fetch(prefix+'/execution-jobs/prepare',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:id,authorizationId:pending.authorizationId,
          expectedReadinessFingerprint:overview.currentReadinessFingerprint,
          confirmNoProviderExecution:true,
        }),
      }));
      pendingRequest.current=null;
      setMessage('All '+saved.totalTasks+
        ' SHOT tasks are stored. Agent execution remains disabled and OpenAI usage is zero.');
      await refresh();
      onStatusChanged?.();
    }catch(e){
      setError(String(e)+' If the request may have reached the backend, inspect job history before retrying.');
    }finally{busy.current=false;setWorking(false);}
  }

  async function cancel(job:Job){
    if(busy.current||working||!window.confirm(
      'Cancel prepared job '+job.jobId.slice(0,8)+'…? A consumed Director grant cannot be reused. '+
      'You will need a fresh budget authorization for another job.'))return;
    busy.current=true;setWorking(true);setError('');setMessage('');
    try{
      await checked<Job>(await fetch(prefix+'/execution-jobs/'+encodeURIComponent(job.jobId)+
        '/cancel',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({confirmCancel:true})}));
      setMessage('Prepared job cancelled without starting a provider call.');
      await refresh();
      onStatusChanged?.();
    }catch(e){setError(String(e));}
    finally{busy.current=false;setWorking(false);}
  }

  return <section className="episode-execution-foundation" aria-label="Multi-SHOT Execution Foundation">
    <div className="episode-execution-foundation-heading">
      <div>
        <h3><Layers3 size={20}/> Multi-SHOT Execution Foundation</h3>
        <p>Prepare all approved SHOT tasks with one Director action. The actual
          agent worker and paid OpenAI dispatch are not connected in this release.</p>
      </div>
      <button type="button" onClick={()=>void refresh().catch(e=>setError(String(e)))}
        disabled={loading||working}><RefreshCw size={15}/> Refresh</button>
    </div>
    {loading&&<p role="status">Loading protected execution jobs…</p>}
    {error&&<p role="alert" className="episode-hub-error">{error}</p>}
    {message&&<p role="status" className="episode-package-notice">{message}</p>}
    {overview&&<>
      <div className="episode-execution-foundation-note">
        <ShieldAlert size={19}/>
        <span>OpenAI provider dispatch: <strong>DISABLED</strong>. Recording a budget
          or preparing this job never starts code generation or incurs API charges.
          Protected EP001 and EP002 components are excluded from new-episode job scope.</span>
      </div>
      <p className="episode-execution-foundation-desc">
        Current voices: {overview.readyShots}/{overview.totalShots} ready
        {' · '}Active matching approval: {pending?'YES':'NO'}
        {' · '}Already prepared: {alreadyPrepared?'YES':'NO'}.
        Job preparation uses the selected authorization exactly once.
      </p>
      <button type="button" className="episode-ai-auth-primary"
        disabled={!allowed} onClick={()=>void prepare()}>
        <Layers3 size={17}/>{working?'Saving…':'Prepare all SHOT tasks — no provider calls'}
      </button>
      <div className="episode-execution-foundation-jobs">
        <h4>Immutable execution job history</h4>
        {jobs.length===0?<p>No prepared execution jobs yet.</p>:
          jobs.map(job=><details key={job.jobId}
            className="episode-execution-foundation-job">
            <summary>
              <span><strong>{job.episodeKey} · {display(job.state)}</strong>
                <small>{job.totalTasks} SHOTs · Reserved API at-risk: ${Number(job.atRiskUsd).toFixed(4)}
                  {' · '}{job.atRiskTokens} tokens · {job.attemptedCalls} attempts</small></span>
              <span>View plan</span>
            </summary>
            <div className="episode-execution-foundation-job-detail">
              <p>Budget ceiling: ${Number(job.maxBudgetUsd).toFixed(2)}
                {' · '}{job.maxTotalTokens.toLocaleString()} tokens
                {' · '}{job.maxAttempts} attempts</p>
              <p>Source snapshot: {job.readinessFingerprint.slice(0,18)}…
                {' · '}Scoped path: {job.codePathPrefix}</p>
              <p><strong>Provider dispatch: disabled. Agent and GitHub PR creation not implemented.</strong></p>
              {job.tasks.map(shot=><div key={shot.shotKey}>
                <strong>{shot.shotKey}</strong> · revision {shot.narrationRevision}
                {' · '}{shot.verifiedCues} verified cues
                {' · '}{display(shot.state)}
              </div>)}
              {job.state==='PREPARED_NO_DISPATCH'&&
                <button type="button" disabled={working}
                  onClick={()=>void cancel(job)}>
                  <XCircle size={15}/> Cancel prepared job
                </button>}
            </div>
          </details>)}
      </div>
    </>}
  </section>;
}
