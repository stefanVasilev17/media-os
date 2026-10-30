import { describe, expect, it } from 'vitest';
import { episodeDirectorRoute, episodeShotRoute } from './episodeDirectorApi';

const ep001 = '22222222-2222-2222-2222-222222222222';
const ep003 = '33333333-3333-4333-8333-333333333333';

describe('episode-aware Director routes', () => {
  it('navigates to the selected Director workspace', () => {
    expect(episodeDirectorRoute(ep003)).toBe('#/episodes/' + ep003 + '/director');
  });

  it('opens exact EP001 voice shot in its legacy agent', () => {
    expect(episodeShotRoute(ep001, true, 'voice', 'SHOT 12'))
      .toBe('#/agents/voice?episodeId=' + ep001 + '&shot=SHOT+12');
  });

  it('opens exact EP001 video shot in its legacy Visual Agent', () => {
    expect(episodeShotRoute(ep001, true, 'video', 'SHOT 12'))
      .toBe('#/agents/visual?episodeId=' + ep001 + '&shot=SHOT+12');
  });

  it('never reuses the EP001 generator routes for EP003', () => {
    const voice = episodeShotRoute(ep003, false, 'voice', 'SHOT 03');
    const video = episodeShotRoute(ep003, false, 'video', 'SHOT 03');
    expect(voice).toContain('#/episodes/' + ep003 + '/voice?');
    expect(video).toContain('#/episodes/' + ep003 + '/video?');
    expect(voice).not.toContain('#/agents/');
    expect(video).not.toContain('#/agents/');
  });
});
