import {useEffect,useRef,useState} from 'react';
import {CheckCircle2,GitMerge,LockKeyhole,RotateCcw} from 'lucide-react';

type Candidate={shotKey:string;title:string};
type Preflight={
  nextShotKey:string|null;inputFingerprint:string;
  realCueFramesVerified:boolean;candidate:Candidate|null;
};
type GitEvidence={
  verified:boolean;prNumber:number;shotKey:string;
  currentMainCommit:string|null;sourceBlobSha:string|null;
  policyDigest:string|null;blockers:string[];
};
type Receipt={
  requestId:string;shotKey:string;sourceSha:string;
  sourceBlob:string;policyDigest:string;renderId:string;
};
const BASE='/api/v1/creative/episodes/EP002/visual-approvals';
const PREFLIGHT='/api/v1/creative/episodes/EP002/visual-codex-preflight';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function Ep002DirectorVisualAcceptancePanel(){
  const [preflight,setPreflight]=useState<Preflight|null>(null);
  const [history,setHistory]=useState<Receipt[]>([]);
  const [proof,setProof]=useState<GitEvidence|null>(null);
  const [pr,setPr]=useState('');
  const [renderId,setRenderId]=useState('');
  const [watched,setWatched]=useState(false);
  const [corrections,setCorrections]=useState(false);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [revision,setRevision]=useState(0);
  const pending=useRef<string|null>(null);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    void Promise.all([
      fetch(PREFLIGHT,{cache:'no-store'}).then(async r=>{
        if(!r.ok)throw Error('Visual preflight unavailable (HTTP '+r.status+').');
        return await r.json() as Preflight;
      }),
      fetch(BASE,{cache:'no-store'}).then(async r=>{
        if(!r.ok)throw Error('Acceptance history unavailable (HTTP '+r.status+').');
        return await r.json() as Receipt[];
      }),
    ]).then(([next,receipts])=>{
      if(active){setPreflight(next);setHistory(receipts);setError('');}
    }).catch(e=>{if(active)setError(String(e));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[revision]);

  async function verifyPr(){
    if(busy||!preflight?.candidate)return;
    const number=Number(pr);
    if(!Number.isInteger(number)||number<1){setError('Enter the merged GitHub PR number.');return;}
    setBusy(true);setError('');setProof(null);pending.current=null;
    try{
      const r=await fetch(BASE+'/source-evidence?prNumber='+number,{cache:'no-store'});
      if(!r.ok)throw Error('Source verification unavailable (HTTP '+r.status+').');
      setProof(await r.json() as GitEvidence);
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }

  async function approve(){
    if(!proof?.verified||!preflight?.candidate||!uuid.test(renderId)
        ||!watched||!corrections||busy)return;
    if(!window.confirm('Approve '+preflight.candidate.shotKey+
        ' only if you watched the real completed MP4 and all corrections are resolved? '+
        'A matching Git source, voice, policy and worker build will be verified again.'))return;
    const requestId=pending.current??window.crypto.randomUUID();
    pending.current=requestId;setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(BASE,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId,expectedFingerprint:preflight.inputFingerprint,
          shotKey:preflight.candidate.shotKey,renderId,pullRequestNumber:proof.prNumber,
          expectedMainSha:proof.currentMainCommit,
          expectedBlobSha:proof.sourceBlobSha,
          expectedPolicyDigest:proof.policyDigest,
          confirmWatchedAndApproved:true,confirmCorrectionsResolved:true,
        }),
      });
      if(!r.ok)throw Error('Visual acceptance blocked (HTTP '+r.status+'): '+
        (await r.text()).slice(0,250));
      pending.current=null;setProof(null);setPr('');setRenderId('');
      setWatched(false);setCorrections(false);
      setMessage('Recorded verified Director acceptance. Recheck the next-SHOT preflight.');
      setRevision(n=>n+1);
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }

  return <section className="library-episode-batch" aria-label="EP002 verified Director SHOT acceptance">
    <div className="library-episode-batch-heading">
      <div>
        <h2><GitMerge size={21}/> Verified SHOT Acceptance → Next Scene</h2>
        <p>This is the final quality gate for each Remotion SHOT. A GitHub PR, actual compiled
          source, current selected voice and real playable MP4 must match before the
          Director can unlock the next scene. No code generation or render starts here.</p>
      </div>
      <span className="library-episode-batch-state">
        {loading?'CHECKING':preflight?.candidate?'REVIEW REQUIRED':'ALL SHOTS REVIEWED'}</span>
    </div>
    {error&&<p role="alert" className="library-voice-error">{error}</p>}
    {message&&<p role="status" className="library-voice-ok">{message}</p>}

    {preflight?.candidate&&<>
      <p className="library-note"><LockKeyhole size={15} aria-hidden="true"/>{' '}
        Next candidate: <strong>{preflight.candidate.shotKey} ·
          {' '}{preflight.candidate.title}</strong>. Original SHOT01 is protected.
        {!preflight.realCueFramesVerified
          ?' Exact approved HEAR → SEE voice timings are not fully verified yet.':''}</p>
      <div className="library-episode-batch-actions">
        <label>Merged Remotion-only GitHub PR number
          <input value={pr} inputMode="numeric" disabled={busy}
            onChange={e=>{setPr(e.target.value);setProof(null);pending.current=null;}}
            placeholder="e.g. 220"/>
        </label>
        <button type="button" className="library-voice-refresh"
          disabled={busy||!pr.trim()} onClick={()=>void verifyPr()}>
          <GitMerge size={14}/> Verify current SHOT and visual-policy SHAs
        </button>
      </div>
      {proof&&<div className="library-episode-batch-shots">
        <strong>{proof.verified?'Merged source and policy verified':'Source verification blocked'}</strong>
        <small>{proof.verified?'Matched current main and four required visual rule files.'
          :proof.blockers.join(' · ')}</small>
        {proof.verified&&<small>Source commit: {proof.currentMainCommit} ·
          {' '}Policy digest: {proof.policyDigest}</small>}
      </div>}
      <label>Successful reviewed MP4 render ID
        <input value={renderId} disabled={busy}
          onChange={e=>{setRenderId(e.target.value);pending.current=null;}}
          placeholder="UUID from the real completed SHOT preview"/>
      </label>
      {uuid.test(renderId)&&<p className="library-note">
        <a href={'/api/v1/remotion/renders/'+renderId+'/video'}
          target="_blank" rel="noopener noreferrer">Open actual MP4 preview for review</a>
      </p>}
      <label><input type="checkbox" checked={watched} disabled={busy}
        onChange={e=>setWatched(e.target.checked)}/>{' '}
        I personally watched the full approved SHOT preview.</label>
      <label><input type="checkbox" checked={corrections} disabled={busy}
        onChange={e=>setCorrections(e.target.checked)}/>{' '}
        All required visual corrections are resolved and the shared style is consistent.</label>
      <div className="library-episode-batch-actions">
        <button type="button" className="library-voice-button"
          disabled={busy||!proof?.verified||!uuid.test(renderId)||!watched||!corrections
            ||!preflight.realCueFramesVerified}
          onClick={()=>void approve()}>
          {busy?'Verifying…':'Approve verified SHOT and advance'}
        </button>
      </div>
    </>}
    <details className="library-episode-batch-breakdown">
      <summary><CheckCircle2 size={16}/> Existing Director visual approvals ({history.length})</summary>
      {history.length===0?<p>No evidence-backed SHOT02+ acceptance recorded yet.</p>:
        <div className="library-episode-batch-shots">{history.map(row=>
          <div key={row.requestId} className="library-episode-batch-shot">
            <strong>{row.shotKey}</strong>
            <small>Source {row.sourceSha} · Policy {row.policyDigest}</small>
            <small>Verified render: {row.renderId}</small>
          </div>)}</div>}
    </details>
    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh" disabled={busy||loading}
        onClick={()=>{setProof(null);setRevision(n=>n+1);}}>
        <RotateCcw size={14}/> Refresh live review evidence
      </button>
    </div>
    <p className="library-note">Verification is fail-closed. A successful Git PR or an uploaded MP4
      alone cannot approve the SHOT. Voice, timing, source, Worker and render must all agree.
      Director acceptance does not publish the episode or enable paid rendering.</p>
  </section>;
}
