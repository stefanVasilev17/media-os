import {useEffect,useRef,useState} from 'react';
import {MessageSquareText,RotateCcw} from 'lucide-react';

type NextShot={shotKey:string;title:string};
type Preflight={
  inputFingerprint:string;nextShotKey:string|null;candidate:NextShot|null;
};
type Feedback={
  id:string;requestId:string;shotKey:string;state:string;
  episodeInputFingerprint:string;scriptRevision:number;
  selectedTakeId:string|null;changeArea:string;problemObserved:string;
  requestedCorrection:string;createdAt:string;
};

const PREFLIGHT='/api/v1/creative/episodes/EP002/visual-codex-preflight';
const ENDPOINT='/api/v1/creative/episodes/EP002/visual-feedback';
const categories=['CAMERA','MOTION','LAYOUT','COLOR','TEXT',
  'TIMING','AUDIO','TRANSITION','OTHER'] as const;
type Category=typeof categories[number];

export function Ep002VisualDirectorFeedbackPanel(){
  const [preflight,setPreflight]=useState<Preflight|null>(null);
  const [feedback,setFeedback]=useState<Feedback[]>([]);
  const [area,setArea]=useState<Category>('CAMERA');
  const [problem,setProblem]=useState('');
  const [correction,setCorrection]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [info,setInfo]=useState('');
  const [refreshCounter,setRefreshCounter]=useState(0);
  const pendingRequest=useRef<string|null>(null);

  useEffect(()=>{
    let live=true;
    setLoading(true);
    void Promise.all([
      fetch(PREFLIGHT,{cache:'no-store'}).then(async r=>{
        if(!r.ok)throw Error('Next-SHOT preflight unavailable (HTTP '+r.status+').');
        return await r.json() as Preflight;
      }),
      fetch(ENDPOINT,{cache:'no-store'}).then(async r=>{
        if(!r.ok)throw Error('Visual feedback history unavailable (HTTP '+r.status+').');
        return await r.json() as Feedback[];
      }),
    ]).then(([next,records])=>{
      if(live){setPreflight(next);setFeedback(records);setError('');}
    }).catch(reason=>{if(live){setPreflight(null);setError(String(reason));}})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[refreshCounter]);

  async function submit(){
    if(saving||!preflight?.nextShotKey||!preflight.candidate)return;
    if(problem.trim().length<12||correction.trim().length<12){
      setError('Describe the observed problem and requested change in at least 12 characters each.');
      return;
    }
    if(!window.confirm('Save this EP002 Director correction note for '+
        preflight.nextShotKey+'? This records review feedback only; it does NOT approve '+
        'a rendered scene, change the shared visual rules or start Codex/CPU rendering.'))return;
    const requestId=pendingRequest.current??window.crypto.randomUUID();
    pendingRequest.current=requestId;
    setSaving(true);setError('');setInfo('');
    try{
      const response=await fetch(ENDPOINT,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId,expectedEpisodeFingerprint:preflight.inputFingerprint,
          shotKey:preflight.nextShotKey,changeArea:area,
          problemObserved:problem.trim(),requestedCorrection:correction.trim(),
          confirmDirectorFeedback:true,
        }),
      });
      if(!response.ok)throw Error('Feedback not saved (HTTP '+response.status+'): '+
        (await response.text()).slice(0,220));
      const stored=await response.json() as Feedback;
      setFeedback(previous=>[stored,...previous.filter(x=>x.id!==stored.id)]);
      setProblem('');setCorrection('');pendingRequest.current=null;
      setInfo('Director correction note saved. It is NOT a visually approved SHOT or a global rule.');
    }catch(reason){setError(String(reason));}
    finally{setSaving(false);}
  }

  return <section className="library-episode-batch" aria-label="EP002 Director visual correction memory">
    <div className="library-episode-batch-heading">
      <div>
        <h2><MessageSquareText size={21}/> Visual Corrections — Director Memory</h2>
        <p>Save exact observed issues and requested improvements against the current
          next SHOT. These records are versioned evidence for future Codex Remotion
          revisions, not automatic acceptance or amendments to the global style.</p>
      </div>
      <span className="library-episode-batch-state">DIRECTOR NOTES</span>
    </div>

    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    {info&&<p className="library-voice-ok" role="status">{info}</p>}
    {preflight?.candidate&&<>
      <p className="library-note"><strong>Current target:</strong>{' '}
        {preflight.candidate.shotKey} · {preflight.candidate.title}.
        SHOT01 remains Director-LOCKED; later scenes cannot be skipped.</p>
      <div className="library-episode-batch-actions">
        <label>Correction area
          <select value={area} disabled={saving} onChange={event=>{
            setArea(event.target.value as Category);pendingRequest.current=null;
          }}>
            {categories.map(value=><option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label>What exactly looked wrong?
        <textarea value={problem} disabled={saving} maxLength={2000} rows={3}
          onChange={event=>{setProblem(event.target.value);pendingRequest.current=null;}}
          placeholder="Example: The camera moved too fast to read the Gateway label."/>
      </label>
      <label>What should be changed?
        <textarea value={correction} disabled={saving} maxLength={4000} rows={3}
          onChange={event=>{setCorrection(event.target.value);pendingRequest.current=null;}}
          placeholder="Describe the required camera, object, state or timing correction."/>
      </label>
      <div className="library-episode-batch-actions">
        <button type="button" className="library-voice-button"
          disabled={saving||loading||problem.trim().length<12||correction.trim().length<12}
          onClick={()=>void submit()}>
          {saving?'Saving…':'Save Director correction (no Codex or render)'}
        </button>
      </div>
    </>}

    <details className="library-episode-batch-breakdown">
      <summary>Recorded visual feedback ({feedback.length})</summary>
      {feedback.length===0?<p>No Director correction records yet.</p>:
        <div className="library-episode-batch-shots">
          {feedback.map(item=><div key={item.id} className="library-episode-batch-shot">
            <strong>{item.shotKey} · {item.changeArea}</strong>
            <small>{item.createdAt} · {item.state}</small>
            <p><strong>Observed:</strong> {item.problemObserved}</p>
            <p><strong>Requested:</strong> {item.requestedCorrection}</p>
            <small>{item.episodeInputFingerprint===preflight?.inputFingerprint
              ?'Matches current episode fingerprint'
              :'Historical input fingerprint — re-review before using as current'}</small>
          </div>)}
        </div>}
    </details>

    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh"
        disabled={loading||saving} onClick={()=>{
          setError('');setInfo('');setRefreshCounter(n=>n+1);
        }}>
        <RotateCcw size={14}/> Refresh Director corrections
      </button>
    </div>
    <p className="library-note">Permanent cross-video lessons are promoted only
      after a verified preview and your acceptance. This form does not change
      the canonical Remotion Visual Constitution or execute a Codex Cloud task.</p>
  </section>;
}
