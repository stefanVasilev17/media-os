import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Film,Pause,Play,RotateCcw,ShieldCheck} from 'lucide-react';
import {Ep002FullMasterPanel} from './Ep002FullMasterPanel';
import {Ep002V2DirectorMasterPanel} from './Ep002V2DirectorMasterPanel';
import {Ep002V3ContinuityDirectorPanel} from './Ep002V3ContinuityDirectorPanel';
import {Ep002V4CleanCutDirectorPanel} from './Ep002V4CleanCutDirectorPanel';

type LockedShot={
  shotKey:string;
  title:string;
  renderId:string;
  videoUrl:string;
  durationSeconds:number;
  source:'PINNED_DIRECTOR_LOCK'|'LIVE_DIRECTOR_REVIEW_CANDIDATE';
};
type RenderEvidence={
  status?:string;renderId?:string;videoUrl?:string|null;
  durationInFrames?:number;fps?:number;width?:number;height?:number;
  compositionId?:string;
};
type LockedReference={shotKey:string;title:string;renderId:string;compositionId:string;
  durationInFrames?:number;width?:number;height?:number};

const RENDER='/api/v1/remotion/renders/';
const LIVE_REVIEW_SHOTS:readonly {shotKey:string;title:string;compositionId:string}[]=[];
const REFERENCES:readonly LockedReference[]=[
  {shotKey:'SHOT01',title:'What Happens When You Click Login? — Director V2 LOCK',
    renderId:'8f46fafd-9613-4375-bce2-ea98854e8b20',
    compositionId:'EP002-SHOT01-DRAFT',durationInFrames:1172,
    width:1920,height:1080},
  {shotKey:'SHOT02',title:'9:00 AM: The Ticket Sale Opens',
    renderId:'59567d1a-6a45-4e48-b390-8ae583f30171',
    compositionId:'EP002-SHOT02-CANDIDATE'},
  {shotKey:'SHOT03',title:'The Database Capacity Limit',
    renderId:'6e8ea02e-1de1-440b-9e2a-dc23d07c466c',
    compositionId:'EP002-SHOT03-CANDIDATE'},
  {shotKey:'SHOT04',title:'Alive Is Not Available — Director V2',
    renderId:'b006202f-7587-4f82-931a-fadf5eacbfcb',
    compositionId:'EP002-SHOT04-CANDIDATE'},
  {shotKey:'SHOT05',title:'Connection Pool: The Hidden Queue — Director LOCK',
    renderId:'b2b95685-8e1b-41df-9fe2-c83eefbf86e9',
    compositionId:'EP002-SHOT05-CANDIDATE'},
  {shotKey:'SHOT06',title:'The Deadline Expires — Director V2 LOCK',
    renderId:'d42fe3a2-3810-4626-ab3a-0456463d4636',
    compositionId:'EP002-SHOT06-CANDIDATE'},
  {shotKey:'SHOT07',title:'When Retrying Creates More Failure — Director V3 LOCK',
    renderId:'b2a335dd-cb71-48f2-bf47-0f8bdcdd969d',
    compositionId:'EP002-SHOT07-CANDIDATE',durationInFrames:2674},
  {shotKey:'SHOT08',title:'Stop the Retry Storm — Director LOCK',
    renderId:'3415073a-5906-489d-bb69-6af7446c2c9b',
    compositionId:'EP002-SHOT08-CANDIDATE',durationInFrames:2314},
  {shotKey:'SHOT09',title:'Protect the Shared Database — Director LOCK',
    renderId:'d4b6c8ff-10c5-4181-aa59-fcd16a4470ba',
    compositionId:'EP002-SHOT09-CANDIDATE',durationInFrames:3063},
  {shotKey:'SHOT10',title:'Prove the Recovery — Director LOCK',
    renderId:'2034d8c6-99b2-46a5-9469-bf3df325d6c0',
    compositionId:'EP002-SHOT10-CANDIDATE',durationInFrames:2360},
  {shotKey:'SHOT11',title:'Healthy Is Not the Same as Available — Director LOCK',
    renderId:'73ec0e6f-d348-4518-a32b-573bf89a8ab5',
    compositionId:'EP002-SHOT11-CANDIDATE',durationInFrames:1572},
];

