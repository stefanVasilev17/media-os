import {shot10TextWidth} from './shot10-content-fit-layout.mjs';

export const SHOT11_LARGE_AMBER_STORY=Object.freeze([
  Object.freeze({
    cue:'ONE_DATABASE',
    eyebrow:'ONE SHARED BOTTLENECK',
    headline:'THREE AUTH SERVERS. ONE DATABASE.',
    featured:false,
  }),
  Object.freeze({
    cue:'REJECT_EXCESS',
    eyebrow:'NO EXTRA DATABASE CAPACITY',
    headline:'RETRIES LIMITED. EXCESS WORK REJECTED.',
    featured:false,
  }),
  Object.freeze({
    cue:'FAST_FAILURE',
    eyebrow:'THE TRADE-OFF',
    headline:'ONE LOGIN FAILS FAST. ANOTHER FINISHES.',
    featured:false,
  }),
  Object.freeze({
    cue:'HEALTHY_NOT_AVAILABLE',
    eyebrow:'HEALTHY ≠ AVAILABLE',
    headline:'THE WHOLE LOGIN MUST SUCCEED.',
    featured:false,
  }),
  Object.freeze({
    cue:'ONE_DB_QUESTION',
    eyebrow:'ONE DATABASE IS NOT ENOUGH?',
    headline:'NEXT: MULTIPLE DATABASE INSTANCES.',
    featured:true,
  }),
]);

export const shot11LargeAmberSize=({eyebrow,headline,featured=false})=>{
  const headingFont=featured?31:30;
  const headlineFont=featured?43:42;
  const naturalWidth=Math.max(
    shot10TextWidth(eyebrow,headingFont),
    shot10TextWidth(headline,headlineFont))+94;
  if(naturalWidth>1240){
    throw Error('SHOT11_LARGE_AMBER_TEXT_EXCEEDS_SAFE_FRAME');
  }
  return {
    width:Math.max(530,naturalWidth),
    height:featured?176:166,
    headingFont,headlineFont,
  };
};

export const shot11LargeAmberIndex=(frame,positions)=>{
  let active=-1;
  for(let i=0;i<SHOT11_LARGE_AMBER_STORY.length;i++){
    if(frame>=positions[SHOT11_LARGE_AMBER_STORY[i].cue])active=i;
  }
  return active;
};
