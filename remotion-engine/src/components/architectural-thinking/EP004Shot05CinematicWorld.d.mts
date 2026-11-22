export type Ep004Shot05XrayPoint={readonly x:number;readonly y:number};
export type Ep004Shot05XrayRoute=readonly [Ep004Shot05XrayPoint,Ep004Shot05XrayPoint,Ep004Shot05XrayPoint,Ep004Shot05XrayPoint];
export type Ep004Shot05CinematicStage={
  readonly key:string;readonly title:string;readonly subtitle:string;
  readonly paths:readonly string[];readonly nodes:readonly string[];
  readonly camera:string;readonly accent:string;
};
export type Ep004Shot05Camera={readonly x:number;readonly y:number;readonly scale:number};
export type Ep004Shot05CinematicState={
  readonly frame:number;readonly beatIndex:number;
  readonly stage:Ep004Shot05CinematicStage;readonly beatAge:number;
  readonly sourceOpacity:number;readonly sourcePush:number;
  readonly interiorOpacity:number;readonly stageAppear:number;
  readonly routeProgress:number;readonly actionProgress:number;
  readonly captionOpacity:number;readonly camera:Ep004Shot05Camera;
  readonly sceneFullyRevealed:boolean;readonly spoke:boolean;
  readonly beatDuration:number;
};
export declare const EP004_SHOT05_CINEMATIC_GRAMMAR:'GATEWAY_XRAY_DIRECTOR_V2';
export declare const EP004_SHOT05_XRAY_ROUTES:Readonly<Record<
  'OUTLOOK_PRIMARY'|'PRIMARY_MAILBOX'|'TEAMS_ALTERNATIVE'|
  'ALTERNATIVE_TEAMS'|'TEAMS_FAILOVER'|'PRIMARY_TEAMS',
  Ep004Shot05XrayRoute
>>;
export declare function ep004Shot05CinematicStage(direction:string,index?:number):Ep004Shot05CinematicStage;
export declare function ep004Shot05XrayPosition(points:Ep004Shot05XrayRoute,t:number):Ep004Shot05XrayPoint;
export declare function ep004Shot05XrayPath(points:Ep004Shot05XrayRoute):string;
export declare function ep004Shot05CinematicState(frame:number,
  cues:readonly {startFrame:number;endFrame:number}[],
  beats:readonly {direction:string}[],duration:number):Ep004Shot05CinematicState;
export declare function validateEp004Shot05XrayRoutes():boolean;
