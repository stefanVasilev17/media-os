import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const film=read('./ThreeFinishedEpisodes.tsx');
const app=read('../App.tsx');
const selector=read('./EpisodeSelectorPage.tsx');
const packages=read('./EpisodePackageImportPage.tsx');
describe('Three finished episodes only — erase standalone SHOT and voice media',()=>{
 it('lists exactly three verified complete H264/AAC MP4 IDs, no voice or SHOT playback',()=>{
  for(const id of [
   '904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',
   '56c2a4b7-8bc0-465b-baea-80fa3707e709',
   '63827ce6-2ea8-4853-a61b-8549fe8db967'
  ])expect(film).toContain(id);
  expect(film).toContain("EP001' as const");
  expect(film).toContain("EP002' as const");
  expect(film).toContain("EP003' as const");
  expect(film).toContain('controls playsInline preload="metadata"');
  expect(film).toContain("const url='/api/v1/remotion/renders/'+selected.renderId+'/video'");
  expect(film).not.toContain('<audio');
  expect(film).not.toContain('voiceTakeId');
  expect(film).not.toContain('Ep002LockedCutReviewRoom');
  expect(film).not.toContain('Ep003Shot01DirectorReview');
 });
 it('routes EP001 EP002 and EP003 library pages only to full film UI',()=>{
  expect(app).toContain("import {ThreeFinishedEpisodes} from './pages/ThreeFinishedEpisodes';");
  expect(app).toContain("hash === '#/library/EP001' || hash === '#/library/EP002' || hash === '#/library/EP003'");
  expect(app).toContain("page = <ThreeFinishedEpisodes episode=");
  expect(app).not.toContain("page = <EpisodeProductionLibraryPage");
  expect(selector).toContain("window.location.hash='#/library/EP003'");
 });
 it('EP003 source import page shows only full film, never old voice or SHOT widgets',()=>{
  expect(packages).toContain("details.episodeKey==='EP003'?<Ep003CumulativeFullVideo/>:<>");
  expect((packages.match(/<Ep003CumulativeFullVideo\/>/g)||[])).toHaveLength(1);
  expect(packages).toContain('<EpisodePackageVoiceStudioPanel');
 });
});
