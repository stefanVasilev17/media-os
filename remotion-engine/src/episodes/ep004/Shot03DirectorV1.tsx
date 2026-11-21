import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,Img} from 'remotion';
import {Ep004Shot03PreviousLiveTail} from './Shot03PreviousLiveTail';
import {Shot03LivingArchitectureWorldView} from './Shot03LivingArchitectureV1';
import {extendedEp004Shot02SourceProps,ep004Shot03ProductionWorld,
  validateEp004Shot03Production}
  from '../../components/architectural-thinking/EP004Shot03ProductionWorld.mjs';
import type {Ep004Shot03RenderProps}
  from '../../components/architectural-thinking/EP004Shot03ProductionWorld.mjs';

const FRAME_WIDTH=1920;
const SOFT_EDGE_PX=88;

export const Ep004Shot03DirectorV1:React.FC<Ep004Shot03RenderProps>=props=>{
  const frame=useCurrentFrame(),config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
      ||config.durationInFrames!==props.durationInFrames)
    throw Error('EP004_SHOT03_REAL_1080P_30FPS_MEASURED_VOICE_MANDATORY');
  validateEp004Shot03Production(props);
  const state=ep004Shot03ProductionWorld(frame,props);
  const predecessorProps=extendedEp004Shot02SourceProps(props);

  // A soft right-to-left spatial reveal keeps both worlds moving continuously.
  // Complementary masks avoid stacking two unrelated diagrams or flashing white.
  const boundary=state.transitionBoundaryX;
  const softStart=Math.max(0,boundary-SOFT_EDGE_PX);
  const softEnd=Math.min(FRAME_WIDTH,boundary+SOFT_EDGE_PX);
  const oldMask='linear-gradient(90deg,#000 0px,#000 '+softStart+
    'px,transparent '+softEnd+'px,transparent 1920px)';
  const gatewayMask='linear-gradient(90deg,transparent 0px,transparent '+
    softStart+'px,#000 '+softEnd+'px,#000 1920px)';
  const oldStyle=state.transitionActive
    ?{maskImage:oldMask,WebkitMaskImage:oldMask}
    :{};
  const gatewayStyle=state.transitionActive
    ?{maskImage:gatewayMask,WebkitMaskImage:gatewayMask}
    :{};

  return <AbsoluteFill style={{background:'#030B17'}}>
    {state.sourceAlpha>0&&<AbsoluteFill style={{
      ...oldStyle,pointerEvents:'none'}}>
      <Ep004Shot03PreviousLiveTail {...predecessorProps}
        headerOpacity={state.sourceHeadingOpacity}
        sourceFrame={state.sourceFrame}/>
    </AbsoluteFill>}
    {state.storyAlpha>0&&<AbsoluteFill style={{
      ...gatewayStyle,pointerEvents:'none'}}>
      <Shot03LivingArchitectureWorldView state={state.storyboard}
        headingOpacity={state.gatewayHeadingOpacity}
        showStoryboardFooter={false}/>
    </AbsoluteFill>}
    {frame===0&&props.previousLastFrameDataUri&&
      <AbsoluteFill style={{zIndex:99,pointerEvents:'none'}}>
        <Img src={props.previousLastFrameDataUri}
          style={{width:1920,height:1080,objectFit:'fill'}}/>
      </AbsoluteFill>}
  </AbsoluteFill>;
};
