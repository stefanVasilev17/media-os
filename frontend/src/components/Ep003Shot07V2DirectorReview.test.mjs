import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const player=source('./Ep003Shot07V2DirectorReview.tsx');
const page=source('../pages/EpisodePackageImportPage.tsx');
const app=source('../App.tsx');
describe('SHOT07 V2 protected Director player',()=>{
 it('pins the REAL saved MP4 with no public bypass, no paid calls or LOCK',()=>{
  expect(player).toContain("RENDER_ID='4b8e414f-a74f-4e38-b78c-bd8a3101062a'");
  expect(player).toContain("RENDER_KEY='EP003_SHOT07_BOTTLENECK_V2'");
  expect(player).toContain("MP4_SIZE=16455606");
  expect(player).toContain("MP4_FRAMES=3476");
  expect(player).toContain("credentials:'same-origin'");
  expect(player).toContain("response.status===401||response.status===403");
  expect(player).toContain('videoUrl!==VIDEO');
  expect(player).toContain('controls playsInline preload="metadata"');
  expect(player).not.toContain('target="_blank"');
  expect(player).not.toContain("method:'POST'");
  expect(player).toContain('SHOT07 V2 is NOT LOCKED');
 });
 it('puts review first on EP003 and adds a direct protected UI route',()=>{
  expect(page).toContain('<Ep003Shot07V2DirectorReview/>');
  expect(page.indexOf('<Ep003Shot07V2DirectorReview/>')).toBeLessThan(
    page.indexOf('<Ep003Shot07V1DirectorReview/>'));
  expect(app).toContain("hash === '#/ep003/shot07/v2'");
  expect(app).toContain('<Ep003Shot07V2DirectorReview/>');
 });
});
