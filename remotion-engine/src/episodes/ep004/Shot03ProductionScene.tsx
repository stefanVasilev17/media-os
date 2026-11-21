import React from 'react';
import {Ep004Shot03DirectorV1} from './Shot03DirectorV1';
import {validateEp004Shot03Production}
  from '../../components/architectural-thinking/EP004Shot03ProductionWorld.mjs';
import type {Ep004Shot03RenderProps}
  from '../../components/architectural-thinking/EP004Shot03ProductionWorld.mjs';

export const Shot03ProductionScene:React.FC<Ep004Shot03RenderProps>=props=>{
  validateEp004Shot03Production(props);
  return <Ep004Shot03DirectorV1 {...props}/>;
};
