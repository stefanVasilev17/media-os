export type Rect = {left:number;top:number;width:number;height:number};
export type CameraPose = {x:number;y:number;scale:number};

export const SHOT02_VIEWPORT={width:1920,height:1080,originX:960,originY:540} as const;

// Director-approved SHOT01 node centers are immutable. Only local node widths
// are tightened so Gateway and Balancer do not touch each other.
export const SHOT02_NODES={
  gateway:{x:934,y:420,width:198,height:205},
  balancer:{x:1161,y:420,width:212,height:205},
  auth:{x:1510,y:298,width:395,height:354},
  database:{x:2140,y:421,width:274,height:224},
} as const;

// All explanatory typography lives OUTSIDE the animated architecture camera.
// No floating labels, counters, or caption cards are allowed over node faces.
export const SHOT02_TEXT_LANES={
  brand:{left:80,top:48,width:385,height:46},
  time:{left:850,top:127,width:348,height:65},
  metric:{left:1330,top:842,width:490,height:116},
} as const satisfies Record<string,Rect>;

const phoneProxy:Rect={left:320,top:165,width:450,height:815};
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
     ||!Number.isFinite(pose.scale)||pose.scale<.7||pose.scale>1.25)
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
    phoneProxy,
  ];
  for(const [label,box] of fixed){
    for(const node of world){
      if(shot02Intersects(box,shot02ProjectRect(node,pose),12))
        throw Error('SHOT02_TEXT_OVERLAPS_ARCHITECTURE_'+label);
    }
  }
}
