import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const a=read('./Ep003Shot08V3DirectorReview.tsx');
const b=read('./Ep003Shot09V2DirectorReview.tsx');
const app=read('../App.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
describe('EP003 premium routing Director review candidates',()=>{
 it('SHOT08 V3 only shows its exact saved immutable-source candidate',()=>{
  for(const s of ["ENDPOINT='/api/v1/remotion/renders/ep003/shot08/v3/latest-successful'",
   "ENGINE='EP003_SHOT08_PIN_52c99cdf2b4b'",
   "RENDER_KEY='EP003_SHOT08_SHARDING_V3'","credentials:'same-origin'",
   'data.durationInFrames!==5372','data.directorLocked!==true',
   'controls playsInline preload="metadata"'])expect(a).toContain(s);
  expect(a).not.toContain("method:'POST'");
 });
 it('SHOT09 V2 remains a separate unlocked candidate pinned to valid real MP4',()=>{
  for(const s of ["ENDPOINT='/api/v1/remotion/renders/ep003/shot09/v2/latest-successful'",
   "ENGINE='EP003_SHOT09_PIN_c1e9a9bd1860'",
   "RENDER_KEY='EP003_SHOT09_FAILOVER_V2'","credentials:'same-origin'",
   'data.durationInFrames!==3145','data.directorLocked!==true',
   'SHOT09 V2 is DIRECTOR-LOCKED'])expect(b).toContain(s);
  expect(b).not.toContain('target="_blank"');
 });
 it('preserves all historical and locked screens with candidates shown first',()=>{
  for(const x of ["hash === '#/ep003/shot08/v3'","hash === '#/ep003/shot09/v2'",
   "hash === '#/ep003/shot08/v2'","hash === '#/ep003/shot09/v1'"])
   expect(app).toContain(x);
  expect(page).toContain('<Ep003Shot08V3DirectorReview/>');
  expect(page).toContain('<Ep003Shot09V2DirectorReview/>');
  expect(page).toContain('<Ep003CumulativeFullVideo/>');
 });
});
