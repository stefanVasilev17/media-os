import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const video=read('./Ep003Shot10V1DirectorReview.tsx');
const app=read('../App.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
describe('SHOT10 original voice Director review and exact source gates',()=>{
 it('never substitutes another render, requires same-origin and exact engine',()=>{
  for(const x of [
   "ENDPOINT='/api/v1/remotion/renders/ep003/shot10/v1/latest-successful'",
   "RENDER_KEY='EP003_SHOT10_MEASUREMENT_V1'",
   "ENGINE='EP003_SHOT10_PIN_0fc02175a4ea'",
   'data.durationInFrames!==4016','data.directorLocked!==false',
   "credentials:'same-origin'",'controls playsInline preload="metadata"',
   'SHOT10 V1 is NOT LOCKED'
  ])expect(video).toContain(x);
  expect(video).not.toContain("method:'POST'");
 });
 it('shows only one new SHOT10 candidate ahead of locked nine-shot assets',()=>{
  expect(app).toContain("hash === '#/ep003/shot10/v1'");
  expect(app).toContain("hash === '#/ep003/full'");
  expect(page).toContain('<Ep003Shot10V1DirectorReview/>');
  expect(page).toContain('<Ep003Shot09V2DirectorReview/>');
  expect(page).toContain('<Ep003CumulativeFullVideo/>');
 });
});
