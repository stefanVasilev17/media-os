import {useEffect,useRef,useState} from 'react';
import {FileCheck2,GitBranch,RefreshCw,ShieldAlert,ShieldCheck} from 'lucide-react';

type GitFile={path:string;expectedHistoricalBlobSha:string|null;
  observedGitBlobSha:string|null;status:string};
type Asset={requestedKey:string;resolution:string;component:string|null;
  sourcePath:string|null;sourceGitBlobSha:string|null;reviewStatus:string};
type Cue={beatId:string;anchor:string;startFrame:number;endFrame:number};
type ShotPrompt={shotKey:string;shotIndex:number;outputPath:string;
  componentExport:string;narrationRevision:number;currentNarration:string;
  voiceDirection:string;approvedTakeId:string;measuredVoiceSeconds:number;
  durationInFrames:number;originalApprovedVisualStory:Record<string,unknown>;
  verifiedCues:Cue[];assets:Asset[];proposedNewAssetKeys:string[]};
type BatchManifest={schemaVersion:string;packageId:string;jobId:string;
  episodeKey:string;sourceSha256:string;readinessFingerprint:string;
  assetCatalogSha256:string;repository:string;allowedCodePath:string;
  pinnedGitCommit:string|null;productionDependencySha256:string|null;
  verifiedGitFiles:GitFile[];productionInputSha256:string|null;
  status:string;blockers:string[];proposalContractSchema:string;
  codeWorkerTrustPolicy:string;canStartAgent:boolean;
  providerDispatchEnabled:boolean;shots:ShotPrompt[]};

type StartApproval={approvalId:string;jobId:string;packageId:string;
  state:string;productionInputSha256:string;pinnedGitCommit:string;
  dependencySha256:string;expectedShotCount:number;approvedAt:string;
  canStartAgent:boolean;providerDispatchEnabled:boolean};

