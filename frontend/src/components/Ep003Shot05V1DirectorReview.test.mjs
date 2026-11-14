import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const review=read('./Ep003Shot05V1DirectorReview.tsx');
const approved=read('./Ep003Shot04V1DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');
const full=read('./Ep003CumulativeFullVideo.tsx');
describe('EP003 SHOT05 V1 Director preview, after SHOT04 LOCK',()=>{
  it('only loads stored real H264/AAC 1080p MP4 SHOT05 with safe duration',()=>{
    expect(review).toContain('/ep003/shot05/v1/latest-successful');
    expect(review).toContain('EP003-SHOT05-STALE-READ-V1-DIRECTOR-CANDIDATE');
    expect(review).toContain('EP003_SHOT05_STALE_READ_V1');
    expect(review).toContain("typeof record.durationInFrames!=='number'");
    expect(review).toContain('record.durationInFrames<1500');
    expect(review).toContain('record.durationInFrames>7200');
    expect(review).toContain('record.directorLocked===true');
    expect(review).toContain('controls playsInline preload="metadata"');
    expect(review).toContain('NOT LOCKED');
    expect(review).not.toContain("method:'POST'");
  });
  it('confirms exactly SHOT04 Director LOCK from known immutable previous source',()=>{
    expect(approved).toContain("LOCKED_RENDER_ID='4079729b-c1b3-405c-9a83-1ace0ef25641'");
    expect(approved).toContain('record.renderId!==LOCKED_RENDER_ID');
    expect(approved).toContain('V1 · DIRECTOR-LOCKED · OFFICIAL MASTER');
  });
  it('keeps exactly one official full-video player and only SHOT05 candidate review',()=>{
    expect((page.match(/<Ep003CumulativeFullVideo\/>/g)||[])).toHaveLength(1);
    expect(page.indexOf('<Ep003Shot05V1DirectorReview/>'))
      .toBeGreaterThan(page.indexOf('<Ep003Shot04V1DirectorReview/>'));
    expect(page).not.toContain('<Ep003Shot03V4ThreeShotWipFilm/>');
    expect(page).not.toContain('<Ep003WipShot02V4FullFilm/>');
    expect(full).toContain('shotCount<3||shotCount>30');
  });
});