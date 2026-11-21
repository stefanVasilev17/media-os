import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const player=read('./Ep003Shot11V1DirectorReview.tsx');
const app=read('../App.tsx');
const workspace=read('../pages/EpisodePackageImportPage.tsx');
describe('EP003 SHOT11 V1 Director review protected real saved MP4',()=>{
 it('requires exact source commit, original voice and actual stored 3104-frame shot 11',()=>{
  for(const phrase of [
   "ENDPOINT='/api/v1/remotion/renders/ep003/shot11/v1/latest-successful'",
   "COMPOSITION='EP003-SHOT11-FINALE-V1-DIRECTOR-CANDIDATE'",
   "RENDER_KEY='EP003_SHOT11_FINALE_V1'",
   "ENGINE='EP003_SHOT11_PIN_140398af1c5b'",
   'data.durationInFrames!==3104',
   'data.directorLocked!==true',
   "credentials:'same-origin'",
   'controls','playsInline','preload="metadata"',
   'Director approved SHOT11 V1 and LOCKED its exact original MP4'
  ])expect(player).toContain(phrase);
  expect(player).not.toContain("method:'POST'");
 });
 it('one exact approved standalone shot 11 and one official 11-SHOT master preserved',()=>{
  expect(app).toContain("hash === '#/ep003/shot11/v1'");
  expect(workspace).toContain('<Ep003Shot11V1DirectorReview/>');
  expect(workspace).toContain('<Ep003CumulativeFullVideo/>');
  expect(player).toContain('View official 11-SHOT Director LOCK');
  expect(player).toContain('window.clearTimeout(id)');
 });
});
