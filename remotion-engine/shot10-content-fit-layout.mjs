const clamp=(v)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;

export const shot10TextWidth=(value,fontSize)=>{
  if(typeof value!=='string'||!value.trim()||!Number.isFinite(fontSize)||fontSize<12)
    throw Error('SHOT10_CONTENT_FIT_REQUIRES_REAL_READABLE_TEXT');
  let units=0;
  for(const c of value){
    if('MW@#%&'.includes(c))units+=.95;
    else if('IJ1|!'.includes(c))units+=.43;
    else if(c===' ')units+=.36;
    else if('.,:·/\u2192'.includes(c))units+=.43;
    else if('OSCGQ0'.includes(c))units+=.75;
    else units+=.70;
  }
  return Math.ceil(units*fontSize*1.045);
};

export const shot10ContentCardSize=({heading,primary})=>({
  width:Math.max(244,Math.min(445,
    Math.max(shot10TextWidth(heading,18),shot10TextWidth(primary,20))+45)),
  height:89,
});

export const shot10CaptionSize=({main,detail})=>({
  width:Math.max(265,Math.min(1060,
    shot10TextWidth(main,22)+shot10TextWidth(detail,19)+65)),
  height:56,
});

export const shot10DbMeterSize=()=>({width:219,height:72});

export const shot10TweenSize=(previous,target,progress)=>{
  const t=clamp(progress);
  return {
    width:Math.round(previous.width+(target.width-previous.width)*t),
    height:Math.round(previous.height+(target.height-previous.height)*t),
  };
};
