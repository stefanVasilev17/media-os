export const EP004_SHOT05_CLARITY_GRAMMAR='SOFT_ROUTE_REVEAL_V6';
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const interpolate=(a,b,t)=>a+(b-a)*t;
export const EP004_SHOT05_SAFE_FRAME=Object.freeze({
  left:128,right:1792,top:72,bottom:923
});
export const EP004_SHOT05_NODES=Object.freeze({
  outlook:Object.freeze({x:168,y:351,w:300,h:106,title:'OUTLOOK APP',font:27}),
  teams:Object.freeze({x:168,y:692,w:300,h:106,title:'TEAMS APP',font:29}),
  primary:Object.freeze({x:726,y:328,w:468,h:242,title:'PRIMARY GATEWAY',font:35}),
  alternative:Object.freeze({x:726,y:669,w:468,h:242,title:'ALTERNATIVE GATEWAY',font:29}),
  exchange:Object.freeze({x:1408,y:351,w:368,h:106,title:'EXCHANGE ONLINE',font:27}),
  teamsService:Object.freeze({x:1408,y:692,w:368,h:106,title:'TEAMS SERVICE',font:27}),
});
// Sample each rounded corner once: drawing and motion share identical geometry.
const roundedTrack=(from,to,vertices)=>{
  const pts=[vertices[0]];
  for(let i=1;i<vertices.length-1;i++){
    const a=vertices[i-1],b=vertices[i],c=vertices[i+1];
    const before=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const after=Math.hypot(c[0]-b[0],c[1]-b[1]);
    const radius=Math.min(24,before*.48,after*.48);
    const p=[b[0]+(a[0]-b[0])*radius/before,b[1]+(a[1]-b[1])*radius/before];
    const q=[b[0]+(c[0]-b[0])*radius/after,b[1]+(c[1]-b[1])*radius/after];
    pts.push(p);
    for(let j=1;j<=12;j++){
      const t=j/12,u=1-t;
      pts.push([u*u*p[0]+2*u*t*b[0]+t*t*q[0],u*u*p[1]+2*u*t*b[1]+t*t*q[1]]);
    }
  }
  pts.push(vertices.at(-1));
  const segments=Object.freeze(pts.map(p=>Object.freeze([...p])));
  return Object.freeze({from,to,segments,start:segments[0],end:segments.at(-1),
    path:segments.map((p,i)=>(i?'L ':'M ')+p.join(' ')).join(' ')});
};
export const EP004_SHOT05_TRACKS=Object.freeze({
  OUTLOOK_PRIMARY:Object.freeze({from:'outlook',to:'primary',
    path:'M 468 404 H 726',start:Object.freeze([468,404]),end:Object.freeze([726,404]),
    segments:Object.freeze([[468,404],[726,404]])}),
  PRIMARY_MAILBOX:Object.freeze({from:'primary',to:'exchange',
    path:'M 1194 404 H 1408',start:Object.freeze([1194,404]),end:Object.freeze([1408,404]),
    segments:Object.freeze([[1194,404],[1408,404]])}),
  TEAMS_ALTERNATIVE:Object.freeze({from:'teams',to:'alternative',
    path:'M 468 745 H 726',start:Object.freeze([468,745]),end:Object.freeze([726,745]),
    segments:Object.freeze([[468,745],[726,745]])}),
  ALTERNATIVE_TEAMS:Object.freeze({from:'alternative',to:'teamsService',
    path:'M 1194 745 H 1408',start:Object.freeze([1194,745]),end:Object.freeze([1408,745]),
    segments:Object.freeze([[1194,745],[1408,745]])}),
  TEAMS_FAILOVER:roundedTrack('teams','primary',[[468,745],[574,745],[594,725],[594,515],[614,495],[726,495]]),
  PRIMARY_TEAMS:roundedTrack('primary','teamsService',[[1194,495],[1292,495],[1312,515],[1312,725],[1332,745],[1408,745]]),
});
const weighted=ch=>{
  if(ch===' ')return .33;
  if('MW'.includes(ch))return .93;
  if('I1'.includes(ch))return .39;
  if('JLT'.includes(ch))return .60;
  if('.,:!|'.includes(ch))return .32;
  if('%'.includes(ch))return .94;
  return .72;
};
export function ep004Shot05MeasuredTextWidth(text,font){
  if(typeof text!=='string'||typeof font!=='number'||font<20||font>90)
    throw Error('SHOT05_TEXT_MEASUREMENT_INPUT_INVALID');
  return Math.ceil([...text].reduce((sum,ch)=>sum+weighted(ch)*font,0)*1.09);
}
export function ep004Shot05TextBox(label,font=47,padding=52){
  const width=ep004Shot05MeasuredTextWidth(label,font)+padding*2;
  const height=Math.ceil(font*1.25)+46;
  if(width>1560)throw Error('SHOT05_HEADLINE_EXCEEDS_SAFE_FRAME');
  return Object.freeze({text:label,font,padding,width,height,
    x:Math.round((1920-width)/2),y:68});
}
export function validateEp004Shot05SafeLayout(){
  const seen=Object.values(EP004_SHOT05_NODES);
  for(const [key,node] of Object.entries(EP004_SHOT05_NODES)){
    const width=ep004Shot05MeasuredTextWidth(node.title,node.font)+54;
    if(width>node.w)throw Error('SHOT05_LABEL_MUST_FIT_'+key+'_'+width);
    if(node.x<EP004_SHOT05_SAFE_FRAME.left||node.y<252
      ||node.x+node.w>EP004_SHOT05_SAFE_FRAME.right
      ||node.y+node.h>EP004_SHOT05_SAFE_FRAME.bottom)
      throw Error('SHOT05_NODE_OUTSIDE_FRAME_'+key);
  }
  for(let i=0;i<seen.length;i++)for(let j=i+1;j<seen.length;j++){
    const a=seen[i],b=seen[j];
    if(a.x<b.x+b.w+20&&a.x+a.w+20>b.x
      &&a.y<b.y+b.h+20&&a.y+a.h+20>b.y)
      throw Error('SHOT05_NODE_COLLISION_'+i+'_'+j);
  }
  for(const [key,track] of Object.entries(EP004_SHOT05_TRACKS)){
    if(!EP004_SHOT05_NODES[track.from]||!EP004_SHOT05_NODES[track.to]
      ||track.segments.some(([x,y])=>x<160||x>1760||y<280||y>845))
      throw Error('SHOT05_ROUTE_OUTSIDE_SAFE_GEOMETRY_'+key);
    const from=EP004_SHOT05_NODES[track.from];
    const to=EP004_SHOT05_NODES[track.to];
    if(track.start[0]!==from.x+from.w||track.end[0]!==to.x)
      throw Error('SHOT05_ROUTE_NOT_ANCHORED_TO_NODES_'+key);
  }
  for(const title of [
    'FOLLOW THE MAIL REQUEST','FOLLOW THE TEAMS REQUEST',
    'ONE GATEWAY, TWO WORKLOADS','HEADROOM DROPS','14% CAPACITY LOST',
    'NEW REQUESTS CHANGE PATH','THE SHARED DEPENDENCY',
    'AN INDEPENDENT PATH','THE SYSTEM CONSEQUENCE',
    'FOLLOW THE REQUEST'
  ])ep004Shot05TextBox(title);
  return true;
}
const stage=(key,headline,accent,visible,lanes,primaryStatus=null)=>Object.freeze({
  key,headline,accent,visible:Object.freeze(visible),
  lanes:Object.freeze(lanes),primaryStatus
});
export function ep004Shot05ClarityStage(direction,index=0,anchor=''){
  const d=String(direction||'').toLowerCase();
  const spoken=(d+' '+String(anchor||'').toLowerCase());
  if(/fourteen percent|14\s?%|14 percent/.test(spoken))
    return stage('CAPACITY_14','14% CAPACITY LOST','AMBER',
      ['primary','outlook','teams','exchange','teamsService'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'], '14%');
  if(/capacity|headroom|remaining|reduced|missing|deplet|constrain|shortage/.test(d))
    return stage('CAPACITY','HEADROOM DROPS','AMBER',
      ['primary','outlook','teams','exchange','teamsService'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'], 'REDUCED');
  if(/failover|rerout|redirect|moves? to (the )?primary|shift|switch|spillover|july|configuration|policy|route table/.test(d))
    return stage('SWITCH','NEW REQUESTS CHANGE PATH','VIOLET',
      ['teams','alternative','primary','teamsService'],
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS','TEAMS_FAILOVER','PRIMARY_TEAMS']);
  if(/fail|outage|degrad|down|unavailable|broken|interrupt|error/.test(d))
    return stage('DEGRADED','THE SHARED DEPENDENCY','AMBER',
      ['primary','outlook','teams','exchange','teamsService'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'], 'REDUCED');
  if(/shared|converge|bottleneck|pressure|both|same gateway|one gateway/.test(d))
    return stage('SHARED','ONE GATEWAY, TWO WORKLOADS','MINT',
      ['outlook','teams','primary','exchange','teamsService'],
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS']);
  if(/alternative|independent|backup|secondary|standby/.test(d))
    return stage('ALTERNATIVE','AN INDEPENDENT PATH','VIOLET',
      ['teams','alternative','teamsService'],
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS']);
  if(/exchange|outlook|mailbox|mail/.test(d))
    return stage('MAIL','FOLLOW THE MAIL REQUEST','CYAN',
      ['outlook','primary','exchange'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX']);
  if(/teams|collaboration/.test(d))
    return stage('TEAMS','FOLLOW THE TEAMS REQUEST','VIOLET',
      ['teams','alternative','teamsService'],
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS']);
  if(/consequence|result|therefore|impact|finally|means|dependenc/.test(d))
    return stage('CONSEQUENCE','THE SYSTEM CONSEQUENCE','MINT',
      ['outlook','teams','primary','exchange','teamsService'],
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS']);
  if(/gateway|routing|route|request|traffic/.test(d))
    return stage('PRIMARY','FOLLOW THE REQUEST','CYAN',
      ['outlook','primary','exchange'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX']);
  return index===0
    ?stage('PRIMARY','FOLLOW THE REQUEST','CYAN',
      ['outlook','primary','exchange'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX'])
    :stage('CONSEQUENCE','THE SHARED DEPENDENCY','MINT',
      ['outlook','teams','primary','exchange','teamsService'],
      ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS']);
}

export const EP004_SHOT05_MIGRATION_FRAMES=72;
export const EP004_SHOT05_PACKET_INTERVAL=18;
const routePoints=(incoming,outgoing)=>Object.freeze([
  ...EP004_SHOT05_TRACKS[incoming].segments,
  ...EP004_SHOT05_TRACKS[outgoing].segments
].map(p=>Object.freeze([...p])));
export const EP004_SHOT05_PACKET_ROUTES=Object.freeze({
  MAIL:routePoints('OUTLOOK_PRIMARY','PRIMARY_MAILBOX'),
  OLD:routePoints('TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS'),
  NEW:routePoints('TEAMS_FAILOVER','PRIMARY_TEAMS')
});
const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const length=points=>points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0);
export function ep004Shot05SamplePacket(route,d){
  const points=EP004_SHOT05_PACKET_ROUTES[route];
  if(!points||d<0||d>length(points))return null;
  let remaining=d;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],l=distance(a,b);
    if(remaining<=l||i===points.length-1){
      const t=l===0?0:clamp(remaining/l);
      return {x:interpolate(a[0],b[0],t),y:interpolate(a[1],b[1],t),
        angle:Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI};
    }
    remaining-=l;
  }
  return null;
}
export function ep004Shot05Migration(frame,cues,beats){
  const stages=cues.map((cue,i)=>ep004Shot05ClarityStage(beats[i].direction,i,cue.anchor));
  const capacityIndex=stages.findIndex(s=>s.key==='CAPACITY'||s.key==='CAPACITY_14');
  // A capacity-only cue is not a rerouting command. The selected Take still owns onset.
  const routeIndex=stages.findIndex(s=>s.key==='SWITCH'||s.key==='SHARED');
  const capacityFrame=capacityIndex<0?null:cues[capacityIndex].startFrame;
  const rerouteFrame=routeIndex<0?null:cues[routeIndex].startFrame;
  const ratioAt=f=>rerouteFrame===null?0:smooth((f-rerouteFrame)/EP004_SHOT05_MIGRATION_FRAMES);
  const pressure=capacityFrame===null?0:smooth((frame-capacityFrame)/54);
  const thresholdAt=born=>{const index=Math.round(born/EP004_SHOT05_PACKET_INTERVAL);return ((index*3%7+7)%7+.5)/7;};
  let firstNewEmission=null;
  if(rerouteFrame!==null){
    const first=Math.floor((rerouteFrame-8)/EP004_SHOT05_PACKET_INTERVAL)*EP004_SHOT05_PACKET_INTERVAL;
    for(let born=first;born<=rerouteFrame+EP004_SHOT05_MIGRATION_FRAMES+EP004_SHOT05_PACKET_INTERVAL;born+=EP004_SHOT05_PACKET_INTERVAL){
      if(thresholdAt(born)<ratioAt(born+8)){firstNewEmission=born+8;break;}
    }
  }
  const ingressLength=length(EP004_SHOT05_TRACKS.TEAMS_FAILOVER.segments);
  const coreLength=EP004_SHOT05_NODES.primary.w;
  const egressLength=length(EP004_SHOT05_TRACKS.PRIMARY_TEAMS.segments);
  const revealAge=firstNewEmission===null?-1:frame-firstNewEmission;
  const revealFront=revealAge<0?0:revealAge*8.4+Math.min(40,revealAge*5);
  const ingressReveal=clamp(revealFront/ingressLength);
  const coreReveal=clamp((revealFront-ingressLength)/coreLength);
  const egressReveal=clamp((revealFront-ingressLength-coreLength)/egressLength);
  const packets=[];
  const earliest=Math.max(-180,Math.floor((frame-300)/EP004_SHOT05_PACKET_INTERVAL)*EP004_SHOT05_PACKET_INTERVAL);
  for(let born=earliest;born<=frame;born+=EP004_SHOT05_PACKET_INTERVAL){
    // Stable per-emission decision; never reassign a packet in flight.
    const teamRoute=thresholdAt(born)<ratioAt(born+8)?'NEW':'OLD';
    for(const [route,offset] of [['MAIL',0],[teamRoute,8]]){
      const emission=born+offset;
      if(emission>frame)continue;
      // Constant world-space speed guarantees continuity at joins and cue boundaries.
      const travel=(frame-emission)*8.4;
      const pos=ep004Shot05SamplePacket(route,travel);
      if(!pos)continue;
      const total=length(EP004_SHOT05_PACKET_ROUTES[route]);
      const opacity=Math.min(1,travel/18,(total-travel)/18);
      if(opacity>0)packets.push(Object.freeze({id:route+'-'+born,route,born:emission,
        ...pos,opacity,travel}));
    }
  }
  const primaryWeight=ratioAt(frame);
  let drain=1;
  if(rerouteFrame!==null){
    const lastPossibleOldArrival=rerouteFrame+EP004_SHOT05_MIGRATION_FRAMES+
      length(EP004_SHOT05_PACKET_ROUTES.OLD)/8.4;
    drain=1-smooth((frame-lastPossibleOldArrival)/36);
  }
  const oldStrength=Math.max(1-primaryWeight,.52*drain);
  const newStrength=primaryWeight;
  const explicit14=stages.some((s,i)=>s.key==='CAPACITY_14'&&cues[i].startFrame<=frame);
  return Object.freeze({primaryWeight,legacyWeight:1-primaryWeight,pressure,
    rerouteFrame,capacityFrame,explicit14,oldStrength,newStrength,firstNewEmission,ingressReveal,coreReveal,egressReveal,packets:Object.freeze(packets)});
}

export function ep004Shot05ClarityState(frame,cues,beats,duration){
  if(!Number.isInteger(frame)||!Number.isInteger(duration)
    ||frame<0||frame>=duration||!Array.isArray(cues)||!Array.isArray(beats)
    ||cues.length<2||cues.length!==beats.length)
    throw Error('SHOT05_REAL_CUE_TIMELINE_REQUIRED');
  const idx=cues.reduce((i,c,j)=>frame>=c.startFrame?j:i,-1);
  const current=idx>=0?ep004Shot05ClarityStage(
    beats[idx].direction,idx,cues[idx].anchor):ep004Shot05ClarityStage('',0);
  const prev=idx>0?ep004Shot05ClarityStage(
    beats[idx-1].direction,idx-1,cues[idx-1].anchor):null;
  const start=idx>=0?cues[idx].startFrame:72;
  const next=idx>=0&&idx+1<cues.length?cues[idx+1].startFrame:duration;
  const age=Math.max(0,frame-start);
  const available=next-start;
  const stageTransition=idx>=0?smooth(age/30):0;
  const sourceOpacity=1-smooth((frame-1)/80);
  const interiorOpacity=smooth((frame-23)/85);
  const headlineOpacity=idx>=0?interiorOpacity*smooth((age-(idx>0?15:0))/22):0;
  const previousHeadlineOpacity=idx>0?interiorOpacity*(1-smooth(age/15)):0;
  const flowActivation=idx>=0?smooth((age-14)/58):0;
  const secondLaneActivation=idx>=0?smooth((age-84)/72):0;
  const switchActivation=idx>=0?smooth((age-55)/118):0;
  const camera=Object.freeze({x:0,y:0,scale:1});
  const migration=ep004Shot05Migration(frame,cues,beats);
  const seen=new Set();
  for(let i=0;i<=Math.max(0,idx);i++){
    const st=ep004Shot05ClarityStage(beats[i]?.direction??'',i,cues[i]?.anchor??'');
    for(const node of st.visible)seen.add(node);
  }
  const firstHeader=ep004Shot05TextBox(current.headline);
  return Object.freeze({
    frame,beatIndex:idx,stage:current,previousStage:prev,age,
    camera,migration,sourceOpacity,interiorOpacity,headlineOpacity,
    previousHeadlineOpacity,stageTransition,flowActivation,
    secondLaneActivation,switchActivation,
    headerBox:firstHeader,visibleHistory:Object.freeze([...seen]),
    sourcePush:1+.065*smooth((frame-1)/85),
    stageHoldFrames:Math.max(0,available-95)
  });
}
