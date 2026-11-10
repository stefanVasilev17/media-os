import {describe,expect,it} from 'vitest';
import {LOCKED_CUT_SHOT_ORDER,DIRECTOR_REVIEW_BOUNDARIES,
  actualShotOrderIsContinuous,cutDuration,locateCutTime}
  from './Ep002LockedCutReviewRoom';

const shots=[
  {durationSeconds:32.64},
  {durationSeconds:61.2},
  {durationSeconds:69.2},
  {durationSeconds:1817/30},
  {durationSeconds:2780/30},
];

describe('EP002 Director locked cut review',()=>{
  it('keeps the immutable approved SHOT sequence',()=>{
    expect(LOCKED_CUT_SHOT_ORDER).toEqual([
      'SHOT01','SHOT02','SHOT03','SHOT04','SHOT05','SHOT06','SHOT07','SHOT08',
    ]);
  });

  it('prepares real stored MP4 seam review for 05→06→07→08 and refuses gaps',()=>{
    expect(DIRECTOR_REVIEW_BOUNDARIES).toEqual([
      {from:'SHOT05',to:'SHOT06',label:'Review 05 → 06'},
      {from:'SHOT06',to:'SHOT07',label:'Review 06 → 07'},
      {from:'SHOT07',to:'SHOT08',label:'Review 07 → 08'},
    ]);
    expect(actualShotOrderIsContinuous('SHOT05','SHOT06')).toBe(true);
    expect(actualShotOrderIsContinuous('SHOT06','SHOT07')).toBe(true);
    expect(actualShotOrderIsContinuous('SHOT07','SHOT08')).toBe(true);
    expect(actualShotOrderIsContinuous('SHOT05','SHOT07')).toBe(false);
    expect(actualShotOrderIsContinuous('SHOT07','SHOT09')).toBe(false);
  });

  it('uses actual measured independent render durations',()=>{
    expect(cutDuration(shots)).toBeCloseTo(32.64+61.2+69.2+1817/30+2780/30,5);
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
    expect(locateCutTime(shots,32.64+61.2+69.2+1817/30))
      .toEqual({index:4,localSeconds:0});
    expect(locateCutTime(shots,32.64+61.2+69.2+1817/30+10))
      .toEqual({index:4,localSeconds:10});
  });

  it('clamps scrub time to beginning/end of actual cut',()=>{
    expect(locateCutTime(shots,-100)).toEqual({index:0,localSeconds:0});
    const end=locateCutTime(shots,Number.POSITIVE_INFINITY);
    expect(end.index).toBe(0);
    const final=locateCutTime(shots,cutDuration(shots)+100);
    expect(final.index).toBe(4);
    expect(final.localSeconds).toBeCloseTo(2780/30,5);
  });
});
