import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const review=read('./Ep003Shot06V1DirectorReview.tsx');
const locked=read('./Ep003Shot05V1DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const full=read('./Ep003CumulativeFullVideo.tsx');
describe('EP003 SHOT06 V1 Director-LOCKED source with SHOT07 unapproved candidate',()=>{
 it('loads exact saved SHOT06 V1 Director-LOCKED source, no accidental alternative render',()=>{
  expect(review).toContain('/ep003/shot06/v1/latest-successful');
  expect(review).toContain('EP003-SHOT06-CORRECTNESS-V1-DIRECTOR-CANDIDATE');
  expect(review).toContain('EP003_SHOT06_CORRECTNESS_V1');
  expect(review).toContain('record.durationInFrames<1500');
  expect(review).toContain('record.durationInFrames>7200');
  expect(review).toContain("LOCKED_RENDER_ID='0007bd16-edbf-4ecc-927a-4a5781d0b921'");
  expect(review).toContain('record.renderId!==LOCKED_RENDER_ID');
  expect(review).toContain('controls playsInline preload="metadata"');
  expect(review).toContain('V1 · DIRECTOR-LOCKED · OFFICIAL MASTER');
  expect(review).not.toContain("method:'POST'");
 });
 it('pins exact source both for previous SHOT05 and currently approved SHOT06',()=>{
  expect(locked).toContain("LOCKED_RENDER_ID='04b9f55a-7705-4f23-b9f7-a0103e8c955b'");
  expect(locked).toContain('record.renderId!==LOCKED_RENDER_ID');
  expect(locked).toContain('V1 · DIRECTOR-LOCKED · OFFICIAL MASTER');
  expect(review).toContain('SHOT06 V1 is now Director-LOCKED');
 });
 it('only one latest official film and SHOT07 candidate follows locked SHOT06',()=>{
  expect((page.match(/<Ep003CumulativeFullVideo\/>/g)||[])).toHaveLength(1);
  expect(page.indexOf('<Ep003Shot06V1DirectorReview/>')).toBeGreaterThan(page.indexOf('<Ep003Shot05V1DirectorReview/>'));
  expect(page.indexOf('<Ep003Shot07V1DirectorReview/>')).toBeGreaterThan(page.indexOf('<Ep003Shot06V1DirectorReview/>'));
  expect(page).not.toContain('<Ep003Shot03V4ThreeShotWipFilm/>');
  expect(page).not.toContain('<Ep003WipShot02V4FullFilm/>');
  expect(full).toContain('/ep003/cumulative/latest-successful');
  expect(full).toContain('shotCount<3||shotCount>30');
 });
});