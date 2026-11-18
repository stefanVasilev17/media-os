export const EP004_SHOT01_LOCKED_SOURCE_SHA256 =
  'a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365';

export const EP004_SHOT01_BEATS = Object.freeze([
  'SHOT01_P01_B01', 'SHOT01_P01_B02', 'SHOT01_P01_B03',
  'SHOT01_P02_B01', 'SHOT01_P02_B02', 'SHOT01_P02_B03',
  'SHOT01_P03_B01', 'SHOT01_P03_B02'
]);

export const EP004_MAIL_ROUTE = Object.freeze([
  Object.freeze({x:594,y:519}),
  Object.freeze({x:899,y:519}),
  Object.freeze({x:1008,y:536}),
  Object.freeze({x:1076,y:536})
]);

export const EP004_STANDBY_ROUTE = Object.freeze([
  Object.freeze({x:1366,y:536}),
  Object.freeze({x:1462,y:536}),
  Object.freeze({x:1520,y:495})
]);

const clamp=(n)=>Math.min(1,Math.max(0,n));
const ease=(n)=>{const t=clamp(n);return t*t*(3-2*t);};

export function ep004RoutePolyline(points) {
  return points.map(p=>p.x+','+p.y).join(' ');
}

export function ep004RoutePosition(points,progress) {
  if(!Array.isArray(points)||points.length<2)throw Error('EP004_ROUTE_REQUIRES_AT_LEAST_TWO_POINTS');
  if(!Number.isFinite(progress))throw Error('EP004_NONFINITE_PACKET_PROGRESS');
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
  const total=lengths.reduce((a,b)=>a+b,0);
  if(total<=0)throw Error('EP004_ZERO_LENGTH_ROUTE');
  let target=clamp(progress)*total;
  for(let i=0;i<lengths.length;i++){
    if(target<=lengths[i]||i===lengths.length-1){
      const t=target/lengths[i];
      return {x:points[i].x+(points[i+1].x-points[i].x)*t,
        y:points[i].y+(points[i+1].y-points[i].y)*t};
    }
    target-=lengths[i];
  }
  throw Error('EP004_INVALID_ROUTE_GEOMETRY');
}

export function ep004Shot01Validate(props) {
  if(!props||props.sourceSha256!==EP004_SHOT01_LOCKED_SOURCE_SHA256
    ||!Number.isInteger(props.durationInFrames)
    ||props.durationInFrames<600||props.durationInFrames>9000
    ||!Number.isInteger(props.worldStartFrame)||props.worldStartFrame<0)
    throw Error('EP004_SHOT01_LOCKED_SOURCE_OR_DURATION_INVALID');
  if(props.previewOnly===true)return true;
  if(props.previewOnly!==false ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(props.voiceTakeId||''))
    throw Error('EP004_SHOT01_REQUIRES_DIRECTOR_SELECTED_TAKE');
  const cues=props.cueFrames;
  let previous=59;
  for(const key of EP004_SHOT01_BEATS){
    const value=cues?.[key];
    if(!Number.isInteger(value)||value<=previous||value>=props.durationInFrames)
      throw Error('EP004_SHOT01_REQUIRES_REAL_ORDERED_VOICE_CUE_'+key);
    previous=value;
  }
  return true;
}

export function ep004Shot01Phase(frame,props) {
  ep004Shot01Validate(props);
  if(!Number.isInteger(frame)||frame<0||frame>=props.durationInFrames)
    throw Error('EP004_FRAME_OUTSIDE_SHOT');
  const c=props.previewOnly===true?{
    SHOT01_P01_B01:60, SHOT01_P01_B02:260, SHOT01_P01_B03:470,
    SHOT01_P02_B01:700, SHOT01_P02_B02:930, SHOT01_P02_B03:1180,
    SHOT01_P03_B01:1450, SHOT01_P03_B02:1690
  }:props.cueFrames;
  const go=(key,n=70)=>ease((frame-c[key])/n);
  const blocked=go('SHOT01_P01_B03',74);
  const showWorld=go('SHOT01_P02_B01',170);
  const failover=go('SHOT01_P02_B02',180);
  const question=go('SHOT01_P03_B01',150);
  const towardNext=go('SHOT01_P03_B02',150);
  const requestProgress=.04+.91*ease((frame-c.SHOT01_P01_B01)/Math.max(130,c.SHOT01_P01_B03-c.SHOT01_P01_B01));
  const routeProgress=Math.min(.955,requestProgress);
  const secondPacketProgress=failover>0?Math.min(.87,.03+((props.worldStartFrame+frame)*.0031%0.84)):0;
  return Object.freeze({
    worldFrame:props.worldStartFrame+frame,
    routeProgress, request:ep004RoutePosition(EP004_MAIL_ROUTE,routeProgress),
    requestStatus:blocked>.12?'WAITING':'IN_TRANSIT',
    blocked, showWorld, failover, question, towardNext,
    secondary:ep004RoutePosition(EP004_STANDBY_ROUTE,secondPacketProgress),
    secondaryVisible:failover>.18,
    cameraX:-132*showWorld-48*towardNext,
    cameraScale:1-.086*showWorld-.026*towardNext,
  });
}

export function ep004Shot01Exit(props){
  return ep004Shot01Phase(props.durationInFrames-1,props);
}
