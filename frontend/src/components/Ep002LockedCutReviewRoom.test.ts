import {describe,expect,it,vi} from 'vitest';
import {LOCKED_CUT_SHOT_ORDER,DIRECTOR_REVIEW_BOUNDARIES,
  actualShotOrderIsContinuous,cutDuration,locateCutTime,loadLockedCut}
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

describe('EP002 real stored MP4 continuity discovery',()=>{
  it('pins Director-locked SHOT06 V2 and looks up only SHOT07/08 as review candidates',async()=>{
    const ids:Record<string,string>={
      SHOT01:'00000000-0000-4000-8000-000000000001',
      SHOT02:'59567d1a-6a45-4e48-b390-8ae583f30171',
      SHOT03:'6e8ea02e-1de1-440b-9e2a-dc23d07c466c',
      SHOT04:'b006202f-7587-4f82-931a-fadf5eacbfcb',
      SHOT05:'b2b95685-8e1b-41df-9fe2-c83eefbf86e9',
      SHOT06:'d42fe3a2-3810-4626-ab3a-0456463d4636',
      SHOT07:'00000000-0000-4000-8000-000000000007',
      SHOT08:'00000000-0000-4000-8000-000000000008',
    };
    const lookup=Object.fromEntries(Object.entries(ids).map(([shot,id])=>[id,shot]));
    const mock=vi.fn(async(url:string)=>{
      let result:unknown={status:'EMPTY'};
      if(url.endsWith('/SHOT01/render-preview'))result={status:'SUCCEEDED',renderId:ids.SHOT01};
      else if(url.includes('/latest-successful?profile=REVIEW')){
        const shot=url.match(/EP002-(SHOT0[678])-CANDIDATE/)?.[1];
        if(shot)result={renderId:ids[shot],status:'READY',
          compositionId:'EP002-'+shot+'-CANDIDATE',
          width:1920,height:1080,fps:30,durationInFrames:2314,
          videoUrl:'/api/v1/remotion/renders/'+ids[shot]+'/video'};
      }else{
        const id=url.split('/').pop()!;
        const shot=lookup[id];
        if(shot)result={renderId:id,compositionId:shot==='SHOT01'
          ?'EP002-SHOT01-DRAFT':'EP002-'+shot+'-CANDIDATE',
          status:'READY',width:1920,height:1080,fps:30,
          durationInFrames:2000,
          videoUrl:'/api/v1/remotion/renders/'+id+'/video'};
      }
      return new Response(JSON.stringify(result),{
        status:200,headers:{'Content-Type':'application/json'},
      });
    });
    vi.stubGlobal('fetch',mock);
    try{
      const result=await loadLockedCut();
      expect(result.missing).toEqual([]);
      expect(result.shots.map(s=>s.shotKey)).toEqual(LOCKED_CUT_SHOT_ORDER);
      expect(result.shots[4].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[5].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[5].renderId).toBe(ids.SHOT06);
      expect(result.shots[5].durationSeconds).toBeCloseTo(2000/30,5);
      expect(result.shots.slice(6).every(s=>s.source==='LIVE_DIRECTOR_REVIEW_CANDIDATE'))
        .toBe(true);
      expect(result.shots[7].durationSeconds).toBeCloseTo(2314/30,5);
      expect(mock.mock.calls.filter(([url])=>url.includes('/latest-successful?profile=REVIEW')).length)
        .toBe(2);
      expect(mock.mock.calls.some(([url])=>url.includes('EP002-SHOT06-CANDIDATE/latest-successful')))
        .toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes('render-preview/SHOT08')))
        .toBe(false);
    }finally{vi.unstubAllGlobals();}
  });

  it('does not claim a missing SHOT06 is a seamless 05→07 cut',async()=>{
    const calls:Record<string,number>={};
    vi.stubGlobal('fetch',async(url:string)=>{
      calls[url]=(calls[url]??0)+1;
      return new Response(JSON.stringify({status:'EMPTY'}),{
        status:200,headers:{'Content-Type':'application/json'},
      });
    });
    try{
      const result=await loadLockedCut();
      expect(result.shots).toEqual([]);
      expect(result.missing.some(s=>s.startsWith('SHOT06:'))).toBe(true);
      expect(actualShotOrderIsContinuous('SHOT05','SHOT07')).toBe(false);
    }finally{vi.unstubAllGlobals();}
  });
});
