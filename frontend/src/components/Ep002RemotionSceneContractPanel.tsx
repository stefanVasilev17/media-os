import {useEffect,useRef,useState} from 'react';
import {Camera,Code2,RotateCcw} from 'lucide-react';
import {getEp002RemotionSceneContract,type Ep002SceneContract} from '../api/ep002RemotionSceneContractApi';
import {Ep002DirectorVisualFeedbackPanel} from './Ep002DirectorVisualFeedbackPanel';

const label=(value:string)=>value.replaceAll('_',' ').toLowerCase();

export function Ep002RemotionSceneContractPanel(
  {refreshToken,expanded=false}:{refreshToken:number;expanded?:boolean}
){
  const [scene,setScene]=useState<Ep002SceneContract|null>(null);
  const [refresh,setRefresh]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [preview,setPreview]=useState<{status:string;renderId?:string;progress?:number;videoUrl?:string|null;error?:string|null}|null>(null);
  const [rendering,setRendering]=useState(false);
  const requestInFlight=useRef(false);
  const pendingRenderRequestId=useRef<string|null>(null);
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

  const hasRealCues=!!scene
    && scene.cueTimingAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS'
    && scene.beats.length===5
    && scene.beats.every(b=>b.cueStatus==='AUDIO_ALIGNED'
      && b.startFrame!==null && b.endFrame!==null);
  const canPreview=!!scene && hasRealCues && scene.inputs.preferredTakeId!==null
    && scene.inputs.measuredDurationSeconds!==null
    && scene.video.durationInFrames!==null
    && !scene.readiness.blockers.some(b=>b!=='NARRATION_CUE_REVIEW_REQUIRED');

  const previewActive=preview?.status==='QUEUED'||preview?.status==='RUNNING';

  async function requestPreview(){
    if(!scene||!canPreview||rendering||previewActive||requestInFlight.current)return;
    const hasAlignedCues=scene.cueTimingAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS';
    if(!hasAlignedCues)return;
    if(!window.confirm('Render a NEW EP002 SHOT01 Full HD 1920×1080 / 30fps candidate using the existing approved voice and real ElevenLabs beat timestamps? This is a paid Railway CPU render. No new voice will be generated, and existing Director locks stay untouched.'))return;
    const renderRequestId=pendingRenderRequestId.current??window.crypto.randomUUID();
    pendingRenderRequestId.current=renderRequestId;
    requestInFlight.current=true;
    setRendering(true);setError('');
    try{
      const response=await fetch('/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedContractId:scene.contractId,acceptProvisionalCueTiming:false,renderRequestId})
      });
      if(!response.ok)throw new Error('Preview request failed: HTTP '+response.status
        +' '+(await response.text()).slice(0,220));
      const output=await response.json();
      setPreview(output);
      pendingRenderRequestId.current=null;
    }catch(cause){setError(String(cause));}
    finally{requestInFlight.current=false;setRendering(false);}
  }

  return <details open={expanded} className="library-production-contract library-scene-contract">
    <summary>
      <span className="library-production-title"><Code2 size={17}/> Remotion Scene Blueprint · SHOT01 — Render video</span>
      <span className={'library-production-state'+(scene?.readiness.status==='READY_FOR_CODE_GENERATION'?' ready':'')}>
        {loading?'Checking…':scene?.readiness.status==='READY_FOR_CODE_GENERATION'
          ?'READY FOR PREVIEW':'INPUTS REQUIRED'}
      </span>
    </summary>
    <div className="library-production-content">
      <p>Source-bound instructions and voice cue frames for the implemented EP002 SHOT01 Remotion scene.
        New visual code versions require an explicitly created preview to appear in the player.</p>
      {error&&<p role="alert" className="library-voice-error">{error}</p>}
      {scene&&<>
        <div className="library-production-metrics">
          <div><span>Remotion composition</span><strong>{scene.video.compositionId}</strong><small>Implemented in worker</small></div>
          <div><span>Canvas</span><strong>{scene.video.width} × {scene.video.height}</strong><small>{scene.video.fps} fps</small></div>
          <div><span>Audio frames</span><strong>{scene.video.durationInFrames??'—'}</strong><small>{label(scene.video.durationAuthority)}</small></div>
          <div><span>Visual plan</span><strong>{scene.beats.length} beats</strong><small>{scene.assets.length} asset references</small></div>
        </div>
        {scene.readiness.blockers.length>0&&
          <p className="library-warning">Code-generation prerequisites: {scene.readiness.blockers.map(label).join('; ')}.</p>}
        <p className="library-note">{scene.cueTimingAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS'
          ? 'Voice-synced: these beat frames are derived from real ElevenLabs character timestamps for the selected take.'
          : 'Provisional: this recording has no saved ElevenLabs character timestamps. Visual beats use approximate editorial positions.'}</p>
        <div className="library-production-subtitle"><Camera size={16}/><strong>Camera and animation instructions</strong></div>
        <ol className="library-production-beats">
          {scene.beats.map(beat=><li key={beat.number}>
            <strong>{label(beat.cameraIntent)}</strong> · {beat.operations.map(label).join(' + ')}
            <p>Spoken cue: {beat.cueAnchor}. {beat.startFrame===null||beat.endFrame===null
              ? "Start/end frames: not measured."
              : `Voice timing: ${(beat.startFrame/scene.video.fps).toFixed(2)}s–${(beat.endFrame/scene.video.fps).toFixed(2)}s · Frames ${beat.startFrame}–${beat.endFrame}`}</p>
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
          {!hasRealCues&&<p className="library-warning" role="status">
            Render video is blocked until five genuine ElevenLabs character-aligned
            beats are available for the current selected Take. No voice regeneration,
            manual cue entry or manual Verify is required.
          </p>}
          <p>{scene.cueTimingAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS'
            ? 'Uses real ElevenLabs voice timestamps for the five spoken cue anchors. Director visual review remains required.'
            : 'This take has no saved voice timestamps; the five beats use approximate editorial timing.'}</p>
          <button type="button" className="library-voice-button"
            disabled={!canPreview||rendering||previewActive}
            onClick={()=>void requestPreview()}>
            {rendering?'Starting…':previewActive?'Render already running':'Render video · 1920×1080'}
          </button>
          {preview&&<p role="status">Render: {preview.status}
            {typeof preview.progress==='number'?' · '+preview.progress+'%':''}
            {preview.error?' · '+preview.error.slice(0,230):''}
          </p>}
          {preview?.status==='SUCCEEDED'&&preview.videoUrl&&
            <video key={preview.renderId} controls preload="metadata" style={{width:'100%',maxHeight:480,borderRadius:9,marginTop:10}}
              src={preview.videoUrl}/>}
        </div>
        <Ep002DirectorVisualFeedbackPanel contractId={scene.contractId}
          renderId={preview?.renderId} renderStatus={preview?.status}/>
        <p className="library-production-lineage">Contract fingerprint: {scene.contractId.slice(0,20)}…</p>
      </>}
      <button type="button" className="library-voice-refresh" disabled={loading}
        onClick={()=>setRefresh(old=>old+1)}>
        <RotateCcw size={14}/> Refresh blueprint
      </button>
    </div>
  </details>;
}