export const LOCKED_CUT_SHOT_ORDER=Object.freeze([
  ...REFERENCES.map(x=>x.shotKey),...LIVE_REVIEW_SHOTS.map(x=>x.shotKey),
]);
export const DIRECTOR_REVIEW_BOUNDARIES=Object.freeze([
  {from:'SHOT01',to:'SHOT02',label:'Review 01 → 02'},
  {from:'SHOT05',to:'SHOT06',label:'Review 05 → 06'},
  {from:'SHOT06',to:'SHOT07',label:'Review 06 → 07'},
  {from:'SHOT07',to:'SHOT08',label:'Review 07 → 08'},
  {from:'SHOT08',to:'SHOT09',label:'Review 08 → 09'},
  {from:'SHOT09',to:'SHOT10',label:'Review 09 → 10'},
  {from:'SHOT10',to:'SHOT11',label:'Review 10 → 11'},
]);
export function actualShotOrderIsContinuous(previous:string,next:string):boolean{
  const a=Number(previous.slice(4)),b=Number(next.slice(4));
  return /^SHOT\d{2}$/.test(previous)&&/^SHOT\d{2}$/.test(next)&&b===a+1;
}

export const cutDuration=(shots:readonly Pick<LockedShot,'durationSeconds'>[]):number=>
  shots.reduce((sum,shot)=>sum+shot.durationSeconds,0);

export const locateCutTime=(shots:readonly Pick<LockedShot,'durationSeconds'>[],at:number)=>{
  const seconds=Math.max(0,Number.isFinite(at)?at:0);
  let offset=0;
  for(let i=0;i<shots.length;i++){
    const duration=shots[i].durationSeconds;
    if(seconds<offset+duration||i===shots.length-1)
      return {index:i,localSeconds:Math.max(0,Math.min(duration,seconds-offset))};
    offset+=duration;
  }
  return {index:0,localSeconds:0};
};

const displayTime=(seconds:number)=>{
  const raw=Math.max(0,Math.floor(seconds));
  const m=Math.floor(raw/60),s=raw%60;
  return m+':'+String(s).padStart(2,'0');
};

async function getRender(id:string):Promise<RenderEvidence>{
  const response=await fetch(RENDER+encodeURIComponent(id),{cache:'no-store'});
  if(!response.ok)throw Error('Render HTTP '+response.status);
  return await response.json() as RenderEvidence;
}

function playable(
  evidence:RenderEvidence,expectedId:string,expectedComposition:string,
  expectedFrames?:number,expectedWidth=1920,expectedHeight=1080
){
  if(evidence.renderId!==expectedId
    ||evidence.compositionId!==expectedComposition
    ||evidence.status!=='READY'
    ||evidence.width!==expectedWidth||evidence.height!==expectedHeight
    ||evidence.fps!==30||!Number.isInteger(evidence.durationInFrames)
    ||(evidence.durationInFrames??0)<150
    ||(expectedFrames!==undefined&&evidence.durationInFrames!==expectedFrames)
    ||evidence.videoUrl!==RENDER+expectedId+'/video')
    throw Error('Exact Director-LOCKED MP4 ID, format or frame count unavailable');
  return (evidence.durationInFrames as number)/30;
}

