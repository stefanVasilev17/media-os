import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,Film,Pause,Play,RotateCcw,ShieldCheck} from 'lucide-react';

type LockedShot={
  shotKey:string;
  title:string;
  renderId:string;
  videoUrl:string;
  durationSeconds:number;
  source:'PINNED_DIRECTOR_LOCK'|'SHOT01_CURRENT_LOCKED_PREVIEW'|'LIVE_DIRECTOR_REVIEW_CANDIDATE';
};
type RenderEvidence={
  status?:string;renderId?:string;videoUrl?:string|null;
  durationInFrames?:number;fps?:number;width?:number;height?:number;
  compositionId?:string;
};
type LockedReference={shotKey:string;title:string;renderId:string;compositionId:string};

const RENDER='/api/v1/remotion/renders/';
const CURRENT_SHOT01='/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview';
const LIVE_REVIEW_SHOTS:readonly {shotKey:string;title:string;compositionId:string}[]=[
  {shotKey:'SHOT06',title:'The Deadline Expires — current review render',
    compositionId:'EP002-SHOT06-CANDIDATE'},
  {shotKey:'SHOT07',title:'When Retrying Creates More Failure — current review render',
    compositionId:'EP002-SHOT07-CANDIDATE'},
  {shotKey:'SHOT08',title:'Stop the Retry Storm — recovery review render',
    compositionId:'EP002-SHOT08-CANDIDATE'},
];
const REFERENCES:readonly LockedReference[]=[
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
];

export const LOCKED_CUT_SHOT_ORDER=Object.freeze([
  'SHOT01',...REFERENCES.map(x=>x.shotKey),...LIVE_REVIEW_SHOTS.map(x=>x.shotKey),
]);
export const DIRECTOR_REVIEW_BOUNDARIES=Object.freeze([
  {from:'SHOT05',to:'SHOT06',label:'Review 05 → 06'},
  {from:'SHOT06',to:'SHOT07',label:'Review 06 → 07'},
  {from:'SHOT07',to:'SHOT08',label:'Review 07 → 08'},
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

function playable(evidence:RenderEvidence,expectedId:string,expectedComposition:string){
  if(evidence.renderId!==expectedId
    ||evidence.compositionId!==expectedComposition
    ||evidence.status!=='READY'
    ||evidence.width!==1920||evidence.height!==1080
    ||evidence.fps!==30||!Number.isInteger(evidence.durationInFrames)
    ||(evidence.durationInFrames??0)<150
    ||evidence.videoUrl!==RENDER+expectedId+'/video')
    throw Error('Pinned 1080p/30fps approved MP4 evidence unavailable');
  return (evidence.durationInFrames as number)/30;
}

export async function loadLockedCut():Promise<{
  shots:LockedShot[];missing:string[];
}>{
  const entries=await Promise.all(REFERENCES.map(async ref=>{
    try{
      const info=await getRender(ref.renderId);
      const durationSeconds=playable(info,ref.renderId,ref.compositionId);
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
  try{
    const response=await fetch(CURRENT_SHOT01,{cache:'no-store'});
    if(!response.ok)throw Error('SHOT01 preview HTTP '+response.status);
    const preview=await response.json() as RenderEvidence;
    if(!preview.renderId)throw Error('No current protected preview render ID');
    const evidence=await getRender(preview.renderId);
    const durationSeconds=playable(evidence,preview.renderId,'EP002-SHOT01-DRAFT');
    shots.push({shotKey:'SHOT01',title:'What Happens When You Click Login?',
      renderId:preview.renderId,videoUrl:RENDER+preview.renderId+'/video',
      durationSeconds,source:'SHOT01_CURRENT_LOCKED_PREVIEW'});
  }catch(e){
    missing.push('SHOT01: '+String(e instanceof Error?e.message:e));
  }
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
      <Film size={20}/><h2>Director Review Room — SHOT01–08 continuity</h2>
    </div>
    <p>Watch the original Director-locked SHOT01–05 MP4s followed by the latest
      successful stored SHOT06, SHOT07 and SHOT08 review candidates. Compare the endings and
      beginnings without generating another video. A playable candidate is not
      Director Visual LOCK. This room starts no paid TTS, CPU render or export.</p>
    <div className="locked-cut-room">
      <div className="locked-cut-toolbar">
        <strong><ShieldCheck size={17}/> EP002 · Original locks + live review candidates</strong>
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
        <strong>Not included: current matching stored MP4 not confirmed</strong>
        {missing.map(item=><p key={item}>{item}</p>)}
      </div>}
      <p className="library-note">SHOT01–05 are pinned protected references.
        SHOT06–08 load their latest real completed stored Full HD MP4,
        even if a later episode source revision changed the selected fingerprint.
        These are historical review snapshots, not automatically current or locked.
        The boundary shortcuts start eight seconds before each cut. The player
        switches between original stored MP4s; it is not a frame-perfect
        exported master and may briefly buffer at a boundary.
        Missing adjacent files are never silently skipped.</p>
    </div>
  </section>;
}
