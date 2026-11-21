import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,Img} from 'remotion';
import {Ep004Shot03PreviousLiveTail} from './Shot03PreviousLiveTail';
import {Shot03LivingArchitectureWorldView} from './Shot03LivingArchitectureV1';
import {extendedEp004Shot02SourceProps,ep004Shot03ProductionWorld,
  validateEp004Shot03Production}
  from '../../components/architectural-thinking/EP004Shot03ProductionWorld.mjs';
import type {Ep004Shot03RenderProps}
  from '../../components/architectural-thinking/EP004Shot03ProductionWorld.mjs';

export const Ep004Shot03DirectorV1:React.FC<Ep004Shot03RenderProps>=props=>{
  const frame=useCurrentFrame(),config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
      ||config.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT03_REAL_1080P_30FPS_MEASURED_VOICE_MANDATORY');
  validateEp004Shot03Production(props);
  const state=ep004Shot03ProductionWorld(frame,props);
  const predecessorProps=extendedEp004Shot02SourceProps(props);
  return <AbsoluteFill style={{background:'#030B17'}}>
    {state.sourceAlpha>0&&<AbsoluteFill style={{
      opacity:state.sourceAlpha,pointerEvents:'none'}}>
      <Ep004Shot03PreviousLiveTail {...predecessorProps}
        sourceFrame={state.sourceFrame}/>
    </AbsoluteFill>}
    {state.storyAlpha>0&&<AbsoluteFill style={{
      opacity:state.storyAlpha,pointerEvents:'none'}}>
      <Shot03LivingArchitectureWorldView state={state.storyboard}
        showStoryboardFooter={false}/>
    </AbsoluteFill>}
    {frame===0&&props.previousLastFrameDataUri&&
      <AbsoluteFill style={{zIndex:99,pointerEvents:'none'}}>
        <Img src={props.previousLastFrameDataUri}
          style={{width:1920,height:1080,objectFit:'fill'}}/>
      </AbsoluteFill>}
  </AbsoluteFill>;
};
