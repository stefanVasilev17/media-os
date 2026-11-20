export type ApprovedTakeSnapshot={
  selectedTakeId:string|null;
  approvedCurrentRevision:boolean;
};
export type ShotReadinessSnapshot={
  shotKey:string;
  status:string;
  blockers:readonly string[];
  approvedCurrentRevision:boolean;
  timingStatus:string;
};
export function isExpectedTakeApproved(snapshot:ApprovedTakeSnapshot,takeId:string):boolean{
  return !!takeId&&snapshot.approvedCurrentRevision&&snapshot.selectedTakeId===takeId;
}
export function voiceReadinessExplanation(shot:ShotReadinessSnapshot):string{
  if(shot.status==='VOICE_READY'&&shot.blockers.length===0)
    return 'Voice and HEAR → SEE cues are VERIFIED. Visual SHOT Director LOCK is separate.';
  if(!shot.approvedCurrentRevision)
    return 'Current-revision Voice Take is not Director-approved. Check the selected Take.';
  const blockers=shot.blockers.length?shot.blockers.join(', '):shot.timingStatus;
  return 'Voice Take is Director-approved, but SHOT production readiness is blocked by: '
    +blockers+'. These are separate from Voice Take approval; do not regenerate audio automatically.';
}
