import React from 'react';
import {Ep004Shot02DirectorV1} from './Shot02DirectorV1';
import {validateEp004Shot02Render}
  from '../../components/architectural-thinking/EP004Shot02ProductionWorld.mjs';
import type {Ep004Shot02RenderProps}
  from '../../components/architectural-thinking/EP004Shot02ProductionWorld.mjs';

export const Shot02GeneratedScene:React.FC<Ep004Shot02RenderProps>=props=>{
  validateEp004Shot02Render(props);
  return <Ep004Shot02DirectorV1 {...props}/>;
};
