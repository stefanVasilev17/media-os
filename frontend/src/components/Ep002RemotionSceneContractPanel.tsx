import {useEffect,useRef,useState} from 'react';
import {Camera,Code2,RotateCcw} from 'lucide-react';
import {getEp002RemotionSceneContract,type Ep002SceneContract} from '../api/ep002RemotionSceneContractApi';
import {Ep002DirectorVisualFeedbackPanel} from './Ep002DirectorVisualFeedbackPanel';
import {ep002CreativeVoiceApi,type ExistingTakeAlignmentState} from '../api/ep002CreativeVoiceApi';
import {ensureLocalCsrf} from '../auth/localSession';
import {decideShot01Render,genuineShot01CueFrames} from '../lib/ep002Shot01RenderReadiness';

const label=(value:string)=>value.replaceAll('_',' ').toLowerCase();

export function Ep002RemotionSceneContractPanel(
  {refreshToken,expanded=false}:{refreshToken:number;expanded?:boolean}
){
  const [scene,setScene]=useState<Ep002SceneContract|null>(null);
  const [refresh,setRefresh]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [preview,setPreview]=useState<{status:string;renderId?:string;progress?:number;videoUrl?:string|null;error?:string|null}|null>(null);
  const [alignment,setAlignment]=useState<ExistingTakeAlignmentState|null>(null);
  const [operation,setOperation]=useState('');
  const [rendering,setRendering]=useState(false);
  const requestInFlight=useRef(false);
  const pendingRenderRequestId=useRef<string|null>(null);
  useEffect(()=>{
    let active=true;
    setLoading(true);
    Promise.all([
      getEp002RemotionSceneContract(),
      ep002CreativeVoiceApi.alignmentState('SHOT01').catch(()=>null),
    ])
      .then(([result,savedAlignment])=>{
        if(active){setScene(result);setAlignment(savedAlignment);setError('');}
      })
      .catch(cause=>{if(active){setScene(null);setError(String(cause));}})
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

  const hasRealCues=genuineShot01CueFrames(scene);
  const decision=decideShot01Render(scene,alignment);
  const canPreview=decision.action!=='BLOCKED';
  const previewActive=preview?.status==='QUEUED'||preview?.status==='RUNNING';

  async function requestPreview(){
    if(!scene||!canPreview||rendering||previewActive||requestInFlight.current)return;
    const chosenAction=decision.action;
    const consent=chosenAction==='ALIGN_AND_RENDER'
      ?'SHOT01 requires TWO separately billed operations: (1) ElevenLabs Forced Alignment on your EXISTING approved voice recording, using Speech-to-Text credits; (2) Railway CPU Full HD 1920×1080 / 30fps rendering. MediaOS will FIRST verify and save the real character timing; it will render ONLY if all five beats validate. The locked recording and previous MP4 remain unchanged. Authorize both paid operations?'
      :'Render ONE NEW SHOT01 Full HD 1920×1080 / 30fps REVIEW candidate with the existing approved voice and five real audio cues? This uses paid Railway CPU; no new TTS or alignment is purchased. Existing Director locks remain unchanged.';
    if(!window.confirm(consent))return;
    requestInFlight.current=true;
    setRendering(true);setOperation('Validating current voice and render prerequisites…');
    setError('');
    try{
      let currentScene=scene;
      if(chosenAction==='ALIGN_AND_RENDER'){
        const latest=await ep002CreativeVoiceApi.alignmentState('SHOT01');
        if(decideShot01Render(currentScene,latest).action!=='ALIGN_AND_RENDER')
          throw Error('The locked voice or paid alignment status changed. No paid request was started.');

        const anchorsResponse=await fetch('/api/v1/creative/episodes/EP002/voice-cue-review/SHOT01',
          {cache:'no-store'});
        if(!anchorsResponse.ok)throw Error('Cannot verify the existing narration before paid alignment.');
        const source=await anchorsResponse.json() as {
          anchors?:string[];selectedTakeId?:string|null;narrationRevision?:number;
        };
        if(source.selectedTakeId!==currentScene.inputs.preferredTakeId
          ||source.narrationRevision!==currentScene.inputs.scriptRevision
          ||source.anchors?.length!==5)
          throw Error('The saved script or five approved spoken anchors do not match this Take. No paid request was started.');

        const secure=await ensureLocalCsrf();
        const confirmedId=currentScene.inputs.preferredTakeId;
        if(!confirmedId)throw Error('No approved selected Take. No paid request was started.');
        setOperation('Aligning existing approved MP3 with ElevenLabs (paid; no new TTS)…');
        const paidResponse=await fetch(
          '/api/v1/creative/episodes/EP002/shots/SHOT01/align-existing-take',{
            method:'POST',cache:'no-store',
            headers:{'Content-Type':'application/json',[secure.header]:secure.token},
            body:JSON.stringify({
              preferredTakeId:confirmedId,expectedRevision:currentScene.inputs.scriptRevision,
              requestId:window.crypto.randomUUID(),confirmPaidAlignment:true,
            }),
          });
        if(!paidResponse.ok)
          throw Error('Paid alignment did not finish: HTTP '+paidResponse.status+' '+
            (await paidResponse.text()).slice(0,300)+
            '. Do not retry until you check the saved alignment request state.');
        const saved=await paidResponse.json() as ExistingTakeAlignmentState;
        setAlignment(saved);
        if(!saved.alignmentPresent||saved.preferredTakeId!==confirmedId)
          throw Error('Alignment completion is not confirmed. No render was started; do not retry blindly.');
        setOperation('Checking all five REAL ElevenLabs frame ranges…');
        currentScene=await getEp002RemotionSceneContract();
        setScene(currentScene);
        if(decideShot01Render(currentScene,saved).action!=='RENDER')
          throw Error('The existing MP3 was aligned, but five source-true beats did not validate. No render was started and no further alignment will be charged automatically.');
      }else{
        const latest=await getEp002RemotionSceneContract();
        if(decideShot01Render(latest,alignment).action!=='RENDER'
          ||latest.contractId!==currentScene.contractId)
          throw Error('Voice/scene inputs changed before render. Reload first; no render started.');
        currentScene=latest;
      }
      const secure=await ensureLocalCsrf();
      const renderRequestId=pendingRenderRequestId.current??window.crypto.randomUUID();
      pendingRenderRequestId.current=renderRequestId;
      setOperation('Starting one authorized 1920×1080 Railway CPU render…');
      const response=await fetch('/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview',{
        method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json',[secure.header]:secure.token},
        body:JSON.stringify({
          expectedContractId:currentScene.contractId,acceptProvisionalCueTiming:false,
          renderRequestId,
        }),
      });
      if(!response.ok)
        throw Error('Render request failed: HTTP '+response.status+' '+
          (await response.text()).slice(0,300)+'. Inspect render status before any retry.');
      const output=await response.json();
      setPreview(output);
      pendingRenderRequestId.current=null;
      setOperation('Paid render request accepted. Review its progress and the new MP4 candidate.');
      setRefresh(x=>x+1);
    }catch(cause){
      setError(String(cause));
      setOperation('Stopped safely; no automatic paid retry will run.');
    }finally{
      requestInFlight.current=false;
      setRendering(false);
    }
  }

  return <details open={expanded} className="library-production-contract library-scene-contract">
    <summary>
      <span className="library-production-title"><Code2 size={17}/> Remotion Scene Blueprint · SHOT01 — Render video</span>
      <span className={'library-production-state'+(canPreview?' ready':'')}>
        {loading?'Checking…':error?'SCENE UNAVAILABLE':
          decision.action==='RENDER'?'READY TO RENDER':
          decision.action==='ALIGN_AND_RENDER'?'PAID ALIGNMENT + RENDER READY':
          !scene?'SCENE UNAVAILABLE':scene.inputs.preferredTakeId===null?'VOICE TAKE REQUIRED':
          scene.inputs.measuredDurationSeconds===null?'MEASURED AUDIO REQUIRED':
          !hasRealCues?'REAL VOICE TIMING REQUIRED':'CHECK RENDER PREREQUISITES'}
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
          <p className="library-warning" role="status">
            Automatic render prerequisites: {scene.readiness.blockers.map(label).join('; ')}.
            {' '}No text entry or manual voice-cue Verify is required.
          </p>}
        <p className="library-note">{scene.cueTimingAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS'
          ? 'Voice-synced: these beat frames are derived from real ElevenLabs character timestamps for the selected take.'
          : 'The five approved beat ranges are not yet verified against this selected MP3. No approximate frames can be rendered.'}</p>
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
            {decision.action==='ALIGN_AND_RENDER'
              ?'The existing approved MP3 needs one separately paid ElevenLabs Forced Alignment. You can authorize it together with Render video using this single button. Only successful real timing allows rendering.'
              :decision.reason}
          </p>}
          {!hasRealCues&&scene.cueTimingDiagnostic&&<p className="library-note" role="status">
            Audio source diagnosis: {scene.cueTimingDiagnostic.replaceAll('_',' ').toLowerCase()}.
          </p>}
          <p>{scene.cueTimingAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS'
            ? 'Uses real ElevenLabs voice timestamps for the five spoken cue anchors. Director visual review remains required.'
            : 'Current real audio timing is incomplete. No substitute editorial timing will be rendered.'}</p>
          <button type="button" className="library-voice-button"
            disabled={!canPreview||rendering||previewActive}
            onClick={()=>void requestPreview()}>
            {rendering?(operation||'Preparing…'):previewActive?'Render already running':'Render video · 1920×1080'}
          </button>
          {operation&&<p className="library-note" role="status">{operation}</p>}
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
