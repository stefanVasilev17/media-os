import {premiumRouteD,premiumRoutePoint,PREMIUM_ROUTE_STYLE} from './ep003-premium-routing-v2.mjs';
import {
  EP004_SHOT01_BEATS,EP004_SHOT01_LOCKED_SOURCE_SHA256,
  ep004Shot01Validate
} from './src/components/architectural-thinking/EP004Shot01World.mjs';

export const EP004_V3_LINEAGE=Object.freeze({
  approvedNodeCoordinates:'ep002/Shot02PremiumLayout.ts:SHOT02_NODES',
  premiumRouteImplementation:'ep003-premium-routing-v2.mjs',
  nodeRenderer:'ATPrimaryNode + ATBackendNode',
  lockedSourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  shotKey:'SHOT01',
  renderComposition:'EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL'
});

export const EP004_V3_LAYOUT=Object.freeze({
  client:Object.freeze({x:260,y:190,width:410,height:535}),
  gateway:Object.freeze({x:650,y:410,width:258,height:250}),
  router:Object.freeze({x:927,y:410,width:246,height:250}),
  mailboxFleet:Object.freeze({x:1326,y:315,width:350,height:348}),
  otherServices:Object.freeze({x:1697,y:368,width:252,height:280})
});

const p=(x,y)=>Object.freeze({x,y});
const L=(x,y)=>Object.freeze({type:'L',to:p(x,y)});
const Q=(cx,cy,x,y)=>Object.freeze({
  type:'Q',control:p(cx,cy),to:p(x,y)
});
const route=(start,segments)=>Object.freeze({
  start,segments:Object.freeze(segments)
});

export const EP004_V3_ROUTES=Object.freeze({
  mailbox:route(p(457,713),[
    Q(469,748,508,753),L(563,753),
    Q(617,753,640,694),Q(650,676,650,660)
  ]),
  gatewayToRouter:route(p(779,535),[L(804,535)]),
  routerToFleet:route(p(1050,523),[
    Q(1094,523,1117,493),L(1151,493)
  ]),
  standby:route(p(927,660),[
    L(927,717),Q(927,734,944,734),L(1506,734),
    Q(1571,734,1571,666),L(1571,619)
  ])
});

const clamp=(n)=>Math.max(0,Math.min(1,n));
const ease=(n)=>{const t=clamp(n);return t*t*(3-2*t);};
export const ep004V3Path=(route)=>premiumRouteD(route);
export const ep004V3Point=(route,progress)=>premiumRoutePoint(progress,route);
export const EP004_V3_ROUTE_STYLE=PREMIUM_ROUTE_STYLE;

const storyboardCues=Object.freeze({
  SHOT01_P01_B01:60,
  SHOT01_P01_B02:245,
  SHOT01_P01_B03:470,
  SHOT01_P02_B01:680,
  SHOT01_P02_B02:900,
  SHOT01_P02_B03:1120,
  SHOT01_P03_B01:1430,
  SHOT01_P03_B02:1670
});

