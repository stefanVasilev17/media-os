export type Point={x:number;y:number};
export type Ep004Shot01Beat =
  |'SHOT01_P01_B01'|'SHOT01_P01_B02'|'SHOT01_P01_B03'
  |'SHOT01_P02_B01'|'SHOT01_P02_B02'|'SHOT01_P02_B03'
  |'SHOT01_P03_B01'|'SHOT01_P03_B02';
export type Ep004Shot01Props={
  sourceSha256:string;
  durationInFrames:number;
  worldStartFrame:number;
  previewOnly:boolean;
  voiceTakeId?:string;
  cueFrames?:Record<Ep004Shot01Beat,number>;
};
export type Ep004Shot01WorldState={
  worldFrame:number;routeProgress:number;request:Point;
  requestStatus:'WAITING'|'IN_TRANSIT';
  blocked:number;showWorld:number;failover:number;
  question:number;towardNext:number;secondary:Point;
  secondaryVisible:boolean;cameraX:number;cameraScale:number;
};
export declare const EP004_SHOT01_LOCKED_SOURCE_SHA256:string;
export declare const EP004_SHOT01_BEATS:readonly Ep004Shot01Beat[];
export type Ep004Shot01Bounds={x:number;y:number;width:number;height:number};
export declare const EP004_SHOT01_LAYOUT:Readonly<{
  client:Readonly<Ep004Shot01Bounds>;
  gateway:Readonly<Ep004Shot01Bounds>;
  server:Readonly<Ep004Shot01Bounds>;
  otherServices:Readonly<Ep004Shot01Bounds>;
}>;
export declare function ep004Shot01LayoutValidate():boolean;
export declare const EP004_MAIL_ROUTE:readonly Point[];
export declare const EP004_STANDBY_ROUTE:readonly Point[];
export declare function ep004RoutePolyline(points:readonly Point[]):string;
export declare function ep004RoutePosition(points:readonly Point[],progress:number):Point;
export declare function ep004Shot01Validate(props:Ep004Shot01Props):boolean;
export declare function ep004Shot01Phase(frame:number,props:Ep004Shot01Props):Ep004Shot01WorldState;
export declare function ep004Shot01Exit(props:Ep004Shot01Props):Ep004Shot01WorldState;
