import React from 'react';
import {Ep004Shot01OrdinaryWorkday} from './Shot01OrdinaryWorkday';
import {EP004_SHOT01_BEATS,EP004_SHOT01_LOCKED_SOURCE_SHA256}
  from '../../components/architectural-thinking/EP004Shot01World.mjs';

type VerifiedCue={beatId:string;anchor:string;startFrame:number;endFrame:number};
type Props={
  episodeKey:string;
  shotKey:string;
  durationInFrames:number;
  voiceTakeId?:string;
  verifiedCues?:VerifiedCue[];
  worldStartFrame?:number;
};

export const Shot01GeneratedScene:React.FC<Props>=props=>{
  if(props.episodeKey!=='EP004'||props.shotKey!=='SHOT01')
    throw Error('EP004_SHOT01_PROTECTED_EPISODE_KEY_MISMATCH');
  const cues=props.verifiedCues??[];
  if(cues.length!==EP004_SHOT01_BEATS.length)
    throw Error('EP004_SHOT01_REAL_ALIGNED_CUE_SET_MISSING');
  const mapped:Record<string,number>={};
  for(let i=0;i<cues.length;i++){
    if(cues[i].beatId!==EP004_SHOT01_BEATS[i]||
        !Number.isInteger(cues[i].startFrame))
      throw Error('EP004_SHOT01_CUE_ID_OR_FRAME_MISMATCH');
    mapped[cues[i].beatId]=cues[i].startFrame;
  }
  return <Ep004Shot01OrdinaryWorkday
    sourceSha256={EP004_SHOT01_LOCKED_SOURCE_SHA256}
    durationInFrames={props.durationInFrames}
    worldStartFrame={props.worldStartFrame??0}
    previewOnly={false}
    voiceTakeId={props.voiceTakeId}
    cueFrames={mapped as Record<typeof EP004_SHOT01_BEATS[number],number>}
  />;
};
