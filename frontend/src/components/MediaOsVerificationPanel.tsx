import {useEffect,useRef,useState} from 'react';
import {CheckCircle2,PlayCircle,RotateCcw,ShieldCheck} from 'lucide-react';

type Stage={stage:string;exitCode:number;durationMs:number};
type Run={
  id:string;sourceCommit:string;sourceBranch:string;state:string;
  workerId:string|null;stages:Stage[];failureReason:string|null;
  queuedAt:string;finishedAt:string|null;
};
type Summary={
  queueEnabled:boolean;repository:string;branch:string;
  targetCommit:string|null;targetVerified:boolean;
  targetBlocker:string;recent:Run[];
};
const ENDPOINT='/api/v1/verification/runs';

export function MediaOsVerificationPanel(){
  const [status,setStatus]=useState<Summary|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [refresh,setRefresh]=useState(0);
  const requestId=useRef<string|null>(null);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    void fetch(ENDPOINT,{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw Error('Verification state unavailable (HTTP '+response.status+').');
      return await response.json() as Summary;
    }).then(data=>{
      if(active){setStatus(data);setError('');}
    }).catch(reason=>{
      if(active){setStatus(null);setError(String(reason));}
    }).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[refresh]);

  const active=status?.recent.some(run=>
    ['QUEUED','RUNNING','UNKNOWN'].includes(run.state))??false;
  async function requestVerification(){
    if(!status||!status.queueEnabled||!status.targetVerified
        ||!status.targetCommit||busy||active)return;
    if(!window.confirm('Run isolated Java/PostgreSQL, React and Remotion checks '+
        'for the verified MediaOS Git commit '+status.targetCommit.slice(0,12)+
        '? This uses the separately authorized verification worker, not GitHub Actions. '+
        'It may use your own Docker CPU, disk space and network bandwidth. '+
        'No production deployment, video rendering or paid Codex API will start.'))return;
    const id=requestId.current??window.crypto.randomUUID();
    requestId.current=id;
    setBusy(true);setError('');setMessage('');
    try{
      const response=await fetch(ENDPOINT,{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:id,sourceCommit:status.targetCommit,
          confirmIsolatedVerification:true,
        }),
      });
      if(!response.ok)throw Error('Verification was not queued (HTTP '+response.status+
        '): '+(await response.text()).slice(0,300));
      requestId.current=null;
      const run=await response.json() as Run;
      setMessage('Verification '+run.state+' for commit '+
        run.sourceCommit.slice(0,12)+'. A worker must claim it before any tests run.');
      setRefresh(n=>n+1);
    }catch(reason){setError(String(reason));}
    finally{setBusy(false);}
  }

  return <section className="library-episode-batch" aria-label="MediaOS independent build verification">
    <div className="library-episode-batch-heading">
      <div>
        <h2><ShieldCheck size={21}/> Independent MediaOS Verification</h2>
        <p>Directly tests a pinned private GitHub commit with temporary Docker,
          Java 21/PostgreSQL 18, TypeScript and Remotion. GitHub Actions are not used.
          Only real worker exit codes are accepted as passing evidence.</p>
      </div>
      <span className="library-episode-batch-state">
        {loading?'CHECKING':!status?'UNAVAILABLE':
          status.queueEnabled?'WORKER QUEUE ENABLED':'NOT CONFIGURED'}
      </span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    {message&&<p className="library-voice-ok" role="status">{message}</p>}
    {status&&<>
      <p className="library-note"><strong>Source:</strong> {status.repository} / {status.branch}.
        {' '}Target: {status.targetVerified&&status.targetCommit?
          status.targetCommit.slice(0,12):'NOT VERIFIED'}.
        {' '}Verification source: {status.targetBlocker}.</p>
      {status.recent.length>0&&<div className="library-episode-batch-shots">
        {status.recent.slice(0,8).map(run=>
          <div key={run.id} className="library-episode-batch-shot">
            <strong>{run.state==='PASSED'?<CheckCircle2 size={15}/>:null}
              {' '}{run.state} · {run.sourceCommit.slice(0,12)}</strong>
            <p>Run: {run.id} · Worker: {run.workerId??'not claimed'}</p>
            {run.failureReason&&<p className="library-voice-error">{run.failureReason}</p>}
            {run.stages.map(stage=><small key={stage.stage}>
              {stage.stage}: exit {stage.exitCode} · {Math.round(stage.durationMs/1000)} s
              {' · '}
            </small>)}
          </div>)}
      </div>}
      <div className="library-episode-batch-actions">
        <button type="button" className="library-voice-button"
          disabled={busy||loading||active||!status.queueEnabled
            ||!status.targetVerified||!status.targetCommit}
          onClick={()=>void requestVerification()}>
          <PlayCircle size={15}/> Queue isolated verification
        </button>
        <button type="button" className="library-voice-refresh"
          disabled={busy||loading} onClick={()=>setRefresh(n=>n+1)}>
          <RotateCcw size={15}/> Refresh worker results
        </button>
      </div>
      {active&&<p className="library-note">Only one verification may be pending or
        in progress. An UNKNOWN worker result is not automatically retried.</p>}
    </>}
    <p className="library-note">This checks source only; it is not permission to
      deploy to Railway, merge a PR, start paid Codex or render an EP002 video.
      The worker is disabled until separately configured and given a dedicated
      verification-only credential. No manual Git SHA entry is required.</p>
  </section>;
}
