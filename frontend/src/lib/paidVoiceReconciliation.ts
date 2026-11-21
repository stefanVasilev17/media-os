export type PaidVoiceState={
  generationStatus:string;
  revision:number;
  takes:readonly {id:string;revision:number}[];
};

export type PaidVoiceOutcome={
  resolved:boolean;
  message:string;
};

export function reconcilePaidVoiceState(
  state:PaidVoiceState,
  knownTakeIds:readonly string[]
):PaidVoiceOutcome{
  const status=state.generationStatus.toUpperCase();
  const newlyStored=state.takes.some(t=>
    t.revision===state.revision&&!knownTakeIds.includes(t.id));
  if(status==='COMPLETED'&&newlyStored){
    return {
      resolved:true,
      message:'The original paid request completed and a new Take is stored. Listen to that Take before Director approval. No second generation was sent.'
    };
  }
  if(status==='COMPLETED'){
    return {
      resolved:false,
      message:'The server reports COMPLETED, but no newly stored Take was confirmed for this revision. Do not generate again until this attempt is reconciled.'
    };
  }
  if(status==='IN_FLIGHT'){
    return {
      resolved:false,
      message:'The original paid ElevenLabs request is still IN_FLIGHT. The browser connection ended, but generation may still finish. Check existing request status again without a paid call.'
    };
  }
  if(status==='UNCERTAIN'){
    return {
      resolved:false,
      message:'The server marked this paid request UNCERTAIN. Verify its ElevenLabs provider and billing outcome before any new paid generation. No automatic retry is allowed.'
    };
  }
  return {
    resolved:false,
    message:'The server did not confirm the outcome of this paid attempt (latest status: '+status+'). Do not retry until the original request and provider billing are reconciled.'
  };
}
