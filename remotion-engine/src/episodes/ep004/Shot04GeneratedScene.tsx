import React from 'react';
import {Shot04ProductionScene} from './Shot04ProductionScene';
import {validateEp004Shot04Production}
  from '../../components/architectural-thinking/EP004Shot04ProductionWorld.mjs';
import type {Ep004Shot04RenderProps}
  from '../../components/architectural-thinking/EP004Shot04ProductionWorld.mjs';

export const Shot04GeneratedScene:React.FC<Ep004Shot04RenderProps>=props=>{
  validateEp004Shot04Production(props);
  return <Shot04ProductionScene {...props}/>;
};
