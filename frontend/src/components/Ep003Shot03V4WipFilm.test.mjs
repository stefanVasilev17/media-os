import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const shot=read('./Ep003Shot03V4DirectorReview.tsx');
const wip=read('./Ep003Shot03V4ThreeShotWipFilm.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
describe('EP003 SHOT03 V4 and three-shot WIP Director review',()=>{
  it('requires a completed SHOT03 V4 and the exact Director punctuation',()=>{
    expect(shot).toContain('/ep003/shot03/v4/latest-successful');
    expect(shot).toContain('EP003_SHOT03_WORDING_V4');
    expect(shot).toContain('Accepts writes. Replica copy changes');
    expect(shot).toContain('record.durationInFrames!==3080');
    expect(shot).toContain('record.directorLocked===true');
    expect(shot).not.toContain("method:'POST'");
  });
  it('requires exactly a 9037-frame WIP with two valid cut positions',()=>{
    expect(wip).toContain('/ep003/cumulative/wip-3shot-v4/latest-successful');
    expect(wip).toContain('EP003_WIP_LOCKED_01_02_PLUS_SHOT03_WORDING_V4_03');
    expect(wip).toContain('info.durationInFrames!==9037');
    expect(wip).toContain('info.directorLocked===true');
    expect(wip).toContain('5:01.23');
    expect(wip).toContain('1:23.80');
    expect(wip).toContain('3:18.57');
    expect(wip).toContain('WIP · NOT LOCKED · DIRECTOR REVIEW');
    expect(wip).toContain('controls playsInline preload="metadata"');
    expect(wip).not.toContain("method:'POST'");
  });
  it('shows WIP below official master and V4 ahead of historical versions',()=>{
    const master=page.indexOf('<Ep003CumulativeFullVideo/>');
    const wipPos=page.indexOf('<Ep003Shot03V4ThreeShotWipFilm/>');
    const v4=page.indexOf('<Ep003Shot03V4DirectorReview/>');
    const v3=page.indexOf('<Ep003Shot03V3DirectorReview/>');
    const v2=page.indexOf('<Ep003Shot03V2DirectorReview/>');
    const v1=page.indexOf('<Ep003Shot03DirectorReview/>');
    expect(master).toBeGreaterThan(-1);
    expect(wipPos).toBeGreaterThan(master);
    expect(v4).toBeGreaterThan(wipPos);
    expect(v3).toBeGreaterThan(v4);
    expect(v2).toBeGreaterThan(v3);
    expect(v1).toBeGreaterThan(v2);
  });
});