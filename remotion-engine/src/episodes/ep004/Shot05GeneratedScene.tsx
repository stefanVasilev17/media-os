import React from 'react';
import {Shot05ProductionScene} from './Shot05ProductionScene';
import {validateEp004Shot05Production}
  from '../../components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
import type {Ep004Shot05RenderProps}
  from '../../components/architectural-thinking/EP004Shot05ProductionWorld.mjs';

export const Shot05GeneratedScene:React.FC<Ep004Shot05RenderProps>=props=>{
  validateEp004Shot05Production(props);
  return <Shot05ProductionScene {...props}/>;
};
