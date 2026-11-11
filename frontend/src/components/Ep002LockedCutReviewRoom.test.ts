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
      'SHOT01','SHOT02','SHOT03','SHOT04','SHOT05','SHOT06','SHOT07','SHOT08','SHOT09','SHOT10','SHOT11',
    ]);
  });

  it('prepares real stored MP4 seam review for 05→06→07→08 and refuses gaps',()=>{
    expect(DIRECTOR_REVIEW_BOUNDARIES).toEqual([
      {from:'SHOT05',to:'SHOT06',label:'Review 05 → 06'},
      {from:'SHOT06',to:'SHOT07',label:'Review 06 → 07'},
      {from:'SHOT07',to:'SHOT08',label:'Review 07 → 08'},
      {from:'SHOT08',to:'SHOT09',label:'Review 08 → 09'},
      {from:'SHOT09',to:'SHOT10',label:'Review 09 → 10'},
      {from:'SHOT10',to:'SHOT11',label:'Review 10 → 11'},
    ]);
    expect(actualShotOrderIsContinuous('SHOT05','SHOT06')).toBe(true);
    expect(actualShotOrderIsContinuous('SHOT06','SHOT07')).toBe(true);
    expect(actualShotOrderIsContinuous('SHOT07','SHOT08')).toBe(true);
    expect(actualShotOrderIsContinuous('SHOT08','SHOT09')).toBe(true);
    expect(actualShotOrderIsContinuous('SHOT09','SHOT10')).toBe(true);
    expect(actualShotOrderIsContinuous('SHOT10','SHOT11')).toBe(true);
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
  it('pins exactly approved SHOT07 V3 and SHOT08 after SHOT06, both Director LOCKED',async()=>{
    const ids:Record<string,string>={
      SHOT01:'00000000-0000-4000-8000-000000000001',
      SHOT02:'59567d1a-6a45-4e48-b390-8ae583f30171',
      SHOT03:'6e8ea02e-1de1-440b-9e2a-dc23d07c466c',
      SHOT04:'b006202f-7587-4f82-931a-fadf5eacbfcb',
      SHOT05:'b2b95685-8e1b-41df-9fe2-c83eefbf86e9',
      SHOT06:'d42fe3a2-3810-4626-ab3a-0456463d4636',
      SHOT07:'b2a335dd-cb71-48f2-bf47-0f8bdcdd969d',
      SHOT08:'3415073a-5906-489d-bb69-6af7446c2c9b',
      SHOT09:'d4b6c8ff-10c5-4181-aa59-fcd16a4470ba',
      SHOT10:'2034d8c6-99b2-46a5-9469-bf3df325d6c0',
      SHOT11:'73ec0e6f-d348-4518-a32b-573bf89a8ab5',
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
          durationInFrames:shot==='SHOT07'?2674:shot==='SHOT08'?2314:shot==='SHOT09'?3063:shot==='SHOT10'?2360:shot==='SHOT11'?1572:2000,
          videoUrl:'/api/v1/remotion/renders/'+id+'/video'};
      }
      return new Response(JSON.stringify(result),{
        status:200,headers:{'Content-Type':'application/json'},
      });
    });
    vi.stubGlobal('fetch',mock);
    try{
      const result=await loadLockedCut();
      expect(result.missing).toHaveLength(0);
      expect(result.shots.map(s=>s.shotKey)).toEqual(
        ['SHOT01','SHOT02','SHOT03','SHOT04','SHOT05','SHOT06','SHOT07','SHOT08','SHOT09','SHOT10','SHOT11']);
      expect(result.shots[4].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[5].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[5].renderId).toBe(ids.SHOT06);
      expect(result.shots[5].durationSeconds).toBeCloseTo(2000/30,5);
      expect(result.shots[6].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[6].renderId).toBe(ids.SHOT07);
      expect(result.shots[6].durationSeconds).toBeCloseTo(2674/30,5);
      expect(result.shots[7].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[7].renderId).toBe(ids.SHOT08);
      expect(result.shots[7].durationSeconds).toBeCloseTo(2314/30,5);
      expect(result.shots[8].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[8].renderId).toBe(ids.SHOT09);
      expect(result.shots[8].durationSeconds).toBeCloseTo(3063/30,5);
      expect(result.shots[9].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[9].renderId).toBe(ids.SHOT10);
      expect(result.shots[9].durationSeconds).toBeCloseTo(2360/30,5);
      expect(result.shots[10].source).toBe('PINNED_DIRECTOR_LOCK');
      expect(result.shots[10].renderId).toBe(ids.SHOT11);
      expect(result.shots[10].durationSeconds).toBeCloseTo(1572/30,5);
      expect(actualShotOrderIsContinuous(result.shots[5].shotKey,
        result.shots[6].shotKey)).toBe(true);
      expect(actualShotOrderIsContinuous(result.shots[6].shotKey,
        result.shots[7].shotKey)).toBe(true);
      expect(mock.mock.calls.some(([url])=>url.includes(
        '/api/v1/remotion/renders/'+ids.SHOT11))).toBe(true);
      expect(mock.mock.calls.filter(([url])=>url.includes('/latest-successful')).length)
        .toBe(0);
      expect(mock.mock.calls.some(([url])=>url.includes(
        '/api/v1/remotion/renders/'+ids.SHOT08))).toBe(true);
      expect(mock.mock.calls.some(([url])=>url.includes('EP002-SHOT06-CANDIDATE/latest-successful')))
        .toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes('EP002-SHOT07-CANDIDATE/latest-successful')))
        .toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes('EP002-SHOT08-CANDIDATE/latest-successful')))
        .toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes('5ef67a78-76df-476c-938d-eb421d83549b')))
        .toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes('render-preview/SHOT08')))
        .toBe(false);
    }finally{vi.unstubAllGlobals();}
  });

  it('fails closed when pinned V3 MP4 is missing and never falls back to an old SHOT07',async()=>{
    const ids:Record<string,string>={
      SHOT01:'00000000-0000-4000-8000-000000000001',
      SHOT02:'59567d1a-6a45-4e48-b390-8ae583f30171',
      SHOT03:'6e8ea02e-1de1-440b-9e2a-dc23d07c466c',
      SHOT04:'b006202f-7587-4f82-931a-fadf5eacbfcb',
      SHOT05:'b2b95685-8e1b-41df-9fe2-c83eefbf86e9',
      SHOT06:'d42fe3a2-3810-4626-ab3a-0456463d4636',
      SHOT08:'3415073a-5906-489d-bb69-6af7446c2c9b',
      SHOT09:'d4b6c8ff-10c5-4181-aa59-fcd16a4470ba',
      SHOT10:'2034d8c6-99b2-46a5-9469-bf3df325d6c0',
      SHOT11:'73ec0e6f-d348-4518-a32b-573bf89a8ab5',
    };
    const lookup=Object.fromEntries(Object.entries(ids).map(([shot,id])=>[id,shot]));
    const mock=vi.fn(async(url:string)=>{
      let result:Record<string,unknown>={status:'EMPTY'};
      if(url.endsWith('/SHOT01/render-preview'))result={status:'SUCCEEDED',renderId:ids.SHOT01};
      else if(url.includes('/latest-successful?profile=REVIEW')){
        result={renderId:ids.SHOT08,compositionId:'EP002-SHOT08-CANDIDATE',
          status:'READY',width:1920,height:1080,fps:30,durationInFrames:2314,
          videoUrl:'/api/v1/remotion/renders/'+ids.SHOT08+'/video'};
      }else{
        const id=url.split('/').pop()!;
        const shot=lookup[id];
        if(shot)result={renderId:id,compositionId:shot==='SHOT01'
          ?'EP002-SHOT01-DRAFT':'EP002-'+shot+'-CANDIDATE',
          status:'READY',width:1920,height:1080,fps:30,
          durationInFrames:shot==='SHOT08'?2314:shot==='SHOT09'?3063:shot==='SHOT10'?2360:shot==='SHOT11'?1572:2000,
          videoUrl:'/api/v1/remotion/renders/'+id+'/video'};
      }
      return new Response(JSON.stringify(result),{
        status:200,headers:{'Content-Type':'application/json'},
      });
    });
    vi.stubGlobal('fetch',mock);
    try{
      const result=await loadLockedCut();
      expect(result.missing.some(s=>s.startsWith('SHOT07:'))).toBe(true);
      expect(result.shots.map(s=>s.shotKey)).toEqual(
        ['SHOT01','SHOT02','SHOT03','SHOT04','SHOT05','SHOT06','SHOT08','SHOT09','SHOT10','SHOT11']);
      expect(result.shots.at(-1)?.renderId).toBe(ids.SHOT11);
      expect(actualShotOrderIsContinuous(result.shots[5].shotKey,
        result.shots[6].shotKey)).toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes(
        '/api/v1/remotion/renders/b2a335dd-cb71-48f2-bf47-0f8bdcdd969d'))).toBe(true);
      expect(mock.mock.calls.some(([url])=>url.includes(
        '5f795361-b1f6-4d9f-90b3-e53dcea9a733'))).toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes(
        '5ef67a78-76df-476c-938d-eb421d83549b'))).toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes(
        'EP002-SHOT07-CANDIDATE/latest-successful'))).toBe(false);
    }finally{vi.unstubAllGlobals();}
  });

  it('rejects an unapproved SHOT08 render or incorrect 2314-frame media without fallback',async()=>{
    const ids:Record<string,string>={
      SHOT01:'00000000-0000-4000-8000-000000000001',
      SHOT02:'59567d1a-6a45-4e48-b390-8ae583f30171',
      SHOT03:'6e8ea02e-1de1-440b-9e2a-dc23d07c466c',
      SHOT04:'b006202f-7587-4f82-931a-fadf5eacbfcb',
      SHOT05:'b2b95685-8e1b-41df-9fe2-c83eefbf86e9',
      SHOT06:'d42fe3a2-3810-4626-ab3a-0456463d4636',
      SHOT07:'b2a335dd-cb71-48f2-bf47-0f8bdcdd969d',
      SHOT08:'3415073a-5906-489d-bb69-6af7446c2c9b',
      SHOT09:'d4b6c8ff-10c5-4181-aa59-fcd16a4470ba',
      SHOT10:'2034d8c6-99b2-46a5-9469-bf3df325d6c0',
      SHOT11:'73ec0e6f-d348-4518-a32b-573bf89a8ab5',
    };
    const lookup=Object.fromEntries(Object.entries(ids).map(([shot,id])=>[id,shot]));
    const fetchMock=vi.fn(async(url:string)=>{
      let result:Record<string,unknown>={status:'EMPTY'};
      if(url.endsWith('/SHOT01/render-preview'))result={status:'SUCCEEDED',renderId:ids.SHOT01};
      else {
        const id=url.split('/').pop()!;
        const shot=lookup[id];
        if(shot)result={renderId:id,
          compositionId:shot==='SHOT01'?'EP002-SHOT01-DRAFT':'EP002-'+shot+'-CANDIDATE',
          status:'READY',width:1920,height:1080,fps:30,
          durationInFrames:shot==='SHOT07'?2674:shot==='SHOT08'?2313:shot==='SHOT09'?3063:shot==='SHOT10'?2360:shot==='SHOT11'?1572:2000,
          videoUrl:'/api/v1/remotion/renders/'+id+'/video'};
      }
      return new Response(JSON.stringify(result),{
        status:200,headers:{'Content-Type':'application/json'},
      });
    });
    vi.stubGlobal('fetch',fetchMock);
    try{
      const result=await loadLockedCut();
      expect(result.shots.map(x=>x.shotKey)).toEqual(
        ['SHOT01','SHOT02','SHOT03','SHOT04','SHOT05','SHOT06','SHOT07','SHOT09','SHOT10','SHOT11']);
      expect(result.missing.some(x=>x.startsWith('SHOT08:'))).toBe(true);
      expect(result.shots.at(-1)?.renderId).toBe(ids.SHOT11);
      expect(fetchMock.mock.calls.some(([url])=>url.includes(
        '/api/v1/remotion/renders/'+ids.SHOT08))).toBe(true);
      expect(fetchMock.mock.calls.some(([url])=>url.includes('/latest-successful'))).toBe(false);
      expect(fetchMock.mock.calls.some(([url])=>url.includes(
        'EP002-SHOT08-CANDIDATE/latest-successful'))).toBe(false);
      expect(actualShotOrderIsContinuous(result.shots[6].shotKey,'SHOT08')).toBe(true);
    }finally{vi.unstubAllGlobals();}
  });

  it('refuses an incorrect SHOT11 frame count without using a newer substitute',async()=>{
    const id='73ec0e6f-d348-4518-a32b-573bf89a8ab5';
    const mock=vi.fn(async(url:string)=>{
      if(url.endsWith('/'+id))return new Response(JSON.stringify({
        renderId:id,status:'READY',
        compositionId:'EP002-SHOT11-CANDIDATE',
        durationInFrames:1571,width:1920,height:1080,fps:30,
        videoUrl:'/api/v1/remotion/renders/'+id+'/video'
      }),{status:200,headers:{'Content-Type':'application/json'}});
      return new Response(JSON.stringify({status:'EMPTY'}),{
        status:200,headers:{'Content-Type':'application/json'}});
    });
    vi.stubGlobal('fetch',mock);
    try{
      const result=await loadLockedCut();
      expect(result.missing.some(x=>x.startsWith('SHOT11:'))).toBe(true);
      expect(result.shots.some(x=>x.shotKey==='SHOT11')).toBe(false);
      expect(mock.mock.calls.some(([url])=>url.includes('/'+id))).toBe(true);
      expect(mock.mock.calls.some(([url])=>url.includes('/latest-successful')))
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
      expect(result.missing.some(s=>s.startsWith('SHOT07:'))).toBe(true);
      expect(actualShotOrderIsContinuous('SHOT05','SHOT07')).toBe(false);
    }finally{vi.unstubAllGlobals();}
  });
});
