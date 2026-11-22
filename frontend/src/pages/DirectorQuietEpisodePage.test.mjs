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
    expect(page).toContain('lockShot(selectedVideo.renderId)');
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

describe('Director sees only one current SHOT preview and one Full Video tab',()=>{
  it('never shows a visible render-version history or older video label',()=>{
    expect(page).toContain('const selectedVideo=locked');
    expect(page).toContain('savedRenders.find(item=>item.renderId===locked.renderId)');
    expect(page).toContain('savedRenders.find(item=>item.canLock)');
    expect(page).toContain('src={shotVideoUrl}');
    expect(page).not.toContain('savedRenders.map(');
    expect(page).not.toContain('Earlier completed video');
    expect(page).not.toContain('Earlier source versions');
    expect(page).not.toContain('Saved version ');
    expect(page).not.toContain('Existing videos & Lock');
  });
  it('Full Video shows only latest Director-locked SHOTs and one assembled film player',()=>{
    expect(page).toContain('> Full Video</button>');
    expect(page).toContain('src={fullUrl}');
    expect(page).toContain('key={fullUrl}');
    expect(page).toContain('lockedClipsToPreview=(film?.locks??[]).filter');
    expect(page).toContain('!(film?.renderIds??[]).includes(item.renderId)');
    expect(page).toContain('lockedClipsToPreview.map(item=>');
    expect(page).toContain('src={lockedVideoUrl(item.renderId)}');
    expect(page).toContain('Locked');
    expect(page).toContain('Only the currently locked videos are shown.');
  });
  it('does not auto lock or start any new paid render from the Full Video tab',()=>{
    expect(page).toContain('lockShot(selectedVideo.renderId)');
    expect(page).toContain('confirmLock:true');
    expect(page).toContain('Render new video (optional)');
    expect(page).toContain('open={!checkingSaved&&!shotVideoUrl}');
    expect(page).toContain('confirmCpuRender:true');
    expect(page).toContain('I approve one new video render using Railway CPU.');
    expect(page).toContain('This video cannot be locked because its original voice approval');
  });
});
