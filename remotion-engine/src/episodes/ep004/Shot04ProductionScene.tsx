import React from 'react';
import {AbsoluteFill,Img,useCurrentFrame,useVideoConfig} from 'remotion';
import {Shot03LivingArchitectureWorldView} from './Shot03LivingArchitectureV1';
import {AT_FONT} from '../../components/architectural-thinking';
import {ep004Shot04ProductionWorld,validateEp004Shot04Production}
  from '../../components/architectural-thinking/EP004Shot04ProductionWorld.mjs';
import type {Ep004Shot04RenderProps}
  from '../../components/architectural-thinking/EP004Shot04ProductionWorld.mjs';
import {EP004_SHOT03_NODES}
  from '../../components/architectural-thinking/EP004Shot03LivingWorld.mjs';

const CYAN='#68E5FF',WHITE='#F5FCFF',MINT='#6FECD4';
const primary=EP004_SHOT03_NODES.primary;
const alternative=EP004_SHOT03_NODES.alternative;
const primaryBorder=[
  'M',primary.left+20,primary.top,'H',primary.left+primary.width-20,
  'L',primary.left+primary.width,primary.top+21,
  'V',primary.top+primary.height-21,
  'L',primary.left+primary.width-20,primary.top+primary.height,
  'H',primary.left+20,
  'L',primary.left,primary.top+primary.height-21,
  'V',primary.top+21,'Z'
].join(' ');
const alternativeBorder=[
  'M',alternative.left+30,alternative.top,
  'H',alternative.left+alternative.width-30,
  'Q',alternative.left+alternative.width,alternative.top,
  alternative.left+alternative.width,alternative.top+29,
  'V',alternative.top+alternative.height-29,
  'Q',alternative.left+alternative.width,alternative.top+alternative.height,
  alternative.left+alternative.width-30,alternative.top+alternative.height,
  'H',alternative.left+30,
  'Q',alternative.left,alternative.top+alternative.height,
  alternative.left,alternative.top+alternative.height-29,
  'V',alternative.top+29,
  'Q',alternative.left,alternative.top,
  alternative.left+30,alternative.top,'Z'
].join(' ');
export const Shot04ProductionScene:React.FC<Ep004Shot04RenderProps>=props=>{
  const frame=useCurrentFrame(),config=useVideoConfig();
  if(config.width!==1920||config.height!==1080||config.fps!==30
     ||config.durationInFrames!==props.durationInFrames)
    throw Error('SHOT04_REQUIRES_1080P_30FPS_APPROVED_DURATION');
  validateEp004Shot04Production(props);
  const state=ep004Shot04ProductionWorld(frame,props);
  const title=props.shotTitle.length>54?
    props.shotTitle.slice(0,51).trimEnd()+'…':props.shotTitle;
  const focusedNode=Object.entries(EP004_SHOT03_NODES).find(([,node])=>
    Math.abs(state.focusX-(node.left+node.width/2))<16&&
    Math.abs(state.focusY-(node.top+node.height/2))<16);
  const cueStart=state.beatIndex<0?frame:
    props.verifiedCues[state.beatIndex].startFrame;
  const focusAge=frame-cueStart;
  const pulseFade=1-Math.min(1,Math.max(0,(focusAge-90)/60));
  const spotlightPulse=state.focusPulse*pulseFade;
  return <AbsoluteFill style={{background:'#030B17',overflow:'hidden'}}>
    <AbsoluteFill style={{
      transform:'scale('+state.cameraScale+')',
      transformOrigin:'1360px 535px'
    }}>
      <Shot03LivingArchitectureWorldView
        state={state.storyboard} showStoryboardFooter={false}
        headingOpacity={state.sourceHeadingOpacity}/>
      <AbsoluteFill style={{pointerEvents:'none',zIndex:40,
        transform:'translate3d('+state.storyboard.cameraX+'px,0,0) scale('+
          state.storyboard.cameraScale+')',
        transformOrigin:'960px 540px'}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <g opacity={state.focusAlpha} style={{
            filter:'drop-shadow(0 0 '+(5+8*spotlightPulse)+
              'px rgba(111,236,212,.38))'
          }}>
            {focusedNode?.[0]==='primary'&&
              <path d={primaryBorder} fill={MINT}
                fillOpacity={.12+.10*spotlightPulse}
                stroke={MINT} strokeWidth={3+1.4*spotlightPulse}/>}
            {focusedNode?.[0]==='alternative'&&
              <path d={alternativeBorder} fill={MINT}
                fillOpacity={.12+.10*spotlightPulse}
                stroke={MINT} strokeWidth={3+1.4*spotlightPulse}/>}
            {focusedNode&&focusedNode[0]!=='primary'&&
              focusedNode[0]!=='alternative'&&
              <rect x={focusedNode[1].left} y={focusedNode[1].top}
                width={focusedNode[1].width} height={focusedNode[1].height}
                rx={16} fill={MINT}
                fillOpacity={.12+.10*spotlightPulse}
                stroke={MINT} strokeWidth={3+1.4*spotlightPulse}/>}
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
    <AbsoluteFill style={{pointerEvents:'none',zIndex:45}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
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
