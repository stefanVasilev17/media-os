import {useEffect,useRef,useState} from 'react';
import {PlayCircle,PauseCircle,RotateCcw,ShieldCheck} from 'lucide-react';

type AutoState={
  policyId:string|null;state:string;maximumCommits:number;
  submittedCount:number;lastQueuedCommit:string|null;
  currentVerifiedCommit:string|null;sourceVerified:boolean;sourceReason:string;
};
const URL='/api/v1/verification/automation';

export function MediaOsVerificationAutopilotPanel(){
  const [state,setState]=useState<AutoState|null>(null);
  const [limit,setLimit]=useState(5);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [refresh,setRefresh]=useState(0);
  const requestId=useRef<string|null>(null);

  useEffect(()=>{
    let active=true;
    void fetch(URL,{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw Error('Verification automation unavailable (HTTP '+response.status+').');
      return await response.json() as AutoState;
    }).then(value=>{
      if(active){setState(value);setError('');}
    }).catch(reason=>{if(active){setError(String(reason));setState(null);}});
    return()=>{active=false;};
  },[refresh]);

  async function arm(){
    if(!state||busy||state.state==='ARMED')return;
    if(!window.confirm('Authorize MediaOS to automatically run up to '+limit+
      ' isolated Docker verification jobs as new commits reach the pinned EP002 '+
      'GitHub PR? Runs use the separately authorized verification worker. '+
      'There is no GitHub Actions execution, deployment, paid provider call or video render. '+
      'This can use the worker host’s CPU, bandwidth and disk.'))return;
    setBusy(true);setError('');setMessage('');
    const id=requestId.current??window.crypto.randomUUID();
    requestId.current=id;
    try{
      const response=await fetch(URL+'/arm',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({requestId:id,maximumCommits:limit,
          confirmAutomaticIsolatedDockerTests:true})});
      if(!response.ok)throw Error('Authorization refused (HTTP '+response.status+
        '): '+(await response.text()).slice(0,260));
      requestId.current=null;
      setState(await response.json() as AutoState);
      setMessage('Bounded automatic source verification is armed; no task was launched by this request.');
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }

  async function pause(){
    if(!state?.policyId||state.state!=='ARMED'||busy)return;
    if(!window.confirm('Pause new automatic Docker tests? Pending unclaimed '+
      'tests will be cancelled; a running test is not stopped.'))return;
    setBusy(true);setError('');setMessage('');
    try{
      const response=await fetch(URL+'/pause',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({policyId:state.policyId,confirmPause:true})});
      if(!response.ok)throw Error('Pause refused (HTTP '+response.status+'): '+
        (await response.text()).slice(0,260));
      setState(await response.json() as AutoState);
      setMessage('Automatic checks paused. No new Git commits will be queued under this policy.');
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }

  const armed=state?.state==='ARMED';
  return <section className="library-episode-batch" aria-label="Automatic independent verification">
    <div className="library-episode-batch-heading">
      <div>
        <h2><ShieldCheck size={21}/> Automatic Git Commit Verification</h2>
        <p>Approve once, then MediaOS watches the trusted EP002 PR for new commits.
          Every changed SHA is queued for the independent Docker worker
          without GitHub Actions or repeated manual test commands.</p>
      </div>
      <span className="library-episode-batch-state">{state?.state??'UNAVAILABLE'}</span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    {message&&<p className="library-voice-ok" role="status">{message}</p>}
    {state&&<>
      <div className="library-episode-batch-metrics">
        <div><strong>{state.submittedCount} / {state.maximumCommits||'—'}</strong>
          <span>Authorized source revisions queued</span></div>
        <div><strong>{state.sourceVerified?'YES':'NO'}</strong>
          <span>Private GitHub PR verified</span></div>
        <div><strong>{state.lastQueuedCommit?.slice(0,12)??'—'}</strong>
          <span>Last queued commit</span></div>
      </div>
      <p className="library-note">Current source:
        {' '}{state.currentVerifiedCommit?.slice(0,12)??'NOT VERIFIED'}
        {' '}· {state.sourceReason}. The worker cannot execute without a
        separate verification-only credential and Docker host.</p>
      {!armed&&<div className="library-episode-batch-actions">
        <label>Maximum commits to verify automatically
          <select disabled={busy} value={limit} onChange={e=>{
            setLimit(Number(e.target.value));requestId.current=null;
          }}>
            {[1,3,5,10,20].map(value=>
              <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" className="library-voice-button"
          disabled={busy} onClick={()=>void arm()}>
          <PlayCircle size={15}/> Arm automatic Docker verification
        </button>
      </div>}
      {armed&&<div className="library-episode-batch-actions">
        <button type="button" className="library-voice-refresh"
          disabled={busy} onClick={()=>void pause()}>
          <PauseCircle size={15}/> Pause future verification
        </button>
        {state.submittedCount>=state.maximumCommits&&
          <p className="library-note">Authorized commit limit reached.
            Pause and separately approve a new limited policy to continue.</p>}
      </div>}
      <button type="button" className="library-voice-refresh"
        disabled={busy} onClick={()=>setRefresh(n=>n+1)}>
        <RotateCcw size={15}/> Refresh automation status
      </button>
    </>}
    <p className="library-note">Only the private PR #191 feature branch is eligible.
      Every attempt uses the exact verified Git SHA. A failed or uncertain
      check is not automatically repeated. This approval never authorizes
      merging, paid Codex requests, or production deployment.</p>
  </section>;
}
