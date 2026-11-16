import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const app=read('../App.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const film=read('./Ep003CumulativeFullVideo.tsx');
describe('Director policy: EP003 completed episode shows only one full-film player',()=>{
 it('EP003 page displays one current 11-SHOT master; no individual SHOT components are mounted',()=>{
  expect((page.match(/<Ep003CumulativeFullVideo\/>/g)||[])).toHaveLength(1);
  expect(page).toContain("{details&&false&&<>");
  expect(page).not.toContain("details.episodeKey==='EP003'&&<Ep003Shot11V1DirectorReview/>}\n      {details.episodeKey==='EP003'&&<Ep003CumulativeFullVideo/>");
  const gate=page.indexOf('{details&&false&&<>');
  const end=page.indexOf('</>}',gate);
  expect(gate).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(gate);
  for(const name of ['Ep003Shot01DirectorReview','Ep003Shot02DirectorReview',
   'Ep003Shot08V4DirectorReview','Ep003Shot09V3DirectorReview',
   'Ep003Shot10V2DirectorReview','Ep003Shot11V1DirectorReview']){
   const componentIndex=page.indexOf('<'+name+'/>');
   if(componentIndex>=0)expect(componentIndex).toBeGreaterThan(gate);
   if(componentIndex>=0)expect(componentIndex).toBeLessThan(end);
  }
 });
 it('All obsolete individual-shot and corrected-ten deep links redirect to current single final film',()=>{
  expect(app).toContain("if (/^#\\/ep003\\/shot\\d{2}(?:\\/|$)/.test(hash)");
  expect(app).toContain("hash.startsWith('#/ep003/corrected/full')");
  expect(app).toContain("return '#/ep003/full';");
  expect(app).toContain("hash === '#/ep003/full'");
 });
 it('Only the latest verified Director locked master is playable',()=>{
  expect(film).toContain("ENDPOINT='/api/v1/remotion/renders/ep003/cumulative/latest-successful'");
  expect(film).toContain("LOCKED_PREFIX=/^EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_");
  expect(film).toContain("shotCount>30");
  expect(film).toContain('<video key={video}');
 });
});
