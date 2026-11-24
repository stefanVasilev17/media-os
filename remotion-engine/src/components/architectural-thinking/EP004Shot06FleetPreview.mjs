// PREVIEW ONLY: not registered with the production factory.
export const SHOT06_BEATS=Object.freeze(['SHOT06_P01_B01','SHOT06_P01_B02','SHOT06_P01_B03','SHOT06_P02_B01','SHOT06_P02_B02','SHOT06_P02_B03','SHOT06_P03_B01','SHOT06_P03_B02','SHOT06_P04_B01','SHOT06_P04_B02']);
export const SHOT06_FLEET=Object.freeze([0,1,2].map((i)=>Object.freeze({id:'ABC'[i],x:1375,y:243+i*235,w:385,h:140,portY:313+i*235})));
export const SHOT06_EMISSION_INTERVAL=18;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
const round=(vertices,r=46)=>{
  const points=[vertices[0]];
  for(let i=1;i<vertices.length-1;i++){
    const a=vertices[i-1],b=vertices[i],c=vertices[i+1];
    const d=Math.hypot(a[0]-b[0],a[1]-b[1]),e=Math.hypot(c[0]-b[0],c[1]-b[1]);
    const k=Math.min(r,d*.45,e*.45);
    const p=[b[0]+(a[0]-b[0])*k/d,b[1]+(a[1]-b[1])*k/d],q=[b[0]+(c[0]-b[0])*k/e,b[1]+(c[1]-b[1])*k/e];
    points.push(p);
    for(let j=1;j<=14;j++){const t=j/14,u=1-t;points.push([u*u*p[0]+2*u*t*b[0]+t*t*q[0],u*u*p[1]+2*u*t*b[1]+t*t*q[1]])}
  }
  points.push(vertices.at(-1));return Object.freeze(points.map(p=>Object.freeze(p)));
};
export const SHOT06_INPUTS=Object.freeze([round([[350,440],[490,440],[555,505],[685,505]]),round([[350,650],[490,650],[555,565],[685,565]])]);
export const SHOT06_OUTPUTS=Object.freeze(SHOT06_FLEET.map(n=>round([[1015,535],[1135,535],[1135,n.portY],[n.x,n.portY]].filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]))));
export const shot06Path=points=>points.map((p,i)=>(i?'L ':'M ')+p.join(' ')).join(' ');
export const shot06Length=points=>points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
export function shot06Point(points,distance){
  let left=Math.max(0,distance);
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(left<=d)return {x:lerp(a[0],b[0],left/d),y:lerp(a[1],b[1],left/d)};
    left-=d;
  }
  return {x:points.at(-1)[0],y:points.at(-1)[1]};
}
export function validateShot06PreviewTimeline(cues,duration){
  if(!Number.isInteger(duration)||duration<600||duration>9000||!Array.isArray(cues)||cues.length!==SHOT06_BEATS.length)throw Error('SHOT06_PREVIEW_CUES_REQUIRED');
  let previous=71;
  cues.forEach((cue,i)=>{
    if(cue.beatId!==SHOT06_BEATS[i]||!Number.isInteger(cue.startFrame)||cue.startFrame<=previous||!Number.isInteger(cue.endFrame)||cue.endFrame<cue.startFrame||cue.endFrame>=duration)throw Error('SHOT06_PREVIEW_CUE_ORDER_'+i);
    previous=cue.startFrame;
  });
  return true;
}
export function shot06PreviewState(frame,cues,duration){
  validateShot06PreviewTimeline(cues,duration);
  if(!Number.isInteger(frame)||frame<0||frame>=duration)throw Error('SHOT06_FRAME_OUTSIDE_PREVIEW');
  const t=cues.map(c=>c.startFrame);
  const focus=smooth((frame-t[0])/Math.max(1,Math.min(75,t[1]-t[0])));
  const interior=smooth((frame-t[1])/Math.max(1,Math.min(36,t[2]-t[1])))*(1-smooth((frame-t[6])/Math.max(1,Math.min(42,t[7]-t[6]))));
  const close=focus*(1-smooth((frame-t[6])/Math.max(1,Math.min(60,t[7]-t[6]))));
  const pressure=smooth((frame-t[1])/Math.max(1,t[5]-t[1]));
  const failed=frame>=t[5];
  const comparison=frame>=t[6];
  const redistributing=smooth((frame-t[6])/Math.max(1,Math.min(50,t[7]-t[6])));
  const packets=[];
  // Total offered arrivals never change; the destination is bound at the router.
  const speed=10;
  for(let born=Math.floor(frame/SHOT06_EMISSION_INTERVAL)*SHOT06_EMISSION_INTERVAL;born>=Math.max(-180,frame-240);born-=SHOT06_EMISSION_INTERVAL){
    const id=Math.round(born/SHOT06_EMISSION_INTERVAL),lane=((id%2)+2)%2;
    const input=SHOT06_INPUTS[lane],inLength=shot06Length(input),travel=(frame-born)*speed;
    const arrival=born+Math.ceil(inLength/speed)+24;
    if(travel<=inLength){packets.push({id,lane,phase:'INGRESS',...shot06Point(input,travel)});continue;}
    if(frame<arrival)continue; // inside the opaque router
    const destination=arrival>=t[6]?1+((id%2+2)%2):((id%3+3)%3);
    const path=SHOT06_OUTPUTS[destination],length=shot06Length(path),d=(frame-arrival)*speed;
    // Requests already assigned to A do not jump to B/C. They can reach
    // its input, but no successful response can originate after failure.
    if(d<=length)packets.push({id,lane,destination,phase:'TO_SERVER',...shot06Point(path,d)});
    else if(d<=length+50&&destination===0&&failed)packets.push({id,lane,destination,phase:'STOPPED',...shot06Point(path,length)});
  }
  // A bounded conceptual sampling of waiting work, not a literal FIFO
  // or an assertion of Microsoft's internal queue implementation.
  const waitingCount=Math.round(10*pressure);
  const local=[];
  const localInterval=20;
  for(let born=Math.floor(frame/localInterval)*localInterval;born>=frame-130;born-=localInterval){
    const id=Math.round(born/localInterval),lane=((id%2)+2)%2,age=frame-born;
    if(age<42){const u=age/42;local.push({id,lane,phase:'IN',x:lerp(150,700,u),y:lerp(lane?640:440,540,smooth((u-.65)/.35))});}
    else if(!failed&&age>=42+Math.round(pressure*32)){
      const stride=pressure>.7?4:pressure>.35?2:1;
      if(((id%stride)+stride)%stride===0){const u=(age-42-Math.round(pressure*32))/45;if(u<=1)local.push({id,lane,phase:'OUT',x:lerp(1160,1760,u),y:540});}
    }
  }
  const localWaiting=Array.from({length:waitingCount},(_,i)=>({id:i,x:1010-i*31,y:540,lane:i%2}));
  const beat=SHOT06_BEATS[Math.max(0,t.reduce((idx,start,i)=>frame>=start?i:idx,0))];
  return Object.freeze({frame,beat,interior,close,pressure,failed,comparison,redistributing,packets:Object.freeze(packets),local:Object.freeze(local),localWaiting:Object.freeze(localWaiting),waitingCount,offeredInterval:SHOT06_EMISSION_INTERVAL,
    serverStates:Object.freeze(['A','B','C'].map((id,i)=>Object.freeze({id,status:i===0?(failed?'Unresponsive':pressure>.32?'Waiting':'Serving'):(comparison?'Higher load':'Serving'),load:i===0?(failed?0:.4+.6*pressure):.4+.35*redistributing}))),
    headline:frame<t[1]?'WHEN THE ROUTE CHANGES, SO DOES THE RISK':frame<t[3]?'CONNECTION HANDLING':frame<t[5]?'WAITING WORK ACCUMULATES':frame<t[6]?'ONE ENDPOINT STOPS RESPONDING':frame<t[8]?'SAME DEMAND. FEWER DESTINATIONS.':'WHERE THE TRAFFIC GOES MATTERS'});
}
