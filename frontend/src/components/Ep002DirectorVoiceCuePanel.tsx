import {useEffect,useState} from 'react';
import {AudioLines,CheckCircle2,RotateCcw} from 'lucide-react';
import {suggestEp002VoiceCueAnchors} from '../lib/ep002VoiceCueAnchors';

type Beat={number:number;direction:string;spokenAnchor?:string};
type Shot={shotKey:string;title:string;beatCount:number;narration:string;
  preferredTakeId:string|null;scriptRevision:number;
  durationFrames:number|null;hearSeeTimingVerified:boolean;
  approvedVisualStory:{beats:Beat[]}};
type Bridge={episodeKey:string;inputFingerprint:string;verifiedTimedShots:number;shots:Shot[]};
type Cue={beatNumber:number;spokenAnchor:string;startFrame:number;endFrame:number};
type Reviewed={shotKey:string;inputFingerprint:string;selectedTakeId:string|null;
  narrationRevision:number;requiredBeatCount:number;anchors:string[];
  frames:Cue[];verified:boolean;reason:string};
const BASE='/api/v1/creative/episodes/EP002';

export function Ep002DirectorVoiceCuePanel(){
  const [plan,setPlan]=useState<Bridge|null>(null);
  const [shot,setShot]=useState('SHOT01');
  const [review,setReview]=useState<Reviewed|null>(null);
  const [anchors,setAnchors]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');
    void fetch(BASE+'/factory-bridge',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw Error('EP002 locked plan unavailable ('+response.status+').');
      return await response.json() as Bridge;
    }).then(async bridge=>{
      const response=await fetch(BASE+'/voice-cue-review/'+shot,{cache:'no-store'});
      if(!response.ok)throw Error('Voice cue review unavailable ('+response.status+').');
      const saved=await response.json() as Reviewed;
      if(!active)return;
      setPlan(bridge);setReview(saved);
      const selected=bridge.shots.find(x=>x.shotKey===shot);
      setAnchors(saved.verified?saved.anchors:
        selected?suggestEp002VoiceCueAnchors(shot,selected.narration,
          selected.approvedVisualStory.beats):[]);
    }).catch(e=>{if(active){setError(String(e));setReview(null);}})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[shot,refresh]);

  const current=plan?.shots.find(x=>x.shotKey===shot);
  const autoRecovery=/^SHOT(0[8-9]|1[0-1])$/.test(shot);
  const automaticBeatCount=anchors.filter(x=>x.trim().length>=3).length;


  async function approve(){
    if(!current||!plan||!review||review.verified||saving)return;
    if(!window.confirm('I reviewed the selected Take audio and confirmed all spoken '+
        'phrases for '+shot+'. Verify exact ElevenLabs character timings?'))return;
    setSaving(true);setError('');setMessage('');
    try{
      const r=await fetch(BASE+'/voice-cue-review/'+shot,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:window.crypto.randomUUID(),
          expectedEpisodeFingerprint:plan.inputFingerprint,
          expectedTakeId:current.preferredTakeId,spokenAnchors:anchors.map(a=>a.trim()),
          confirmHeardAndReviewed:true,
        }),
      });
      if(!r.ok)throw Error('Timing review blocked ('+r.status+'): '+
        (await r.text()).slice(0,240));
      const result=await r.json() as Reviewed;
      if(!result.verified)throw Error('The server did not verify real audio frames.');
      setReview(result);
      setMessage('Verified '+shot+' against the actual selected ElevenLabs recording.');
      setRefresh(x=>x+1);
    }catch(e){setError(String(e));}finally{setSaving(false);}
  }

  return <section className="library-episode-batch" aria-label="EP002 real audio beat timings">
    <div className="library-episode-batch-heading">
      <div>
        <h2><AudioLines size={21}/> Real Voice → HEAR → SEE Timing</h2>
        <p>Review the spoken phrase that activates each visual beat. MediaOS calculates
          exact Remotion frames from the selected Take's character-level ElevenLabs
          alignment. It will not guess timestamps or generate new paid audio.</p>
      </div>
      <span className="library-episode-batch-state">
        {plan?plan.verifiedTimedShots+'/11 VERIFIED':'CHECKING'}</span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    {message&&<p className="library-voice-ok" role="status">{message}</p>}
    <div className="library-episode-batch-actions">
      <label>Voice SHOT
        <select value={shot} disabled={saving} onChange={e=>setShot(e.target.value)}>
          {Array.from({length:11},(_,i)=>'SHOT'+String(i+1).padStart(2,'0')).map(key=>
            <option key={key} value={key}>{key}</option>)}
        </select>
      </label>
      <button className="library-voice-refresh" type="button"
        disabled={saving||loading} onClick={()=>setRefresh(x=>x+1)}>
        <RotateCcw size={14}/> Refresh current audio and cues
      </button>
    </div>
    {current&&review&&<>
      <p className="library-note"><strong>{current.title}</strong> ·
        {' '}{current.beatCount} beats ·
        {' '}Selected Take: {current.preferredTakeId??'MISSING'} ·
        {' '}Audio frames: {current.durationFrames??'not measured'} ·
        {' '}{review.verified?'REAL TIMING VERIFIED':review.reason}</p>
      {current.preferredTakeId&&<p>
        <a href={BASE+'/shots/'+shot+'/takes/'+current.preferredTakeId+'/audio'}
          target="_blank" rel="noopener noreferrer">Listen to the selected ElevenLabs Take</a>
      </p>}
      <details className="library-episode-batch-breakdown">
        <summary>Current narration — real spoken phrases are prepared automatically</summary>
        <p>{current.narration}</p>
      </details>
      {!review.verified&&<p className="library-note">
        MediaOS has automatically suggested {anchors.filter(value=>value.trim()).length}
        {' '}of {current.beatCount} spoken phrases from the current saved narration.
        {autoRecovery
          ? ' You do not need to type or edit any beat. The matching phrases come from the Director-approved recovery story.'
          : ' These are editable suggestions, not proof of the selected audio.'}
        {' '}Listen to the approved Take first. The server will still require genuine ElevenLabs character timestamps.
        {shot==='SHOT03'&&<> SHOT03 timing note: throughput is spoken before
          six hundred and fifty, so the first beat establishes database completions;
          the third beat highlights arrival rate while keeping throughput visible.</>}
      </p>}
      <div className="library-episode-batch-shots">
        {current.approvedVisualStory.beats.map((beat,i)=>
          <div key={beat.number} className="library-episode-batch-shot">
            <strong>Beat {beat.number} — approved visual action</strong>
            <p>{beat.direction}</p>
            {autoRecovery
              ? <p className="library-note"><strong>Automatic spoken anchor:</strong>{' '}
                  {anchors[i]||'SOURCE_ANCHOR_MISSING — verify blocked'}</p>
              : <label>Exact unique spoken anchor
                  <input value={anchors[i]??''} maxLength={200}
                    disabled={saving||review.verified}
                    placeholder="Quote the selected recording accurately"
                    onChange={e=>setAnchors(a=>a.map((v,n)=>n===i?e.target.value:v))}/>
                </label>}
            {review.verified&&review.frames[i]&&
              <small>Frames {review.frames[i].startFrame}–{review.frames[i].endFrame}</small>}
          </div>)}
      </div>
      {autoRecovery&&!review.verified&&<p className="library-note">
        {automaticBeatCount}/{current.beatCount} beats prefilled. One review confirmation
        will resolve all real audio frames; no manual beat entry is needed.
      </p>}
      <button className="library-voice-button" type="button"
        disabled={saving||loading||review.verified||!current.preferredTakeId
          ||!current.durationFrames||anchors.length!==current.beatCount
          ||anchors.some(a=>a.trim().length<3)}
        onClick={()=>void approve()}>
        <CheckCircle2 size={15}/> {autoRecovery?'Verify all '+current.beatCount+' automatic beats':'Verify real voice cues for '+shot}
      </button>
    </>}
    <p className="library-note">Suggestions are only hints and never treated as
      timestamp evidence. If the Take lacks genuine character alignment,
      execution remains blocked. Historical uncertain paid requests cannot be retried here.</p>
  </section>;
}