export async function loadLockedCut():Promise<{
  shots:LockedShot[];missing:string[];
}>{
  const entries=await Promise.all(REFERENCES.map(async ref=>{
    try{
      const info=await getRender(ref.renderId);
      const durationSeconds=playable(info,ref.renderId,ref.compositionId,
        ref.durationInFrames,ref.width??1920,ref.height??1080);
      return {ok:true as const,shot:{
        shotKey:ref.shotKey,title:ref.title,renderId:ref.renderId,
        videoUrl:RENDER+ref.renderId+'/video',durationSeconds,
        source:'PINNED_DIRECTOR_LOCK' as const}};
    }catch(error){
      return {ok:false as const,shotKey:ref.shotKey,
        reason:String(error instanceof Error?error.message:error)};
    }
  }));
  const shots:LockedShot[]=[];
  const missing:string[]=[];
  for(const entry of entries){
    if(entry.ok)shots.push(entry.shot);
    else missing.push(entry.shotKey+': '+entry.reason);
  }
  const candidates=await Promise.all(LIVE_REVIEW_SHOTS.map(async ref=>{
    try {
      const response=await fetch(RENDER+'compositions/'+
        encodeURIComponent(ref.compositionId)+'/latest-successful?profile=REVIEW',
        {cache:'no-store'});
      if(!response.ok)throw Error('Stored MP4 lookup HTTP '+response.status);
      const latest=await response.json() as RenderEvidence;
      if(!latest.renderId)throw Error('No completed stored Full HD MP4');
      const durationSeconds=playable(latest,latest.renderId,ref.compositionId);
      return {ok:true as const,shot:{
        shotKey:ref.shotKey,title:ref.title,renderId:latest.renderId,
        videoUrl:RENDER+latest.renderId+'/video',durationSeconds,
        source:'LIVE_DIRECTOR_REVIEW_CANDIDATE' as const}};
    } catch(error){
      return {ok:false as const,shotKey:ref.shotKey,
        reason:String(error instanceof Error?error.message:error)};
    }
  }));
  for(const entry of candidates){
    if(entry.ok)shots.push(entry.shot);
    else missing.push(entry.shotKey+': '+entry.reason);
  }
  return {shots,missing};
}

