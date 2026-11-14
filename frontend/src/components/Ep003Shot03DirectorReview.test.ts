import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8');
const review=read('./Ep003Shot03DirectorReview.tsx');
const shot02=read('./Ep003Shot02DirectorReview.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');

describe('EP003 immutable video Director review',()=>{
  it('shows the exact real completed SHOT03 V1 without dynamic latest-version fallback',()=>{
    expect(review).toContain("const RENDER_ID='4d73e27a-94bb-497a-8b11-c934962917b2'");
    expect(review).toContain("const RENDER_KEY='EP003_SHOT03_PRIMARY_REPLICAS_V1'");
    expect(review).toContain("record.durationInFrames!==3080");
    expect(review).toContain("record.profile!=='REVIEW'");
    expect(review).toContain("record.directorLocked===true");
    expect(review).not.toContain('/latest-successful');
  });
  it('keeps V1 unapproved and only reads a saved MP4',()=>{
    expect(review).toContain('V1 · RENDERED · NOT LOCKED');
    expect(review).toContain('controls playsInline preload="metadata"');
    expect(review).toContain('src={VIDEO_URL}');
    expect(review).not.toContain("method:'POST'");
    expect(review).not.toContain('generate-slow');
  });
  it('places SHOT03 after SHOT02 in EP003 MediaOS imported package view',()=>{
    expect(page).toContain('Ep003Shot03DirectorReview');
    expect(page.indexOf('<Ep003Shot02DirectorReview/>'))
      .toBeLessThan(page.indexOf('<Ep003Shot03DirectorReview/>'));
    expect(page).toContain("details.episodeKey==='EP003'");
  });
  it('shows SHOT02 V4 LOCK instead of the superseded V3 as active media',()=>{
    expect(shot02).toContain('EP003_SHOT02_MOTION_V4');
    expect(shot02).toContain("V4 · SMOOTH CUT · DIRECTOR LOCKED");
    expect(shot02).toContain('The Director explicitly LOCKED this exact SHOT02 V4 MP4.');
  });
});
