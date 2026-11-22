import type {Ep004Shot04RenderProps} from './EP004Shot04ProductionWorld.mjs';
import type {Ep004Shot05CinematicState} from './EP004Shot05CinematicWorld.mjs';
export type Ep004Shot05Cue={beatId:string;anchor:string;startFrame:number;endFrame:number};
export type Ep004Shot05Beat={beatId:string;cueAnchor:string;direction:string};
export type Ep004Shot05RenderProps={
  episodeKey:'EP004';shotKey:'SHOT05';previewOnly:false;directorCpuApproved:true;
  sourceSha256:string;previousRenderId:string;previousSourceCommit:string;
  previousFrameCount:number;previousLastEncodedFrame:number;
  previousWorldStartFrame:number;previousVideoSha256:string;
  worldStartFrame:number;previousShot04Props:Ep004Shot04RenderProps;
  previousLastFrameDataUri?:string;durationInFrames:number;breathFrames:72;
  scriptRevision:number;voiceTakeId:string;narrationSha256:string;
  expectedSourceCommit:string;shotTitle:string;
  verifiedCues:Ep004Shot05Cue[];visualBeats:Ep004Shot05Beat[];
};
export type Ep004Shot05Route={
  key:string;focus:string;routes:string[];
};
export type Ep004Shot05State={
  frame:number;worldFrame:number;sourceWorldFrame:number;spoken:boolean;
  beatIndex:number;route:Ep004Shot05Route|null;cinematic:Ep004Shot05CinematicState;
  cameraScale:number;panX:number;routeOpacity:number;
  oldOpacity:number;sceneIn:number;appear:number;cueAge:number;
  titleOpacity:number;sourceHeadingOpacity:number;
};
export declare const EP004_SHOT05_COMPOSITION:'EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL';
export declare const EP004_SHOT05_BREATH_FRAMES:72;
export declare const EP004_SHOT05_TAIL_FRAMES:45;
export declare function ep004Shot05StoryRoute(direction:string,index?:number):Ep004Shot05Route;
export declare function validateEp004Shot05Production(props:Ep004Shot05RenderProps):boolean;
export declare function ep004Shot05ProductionWorld(frame:number,props:Ep004Shot05RenderProps):Ep004Shot05State;
