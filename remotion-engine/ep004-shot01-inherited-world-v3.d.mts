import type {PremiumRoute} from './ep003-premium-routing-v2.mjs';
import type {Ep004Shot01Props} from './src/components/architectural-thinking/EP004Shot01World.mjs';
export type V3Node={x:number;y:number;width:number;height:number};
export type V3Point={x:number;y:number};
export type V3Camera={x:number;y:number;scale:number};
export interface V3State {
 worldFrame:number;
 routeProgress:number;request:V3Point;
 requestStatus:'WAITING'|'IN_TRANSIT';
 wait:number;revealGateway:number;revealRouter:number;revealFleet:number;
 standbyHighlight:number;endpointEcho:number;question:number;handoff:number;
 camera:V3Camera;ambiance:number;nextShotWorldFrame:number;
 lockedSourceSha256:string;
}
export declare const EP004_V3_LINEAGE:Readonly<{
  approvedNodeCoordinates:string;premiumRouteImplementation:string;
  nodeRenderer:string;lockedSourceSha256:string;shotKey:string;renderComposition:string;
}>;
export declare const EP004_V3_LAYOUT:Readonly<{
 client:Readonly<V3Node>;
 gateway:Readonly<V3Node>;
 router:Readonly<V3Node>;
 mailboxFleet:Readonly<V3Node>;
 otherServices:Readonly<V3Node>;
}>;
export declare const EP004_V3_ROUTES:Readonly<{
 mailbox:PremiumRoute;gatewayToRouter:PremiumRoute;
 routerToFleet:PremiumRoute;standby:PremiumRoute;
}>;
export declare const EP004_V3_ROUTE_STYLE:Readonly<{
 railWidth:number;activeWidth:number;quietOpacity:number;activeOpacity:number;
 packetRadius:number;packetGlow:number;cornerRadius:number;minTextGap:number;
}>;
export declare function ep004V3Path(route:PremiumRoute):string;
export declare function ep004V3Point(route:PremiumRoute,progress:number):V3Point;
export declare function ep004V3ValidateLayout():boolean;
export declare function ep004V3Phase(frame:number,props:Ep004Shot01Props):V3State;
export declare function ep004V3Exit(props:Ep004Shot01Props):V3State;
export declare function ep004V3Shot02Entry(exit:V3State):Readonly<{
  worldFrame:number;camera:V3Camera;request:V3Point;
  routeProgress:number;requestStatus:'WAITING'|'IN_TRANSIT';
  standbyHighlight:number;lockedSourceSha256:string;
}>;
