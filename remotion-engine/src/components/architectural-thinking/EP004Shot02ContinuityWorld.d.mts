import type {Ep004Shot01WorldState} from './EP004Shot01World.mjs';
export type Ep004Shot02PreviewProps={
  previousRenderId:string;
  previousSourceCommit:string;
  previousSourceSha256:string;
  worldStartFrame:number;
  durationInFrames:number;
  previewOnly:boolean;
};
export declare const EP004_SHOT01_V8_LOCKED_RENDER_ID:string;
export declare const EP004_SHOT01_V8_SOURCE_COMMIT:string;
export declare const EP004_SHOT01_V8_TOTAL_FRAMES:number;
export declare const EP004_SHOT01_V8_LAST_FRAME:number;
export declare const EP004_SHOT02_SILENT_PRELUDE_FRAMES:number;
export declare function ep004Shot02Validate(props:Ep004Shot02PreviewProps):boolean;
export declare function ep004Shot02World(frame:number,props:Ep004Shot02PreviewProps):Ep004Shot01WorldState;