export function Ep002LockedCutReviewRoom(){
  const [shots,setShots]=useState<LockedShot[]>([]);
  const [missing,setMissing]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [activeIndex,setActiveIndex]=useState(0);
  const [currentSeconds,setCurrentSeconds]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [revision,setRevision]=useState(0);
  const player=useRef<HTMLVideoElement>(null);
  const nextStart=useRef(0);
  const autoPlay=useRef(false);
  const itemsRef=useRef(shots);
  itemsRef.current=shots;
  const active=shots[activeIndex];
  const duration=useMemo(()=>cutDuration(shots),[shots]);
  const prefix=useMemo(()=>shots.map((_,i)=>cutDuration(shots.slice(0,i))),[shots]);
  const absoluteSeconds=(prefix[activeIndex]??0)+currentSeconds;

  useEffect(()=>{
    let alive=true;
    setLoading(true);setError('');
    void loadLockedCut().then(result=>{
      if(!alive)return;
      setShots(result.shots);setMissing(result.missing);
      setActiveIndex(0);setCurrentSeconds(0);
      setPlaying(false);nextStart.current=0;autoPlay.current=false;
      setLoading(false);
    }).catch(e=>{
      if(alive){setLoading(false);setError(String(e));}
    });
    return()=>{alive=false;};
  },[revision]);

  const jump=useCallback((index:number,localSeconds=0,resume=false)=>{
    const list=itemsRef.current;
    if(!list.length)return;
    const i=Math.max(0,Math.min(list.length-1,index));
    const offset=Math.max(0,Math.min(localSeconds,list[i].durationSeconds-.05));
    nextStart.current=offset;autoPlay.current=resume;
    if(i===activeIndex&&player.current){
      player.current.currentTime=offset;
      setCurrentSeconds(offset);
      if(resume)void player.current.play().catch(()=>setPlaying(false));
      else {player.current.pause();setPlaying(false);}
    }else{
      setActiveIndex(i);setCurrentSeconds(offset);
      setPlaying(false);
    }
  },[activeIndex]);

  const playPause=()=>{
    if(!player.current)return;
    if(player.current.paused){
      void player.current.play().then(()=>setPlaying(true))
        .catch(()=>{setError('Playback needs a direct Play action in this browser.');setPlaying(false);});
    }else{player.current.pause();setPlaying(false);}
  };
  const seek=(seconds:number)=>{
    if(!shots.length)return;
    const position=locateCutTime(shots,seconds);
    jump(position.index,position.localSeconds,playing);
  };
  const ended=()=>{
    const next=shots[activeIndex+1];
    if(next&&active&&actualShotOrderIsContinuous(active.shotKey,next.shotKey))
      jump(activeIndex+1,0,true);
    else {
      setPlaying(false);
      setCurrentSeconds(active?.durationSeconds??0);
      if(next&&active)setError('Missing a video between '+active.shotKey+
        ' and '+next.shotKey+'. Playback stopped; no fictional seamless cut.');
    }
  };

  return <section id="ep002-locked-cut" className="library-section"
    aria-label="EP002 director review room continuous video comparison">
    <div className="library-section-title">
      <Film size={20}/><h2>Director Review Room — SHOT01–11 continuity</h2>
    </div>
    <p>Watch the Director-locked SHOT01–11 videos in their original order.
      SHOT01 is pinned to the newly Director-approved 1920×1080, 1172-frame V2 MP4;
      SHOT02–11 retain their individually verified original Full HD files.
      SHOT11 is pinned to its Director-approved 1572-frame recording
      with the large amber finale “NEXT: MULTIPLE DATABASE INSTANCES.”
      All are pinned to their final Director-approved render IDs. Only the
      separately confirmed Full Episode Master action can start billable CPU.</p>
    <Ep002V4CleanCutDirectorPanel/>
    <Ep002V3ContinuityDirectorPanel/>
    <Ep002V2DirectorMasterPanel/>
    <Ep002FullMasterPanel/>
    <div className="locked-cut-room">
      <div className="locked-cut-toolbar">
        <strong><ShieldCheck size={17}/> EP002 · Director-locked MP4 sequence</strong>
        <span>{loading?'Checking stored MP4 files…':
          shots.length+' / '+LOCKED_CUT_SHOT_ORDER.length+' available'}</span>
        <button type="button" className="library-voice-refresh"
          onClick={()=>setRevision(n=>n+1)} disabled={loading}>
          <RotateCcw size={15}/> Refresh
        </button>
      </div>
      {error&&<p role="alert" className="library-voice-error">{error}</p>}
      {loading?<p className="library-note">Checking actual video records…</p>:
      shots.length===0?<p role="alert" className="library-warning">
        No approved MP4 is available from storage. Nothing has been simulated or recreated.
      </p>:<>
        <div className="locked-cut-screen">
          <video key={active.renderId} ref={player} controls playsInline
            preload="auto" src={active.videoUrl}
            aria-label={'Locked EP002 '+active.shotKey+' video'}
            onLoadedMetadata={()=>{
              const video=player.current;
              if(!video)return;
              video.currentTime=nextStart.current;
              if(autoPlay.current){
                autoPlay.current=false;
                void video.play().then(()=>setPlaying(true))
                  .catch(()=>{setPlaying(false);setError('Press Play to continue the next SHOT.');});
              }
            }}
            onTimeUpdate={e=>setCurrentSeconds(e.currentTarget.currentTime)}
            onPlay={()=>setPlaying(true)}
            onPause={()=>setPlaying(false)}
            onEnded={ended}
            onError={()=>{setError('Media playback failed for '+active.shotKey+
              '. The original MP4 may no longer be available.');setPlaying(false);}}
          />
          <div className="locked-cut-now">
            <b>{active.shotKey}</b><span>{active.title}
              {' · '}{active.source==='LIVE_DIRECTOR_REVIEW_CANDIDATE'
                ?'STORED REVIEW SNAPSHOT · NOT LOCKED':'LOCKED REFERENCE'}</span>
          </div>
        </div>
        <div className="locked-cut-controls">
          <button type="button" aria-label="Previous SHOT"
            disabled={activeIndex===0}
            onClick={()=>jump(activeIndex-1,0,playing)}>
            <ChevronLeft size={18}/>
          </button>
          <button type="button" className="locked-cut-play"
            aria-label={playing?'Pause locked sequence':'Play locked sequence'}
            onClick={playPause}>
            {playing?<Pause size={20}/>:<Play size={20}/>}
            {playing?'Pause':'Play all'}
          </button>
          <button type="button" aria-label="Next SHOT"
            disabled={activeIndex===shots.length-1}
            onClick={()=>jump(activeIndex+1,0,playing)}>
            <ChevronRight size={18}/>
          </button>
          <span className="locked-cut-clock">{displayTime(absoluteSeconds)} / {displayTime(duration)}</span>
        </div>
        <input type="range" className="locked-cut-progress"
          aria-label="Seek within the continuous locked sequence"
          min={0} max={Math.max(duration,.1)} step={.05}
          value={Math.max(0,Math.min(duration,absoluteSeconds))}
          onChange={e=>seek(Number(e.target.value))}/>
        <div className="library-episode-batch-actions" role="group"
          aria-label="Review transitions between real SHOT videos">
          {DIRECTOR_REVIEW_BOUNDARIES.map(boundary=>{
            const from=shots.findIndex(s=>s.shotKey===boundary.from);
            const to=shots.findIndex(s=>s.shotKey===boundary.to);
            const available=from>=0&&to===from+1;
            return <button key={boundary.from} type="button"
              className="library-voice-refresh"
              disabled={!available}
              title={available?'Play final 8 seconds of '+boundary.from+
                ' then continue into '+boundary.to:'Both adjacent MP4s must be stored'}
              onClick={()=>available&&jump(from,
                Math.max(0,shots[from].durationSeconds-8),true)}>
              <Film size={14}/>{boundary.label}
            </button>;
          })}
        </div>
        <div className="locked-cut-chapters" role="group"
          aria-label="Jump to locked shot">
          {shots.map((shot,index)=><button type="button" key={shot.renderId}
            className={index===activeIndex?'active':''}
            aria-pressed={index===activeIndex}
            onClick={()=>jump(index,0,playing)}>
            <b>{shot.shotKey}</b><span>{displayTime(shot.durationSeconds)}
              {' · '}{shot.source==='LIVE_DIRECTOR_REVIEW_CANDIDATE'
                ?'REVIEW':'LOCKED'}</span>
          </button>)}
        </div>
      </>}
      {missing.length>0&&<div className="locked-cut-missing" role="status">
        <strong>Not included: matching approved MP4 not confirmed</strong>
        {missing.map(item=><p key={item}>{item}</p>)}
      </div>}
      <p className="library-note">SHOT01 is pinned to the Director-approved
        V2 MP4 8f46fafd-9613-4375-bce2-ea98854e8b20
        (1172 frames, 1920×1080, 30 fps). The previous locked V3 MP4
        447f2846-3d1d-4d6c-924c-ea3918520625
        (980 frames, 1280×720, 30 fps) remains stored as an immutable
        historical reference; it is never deleted or replaced in storage.
        SHOT02–06 retain their protected original references. SHOT07 is pinned to its Director-approved V3 render
        b2a335dd-cb71-48f2-bf47-0f8bdcdd969d (2674 frames, 1920×1080, 30 fps).
        SHOT08 is pinned to its Director-approved final render
        3415073a-5906-489d-bb69-6af7446c2c9b (2314 frames, 1920×1080, 30 fps).
        SHOT09 is pinned to d4b6c8ff-10c5-4181-aa59-fcd16a4470ba
        (3063 frames). SHOT10 is pinned to 2034d8c6-99b2-46a5-9469-bf3df325d6c0
        (2360 frames, SHA a4d9fe5d1dcec033f36ce68a190160fd8077faea).
        SHOT11 is pinned to its Director-approved final MP4
        73ec0e6f-d348-4518-a32b-573bf89a8ab5
        (1572 frames, SHA e08f4ed554dbe1d208939422b5282be9437ced9c).
        Earlier SHOT07–SHOT11 renders are never substituted.
        The boundary shortcuts start eight seconds before each cut. The player
        switches between original stored MP4s; it is not a frame-perfect
        exported master and may briefly buffer at a boundary.
        Missing adjacent files are never silently skipped.</p>
    </div>
  </section>;
}
