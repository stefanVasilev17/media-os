import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const shot=read('./Ep003Shot04V1DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const full=read('./Ep003CumulativeFullVideo.tsx');
describe('EP003 SHOT04 V1 Director-LOCKED source review, SHA-pinned source only',()=>{
 it('shows only saved authentic 1080p MP4 from the exact SHOT04 composition',()=>{
  expect(shot).toContain('/ep003/shot04/v1/latest-successful');
  expect(shot).toContain('EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE');
  expect(shot).toContain('EP003_SHOT04_READ_WRITE_SPLITTING_V1');
  expect(shot).toContain('record.durationInFrames<1500');
  expect(shot).toContain('record.durationInFrames>7200');
  expect(shot).toContain('record.renderId!==LOCKED_RENDER_ID');
  expect(shot).toContain("LOCKED_RENDER_ID='4079729b-c1b3-405c-9a83-1ace0ef25641'");
  expect(shot).toContain('controls playsInline preload="metadata"');
  expect(shot).toContain('V1 · DIRECTOR-LOCKED · OFFICIAL MASTER');
  expect(shot).not.toContain("method:'POST'");
 });
 it('preserves one latest official full film, four shots locked and fifth review only',()=>{
  expect((page.match(/<Ep003CumulativeFullVideo\/>/g)||[])).toHaveLength(1);
  expect(page.indexOf('<Ep003Shot04V1DirectorReview/>')).toBeGreaterThan(page.indexOf('<Ep003Shot03V4DirectorReview/>'));
  expect(page).not.toContain('<Ep003Shot03V4ThreeShotWipFilm/>');
  expect(page).not.toContain('<Ep003WipShot02V4FullFilm/>');
  expect(full).toContain('shotCount<3||shotCount>30');
 });
});