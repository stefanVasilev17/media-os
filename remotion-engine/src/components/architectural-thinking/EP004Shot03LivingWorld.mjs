import {
  EP004_SHOT01_LOCKED_SOURCE_SHA256,
  EP004_MAIL_ROUTE,
  EP004_HANDOFF_ROUTE,
  EP004_STANDBY_ROUTE,
  EP004_SPILLOVER_ROUTE,
  EP004_DEGRADED_ROUTE,
  ep004BezierPosition,
  ep004Shot01Exit,
  ep004RequestTraffic,
  ep004FailureSignals,
} from './EP004Shot01World.mjs';

export const EP004_SHOT03_PREDECESSOR=Object.freeze({
  renderId:'20758da0-46f9-4973-9ef8-ec93eb437a5a',
  sourceCommit:'714d7c31affb84793780eee42bc5062387b069a7',
  frameCount:2124,
  lastEncodedFrame:2123,
  worldStartFrame:4123,
  sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
});
export const EP004_SHOT03_STORYBOARD_ONLY=true;
export const EP004_SHOT03_BREATH_FRAMES=60;
export const EP004_SHOT03_ROUTES=Object.freeze({
  OUTLOOK_PRIMARY:Object.freeze([{x:485,y:532},{x:690,y:532},{x:820,y:370},{x:1185,y:370}]),
  PRIMARY_MAILBOX:Object.freeze([{x:1445,y:370},{x:1500,y:370},{x:1595,y:370},{x:1632,y:370}]),
  TEAMS_ALTERNATIVE:Object.freeze([{x:596,y:696},{x:790,y:696},{x:1035,y:696},{x:1185,y:696}]),
  ALTERNATIVE_TEAMS:Object.freeze([{x:1445,y:696},{x:1500,y:696},{x:1595,y:696},{x:1632,y:696}]),
  TEAMS_FAILOVER:Object.freeze([{x:596,y:696},{x:785,y:696},{x:940,y:370},{x:1185,y:370}]),
  PRIMARY_TEAMS:Object.freeze([{x:1445,y:370},{x:1530,y:370},{x:1540,y:696},{x:1632,y:696}]),
});
export const EP004_SHOT03_NODES=Object.freeze({
  primary:Object.freeze({left:1185,top:306,width:260,height:139}),
  alternative:Object.freeze({left:1185,top:638,width:260,height:117}),
  mailbox:Object.freeze({left:1632,top:323,width:209,height:95}),
  teams:Object.freeze({left:1632,top:650,width:209,height:95}),
});
const clamp=n=>Math.min(1,Math.max(0,n));
const ease=n=>{const x=clamp(n);return x*x*(3-2*x);};
const loop=n=>((n%1)+1)%1;
const near=(a,b)=>Math.abs(a-b)<0.000001;
const endpoint=(key,start)=>EP004_SHOT03_ROUTES[key][start?0:3];
export function validateEp004Shot03Storyboard(props){
  if(!props||props.previewOnly!==true
    ||props.episodeKey!=='EP004'||props.shotKey!=='SHOT03'
    ||props.previousRenderId!==EP004_SHOT03_PREDECESSOR.renderId
    ||props.previousSourceCommit!==EP004_SHOT03_PREDECESSOR.sourceCommit
    ||props.previousFrameCount!==EP004_SHOT03_PREDECESSOR.frameCount
    ||props.previousLastEncodedFrame!==EP004_SHOT03_PREDECESSOR.lastEncodedFrame
    ||props.worldStartFrame!==EP004_SHOT03_PREDECESSOR.worldStartFrame
    ||props.sourceSha256!==EP004_SHOT03_PREDECESSOR.sourceSha256
    ||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<420||props.durationInFrames>900
    ||props.directorCpuApproved===true||props.voiceTakeId!=null)
    throw Error('EP004_SHOT03_STORYBOARD_ONLY_REAL_PREDECESSOR_AND_NO_CPU');
  return true;
}
export function validateEp004Shot03Routes(){
  const routes=EP004_SHOT03_ROUTES,n=EP004_SHOT03_NODES;
  for(const [key,points] of Object.entries(routes)){
    if(points.length!==4)throw Error('EP004_SHOT03_ROUTE_MUST_BE_PHYSICAL_CUBIC_'+key);
    for(const point of points){
      if(!Number.isFinite(point.x)||!Number.isFinite(point.y)
        ||point.x<485||point.x>1840||point.y<300||point.y>770)
        throw Error('EP004_SHOT03_ROUTE_OUTSIDE_CANONICAL_WORLD_'+key);
    }
    for(let i=0;i<=100;i++){
      const p=ep004BezierPosition(points,i/100);
      if(p.x<480||p.x>1850||p.y<290||p.y>780)
        throw Error('EP004_SHOT03_BEZIER_DEVIATES_OFF_WORLD_'+key);
    }
  }
  const match=(key,a,b)=>{const p=endpoint(key,a),q=b;if(!near(p.x,q.x)||!near(p.y,q.y))
    throw Error('EP004_SHOT03_DISCONNECTED_ENDPOINT_'+key);};
  match('OUTLOOK_PRIMARY',false,{x:n.primary.left,y:370});
  match('TEAMS_FAILOVER',false,{x:n.primary.left,y:370});
  match('TEAMS_ALTERNATIVE',false,{x:n.alternative.left,y:696});
  match('PRIMARY_MAILBOX',true,{x:n.primary.left+n.primary.width,y:370});
  match('PRIMARY_MAILBOX',false,{x:n.mailbox.left,y:370});
  match('PRIMARY_TEAMS',true,{x:n.primary.left+n.primary.width,y:370});
  match('PRIMARY_TEAMS',false,{x:n.teams.left,y:696});
  match('ALTERNATIVE_TEAMS',true,{x:n.alternative.left+n.alternative.width,y:696});
  match('ALTERNATIVE_TEAMS',false,{x:n.teams.left,y:696});
  for(const [key,node] of Object.entries(n)){
    if(node.left<560||node.left+node.width>1870
      ||node.top<240||node.top+node.height>850)
      throw Error('EP004_SHOT03_NODE_OUTSIDE_SAFE_WORLD_'+key);
  }
  if(n.primary.top+n.primary.height+80>n.alternative.top)
    throw Error('EP004_SHOT03_GATEWAYS_COLLIDE');
  return true;
}
const originalExit=()=>ep004Shot01Exit({
  sourceSha256:EP004_SHOT03_PREDECESSOR.sourceSha256,
  durationInFrames:2001,
  worldStartFrame:0,previewOnly:true,
});
export function ep004Shot03StoryboardWorld(frame,props){
  validateEp004Shot03Storyboard(props);
  if(!Number.isInteger(frame)||frame<0||frame>=props.durationInFrames)
    throw Error('EP004_SHOT03_FRAME_OUTSIDE_STORYBOARD');
  const exit=originalExit();
  const worldFrame=props.worldStartFrame+frame;
  const reveal=ease((frame-EP004_SHOT03_BREATH_FRAMES-38)/110);
  const original=ease((frame-EP004_SHOT03_BREATH_FRAMES)/104);
  const cross=ease((frame-285)/86);
  const shared=ease((frame-325)/100);
  const july=ease((frame-420)/85);
  const selectedOriginal=1-original;
  const oldStage=1;
  const baseState={
    ...exit,worldFrame,
    timeSinceFailover:exit.timeSinceFailover+2123+frame,
    timeSinceSpillover:exit.timeSinceSpillover+2123+frame,
    cameraX:exit.cameraX-30-12,
    cameraScale:exit.cameraScale+.018,
    tension:exit.tension+.09*oldStage+
      .04*Math.sin(worldFrame*.038)**2,
  };
  const cameraX=baseState.cameraX-70*ease((frame-95)/195)
    -29*july;
  const cameraScale=baseState.cameraScale+.023*reveal+.047*july;
  const flow=(key,color,count,speed,visibility,kind)=>{
    const tokens=[];
    for(let i=0;i<count;i++){
      const phase=loop(worldFrame*speed+i/count+.11);
      const position=ep004BezierPosition(EP004_SHOT03_ROUTES[key],phase);
      const gate=clamp(Math.min(phase,1-phase)*16);
      tokens.push(Object.freeze({id:key+'-'+i,route:key,color,kind,
        x:position.x,y:position.y,progress:phase,
        opacity:clamp(visibility)*gate,radius:color==='VIOLET'?4:3.6}));
    }
    return tokens;
  };
  const tokens=[
    ...flow('OUTLOOK_PRIMARY','CYAN',4,.0036,reveal,'OUTLOOK'),
    ...flow('PRIMARY_MAILBOX','CYAN',2,.0042,reveal,'OUTLOOK'),
    ...flow('TEAMS_ALTERNATIVE','VIOLET',4,.0031,reveal*(1-cross),'TEAMS'),
    ...flow('ALTERNATIVE_TEAMS','VIOLET',2,.0037,reveal*(1-cross),'TEAMS'),
    ...flow('TEAMS_FAILOVER','VIOLET',5,.0031,reveal*cross,'TEAMS'),
    ...flow('PRIMARY_TEAMS','VIOLET',3,.0037,reveal*cross,'TEAMS'),
  ];
  return Object.freeze({
    frame,worldFrame,
    cameraX,cameraScale,
    originalOpacity:selectedOriginal,
    gatewayReveal:reveal,redirect:cross,sharedLoad:shared,
    julyMarker:july,
    utcStamp:ease((frame-286)/22)*(1-july*.45),
    originalState:Object.freeze({
      ...baseState,
      traffic:ep004RequestTraffic(baseState),
      diagnostics:ep004FailureSignals(baseState),
    }),
    tokens:Object.freeze(tokens),
    firstFrameIsSourceWorld:frame===0,
    transitionsAreEditorialStoryboard:true,
    isVoiceAligned:false,
  });
}
validateEp004Shot03Routes();
