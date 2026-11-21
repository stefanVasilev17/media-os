import {describe, expect, it} from 'vitest';
import {episodeHomeFeed} from './episodeHomeFeed';
import {importedEpisodeRoute} from '../api/episodePackageApi';
import type {EpisodeSummary} from '../api/episodeWorkspaceApi';
import type {ImportedEpisodeSummary} from '../api/episodePackageApi';

const workspace=(number: string): EpisodeSummary => ({
  id:'00000000-0000-0000-0000-000000000001',
  episodeNumber:number,title:'Native '+number,
  status:'IN_PROGRESS',currentStage:'SCRIPT',sourceVersion:null,
});
const imported=(number: string): ImportedEpisodeSummary => ({
  packageId:'00000000-0000-0000-0000-000000000002',
  episodeKey:number,title:'Imported '+number,
  status:'IMPORTED',shotCount:15,beatCount:128,sourceSha256:'a'.repeat(64),
  importedAt:'2026-11-18T12:00:00Z',
});

describe('unified home episode feed',()=>{
  it('shows EP004 imported package without a native workspace',()=>{
    const feed=episodeHomeFeed([], [imported('EP004')]);
    expect(feed).toHaveLength(1);
    expect(feed[0].kind).toBe('imported');
    expect(feed[0].number).toBe('EP004');
  });

  it('keeps the three immutable finished-film slots separate',()=>{
    const feed=episodeHomeFeed(
      [workspace('EP001'),workspace('EP005')],
      [imported('EP002'),imported('EP003'),imported('EP004')],
    );
    expect(feed.map(e=>e.number)).toEqual(['EP005','EP004']);
  });

  it('does not duplicate matching native and imported EP004, preferring its source package',()=>{
    const feed=episodeHomeFeed([workspace('EP004')],[imported('EP004'),imported('EP004')]);
    expect(feed).toHaveLength(1);
    expect(feed[0].kind).toBe('imported');
  });

  it('links imported EP004 directly to its authenticated SHOT01 studio',()=>{
    expect(importedEpisodeRoute(imported('EP004').packageId,'SHOT01'))
      .toBe('#/episode-packages/import?packageId=00000000-0000-0000-0000-000000000002&shot=SHOT01');
  });
});
