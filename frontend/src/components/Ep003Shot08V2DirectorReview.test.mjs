import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const review=read('./Ep003Shot08V2DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const app=read('../App.tsx');
describe('EP003 SHOT08 V2 protected review preserves historical V1',()=>{
 it('only accepts exact pinned successful V2 MP4 with no fallback',()=>{
  for(const s of [
   "ENDPOINT='/api/v1/remotion/renders/ep003/shot08/v2/latest-successful'",
   "ENGINE='EP003_SHOT08_PIN_d64dd22fa8cd'",
   "RENDER_KEY='EP003_SHOT08_SHARDING_V2'",
   'data.durationInFrames!==5372',
   'data.engineVersion!==ENGINE',
   'data.directorLocked!==false',
   "credentials:'same-origin'",
   'controls playsInline preload="metadata"',
   'SHOT08 V2 is NOT LOCKED'
  ])expect(review).toContain(s);
  expect(review).not.toContain("method:'POST'");
  expect(review).not.toContain('target="_blank"');
 });
 it('opens newest V2 first, keeps old V1 separately and six-seven shot master safe',()=>{
  expect(app).toContain("hash === '#/ep003/shot08/v2'");
  expect(app).toContain("hash === '#/ep003/shot08/v1'");
  expect(page).toContain('<Ep003Shot08V2DirectorReview/>');
  expect(page).toContain('<Ep003Shot08V1DirectorReview/>');
  expect(page.indexOf('<Ep003Shot08V2DirectorReview/>')).toBeLessThan(page.indexOf('<Ep003Shot08V1DirectorReview/>'));
  expect(page).toContain('<Ep003CumulativeFullVideo/>');
 });
});
