import React from 'react';
import {Composition,getInputProps} from 'remotion';
import {factoryScenes} from './generated-scene-registry';

export type FactorySceneProps={
  episodeKey:string;
  shotKey:string;
  durationInFrames:number;
  narrationRevision?:number;
  voiceTakeId?:string;
  verifiedCues?:Array<{
    beatId:string;anchor:string;startFrame:number;endFrame:number;
  }>;
};

export const FactorySceneRouter:React.FC<FactorySceneProps>=(props)=>{
  const key=props.episodeKey+'-'+props.shotKey;
  if(!/^EP[0-9]{3,}-SHOT[0-9]{2}$/.test(key)
      ||key.startsWith('EP001-')||key.startsWith('EP002-')){
    throw Error('FACTORY_PROTECTED_OR_INVALID_EPISODE');
  }
  const Scene=factoryScenes[key];
  if(!Scene)throw Error('FACTORY_SCENE_NOT_BUILT_FOR_THIS_WORKER_'+key);
  return <Scene {...props}/>;
};

export const FactoryRoot:React.FC=()=>{
  const props=getInputProps() as Partial<FactorySceneProps>;
  const frames=Number(props.durationInFrames);
  const duration=Number.isInteger(frames)&&frames>0&&frames<=108000?frames:150;
  return <Composition
    id="AT-FACTORY-SHOT"
    component={FactorySceneRouter}
    durationInFrames={duration}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{episodeKey:'EP003',shotKey:'SHOT01',durationInFrames:150,
      narrationRevision:1,voiceTakeId:'',verifiedCues:[]}}
  />;
};
