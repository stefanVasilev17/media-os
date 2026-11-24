import React from 'react';
import {Shot06ServerFleetPreview} from './Shot06ServerFleetPreview';
import {validateEp004Shot06Production} from '../../components/architectural-thinking/EP004Shot06ProductionWorld.mjs';
import type {Ep004Shot06RenderProps} from '../../components/architectural-thinking/EP004Shot06ProductionWorld.mjs';
export const Shot06ProductionScene:React.FC<Ep004Shot06RenderProps>=props=>{
  validateEp004Shot06Production(props,true);
  return <Shot06ServerFleetPreview previewOnly={true} verifiedCues={props.verifiedCues} durationInFrames={props.durationInFrames} previousLastFrameDataUri={props.previousLastFrameDataUri}/>;
};
