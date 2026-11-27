import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('./EpisodeReviewStudio.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../pages/DirectorQuietEpisodePage.tsx',import.meta.url),'utf8');
describe('Review and Learning content-first integration',()=>{
 it('uses the native episode workspace, separate from media actions',()=>{
  expect(page).toContain("<EpisodeReviewStudio key={packageId} packageId={packageId}/>");
  expect(page).toContain("tab==='DISTRIBUTION'||tab==='REVIEW'");
  expect(ui).toContain('Episode review');
  expect(ui).not.toContain('confirmCpuRender');
  expect(ui).not.toContain('confirmPaidElevenLabs');
 });
 it('keeps content, previous approved records and history accessible',()=>{
  expect(ui).toContain('Previous episode conclusions');
  expect(ui).toContain("root+'/previous'");
  expect(ui).toContain('Version history');
  expect(ui).toContain('Copy approved records');
  expect(ui).toContain('showModal()');
 });
 it('requires explicit approval of exact revisions and does not invent analytics',()=>{
  expect(ui).toContain('expectedRevision:selected?.revision??0');
  expect(ui).toContain('Approve this exact saved review revision?');
  expect(ui).toContain('!data.launchRecorded');
  expect(ui).toContain('No analytics have been inferred.');
  expect(ui).toContain('never authorize release');
 });
});
