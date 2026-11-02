import {useEffect,useState} from 'react';
import {Camera,Code2,RotateCcw} from 'lucide-react';
import {getEp002RemotionSceneContract,type Ep002SceneContract} from '../api/ep002RemotionSceneContractApi';

const label=(value:string)=>value.replaceAll('_',' ').toLowerCase();

export function Ep002RemotionSceneContractPanel({refreshToken}:{refreshToken:number}){
  const [scene,setScene]=useState<Ep002SceneContract|null>(null);
  const [refresh,setRefresh]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    setLoading(true);
    getEp002RemotionSceneContract()
      .then(result=>{if(active){setScene(result);setError('');}})
      .catch(cause=>{if(active)setError(String(cause));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[refreshToken,refresh]);

  return <details className="library-production-contract library-scene-contract">
    <summary>
      <span className="library-production-title"><Code2 size={17}/> Remotion Scene Blueprint · SHOT01</span>
      <span className={'library-production-state'+(scene?.readiness.status==='READY_FOR_CODE_GENERATION'?' ready':'')}>
        {loading?'Checking…':scene?.readiness.status==='READY_FOR_CODE_GENERATION'
          ?'READY FOR CODE GENERATION':'INPUTS REQUIRED'}
      </span>
    </summary>
    <div className="library-production-content">
      <p>A typed, source-bound blueprint for the next Remotion development stage.
        This is not a built scene, registered composition or video render.</p>
      {error&&<p role="alert" className="library-voice-error">{error}</p>}
      {scene&&<>
        <div className="library-production-metrics">
          <div><span>Planned composition</span><strong>{scene.video.compositionId}</strong><small>Not registered</small></div>
          <div><span>Canvas</span><strong>{scene.video.width} × {scene.video.height}</strong><small>{scene.video.fps} fps</small></div>
          <div><span>Audio frames</span><strong>{scene.video.durationInFrames??'—'}</strong><small>{label(scene.video.durationAuthority)}</small></div>
          <div><span>Visual plan</span><strong>{scene.beats.length} beats</strong><small>{scene.assets.length} asset references</small></div>
        </div>
        {scene.readiness.blockers.length>0&&
          <p className="library-warning">Code-generation prerequisites: {scene.readiness.blockers.map(label).join('; ')}.</p>}
        <p className="library-note">Visual cue timestamps are not yet measured. Frame-level beat timing requires alignment.</p>
        <div className="library-production-subtitle"><Camera size={16}/><strong>Camera and animation instructions</strong></div>
        <ol className="library-production-beats">
          {scene.beats.map(beat=><li key={beat.number}>
            <strong>{label(beat.cameraIntent)}</strong> · {beat.operations.map(label).join(' + ')}
            <p>Spoken cue: {beat.cueAnchor}. Start/end frame: pending.</p>
            <p>{beat.approvedDirection}</p>
            <small>Assets: {beat.assetKeys.join(', ')}</small>
          </li>)}
        </ol>
        <div className="library-production-subtitle"><strong>Asset inventory</strong></div>
        <div className="library-scene-assets">
          {scene.assets.map(asset=><div key={asset.key}>
            <strong>{asset.key}</strong>
            <small>{asset.usage==='NEW_PROPOSAL'?'Proposed new':'Reuse reference'} · unverified</small>
          </div>)}
        </div>
        <p><strong>Continuity:</strong> {scene.continuityGuardrails}</p>
        <p><strong>Transition:</strong> {scene.endingTransition}</p>
        <p className="library-note">Remotion code generation and rendering are next-stage operations.</p>
        <p className="library-production-lineage">Contract fingerprint: {scene.contractId.slice(0,20)}…</p>
      </>}
      <button type="button" className="library-voice-refresh" disabled={loading}
        onClick={()=>setRefresh(old=>old+1)}>
        <RotateCcw size={14}/> Refresh blueprint
      </button>
    </div>
  </details>;
}
