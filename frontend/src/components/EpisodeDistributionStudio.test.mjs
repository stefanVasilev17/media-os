import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const studio=readFileSync(new URL('./EpisodeDistributionStudio.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../pages/DirectorQuietEpisodePage.tsx',import.meta.url),'utf8');
describe('Distribution Studio',()=>{
  it('keeps content first and existing native tabs',()=>{
    expect(page).toContain('<EpisodeDistributionStudio key={packageId} packageId={packageId}/>');
    expect(page).toContain("setTab('DISTRIBUTION')");
    expect(studio).toContain('Technical articles');
    expect(studio).toContain('Posts & storytelling');
    expect(studio).toContain('Launch calendar');
    expect(studio).toContain('Zero-Follower strategy');
    expect(studio).not.toContain('localStorage');
  });
  it('records manual review and versioned drafts, never calls a publication API',()=>{
    expect(studio).toContain('expectedRevision:selected.revision');
    expect(studio).toContain('Nothing is sent to the platform');
    expect(studio).toContain('Human original authorship required');
    expect(studio).toContain('Research only');
    expect(studio).toContain('Public URL pending');
    expect(studio).toContain('showModal()');
  });
});