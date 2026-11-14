import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const cmp=read('./Ep003Shot03V2DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
describe('EP003 SHOT03 V2 Director review',()=>{
  it('only exposes the exact new database replicas V2 completed review MP4',()=>{
    expect(cmp).toContain('/ep003/shot03/v2/latest-successful');
    expect(cmp).toContain('EP003_SHOT03_DATABASE_REPLICAS_V2');
    expect(cmp).toContain('EP003-SHOT03-DATABASE-REPLICAS-V2-DIRECTOR-CANDIDATE');
    expect(cmp).toContain('record.durationInFrames!==3080');
    expect(cmp).toContain("record.directorLocked===true");
    expect(cmp).toContain('controls playsInline preload="metadata"');
  });
  it('preserves historical V1 and does not silently Director lock or rerender',()=>{
    expect(page).toContain('<Ep003Shot03V2DirectorReview/>');
    expect(page.indexOf('<Ep003Shot03V2DirectorReview/>'))
      .toBeLessThan(page.indexOf('<Ep003Shot03DirectorReview/>'));
    expect(cmp).toContain('NOT LOCKED');
    expect(cmp).not.toContain("method:'POST'");
  });
});