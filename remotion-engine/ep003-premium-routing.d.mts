export interface PremiumRoutePoint {x:number;y:number}
export type PremiumRouteSegment=
 | {type:'L';to:PremiumRoutePoint}
 | {type:'Q';control:PremiumRoutePoint;to:PremiumRoutePoint};
export interface PremiumRoute {
 start:PremiumRoutePoint;
 segments:readonly PremiumRouteSegment[];
}
export declare const PREMIUM_ROUTING_VERSION:string;
export declare const PREMIUM_ROUTE_STYLE:Readonly<{
 railWidth:number;activeWidth:number;quietOpacity:number;
 activeOpacity:number;packetRadius:number;packetGlow:number;
 cornerRadius:number;minTextGap:number;
}>;
export declare const PREMIUM_ROUTES:Readonly<{
 AUTH_A:PremiumRoute;AUTH_B:PremiumRoute;
 REPLICA_A:PremiumRoute;REPLICA_B:PremiumRoute;
 RECOVERY_A:PremiumRoute;
}>;
export declare function premiumRouteEnd(route:PremiumRoute):PremiumRoutePoint;
export declare function premiumRouteD(route:PremiumRoute):string;
export declare function premiumRoutePoint(t:number,route:PremiumRoute):PremiumRoutePoint;
export declare function premiumPacketPoint(frame:number,speed:number,offset:number,route:PremiumRoute):
 PremiumRoutePoint&{opacity:number;t:number};
export declare function validatePremiumRoutes():boolean;
