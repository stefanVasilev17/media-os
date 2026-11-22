import type {Ep004Shot03StoryboardState} from './EP004Shot03LivingWorld.mjs';
export type Ep004Shot04Cue={beatId:string;anchor:string;startFrame:number;endFrame:number};
export type Ep004Shot04Beat={beatId:string;cueAnchor:string;direction:string};
export type Ep004Shot04RenderProps={
  episodeKey:'EP004';shotKey:'SHOT04';previewOnly:false;directorCpuApproved:true;
  sourceSha256:string;previousRenderId:string;previousSourceCommit:string;
  previousFrameCount:number;previousLastEncodedFrame:number;
  previousVideoSha256:string;worldStartFrame:number;
  previousLastFrameDataUri?:string;
  durationInFrames:number;breathFrames:72;scriptRevision:number;voiceTakeId:string;
  narrationSha256:string;expectedSourceCommit:string;shotTitle:string;
  verifiedCues:Ep004Shot04Cue[];visualBeats:Ep004Shot04Beat[];
};
export type Ep004Shot04State={
  frame:number;worldFrame:number;originalSourceWorldFrame:number;
  breathFrames:72;voiceStartFrame:72;spoken:boolean;
  sourceSnapshotIsStatic:false;storyboard:Ep004Shot03StoryboardState;
  reveal:number;sourceHeadingOpacity:number;titleOpacity:number;
  cameraScale:number;beatIndex:number;focusAlpha:number;
  focusX:number;focusY:number;focusPulse:number;
};
export declare const EP004_SHOT04_COMPOSITION:'EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL';
export declare const EP004_SHOT04_BREATH_FRAMES:72;
export declare const EP004_SHOT04_TAIL_FRAMES:45;
export declare const EP004_SHOT04_PREVIOUS_WORLD_START:4123;
export declare const EP004_SHOT04_REVEAL_START:30;
export declare const EP004_SHOT04_REVEAL_END:156;
export declare function validateEp004Shot04Production(props:Ep004Shot04RenderProps):boolean;
export declare function ep004Shot04ProductionWorld(frame:number,props:Ep004Shot04RenderProps):Ep004Shot04State;
