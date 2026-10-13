import type { ScriptArtifact, ScriptTimelineItem } from '../api/creativeApi';
import type { ProductionContractPayload } from '../api/productionContractApi';

export type EpisodeShotDefinition = {
  key: string;
  title: string;
  startSecond: number;
  endSecond: number;
};

export type VoiceClipDefinition = {
  clipKey: string;
  sequence: number;
  startSecond: number;
  endSecond: number;
  narration: string;
  voiceDirection: string;
};

export type VoiceShotBundle = EpisodeShotDefinition & {
  narration: string;
  voiceDirection: string;
  clips: VoiceClipDefinition[];
};

export const EP001_SHOTS: EpisodeShotDefinition[] = [
  { key: 'SHOT 01', title: 'The Human Action / Login Intent', startSecond: 0, endSecond: 70 },
  { key: 'SHOT 02', title: 'Request Assembly', startSecond: 70, endSecond: 144 },
  { key: 'SHOT 03', title: 'Ready Does Not Mean Sent', startSecond: 144, endSecond: 197 },
  { key: 'SHOT 04', title: 'DNS Resolution / Network Transit', startSecond: 197, endSecond: 264 },
  { key: 'SHOT 05', title: 'API Gateway / Routing', startSecond: 264, endSecond: 344 },
  { key: 'SHOT 06', title: 'Load Balancer / Traffic Distribution', startSecond: 344, endSecond: 424 },
  { key: 'SHOT 07', title: 'Auth Service / Validation Steps', startSecond: 424, endSecond: 509 },
  { key: 'SHOT 08', title: 'User Database / User Data', startSecond: 509, endSecond: 599 },
  { key: 'SHOT 09', title: 'Healthy Auth Service, Broken Login', startSecond: 599, endSecond: 694 },
  { key: 'SHOT 10', title: 'When Trust Breaks Along the Way', startSecond: 694, endSecond: 809 },
  { key: 'SHOT 11', title: 'Correct Password, But Not Logged In Yet', startSecond: 809, endSecond: 889 },
  { key: 'SHOT 12', title: 'Authentication State / Session Creation', startSecond: 889, endSecond: 984 },
  { key: 'SHOT 13', title: 'Route Decision / Logged-In UI', startSecond: 984, endSecond: 1059 },
  { key: 'SHOT 14', title: 'Session Restore Flow', startSecond: 1059, endSecond: 1139 },
  { key: 'SHOT 15', title: 'What Really Happened When You Clicked Login', startSecond: 1139, endSecond: 1194 },
  { key: 'SHOT 16', title: 'The Next Request', startSecond: 1194, endSecond: 1239 }
];

export function clock(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  return Math.floor(safe / 60) + ':' + String(safe % 60).padStart(2, '0');
}

function blocksForShot(timeline: ScriptTimelineItem[], shot: EpisodeShotDefinition) {
  const startsInside = timeline.filter(item =>
    item.startSecond >= shot.startSecond && item.startSecond < shot.endSecond
  );
  if (startsInside.length > 0) return startsInside;
  return timeline.filter(item => item.endSecond > shot.startSecond && item.startSecond < shot.endSecond);
}

export function buildVoiceShotBundles(artifact: ScriptArtifact): VoiceShotBundle[] {
  return EP001_SHOTS.map(shot => {
    const blocks = blocksForShot(artifact.timeline, shot);
    const clips = blocks.map((block, index) => ({
      clipKey: shot.key + '-C' + String(index + 1).padStart(2, '0'),
      sequence: index + 1,
      startSecond: Math.max(shot.startSecond, block.startSecond),
      endSecond: Math.min(shot.endSecond, block.endSecond),
      narration: block.narration.trim(),
      voiceDirection: block.voiceDirection.trim()
    })).filter(clip => clip.narration && clip.endSecond > clip.startSecond);

    return {
      ...shot,
      narration: clips.map(clip => clip.narration).join('\n\n'),
      voiceDirection: Array.from(new Set(clips.map(clip => clip.voiceDirection).filter(Boolean))).join(' '),
      clips
    };
  });
}

export function buildVoiceShotBundlesFromContract(contract: ProductionContractPayload): VoiceShotBundle[] {
  const grouped = new Map<string, typeof contract.timeline>();
  for (const segment of contract.timeline) {
    const rows = grouped.get(segment.shotKey) || [];
    rows.push(segment);
    grouped.set(segment.shotKey, rows);
  }

  return EP001_SHOTS
    .map(shot => {
      const segments = [...(grouped.get(shot.key) || [])].sort((a, b) => a.startSecond - b.startSecond);
      return {
        ...shot,
        narration: segments.map(segment => segment.hear.trim()).join('\n\n'),
        voiceDirection: Array.from(new Set(segments.map(segment => segment.voiceDirection.trim()).filter(Boolean))).join(' '),
        clips: segments.map((segment, index) => ({
          clipKey: segment.clipKey || shot.key + '-C' + String(index + 1).padStart(2, '0'),
          sequence: index + 1,
          startSecond: segment.startSecond,
          endSecond: segment.endSecond,
          narration: segment.hear.trim(),
          voiceDirection: segment.voiceDirection.trim()
        }))
      };
    })
    .filter(shot => shot.clips.length > 0);
}
