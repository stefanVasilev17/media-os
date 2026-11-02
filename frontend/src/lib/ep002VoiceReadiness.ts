import type {EpisodeRevisionVoice} from '../api/episodeRevisionVoiceApi';

export type VoiceSourceShot = {shotKey:string;englishNarration:string};

export function nativeShotKey(shotKey: string): string {
  if (!/^SHOT\d{2}$/.test(shotKey)) throw new Error('Unknown EP002 SHOT key.');
  return 'SHOT ' + shotKey.slice(4);
}

export function voiceGenerationBlocker(
  voice: EpisodeRevisionVoice,
  expected: VoiceSourceShot,
): string | null {
  if (voice.episodeNumber !== 'EP002' || voice.shotKey !== nativeShotKey(expected.shotKey)) {
    return 'The native Voice workspace does not match the approved EP002 shot. No paid request is permitted.';
  }
  if (voice.narration !== expected.englishNarration) {
    return 'The native narration differs from the Director-locked Script v4.0. Reconcile the source before spending ElevenLabs credits.';
  }
  if (voice.voiceApproved) return 'Voice is already Director-approved for this SHOT.';
  if (voice.blockedReason) return voice.blockedReason;
  if (voice.ep001VoiceIdentityVerified !== true) return 'EP001 voice/model identity is not verified.';
  if (!voice.configured) return 'ElevenLabs is not configured.';
  if (!voice.canGenerate) return 'Backend has not authorized voice generation for this SHOT.';
  return null;
}
