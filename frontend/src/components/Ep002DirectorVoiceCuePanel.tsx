import {useEffect,useState} from 'react';
import {AudioLines,RotateCcw} from 'lucide-react';
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

/**
 * View-only production telemetry. The backend resolves source-true approved
 * phrases against the selected Take's actual ElevenLabs character timestamps.
 * This component NEVER sends timing review POST or initiates paid actions.
 */
export function Ep002DirectorVoiceCuePanel(){
  const [plan,setPlan]=useState<Bridge|null>(null);
  const [shot,setShot]=useState('SHOT01');
  const [review,setReview]=useState<Reviewed|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');setReview(null);
    void fetch(BASE+'/factory-bridge',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw Error('EP002 locked plan unavailable ('+response.status+').');
      return await response.json() as Bridge;
    }).then(async bridge=>{
      const response=await fetch(BASE+'/voice-cue-review/'+shot,{cache:'no-store'});
      if(!response.ok)throw Error('Automatic timing unavailable ('+response.status+').');
      const aligned=await response.json() as Reviewed;
      if(!active)return;
      setPlan(bridge);setReview(aligned);
    }).catch(e=>{if(active){setError(String(e));setReview(null);}})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[shot,refresh]);

  const current=plan?.shots.find(x=>x.shotKey===shot);
  const fallback=current?suggestEp002VoiceCueAnchors(shot,current.narration,
    current.approvedVisualStory.beats):[];
  const anchors=review?.anchors.length===current?.beatCount?review.anchors:fallback;
  const ready=!!review?.verified && review.frames.length===current?.beatCount
    && review.selectedTakeId===current?.preferredTakeId
    && review.inputFingerprint===plan?.inputFingerprint;
  const status=ready?(review?.reason.startsWith('AUTO_')
    ?'AUTO-VERIFIED REAL TIMING':'REAL TIMING VERIFIED'):'WAITING FOR REAL AUDIO ALIGNMENT';

  return <section className="library-episode-batch" aria-label="EP002 automatic read-only voice timing">
    <div className="library-episode-batch-heading">
      <div>
        <h2><AudioLines size={21}/> Real Voice → HEAR → SEE Timing</h2>
        <p>Automatic, read-only synchronization. MediaOS selects the approved source phrases
          and verifies frames against genuine ElevenLabs character timestamps.
          No text entry, manual Verify button, new voice purchase or render runs here.</p>
      </div>
      <span className="library-episode-batch-state">{plan?plan.verifiedTimedShots+'/11 ALIGNED':'CHECKING'}</span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    <div className="library-episode-batch-actions">
      <label>Voice SHOT
        <select value={shot} disabled={loading} onChange={e=>setShot(e.target.value)}>
          {Array.from({length:11},(_,i)=>'SHOT'+String(i+1).padStart(2,'0')).map(key=>
            <option key={key} value={key}>{key}</option>)}
        </select>
      </label>
      <button className="library-voice-refresh" type="button"
        disabled={loading} onClick={()=>setRefresh(x=>x+1)}>
        <RotateCcw size={14}/> Refresh current voice and cues
      </button>
    </div>
    {current&&review&&<>
      <p className="library-note"><strong>{current.title}</strong> ·
        {' '}{current.beatCount} beats ·
        {' '}Selected Take: {current.preferredTakeId??'MISSING'} ·
        {' '}Audio frames: {current.durationFrames??'not measured'} ·
        {' '}<strong>{status}</strong>
      </p>
      {current.preferredTakeId&&<p>
        <a href={BASE+'/shots/'+shot+'/takes/'+current.preferredTakeId+'/audio'}
          target="_blank" rel="noopener noreferrer">Listen to the current ElevenLabs Take</a>
      </p>}
      {!ready&&<p className="library-note" role="status">
        Automatic timing is not ready: {review.reason}.
        {' '}The system must have a selected approved voice Take, measured duration and
        genuine character alignment. Missing data cannot be replaced with guessed frames.
      </p>}
      <div className="library-episode-batch-shots">
        {current.approvedVisualStory.beats.map((beat,i)=>
          <div key={beat.number} className="library-episode-batch-shot">
            <strong>Beat {beat.number} — approved visual action</strong>
            <p>{beat.direction}</p>
            <p className="library-note"><strong>Spoken anchor (read-only):</strong>{' '}
              {anchors[i]||'SOURCE_ANCHOR_UNAVAILABLE'}
            </p>
            {ready&&review.frames[i]&&
              <small>Verified frames {review.frames[i].startFrame}–{review.frames[i].endFrame}</small>}
          </div>)}
      </div>
      {ready&&<p className="library-voice-ok" role="status">
        All {current.beatCount} beats use measured audio timestamps. You can go directly
        to the SHOT rendering section; only the Render video button can start a paid render.
      </p>}
    </>}
    <p className="library-note">Viewing this panel is read-only. Generation remains
      exclusively your explicit Generate (slow intake) action. Existing approved Takes,
      Director-locked MP4s and voice recordings are never modified by timing preparation.</p>
  </section>;
}
