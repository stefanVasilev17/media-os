import {PREMIUM_ROUTES,PREMIUM_ROUTE_STYLE,premiumRouteD,
 premiumRoutePoint,premiumPacketPoint,validatePremiumRoutes}
 from '../../../ep003-premium-routing.mjs';
import type {PremiumRoute} from '../../../ep003-premium-routing.mjs';

export const EP003_SHOT10_ROUTING_STANDARD='EP003_PREMIUM_ROUTING_V1';
export const SHOT10_PREMIUM_ROUTES=PREMIUM_ROUTES;
export const SHOT10_PREMIUM_STYLE=PREMIUM_ROUTE_STYLE;
export function shot10PremiumRouteD(route:PremiumRoute){
 validatePremiumRoutes();
 return premiumRouteD(route);
}
export function shot10PremiumRequest(frame:number,route:PremiumRoute,index=0){
 validatePremiumRoutes();
 return premiumPacketPoint(frame,.007,index*.5,route);
}
export function shot10PremiumPathPosition(route:PremiumRoute,t:number){
 validatePremiumRoutes();
 return premiumRoutePoint(t,route);
}
