export const EP004_SHOT05_CLARITY_GRAMMAR='ICONIC_GRID_MOTION_V10';
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const interpolate=(a,b,t)=>a+(b-a)*t;
export const EP004_SHOT05_SAFE_FRAME=Object.freeze({
  left:128,right:1792,top:72,bottom:923
});
export const EP004_SHOT05_NODES=Object.freeze({
  outlook:Object.freeze({x:128,y:235,w:232,h:190,title:'Outlook App',font:30,labelWidth:320}),
  teams:Object.freeze({x:128,y:650,w:232,h:190,title:'Teams App',font:30,labelWidth:320}),
  primary:Object.freeze({x:726,y:205,w:468,h:350,title:'Primary Gateway',font:35,labelWidth:468}),
  alternative:Object.freeze({x:726,y:650,w:468,h:190,title:'Alternative Gateway',font:30,labelWidth:468}),
  exchange:Object.freeze({x:1560,y:235,w:232,h:190,title:'Exchange Online',font:27,labelWidth:320}),
  teamsService:Object.freeze({x:1560,y:650,w:232,h:190,title:'Teams Service',font:29,labelWidth:320}),
});
// Sample each rounded corner once: drawing and motion share identical geometry.
const roundedTrack=(from,to,vertices)=>{
  const pts=[vertices[0]];
  for(let i=1;i<vertices.length-1;i++){
    const a=vertices[i-1],b=vertices[i],c=vertices[i+1];
    const before=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const after=Math.hypot(c[0]-b[0],c[1]-b[1]);
    const radius=Math.min(62,before*.48,after*.48);
    const p=[b[0]+(a[0]-b[0])*radius/before,b[1]+(a[1]-b[1])*radius/before];
    const q=[b[0]+(c[0]-b[0])*radius/after,b[1]+(c[1]-b[1])*radius/after];
    pts.push(p);
    for(let j=1;j<=18;j++){
      const t=j/18,u=1-t;
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
    path:'M 360 330 H 726',start:Object.freeze([360,330]),end:Object.freeze([726,330]),
    segments:Object.freeze([[360,330],[726,330]])}),
  PRIMARY_MAILBOX:Object.freeze({from:'primary',to:'exchange',
    path:'M 1194 330 H 1560',start:Object.freeze([1194,330]),end:Object.freeze([1560,330]),
    segments:Object.freeze([[1194,330],[1560,330]])}),
  TEAMS_ALTERNATIVE:Object.freeze({from:'teams',to:'alternative',
    path:'M 360 745 H 726',start:Object.freeze([360,745]),end:Object.freeze([726,745]),
    segments:Object.freeze([[360,745],[726,745]])}),
  ALTERNATIVE_TEAMS:Object.freeze({from:'alternative',to:'teamsService',
    path:'M 1194 745 H 1560',start:Object.freeze([1194,745]),end:Object.freeze([1560,745]),
    segments:Object.freeze([[1194,745],[1560,745]])}),
  TEAMS_FAILOVER:roundedTrack('teams','primary',[[360,745],[574,745],[574,430],[726,430]]),
  PRIMARY_TEAMS:roundedTrack('primary','teamsService',[[1194,430],[1312,430],[1312,745],[1560,745]]),
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
    if(width>node.labelWidth)throw Error('SHOT05_LABEL_MUST_FIT_'+key+'_'+width);
    if(node.x<EP004_SHOT05_SAFE_FRAME.left||node.y<205
      ||node.x+node.w>EP004_SHOT05_SAFE_FRAME.right
      ||node.y+node.h+node.font+18>EP004_SHOT05_SAFE_FRAME.bottom)
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
    'SHARED GATEWAY','HEADROOM DROPS','14% CAPACITY LOST',
    'TEAMS TRAFFIC REROUTES','THE SHARED DEPENDENCY',
    'AN INDEPENDENT PATH','THE SYSTEM CONSEQUENCE',
    'FOLLOW THE REQUEST'
  ])ep004Shot05TextBox(title);
  return true;
}
const stage=(key,headline,accent,visible,lanes,primaryStatus=null)=>Object.freeze({
  key,headline,accent,visible:Object.freeze(visible),
  lanes:Object.freeze(lanes),primaryStatus
});
const movedTeams=text=>/\bteams(?:['’]s?)?\s+(?:traffic|requests?|workload)\s+(?:(?:has|have|had|was|were|is|are|now)\s+)*(?:moved|moving|shifted|redirected|rerouted|diverted|transferred|flowed|flows?|switched)\s+(?:(?:back|now|over)\s+)*(?:into|to|through|via|onto)\b/i.test(text);
const capacity14=text=>/\bfourteen[\s-]+percent\b|\b14\s*(?:%|percent\b)/i.test(text);
export function ep004Shot05ClarityStage(direction,index=0,anchor=''){
  const d=String(direction||'').toLowerCase();
  const spoken=(d+' '+String(anchor||'').toLowerCase());
  if(capacity14(spoken))
    return stage('CAPACITY_14','14% CAPACITY LOST','AMBER',
      ['primary','outlook','teams','exchange','teamsService'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'], '14%');
  if(movedTeams(spoken))
    return stage('SWITCH','TEAMS TRAFFIC REROUTES','VIOLET',
      ['teams','alternative','primary','teamsService'],
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS','TEAMS_FAILOVER','PRIMARY_TEAMS']);
  if(/capacity|headroom|remaining|reduced|missing|deplet|constrain|shortage/.test(d))
    return stage('CAPACITY','HEADROOM DROPS','AMBER',
      ['primary','outlook','teams','exchange','teamsService'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'], 'REDUCED');
  if(/failover|rerout|redirect|moves? to (the )?primary|shift|switch|spillover|july|configuration|policy|route table/.test(d))
    return stage('SWITCH','TEAMS TRAFFIC REROUTES','VIOLET',
      ['teams','alternative','primary','teamsService'],
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS','TEAMS_FAILOVER','PRIMARY_TEAMS']);
  if(/fail|outage|degrad|down|unavailable|broken|interrupt|error/.test(d))
    return stage('DEGRADED','THE SHARED DEPENDENCY','AMBER',
      ['primary','outlook','teams','exchange','teamsService'],['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'], 'REDUCED');
  if(/shared|converge|bottleneck|pressure|both|same gateway|one gateway/.test(d))
    return stage('SHARED','SHARED GATEWAY','MINT',
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

export const EP004_SHOT05_MIGRATION_FRAMES=126;
export const EP004_SHOT05_PACKET_INTERVAL=18;
export const EP004_SHOT05_NEW_PACKET_SPEED=13.2;
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
export function ep004Shot05PacketTrail(route,travel,tail=64){
  const start=Math.max(0,travel-tail);
  const pieces=[];
  for(let i=0;i<8;i++){
    const a=ep004Shot05SamplePacket(route,start+(travel-start)*i/8);
    const b=ep004Shot05SamplePacket(route,start+(travel-start)*(i+1)/8);
    if(a&&b)pieces.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,alpha:(i+1)/8});
  }
  return pieces;
}
// The Director rejected the 01:03 frame of the actual 2573-frame V8.
 // This is an editorial visual checkpoint, NOT a claimed voice timestamp.
export const EP004_SHOT05_DIRECTOR_REVIEW=Object.freeze({duration:2573,checkpoint:1890,latestOnset:1740});
export function ep004Shot05Migration(frame,cues,beats,duration){
  const stages=cues.map((cue,i)=>ep004Shot05ClarityStage(beats[i].direction,i,cue.anchor));
  const capacityIndex=stages.findIndex(s=>s.key==='CAPACITY'||s.key==='CAPACITY_14');
  // The Director identified the actual spoken sentence; prioritize verified speech
  // over broad visual instructions which may mention failover in a different context.
  const anchors=cues.map(cue=>String(cue.anchor||''));
  const directions=beats.map(beat=>String(beat.direction||''));
  const routeText=anchors.map((s,i)=>s+' '+directions[i]);
  const action=/\b(?:rerout\w*|redirect\w*|failover|fail over|switch\w*|shift\w*|spillover|mov(?:e|es|ed|ing)|divert\w*)\b/i;
  const destination=/\b(?:teams|traffic|requests?|route|routing|gateway|path)\b/i;
  const exactSpeech=anchors.findIndex(movedTeams);
  const exactDirection=directions.findIndex(movedTeams);
  const spokenAction=anchors.findIndex(s=>action.test(s)&&destination.test(s)&&!/\b(?:no|without|before)\s+(?:rerout\w*|failover|switch\w*)\b/i.test(s));
  const explicit=routeText.findIndex(s=>action.test(s)&&destination.test(s)&&!/\b(?:no|without|before)\s+(?:rerout\w*|failover|switch\w*)\b/i.test(s));
  const shared=routeText.findIndex(s=>/\b(?:converg\w*|both.*(?:use|through|via|depend)|(?:same|one|shared)\s+(?:primary\s+)?gateway)\b/i.test(s));
  const routeIndex=exactSpeech>=0?exactSpeech:exactDirection>=0?exactDirection:spokenAction>=0?spokenAction:explicit>=0?explicit:shared>=0?shared:stages.findIndex(s=>s.key==='SWITCH');
  const exactCapacity=anchors.findIndex(capacity14);
  const fallbackCapacity=stages.findIndex(s=>s.key==='CAPACITY_14');
  const capacity14Index=exactCapacity>=0?exactCapacity:fallbackCapacity;
  const capacity14Frame=capacity14Index<0?null:cues[capacity14Index].startFrame;
  const amberAge=capacity14Frame===null?-1:frame-capacity14Frame;
  const amberPhase=amberAge<0?0:(amberAge%48)/48;
  const amberPulse=amberAge<0?0:.32+.68*smooth(1-Math.abs(2*amberPhase-1));
  const capacity14Reveal=amberAge<0?0:smooth((amberAge+1)/12);
  const capacityFrame=capacityIndex<0?null:cues[capacityIndex].startFrame;
  const cueRerouteFrame=routeIndex<0?null:cues[routeIndex].startFrame;
  const review=duration===EP004_SHOT05_DIRECTOR_REVIEW.duration?EP004_SHOT05_DIRECTOR_REVIEW:null;
  // Keep genuine speech alignment where possible. A missing/late match must not
  // leave the Director-rejected frame on the old route. Do not modify cue data.
  const rerouteFrame=review?(cueRerouteFrame===null?review.latestOnset:Math.min(cueRerouteFrame,review.latestOnset)):cueRerouteFrame;
  const rerouteReason=review&&cueRerouteFrame!==rerouteFrame?'DIRECTOR_VISUAL_CHECKPOINT':cueRerouteFrame===null?'NO_MATCH':'VERIFIED_CUE';
  const rerouteBeatId=routeIndex<0?null:(cues[routeIndex].beatId??null);
  const ratioAt=f=>rerouteFrame===null?0:smooth((f-rerouteFrame)/EP004_SHOT05_MIGRATION_FRAMES);
  const pressure=capacityFrame===null?0:smooth((frame-capacityFrame)/54);
  const firstNewEmission=rerouteFrame===null?null:Math.floor((rerouteFrame-8)/EP004_SHOT05_PACKET_INTERVAL)*EP004_SHOT05_PACKET_INTERVAL+8+EP004_SHOT05_PACKET_INTERVAL;
  // First request is a visible pilot, then a deterministic mixed handover.
  // All previous requests keep the route assigned at emission.
  const teamRouteAt=emission=>{
    if(firstNewEmission===null||emission<firstNewEmission)return 'OLD';
    const slot=Math.round((emission-firstNewEmission)/EP004_SHOT05_PACKET_INTERVAL);
    return slot>=7||[0,3,5,6].includes(slot)?'NEW':'OLD';
  };
  const ingressLength=length(EP004_SHOT05_TRACKS.TEAMS_FAILOVER.segments);
  const coreLength=EP004_SHOT05_NODES.primary.w;
  const egressLength=length(EP004_SHOT05_TRACKS.PRIMARY_TEAMS.segments);
  const revealAge=firstNewEmission===null?-1:frame-firstNewEmission;
  const revealFront=revealAge<0?0:revealAge*EP004_SHOT05_NEW_PACKET_SPEED+Math.min(58,revealAge*7);
  const ingressReveal=clamp(revealFront/ingressLength);
  const coreReveal=clamp((revealFront-ingressLength)/coreLength);
  const egressReveal=clamp((revealFront-ingressLength-coreLength)/egressLength);
  const packets=[];
  const earliest=Math.max(-180,Math.floor((frame-300)/EP004_SHOT05_PACKET_INTERVAL)*EP004_SHOT05_PACKET_INTERVAL);
  for(let born=earliest;born<=frame;born+=EP004_SHOT05_PACKET_INTERVAL){
    // Stable per-emission decision; never reassign a packet in flight.
    const teamRoute=teamRouteAt(born+8);
    for(const [route,offset] of [['MAIL',0],[teamRoute,8]]){
      const emission=born+offset;
      if(emission>frame)continue;
      // Constant world-space speed guarantees continuity at joins and cue boundaries.
      const travel=(frame-emission)*(route==='NEW'?EP004_SHOT05_NEW_PACKET_SPEED:8.4);
      const pos=ep004Shot05SamplePacket(route,travel);
      if(!pos)continue;
      const total=length(EP004_SHOT05_PACKET_ROUTES[route]);
      const opacity=Math.min(1,travel/24,(total-travel)/24);
      if(opacity>0)packets.push(Object.freeze({id:route+'-'+born,route,born:emission,
        ...pos,opacity,travel}));
    }
  }
  const primaryWeight=ratioAt(frame);
  let drain=1;
  if(rerouteFrame!==null){
    const lastPossibleOldArrival=rerouteFrame+EP004_SHOT05_MIGRATION_FRAMES+
      EP004_SHOT05_PACKET_INTERVAL+length(EP004_SHOT05_PACKET_ROUTES.OLD)/8.4;
    drain=1-smooth((frame-lastPossibleOldArrival)/36);
  }
  const oldStrength=Math.max(1-primaryWeight,.52*drain);
  const newStrength=firstNewEmission===null||frame<firstNewEmission?0:Math.max(primaryWeight,.78*smooth((frame-firstNewEmission)/18));
  const explicit14=amberAge>=0;
  return Object.freeze({primaryWeight,legacyWeight:1-primaryWeight,pressure,
    rerouteFrame,cueRerouteFrame,rerouteReason,rerouteBeatId,capacityFrame,capacity14Frame,capacity14Reveal,amberPulse,explicit14,oldStrength,newStrength,firstNewEmission,ingressReveal,coreReveal,egressReveal,packets:Object.freeze(packets)});
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
  const migration=ep004Shot05Migration(frame,cues,beats,duration);
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


// Run on actual authenticated job props before invoking Chromium or fetching media.
export function ep004Shot05VerifyReroute(cues,beats,duration){
  const first=ep004Shot05Migration(0,cues,beats,duration);
  if(first.rerouteFrame===null||first.firstNewEmission===null)throw Error('SHOT05_REROUTE_ONSET_UNRESOLVED');
  const onset=first.firstNewEmission;
  const before=ep004Shot05Migration(onset-1,cues,beats,duration);
  if(before.ingressReveal!==0||before.coreReveal!==0||before.egressReveal!==0||before.packets.some(p=>p.route==='NEW'))
    throw Error('SHOT05_PREMATURE_REROUTE');
  let turned=false,entered=false,exited=false,mixed=false;
  const n=EP004_SHOT05_NODES.primary;
  for(let f=onset;f<Math.min(duration,onset+220);f++){
    const m=ep004Shot05Migration(f,cues,beats,duration);
    const old=m.packets.some(p=>p.route==='OLD');
    for(const p of m.packets.filter(p=>p.route==='NEW')){
      if(p.x<n.x&&p.y<710&&p.y>430)turned=true;
      if(p.x>=n.x&&p.x<=n.x+n.w&&Math.abs(p.y-430)<.01){entered=true;if(old)mixed=true;}
      if(p.x>n.x+n.w&&p.y>430)exited=true;
    }
  }
  if(!turned||!entered||!exited||!mixed)throw Error('SHOT05_REROUTE_PHYSICAL_TRAVERSAL_FAILED');
  const checkpoint=duration===EP004_SHOT05_DIRECTOR_REVIEW.duration?EP004_SHOT05_DIRECTOR_REVIEW.checkpoint:Math.min(duration-1,onset+150);
  const at=ep004Shot05Migration(checkpoint,cues,beats,duration);
  if(at.ingressReveal!==1||at.coreReveal!==1||at.egressReveal!==1||!at.packets.some(p=>p.route==='NEW'&&p.x>=n.x&&p.x<=n.x+n.w))
    throw Error('SHOT05_DIRECTOR_CHECKPOINT_NOT_SHARED');
  const settled=ep004Shot05Migration(Math.min(duration-1,onset+350),cues,beats,duration);
  if(settled.oldStrength!==0||settled.packets.some(p=>p.route==='OLD')||!settled.packets.some(p=>p.route==='NEW')||!settled.packets.some(p=>p.route==='MAIL'))
    throw Error('SHOT05_OLD_TRAFFIC_DRAIN_FAILED');
  return Object.freeze({status:'PASS',rerouteFrame:first.rerouteFrame,cueRerouteFrame:first.cueRerouteFrame,
    reason:first.rerouteReason,beatId:first.rerouteBeatId,firstNewEmission:onset,checkpoint,
    turned,entered,exited,mixed,checkpointNewPackets:at.packets.filter(p=>p.route==='NEW').length,
    checkpointOldPackets:at.packets.filter(p=>p.route==='OLD').length,settledOldStrength:settled.oldStrength});
}
