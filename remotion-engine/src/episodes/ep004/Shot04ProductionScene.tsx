import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {Shot03LivingArchitectureWorldView} from './Shot03LivingArchitectureV1';
import {AT_FONT} from '../../components/architectural-thinking';
import {ep004Shot04ProductionWorld,validateEp004Shot04Production}
  from '../../components/architectural-thinking/EP004Shot04ProductionWorld.mjs';
import type {Ep004Shot04RenderProps}
  from '../../components/architectural-thinking/EP004Shot04ProductionWorld.mjs';

const CYAN='#68E5FF',WHITE='#F5FCFF',MINT='#6FECD4';
export const Shot04ProductionScene:React.FC<Ep004Shot04RenderProps>=props=>{
  const frame=useCurrentFrame(),config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
     ||config.durationInFrames!==props.durationInFrames)
    throw Error('SHOT04_REQUIRES_1080P_30FPS_APPROVED_DURATION');
  validateEp004Shot04Production(props);
  const state=ep004Shot04ProductionWorld(frame,props);
  const title=props.shotTitle.length>54?
    props.shotTitle.slice(0,51).trimEnd()+'…':props.shotTitle;
  return <AbsoluteFill style={{background:'#030B17',overflow:'hidden'}}>
    <AbsoluteFill style={{
      transform:'scale('+state.cameraScale+')',
      transformOrigin:'1360px 535px'
    }}>
      <Shot03LivingArchitectureWorldView
        state={state.storyboard} showStoryboardFooter={false}
        headingOpacity={state.sourceHeadingOpacity}/>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:45}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <g opacity={state.focusAlpha}>
          <circle cx={state.focusX} cy={state.focusY}
            r={120+7*state.focusPulse} fill="none"
            stroke={MINT} strokeWidth={2.5} opacity={.40+.25*state.focusPulse}/>
          <circle cx={state.focusX} cy={state.focusY}
            r={143+4*state.focusPulse} fill="none"
            stroke={CYAN} strokeWidth={1.5} opacity={.20+.17*state.focusPulse}/>
          <path d={'M '+(state.focusX-42)+' '+(state.focusY-124)+
            ' H '+(state.focusX+42)}
            stroke={MINT} strokeWidth={3} strokeLinecap="round"/>
        </g>
        <g opacity={state.titleOpacity} fontFamily={AT_FONT}>
          <rect x={542} y={61} rx={7} width={1175} height={103}
            fill="#061A2D" fillOpacity={.89}/>
          <text x={560} y={118} fill={WHITE} fontWeight={870}
            fontSize={title.length>41?27:33} letterSpacing="-.015em">
            {title.toUpperCase()}
          </text>
          <path d="M 560 142 H 1530" stroke={CYAN} strokeWidth={2}
            opacity={.62}/>
        </g>
      </svg>
    </AbsoluteFill>
    {frame===0&&props.previousLastFrameDataUri&&
      <AbsoluteFill style={{zIndex:99,pointerEvents:'none'}}>
        <Img src={props.previousLastFrameDataUri}
          style={{width:1920,height:1080,objectFit:'fill'}}/>
      </AbsoluteFill>}
  </AbsoluteFill>;
};
