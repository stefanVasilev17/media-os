import {premiumRouteD,premiumRoutePoint,premiumPacketPoint,
 PREMIUM_ROUTE_STYLE} from './ep003-premium-routing.mjs';
const p=(x,y)=>({x,y});
const L=(x,y)=>({type:'L',to:p(x,y)});
const Q=(cx,cy,x,y)=>({type:'Q',control:p(cx,cy),to:p(x,y)});

export const LEGACY_PREMIUM_ROUTES=Object.freeze({
 PRIMARY:Object.freeze({start:p(1497,523),
  segments:[L(1535,523),Q(1549,523,1549,537),L(1549,539),Q(1549,550,1560,550),L(1572,550)]}),
 SAFE_READ_A:Object.freeze({start:p(1425,660),
  segments:[L(1490,660),Q(1502,660,1502,672),L(1502,745),
   Q(1502,757,1514,757),L(1578,757)]}),
 SAFE_READ_B:Object.freeze({start:p(1444,660),
  segments:[L(1478,660),Q(1490,660,1490,672),L(1490,898),
   Q(1490,920,1512,920),L(1578,920)]}),
 REPLICA_A:Object.freeze({start:p(1674,649),
  segments:[L(1674,685),Q(1674,698,1687,698),L(1690,698),L(1690,709)]}),
 REPLICA_B:Object.freeze({start:p(1720,649),
  segments:[L(1818,649),Q(1841,649,1841,672),L(1841,888),
   Q(1841,909,1820,909),L(1803,909)]})
});
export const LEGACY_PREMIUM_STYLE=PREMIUM_ROUTE_STYLE;
export const legacyPremiumPath=name=>premiumRouteD(LEGACY_PREMIUM_ROUTES[name]);
export const legacyPremiumPosition=(name,fraction)=>
 premiumRoutePoint(fraction,LEGACY_PREMIUM_ROUTES[name]);
export const legacyPremiumPacket=(name,frame,speed,offset)=>
 premiumPacketPoint(frame,speed,offset,LEGACY_PREMIUM_ROUTES[name]);
export function validateLegacyPremiumRouting(){
 const end={PRIMARY:p(1572,550),SAFE_READ_A:p(1578,757),SAFE_READ_B:p(1578,920),
  REPLICA_A:p(1690,709),REPLICA_B:p(1803,909)};
 for(const [name,route] of Object.entries(LEGACY_PREMIUM_ROUTES)){
  const last=route.segments.at(-1).to;
  if(last.x!==end[name].x||last.y!==end[name].y)
   throw Error('EP003_LEGACY_PREMIUM_ENDPOINT_INVALID_'+name);
  const svg=premiumRouteD(route);
  if(svg.includes(' C'))throw Error('EP003_LEGACY_LOOSE_CUBIC_REINTRODUCED_'+name);
  for(let i=0;i<=200;i++){
   const pt=premiumRoutePoint(i/200,route);
   if(pt.x<1400||pt.x>1860||pt.y<500||pt.y>970)
    throw Error('EP003_LEGACY_ROUTE_OUTSIDE_SAFE_RAIL_'+name);
  }
 }
 for(let i=0;i<=200;i++){
  const pt=legacyPremiumPosition('REPLICA_B',i/200);
  if(pt.y>=709&&pt.y<=825&&pt.x<1810)
   throw Error('EP003_LEGACY_REPLICA_B_CROSSES_REPLICA_A');
 }
 return true;
}
validateLegacyPremiumRouting();
