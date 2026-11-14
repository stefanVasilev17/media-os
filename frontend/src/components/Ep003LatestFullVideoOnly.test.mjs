import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const page=read('../pages/EpisodePackageImportPage.tsx');
const full=read('./Ep003CumulativeFullVideo.tsx');
const lockedV4=read('./Ep003Shot03V4DirectorReview.tsx');

describe('EP003 future proof: only newest Director-LOCKED full film is visible',()=>{
  it('renders exactly ONE full-film player in EP003',()=>{
    expect((page.match(/<Ep003CumulativeFullVideo\/>/g)||[])).toHaveLength(1);
    expect(page).not.toContain('<Ep003Shot03V4ThreeShotWipFilm/>');
    expect(page).not.toContain('<Ep003WipShot02V4FullFilm/>');
    expect(page).not.toContain("import {Ep003Shot03V4ThreeShotWipFilm}");
    expect(page).not.toContain("import {Ep003WipShot02V4FullFilm}");
  });
  it('latest-only player reads authoritative official master and supports SHOT04 onward',()=>{
    expect(full).toContain('/ep003/cumulative/latest-successful');
    expect(full).toContain("LOCKED_PREFIX=/^EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_");
    expect(full).toContain('shotCount<3||shotCount>30');
    expect(full).toContain('(shotCount===3&&data.durationInFrames!==9037)');
    expect(full).toContain('older 2-SHOT masters are hidden');
    expect(full).toContain('One full-video player · newest consecutive Director-LOCKED master only');
    expect(full).not.toContain('/ep003/cumulative/wip-latest');
    expect(full).not.toContain('wip-3shot-v4');
  });
  it('only the exact approved SHOT03 V4 render is labelled Director-LOCKED',()=>{
    expect(lockedV4).toContain("DIRECTOR_LOCKED_RENDER_ID='fc26ca7b-60f2-4c35-b248-6b373736ce99'");
    expect(lockedV4).toContain('record.renderId!==DIRECTOR_LOCKED_RENDER_ID');
    expect(lockedV4).toContain('V4 · DIRECTOR-LOCKED · OFFICIAL MASTER');
    expect(lockedV4).toContain('Accepts writes. Replica copy changes');
  });
});