export function EpisodeCodeWorkerBatchManifestPanel({packageId,jobId}:{
  packageId:string;jobId:string;
}){
  const [result,setResult]=useState<BatchManifest|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [startApproval,setStartApproval]=useState<StartApproval|null>(null);
  const [startBusy,setStartBusy]=useState(false);
  const [startMessage,setStartMessage]=useState('');
  const requestId=useRef<string|null>(null);
  const startUrl='/api/v1/episode-packages/'+encodeURIComponent(packageId)
    +'/execution-jobs/'+encodeURIComponent(jobId)+'/director-start';

  useEffect(()=>{
    let alive=true;
    setStartApproval(null);setStartMessage('');requestId.current=null;
    void fetch(startUrl,{cache:'no-store'}).then(async response=>{
      if(response.status===204)return null;
      if(!response.ok)throw Error('Director Start history HTTP '+response.status);
      return response.json() as Promise<StartApproval>;
    }).then(approval=>{if(alive)setStartApproval(approval);})
      .catch(e=>{if(alive)setError(String(e));});
    return()=>{alive=false;};
  },[startUrl]);

  async function approveDirectorStart(){
    if(!result||result.status!=='SOURCE_MANIFEST_VERIFIED_WAITING_FOR_SEPARATE_DIRECTOR_START'
        ||startBusy||startApproval?.state==='APPROVED_NO_DISPATCH'
        ||!result.productionInputSha256||!result.pinnedGitCommit)return;
    if(!window.confirm('Approve this exact full-episode Git + voice + asset manifest for a future '
      +'bounded Multi-SHOT Code Worker? This creates one audited Director Start receipt. '
      +'OpenAI provider dispatch is still DISABLED: no API credits, code writes or renders happen now. '
      +'The future worker MUST verify all dependencies again before any paid call.'))return;
    setStartBusy(true);setError('');setStartMessage('');
    const id=requestId.current??window.crypto.randomUUID();
    requestId.current=id;
    try{
      const response=await fetch(startUrl+'/approve',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:id,expectedProductionInputSha256:result.productionInputSha256,
          expectedPinnedGitCommit:result.pinnedGitCommit,
          confirmDirectorStart:true,acknowledgeProviderDisabled:true,
        }),
      });
      if(!response.ok)throw Error('Director Start HTTP '+response.status+': '
        +(await response.text()).slice(0,350));
      const approval=await response.json() as StartApproval;
      setStartApproval(approval);requestId.current=null;
      setStartMessage('Director approval recorded for '
        +approval.expectedShotCount+' SHOTs. OpenAI dispatch stays OFF.');
    }catch(e){
      setError(String(e)+' Check the saved Director Start history before retrying; '
        +'no paid provider request is initiated by this control.');
    }finally{setStartBusy(false);}
  }

  async function check(){
    setLoading(true);setError('');setResult(null);
    try{
      const response=await fetch('/api/v1/episode-packages/'+
        encodeURIComponent(packageId)+'/execution-jobs/'+encodeURIComponent(jobId)+
        '/code-worker-batch-manifest',{cache:'no-store'});
      if(!response.ok)throw Error('MediaOS HTTP '+response.status+': '+
        (await response.text()).slice(0,350));
      setResult(await response.json() as BatchManifest);
    }catch(e){setError(String(e));}
    finally{setLoading(false);}
  }
  const verified=result?.status==='SOURCE_MANIFEST_VERIFIED_WAITING_FOR_SEPARATE_DIRECTOR_START';
  return <section className="episode-git-manifest" aria-label="Code worker Git dependency pin and batch manifest">
    <div className="episode-git-manifest-heading">
      <h4><GitBranch size={18}/> Current Git Dependencies · Full-Episode Worker Manifest</h4>
      <button type="button" disabled={loading} onClick={()=>void check()}>
        <RefreshCw size={15}/>{loading?'Verifying Git…':'Verify live Git & build batch manifest'}
      </button>
    </div>
    <p>This is a read-only, on-demand GitHub source verification. The check pins the
      actual repository commit and checks Director-reviewed Remotion source blobs.
      No OpenAI, ElevenLabs, code writes or rendering is triggered.</p>
    {error&&<p role="alert" className="episode-hub-error">{error}</p>}
    {startMessage&&<p role="status" className="episode-package-notice">{startMessage}</p>}
    {result&&<>
      <div className="episode-git-manifest-status">
        {verified?<ShieldCheck size={19}/>:<ShieldAlert size={19}/>}
        <div>
          <strong>{result.status.replaceAll('_',' ')}</strong>
          <p>{verified?'Sources and approved voice-input fingerprints match. Separate Director Start and an actual bounded AI worker are still required.':
            'Generation remains blocked. Review the missing asset, changed source or Git access issues below.'}</p>
        </div>
      </div>
      <p className="episode-git-manifest-meta">
        Git commit: <code>{result.pinnedGitCommit??'UNAVAILABLE'}</code>
        {' · '}Verified source files: {result.verifiedGitFiles.length}
        {' · '}Input fingerprint: <code>{result.productionInputSha256??'BLOCKED'}</code>
      </p>
      {result.blockers.length>0&&<div className="episode-git-manifest-blockers">
        <strong>Blocking reasons</strong>
        <ul>{result.blockers.map((b,i)=><li key={b+'-'+i}>{b.replaceAll('_',' ')}</li>)}</ul>
      </div>}
      <details>
        <summary>Verified Git dependency files ({result.verifiedGitFiles.length})</summary>
        {result.verifiedGitFiles.map(file=><div className="episode-git-manifest-file" key={file.path}>
          <FileCheck2 size={15}/>
          <span><strong>{file.path}</strong>
            <small>{file.status.replaceAll('_',' ')}
              {' · '}Blob: {file.observedGitBlobSha??'MISSING'}
              {file.expectedHistoricalBlobSha?' · Baseline: '+file.expectedHistoricalBlobSha:''}</small>
          </span>
        </div>)}
      </details>
      <h5>One typed production manifest · {result.shots.length} SHOTs</h5>
      {result.shots.map(shot=><details key={shot.shotKey}>
        <summary><strong>{shot.shotKey} · {shot.durationInFrames} frames</strong>
          {' · '}{shot.verifiedCues.length} verified cues
          {' · '}{shot.proposedNewAssetKeys.length} new asset decisions</summary>
        <div className="episode-git-manifest-shot">
          <p><strong>New file only:</strong> <code>{shot.outputPath}</code></p>
          <p><strong>Approved Take:</strong> {shot.approvedTakeId}
            {' · '}narration revision {shot.narrationRevision}</p>
          <p><strong>Voice direction:</strong> {shot.voiceDirection}</p>
          <details><summary>Current narration (data only)</summary>
            <p>{shot.currentNarration}</p></details>
          <p><strong>Asset use:</strong> {shot.assets.length===0?'No declared assets':
            shot.assets.map(x=>x.requestedKey+' → '+(x.component??'NEW ASSET')).join(', ')}</p>
          <p><strong>Verified audio cues:</strong> {shot.verifiedCues.map(c=>
            c.beatId+' ['+c.startFrame+'–'+c.endFrame+']').join(', ')}</p>
        </div>
      </details>)}
      <div className="episode-git-manifest-status">
        <ShieldCheck size={19}/>
        <div>
          <strong>Director Start · Git- and voice-bound release gate</strong>
          <p>{startApproval
            ?'Recorded: '+startApproval.state.replaceAll('_',' ')
              +' · '+startApproval.expectedShotCount+' SHOTs · '
              +startApproval.approvedAt
            :'No Director Start approval is recorded for this job.'}</p>
          <p>Git dependency and real voice inputs will be rechecked when the future
            paid executor is connected. Approval never calls OpenAI or starts rendering.</p>
          <button type="button" className="episode-ai-auth-primary"
            disabled={!verified||startBusy||!!startApproval}
            onClick={()=>void approveDirectorStart()}>
            {startBusy?'Recording Director Start…':
             startApproval?'Director Start recorded':'Approve exact batch for future AI Start — no provider call'}
          </button>
        </div>
      </div>
      <p><strong>Code worker:</strong> NOT CONNECTED.
        {' '}<strong>Paid provider dispatch:</strong> DISABLED.
        Verified inputs cannot start an agent without a new audited Director Start gate.</p>
    </>}
  </section>;
}
