import React from 'react';
import {Html5Audio,Sequence} from 'remotion';
import {z} from 'zod';
import {GatewayIncidentYoutubePreview} from './GatewayIncidentYoutubePreview';

const sectionSchema=z.object({
  clipKey:z.string(),startFrame:z.number().int().nonnegative(),endFrame:z.number().int().positive(),
  voiceStartFrame:z.number().int().nonnegative(),voiceEndFrame:z.number().int().positive(),
  scriptRevision:z.number().int().positive(),generationRevision:z.number().int().nonnegative(),
});
const visualEventSchema=z.object({
  clipKey:z.string(),kind:z.enum([
    'GATEWAY_ARRIVAL','ROUTE_404','METHOD_405','RATE_LIMIT_429','WAF_403','SCHEMA_400','LOAD_BALANCER_HANDOFF'
  ]),
  frame:z.number().int().nonnegative(),spokenTrigger:z.string(),
  visualExample:z.string(),target:z.string(),derivedFromVoiceAlignment:z.literal(true),
});
const audioSchema=z.object({
  src:z.string().url(),fromFrame:z.number().int().nonnegative(),
  durationInFrames:z.number().int().positive(),
});
export const studioDirectorPlanSchema=z.object({
  durationInFrames:z.number().int().positive().default(3900),
  directorPlan:z.object({
    schemaVersion:z.literal(1),
    recipeId:z.literal('EP001_GATEWAY_DIAGNOSTICS_V1'),
    shotKey:z.literal('SHOT 05'),
    fps:z.literal(30),
    durationInFrames:z.number().int().min(3900).max(5400),
    originalVideoPreserved:z.literal(true),
    livingMapSource:z.literal('EP001_CURRENT_WORLD'),
    voiceSignature:z.string().length(64),
    directorNotes:z.string(),
    sections:z.array(sectionSchema).max(7),
    events:z.array(visualEventSchema).max(7),
    anchors:z.record(z.string(),z.number()),
    audioSources:z.array(z.object({
      clipId:z.string(),fromFrame:z.number().int(),durationInFrames:z.number().int(),
      generationRevision:z.number().int(),
    })).max(7),
  }),
  audioClips:z.array(audioSchema).max(7),
});
type Props=z.infer<typeof studioDirectorPlanSchema>;

export const StudioDirectorPlanPreview:React.FC<Props>=({directorPlan,audioClips,durationInFrames})=>{
  const clipStarts=directorPlan.sections.map(s=>s.startFrame);
  const voiceStarts=directorPlan.sections.map(s=>s.voiceStartFrame);
  const anchorSeconds:Record<string,number>={...directorPlan.anchors};
  const statusFrames:Record<string,number>={};
  for(const event of directorPlan.events){
    statusFrames[event.kind]=event.frame;
  }
  const verified=directorPlan.sections.length===7 && directorPlan.events.length===7 &&
  directorPlan.audioSources.length===7 && audioClips.length===7 &&
  directorPlan.events.every((event,i)=>
    event.clipKey===directorPlan.sections[i].clipKey &&
    event.frame>=directorPlan.sections[i].startFrame &&
    event.frame<directorPlan.sections[i].endFrame
  ) && directorPlan.sections[0].startFrame===0 &&
  directorPlan.sections[6].endFrame===directorPlan.durationInFrames &&
  durationInFrames===directorPlan.durationInFrames &&
  audioClips.every((clip,i)=>clip.fromFrame===voiceStarts[i] &&
    clip.fromFrame+clip.durationInFrames<=directorPlan.sections[i].endFrame+2);
  if(!verified)return <div style={{width:1920,height:1080,background:'#050F1E',color:'#FF849A',
    display:'flex',alignItems:'center',justifyContent:'center',fontSize:42}}>
    INVALID DIRECTOR TIMELINE — RENDER BLOCKED
  </div>;
  return <>
    <GatewayIncidentYoutubePreview durationInFrames={durationInFrames}
      anchors={anchorSeconds} clipStarts={clipStarts} statusFrames={statusFrames}/>
    {audioClips.map((clip,i)=><Sequence key={directorPlan.sections[i].clipKey}
      from={clip.fromFrame} durationInFrames={clip.durationInFrames}>
      <Html5Audio src={clip.src}/>
    </Sequence>)}
  </>;
};
