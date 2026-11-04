import {useEffect,useRef,useState} from 'react';
import {CircleDollarSign,RefreshCw,ShieldAlert,ShieldCheck,XCircle} from 'lucide-react';

type Authorization={
  authorizationId:string;requestId:string;packageId:string;
  state:string;effectiveStatus:string;sourceSha256:string;
  readinessFingerprint:string;shotKeys:string[];repository:string;
  codePathPrefix:string;purpose:string;maxBudgetUsd:number;
  maxTotalTokens:number;maxAttempts:number;validityMinutes:number;
  createdAt:string;expiresAt:string;matchesCurrentReadiness:boolean;
  canStartAgent:boolean;executorConnected:boolean;
};
type Overview={
  packageId:string;episodeKey:string;voiceReadinessState:string;
  readyShots:number;totalShots:number;currentReadinessFingerprint:string;
  eligibleForBudgetApproval:boolean;executorConnected:boolean;
  canStartAgent:boolean;authorizations:Authorization[];
};

async function checked<T>(response:Response):Promise<T>{
  if(!response.ok)throw Error('MediaOS HTTP '+response.status+': '+
    (await response.text()).slice(0,320));
  return response.json() as Promise<T>;
}

const status=(s:string)=>s.replaceAll('_',' ').toLowerCase();

