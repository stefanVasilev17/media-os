import {describe,it,expect} from 'vitest';
import {isExpectedTakeApproved,voiceReadinessExplanation} from './voiceTakeApproval';
describe('Director voice Take approval and SHOT readiness must remain distinct',()=>{
  it('confirms the exact current-revision Take',()=>{
    expect(isExpectedTakeApproved({selectedTakeId:'a',approvedCurrentRevision:true},'a')).toBe(true);
  });
  it('never approves another Take merely because one is selected',()=>{
    expect(isExpectedTakeApproved({selectedTakeId:'a',approvedCurrentRevision:true},'b')).toBe(false);
    expect(isExpectedTakeApproved({selectedTakeId:'a',approvedCurrentRevision:false},'a')).toBe(false);
  });
  it('shows exact HEAR SEE blocker after successful approval',()=>{
    const msg=voiceReadinessExplanation({
      shotKey:'SHOT02',status:'BLOCKED',approvedCurrentRevision:true,
      timingStatus:'REAL_CUE_TIMING_UNVERIFIED',blockers:['VISUAL_CUE_NOT_ALIGNED_IN_AUDIO_ORDER']
    });
    expect(msg).toContain('Director-approved');
    expect(msg).toContain('VISUAL_CUE_NOT_ALIGNED_IN_AUDIO_ORDER');
    expect(msg).toContain('do not regenerate audio');
  });
  it('surfaces earlier unresolved provider attempt without overriding approved Take',()=>{
    const msg=voiceReadinessExplanation({
      shotKey:'SHOT02',status:'BLOCKED',approvedCurrentRevision:true,
      timingStatus:'HEAR_SEE_CUES_VERIFIED',
      blockers:['PAID_VOICE_REQUEST_IN_FLIGHT_OR_UNCERTAIN']
    });
    expect(msg).toContain('PAID_VOICE_REQUEST_IN_FLIGHT_OR_UNCERTAIN');
    expect(msg).toContain('Director-approved');
  });
  it('cannot claim visual Director LOCK from VOICE_READY',()=>{
    const msg=voiceReadinessExplanation({
      shotKey:'SHOT02',status:'VOICE_READY',approvedCurrentRevision:true,
      timingStatus:'HEAR_SEE_CUES_VERIFIED',blockers:[]
    });
    expect(msg).toContain('Visual SHOT Director LOCK is separate');
  });
  it('never treats a missing approved current-revision Take as approval',()=>{
    const msg=voiceReadinessExplanation({
      shotKey:'SHOT02',status:'BLOCKED',approvedCurrentRevision:false,
      timingStatus:'NO_APPROVED_TAKE',blockers:['DIRECTOR_APPROVED_CURRENT_REVISION_TAKE_MISSING']
    });
    expect(msg).toContain('not Director-approved');
  });
});
