import {describe,expect,it} from 'vitest';
import {nativeShotKey,voiceGenerationBlocker} from './ep002VoiceReadiness';
import type {EpisodeRevisionVoice} from '../api/episodeRevisionVoiceApi';

const shot = {shotKey:'SHOT01',englishNarration:'Approved exact narration'};
function voice(patch: Partial<EpisodeRevisionVoice> = {}): EpisodeRevisionVoice {
  return {
    episodeId:'11111111-1111-1111-1111-111111111111',
    episodeNumber:'EP002',shotKey:'SHOT 01',shotRevision:0,
    narration:shot.englishNarration,voiceDirection:'Calm',canGenerate:true,
    configured:true,ep001VoiceIdentityVerified:true,takes:[],voiceApproved:false,voiceModel:'eleven_multilingual_v2',
    ...patch
  };
}

describe('EP002 paid voice readiness',()=>{
  it('normalizes only known two digit SHOT keys',()=>{
    expect(nativeShotKey('SHOT01')).toBe('SHOT 01');
    expect(nativeShotKey('SHOT11')).toBe('SHOT 11');
    expect(()=>nativeShotKey('SHOT 12')).toThrow();
    expect(()=>nativeShotKey('SHOT12;delete')).toThrow();
  });
  it('allows one paid action only when native identity, voice and narration are exact',()=>{
    expect(voiceGenerationBlocker(voice(),shot)).toBeNull();
    expect(voiceGenerationBlocker(voice({narration:'Rewritten narration'}),shot)).toMatch(/differs/);
    expect(voiceGenerationBlocker(voice({episodeNumber:'EP001'}),shot)).toMatch(/does not match/);
    expect(voiceGenerationBlocker(voice({shotKey:'SHOT 02'}),shot)).toMatch(/does not match/);
    expect(voiceGenerationBlocker(voice({ep001VoiceIdentityVerified:false}),shot)).toMatch(/not verified/);
    expect(voiceGenerationBlocker(voice({configured:false}),shot)).toMatch(/not configured/);
    expect(voiceGenerationBlocker(voice({canGenerate:false}),shot)).toMatch(/not authorized/);
    expect(voiceGenerationBlocker(voice({voiceApproved:true}),shot)).toMatch(/already Director-approved/);
    expect(voiceGenerationBlocker(voice({blockedReason:'Original Visual Plan not locked'}),shot)).toBe('Original Visual Plan not locked');
  });
});
