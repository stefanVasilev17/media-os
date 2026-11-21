export type VerifiedShot02Cue={
  beatId:string;anchor:string;startFrame:number;endFrame:number;
};
export type VerifiedShot02Beat={
  beatId:string;cueAnchor:string;direction:string;
};
export type Ep004Shot02RenderProps={
  episodeKey:'EP004';shotKey:'SHOT02';
  sourceSha256:string;previousRenderId:string;previousSourceCommit:string;
  worldStartFrame:number;durationInFrames:number;previewOnly:false;
  directorCpuApproved:true;scriptRevision:number;voiceTakeId:string;
  narrationSha256:string;expectedSourceCommit:string;
  shotTitle:string;verifiedCues:VerifiedShot02Cue[];
  failoverTermStartFrame:number;
  visualBeats:VerifiedShot02Beat[];
};
export type Ep004Shot02ProductionState={
  worldFrame:number;cameraX:number;cameraScale:number;
  showWorld:number;blocked:number;failover:number;spillover:number;
  question:number;mailOpen:number;mailAttempt:number;tension:number;
  cueIndex:number;cueProgress:number;visualStage:number;headerProgress:number;
  traffic:Array<{id:string;x:number;y:number;opacity:number;radius:number;status:string;lane:string}>;
  diagnostics:Array<{id:string;x:number;y:number;opacity:number;progress:number;direction:string}>;
};
export declare const EP004_SHOT02_COMPOSITION:string;
export declare const EP004_SHOT02_BREATH_FRAMES:number;
export declare const EP004_SHOT02_TAIL_FRAMES:number;
export declare function validateEp004Shot02Render(props:Ep004Shot02RenderProps):boolean;
export declare function ep004Shot02ProductionWorld(frame:number,props:Ep004Shot02RenderProps):Ep004Shot02ProductionState;
