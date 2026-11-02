export type Ep002ProductionContract={
  contractVersion:'EPISODE_SHOT_PRODUCTION_V1';
  episodeKey:'EP002';
  shotKey:string;
  readOnly:true;
  status:'WAITING_FOR_PREFERRED_VOICE'|'WAITING_FOR_MEASURED_DURATION'|
    'READY_FOR_REMOTION_SCENE_CONTRACT'|'READY_WITH_CUE_REVIEW';
  script:{
    revision:number;sourceRevision:string;narration:string;voiceDirection:string;
    sha256:string;origin:'APPROVED_ORIGINAL'|'CREATIVE_SAVED_REVISION';sourceUnchanged:boolean;
  };
  voice:{
    preferredTakeId:string|null;takeNumber:number|null;sourceScriptRevision:number|null;
    modelId:string|null;voiceId:string|null;audioUrl:string|null;
    durationSeconds:number|null;
    cueTimings:Array<{number:number;anchor:string;startSeconds:number;endSeconds:number;startFrame:number;endFrame:number}>;
    alignmentAuthority:'NOT_AVAILABLE'|'ELEVENLABS_CHARACTER_TIMESTAMPS';
    durationAuthority:'NO_PREFERRED_TAKE'|'MEASUREMENT_UNAVAILABLE'|'FFPROBE_MEASURED';
    status:'NO_PREFERRED_TAKE'|'PREFERRED_TAKE_SELECTED';
  };
  visual:{
    version:string;sourceGitBlobSha:string;approval:string;
    editorialWindow:string;editorialDurationSeconds:number;
    beatTimingAuthority:'EDITORIAL_ONLY_NOT_AUDIO_ALIGNED'|'ELEVENLABS_CHARACTER_TIMESTAMPS';
    cueReviewStatus:'SOURCE_TEXT_UNCHANGED'|'REVIEW_AFTER_NARRATION_EDIT';
    beats:Array<{number:number;direction:string}>;
    visualGoal:string;cameraDirection:string;assetDirection:string;
    truthContinuity:string;transition:string;
  };
  dependencies:{
    scriptRevision:number;narrationSha256:string;preferredTakeId:string|null;
    visualSourceSha:string;dependencySha256:string|null;renderReusable:boolean;
  };
  render:{
    status:'NOT_RENDERED'|'QUEUED'|'RENDERING'|'SUCCEEDED'|'FAILED';
    renderId:string|null;commitSha:string|null;createdAt?:string;
  };
};

export async function getEp002ProductionContract(shotKey:string):Promise<Ep002ProductionContract>{
  const response=await fetch(
    '/api/v1/creative/episodes/EP002/shots/'+encodeURIComponent(shotKey)+'/production-contract',
    {cache:'no-store'}
  );
  if(!response.ok)throw new Error('MediaOS production contract unavailable (HTTP '+response.status+').');
  return response.json() as Promise<Ep002ProductionContract>;
}
