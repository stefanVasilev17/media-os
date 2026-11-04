import {useEffect,useState} from 'react';
import {Box,RefreshCw,ShieldAlert,CheckCircle2} from 'lucide-react';
import '../styles/episodeCodeWorkerPreflight.css';
import {EpisodeCodeWorkerBatchManifestPanel} from './EpisodeCodeWorkerBatchManifestPanel';

type AssetMatch={
  requestedKey:string;resolution:string;component:string|null;
  assetStatus:string|null;sourcePath:string|null;verifiedGitBlobSha:string|null;
};
type Cue={beatId:string;anchor:string;startSeconds:number;endSeconds:number;
  startFrame:number;endFrame:number};
type ShotPlan={
  shotKey:string;shotIndex:number;proposedFilePath:string;narrationRevision:number;
  selectedTakeId:string;measuredAudioSeconds:number;durationInFrames:number;
  visualGoal:string;cameraDirection:string;assets:AssetMatch[];
  verifiedCues:Cue[];unresolvedAssets:number;codeProposalAllowed:boolean;
};
type Preflight={
  packageId:string;jobId:string;episodeKey:string;state:string;
  sourceSha256:string;readinessFingerprint:string;
  currentReadinessFingerprint:string;sameVoiceSnapshot:boolean;
  assetCatalogVersion:string;assetCatalogSha256:string;assetReferenceGitSha:string;
  productionInputCandidateSha256:string;dependencyStatus:string;
  repository:string;allowedOutputPrefix:string;registeredAssets:number;
  totalShots:number;missingAssetKeys:number;providerDispatchEnabled:boolean;
  canStartAgent:boolean;nextAction:string;shots:ShotPlan[];
};

async function load(packageId:string,jobId:string):Promise<Preflight>{
  const response=await fetch('/api/v1/episode-packages/'+encodeURIComponent(packageId)
    +'/execution-jobs/'+encodeURIComponent(jobId)+'/code-worker-preflight',
    {cache:'no-store'});
  if(!response.ok)throw Error('MediaOS HTTP '+response.status+': '+
    (await response.text()).slice(0,350));
  return response.json() as Promise<Preflight>;
}

export function EpisodeCodeWorkerPreflightPanel({packageId,jobId}:{
  packageId:string;jobId:string;
}){
  const [result,setResult]=useState<Preflight|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  async function reload(){
    setLoading(true);setError('');
    try{setResult(await load(packageId,jobId));}
    catch(cause){setResult(null);setError(String(cause));}
    finally{setLoading(false);}
  }
  useEffect(()=>{
    let active=true;
    setLoading(true);
    void load(packageId,jobId)
      .then(value=>{if(active)setResult(value);})
      .catch(cause=>{if(active)setError(String(cause));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[packageId,jobId]);

  return <section className="episode-code-worker" aria-label="Reusable assets and code worker plan">
    <div className="episode-code-worker-heading">
      <h4><Box size={18}/> Reusable Asset Registry · Code Worker Preflight</h4>
      <button type="button" disabled={loading} onClick={()=>void reload()}>
        <RefreshCw size={15}/> Recheck
      </button>
    </div>
    {loading&&<p role="status">Reading approved SHOT source and catalog dependencies…</p>}
    {error&&<p role="alert" className="episode-hub-error">{error}</p>}
    {result&&<>
      <div className="episode-code-worker-warning">
        <ShieldAlert size={20}/>
        <div>
          <strong>Planning only · Agent execution BLOCKED</strong>
          <p>{result.dependencyStatus.replaceAll('_',' ')}.
            {' '}The historical Git asset blob hashes must be verified again against
            the actual code-generation commit. No OpenAI, GitHub PR or Remotion render starts here.</p>
        </div>
      </div>
      <div className="episode-code-worker-metrics">
        <div><strong>{result.totalShots}</strong><span>SHOT plans</span></div>
        <div><strong>{result.registeredAssets}</strong><span>Catalog primitives</span></div>
        <div><strong>{result.missingAssetKeys}</strong><span>Unresolved asset keys</span></div>
        <div><strong>{result.sameVoiceSnapshot?'MATCH':'STALE'}</strong><span>Current voice snapshot</span></div>
      </div>
      <p className="episode-code-worker-small">
        Catalog: {result.assetCatalogVersion} · Baseline Git: {result.assetReferenceGitSha.slice(0,12)}…
        {' · '}Candidate input fingerprint: {result.productionInputCandidateSha256.slice(0,14)}…
      </p>
      <p className="episode-code-worker-small">Allowed output directory: <code>
        {result.allowedOutputPrefix}</code>. This is a read-only proposal plan,
        not permission to edit source code.</p>
      <div className="episode-code-worker-shots">
        {result.shots.map(shot=><details key={shot.shotKey}>
          <summary>
            <span><strong>{shot.shotKey} · {shot.durationInFrames} frames</strong>
              <small>{shot.measuredAudioSeconds}s real voice
                {' · '}{shot.verifiedCues.length} verified cues
                {' · '}{shot.unresolvedAssets} missing asset keys</small></span>
            {shot.unresolvedAssets===0
              ?<CheckCircle2 size={17}/>:<ShieldAlert size={17}/>}
          </summary>
          <div className="episode-code-worker-detail">
            <p><strong>Planned new file:</strong> <code>{shot.proposedFilePath}</code></p>
            <p><strong>Visual goal:</strong> {shot.visualGoal||'See original visual story'}</p>
            <p><strong>Camera:</strong> {shot.cameraDirection||'See original direction'}</p>
            <strong>Explicit asset resolution</strong>
            {shot.assets.length===0?<p>No explicit asset keys in the source. Agent must
              review the scene before requesting reuse or new primitives.</p>:
              <div className="episode-code-worker-assets">
                {shot.assets.map(asset=><div key={asset.requestedKey}>
                  <strong>{asset.requestedKey}</strong>
                  <span>{asset.component??'NEW ASSET REQUIRED'}
                    {' · '}{asset.resolution.replaceAll('_',' ')}</span>
                </div>)}
              </div>}
            <strong>Real HEAR → SEE cue frames</strong>
            <div className="episode-code-worker-cues">
              {shot.verifiedCues.map(cue=><div key={cue.beatId}>
                {cue.beatId} · frames {cue.startFrame}–{cue.endFrame}
                {' · '}{cue.anchor}
              </div>)}
            </div>
            <p className="episode-code-worker-small">Script revision {shot.narrationRevision};
              approved audio Take {shot.selectedTakeId.slice(0,8)}…
              {' · '}Source proposal allowed: NO (awaiting Director-controlled AI worker).</p>
          </div>
        </details>)}
      </div>
      <EpisodeCodeWorkerBatchManifestPanel packageId={packageId} jobId={jobId}/>
    </>}
  </section>;
}
