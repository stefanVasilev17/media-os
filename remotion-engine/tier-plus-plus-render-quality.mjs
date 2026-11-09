// Architectural Thinking Tier++ machine-verifiable render quality gate.
// The cinematic judgment itself requires the Director to watch the actual MP4.
export const AT_TIER_PLUS_PLUS_STANDARD_ID='AT_TIER_PLUS_PLUS_V1';

const PINNED_SHA=/^[a-f0-9]{40}$/;
const SHOT_TWO='EP002-SHOT02-CANDIDATE';
const SHOT_THREE='EP002-SHOT03-CANDIDATE';

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
    const hold=props.postVoiceHoldFrames==null
      ?0:Number(props.postVoiceHoldFrames);
    const mode=props.timingMode;
    const videoFrames=Number(job.durationInFrames);
    const voiceFrames=hold===60?Number(props.sourceDurationInFrames):videoFrames;
    const declaredSource=props.sourceDurationInFrames==null
      ?videoFrames-hold:Number(props.sourceDurationInFrames);
    const take=String(props.voiceTakeId||'');
    const beats=props.verifiedCues;
    const terms=props.termCues;
    if(!integer(voiceFrames)||voiceFrames<6||![0,60].includes(hold)
      ||Number(props.durationInFrames)!==videoFrames
      ||(hold===60&&(voiceFrames+hold!==videoFrames
        ||mode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'))
      ||(hold===0&&mode==='ELEVENLABS_CHARACTER_TIMESTAMPS'
        &&declaredSource!==videoFrames))
      reject('SHOT02_SELECTED_VOICE_FRAME_CONTRACT');
    if(!/^[a-f0-9-]{36}$/i.test(take)
      ||!['ELEVENLABS_CHARACTER_TIMESTAMPS',
           'ELEVENLABS_REAL_TIMESTAMPS_PLUS_EDITORIAL_SILENCE_V1'].includes(mode))
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
      'SEVEN_REAL_TERM_CUES');
    if(hold===60)checks.push('EXACTLY_60_POST_VOICE_FRAMES');
  }

  if(job.compositionId===SHOT_THREE){
    const frames=Number(job.durationInFrames);
    const beats=props.verifiedCues;
    const terms=props.termCues;
    const expected=['USER_DATABASE','FIVE_HUNDRED','THROUGHPUT',
      'SIX_FIFTY','NINE_HUNDRED','ARRIVAL_RATE','UNFINISHED_WORK',
      'BOTTLENECK','SATURATION','LATENCY','STILL_WORKING'];
    if(props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
       ||Number(props.durationInFrames)!==frames
       ||Number(props.postVoiceHoldFrames||0)!==0
       ||!/^EP002_SHOT03$/.test(String(props.shotKey||''))
       ||!/^[a-f0-9-]{36}$/i.test(String(props.voiceTakeId||''))
       ||!integer(props.scriptRevision)||props.scriptRevision<1
       ||!String(props.inputFingerprint||'').match(/^[a-f0-9]{64}$/)
       ||!Array.isArray(beats)||beats.length!==5
       ||!Array.isArray(terms)||terms.length!==11)
      reject('SHOT03_SELECTED_REAL_VOICE_CUE_CONTRACT');
    let previousEnd=-1;
    for(let i=0;i<5;i++){
      const beat=beats[i];
      if(beat?.beatNumber!==i+1||!integer(beat.startFrame)
        ||!integer(beat.endFrame)||beat.startFrame<0
        ||beat.endFrame<=beat.startFrame||beat.endFrame>frames
        ||!String(beat.spokenAnchor||'').trim()
        ||(i>0&&beat.startFrame!==beats[i-1].endFrame))
        reject('SHOT03_DIRECTOR_BEAT_SEQUENCE_INVALID');
    }
    if(beats.at(-1).endFrame!==frames)
      reject('SHOT03_REAL_AUDIO_FRAMES_NOT_COVERED');
    for(let i=0;i<expected.length;i++){
      const term=terms[i];
      if(term?.id!==expected[i]||!integer(term.startFrame)
        ||!integer(term.endFrame)||term.startFrame<0
        ||term.endFrame<=term.startFrame||term.endFrame>frames
        ||!String(term.spokenAnchor||'').trim()
        ||(i>0&&term.startFrame<previousEnd))
        reject('SHOT03_REAL_TERM_SEQUENCE_INVALID');
      previousEnd=term.endFrame;
    }
    if(terms[1].startFrame<beats[0].startFrame
       ||terms[1].startFrame>=beats[0].endFrame
       ||terms[3].startFrame<beats[1].startFrame
       ||terms[4].startFrame>=beats[1].endFrame
       ||terms[5].startFrame<beats[2].startFrame
       ||terms[5].startFrame>=beats[2].endFrame
       ||terms[6].startFrame<beats[3].startFrame
       ||terms[6].startFrame>=beats[3].endFrame
       ||terms[7].startFrame<beats[4].startFrame
       ||terms[7].startFrame>=beats[4].endFrame)
      reject('SHOT03_TERMS_BEATS_DISAGREE');
    checks.push('SHOT03_CURRENT_DIRECTOR_APPROVED_TAKE',
      'FIVE_REAL_VERIFIED_BEATS','ELEVEN_REAL_TECHNICAL_TERMS',
      'EXACT_AUDIO_FRAME_COUNT','NO_UNAPPROVED_EDITORIAL_SILENCE');
  }


  if(job.compositionId==='EP002-SHOT04-CANDIDATE'){
    const frames=Number(job.durationInFrames);
    const beats=props.verifiedCues,terms=props.termCues;
    const expected=['USER_DATABASE','HEALTH_CHECKS','LIVENESS_PROBE',
      'READINESS_PROBE','REAL_LOGIN','SERVICE_AVAILABILITY',
      'END_TO_END_CHECK','SPINNER','ALIVE_NOT_AVAILABLE'];
    if(props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
      ||Number(props.durationInFrames)!==frames
      ||Number(props.postVoiceHoldFrames||0)!==0
      ||props.shotKey!=='EP002_SHOT04'
      ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(String(props.voiceTakeId||''))
      ||!integer(props.scriptRevision)||props.scriptRevision<1
      ||!/^[a-f0-9]{64}$/i.test(String(props.inputFingerprint||''))
      ||!Array.isArray(beats)||beats.length!==5
      ||!Array.isArray(terms)||terms.length!==expected.length)
      reject('SHOT04_SELECTED_REAL_VOICE_CUE_CONTRACT');
    let previous=0;
    for(let i=0;i<beats.length;i++){
      const b=beats[i];
      if(b?.beatNumber!==i+1||!integer(b.startFrame)
        ||!integer(b.endFrame)||(i>0&&b.startFrame!==previous)
        ||b.endFrame<=b.startFrame||b.endFrame>frames
        ||!String(b.spokenAnchor||'').trim())
        reject('SHOT04_DIRECTOR_BEAT_SEQUENCE_INVALID');
      previous=b.endFrame;
    }
    if(previous!==frames)reject('SHOT04_REAL_AUDIO_FRAMES_NOT_COVERED');
    previous=-1;
    for(let i=0;i<expected.length;i++){
      const t=terms[i];
      if(t?.id!==expected[i]||!integer(t.startFrame)
        ||!integer(t.endFrame)||t.startFrame<0
        ||t.endFrame<=t.startFrame||t.endFrame>frames
        ||t.startFrame<previous||!String(t.spokenAnchor||'').trim())
        reject('SHOT04_REAL_SPOKEN_TERMS_INVALID');
      previous=t.endFrame;
    }
    checks.push('SHOT04_CURRENT_DIRECTOR_APPROVED_TAKE',
      'FIVE_REAL_VERIFIED_BEATS','NINE_REAL_TECHNICAL_TERMS',
      'EXACT_AUDIO_FRAME_COUNT','NO_UNAPPROVED_EDITORIAL_SILENCE');
  }

  if(job.compositionId==='EP002-SHOT05-CANDIDATE'){
    const frames=Number(job.durationInFrames);
    const beats=props.verifiedCues,terms=props.termCues;
    const expected=['CONNECTION_POOL','BORROWS_ONE','EIGHT_MAX','REPLAY',
      'ONE_BUSY','FIVE_BUSY','SEVEN_BUSY','EIGHT_BUSY','POOL_EXHAUSTION',
      'ANOTHER_LOGIN','WAIT_FOR_CONNECTION','REQUEST_QUEUEING',
      'IN_FLIGHT','SPINNER','TIME_RUNNING_OUT'];
    if(props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
      ||Number(props.durationInFrames)!==frames
      ||Number(props.postVoiceHoldFrames||0)!==0
      ||props.shotKey!=='EP002_SHOT05'
      ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(String(props.voiceTakeId||''))
      ||!integer(props.scriptRevision)||props.scriptRevision<1
      ||!/^[a-f0-9]{64}$/i.test(String(props.inputFingerprint||''))
      ||!Array.isArray(beats)||beats.length!==5
      ||!Array.isArray(terms)||terms.length!==expected.length)
      reject('SHOT05_SELECTED_REAL_VOICE_CUE_CONTRACT');
    let previous=0;
    for(let i=0;i<beats.length;i++){
      const b=beats[i];
      if(b?.beatNumber!==i+1||!integer(b.startFrame)
        ||!integer(b.endFrame)||(i>0&&b.startFrame!==previous)
        ||b.endFrame<=b.startFrame||b.endFrame>frames
        ||!String(b.spokenAnchor||'').trim())
        reject('SHOT05_DIRECTOR_BEAT_SEQUENCE_INVALID');
      previous=b.endFrame;
    }
    if(previous!==frames)reject('SHOT05_REAL_AUDIO_FRAMES_NOT_COVERED');
    previous=-1;
    for(let i=0;i<expected.length;i++){
      const t=terms[i];
      if(t?.id!==expected[i]||!integer(t.startFrame)
        ||!integer(t.endFrame)||t.startFrame<0
        ||t.endFrame<=t.startFrame||t.endFrame>frames
        ||t.startFrame<previous||!String(t.spokenAnchor||'').trim())
        reject('SHOT05_REAL_SPOKEN_TERMS_INVALID');
      previous=t.endFrame;
    }
    if(!(terms[3].startFrame<terms[4].startFrame &&
      terms[4].startFrame<terms[5].startFrame &&
      terms[5].startFrame<terms[6].startFrame &&
      terms[6].startFrame<terms[7].startFrame &&
      terms[7].startFrame<terms[8].startFrame))
      reject('SHOT05_REPLAY_CAUSAL_TIMELINE_INVALID');
    checks.push('SHOT05_CURRENT_DIRECTOR_APPROVED_TAKE',
      'FIVE_REAL_VERIFIED_BEATS','FIFTEEN_REAL_CONNECTION_POOL_TERMS',
      'EXACT_AUDIO_FRAME_COUNT','NO_UNAPPROVED_EDITORIAL_SILENCE');
  }

  if(job.compositionId==='EP002-SHOT06-CANDIDATE'){
    const frames=Number(job.durationInFrames);
    const beats=props.verifiedCues,terms=props.termCues;
    const expected=['WAIT_FOR_CONNECTION','REQUEST_DEADLINE','CLOCK_CONTINUES',
      'LOOKUP_NOT_STARTED','TIME_RUNS_OUT','REQUEST_TIMEOUT','PHONE_ERROR',
      'SYSTEM_STILL_WORKING','REQUEST_B','LOOKUP_RUNNING','DB_CAPACITY',
      'WAIT_LONGER','CANCELLATION','STOP_IF_POSSIBLE','RESOURCES_FREE'];
    if(props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
      ||Number(props.durationInFrames)!==frames
      ||Number(props.postVoiceHoldFrames||0)!==0
      ||props.shotKey!=='EP002_SHOT06'
      ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(String(props.voiceTakeId||''))
      ||!integer(props.scriptRevision)||props.scriptRevision<1
      ||!/^[a-f0-9]{64}$/i.test(String(props.inputFingerprint||''))
      ||!Array.isArray(beats)||beats.length!==5
      ||!Array.isArray(terms)||terms.length!==expected.length)
      reject('SHOT06_SELECTED_REAL_VOICE_CUE_CONTRACT');
    let previous=0;
    for(let i=0;i<beats.length;i++){
      const b=beats[i];
      if(b?.beatNumber!==i+1||!integer(b.startFrame)
        ||!integer(b.endFrame)||(i>0&&b.startFrame!==previous)
        ||b.endFrame<=b.startFrame||b.endFrame>frames
        ||!String(b.spokenAnchor||'').trim())
        reject('SHOT06_DIRECTOR_BEAT_SEQUENCE_INVALID');
      previous=b.endFrame;
    }
    if(previous!==frames)reject('SHOT06_REAL_AUDIO_FRAMES_NOT_COVERED');
    previous=-1;
    for(let i=0;i<expected.length;i++){
      const t=terms[i];
      if(t?.id!==expected[i]||!integer(t.startFrame)
        ||!integer(t.endFrame)||t.startFrame<0
        ||t.endFrame<=t.startFrame||t.endFrame>frames
        ||t.startFrame<previous||!String(t.spokenAnchor||'').trim())
        reject('SHOT06_REAL_SPOKEN_TERMS_INVALID');
      previous=t.endFrame;
    }
    if(!(terms[1].startFrame<terms[4].startFrame
      &&terms[4].startFrame<terms[6].startFrame
      &&terms[6].startFrame<terms[8].startFrame
      &&terms[8].startFrame<terms[9].startFrame
      &&terms[9].startFrame<terms[12].startFrame
      &&terms[12].startFrame<terms[13].startFrame
      &&terms[13].startFrame<terms[14].startFrame))
      reject('SHOT06_REAL_CAUSAL_SEQUENCE_INVALID');
    checks.push('SHOT06_CURRENT_DIRECTOR_APPROVED_TAKE',
      'FIVE_REAL_VERIFIED_BEATS','FIFTEEN_REAL_DEADLINE_CANCELLATION_TERMS',
      'EXACT_AUDIO_FRAME_COUNT','NO_UNAPPROVED_EDITORIAL_SILENCE');
  }

  if(job.compositionId==='EP002-SHOT07-CANDIDATE'){
    const frames=Number(job.durationInFrames);
    const beats=props.verifiedCues,terms=props.termCues;
    const expected=['OTHER_LOGINS','ACCOUNT_LOOKUP','AUTH_RETRY',
      'RETRY_MECHANISM','TEMPORARY_PROBLEM','DB_OVERLOADED',
      'FIRST_LOOKUP_RUNNING','RETRY_ADDS_WORK','OTHER_AUTH_RETRIES',
      'TRAFFIC_STABLE','ATTEMPTS_GROW','RETRY_AMPLIFICATION','RETRY_STORM',
      'CASCADING_FAILURE','READ_ONLY_LOOKUP'];
    if(props.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
      ||Number(props.durationInFrames)!==frames
      ||Number(props.postVoiceHoldFrames||0)!==0
      ||props.shotKey!=='EP002_SHOT07'
      ||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(String(props.voiceTakeId||''))
      ||!integer(props.scriptRevision)||props.scriptRevision<1
      ||!/^[a-f0-9]{64}$/i.test(String(props.inputFingerprint||''))
      ||!Array.isArray(beats)||beats.length!==5
      ||!Array.isArray(terms)||terms.length!==expected.length)
      reject('SHOT07_SELECTED_REAL_VOICE_CUE_CONTRACT');
    let previous=0;
    for(let i=0;i<beats.length;i++){
      const b=beats[i];
      if(b?.beatNumber!==i+1||!integer(b.startFrame)
        ||!integer(b.endFrame)||(i>0&&b.startFrame!==previous)
        ||b.endFrame<=b.startFrame||b.endFrame>frames
        ||!String(b.spokenAnchor||'').trim())
        reject('SHOT07_DIRECTOR_BEAT_SEQUENCE_INVALID');
      previous=b.endFrame;
    }
    if(previous!==frames)reject('SHOT07_REAL_AUDIO_FRAMES_NOT_COVERED');
    previous=-1;
    for(let i=0;i<expected.length;i++){
      const t=terms[i];
      if(t?.id!==expected[i]||!integer(t.startFrame)
        ||!integer(t.endFrame)||t.startFrame<0
        ||t.endFrame<=t.startFrame||t.endFrame>frames
        ||t.startFrame<previous||!String(t.spokenAnchor||'').trim())
        reject('SHOT07_REAL_SPOKEN_TERMS_INVALID');
      previous=t.endFrame;
    }
    if(!(terms[2].startFrame<terms[6].startFrame
      &&terms[6].startFrame<terms[8].startFrame
      &&terms[8].startFrame<terms[9].startFrame
      &&terms[9].startFrame<terms[10].startFrame
      &&terms[10].startFrame<terms[11].startFrame
      &&terms[11].startFrame<terms[12].startFrame
      &&terms[12].startFrame<terms[13].startFrame
      &&terms[13].startFrame<terms[14].startFrame))
      reject('SHOT07_REAL_RETRY_CAUSAL_SEQUENCE_INVALID');
    checks.push('SHOT07_CURRENT_DIRECTOR_APPROVED_TAKE',
      'FIVE_REAL_VERIFIED_BEATS','FIFTEEN_REAL_RETRY_STORM_TERMS',
      'EXACT_AUDIO_FRAME_COUNT','NO_UNAPPROVED_EDITORIAL_SILENCE');
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
