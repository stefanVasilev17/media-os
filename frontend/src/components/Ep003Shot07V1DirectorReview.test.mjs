import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const review=read('./Ep003Shot07V1DirectorReview.tsx');
const locked=read('./Ep003Shot06V1DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const full=read('./Ep003CumulativeFullVideo.tsx');
describe('EP003 SHOT07 V1 unapproved Director review with immutable six-shot master',()=>{
 it('only displays saved real 1080p review MP4; never locks or renders a fictional voice',()=>{
   expect(review).toContain('/ep003/shot07/v1/latest-successful');
   expect(review).toContain('EP003-SHOT07-BOTTLENECK-V1-DIRECTOR-CANDIDATE');
   expect(review).toContain('EP003_SHOT07_BOTTLENECK_V1');
   expect(review).toContain('record.durationInFrames<1500');
   expect(review).toContain('record.durationInFrames>7200');
   expect(review).toContain('record.directorLocked===true');
   expect(review).toContain('controls playsInline preload="metadata"');
   expect(review).toContain('SHOT07 V1 is NOT LOCKED');
   expect(review).not.toContain("method:'POST'");
 });
 it('SHOT06 is exact Director-LOCKED source and cannot silently change',()=>{
   expect(locked).toContain("LOCKED_RENDER_ID='0007bd16-edbf-4ecc-927a-4a5781d0b921'");
   expect(locked).toContain('record.renderId!==LOCKED_RENDER_ID');
   expect(locked).toContain('V1 · DIRECTOR-LOCKED · OFFICIAL MASTER');
 });
 it('one latest six-shot official master player, no extra full-video WIP players',()=>{
   expect((page.match(/<Ep003CumulativeFullVideo\/>/g)||[])).toHaveLength(1);
   expect(page.indexOf('<Ep003Shot07V1DirectorReview/>')).toBeGreaterThan(
      page.indexOf('<Ep003Shot06V1DirectorReview/>'));
   expect(page).not.toContain('<Ep003Shot03V4ThreeShotWipFilm/>');
   expect(page).not.toContain('<Ep003WipShot02V4FullFilm/>');
   expect(full).toContain('/ep003/cumulative/latest-successful');
   expect(full).toContain('shotCount<3||shotCount>30');
 });
});