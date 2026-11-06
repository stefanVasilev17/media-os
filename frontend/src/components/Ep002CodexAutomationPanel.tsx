import {useEffect,useRef,useState} from 'react';
import {CloudCog,PauseCircle,PlayCircle,RotateCcw,ShieldCheck} from 'lucide-react';

type Task={shotKey:string;state:string;remoteTaskId:string|null;
  remoteTaskStatus:string|null;remoteTaskUrl:string|null;
  taskInputSha256:string;createdAt:string};
type Automation={
  mode:string;episodeFingerprint:string;nextShotKey:string|null;
  readyForCodex:boolean;cloudWorkerEnabled:boolean;
  maximumTaskSubmissions:number;taskCount:number;
  blockers:string[];tasks:Task[];
};
type Connector={supported:boolean;reason:string;driver:string};

const URL='/api/v1/creative/episodes/EP002/codex-automation';

export function Ep002CodexAutomationPanel(){
  const [state,setState]=useState<Automation|null>(null);
  const [connector,setConnector]=useState<Connector|null>(null);
  const [maxTasks,setMaxTasks]=useState(10);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [revision,setRevision]=useState(0);
  const requestId=useRef<string|null>(null);

  useEffect(()=>{
    let live=true;
    setLoading(true);
    void fetch(URL,{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw Error('Automated Codex state unavailable (HTTP '+response.status+').');
      return await response.json() as Automation;
    }).then(data=>{if(live){setState(data);setError('');}})
      .catch(e=>{if(live)setError(String(e));})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[revision]);

  async function probe(){
    setBusy(true);setError('');setConnector(null);
    try{
      const r=await fetch(URL+'/connector-preflight',{cache:'no-store'});
      if(!r.ok)throw Error('Codex connector check unavailable (HTTP '+r.status+').');
      setConnector(await r.json() as Connector);
    }catch(e){setError(String(e));}
    finally{setBusy(false);}
  }

  async function arm(){
    if(!state||busy||state.mode!=='NOT_ARMED')return;
    if(!window.confirm('Allow MediaOS to start up to '+maxTasks+
      ' sequential Remotion-only Codex Cloud tasks automatically, after all voice, '+
      'source and visual gates pass? This saves consent, but does not launch any task now. '+
      'Plan usage will count only if the subscription-backed connector is later enabled.'))return;
    const id=requestId.current??window.crypto.randomUUID();
    requestId.current=id;setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(URL+'/arm',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({
          requestId:id,expectedEpisodeFingerprint:state.episodeFingerprint,
          maximumTaskSubmissions:maxTasks,confirmAutoCodexRemotionOnly:true,
        })});
      if(!r.ok)throw Error('Automation authorization blocked (HTTP '+r.status+'): '+
        (await r.text()).slice(0,300));
      requestId.current=null;setState(await r.json() as Automation);
      setMessage('Autopilot consent recorded. No Codex task or paid render was started.');
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }

  async function pause(){
    if(!state||busy)return;
    if(!window.confirm('Pause future EP002 Codex tasks? An already-running '+
      'Cloud task cannot be cancelled by this local pause.'))return;
    setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(URL+'/pause',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({
          expectedEpisodeFingerprint:state.episodeFingerprint,confirmPause:true,
        })});
      if(!r.ok)throw Error('Pause blocked (HTTP '+r.status+'): '+
        (await r.text()).slice(0,300));
      setState(await r.json() as Automation);
      setMessage('No new Codex tasks will be started under this authorization.');
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }

  async function resume(){
    if(!state||busy||state.mode!=='PAUSED')return;
    if(!window.confirm('Resume future sequential Codex Remotion tasks for the same approved EP002 source?'))return;
    setBusy(true);setError('');setMessage('');
    try{
      const response=await fetch(URL+'/resume',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({
          expectedEpisodeFingerprint:state.episodeFingerprint,confirmResume:true,
        })});
      if(!response.ok)throw Error('Resume blocked ('+response.status+'): '+
        (await response.text()).slice(0,250));
      setState(await response.json() as Automation);
      setMessage('Existing source-bound Codex automation authorization resumed.');
    }catch(problem){setError(String(problem));}finally{setBusy(false);}
  }

  const armed=state?.mode==='ARMED_WAITING_FOR_GATES';
  const ready=state?.readyForCodex===true;
  return <section className="library-episode-batch" aria-label="EP002 zero-manual Codex automation">
    <div className="library-episode-batch-heading">
      <div>
        <h2><CloudCog size={21}/> Automatic Codex Remotion Dispatcher</h2>
        <p>MediaOS manages one SHOT task at a time. You never need to open Codex
          to paste a task, move code or manage task IDs. Only verified
          voice, visual rules and earlier accepted scenes may unlock dispatch.</p>
      </div>
      <span className="library-episode-batch-state">
        {loading?'CHECKING':state?.mode??'UNAVAILABLE'}</span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    {message&&<p className="library-voice-ok" role="status">{message}</p>}
    {state&&<>
      <div className="library-episode-batch-metrics">
        <div><strong>{state.nextShotKey??'—'}</strong><span>Next allowed SHOT</span></div>
        <div><strong>{state.taskCount} / {state.maximumTaskSubmissions||'—'}</strong>
          <span>Recorded tasks / authorization cap</span></div>
        <div><strong>{ready?'YES':'NO'}</strong><span>Visual preflight passed</span></div>
        <div><strong>{state.cloudWorkerEnabled?'ENABLED':'OFF'}</strong>
          <span>Remote dispatch process</span></div>
      </div>
      <p className="library-note"><ShieldCheck size={15} aria-hidden="true"/>
        {' '}Arm once; MediaOS handles later SHOT submissions automatically
        as the required gates are satisfied. This does not override separate voice
        or Render CPU consent. The worker is disabled by default until an official
        subscription-backed connector works in the selected Codex environment.</p>

      {state.mode==='NOT_ARMED'&&<div className="library-episode-batch-actions">
        <label>Maximum Codex task submissions for this EP002 source
          <select value={maxTasks} disabled={busy||loading} onChange={e=>{
            setMaxTasks(Number(e.target.value));requestId.current=null;
          }}>
            {[10,12,15,20].map(x=><option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <button type="button" className="library-voice-button"
          disabled={busy||loading||!state.nextShotKey} onClick={()=>void arm()}>
          <PlayCircle size={15}/> Arm automatic Remotion production
        </button>
      </div>}
      {armed&&<div className="library-episode-batch-actions">
        <button type="button" className="library-voice-refresh"
          disabled={busy} onClick={()=>void pause()}>
          <PauseCircle size={15}/> Pause future SHOT launches
        </button>
      </div>}
      {state.mode==='PAUSED'&&<div className="library-episode-batch-actions">
        <button type="button" className="library-voice-button"
          disabled={busy} onClick={()=>void resume()}>
          <PlayCircle size={15}/> Resume automatic Remotion SHOTs
        </button>
      </div>}
      <div className="library-episode-batch-actions">
        <button type="button" className="library-voice-refresh"
          disabled={busy} onClick={()=>void probe()}>
          <CloudCog size={15}/> Check official Codex Cloud CLI connection
        </button>
        <button type="button" className="library-voice-refresh"
          disabled={busy||loading} onClick={()=>setRevision(n=>n+1)}>
          <RotateCcw size={15}/> Refresh
        </button>
      </div>
      {connector&&<p className={connector.supported?'library-note':'library-voice-error'}>
        Connector ({connector.driver==='CODEX_LOCAL_EXEC'?'isolated ChatGPT Codex worker':'Codex Cloud CLI'}):
        {' '}{connector.supported?'CONNECTED — inference unverified':'BLOCKED'} —
        {' '}{connector.reason}. No Codex task was started by this read-only check.
      </p>}
      <details className="library-episode-batch-breakdown">
        <summary>Why the next SHOT cannot start ({state.blockers.length})</summary>
        {state.blockers.length===0?<p>No source blockers reported.</p>:
          <ul>{state.blockers.map(x=><li key={x}>{x}</li>)}</ul>}
      </details>
      <details className="library-episode-batch-breakdown">
        <summary>Persisted Codex task history ({state.tasks.length})</summary>
        {state.tasks.length===0?<p>No Remotion tasks have been dispatched.</p>:
          <div className="library-episode-batch-shots">
            {state.tasks.map(t=><div key={t.taskInputSha256} className="library-episode-batch-shot">
              <strong>{t.shotKey} · {t.state}</strong>
              <small>{t.createdAt}</small>
              <p>Remote Codex task: {t.remoteTaskId??'not confirmed'}</p>
              {t.remoteTaskStatus&&<p>Cloud status: {t.remoteTaskStatus}</p>}
              {t.state==='REMOTE_UNKNOWN'&&<p>
                Remote result is uncertain. Automatic retry is blocked until reconciled.
              </p>}
            </div>)}
          </div>}
      </details>
    </>}
    <p className="library-note">If the official CLI cannot discover your published
      Codex Cloud environment, the queue stops without switching to paid OpenAI
      API usage or requiring you to paste prompts manually. A different supported
      integration must be validated before the final product can be accepted.</p>
  </section>;
}
