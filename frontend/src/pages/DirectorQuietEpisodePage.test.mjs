import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('./DirectorQuietEpisodePage.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../App.tsx',import.meta.url),'utf8');
describe('MediaOS minimal Director surface is built from exact native operations',()=>{
  it('preserves episode selector and sends imported packages to one quiet screen',()=>{
    expect(app).toContain('EpisodeSelectorPage');
    expect(app).toContain('DirectorQuietEpisodePage');
    expect(app).toContain("hash === '#/'");
  });
  it('shows only a script editor, ElevenLabs, render and full film without factory panels',()=>{
    expect(page).toContain('Your narration');
    expect(page).toContain('Generate voice');
    expect(page).toContain('Render video');
    expect(page).toContain('Lock SHOT & add to Full Video');
    expect(page).toContain('Full Video');
    expect(page).not.toContain('EpisodeAiAuthorizationPanel');
    expect(page).not.toContain('EpisodeCodexCloudPanel');
    expect(page).not.toContain('EpisodeFactoryProductionPanel');
  });
  it('requires explicit approval for both paid voice and bounded CPU render',()=>{
    expect(page).toContain('confirmPaidElevenLabs:true');
    expect(page).toContain('confirmCpuRender:true');
    expect(page).toContain('confirmLock:true');
    expect(page).toContain('expectedSourceCommit:readiness.expectedSourceCommit');
    expect(page).toContain('voiceConsent');
    expect(page).toContain('cpuConsent');
  });
  it('uses reviewed MP4 IDs to lock, and one unified player for contiguous film',()=>{
    expect(page).toContain("film/locks/");
    expect(page).toContain('renderId:render.renderId');
    expect(page).toContain('key={fullUrl}');
    expect(page).toContain('src={fullUrl}');
    expect(page).toContain('episode.shots.map');
  });
});
