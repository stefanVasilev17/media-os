import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./Ep003Shot08V1DirectorReview.tsx');
const app=read('../App.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
describe('SHOT08 V1 protected Director review',()=>{
 it('only displays exact saved selected-vocal sharding source',()=>{
  for(const s of ['ep003/shot08/v1/latest-successful',
   "ENGINE='EP003_SHOT08_PIN_acdcde6aa9d9'",
   "RENDER_KEY='EP003_SHOT08_SHARDING_V1'",
   'data.durationInFrames!==5372',
   'data.engineVersion!==ENGINE',
   'data.directorLocked!==false',
   "credentials:'same-origin'",
   'controls playsInline preload="metadata"',
   'SHOT08 V1 is NOT LOCKED'])expect(scene).toContain(s);
  expect(scene).not.toContain("method:'POST'");
  expect(scene).not.toContain('target="_blank"');
 });
 it('shows one separate preview and one official seven-shot master',()=>{
  expect(app).toContain("hash === '#/ep003/shot08/v1'");
  expect(app).toContain("hash === '#/ep003/full'");
  expect(page).toContain('<Ep003Shot08V1DirectorReview/>');
  expect(page).toContain('<Ep003CumulativeFullVideo/>');
 });
});
