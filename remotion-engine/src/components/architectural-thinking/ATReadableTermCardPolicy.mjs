export const atGlossaryTextWidth=(value,fontSize)=>{
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
const smoothstep=value=>{
  const v=Math.max(0,Math.min(1,value));
  return v*v*(3-2*v);
};
export const AT_GLOSSARY_FADE_IN_FRAMES=18;
export const AT_GLOSSARY_FADE_OUT_FRAMES=20;
export const AT_GLOSSARY_MIN_TOTAL_SECONDS=5.5;
export function atGlossaryMinReadableFrames(eyebrow,line,fps=30){
  if(!Number.isFinite(fps)||fps<=0)throw Error('INVALID_CARD_FPS');
  const words=(String(eyebrow)+' '+String(line)).trim().split(/\s+/).filter(Boolean).length;
  const seconds=Math.max(AT_GLOSSARY_MIN_TOTAL_SECONDS,1.8+words/2.6);
  return Math.ceil(seconds*fps);
}
export function atGlossaryCardIsReadable(eyebrow,line,fromFrame,toFrame,fps=30){
  return Number.isFinite(fromFrame)&&Number.isFinite(toFrame)
    &&toFrame>fromFrame
    &&toFrame-fromFrame>=atGlossaryMinReadableFrames(eyebrow,line,fps);
}
export function atGlossaryCardOpacity(frame,fromFrame,toFrame){
  if(!Number.isFinite(frame)||!Number.isFinite(fromFrame)||!Number.isFinite(toFrame)
     ||frame<fromFrame||frame>=toFrame)return 0;
  return smoothstep((frame-fromFrame)/AT_GLOSSARY_FADE_IN_FRAMES)
    *smoothstep((toFrame-frame)/AT_GLOSSARY_FADE_OUT_FRAMES);
}
