import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const component=read('./Ep003Shot03V3DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
describe('EP003 SHOT03 V3 Director review of Primary Database clarity',()=>{
  it('exposes only verified stored V3 full-HD MP4; never renders or locks implicitly',()=>{
    expect(component).toContain('/ep003/shot03/v3/latest-successful');
    expect(component).toContain('EP003_SHOT03_PRIMARY_CLARITY_V3');
    expect(component).toContain('EP003-SHOT03-PRIMARY-CLARITY-V3-DIRECTOR-CANDIDATE');
    expect(component).toContain('record.durationInFrames!==3080');
    expect(component).toContain("record.directorLocked===true");
    expect(component).toContain('controls playsInline preload="metadata"');
    expect(component).not.toContain("method:'POST'");
  });
  it('shows approved wording and retains both V2 and V1 historical videos',()=>{
    expect(component).toContain('Accepts writes; replicas copy changes');
    expect(component).toContain('label is above');
    expect(component).toContain('V3 · RENDERED CANDIDATE · NOT LOCKED');
    expect(page).toContain('<Ep003Shot03V3DirectorReview/>');
    expect(page.indexOf('<Ep003Shot03V3DirectorReview/>')).toBeLessThan(page.indexOf('<Ep003Shot03V2DirectorReview/>'));
    expect(page.indexOf('<Ep003Shot03V2DirectorReview/>')).toBeLessThan(page.indexOf('<Ep003Shot03DirectorReview/>'));
  });
});