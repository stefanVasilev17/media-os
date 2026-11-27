import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const studio=readFileSync(new URL('./EpisodePublishingStudio.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../pages/DirectorQuietEpisodePage.tsx',import.meta.url),'utf8');
describe('Publishing Studio integrated into the actual Director workspace',()=>{
  it('uses the existing package and separate Publishing tab without replacing Full Video or SHOT',()=>{
    expect(page).toContain("'SHOT'|'FULL'|'PUBLISHING'");
    expect(page).toContain("setTab('PUBLISHING')");
    expect(page).toContain('<EpisodePublishingStudio key={packageId} packageId={packageId}/>');
    expect(page).toContain('src={fullUrl}');
    expect(page).toContain('src={shotVideoUrl}');
  });
  it('uses protected server persistence, optimistic revisions and explicit approval',()=>{
    expect(studio).toContain("+'/publishing'");
    expect(studio).toContain('expectedRevision:item.revision');
    expect(studio).toContain("method:'POST'");
    expect(studio).toContain('Approve this exact saved revision');
    expect(studio).toContain("'/history'");
    expect(studio).not.toContain('localStorage');
  });
  it('keeps SRT draft and thumbnail archival separate from release approval',()=>{
    expect(studio).toContain("selected==='SUBTITLES_SRT'");
    expect(studio).toContain('Import synchronized SRT');
    expect(studio).toContain('No thumbnail binary archived yet');
    expect(studio).toContain('readyForDirectorRelease');
    expect(studio).toContain('data.blockers.map');
    expect(studio).toContain('No action here publishes externally');
    expect(studio).toContain('Copy complete description');
  });
});