export function EpisodeAiAuthorizationPanel({packageId,refreshVersion=0}:{
  packageId:string;refreshVersion?:number;
}){
  const url='/api/v1/episode-packages/'+encodeURIComponent(packageId)+'/ai-authorization';
  const [overview,setOverview]=useState<Overview|null>(null);
  const [usd,setUsd]=useState('5.00');
  const [tokens,setTokens]=useState('100000');
  const [attempts,setAttempts]=useState('3');
  const [minutes,setMinutes]=useState('60');
  const [consent,setConsent]=useState(false);
  const [working,setWorking]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const pendingRequest=useRef<string|null>(null);
  const inFlight=useRef(false);

  useEffect(()=>{
    let live=true;setLoading(true);setError('');
    void fetch(url,{cache:'no-store'}).then(checked<Overview>)
      .then(value=>{if(live){setOverview(value);setConsent(false);}})
      .catch(cause=>{if(live){setOverview(null);setError(String(cause));}})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[url,refreshVersion]);

  async function refresh(){
    setLoading(true);setError('');
    try{setOverview(await checked<Overview>(await fetch(url,{cache:'no-store'})));}
    catch(cause){setOverview(null);setError(String(cause));}
    finally{setLoading(false);}
  }

  const maxUsd=Number(usd),maxTokens=Number(tokens),maxAttempts=Number(attempts);
  const duration=Number(minutes);
  const validBudget=Number.isFinite(maxUsd)&&maxUsd>=1&&maxUsd<=50
    &&/^\d+(?:\.\d{1,2})?$/.test(usd)
    &&Number.isInteger(maxTokens)&&maxTokens>=1000&&maxTokens<=1000000
    &&Number.isInteger(maxAttempts)&&maxAttempts>=1&&maxAttempts<=10
    &&Number.isInteger(duration)&&duration>=15&&duration<=240;
  const canAuthorize=!!overview?.eligibleForBudgetApproval&&validBudget&&consent
    &&!working&&!loading;
  const hasPending=!!overview?.authorizations.some(item=>
    item.state==='AUTHORIZED_PENDING_EXECUTOR'&&item.effectiveStatus!=='EXPIRED');

  async function authorize(){
    if(!overview||!canAuthorize||inFlight.current)return;
    const confirm=window.confirm('Record a Director AI production authorization for ALL '+
      overview.totalShots+' SHOTs in '+overview.episodeKey+'? Maximum declared OpenAI API budget $'+
      maxUsd.toFixed(2)+', '+maxTokens.toLocaleString()+' tokens, '+maxAttempts+
      ' attempts, valid '+duration+' minutes. This records a bounded approval, '+
      'but does NOT launch an AI agent, call OpenAI, merge code or render video.');
    if(!confirm)return;
    inFlight.current=true;setWorking(true);setError('');setNotice('');
    const id=pendingRequest.current??window.crypto.randomUUID();
    pendingRequest.current=id;
    try{
      const result=await checked<Authorization>(await fetch(url+'/authorize',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:id,expectedReadinessFingerprint:overview.currentReadinessFingerprint,
          maxBudgetUsd:maxUsd,maxTotalTokens:maxTokens,maxAttempts,
          validityMinutes:duration,confirmDirectorAiBudget:true,
        }),
      }));
      pendingRequest.current=null;setConsent(false);
      setNotice('Director authorization '+result.authorizationId.slice(0,8)+
        '… recorded. Executor remains DISABLED. No provider credits were spent.');
      await refresh();
    }catch(cause){setConsent(false);
      setError(String(cause)+' If network delivery is uncertain, review history before retrying.');}
    finally{setWorking(false);inFlight.current=false;}
  }

  async function revoke(item:Authorization){
    if(working||inFlight.current)return;
    if(!window.confirm('Revoke Director AI authorization '+item.authorizationId.slice(0,8)+
      '… for '+overview?.episodeKey+'? This does not modify past audio or code.'))return;
    inFlight.current=true;setWorking(true);setError('');setNotice('');
    try{
      await checked<Authorization>(await fetch(
        url+'/'+encodeURIComponent(item.authorizationId)+'/revoke',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({confirmRevoke:true}),
      }));
      setNotice('Director authorization revoked. No agents were started.');
      await refresh();
    }catch(cause){setError(String(cause));}
    finally{setWorking(false);inFlight.current=false;}
  }

  return <section className="episode-ai-auth" aria-label="AI Production Authorization">
    <div className="episode-ai-auth-header">
      <div>
        <h3><CircleDollarSign size={20}/> AI Production Authorization</h3>
        <p>Approve a finite OpenAI API budget for a complete episode only after
          every voice has passed the readiness checks. No AI execution is connected yet.</p>
      </div>
      <button type="button" onClick={()=>void refresh()} disabled={working||loading}>
        <RefreshCw size={15}/> Refresh
      </button>
    </div>
    {loading&&<p role="status">Checking voice readiness and Director authorization history…</p>}
    {error&&<p role="alert" className="episode-hub-error">{error}</p>}
    {notice&&<p role="status" className="episode-package-notice">{notice}</p>}
    {overview&&<>
      <div className="episode-ai-auth-readiness">
        {overview.eligibleForBudgetApproval?<ShieldCheck size={21}/>:<ShieldAlert size={21}/>}
        <div>
          <strong>{overview.readyShots}/{overview.totalShots} SHOTs voice-ready</strong>
          <p>{overview.voiceReadinessState.replaceAll('_',' ')}
            {' · '}OpenAI agents: NOT CONNECTED
            {' · '}Scope: ALL SHOTs (not individual Director requests)</p>
        </div>
      </div>
      <div className="episode-ai-auth-values">
        <label>Maximum OpenAI cost (USD)
          <input type="number" min="1" max="50" step="0.01" value={usd}
            disabled={working||hasPending} onChange={e=>{setUsd(e.target.value);pendingRequest.current=null;setConsent(false);}}/>
        </label>
        <label>Maximum total tokens
          <input type="number" min="1000" max="1000000" step="1000" value={tokens}
            disabled={working||hasPending} onChange={e=>{setTokens(e.target.value);pendingRequest.current=null;setConsent(false);}}/>
        </label>
        <label>Maximum agent attempts
          <input type="number" min="1" max="10" step="1" value={attempts}
            disabled={working||hasPending} onChange={e=>{setAttempts(e.target.value);pendingRequest.current=null;setConsent(false);}}/>
        </label>
        <label>Expiry (minutes)
          <input type="number" min="15" max="240" step="15" value={minutes}
            disabled={working||hasPending} onChange={e=>{setMinutes(e.target.value);pendingRequest.current=null;setConsent(false);}}/>
        </label>
      </div>
      <p className="episode-ai-auth-note">Budget and token values are Director-set
        ceilings, not a provider price estimate or a guarantee of future billing.
        The upcoming executor must enforce both limits against measured API usage
        before it is allowed to spend tokens.</p>
      {hasPending&&<p className="episode-ai-auth-note">An authorization already exists
        for this package. Revoke it to create a new one with different inputs or limits.</p>}
      <label className="episode-ai-auth-consent">
        <input type="checkbox" checked={consent}
          onChange={e=>setConsent(e.target.checked)}
          disabled={!overview.eligibleForBudgetApproval||working||loading}/>
        <span>I approve recording this exact episode-wide OpenAI API budget and
          source/voice snapshot. I understand this does not yet run the agent,
          authorize ElevenLabs, start Remotion rendering, or promote a GitHub PR.</span>
      </label>
      <button type="button" className="episode-ai-auth-primary"
        disabled={!canAuthorize} onClick={()=>void authorize()}>
        <ShieldCheck size={17}/> {working?'Recording…':'Authorize AI Visual Production (record only)'}
      </button>
      <div className="episode-ai-auth-history">
        <h4>Director authorization history</h4>
        {overview.authorizations.length===0?<p>No AI production authorizations recorded.</p>:
          overview.authorizations.map(item=><div className="episode-ai-auth-entry"
            key={item.authorizationId}>
            <div><strong>{status(item.effectiveStatus)}</strong>
              <p>Budget: ${Number(item.maxBudgetUsd).toFixed(2)}
                {' · '}{item.maxTotalTokens.toLocaleString()} tokens
                {' · '}{item.maxAttempts} attempts
                {' · '}{item.shotKeys.length} SHOTs</p>
              <small>Expires: {new Date(item.expiresAt).toLocaleString()}
                {' · '}Scope: {item.codePathPrefix}</small>
              <p><strong>Executor: DISABLED · No OpenAI request dispatched here</strong></p>
            </div>
            {item.state==='AUTHORIZED_PENDING_EXECUTOR' &&
              item.effectiveStatus!=='EXPIRED'&&
              <button type="button" disabled={working}
                onClick={()=>void revoke(item)}><XCircle size={15}/> Revoke</button>}
          </div>)}
      </div>
    </>}
  </section>;
}
