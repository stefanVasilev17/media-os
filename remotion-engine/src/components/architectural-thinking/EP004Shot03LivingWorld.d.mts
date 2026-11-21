export type Ep004Shot03StoryboardProps={
  episodeKey:'EP004';shotKey:'SHOT03';
  previewOnly:true;
  sourceSha256:string;
  previousRenderId:string;previousSourceCommit:string;
  previousFrameCount:number;previousLastEncodedFrame:number;
  worldStartFrame:number;
  durationInFrames:number;
  directorCpuApproved?:false;
  voiceTakeId?:never;
};
export type Ep004Shot03Traffic={
  id:string;route:string;color:'CYAN'|'VIOLET';kind:'OUTLOOK'|'TEAMS';
  x:number;y:number;progress:number;opacity:number;radius:number;
};
export type Ep004Shot03Clarity={
  note:string;noteOpacity:number;
  routes:Record<string,number>;
  primaryFocus:number;alternativeFocus:number;
  julyCallout:number;utcStamp:number;
};
export declare function ep004Shot03Clarity(frame:number):Ep004Shot03Clarity;
export type Ep004Shot03StoryboardState={
  frame:number;worldFrame:number;cameraX:number;cameraScale:number;
  originalOpacity:number;gatewayReveal:number;redirect:number;
  sharedLoad:number;julyMarker:number;utcStamp:number;
  clarity:Ep004Shot03Clarity;
  originalState:{
    worldFrame:number;blocked:number;failover:number;spillover:number;
    tension:number;mailOpen:number;mailAttempt:number;question:number;
    traffic:Array<{id:string;x:number;y:number;opacity:number;radius:number;status:string;lane:string}>;
    diagnostics:Array<{id:string;x:number;y:number;opacity:number}>;
  };
  tokens:Ep004Shot03Traffic[];
  firstFrameIsSourceWorld:boolean;
  transitionsAreEditorialStoryboard:true;isVoiceAligned:false;
};
export declare const EP004_SHOT03_PREDECESSOR:{
  readonly renderId:string;readonly sourceCommit:string;readonly frameCount:2124;
  readonly lastEncodedFrame:2123;readonly worldStartFrame:4123;readonly sourceSha256:string;
};
export declare const EP004_SHOT03_STORYBOARD_ONLY:true;
export declare const EP004_SHOT03_BREATH_FRAMES:60;
export declare const EP004_SHOT03_ROUTES:Record<string,ReadonlyArray<{x:number;y:number}>>;
export declare const EP004_SHOT03_NODES:Record<string,{left:number;top:number;width:number;height:number}>;
export declare function validateEp004Shot03Storyboard(props:Ep004Shot03StoryboardProps):boolean;
export declare function validateEp004Shot03Routes():boolean;
export declare function ep004Shot03StoryboardWorld(frame:number,
  props:Ep004Shot03StoryboardProps,worldFrameOverride?:number|null):Ep004Shot03StoryboardState;
