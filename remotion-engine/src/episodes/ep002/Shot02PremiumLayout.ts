export type Rect = {left:number;top:number;width:number;height:number};
export type CameraPose = {x:number;y:number;scale:number};

export const SHOT02_VIEWPORT={width:1920,height:1080,originX:960,originY:540} as const;

// Director-approved SHOT01 node centers are immutable. Only local node widths
// are tightened so Gateway and Balancer do not touch each other.
export const SHOT02_NODES={
  gateway:{x:650,y:410,width:258,height:250},
  balancer:{x:927,y:410,width:246,height:250},
  auth:{x:1326,y:315,width:350,height:348},
  database:{x:1697,y:368,width:252,height:280},
} as const;

export const SHOT02_TEXT_LANES={
  brand:{left:66,top:40,width:380,height:42},
  time:{left:650,top:105,width:800,height:115},
  metric:{left:1340,top:830,width:440,height:118},
} as const satisfies Record<string,Rect>;

export const SHOT02_REQUEST_MARKER={left:536,top:710,width:330,height:64} as const;
export const SHOT02_PHONE_VISUAL_SAFE_BOUNDS:Rect={
  left:55,top:160,width:445,height:800,
};
export const shot02Intersects=(a:Rect,b:Rect,margin=0):boolean=>
  a.left < b.left+b.width+margin && a.left+a.width+margin > b.left &&
  a.top < b.top+b.height+margin && a.top+a.height+margin > b.top;

export function shot02ProjectRect(world:Rect,pose:CameraPose):Rect {
  const v=SHOT02_VIEWPORT;
  return {
    left:v.originX+(world.left-v.originX)*pose.scale+pose.x,
    top:v.originY+(world.top-v.originY)*pose.scale+pose.y,
    width:world.width*pose.scale,height:world.height*pose.scale,
  };
}

export function assertShot02TextLanes(pose:CameraPose):void {
  if(!Number.isFinite(pose.x)||!Number.isFinite(pose.y)
     ||!Number.isFinite(pose.scale)||pose.scale<.98||pose.scale>1.02
     ||Math.abs(pose.x)>24||Math.abs(pose.y)>24)
    throw Error('SHOT02_CAMERA_CONTRACT_INVALID');
  const fixed=Object.entries(SHOT02_TEXT_LANES);
  for(const [id,box] of fixed){
    if(box.left<44||box.top<40
        ||box.left+box.width>SHOT02_VIEWPORT.width-40
        ||box.top+box.height>SHOT02_VIEWPORT.height-40)
      throw Error('SHOT02_TEXT_SAFE_AREA_OUTSIDE_FRAME_'+id);
    for(const [otherId,otherBox] of fixed){
      if(id<otherId && shot02Intersects(box,otherBox,20))
        throw Error('SHOT02_TEXT_LANES_OVERLAP_'+id+'_'+otherId);
    }
  }
  const world=[
    ...Object.values(SHOT02_NODES).map(n=>({
      left:n.x-n.width/2,top:n.y,width:n.width,height:n.height,
    })),
  ];
  for(const [label,box] of fixed){
    for(const node of world){
      if(shot02Intersects(box,shot02ProjectRect(node,pose),12))
        throw Error('SHOT02_TEXT_OVERLAPS_ARCHITECTURE_'+label);
    }
  }
}
