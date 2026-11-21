import type {Ep004Shot02RenderProps,Ep004Shot02ProductionState}
  from './EP004Shot02ProductionWorld.mjs';
import type {Ep004Shot03StoryboardState}
  from './EP004Shot03LivingWorld.mjs';
export type VerifiedShot03Cue={
  beatId:string;anchor:string;startFrame:number;endFrame:number;
};
export type VerifiedShot03Beat={
  beatId:string;cueAnchor:string;direction:string;
};
export type Ep004Shot03RenderProps={
  episodeKey:'EP004';shotKey:'SHOT03';
  sourceSha256:string;previousRenderId:string;
  previousSourceCommit:string;previousFrameCount:number;
  previousLastEncodedFrame:number;worldStartFrame:number;
  previousVideoSha256:string;
  previousShot02Props:Ep004Shot02RenderProps;
  previousLastFrameDataUri?:string;
  durationInFrames:number;previewOnly:false;directorCpuApproved:true;
  voiceTakeId:string;narrationSha256:string;scriptRevision:number;
  expectedSourceCommit:string;shotTitle:string;
  novemberFrame:number;backwardFrame:number;
  verifiedCues:VerifiedShot03Cue[];visualBeats:VerifiedShot03Beat[];
};
export type Ep004Shot03ProductionState={
  worldFrame:number;sourceFrame:number;
  originalSourceWorldFrame:number;
  sourceAlpha:number;storyAlpha:number;
  revealProgress:number;transitionActive:boolean;transitionBoundaryX:number;
  sourceHeadingOpacity:number;gatewayHeadingOpacity:number;
  editorialFrame:number;sourceSnapshotIsStatic:false;
  silenceFrames:60;realVoiceStartFrame:60;
  cameraX:number;cameraScale:number;
  storyboard:Ep004Shot03StoryboardState;previous:Ep004Shot02ProductionState;
};
export declare const EP004_SHOT03_COMPOSITION:string;
export declare const EP004_SHOT03_TAIL_FRAMES:45;
export declare const EP004_SHOT03_SOURCE_TAIL_FRAMES:190;
export declare const EP004_SHOT03_SWITCH_FRAME:140;
export declare const EP004_SHOT03_SWITCH_START_FRAME:90;
export declare const EP004_SHOT03_SWITCH_END_FRAME:190;
export declare function extendedEp004Shot02SourceProps(
  props:Ep004Shot03RenderProps):Ep004Shot02RenderProps;
export declare function validateEp004Shot03Production(
  props:Ep004Shot03RenderProps):boolean;
export declare function ep004Shot03ProductionWorld(
  frame:number,props:Ep004Shot03RenderProps):Ep004Shot03ProductionState;
