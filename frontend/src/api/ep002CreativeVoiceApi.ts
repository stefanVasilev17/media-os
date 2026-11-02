export type CreativeTake={
  id:string; revision:number; takeNumber:number; contentType:string;
  modelId:string; voiceId:string; generatedAt:string; approvedAt:string|null;
};
export type CreativeShotState={
  shotKey:string; revision:number; narration:string|null; voiceDirection:string|null;
  takes:CreativeTake[]; hasCurrentTake:boolean; voiceApproved:boolean;
  preferredTakeId:string|null;
  canGenerate:boolean; blockedReason:string|null; generationStatus:string;
  voiceModel:string; voiceIdentityVerified:boolean;
};

export type ExistingTakeAlignmentState={
  shotKey:string;preferredTakeId:string|null;revision:number|null;
  alignmentPresent:boolean;paidRequestStatus:'NONE'|'IN_FLIGHT'|'COMPLETED'|'UNCERTAIN';
  canAlign:boolean;reason:string|null;
};

const base=(shot:string)=>'/api/v1/creative/episodes/EP002/shots/'+encodeURIComponent(shot);

async function request<T>(url:string,method:string='GET',body?:unknown):Promise<T>{
  const response=await fetch(url,{
    method,cache:'no-store',
    headers:body===undefined?undefined:{'Content-Type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  if(!response.ok){
    const raw=await response.text();
    let reason=raw;
    try {
      const parsed=JSON.parse(raw) as {detail?:string;message?:string;error?:string};
      reason=parsed.detail||parsed.message||parsed.error||raw;
    } catch {
      reason=raw;
    }
    throw new Error('MediaOS HTTP '+response.status+': '+reason.slice(0,400));
  }
  return response.json() as Promise<T>;
}
export const ep002CreativeVoiceApi={
  state:(shot:string)=>request<CreativeShotState>(base(shot)),
  save:(shot:string,expectedRevision:number,narration:string,voiceDirection:string)=>
    request<CreativeShotState>(base(shot),'PUT',{expectedRevision,narration,voiceDirection}),
  generate:(shot:string,expectedRevision:number,requestId:string)=>
    request<CreativeShotState>(base(shot)+'/generate','POST',{expectedRevision,requestId}),
  approve:(shot:string,revision:number,takeId:string)=>
    request<CreativeShotState>(base(shot)+'/approve','POST',{revision,takeId}),
  audio:(shot:string,takeId:string)=>base(shot)+'/takes/'+encodeURIComponent(takeId)+'/audio',
  alignmentState:(shot:string)=>request<ExistingTakeAlignmentState>(base(shot)+'/align-existing-take'),
  alignExisting:(shot:string,preferredTakeId:string,expectedRevision:number,requestId:string)=>
    request<ExistingTakeAlignmentState>(base(shot)+'/align-existing-take','POST',{
      preferredTakeId,expectedRevision,requestId,confirmPaidAlignment:true
    }),
};
