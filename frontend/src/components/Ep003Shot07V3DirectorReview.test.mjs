import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const review=read('./Ep003Shot07V3DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const app=read('../App.tsx');
describe('SHOT07 V3 protected real Director review',()=>{
 it('loads pinned V3 success metadata only with same-origin session and no fallback',()=>{
  for(const s of ['ep003/shot07/v3/latest-successful',
    "ENGINE='EP003_SHOT07_PIN_316d8573072a'",
    'record.durationInFrames!==3476',
    'record.renderKey!==RENDER_KEY',
    'record.engineVersion!==ENGINE',
    "credentials:'same-origin'",
    'response.status===401||response.status===403',
    'controls playsInline preload="metadata"',
    'SHOT07 V3 is NOT LOCKED'])expect(review).toContain(s);
  expect(review).not.toContain("method:'POST'");
  expect(review).not.toContain('target="_blank"');
 });
 it('new protected V3 route and package review appear before V2/V1',()=>{
  expect(app).toContain("hash === '#/ep003/shot07/v3'");
  expect(app).toContain('<Ep003Shot07V3DirectorReview/>');
  expect(page).toContain('<Ep003Shot07V3DirectorReview/>');
  expect(page.indexOf('<Ep003Shot07V3DirectorReview/>')).toBeLessThan(
    page.indexOf('<Ep003Shot07V2DirectorReview/>'));
 });
});
