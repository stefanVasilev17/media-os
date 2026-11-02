import {useEffect,useState} from 'react';
import {Camera,Code2,RotateCcw} from 'lucide-react';
import {getEp002RemotionSceneContract,type Ep002SceneContract} from '../api/ep002RemotionSceneContractApi';

const label=(value:string)=>value.replaceAll('_',' ').toLowerCase();

export function Ep002RemotionSceneContractPanel({refreshToken}:{refreshToken:number}){
  const [scene,setScene]=useState<Ep002SceneContract|null>(null);
  const [refresh,setRefresh]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [preview,setPreview]=useState<{status:string;renderId?:string;progress?:number;videoUrl?:string|null;error?:string|null}|null>(null);
  const [rendering,setRendering]=useState(false);
  useEffect(()=>{
    let active=true;
    setLoading(true);
    getEp002RemotionSceneContract()
      .then(result=>{if(active){setScene(result);setError('');}})
      .catch(cause=>{if(active)setError(String(cause));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[refreshToken,refresh]);

  useEffect(()=>{
    let active=true;
    let interval:ReturnType<typeof setInterval>|undefined;
    const refreshStatus=async()=>{
      try{
        const response=await fetch('/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview',
          {cache:'no-store'});
        if(response.ok){
          const result=await response.json();
          if(active)setPreview(result);
        }
      }catch{ }
    };
    void refreshStatus();
    interval=setInterval(()=>void refreshStatus(),5000);
    return()=>{active=false;if(interval)clearInterval(interval);};
  },[refreshToken,refresh]);

  const canPreview=!!scene && scene.inputs.preferredTakeId!==null
    && scene?.inputs.measuredDurationSeconds!==null
    && scene?.video.durationInFrames!==null
    && !scene?.readiness.blockers.some(b=>b!=='NARRATION_CUE_REVIEW_REQUIRED');

  async function requestPreview(){
    if(!scene||!canPreview||rendering)return;
    if(!window.confirm('Create an EP002 SHOT01 storyboard preview using the current preferred voice? '
      +'The five visual beats use provisional editorial timing, not verified word alignment. '
      +'This uses the existing render worker but does not request paid ElevenLabs audio.'))return;
    setRendering(true);setError('');
    try{
      const response=await fetch('/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedContractId:scene.contractId,acceptProvisionalCueTiming:true})
      });
      if(!response.ok)throw new Error('Preview request failed: HTTP '+response.status
        +' '+(await response.text()).slice(0,220));
      const output=await response.json();
      setPreview(output);
    }catch(cause){setError(String(cause));}
    finally{setRendering(false);}
  }

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
        <div className="library-scene-preview">
          <strong>EP002 SHOT01 — Remotion preview</strong>
          <p>Provisional five-beat storyboard timing. Final word/beat alignment is still pending Director review.</p>
          <button type="button" className="library-voice-button"
            disabled={!canPreview||rendering}
            onClick={()=>void requestPreview()}>
            {rendering?'Starting…':'Create storyboard preview'}
          </button>
          {preview&&<p role="status">Render: {preview.status}
            {typeof preview.progress==='number'?' · '+preview.progress+'%':''}
            {preview.error?' · '+preview.error.slice(0,230):''}
          </p>}
          {preview?.status==='SUCCEEDED'&&preview.videoUrl&&
            <video controls preload="metadata" style={{width:'100%',maxHeight:480,borderRadius:9,marginTop:10}}
              src={preview.videoUrl}/>}
        </div>
        <p className="library-production-lineage">Contract fingerprint: {scene.contractId.slice(0,20)}…</p>
      </>}
      <button type="button" className="library-voice-refresh" disabled={loading}
        onClick={()=>setRefresh(old=>old+1)}>
        <RotateCcw size={14}/> Refresh blueprint
      </button>
    </div>
  </details>;
}
