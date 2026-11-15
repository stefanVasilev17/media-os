import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const review=read('./Ep003Shot09V1DirectorReview.tsx');
const app=read('../App.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const locked=read('./Ep003Shot08V2DirectorReview.tsx');
describe('SHOT09 protected candidate and Director-LOCKED SHOT08 V2',()=>{
 it('strict SHOT09 authenticated and pinned saved MP4, no fallback or auto LOCK',()=>{
  for(const s of ["ENDPOINT='/api/v1/remotion/renders/ep003/shot09/v1/latest-successful'",
   "RENDER_KEY='EP003_SHOT09_FAILOVER_V1'","ENGINE='EP003_SHOT09_PIN_40386a945e5d'",
   "credentials:'same-origin'",'data.durationInFrames!==3145',
   'data.directorLocked!==false','controls playsInline preload="metadata"',
   'SHOT09 V1 is NOT LOCKED'])expect(review).toContain(s);
  expect(review).not.toContain("method:'POST'");
 });
 it('keeps existing eight-shot official master and locked SHOT08 visible',()=>{
  expect(app).toContain("hash === '#/ep003/shot09/v1'");
  expect(page).toContain('<Ep003Shot09V1DirectorReview/>');
  expect(page).toContain('<Ep003CumulativeFullVideo/>');
  expect(locked).toContain('SHOT08 V2 is DIRECTOR-LOCKED');
  expect(locked).toContain('data.directorLocked!==true');
 });
});
