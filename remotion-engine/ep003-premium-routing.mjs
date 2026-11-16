export const PREMIUM_ROUTING_VERSION='EP003_PREMIUM_ROUTING_V1';
export const PREMIUM_ROUTE_STYLE=Object.freeze({
 railWidth:5.4,
 activeWidth:2.6,
 quietOpacity:.25,
 activeOpacity:.82,
 packetRadius:3.7,
 packetGlow:5,
 cornerRadius:12,
 minTextGap:14,
});
const p=(x,y)=>({x,y});
const L=(x,y)=>({type:'L',to:p(x,y)});
const Q=(cx,cy,x,y)=>({type:'Q',control:p(cx,cy),to:p(x,y)});
export const PREMIUM_ROUTES=Object.freeze({
 AUTH_A:Object.freeze({
  start:p(1460,523),
  segments:[L(1574,523)],
 }),
 AUTH_B:Object.freeze({
  start:p(1460,523),
  segments:[L(1490,523),Q(1502,523,1502,511),L(1502,396),
   Q(1502,384,1514,384),L(1684,384),Q(1696,384,1696,396),
   L(1696,511),Q(1696,523,1708,523),L(1738,523)],
 }),
 REPLICA_A:Object.freeze({
  start:p(1606,667),
  segments:[L(1606,678),Q(1606,690,1618,690),L(1678,690),
   Q(1690,690,1690,702),L(1690,709)],
 }),
 REPLICA_B:Object.freeze({
  start:p(1771,667),
  segments:[L(1818,667),Q(1842,667,1842,691),L(1842,895),
   Q(1842,909,1828,909),L(1803,909)],
 }),
 RECOVERY_A:Object.freeze({
  start:p(1460,523),
  segments:[L(1470,523),Q(1482,523,1482,535),L(1482,763),
   Q(1482,775,1494,775),L(1578,775)],
 }),
});
const round=n=>Number(n.toFixed(4));
export const premiumRouteEnd=route=>route.segments.at(-1).to;
export function premiumRouteD(route){
 let d='M'+route.start.x+' '+route.start.y;
 for(const s of route.segments){
  if(s.type==='L')d+=' L'+s.to.x+' '+s.to.y;
  else d+=' Q'+s.control.x+' '+s.control.y+' '+s.to.x+' '+s.to.y;
 }
 return d;
}
const at=(a,s,t)=>{
 if(s.type==='L')return p(a.x+(s.to.x-a.x)*t,a.y+(s.to.y-a.y)*t);
 const q=1-t;
 return p(q*q*a.x+2*q*t*s.control.x+t*t*s.to.x,
          q*q*a.y+2*q*t*s.control.y+t*t*s.to.y);
};
function routeSamples(route){
 const samples=[{point:route.start,length:0}];
 let current=route.start,total=0;
 for(const segment of route.segments){
  let prev=current;
  const resolution=segment.type==='Q'?40:1;
  for(let j=1;j<=resolution;j++){
   const next=at(current,segment,j/resolution);
   total+=Math.hypot(next.x-prev.x,next.y-prev.y);
   samples.push({point:next,length:total});
   prev=next;
  }
  current=segment.to;
 }
 if(total<=0)throw Error('EP003_PREMIUM_ROUTE_HAS_ZERO_LENGTH');
 return {samples,total};
}
const precomputed=new Map(Object.values(PREMIUM_ROUTES).map(r=>[r,routeSamples(r)]));
export function premiumRoutePoint(t,route){
 const tab=precomputed.get(route)||routeSamples(route);
 const fraction=Math.max(0,Math.min(1,t));
 const target=fraction*tab.total;
 if(fraction===0)return {...route.start};
 if(fraction===1)return {...premiumRouteEnd(route)};
 const list=tab.samples;
 let lo=0,hi=list.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(list[mid].length<target)lo=mid;else hi=mid;}
 const a=list[lo],b=list[hi];
 const t2=(target-a.length)/Math.max(.000001,b.length-a.length);
 return p(round(a.point.x+(b.point.x-a.point.x)*t2),
  round(a.point.y+(b.point.y-a.point.y)*t2));
}
export function premiumPacketPoint(frame,speed,offset,route){
 const t=((frame*speed+offset)%1+1)%1;
 const point=premiumRoutePoint(t,route);
 const opacity=Math.min(1,t*10,(1-t)*10);
 return {...point,opacity,t};
}
export function validatePremiumRoutes(){
 const expected={
  AUTH_A:p(1574,523),AUTH_B:p(1738,523),
  REPLICA_A:p(1690,709),REPLICA_B:p(1803,909),
  RECOVERY_A:p(1578,775)
 };
 for(const [name,route] of Object.entries(PREMIUM_ROUTES)){
  const last=premiumRouteEnd(route),target=expected[name];
  if(last.x!==target.x||last.y!==target.y)throw Error('EP003_ROUTE_BAD_ENDPOINT_'+name);
  if(route.start.x<1450||route.start.y<370)throw Error('EP003_ROUTE_BAD_START_'+name);
  for(let i=0;i<=200;i++){
   const point=premiumRoutePoint(i/200,route);
   if(point.x<1450||point.x>1860||point.y<375||point.y>970)
    throw Error('EP003_ROUTE_OUTSIDE_ARCHITECTURE_'+name);
  }
 }
 for(const id of ['REPLICA_A','REPLICA_B']){
  const route=PREMIUM_ROUTES[id];
  if(route.start.y<=650)throw Error('EP003_ROUTE_OVER_OWNER_LABEL_'+id);
 }
 for(let i=0;i<=199;i++){
  const q=premiumRoutePoint(i/200,PREMIUM_ROUTES.REPLICA_B);
  if(q.y>=709&&q.y<=825&&q.x<=1819)
   throw Error('EP003_REPLICA_B_ROUTE_CROSSES_REPLICA_A_CARD');
 }
 return true;
}
validatePremiumRoutes();
