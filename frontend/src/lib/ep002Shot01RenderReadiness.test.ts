import {describe,expect,it} from 'vitest';
import type {Ep002SceneContract} from '../api/ep002RemotionSceneContractApi';
import type {ExistingTakeAlignmentState} from '../api/ep002CreativeVoiceApi';
import {decideShot01Render,genuineShot01CueFrames} from './ep002Shot01RenderReadiness';

const take='00000000-0000-0000-0000-000000000001';
function scene(aligned:boolean,blockers:string[]=[]):Ep002SceneContract {
  return {
    schemaVersion:'REMOTION_SCENE_V1',episodeKey:'EP002',shotKey:'SHOT01',
    contractId:'contract',codeGenerationPolicy:'REVIEWED_SOURCE_CHANGES_ONLY_NO_AUTO_EXECUTION',
    video:{width:1920,height:1080,fps:30,colorSpace:'REC709',
      durationInFrames:1234,durationAuthority:'MEASURED_AUDIO_CEIL_TO_FRAME',
      compositionId:'EP002-SHOT01-DRAFT',registeredInRemotion:false},
    inputs:{scriptRevision:1,narrationSha256:'hash',preferredTakeId:take,
      audioUrl:'voice',measuredDurationSeconds:41.1,approvedVisualGitBlobSha:'v',
      productionDependencySha256:'dependency'},
    assets:[],beats:Array.from({length:5},(_,i)=>({
      number:i+1,approvedDirection:'approved',cueAnchor:'spoken',
      cueStatus:aligned?'AUDIO_ALIGNED':'EDITORIAL_ONLY_UNALIGNED',
      cameraIntent:'CLOSE_PHONE',operations:[],assetKeys:[],
      startFrame:aligned?i*60:null,endFrame:aligned?(i+1)*60:null,
    })),
    cameraDirection:'camera',continuityGuardrails:'truth',endingTransition:'rewind',
    cueTimingAuthority:aligned?'ELEVENLABS_CHARACTER_TIMESTAMPS':
      'EDITORIAL_CUES_ONLY_NO_FRAME_ALIGNMENT',
    readiness:{status:aligned?'READY_FOR_CODE_GENERATION':'BLOCKED',blockers,
      cueAlignmentRequired:!aligned,canSubmitRender:false},
  };
}
function alignment(available:boolean,present:boolean=false):ExistingTakeAlignmentState {
  return {shotKey:'SHOT01',preferredTakeId:take,revision:1,alignmentPresent:present,
    paidRequestStatus:'NONE',canAlign:available,reason:null,
    lastAttemptAt:null,lastFailureCategory:null};
}
describe('SHOT01 single-Director-click paid render safety',()=>{
  it('renders directly with five genuine beat frames and never requests new alignment',()=>{
    expect(genuineShot01CueFrames(scene(true))).toBe(true);
    expect(decideShot01Render(scene(true),alignment(false,true)).action).toBe('RENDER');
  });
  it('allows a single explicit align-and-render authorization for the SAME approved MP3',()=>{
    const selected=decideShot01Render(scene(false,['NARRATION_CUE_REVIEW_REQUIRED']),alignment(true));
    expect(selected.action).toBe('ALIGN_AND_RENDER');
    expect(selected.reason).toContain('separate paid Railway');
  });
  it('refuses to rebill when alignment already exists but anchor matching failed',()=>{
    const decision=decideShot01Render(scene(false),alignment(false,true));
    expect(decision.action).toBe('BLOCKED');
    expect(decision.reason).toContain('already has saved alignment');
  });
  it('blocks any uncertain/in-flight or disabled paid alignment instead of retrying',()=>{
    const value=alignment(false);
    value.paidRequestStatus='UNCERTAIN';
    value.reason='Earlier paid alignment may have charged credits; do not retry.';
    expect(decideShot01Render(scene(false),value).action).toBe('BLOCKED');
  });
  it('blocks selected-Take mismatch, unmeasured duration and unrelated blockers',()=>{
    const wrong=alignment(true); wrong.preferredTakeId='different';
    expect(decideShot01Render(scene(false),wrong).action).toBe('BLOCKED');
    const unmeasured=scene(false);unmeasured.video.durationInFrames=null;
    expect(decideShot01Render(unmeasured,alignment(true)).action).toBe('BLOCKED');
    expect(decideShot01Render(scene(false,['VISUAL_SOURCE_MISMATCH']),alignment(true)).action)
      .toBe('BLOCKED');
  });
});
