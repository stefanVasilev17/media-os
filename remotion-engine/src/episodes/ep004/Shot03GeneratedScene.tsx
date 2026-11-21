import React from 'react';
import {Shot03LivingArchitectureV1} from './Shot03LivingArchitectureV1';
import {validateEp004Shot03Storyboard}
  from '../../components/architectural-thinking/EP004Shot03LivingWorld.mjs';
import type {Ep004Shot03StoryboardProps}
  from '../../components/architectural-thinking/EP004Shot03LivingWorld.mjs';

export const Shot03GeneratedScene:React.FC<Ep004Shot03StoryboardProps>=props=>{
  validateEp004Shot03Storyboard(props);
  return <Shot03LivingArchitectureV1 {...props}/>;
};
