const clamp01=value=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;

const measuredUppercaseWidth=(value,fontSize)=>{
  let units=0;
  for(const char of value){
    if('MW@#%&'.includes(char))units+=.89;
    else if('IL1|'.includes(char))units+=.37;
    else if(char===' ')units+=.34;
    else if('.,·:/'.includes(char))units+=.32;
    else units+=.65;
  }
  return Math.ceil(units*fontSize*1.05);
};

export const shot09PolicyPanelSize=({heading,line,hasChips=false})=>{
  if(!heading||!line)throw Error('SHOT09_POLICY_PANEL_REQUIRES_SPOKEN_COPY');
  const copyWidth=Math.max(measuredUppercaseWidth(heading,20),
    measuredUppercaseWidth(line,15),hasChips?305:0);
  return {
    width:Math.max(310,Math.min(445,copyWidth+44)),
    height:hasChips?127:106,
  };
};

export const shot09TweenPanelSize=(previous,target,progress)=>{
  const t=clamp01(progress);
  return {
    width:Math.round(previous.width+(target.width-previous.width)*t),
    height:Math.round(previous.height+(target.height-previous.height)*t),
  };
};

export const shot09AdmissionStatusSize=probeReveal=>{
  const t=clamp01(probeReveal);
  return {width:Math.round(94+28*t),height:Math.round(27+5*t)};
};
