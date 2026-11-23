export const EP004_SHOT05_CLARITY_GRAMMAR='PROGRESSIVE_SINGLE_FOCUS_V3';
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const interpolate=(a,b,t)=>a+(b-a)*t;
export const EP004_SHOT05_SAFE_FRAME=Object.freeze({
  left:128,right:1792,top:72,bottom:923
});
export const EP004_SHOT05_NODES=Object.freeze({
  outlook:Object.freeze({x:168,y:351,w:300,h:106,title:'OUTLOOK',font:31}),
  teams:Object.freeze({x:168,y:692,w:300,h:106,title:'TEAMS',font:31}),
  primary:Object.freeze({x:726,y:328,w:468,h:242,title:'PRIMARY GATEWAY',font:35}),
  alternative:Object.freeze({x:750,y:692,w:420,h:126,title:'ALTERNATIVE GATEWAY',font:28}),
  exchange:Object.freeze({x:1424,y:351,w:334,h:106,title:'EXCHANGE ONLINE',font:27}),
  teamsService:Object.freeze({x:1424,y:692,w:334,h:106,title:'MICROSOFT TEAMS',font:27}),
});
export const EP004_SHOT05_TRACKS=Object.freeze({
  OUTLOOK_PRIMARY:Object.freeze({from:'outlook',to:'primary',
    path:'M 468 404 H 726',start:Object.freeze([468,404]),end:Object.freeze([726,404]),
    segments:Object.freeze([[468,404],[726,404]])}),
  PRIMARY_MAILBOX:Object.freeze({from:'primary',to:'exchange',
    path:'M 1194 404 H 1424',start:Object.freeze([1194,404]),end:Object.freeze([1424,404]),
    segments:Object.freeze([[1194,404],[1424,404]])}),
  TEAMS_ALTERNATIVE:Object.freeze({from:'teams',to:'alternative',
    path:'M 468 745 H 750',start:Object.freeze([468,745]),end:Object.freeze([750,745]),
    segments:Object.freeze([[468,745],[750,745]])}),
  ALTERNATIVE_TEAMS:Object.freeze({from:'alternative',to:'teamsService',
    path:'M 1170 745 H 1424',start:Object.freeze([1170,745]),end:Object.freeze([1424,745]),
    segments:Object.freeze([[1170,745],[1424,745]])}),
  TEAMS_FAILOVER:Object.freeze({from:'teams',to:'primary',
    path:'M 468 745 H 574 Q 594 745 594 725 V 515 Q 594 495 614 495 H 726',
    start:Object.freeze([468,745]),end:Object.freeze([726,495]),
    segments:Object.freeze([[468,745],[574,745],[594,725],[594,515],[614,495],[726,495]])}),
  PRIMARY_TEAMS:Object.freeze({from:'primary',to:'teamsService',
    path:'M 1194 495 H 1292 Q 1312 495 1312 515 V 725 Q 1312 745 1332 745 H 1424',
    start:Object.freeze([1194,495]),end:Object.freeze([1424,745]),
    segments:Object.freeze([[1194,495],[1292,495],[1312,515],[1312,725],[1332,745],[1424,745]])}),
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
    'TWO ROUTES. ONE GATEWAY.','CAPACITY REDUCED','14% CAPACITY LOST',
    'THE ROUTE CHANGES','THE SHARED DEPENDENCY',
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
      ['primary'],[], '14%');
  if(/capacity|headroom|remaining|reduced|missing|deplet|constrain|shortage/.test(d))
    return stage('CAPACITY','CAPACITY REDUCED','AMBER',
      ['primary'],[], 'CONSTRAINED');
  if(/failover|rerout|redirect|moves? to (the )?primary|shift|switch|spillover|july|configuration|policy|route table/.test(d))
    return stage('SWITCH','THE ROUTE CHANGES','VIOLET',
      ['teams','alternative','primary','teamsService'],
      ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS','TEAMS_FAILOVER','PRIMARY_TEAMS']);
  if(/fail|outage|degrad|down|unavailable|broken|interrupt|error/.test(d))
    return stage('DEGRADED','THE SHARED DEPENDENCY','AMBER',
      ['primary','outlook','teams'],[], 'CONSTRAINED');
  if(/shared|converge|bottleneck|pressure|both|same gateway|one gateway/.test(d))
    return stage('SHARED','TWO ROUTES. ONE GATEWAY.','MINT',
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
  const headlineOpacity=idx>=0?interiorOpacity*smooth((age-3)/26):0;
  const previousHeadlineOpacity=idx>0?interiorOpacity*(1-stageTransition):0;
  const flowActivation=idx>=0?smooth((age-14)/58):0;
  const secondLaneActivation=idx>=0?smooth((age-84)/72):0;
  const switchActivation=idx>=0?smooth((age-55)/118):0;
  const previousCamera=prev?.key==='CAPACITY'||prev?.key==='CAPACITY_14'
    ?{x:-12,y:18,scale:1.027}:prev?.key==='SWITCH'
    ?{x:10,y:-10,scale:1.019}:{x:0,y:0,scale:1};
  const pose=current.key==='CAPACITY'||current.key==='CAPACITY_14'||current.key==='DEGRADED'
    ?{x:-12,y:18,scale:1.027}:current.key==='SWITCH'
    ?{x:10,y:-10,scale:1.019}:{x:0,y:0,scale:1};
  const cameraT=smooth(age/58);
  const camera=Object.freeze({
    x:interpolate(previousCamera.x,pose.x,cameraT),
    y:interpolate(previousCamera.y,pose.y,cameraT),
    scale:interpolate(previousCamera.scale,pose.scale,cameraT)
  });
  const seen=new Set();
  for(let i=0;i<=Math.max(0,idx);i++){
    const st=ep004Shot05ClarityStage(beats[i]?.direction??'',i,cues[i]?.anchor??'');
    for(const node of st.visible)seen.add(node);
  }
  const firstHeader=ep004Shot05TextBox(current.headline);
  return Object.freeze({
    frame,beatIndex:idx,stage:current,previousStage:prev,age,
    camera,sourceOpacity,interiorOpacity,headlineOpacity,
    previousHeadlineOpacity,stageTransition,flowActivation,
    secondLaneActivation,switchActivation,
    headerBox:firstHeader,visibleHistory:Object.freeze([...seen]),
    sourcePush:1+.065*smooth((frame-1)/85),
    stageHoldFrames:Math.max(0,available-95)
  });
}
