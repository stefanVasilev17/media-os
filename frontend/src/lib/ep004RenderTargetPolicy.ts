export type ApprovedRenderTarget={
  shotKey:string;
  selectedTakeId:string|null;
};
export type ReadyRenderTarget=ApprovedRenderTarget&{
  episodeKey:string;
};
export function matchesApprovedRenderTarget(
  episodeKey:string|undefined,
  shotKey:string,
  approved:ApprovedRenderTarget|null,
  ready:ReadyRenderTarget|null
):boolean {
  return episodeKey==='EP004'&&!!approved&&!!ready
    &&approved.shotKey===shotKey&&ready.shotKey===shotKey
    &&ready.episodeKey===episodeKey
    &&!!approved.selectedTakeId
    &&approved.selectedTakeId===ready.selectedTakeId;
}
export function approvedRenderReceipt(shotKey:string,status:string):string {
  if(status==='QUEUED')
    return 'One approved '+shotKey
      +' candidate is QUEUED for the selected source. No voice was regenerated.';
  if(status==='RENDERING')
    return 'The approved '+shotKey
      +' render is RENDERING. No new voice was generated.';
  if(status==='READY')
    return 'An existing completed '+shotKey
      +' candidate was returned. No new render entered the queue.';
  return 'The server returned '+status+' for '+shotKey
    +'. Inspect this render status before another request.';
}
