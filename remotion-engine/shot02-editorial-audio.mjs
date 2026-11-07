const FPS=30;
const SAMPLE_RATE=48000;
const SAMPLES_PER_FRAME=SAMPLE_RATE/FPS;
export const EDITORIAL_TIMING_MODE='ELEVENLABS_REAL_TIMESTAMPS_PLUS_EDITORIAL_SILENCE_V1';
const BREAKS=[
  ['before the seats are gone',60],
  ['the number of people arriving has',48],
  ['the platform s entry point',66],
  ['across several Auth servers',81],
  ['at first answers return quickly',30],
  ['entering the system each second',81],
  ['the Auth servers share the traffic',33],
  ['the same User Database',90],
  ['where the pressure starts',48],
];

export function validateShot02EditorialPlan(job,props){
  if(job.compositionId!=='EP002-SHOT02-CANDIDATE'
      ||props.timingMode!==EDITORIAL_TIMING_MODE)return null;
  if(job.fps!==FPS||!Number.isInteger(job.durationInFrames)
      ||!Number.isInteger(props.sourceDurationInFrames)
      ||props.sourceDurationInFrames<6
      ||!Array.isArray(props.editorialSilencePlan)
      ||props.editorialSilencePlan.length!==BREAKS.length)
    throw Error('SHOT02_EDITORIAL_AUDIO_PLAN_INVALID');
  let previous=-1,inserted=0;
  const pauses=props.editorialSilencePlan.map((entry,i)=>{
    const at=entry?.atFrame,hold=entry?.holdFrames;
    if(!Number.isInteger(at)||!Number.isInteger(hold)
        ||at<=previous||at>props.sourceDurationInFrames
        ||(at===props.sourceDurationInFrames&&i!==BREAKS.length-1)
        ||at-previous<9
        ||entry?.afterPhrase!==BREAKS[i][0]||hold!==BREAKS[i][1])
      throw Error('SHOT02_EDITORIAL_SILENCE_NOT_APPROVED_OR_ORDERED');
    previous=at;inserted+=hold;
    return {atFrame:at,holdFrames:hold,afterPhrase:entry.afterPhrase};
  });
  if(job.durationInFrames!==props.sourceDurationInFrames+inserted
      ||props.editorialAddedFrames!==inserted
      ||props.verifiedCues?.length!==5||props.termCues?.length!==7)
    throw Error('SHOT02_EDITORIAL_AUDIO_DURATION_OR_CUES_MISMATCH');
  return {sourceFrames:props.sourceDurationInFrames,
    outputFrames:job.durationInFrames,addedFrames:inserted,pauses};
}

export function buildShot02EditorialAudioFilter(plan){
  if(!plan||!Array.isArray(plan.pauses)||plan.pauses.length!==BREAKS.length)
    throw Error('SHOT02_EDITORIAL_FFMPEG_PLAN_MISSING');
  const cuts=[0,...plan.pauses.map(p=>p.atFrame)];
  if(cuts.at(-1)<plan.sourceFrames)cuts.push(plan.sourceFrames);
  const labels=cuts.slice(0,-1).map((_,i)=>'part'+i);
  const graph=[
    '[1:a]aresample='+SAMPLE_RATE+
      ',aformat=sample_fmts=fltp:sample_rates='+SAMPLE_RATE+
      ':channel_layouts=stereo,asplit='+labels.length+
      labels.map(l=>'[source'+l+']').join(''),
  ];
  const chain=[];
  for(let i=0;i<labels.length;i++){
    graph.push('[source'+labels[i]+']atrim=start_sample='+
      cuts[i]*SAMPLES_PER_FRAME+':end_sample='+
      cuts[i+1]*SAMPLES_PER_FRAME+
      ',asetpts=PTS-STARTPTS['+labels[i]+']');
    chain.push('['+labels[i]+']');
    if(i<plan.pauses.length){
      graph.push('anullsrc=r='+SAMPLE_RATE+':cl=stereo,atrim=end_sample='+
        plan.pauses[i].holdFrames*SAMPLES_PER_FRAME+
        ',asetpts=PTS-STARTPTS[silence'+i+']');
      chain.push('[silence'+i+']');
    }
  }
  graph.push(chain.join('')+'concat=n='+chain.length+
    ':v=0:a=1,apad=whole_dur='+(plan.outputFrames/FPS)+'[editorial]');
  return graph.join(';');
}
