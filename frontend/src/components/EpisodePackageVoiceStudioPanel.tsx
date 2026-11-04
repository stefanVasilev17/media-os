import {useCallback,useEffect,useRef,useState} from 'react';
import {RefreshCw,Save,Mic2,ShieldCheck} from 'lucide-react';

type Take={
  id:string;revision:number;takeNumber:number;contentType:string;
  modelId:string;voiceId:string;durationSeconds:number|null;
  hasAlignment:boolean;generatedAt:string;
};
type State={
  packageId:string;shotKey:string;revision:number;narration:string;
  voiceDirection:string;narrationSha256:string;takes:Take[];
  selectedTakeId:string|null;approvedCurrentRevision:boolean;
  voiceStatus:string;generationStatus:string;configured:boolean;
  paidGateEnabled:boolean;canGenerate:boolean;blockedReason:string;
  timingStatus:string;
};

const label=(text:string)=>text.replaceAll('_',' ').toLowerCase();

async function checked<T>(response:Response):Promise<T>{
  if(!response.ok)throw Error('HTTP '+response.status+': '+(await response.text()).slice(0,280));
  return response.json() as Promise<T>;
}

export function EpisodePackageVoiceStudioPanel({packageId,shotKey}:{
  packageId:string;shotKey:string;
}){
  const base='/api/v1/episode-packages/'+encodeURIComponent(packageId)
    +'/shots/'+encodeURIComponent(shotKey)+'/voice';
  const [data,setData]=useState<State|null>(null);
  const [narration,setNarration]=useState('');
  const [direction,setDirection]=useState('');
  const [take,setTake]=useState('');
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [consent,setConsent]=useState(false);
  const inFlight=useRef(false);
  const pendingPaidId=useRef<string|null>(null);

  const apply=(result:State)=>{
    setData(result);setNarration(result.narration);setDirection(result.voiceDirection);
    setTake(result.selectedTakeId??'');setConsent(false);
  };
  const refresh=useCallback(async()=>{
    const state=await checked<State>(await fetch(base,{cache:'no-store'}));
    apply(state);
  },[base]);

  useEffect(()=>{
    let active=true;setLoading(true);setError('');setMessage('');
    void fetch(base,{cache:'no-store'}).then(checked<State>)
      .then(result=>{if(active)apply(result);})
      .catch(reason=>{if(active)setError(String(reason));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[base]);

  const dirty=!!data && (narration!==data.narration||direction!==data.voiceDirection);
  const canSave=!!data&&dirty&&!busy&&narration.trim().length>=20
    &&narration.length<=12000&&direction.trim().length>=8&&direction.length<=1200;

  async function save(){
    if(!canSave||inFlight.current||!data)return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    try{
      const result=await checked<State>(await fetch(base+'/script',{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:data.revision,narration,
          voiceDirection:direction}),
      }));
      apply(result);
      setMessage('Working narration saved as revision '+result.revision+
        '. Earlier takes are preserved, but only the new revision can be approved.');
    }catch(e){setError(String(e));}
    finally{inFlight.current=false;setBusy(false);}
  }

  async function generate(){
    if(!data||!data.canGenerate||dirty||!consent||busy||inFlight.current)return;
    if(!window.confirm('This is a paid ElevenLabs API generation for '+shotKey+
      ' / revision '+data.revision+'. It may incur provider charges. '+
      'Continue once? A failed or uncertain request will NOT be retried automatically.'))return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    const id=pendingPaidId.current??window.crypto.randomUUID();
    pendingPaidId.current=id;
    try{
      const result=await checked<State>(await fetch(base+'/generate',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:data.revision,
          expectedNarrationSha256:data.narrationSha256,requestId:id,
          confirmPaidElevenLabs:true}),
      }));
      pendingPaidId.current=null;
      apply(result);
      setMessage('New audio Take stored. Listen to it and explicitly approve your chosen Take.');
    }catch(e){
      setError(String(e)+' Payment status may be uncertain. Do not retry without reconciling the provider request.');
      setConsent(false);
    }finally{inFlight.current=false;setBusy(false);}
  }

  async function approve(){
    if(!data||!take||dirty||busy||inFlight.current)return;
    if(!window.confirm('Approve Take '+take.slice(0,8)+'… for '+shotKey+
      ' revision '+data.revision+'? This does NOT authorize OpenAI agents.'))return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    try{
      const result=await checked<State>(await fetch(base+'/approve',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:data.revision,takeId:take,
          decision:'DIRECTOR_APPROVE'}),
      }));
      apply(result);
      setMessage('Director-approved Take selected for current revision. '+
        'Voice timing still requires explicit verification before AI execution.');
    }catch(e){setError(String(e));}
    finally{inFlight.current=false;setBusy(false);}
  }

  return <div className="episode-package-voice-studio">
    <div className="episode-package-voice-head">
      <h3><Mic2 size={19}/> Voice Studio · {shotKey}</h3>
      <button type="button" disabled={busy||loading}
        onClick={()=>{if(dirty&&!window.confirm('Discard unsaved narration edits?'))return;
          setLoading(true);void refresh().catch(e=>setError(String(e)))
            .finally(()=>setLoading(false));}}>
        <RefreshCw size={14}/> Refresh</button>
    </div>
    {loading?<p>Loading current voice revision…</p>:data&&<>
      <p>Script revision <strong>{data.revision}</strong> ·
        {' '}<strong>{label(data.voiceStatus)}</strong> ·
        {' '}Timing: <strong>{label(data.timingStatus)}</strong></p>
      <p className="episode-package-voice-note">Original imported narration remains immutable.
        Edit and Save creates a new working revision without deleting older audio.</p>
      <label htmlFor={'narration-'+shotKey}>Current working narration</label>
      <textarea id={'narration-'+shotKey} rows={5} maxLength={12000}
        value={narration} disabled={busy} onChange={e=>setNarration(e.target.value)}/>
      <label htmlFor={'direction-'+shotKey}>Editorial voice direction</label>
      <textarea id={'direction-'+shotKey} rows={3} maxLength={1200}
        value={direction} disabled={busy} onChange={e=>setDirection(e.target.value)}/>
      <p className="episode-package-voice-note">Voice direction is retained for editorial review.
        The current ElevenLabs v4 generation uses the approved EP001 delivery profile; it does not
        interpret arbitrary directions as ElevenLabs API settings.</p>
      <button type="button" className="episode-package-voice-primary"
        disabled={!canSave} onClick={()=>void save()}>
        <Save size={16}/> {busy?'Saving…':'Save working revision (no API cost)'}
      </button>

      <div className="episode-package-voice-takes">
        <h4>Generated takes · Playback and Director selection</h4>
        {data.takes.length===0?<p>No audio Take generated yet.</p>:
          data.takes.map(item=><div key={item.id} className="episode-package-voice-take">
            <label className="episode-package-voice-option">
              <input type="radio" name={'take-'+shotKey} value={item.id}
                checked={take===item.id}
                onChange={()=>setTake(item.id)} disabled={busy||dirty||item.revision!==data.revision}/>
              <span>Take {item.takeNumber} · revision {item.revision}
                {item.id===data.selectedTakeId?' · DIRECTOR APPROVED':''}</span>
            </label>
            <p>{item.durationSeconds!=null?item.durationSeconds+'s measured':'Duration not measured'}
              {' · '}{item.hasAlignment?'Provider alignment saved':'No verified alignment'}
              {' · '}{item.modelId}</p>
            <audio controls preload="none"
              src={base+'/takes/'+encodeURIComponent(item.id)+'/audio'} />
          </div>)}
      </div>

      <button type="button" className="episode-package-voice-primary"
        disabled={!take||busy||dirty||data.takes.every(t=>t.id!==take||t.revision!==data.revision)}
        onClick={()=>void approve()}>
        <ShieldCheck size={16}/> Approve selected current-revision Take
      </button>

      <div className="episode-package-voice-paid">
        <h4>Generate new Take · Paid ElevenLabs call</h4>
        <p>Server paid gate: {data.paidGateEnabled?'enabled':'disabled'} ·
          {' '}Latest paid attempt: {label(data.generationStatus)}</p>
        {data.blockedReason&&<p role="status">{data.blockedReason}</p>}
        <label className="episode-package-voice-option">
          <input type="checkbox" checked={consent} disabled={!data.canGenerate||busy||dirty}
            onChange={e=>setConsent(e.target.checked)}/>
          <span>I authorize one paid ElevenLabs generation for this exact narration version.
            No automatic retry or OpenAI visual execution.</span>
        </label>
        <button type="button" className="episode-package-voice-primary"
          disabled={!data.canGenerate||!consent||busy||dirty}
          onClick={()=>void generate()}><Mic2 size={16}/> Generate one Take (paid)</button>
      </div>
    </>}
    {error&&<p className="episode-hub-error" role="alert">{error}</p>}
    {message&&<p className="episode-package-notice" role="status">{message}</p>}
  </div>;
}
