import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const review=read('./Ep003Shot06V1DirectorReview.tsx');
const locked=read('./Ep003Shot05V1DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const full=read('./Ep003CumulativeFullVideo.tsx');
describe('EP003 SHOT06 V1 candidate and SHOT05 Director LOCK with single official master',()=>{
 it('loads only completed real SHOT06 V1 candidate in Director Review, never locks automatically',()=>{
  expect(review).toContain('/ep003/shot06/v1/latest-successful');
  expect(review).toContain('EP003-SHOT06-CORRECTNESS-V1-DIRECTOR-CANDIDATE');
  expect(review).toContain('EP003_SHOT06_CORRECTNESS_V1');
  expect(review).toContain('record.durationInFrames<1500');
  expect(review).toContain('record.durationInFrames>7200');
  expect(review).toContain('record.directorLocked===true');
  expect(review).toContain('controls playsInline preload="metadata"');
  expect(review).toContain('NOT LOCKED');
  expect(review).not.toContain("method:'POST'");
 });
 it('pins exact SHOT05 immutable Director-LOCK source and does not infer SHOT06 approval',()=>{
  expect(locked).toContain("LOCKED_RENDER_ID='04b9f55a-7705-4f23-b9f7-a0103e8c955b'");
  expect(locked).toContain('record.renderId!==LOCKED_RENDER_ID');
  expect(locked).toContain('V1 · DIRECTOR-LOCKED · OFFICIAL MASTER');
  expect(review).toContain('SHOT06 V1 is NOT LOCKED');
 });
 it('only one latest official film, SHOT06 review panel below SHOT05, no redundant WIP full-film players',()=>{
  expect((page.match(/<Ep003CumulativeFullVideo\/>/g)||[])).toHaveLength(1);
  expect(page.indexOf('<Ep003Shot06V1DirectorReview/>')).toBeGreaterThan(page.indexOf('<Ep003Shot05V1DirectorReview/>'));
  expect(page).not.toContain('<Ep003Shot03V4ThreeShotWipFilm/>');
  expect(page).not.toContain('<Ep003WipShot02V4FullFilm/>');
  expect(full).toContain('/ep003/cumulative/latest-successful');
  expect(full).toContain('shotCount<3||shotCount>30');
 });
});