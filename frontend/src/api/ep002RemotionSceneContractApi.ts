export type Ep002SceneContract={
  schemaVersion:'REMOTION_SCENE_V1';
  episodeKey:'EP002';
  shotKey:'SHOT01';
  contractId:string;
  codeGenerationPolicy:'REVIEWED_SOURCE_CHANGES_ONLY_NO_AUTO_EXECUTION';
  video:{
    width:1920;height:1080;fps:30;colorSpace:'REC709';
    durationInFrames:number|null;durationAuthority:'UNMEASURED'|'MEASURED_AUDIO_CEIL_TO_FRAME';
    compositionId:'EP002-SHOT01-DRAFT';registeredInRemotion:false;
  };
  inputs:{
    scriptRevision:number;narrationSha256:string;preferredTakeId:string|null;
    audioUrl:string|null;measuredDurationSeconds:number|null;
    approvedVisualGitBlobSha:string;productionDependencySha256:string|null;
  };
  assets:Array<{
    key:string;usage:'REUSE_REFERENCE'|'NEW_PROPOSAL';resolution:'UNVERIFIED';
  }>;
  beats:Array<{
    number:number;approvedDirection:string;cueAnchor:string;
    cueStatus:'EDITORIAL_ONLY_UNALIGNED';
    cameraIntent:string;operations:string[];assetKeys:string[];
    startFrame:null;endFrame:null;
  }>;
  cameraDirection:string;continuityGuardrails:string;endingTransition:string;
  cueTimingAuthority:'EDITORIAL_CUES_ONLY_NO_FRAME_ALIGNMENT';
  readiness:{
    status:'BLOCKED'|'READY_FOR_CODE_GENERATION';
    blockers:string[];
    cueAlignmentRequired:true;canSubmitRender:false;
  };
};

export async function getEp002RemotionSceneContract():Promise<Ep002SceneContract>{
  const response=await fetch(
    '/api/v1/creative/episodes/EP002/shots/SHOT01/remotion-scene-contract',
    {cache:'no-store'}
  );
  if(!response.ok)throw new Error('Remotion scene contract unavailable (HTTP '+response.status+').');
  return response.json() as Promise<Ep002SceneContract>;
}
