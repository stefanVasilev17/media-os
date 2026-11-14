import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const shot=read('./Ep003Shot03V4DirectorReview.tsx');
const full=read('./Ep003CumulativeFullVideo.tsx');
const page=read('../pages/EpisodePackageImportPage.tsx');

describe('EP003 newest-only full video after Director LOCK of SHOT03 V4',()=>{
  it('uses exact SHOT03 V4 Director-LOCKED source and approved text',()=>{
    expect(shot).toContain("DIRECTOR_LOCKED_RENDER_ID='fc26ca7b-60f2-4c35-b248-6b373736ce99'");
    expect(shot).toContain('record.renderId!==DIRECTOR_LOCKED_RENDER_ID');
    expect(shot).toContain('EP003_SHOT03_WORDING_V4');
    expect(shot).toContain('Accepts writes. Replica copy changes');
    expect(shot).toContain('V4 · DIRECTOR-LOCKED · OFFICIAL MASTER');
    expect(shot).toContain('SHOT01 V2 and SHOT02 V4 remain immutable');
    expect(shot).not.toContain("method:'POST'");
  });
  it('has exactly ONE full-video player — never show older 2-shot or 3-shot WIP twice',()=>{
    expect((page.match(/<Ep003CumulativeFullVideo\/>/g)||[]).length).toBe(1);
    expect(page).not.toContain('<Ep003Shot03V4ThreeShotWipFilm/>');
    expect(page).not.toContain('<Ep003WipShot02V4FullFilm/>');
    expect(page).not.toContain('Historical WIP · SHOT02 V4 transition review');
    expect(page).toContain('<Ep003Shot03V4DirectorReview/>');
    expect(page).toContain('<Ep003Shot03V3DirectorReview/>');
    expect(page).not.toContain("import {Ep003Shot03V4ThreeShotWipFilm}");
    expect(page).not.toContain("import {Ep003WipShot02V4FullFilm}");
  });
  it('reads only latest verified Director-LOCKED 3+ full-video master',()=>{
    expect(full).toContain('/ep003/cumulative/latest-successful');
    expect(full).toContain('shotCount<3');
    expect(full).toContain('shotCount===3&&data.durationInFrames!==9037');
    expect(full).toContain('One full-video player · newest consecutive Director-LOCKED master only');
    expect(full).toContain('Older versions are archived and not shown');
    expect(full).toContain('EP003 · Latest Full Video');
    expect(full).toContain('controls playsInline preload="metadata"');
    expect(full).not.toContain('wip-3shot-v4/latest-successful');
    expect(full).not.toContain("method:'POST'");
  });
});
