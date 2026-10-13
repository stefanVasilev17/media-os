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
  { key: 'SHOT 01', title: 'The Human Action / Login Intent', startSecond: 0, endSecond: 31 },
  { key: 'SHOT 02', title: 'Request Assembly', startSecond: 31, endSecond: 105 },
  { key: 'SHOT 03', title: 'Ready Does Not Mean Sent', startSecond: 105, endSecond: 158 },
  { key: 'SHOT 04', title: 'DNS Resolution / Network Transit', startSecond: 158, endSecond: 225 },
  { key: 'SHOT 05', title: 'API Gateway / Routing', startSecond: 225, endSecond: 305 },
  { key: 'SHOT 06', title: 'Load Balancer / Traffic Distribution', startSecond: 305, endSecond: 385 },
  { key: 'SHOT 07', title: 'Auth Service / Validation Steps', startSecond: 385, endSecond: 470 },
  { key: 'SHOT 08', title: 'User Database / User Data', startSecond: 470, endSecond: 560 },
  { key: 'SHOT 09', title: 'Healthy Auth Service, Broken Login', startSecond: 560, endSecond: 655 },
  { key: 'SHOT 10', title: 'When Trust Breaks Along the Way', startSecond: 655, endSecond: 770 },
  { key: 'SHOT 11', title: 'Correct Password, But Not Logged In Yet', startSecond: 770, endSecond: 850 },
  { key: 'SHOT 12', title: 'Authentication State / Session Creation', startSecond: 850, endSecond: 945 },
  { key: 'SHOT 13', title: 'Route Decision / Logged-In UI', startSecond: 945, endSecond: 1020 },
  { key: 'SHOT 14', title: 'Session Restore Flow', startSecond: 1020, endSecond: 1100 },
  { key: 'SHOT 15', title: 'What Really Happened When You Clicked Login', startSecond: 1100, endSecond: 1155 },
  { key: 'SHOT 16', title: 'The Next Request', startSecond: 1155, endSecond: 1200 }
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
