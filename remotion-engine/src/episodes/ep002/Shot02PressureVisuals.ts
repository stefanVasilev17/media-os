export const SHOT02_AUTH_REPLICA_PORTS = [
  {id:'AUTH 01',y:412},
  {id:'AUTH 02',y:498},
  {id:'AUTH 03',y:584},
] as const;

export const SHOT02_AUTH_CARD_LEFT = 1192;
export const SHOT02_AUTH_CARD_RIGHT = 1460;
export const SHOT02_DATABASE_ENTRY = {x:1582,y:509} as const;
export const SHOT02_BALANCER_EXIT = {x:1050,y:535} as const;
export const SHOT02_GATEWAY_ENTRY = {x:521,y:532} as const;
export const SHOT02_GATEWAY_EXIT = {x:779,y:532} as const;
export const SHOT02_BALANCER_ENTRY = {x:804,y:532} as const;
export const SHOT02_PHONE_PIPE = {x:485,y:532} as const;

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

const smooth01 = (value: number): number => {
  const t=clamp01(value);
  return t*t*(3-2*t);
};

const mixHex = (from: string, to: string, progress: number): string => {
  const t=smooth01(progress);
  const channel=(index:number):string=>{
    const a=parseInt(from.slice(index,index+2),16);
    const b=parseInt(to.slice(index,index+2),16);
    return Math.round(a+(b-a)*t).toString(16).padStart(2,'0');
  };
  return '#'+channel(1)+channel(3)+channel(5);
};

const interpolateStops = (value:number, stops:readonly string[]):string => {
  const p=clamp01(value)*(stops.length-1);
  const index=Math.min(stops.length-2,Math.floor(p));
  return mixHex(stops[index],stops[index+1],p-index);
};

export function shot02UserRequestPressure(
  context:number,wave:number,distribution:number,auth:number,arrival:number,
):number {
  return clamp01(.05*clamp01(context)+.15*clamp01(wave)
    +.15*clamp01(distribution)+.15*clamp01(auth)+.5*clamp01(arrival));
}

export function shot02SharedDbPressure(
  lookup:number,dbReveal:number,arrival:number,
):number {
  const l=clamp01(lookup);
  return clamp01(.15*l+.45*clamp01(dbReveal)+.4*l*clamp01(arrival));
}

export function shot02ButtonColors(pressure:number) {
  return {
    top:interpolateStops(pressure,
      ['#35F5E2','#69E7C5','#F7CD78','#F8A14F','#F7773E','#E74B58']),
    bottom:interpolateStops(pressure,
      ['#0ABAC3','#3FBF95','#C88D3D','#D67029','#CB4C30','#A72D48']),
    border:interpolateStops(pressure,
      ['#B4FFFA','#B0F6CE','#FFE0A3','#FFC17F','#FF997C','#FF858B']),
    glow:interpolateStops(pressure,
      ['#21E8D6','#6DDEA0','#EFC174','#F28D36','#EE653E','#D73F58']),
  };
}

export function shot02DatabaseColors(pressure:number) {
  return {
    border:interpolateStops(pressure,
      ['#6AAFDA','#70D5D2','#C4C68C','#EDB56B','#F2984C']),
    glow:interpolateStops(pressure,
      ['#3A8ED4','#62C7CA','#BDBA76','#E1A050','#ED823A']),
    core:interpolateStops(pressure,
      ['#102E48','#133B46','#3E392D','#62402D','#7B4028']),
  };
}

export function shot02CubicPoint(
  t:number,p0:{x:number;y:number},p1:{x:number;y:number},
  p2:{x:number;y:number},p3:{x:number;y:number},
):{x:number;y:number} {
  const x=clamp01(t),q=1-x;
  return {
    x:q*q*q*p0.x+3*q*q*x*p1.x+3*q*x*x*p2.x+x*x*x*p3.x,
    y:q*q*q*p0.y+3*q*q*x*p1.y+3*q*x*x*p2.y+x*x*x*p3.y,
  };
}
