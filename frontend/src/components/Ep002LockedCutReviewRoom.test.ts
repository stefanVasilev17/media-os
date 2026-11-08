import {describe,expect,it} from 'vitest';
import {LOCKED_CUT_SHOT_ORDER,cutDuration,locateCutTime}
  from './Ep002LockedCutReviewRoom';

const shots=[
  {durationSeconds:32.64},
  {durationSeconds:61.2},
  {durationSeconds:69.2},
  {durationSeconds:1817/30},
];

describe('EP002 Director locked cut review',()=>{
  it('keeps the immutable approved SHOT sequence',()=>{
    expect(LOCKED_CUT_SHOT_ORDER).toEqual(['SHOT01','SHOT02','SHOT03','SHOT04']);
  });

  it('uses actual measured independent render durations',()=>{
    expect(cutDuration(shots)).toBeCloseTo(32.64+61.2+69.2+1817/30,5);
    expect(cutDuration([])).toBe(0);
  });

  it('seeks over actual MP4 boundaries without estimating editor timestamps',()=>{
    expect(locateCutTime(shots,0)).toEqual({index:0,localSeconds:0});
    expect(locateCutTime(shots,32.64)).toEqual({index:1,localSeconds:0});
    expect(locateCutTime(shots,32.64+61.2)).toEqual({index:2,localSeconds:0});
    expect(locateCutTime(shots,32.64+61.2+69.2))
      .toEqual({index:3,localSeconds:0});
    expect(locateCutTime(shots,32.64+61.2+69.2+10))
      .toEqual({index:3,localSeconds:10});
  });

  it('clamps scrub time to beginning/end of actual cut',()=>{
    expect(locateCutTime(shots,-100)).toEqual({index:0,localSeconds:0});
    const end=locateCutTime(shots,Number.POSITIVE_INFINITY);
    expect(end.index).toBe(0);
    const final=locateCutTime(shots,cutDuration(shots)+100);
    expect(final.index).toBe(3);
    expect(final.localSeconds).toBeCloseTo(1817/30,5);
  });
});