export function ep004V3ValidateLayout(){
  const {gateway,router,mailboxFleet,otherServices,client}=EP004_V3_LAYOUT;
  if(gateway.x!==650||gateway.y!==410||gateway.width!==258||gateway.height!==250
    ||router.x!==927||router.y!==410||router.width!==246||router.height!==250
    ||mailboxFleet.x!==1326||mailboxFleet.y!==315
    ||mailboxFleet.width!==350||mailboxFleet.height!==348
    ||otherServices.x!==1697||otherServices.y!==368
    ||otherServices.width!==252||otherServices.height!==280)
    throw Error('EP004_V3_MUST_INHERIT_EXACT_EP002_NODE_COORDINATES');
  const boxes=Object.values(EP004_V3_LAYOUT).map(n=>({
    left:n.x-n.width/2,right:n.x+n.width/2,
    top:n.y,bottom:n.y+n.height
  }));
  for(const a of boxes){
    if(a.left<48||a.right>1890||a.top<120||a.bottom>1030)
      throw Error('EP004_V3_NODE_CLIPS_FRAME');
    for(const b of boxes){
      if(a!==b && a.left<b.right+10&&a.right+10>b.left
        &&a.top<b.bottom+10&&a.bottom+10>b.top)
        throw Error('EP004_V3_NODES_OVERLAP');
    }
  }
  const cport=EP004_V3_ROUTES.mailbox.start;
  const gate=ep004V3Point(EP004_V3_ROUTES.mailbox,1);
  if(Math.abs(cport.x-(client.x+client.width/2))>12
    ||Math.abs(gate.x-gateway.x)>0.001
    ||Math.abs(gate.y-(gateway.y+gateway.height))>0.001)
    throw Error('EP004_V3_MAIL_REQUEST_DETACHED_FROM_NODES');
  const edges=[
    [EP004_V3_ROUTES.gatewayToRouter,779,535,804,535],
    [EP004_V3_ROUTES.routerToFleet,1050,523,1151,493],
    [EP004_V3_ROUTES.standby,927,660,1571,619]
  ];
  for(const [line,x1,y1,x2,y2] of edges){
    const start=ep004V3Point(line,0),end=ep004V3Point(line,1);
    if(start.x!==x1||start.y!==y1||end.x!==x2||end.y!==y2)
      throw Error('EP004_V3_SECONDARY_CONNECTOR_ENDPOINT_INVALID');
  }
  for(const line of Object.values(EP004_V3_ROUTES))
    for(let i=0;i<=100;i++){
      const v=ep004V3Point(line,i/100);
      if(!Number.isFinite(v.x)||!Number.isFinite(v.y)
        ||v.x<48||v.x>1890||v.y<100||v.y>1040)
        throw Error('EP004_V3_ROUTE_OUTSIDE_VIEWPORT');
    }
  return true;
}

export function ep004V3Phase(frame,props){
  ep004Shot01Validate(props);
  if(!Number.isInteger(frame)||frame<0||frame>=props.durationInFrames)
    throw Error('EP004_V3_FRAME_OUTSIDE_SHOT');
  const c=props.previewOnly===true?storyboardCues:props.cueFrames;
  const trigger=(key,length)=>ease((frame-c[key])/length);
  const wait=trigger('SHOT01_P01_B02',128);
  const revealGateway=.33+.67*trigger('SHOT01_P01_B01',115);
  const revealRouter=.20+.80*trigger('SHOT01_P02_B01',150);
  const revealFleet=.16+.78*trigger('SHOT01_P02_B01',185);
  const amber=wait;
  const routeProgress=Math.min(.97,.035+.14*ease(frame/59)
    +.795*ease((frame-c.SHOT01_P01_B01)/
      Math.max(145,c.SHOT01_P01_B02-c.SHOT01_P01_B01+145)));
  const standout=trigger('SHOT01_P02_B02',160);
  const question=trigger('SHOT01_P03_B01',120);
  const handoff=trigger('SHOT01_P03_B02',155);
  const beatFrame=props.worldStartFrame+frame;
  const phaseWave=Math.sin(beatFrame*.042);
  return Object.freeze({
    worldFrame:beatFrame,routeProgress,
    request:ep004V3Point(EP004_V3_ROUTES.mailbox,routeProgress),
    requestStatus:amber>.28?'WAITING':'IN_TRANSIT',
    wait,revealGateway,revealRouter,revealFleet,
    standbyHighlight:standout*.70,
    endpointEcho:trigger('SHOT01_P02_B02',56)*
      (1-trigger('SHOT01_P02_B03',130)),
    question,handoff,
    camera:Object.freeze({
      x:30-56*revealRouter-36*handoff,
      y:14-10*revealRouter-10*handoff,
      scale:1.015-.059*revealRouter-.023*handoff
    }),
    ambiance:phaseWave,
    nextShotWorldFrame:beatFrame+1,
    lockedSourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256
  });
}

export function ep004V3Exit(props){
  return ep004V3Phase(props.durationInFrames-1,props);
}

export function ep004V3Shot02Entry(exit){
  if(!exit||exit.requestStatus!=='WAITING'
    ||!Number.isInteger(exit.worldFrame)
    ||exit.lockedSourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256)
    throw Error('EP004_V3_SHOT02_REQUIRES_EXACT_SHOT01_EXIT');
  return Object.freeze({
    worldFrame:exit.worldFrame+1,
    camera:exit.camera,
    request:exit.request,
    routeProgress:exit.routeProgress,
    requestStatus:exit.requestStatus,
    standbyHighlight:exit.standbyHighlight,
    lockedSourceSha256:exit.lockedSourceSha256
  });
}
ep004V3ValidateLayout();
