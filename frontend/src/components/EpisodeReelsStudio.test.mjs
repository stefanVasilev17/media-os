import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const studio=readFileSync(new URL('./EpisodeReelsStudio.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../pages/DirectorQuietEpisodePage.tsx',import.meta.url),'utf8');
describe('Direct Reels Studio',()=>{
  it('uses the existing content-first workspace, no nested menu',()=>{
    expect(page).toContain('<EpisodeReelsStudio key={packageId} packageId={packageId}/>');
    expect(page).toContain("setTab('REELS')");
    expect(studio).toContain('Recommended cuts');
    expect(studio).toContain('Other SHOTs to review');
    expect(studio).toContain('Minimum 3. More are encouraged');
    expect(studio).not.toContain('localStorage');
  });
  it('previews source intervals but only exports and locks actual verified clips',()=>{
    expect(studio).toContain('This is not an exported clip');
    expect(studio).toContain('masterSha256:data.master.sha256');
    expect(studio).toContain('startFrame:s.startFrame,endFrame:s.endFrame');
    expect(studio).toContain("r.state==='READY'&&!old");
    expect(studio).toContain("r.state==='LOCKED'");
    expect(studio).toContain('?download=true');
    expect(studio).toContain('not automatically eligible YouTube Shorts');
    expect(studio).toContain('No new animation, voice, or aspect-ratio change');
  });
});
const vertical=readFileSync(new URL('./VerticalReelsPanel.tsx',import.meta.url),'utf8');
describe('AT Vertical V1',()=>{it('keeps original and technical packaging separate with explicit consent and actual review',()=>{expect(studio).toContain('<VerticalReelsPanel root={root} sources={current}/>');expect(vertical).toContain("s.state==='LOCKED'");expect(vertical).toContain('directorMutation');expect(vertical).toContain('window.confirm');expect(vertical).toContain("r?.state==='READY'");expect(vertical).toContain("r?.state==='LOCKED'");expect(vertical).toContain('1080 × 1920');});});
