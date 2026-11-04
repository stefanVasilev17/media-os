import {useCallback,useEffect,useRef,useState} from 'react';
import {ClipboardList,RotateCcw} from 'lucide-react';

type FeedbackEntry={
  id:string;
  sourceRenderId:string;
  changeArea:string;
  feedback:string;
  status:string;
  sceneContractId:string;
  preferredTakeId:string;
  scriptRevision:number;
  createdAt:string;
};

type Props={
  contractId:string;
  renderId?:string;
  renderStatus?:string;
};

const ENDPOINT='/api/v1/creative/episodes/EP002/shots/SHOT01/director-feedback';
const AREAS=['LAYOUT','CAMERA','MOTION','COLOR','TEXT','TIMING','OTHER'] as const;

export function Ep002DirectorVisualFeedbackPanel({contractId,renderId,renderStatus}:Props){
  const [requests,setRequests]=useState<FeedbackEntry[]>([]);
  const [feedback,setFeedback]=useState('');
  const [area,setArea]=useState<string>('LAYOUT');
  const [acknowledged,setAcknowledged]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const requestIdRef=useRef<string|null>(null);
  const postingRef=useRef(false);

  const refresh=useCallback(async()=>{
    const response=await fetch(ENDPOINT,{cache:'no-store'});
    if(!response.ok)throw new Error('Could not load revision requests: HTTP '+response.status);
    const result=await response.json() as FeedbackEntry[];
    setRequests(result);
  },[]);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    fetch(ENDPOINT,{cache:'no-store'})
      .then(async response=>{
        if(!response.ok)throw new Error('Could not load revision requests: HTTP '+response.status);
        return await response.json() as FeedbackEntry[];
      })
      .then(rows=>{if(active)setRequests(rows);})
      .catch(reason=>{if(active)setError(String(reason));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  const canSave=renderStatus==='SUCCEEDED' && !!renderId &&
    feedback.trim().length>=12 && feedback.trim().length<=3000 &&
    acknowledged && !saving;

  async function submit(){
    if(!canSave||postingRef.current||!renderId)return;
    postingRef.current=true;
    setSaving(true);
    setError('');
    setMessage('');
    const requestId=requestIdRef.current??window.crypto.randomUUID();
    requestIdRef.current=requestId;
    try{
      const response=await fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId,
          sourceRenderId:renderId,
          expectedContractId:contractId,
          changeArea:area,
          feedback:feedback.trim(),
          acknowledgeVisualLock:true,
        }),
      });
      if(!response.ok)throw new Error('Could not save feedback: HTTP '+response.status+
        ' '+(await response.text()).slice(0,200));
      const saved=await response.json() as FeedbackEntry;
      requestIdRef.current=null;
      setFeedback('');
      setAcknowledged(false);
      setMessage('Feedback saved as '+saved.status.replaceAll('_',' ').toLowerCase()+
        '. No code change, AI call or render was started.');
      await refresh();
    }catch(reason){
      setError(String(reason));
    }finally{
      postingRef.current=false;
      setSaving(false);
    }
  }

  return <details className="library-director-feedback">
    <summary><span><ClipboardList size={17}/> Director revision inbox · Stage 4</span>
      <small>{requests.length} saved</small></summary>
    <div className="library-director-feedback-body">
      <p>Record a targeted visual correction against a real EP002 SHOT01 preview.
        The approved SHOT01 visual remains <strong>LOCKED</strong>. Saving feedback
        does not invoke AI, change Remotion code, deploy or render a video.
        Automated agent execution is not connected yet.</p>
      <p className="library-note">Source preview: {renderId??'none'} · {renderStatus??'NOT_RENDERED'}.
        Only a completed preview with the currently selected voice can receive a new request.</p>
      {error&&<p role="alert" className="library-voice-error">{error}</p>}
      {message&&<p role="status" className="library-voice-ok">{message}</p>}
      <div className="library-director-feedback-fields">
        <label htmlFor="ep002-director-change-area">What should change?</label>
        <select id="ep002-director-change-area" value={area}
          onChange={event=>{setArea(event.target.value);requestIdRef.current=null;}}
          disabled={saving}>
          {AREAS.map(value=><option value={value} key={value}>{value.toLowerCase()}</option>)}
        </select>
        <label htmlFor="ep002-director-feedback">Your visual feedback</label>
        <textarea id="ep002-director-feedback" rows={4} maxLength={3000}
          value={feedback}
          onChange={event=>{setFeedback(event.target.value);requestIdRef.current=null;}}
          disabled={saving}
          placeholder="Example: Make the Auth label larger while preserving the locked Phone, five voice cues and camera path."/>
        <label className="library-director-feedback-confirm">
          <input type="checkbox" checked={acknowledged}
            onChange={event=>setAcknowledged(event.target.checked)}
            disabled={saving}/>
          <span>I understand that SHOT01 is Director-LOCKED. This saves a request for later
            review; it does not unlock or modify the approved scene.</span>
        </label>
      </div>
      <button type="button" className="library-voice-button"
        onClick={()=>void submit()} disabled={!canSave}>
        {saving?'Saving…':'Save revision request (no AI cost)'}
      </button>
      <button type="button" className="library-voice-refresh" disabled={loading||saving}
        onClick={()=>{setLoading(true);refresh().catch(e=>setError(String(e)))
          .finally(()=>setLoading(false));}}>
        <RotateCcw size={14}/> Refresh requests
      </button>
      <div className="library-director-feedback-history">
        <strong>Saved requests</strong>
        {loading?<p>Loading…</p>:requests.length===0?<p>No visual revision requests saved.</p>:
          <ul>{requests.map(item=><li key={item.id}>
            <strong>{item.changeArea.toLowerCase()} · {item.status.replaceAll('_',' ').toLowerCase()}</strong>
            <small>{item.createdAt} · preview {item.sourceRenderId.slice(0,8)}…</small>
            <p>{item.feedback}</p>
          </li>)}</ul>}
      </div>
    </div>
  </details>;
}
