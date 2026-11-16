import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const shot8=read('./Ep003Shot08V4DirectorReview.tsx');
const film=read('./Ep003CorrectedTenShotFullWip.tsx');
const shot9=read('./Ep003Shot09V3DirectorReview.tsx');
const locked8=read('./Ep003Shot08V3DirectorReview.tsx');
const locked9=read('./Ep003Shot09V2DirectorReview.tsx');
const app=read('../App.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
describe('EP003 Owner B center correction strict video review',()=>{
 it('SHOT08 V4 displays only exact saved qualified H264 selected-source MP4',()=>{
  for(const s of [
   "ENDPOINT='/api/v1/remotion/renders/ep003/shot08/v4/latest-successful'",
   "RENDER_KEY='EP003_SHOT08_SHARDING_V4'",
   "ENGINE='EP003_SHOT08_PIN_143975e3d6c0'",
   'data.durationInFrames!==5372','data.directorLocked!==false',
   "credentials:'same-origin'",'controls playsInline preload="metadata"'
  ])expect(shot8).toContain(s);
  expect(shot8).not.toContain("method:'POST'");
 });
 it('SHOT09 V3 displays only its verified successor and nothing historical as fallback',()=>{
  for(const s of [
   "ENDPOINT='/api/v1/remotion/renders/ep003/shot09/v3/latest-successful'",
   "RENDER_KEY='EP003_SHOT09_FAILOVER_V3'",
   "ENGINE='EP003_SHOT09_PIN_599d23563c9c'",
   'data.durationInFrames!==3145','data.directorLocked!==false',
   "credentials:'same-origin'",'controls playsInline preload="metadata"'
  ])expect(shot9).toContain(s);
  expect(shot9).not.toContain("method:'POST'");
 });
 it('Entire corrected ten-shot film is separate from official master and never falls back to an old MP4',()=>{
  for(const s of [
   "ENDPOINT='/api/v1/remotion/renders/ep003/cumulative/wip-corrected-ten/latest-successful'",
   "RENDER_KEY='EP003_CUMULATIVE_WIP_CORRECTED_SHOTS_01_TO_10'",
   "ENGINE='EP003_WIP_OWNER_B_V2'",
   'render.durationInFrames!==35489','render.directorLocked!==false',
   "credentials:'same-origin'",'controls playsInline preload="metadata"',
   'Original approved sources remain immutable.'
  ])expect(film).toContain(s);
  expect(film).not.toContain("method:'POST'");
  expect(app).toContain("hash === '#/ep003/corrected/full'");
  expect(page).toContain('<Ep003CorrectedTenShotFullWip/>');
  expect(page).toContain('<Ep003CumulativeFullVideo/>');
 });
 it('Original approved versions remain present and locked, candidate routes first',()=>{
  expect(locked8).toContain('data.directorLocked!==true');
  expect(locked9).toContain('data.directorLocked!==true');
  expect(app).toContain("hash === '#/ep003/shot08/v4'");
  expect(app).toContain("hash === '#/ep003/shot09/v3'");
  expect(page).toContain('<Ep003Shot08V4DirectorReview/>');
  expect(page).toContain('<Ep003Shot09V3DirectorReview/>');
  expect(page).toContain('<Ep003CumulativeFullVideo/>');
 });
});
