// Architectural Thinking Tier++ machine-verifiable render quality gate.
// The cinematic judgment itself requires the Director to watch the actual MP4.
export const AT_TIER_PLUS_PLUS_STANDARD_ID='AT_TIER_PLUS_PLUS_V1';

const PINNED_SHA=/^[a-f0-9]{40}$/;
const SHOT_TWO='EP002-SHOT02-CANDIDATE';

export function isTierPlusPlusShot(compositionId){
  return compositionId===SHOT_TWO
    ||compositionId==='AT-FACTORY-SHOT'
    ||/^EP[0-9]{3}-SHOT[0-9]{2}(?:-|$)/.test(String(compositionId||''))
       && compositionId!=='EP002-SHOT01-DRAFT';
}

const reject=(reason)=>{throw Error('AT_TIER_PLUS_PLUS_PRECHECK_FAILED_'+reason);};
const integer=(v)=>Number.isInteger(v);

export function preflightTierPlusPlusRender(job,sourceSha){
  if(!isTierPlusPlusShot(job?.compositionId))return null;
  const props=job?.inputProps;
  if(!props||typeof props!=='object'||Array.isArray(props))
    reject('INPUT_PROPS_MISSING');
  if(!PINNED_SHA.test(String(sourceSha||''))
    ||props.expectedSourceCommit!==sourceSha)
    reject('WORKER_SHA_NOT_PINNED');
  if(Number(job.width)!==1920||Number(job.height)!==1080
    ||Number(job.fps)!==30)
    reject('REQUIRES_1920X1080_30FPS');
  if(!integer(Number(job.durationInFrames))||Number(job.durationInFrames)<6)
    reject('FRAME_COUNT_INVALID');

  const checks=[
    'EXACT_PINNED_SOURCE_SHA',
    'FULL_HD_1920X1080',
    'FPS_30',
    'POSITIVE_INTEGER_FRAME_COUNT',
  ];

  if(job.compositionId===SHOT_TWO){
    const voiceFrames=Number(props.sourceDurationInFrames);
    const hold=Number(props.postVoiceHoldFrames);
    const take=String(props.voiceTakeId||'');
    const beats=props.verifiedCues;
    const terms=props.termCues;
    if(!integer(voiceFrames)||voiceFrames<6
      ||hold!==60||voiceFrames+hold!==Number(job.durationInFrames)
      ||Number(props.durationInFrames)!==Number(job.durationInFrames))
      reject('SHOT02_SELECTED_VOICE_AND_60_FRAME_HOLD');
    if(!/^[a-f0-9-]{36}$/i.test(take)
      ||props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS')
      reject('SHOT02_SELECTED_VOICE_PROVENANCE');
    if(!Array.isArray(beats)||beats.length!==5
      ||!Array.isArray(terms)||terms.length!==7)
      reject('SHOT02_REAL_SPOKEN_CUES');
    let last=0;
    for(let i=0;i<5;i++){
      const b=beats[i];
      if(!b||b.beatNumber!==i+1
        ||!integer(b.startFrame)||!integer(b.endFrame)
        ||b.startFrame!==last||b.endFrame<=b.startFrame
        ||b.endFrame>voiceFrames||!String(b.spokenAnchor||'').trim())
        reject('SHOT02_BEAT_TIMELINE');
      last=b.endFrame;
    }
    if(last!==voiceFrames)reject('SHOT02_BEATS_NOT_COVERING_VOICE');
    const ids=['LOGIN_REQUEST','API_GATEWAY','LOAD_BALANCER',
      'AUTH_SERVERS','ARRIVAL_RATE','AUTH_SERVERS_REPRISE','USER_DATABASE'];
    for(let i=0;i<ids.length;i++){
      const term=terms[i];
      if(term?.id!==ids[i]||!integer(term.startFrame)
        ||!integer(term.endFrame)||term.startFrame<0
        ||term.endFrame<=term.startFrame||term.endFrame>voiceFrames)
        reject('SHOT02_SPOKEN_TERM_TIMELINE');
    }
    checks.push('SELECTED_VOICE_IMMUTABLE','FIVE_VERIFIED_BEATS',
      'SEVEN_REAL_TERM_CUES','EXACTLY_60_POST_VOICE_FRAMES');
  }

  return {
    standardId:AT_TIER_PLUS_PLUS_STANDARD_ID,
    status:'TECHNICAL_PRECHECK_PASS',
    compositionId:job.compositionId,
    renderId:String(job.renderId||''),
    expectedSourceCommit:sourceSha,
    outputFormat:'1920x1080@30fps',
    durationInFrames:Number(job.durationInFrames),
    checks,
    visualStatus:'VISUAL_DIRECTOR_REVIEW_REQUIRED',
  };
}

export function verifyTierPlusPlusMedia(job,probe){
  if(!isTierPlusPlusShot(job?.compositionId))return null;
  if(!probe||probe.width!==Number(job.width)
    ||probe.height!==Number(job.height)
    ||!Number.isFinite(probe.duration)
    ||Math.abs(probe.duration-Number(job.durationInFrames)/30)>.75)
    throw Error('AT_TIER_PLUS_PLUS_MP4_MEDIA_MISMATCH');
  return {
    standardId:AT_TIER_PLUS_PLUS_STANDARD_ID,
    status:'ACTUAL_MP4_TECHNICAL_QA_PASS',
    renderId:String(job.renderId||''),
    outputFormat:'1920x1080@30fps_H264_AAC',
    measuredSeconds:Number(probe.duration.toFixed(3)),
    visualStatus:'VISUAL_DIRECTOR_REVIEW_REQUIRED',
  };
}

export function tierPlusPlusReceipt(prefix,receipt){
  return prefix+' '+JSON.stringify(receipt);
}
