export type Ep004Shot05Node={readonly x:number;readonly y:number;readonly w:number;readonly h:number;readonly title:string;readonly font:number};
export type Ep004Shot05Track={
  readonly from:string;readonly to:string;readonly path:string;
  readonly start:readonly [number,number];readonly end:readonly [number,number];
  readonly segments:readonly (readonly [number,number])[];
};
export type Ep004Shot05ClarityStage={
  readonly key:string;readonly headline:string;readonly accent:string;
  readonly visible:readonly string[];readonly lanes:readonly string[];
  readonly primaryStatus:string|null;
};
export type Ep004Shot05ClarityState={
  readonly frame:number;readonly beatIndex:number;readonly stage:Ep004Shot05ClarityStage;
  readonly previousStage:Ep004Shot05ClarityStage|null;readonly age:number;
  readonly camera:Readonly<{x:number;y:number;scale:number}>;
  readonly migration:Ep004Shot05Migration;
  readonly sourceOpacity:number;readonly interiorOpacity:number;
  readonly headlineOpacity:number;readonly previousHeadlineOpacity:number;
  readonly stageTransition:number;readonly flowActivation:number;
  readonly secondLaneActivation:number;readonly switchActivation:number;
  readonly headerBox:Readonly<{text:string;font:number;padding:number;width:number;height:number;x:number;y:number}>;
  readonly visibleHistory:readonly string[];readonly sourcePush:number;
  readonly stageHoldFrames:number;
};
export declare const EP004_SHOT05_CLARITY_GRAMMAR:'SOFT_ROUTE_REVEAL_V6';
export declare const EP004_SHOT05_SAFE_FRAME:Readonly<{left:number;right:number;top:number;bottom:number}>;
export declare const EP004_SHOT05_NODES:Readonly<Record<
  'outlook'|'teams'|'primary'|'alternative'|'exchange'|'teamsService',Ep004Shot05Node>>;
export declare const EP004_SHOT05_TRACKS:Readonly<Record<
  'OUTLOOK_PRIMARY'|'PRIMARY_MAILBOX'|'TEAMS_ALTERNATIVE'|
  'ALTERNATIVE_TEAMS'|'TEAMS_FAILOVER'|'PRIMARY_TEAMS',Ep004Shot05Track>>;
export declare function ep004Shot05MeasuredTextWidth(text:string,font:number):number;
export declare function ep004Shot05TextBox(label:string,font?:number,padding?:number):
  Readonly<{text:string;font:number;padding:number;width:number;height:number;x:number;y:number}>;
export declare function validateEp004Shot05SafeLayout():boolean;
export declare function ep004Shot05ClarityStage(direction:string,index?:number,anchor?:string):Ep004Shot05ClarityStage;
export declare function ep004Shot05ClarityState(
  frame:number,cues:readonly {startFrame:number;endFrame:number;anchor:string}[],
  beats:readonly {direction:string}[],duration:number):Ep004Shot05ClarityState;

export type Ep004Shot05PacketRoute='MAIL'|'OLD'|'NEW';
export type Ep004Shot05Packet={readonly id:string;readonly route:Ep004Shot05PacketRoute;readonly born:number;readonly x:number;readonly y:number;readonly angle:number;readonly opacity:number;readonly travel:number};
export type Ep004Shot05Migration={readonly primaryWeight:number;readonly legacyWeight:number;readonly pressure:number;readonly rerouteFrame:number|null;readonly capacityFrame:number|null;readonly explicit14:boolean;readonly oldStrength:number;readonly newStrength:number;readonly firstNewEmission:number|null;readonly ingressReveal:number;readonly coreReveal:number;readonly egressReveal:number;readonly packets:readonly Ep004Shot05Packet[]};
export declare const EP004_SHOT05_MIGRATION_FRAMES:number;
export declare const EP004_SHOT05_PACKET_INTERVAL:number;
export declare const EP004_SHOT05_PACKET_ROUTES:Readonly<Record<Ep004Shot05PacketRoute,readonly (readonly number[])[]>>;
export declare function ep004Shot05SamplePacket(route:Ep004Shot05PacketRoute,d:number):{x:number;y:number;angle:number}|null;
export declare function ep004Shot05Migration(frame:number,cues:readonly {startFrame:number;endFrame:number;anchor:string}[],beats:readonly {direction:string}[]):Ep004Shot05Migration;
