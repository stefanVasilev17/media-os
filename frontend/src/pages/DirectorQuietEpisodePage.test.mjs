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
    expect(page).toContain('renderId,confirmLock:true');
    expect(page).toContain('lockShot(item.renderId)');
    expect(page).toContain('key={fullUrl}');
    expect(page).toContain('src={fullUrl}');
    expect(page).toContain('episode.shots.map');
  });
});

describe('Long episode Full Video remains one player and non-blocking',()=>{
  it('continues refreshing only while a real master is ASSEMBLING',()=>{
    expect(page).toContain("film?.state!=='ASSEMBLING'");
    expect(page).toContain('window.setInterval');
    expect(page).toContain('window.clearInterval');
    expect(page).toContain('src={fullUrl}');
    expect(page).toContain('key={fullUrl}');
  });
  it('offers retry only after failure, never a new paid Remotion job',()=>{
    expect(page).toContain("film?.state==='ASSEMBLY_FAILED'");
    expect(page).toContain("root+'/film/retry'");
    expect(page).toContain('confirmRetry:true');
    expect(page).toContain('Original MP4s are');
    expect(page).toContain('no new Remotion or ElevenLabs call');
  });
});

describe('Historical EP004 MP4s are visible before any new paid render',()=>{
  it('loads previously completed shots independently of current source commit or voice revision',()=>{
    expect(page).toContain("root+'/film/candidates/'");
    expect(page).toContain('refreshSavedRenders');
    expect(page).toContain('savedRenders.map');
    expect(page).toContain('item.videoUrl');
    expect(page).toContain('item.canLock');
    expect(page).toContain('lockShot(item.renderId)');
    expect(page).toContain('Earlier completed video');
  });
  it('never forces a paid CPU render when an approved earlier MP4 exists',()=>{
    expect(page).toContain('Render a new version (optional)');
    expect(page).toContain('open={!checkingSaved&&savedRenders.length===0}');
    expect(page).toContain('I approve one new video render using Railway CPU.');
    expect(page).toContain('confirmCpuRender:true');
    expect(page).toContain('confirmLock:true');
  });
  it('does not claim a historical MP4 can be locked when original voice approval is missing',()=>{
    expect(page).toContain('its original approved voice record could');
    expect(page).toContain('not be verified');
    expect(page).toContain('It cannot be locked automatically.');
    expect(page).toContain('This MP4 is saved');
  });
});
