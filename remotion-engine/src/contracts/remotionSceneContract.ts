import {z} from 'zod';

export const remotionSceneContractSchema=z.object({
  schemaVersion:z.literal('REMOTION_SCENE_V1'),
  episodeKey:z.literal('EP002'),
  shotKey:z.literal('SHOT01'),
  contractId:z.string().regex(/^[a-f0-9]{64}$/),
  codeGenerationPolicy:z.literal('REVIEWED_SOURCE_CHANGES_ONLY_NO_AUTO_EXECUTION'),
  video:z.object({
    width:z.literal(1920),
    height:z.literal(1080),
    fps:z.literal(30),
    colorSpace:z.literal('REC709'),
    durationInFrames:z.number().int().positive().nullable(),
    durationAuthority:z.enum(['UNMEASURED','MEASURED_AUDIO_CEIL_TO_FRAME']),
    compositionId:z.literal('EP002-SHOT01-DRAFT'),
    registeredInRemotion:z.literal(false),
  }).strict(),
  inputs:z.object({
    scriptRevision:z.number().int().nonnegative(),
    narrationSha256:z.string().regex(/^[a-f0-9]{64}$/),
    preferredTakeId:z.string().uuid().nullable(),
    audioUrl:z.string().regex(/^\/api\/v1\/creative\/episodes\/EP002\/shots\/SHOT01\/takes\/[a-f0-9-]{36}\/audio$/).nullable(),
    measuredDurationSeconds:z.number().positive().nullable(),
    approvedVisualGitBlobSha:z.literal('5c43c7fd3bd66b5899f0956a9cfd80bdead834f1'),
    productionDependencySha256:z.string().regex(/^[a-f0-9]{64}$/).nullable()
  }).strict(),
  assets:z.array(z.object({
    key:z.enum(['PHONE_LOGIN','SPINNER','AUTH_NODE','CAMERA_RIG','DIM_LAYER','TIME_RAIL','REWIND_0900']),
    usage:z.enum(['REUSE_REFERENCE','NEW_PROPOSAL']),
    resolution:z.literal('UNVERIFIED')
  }).strict()).length(7),
  beats:z.array(z.object({
    number:z.number().int().min(1).max(5),
    approvedDirection:z.string().min(12),
    cueAnchor:z.string().min(3),
    cueStatus:z.enum(['EDITORIAL_ONLY_UNALIGNED','AUDIO_ALIGNED']),
    cameraIntent:z.enum(['CLOSE_PHONE','HOLD_PHONE','FOCUS_AUTH','RACK_FOCUS_PHONE','PREPARE_REWIND']),
    operations:z.array(z.enum([
      'PHONE_PRESS','SPINNER_WAIT','SHOW_TIME_RAIL','HEALTH_PULSE','SHOW_SHALLOW_PROBES',
      'EMPHASIZE_UNRESOLVED_WAIT','RETRACT_TIME_RAIL','SHOW_NINE_OCLOCK_MARKER'
    ])).min(1),
    assetKeys:z.array(z.string()).min(1),
    startFrame:z.number().int().nonnegative().nullable(),
    endFrame:z.number().int().positive().nullable()
  }).strict()).length(5),
  cameraDirection:z.string().min(10),
  continuityGuardrails:z.string().min(10),
  endingTransition:z.string().min(10),
  cueTimingAuthority:z.enum(['EDITORIAL_CUES_ONLY_NO_FRAME_ALIGNMENT','ELEVENLABS_CHARACTER_TIMESTAMPS']),
  readiness:z.object({
    status:z.enum(['BLOCKED','READY_FOR_CODE_GENERATION']),
    blockers:z.array(z.enum([
      'PREFERRED_VOICE_REQUIRED','MEASURED_AUDIO_DURATION_REQUIRED','NARRATION_CUE_REVIEW_REQUIRED'
    ])),
    cueAlignmentRequired:z.boolean(),
    canSubmitRender:z.literal(false)
  }).strict()
}).strict().superRefine((contract,ctx)=>{
  if(contract.beats.some((beat,index)=>beat.number!==index+1)){
    ctx.addIssue({code:'custom',message:'Approved beat ordering must be consecutive',path:['beats']});
  }
  const audioAligned=contract.cueTimingAuthority==='ELEVENLABS_CHARACTER_TIMESTAMPS';
  if(audioAligned && (contract.readiness.cueAlignmentRequired
      || contract.beats.some((beat,index)=>beat.cueStatus!=='AUDIO_ALIGNED'
        || beat.startFrame===null || beat.endFrame===null
        || beat.endFrame<=beat.startFrame
        || (index>0 && beat.startFrame<=Number(contract.beats[index-1].startFrame))))) {
    ctx.addIssue({code:'custom',message:'Voice-aligned beats must have measured ordered frames',path:['beats']});
  }
  if(!audioAligned && (contract.beats.some(beat=>beat.cueStatus!=='EDITORIAL_ONLY_UNALIGNED'
        || beat.startFrame!==null || beat.endFrame!==null)
      || !contract.readiness.cueAlignmentRequired)) {
    ctx.addIssue({code:'custom',message:'Unaligned beats cannot have invented audio frame positions',path:['beats']});
  }
  if(contract.inputs.preferredTakeId===null && contract.readiness.status==='READY_FOR_CODE_GENERATION'){
    ctx.addIssue({code:'custom',message:'Voice take required before code generation',path:['readiness']});
  }
  if((contract.video.durationInFrames===null)!==(contract.inputs.measuredDurationSeconds===null)){
    ctx.addIssue({code:'custom',message:'Measured duration and frame count must agree',path:['video']});
  }
  if(contract.inputs.measuredDurationSeconds!==null&&contract.video.durationInFrames!==
      Math.ceil(contract.inputs.measuredDurationSeconds*contract.video.fps)){
    ctx.addIssue({code:'custom',message:'Frame count must be derived from measured voice',path:['video']});
  }
  if(contract.inputs.preferredTakeId!==null && !contract.inputs.audioUrl?.includes(contract.inputs.preferredTakeId)){
    ctx.addIssue({code:'custom',message:'Voice URL must refer to preferred take',path:['inputs']});
  }
  const assetKeys=new Set(contract.assets.map(asset=>asset.key));
  if(contract.beats.some(beat=>beat.assetKeys.some(key=>!assetKeys.has(key as never)))){
    ctx.addIssue({code:'custom',message:'Every beat asset must be declared',path:['beats']});
  }
});

export type RemotionSceneContract=z.infer<typeof remotionSceneContractSchema>;

export function parseRemotionSceneContract(input:unknown):RemotionSceneContract {
  return remotionSceneContractSchema.parse(input);
}
