export const EP003_CARD_FADE_IN_FRAMES=18;
export const EP003_CARD_FADE_OUT_FRAMES=20;
export const EP003_CARD_MIN_TOTAL_SECONDS=5.5;
const smoothstep=(value)=>{
  const v=Math.max(0,Math.min(1,value));
  return v*v*(3-2*v);
};
export function ep003MinReadableCardFrames(eyebrow,line,fps=30){
  if(!Number.isFinite(fps)||fps<=0)throw Error('INVALID_CARD_FPS');
  const words=(String(eyebrow)+' '+String(line)).trim().split(/\s+/).filter(Boolean).length;
  const seconds=Math.max(EP003_CARD_MIN_TOTAL_SECONDS,1.8+words/2.6);
  return Math.ceil(seconds*fps);
}
export function ep003CardIsReadable(eyebrow,line,fromFrame,toFrame,fps=30){
  return Number.isFinite(fromFrame)&&Number.isFinite(toFrame)
    &&toFrame>fromFrame
    &&toFrame-fromFrame>=ep003MinReadableCardFrames(eyebrow,line,fps);
}
export function ep003CardOpacity(frame,fromFrame,toFrame){
  if(!Number.isFinite(frame)||!Number.isFinite(fromFrame)||!Number.isFinite(toFrame)
     ||frame<fromFrame||frame>=toFrame)return 0;
  return smoothstep((frame-fromFrame)/EP003_CARD_FADE_IN_FRAMES)
    *smoothstep((toFrame-frame)/EP003_CARD_FADE_OUT_FRAMES);
}
