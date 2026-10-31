import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { episodePreparationApi } from './episodePreparationApi';

const ep003 = '33333333-3333-4333-8333-333333333333';
const ep002 = '33333333-3333-4333-8333-333333333332';

describe('episode-scoped Research Script Scene preparation', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ zeroTokenPreview: true, canRun: false })
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('creates a new episode with a durable idea and references', async () => {
    await episodePreparationApi.create('EP003', 'Why Redis Fails',
      'Redis is unavailable during login and session restoration.', 'redis.io');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/episodes', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        episodeNumber: 'EP003', title: 'Why Redis Fails',
        brief: 'Redis is unavailable during login and session restoration.',
        sources: 'redis.io'
      })
    }));
  });

  it('uses the selected episode for Research preview, not EP001 legacy', async () => {
    await episodePreparationApi.preview(ep003, 'RESEARCH', 0);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/episodes/' + ep003 + '/research/preview');
    expect(fetchMock.mock.calls[0][1].body).toBe('{"expectedRevision":0}');
  });

  it('binds exactly the same correction and stage to Script Preview and paid run', async () => {
    const correction = 'Explain the retry storm before showing the failure path.';
    await episodePreparationApi.preview(ep003, 'SCRIPT', 2, 'REVISE', correction);
    await episodePreparationApi.generate(ep003, 'SCRIPT', 2, 'preview-bound-one-use', 'REVISE', correction);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/episodes/' + ep003 + '/agents/script/preview');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/episodes/' + ep003 + '/agents/script/run');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      action: 'REVISE', expectedRevision: 2, message: correction
    });
    expect(fetchMock.mock.calls[1][1].headers['X-MediaOS-Preview-Authorization'])
      .toBe('preview-bound-one-use');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      action: 'REVISE', expectedRevision: 2, message: correction
    });
    expect(String(fetchMock.mock.calls[1][0])).not.toContain('EP001');
  });

  it('does not mix paid Scene revisions between different episode UUIDs', async () => {
    await episodePreparationApi.generate(ep002, 'SCENE', 1, 'token-ep2', 'REVISE', 'Change camera focus.');
    await episodePreparationApi.generate(ep003, 'SCENE', 1, 'token-ep3', 'REVISE', 'Change camera focus.');
    expect(fetchMock.mock.calls[0][0]).toContain(ep002);
    expect(fetchMock.mock.calls[1][0]).toContain(ep003);
    expect(fetchMock.mock.calls[0][0]).not.toBe(fetchMock.mock.calls[1][0]);
  });

  it('corrects Research scope without paying for an AI regeneration', async () => {
    await episodePreparationApi.saveResearchBoundaries(ep003,{
      centralQuestion: 'How does Redis fail?',
      truthMap: ['User','Auth','Cache']
    }, 'Research truth map',1,['Low-level Redis replication']);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/episodes/' + ep003 + '/stages/research/draft');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).artifact.outOfScope)
      .toEqual(['Low-level Redis replication']);
    expect(fetchMock.mock.calls[0][1].headers['X-MediaOS-Preview-Authorization'])
      .toBeUndefined();
  });

  it('Director lock remains explicit and points to one stage in one episode', async () => {
    await episodePreparationApi.approveStage(ep003,'SCRIPT',3,'Reviewed all narration and constraints.');
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/v1/episodes/' + ep003 + '/stages/script/director-lock');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      expectedRevision:3,decision:'DIRECTOR_APPROVE',
      directorNote:'Reviewed all narration and constraints.'
    });
  });
});
