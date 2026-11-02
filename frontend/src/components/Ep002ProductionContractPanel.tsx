import {useEffect,useState} from 'react';
import {Activity,CheckCircle2,Clock3,Link2,RotateCcw} from 'lucide-react';
import {getEp002ProductionContract,type Ep002ProductionContract} from '../api/ep002ProductionContractApi';

export function Ep002ProductionContractPanel({shotKey,refreshToken}:{
  shotKey:string;refreshToken:number;
}) {
  const [contract,setContract]=useState<Ep002ProductionContract|null>(null);
  const [refresh,setRefresh]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    setLoading(true);
    getEp002ProductionContract(shotKey).then(next=>{
      if(active){setContract(next);setError('');}
    }).catch(cause=>{
      if(active)setError(cause instanceof Error?cause.message:String(cause));
    }).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[shotKey,refreshToken,refresh]);

  const ready=contract?.status==='READY_FOR_REMOTION_SCENE_CONTRACT'||
    contract?.status==='READY_WITH_CUE_REVIEW';
  return <details className="library-production-contract">
    <summary>
      <span className="library-production-title"><Link2 size={17}/> Unified Production Data</span>
      <span className={'library-production-state'+(ready?' ready':'')}>
        {loading?'Checking…':ready?'DATA READY':contract?.status.replaceAll('_',' ')??'UNAVAILABLE'}
      </span>
    </summary>
    <div className="library-production-content">
      <p>This read-only contract combines the saved text, preferred voice recording and approved visual beats.
        It is the input for the next Remotion scene-generation stage.</p>
      {error&&<p role="alert" className="library-voice-error">{error}</p>}
      {contract&&<>
        <div className="library-production-metrics">
          <div>
            <span>Saved script</span>
            <strong>{contract.script.revision===0?'Original source':'Revision '+contract.script.revision}</strong>
            <small>{contract.script.sourceUnchanged?'Source text unchanged':'Narration edited'}</small>
          </div>
          <div>
            <span>Preferred voice</span>
            <strong>{contract.voice.takeNumber===null?'Not selected':'Take '+contract.voice.takeNumber}</strong>
            <small>{contract.voice.durationAuthority==='FFPROBE_MEASURED'?'Measured audio':'Audio timing not available'}</small>
          </div>
          <div>
            <span>Actual audio</span>
            <strong>{contract.voice.durationSeconds===null?'—':contract.voice.durationSeconds.toFixed(3)+'s'}</strong>
            <small>Editorial plan: {contract.visual.editorialDurationSeconds}s</small>
          </div>
          <div>
            <span>Visual beats</span>
            <strong>{contract.visual.beats.length}</strong>
            <small>Approved Visual Pass {contract.visual.version}</small>
          </div>
        </div>
        <p className="library-production-sync">
          <Clock3 size={16}/>
          <strong>Voice → Visual timing:</strong>
          {contract.voice.alignmentAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS'
            ? 'Five source-matched cues have real ElevenLabs timestamps.'
            : 'Precise cue timestamps were not stored for this selected take; visual motion remains provisional.'}
        </p>
        {contract.voice.cueTimings.length===5&&
          <ol className="library-production-beats">
            {contract.voice.cueTimings.map(cue=><li key={cue.number}>
              <strong>{cue.anchor}</strong> — {cue.startSeconds.toFixed(2)}s to {cue.endSeconds.toFixed(2)}s
              {' '}· Frames {cue.startFrame}–{cue.endFrame}
            </li>)}
          </ol>}
        {contract.voice.durationSeconds!==null&&
          <p className="library-production-sync"><Clock3 size={16}/> Audio vs. editorial slot:
            <strong>{(contract.voice.durationSeconds-contract.visual.editorialDurationSeconds)>=0?'+':''}
              {(contract.voice.durationSeconds-contract.visual.editorialDurationSeconds).toFixed(3)}s</strong>
            <span>Planning comparison only; individual word-to-beat timestamps are not measured here.</span>
          </p>}
        {contract.visual.cueReviewStatus==='REVIEW_AFTER_NARRATION_EDIT'&&
          <p className="library-warning">Script text changed since the approved visual source.
            The five HEAR cues may need a creative review; existing visual approval is preserved.</p>}
        <div className="library-production-subtitle"><Activity size={16}/><strong>HEAR → SEE visual beats</strong></div>
        <ol className="library-production-beats">
          {contract.visual.beats.map(beat=><li key={beat.number}>{beat.direction}</li>)}
        </ol>
        <p><strong>Camera:</strong> {contract.visual.cameraDirection}</p>
        <p><strong>End transition:</strong> {contract.visual.transition}</p>
        <p className="library-note">Visual timing: {contract.visual.beatTimingAuthority.replaceAll('_',' ')}.
          These beats are source instructions, not generated Remotion code.</p>
        <div className="library-production-lineage">
          <span><CheckCircle2 size={16}/> Current render: <strong>{contract.render.status.replaceAll('_',' ')}</strong></span>
          <span>Dependency: <code>{contract.dependencies.dependencySha256?.slice(0,16)??'awaiting preferred voice'}{contract.dependencies.dependencySha256?'…':''}</code></span>
          {contract.render.status==='SUCCEEDED'&&contract.render.renderId&&
            <a href={'/api/v1/remotion/renders/'+encodeURIComponent(contract.render.renderId)+'/video'}
              target="_blank" rel="noreferrer">Play matching render</a>}
        </div>
        <a href="https://github.com/stefanVasilev17/media-os/blob/main/frontend/src/data/EP002_VisualPass_v1_0_DIRECTOR_APPROVED.md"
          target="_blank" rel="noreferrer">Approved visual source · GitHub</a>
      </>}
      <button type="button" className="library-voice-refresh"
        onClick={()=>setRefresh(previous=>previous+1)} disabled={loading}>
        <RotateCcw size={14}/> Refresh production data
      </button>
    </div>
  </details>;
}
