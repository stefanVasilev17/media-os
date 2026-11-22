export const EP004_SHOT05_CINEMATIC_GRAMMAR='GATEWAY_XRAY_DIRECTOR_V2';
const freezePoints=points=>Object.freeze(points.map(([x,y])=>Object.freeze({x,y})));
export const EP004_SHOT05_XRAY_ROUTES=Object.freeze({
  OUTLOOK_PRIMARY:freezePoints([[385,392],[545,392],[619,440],[759,440]]),
  PRIMARY_MAILBOX:freezePoints([[1161,440],[1300,440],[1340,399],[1451,399]]),
  TEAMS_ALTERNATIVE:freezePoints([[385,735],[560,735],[608,848],[787,848]]),
  ALTERNATIVE_TEAMS:freezePoints([[1137,848],[1330,848],[1340,704],[1451,704]]),
  TEAMS_FAILOVER:freezePoints([[385,735],[577,735],[600,567],[759,567]]),
  PRIMARY_TEAMS:freezePoints([[1161,567],[1325,567],[1360,704],[1451,704]]),
});
const clamp=n=>Math.min(1,Math.max(0,n));
const ease=n=>{const x=clamp(n);return x*x*(3-2*x);};
const lerp=(a,b,t)=>a+(b-a)*t;
const CAMERA=Object.freeze({
  WIDE:Object.freeze({x:0,y:0,scale:1.0}),
  MAIL:Object.freeze({x:-102,y:20,scale:1.18}),
  TEAMS:Object.freeze({x:68,y:-18,scale:1.16}),
  SHARED:Object.freeze({x:-92,y:48,scale:1.27}),
  DEGRADED:Object.freeze({x:-125,y:50,scale:1.29}),
  SWITCH:Object.freeze({x:30,y:-52,scale:1.16}),
  ALTERNATIVE:Object.freeze({x:80,y:-38,scale:1.19}),
  CONSEQUENCE:Object.freeze({x:0,y:-20,scale:1.08})
});
const scene=(key,title,subtitle,paths,nodes,camera,accent)=>Object.freeze({
  key,title,subtitle,paths:Object.freeze(paths),nodes:Object.freeze(nodes),camera,accent
});
export function ep004Shot05CinematicStage(direction,index=0){
  const d=String(direction||'').toLowerCase();
  if(/failover|rerout|redirect|moves? to (the )?primary|shift|switch|spillover/.test(d))
    return scene('SWITCH','THE ROUTE CHANGES','TEAMS moves between the established gateway paths.',
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS','TEAMS_FAILOVER','PRIMARY_TEAMS'],
      ['teamsClient','alternative','primary','teamsService'],'SWITCH','VIOLET');
  if(/fail|outage|degrad|down|unavailable|broken|interrupted|error/.test(d))
    return scene('DEGRADED','THE PATH IS CONSTRAINED','The dependency changes what can complete.',
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'],
      ['primary'],'DEGRADED','AMBER');
  if(/shared|converge|bottleneck|pressure|both|same gateway|one gateway|capacity/.test(d))
    return scene('SHARED','A SHARED GATEWAY','Two workloads now depend on one routing boundary.',
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'],
      ['outlookClient','teamsClient','primary'],'SHARED','MINT');
  if(/july|configuration|policy|routing rule|route table/.test(d))
    return scene('CONFIG','THE ROUTING DECISION','Configuration determines which boundary receives the traffic.',
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS','TEAMS_FAILOVER','PRIMARY_TEAMS'],
      ['alternative','primary'],'SWITCH','VIOLET');
  if(/alternative|independent|backup|secondary|standby/.test(d))
    return scene('ALTERNATIVE','AN INDEPENDENT ROUTE','Teams uses the alternative gateway boundary.',
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS'],
      ['teamsClient','alternative','teamsService'],'ALTERNATIVE','VIOLET');
  if(/exchange|outlook|mailbox|mail/.test(d))
    return scene('MAIL','FOLLOW THE MAIL REQUEST','Outlook passes through Primary to Exchange Online.',
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX'],
      ['outlookClient','primary','mailbox'],'MAIL','CYAN');
  if(/teams|collaboration/.test(d))
    return scene('TEAMS','FOLLOW THE TEAMS REQUEST','A separate workload reaches the Teams service.',
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS'],
      ['teamsClient','alternative','teamsService'],'TEAMS','VIOLET');
  if(/consequence|result|therefore|impact|finally|means|dependenc/.test(d))
    return scene('CONSEQUENCE','THE CONSEQUENCE','The route determines which dependency is shared.',
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'],
      ['primary','mailbox','teamsService'],'CONSEQUENCE','MINT');
  return index===0
    ?scene('ENTRY','INSIDE THE GATEWAY','Follow the request through the routing boundary.',
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX'],
      ['outlookClient','primary','mailbox'],'MAIL','CYAN')
    :scene('CONSEQUENCE','FOLLOW THE DEPENDENCY','Watch where the approved route sends the work.',
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX'],
      ['primary','mailbox'],'CONSEQUENCE','MINT');
}
export function ep004Shot05XrayPosition(points,t){
  if(!Array.isArray(points)||points.length!==4||!Number.isFinite(t))
    throw Error('EP004_SHOT05_XRAY_FINITE_CUBIC_REQUIRED');
  const u=1-clamp(t),v=clamp(t);
  return Object.freeze({
    x:u*u*u*points[0].x+3*u*u*v*points[1].x+3*u*v*v*points[2].x+v*v*v*points[3].x,
    y:u*u*u*points[0].y+3*u*u*v*points[1].y+3*u*v*v*points[2].y+v*v*v*points[3].y,
  });
}
export function ep004Shot05XrayPath(points){
  if(!Array.isArray(points)||points.length!==4)
    throw Error('EP004_SHOT05_XRAY_CUBIC_PATH_REQUIRED');
  return 'M '+points[0].x+' '+points[0].y+
    ' C '+points[1].x+' '+points[1].y+','+
      points[2].x+' '+points[2].y+','+
      points[3].x+' '+points[3].y;
}
export function ep004Shot05CinematicState(frame,cues,beats,duration){
  if(!Number.isInteger(frame)||frame<0||!Number.isInteger(duration)
      ||frame>=duration||!Array.isArray(cues)||!Array.isArray(beats)
      ||cues.length!==beats.length||cues.length<2)
    throw Error('EP004_SHOT05_CINEMATIC_VERIFIED_TIMELINE_REQUIRED');
  let index=-1;
  for(let i=0;i<cues.length;i++)
    if(frame>=cues[i].startFrame)index=i;
  const cue=index>=0?cues[index]:null;
  const stage=index>=0?ep004Shot05CinematicStage(beats[index].direction,index)
    :ep004Shot05CinematicStage('',0);
  const preceding=index>=1?ep004Shot05CinematicStage(beats[index-1].direction,index-1):null;
  const beatStart=cue?cue.startFrame:72;
  const nextStart=index>=0&&index+1<cues.length?cues[index+1].startFrame:duration;
  const time=Math.max(0,frame-beatStart);
  const available=nextStart-beatStart;
  const from=preceding?CAMERA[preceding.camera]:CAMERA.WIDE;
  const target=CAMERA[stage.camera];
  const firstDuration=Math.max(24,Math.min(66,Math.floor(available*.38)));
  const progress=index>=0?ease(time/firstDuration):0;
  const settle=available>=215?ease((time-118)/64):0;
  const camera=Object.freeze({
    x:lerp(from.x,target.x,progress)+settle*14,
    y:lerp(from.y,target.y,progress)+settle*7,
    scale:lerp(from.scale,target.scale,progress)+settle*.018,
  });
  const interiorOpacity=ease((frame-36)/70);
  const sourceOpacity=1-ease((frame-24)/86);
  const sourcePush=1+1.16*ease((frame-24)/102);
  const stageAppear=index>=0?ease(time/35):0;
  const routeProgress=index>=0?ease((time-12)/100):0;
  const actionProgress=index>=0?ease((time-54)/112):0;
  const captionOpacity=index>=0?ease(time/22):0;
  return Object.freeze({
    frame,beatIndex:index,stage,beatAge:time,
    sourceOpacity,sourcePush,interiorOpacity,stageAppear,
    routeProgress,actionProgress,captionOpacity,camera,
    sceneFullyRevealed:frame>=106,
    spoke:frame>=72,beatDuration:available
  });
}
export function validateEp004Shot05XrayRoutes(){
  const entries=Object.entries(EP004_SHOT05_XRAY_ROUTES);
  if(entries.length!==6)throw Error('SHOT05_CANONICAL_ROUTE_SET_REQUIRED');
  for(const [key,points] of entries){
    if(points.length!==4)throw Error('SHOT05_INVALID_CUBIC_'+key);
    for(let i=0;i<=100;i++){
      const p=ep004Shot05XrayPosition(points,i/100);
      if(!Number.isFinite(p.x)||!Number.isFinite(p.y)
        ||p.x<120||p.x>1790||p.y<320||p.y>910)
        throw Error('SHOT05_XRAY_PATH_OUTSIDE_WORLD_'+key);
    }
  }
  const eq=(a,b)=>Math.abs(a.x-b.x)<.001&&Math.abs(a.y-b.y)<.001;
  const starts={
    OUTLOOK_PRIMARY:{x:385,y:392},PRIMARY_MAILBOX:{x:1161,y:440},
    TEAMS_ALTERNATIVE:{x:385,y:735},ALTERNATIVE_TEAMS:{x:1137,y:848},
    TEAMS_FAILOVER:{x:385,y:735},PRIMARY_TEAMS:{x:1161,y:567},
  };
  for(const [key,point] of Object.entries(starts))
    if(!eq(EP004_SHOT05_XRAY_ROUTES[key][0],point))
      throw Error('SHOT05_XRAY_PHYSICAL_ROUTE_START_'+key);
  return true;
}
