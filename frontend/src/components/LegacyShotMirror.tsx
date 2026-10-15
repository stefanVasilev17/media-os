import { useEffect, useMemo, useState } from 'react';
import { Check, LockKeyhole, ShieldCheck } from 'lucide-react';
import { loadCreativeStage, type ScriptArtifact } from '../api/creativeApi';
import { loadVoiceClips, type VoiceClipState, voiceClipAudioUrl } from '../api/voiceClipApi';
import { loadVoiceShots, type VoiceShotState } from '../api/voiceApi';
import { loadVisualState, type VisualShotState } from '../api/visualApi';
import { EP001_SHOTS } from '../lib/ep001Production';

type LegacyClip = { narration: string; clipKey: string; startSecond: number; endSecond: number; voice?: VoiceClipState };
type LegacyShot = { key: string; title: string; clips: LegacyClip[]; voice?: VoiceShotState; visual?: VisualShotState };

export function LegacyShotMirror() {
  const [shots, setShots] = useState<LegacyShot[]>([]);
  const [scriptRevision, setScriptRevision] = useState(0);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const script = await loadCreativeStage<ScriptArtifact>('SCRIPT');
        if (!script.locked || !script.artifact) throw new Error('The canonical EP001 Script is not locked.');
        const [clips, voiceShots, visuals] = await Promise.all([
          loadVoiceClips(script.revision).catch(() => [] as VoiceClipState[]),
          loadVoiceShots(script.revision).catch(() => [] as VoiceShotState[]),
          loadVisualState(script.revision).then(s => s.shots).catch(() => [] as VisualShotState[])
        ]);
        const voices = new Map(clips.map(c => [c.clipKey, c]));
        const vs = new Map(voiceShots.map(v => [v.shotKey, v]));
        const vr = new Map(visuals.map(v => [v.shotKey, v]));
        const grouped = new Map<string, LegacyClip[]>();
        const timeline = script.artifact!.timeline as Array<ScriptArtifact['timeline'][number] & { shotKey?: string }>;
        for (const item of timeline) {
          const key = String(item.shotKey || '').trim();
          if (!/^SHOT \d{2}$/.test(key)) continue;
          const items = grouped.get(key) || [];
          const index = items.length + 1;
          const clipKey = key + '-C' + String(index).padStart(2, '0');
          items.push({
            clipKey, startSecond: item.startSecond, endSecond: item.endSecond,
            narration: voices.get(clipKey)?.narration || item.narration,
            voice: voices.get(clipKey)
          });
          grouped.set(key, items);
        }
        const mirror: LegacyShot[] = EP001_SHOTS.map(s => ({
          key: s.key, title: s.title, clips: grouped.get(s.key) || [],
          voice: vs.get(s.key), visual: vr.get(s.key)
        }));
        if (alive) {
          setShots(mirror);
          setScriptRevision(script.revision);
          setSelected(current => mirror.some(s => s.key === current) ? current : 'SHOT 05');
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Could not load EP001 legacy production.');
      } finally { if (alive) setBusy(false); }
    }
    void load();
    return () => { alive = false; };
  }, []);
  const active = useMemo(() => shots.find(s => s.key === selected), [shots, selected]);
  return <section className="studio-legacy-mirror">
    <div className="studio-section-head"><h2><ShieldCheck size={18}/> EP001 · Original shots</h2><span>Read-only</span></div>
    <p className="studio-muted">Direct view of the existing LOCKED Script, Voice and Visual records. No copies, re-generation or modifications.</p>
    {busy && <p className="studio-muted">Reading canonical production…</p>}
    {error && <p className="studio-alert studio-error">{error}</p>}
    <div className="studio-legacy-grid">
      {shots.map(shot =>
        <button key={shot.key} type="button" className={selected === shot.key ? 'selected' : ''}
          onClick={() => setSelected(shot.key)}>
          <span>{shot.key}</span>
          {shot.visual?.locked
            ? <LockKeyhole size={13} aria-label="Director video locked"/>
            : shot.voice?.voiceApproved ? <Check size={13} aria-label="Voice approved"/> : null}
        </button>
      )}
    </div>
    {active && <div className="studio-legacy-detail">
      <div className="studio-section-head"><strong>{active.key} · {active.title}</strong>
        <span>{active.visual?.locked ? 'VIDEO LOCKED' : active.voice?.voiceApproved ? 'VOICE APPROVED' : 'Original production'}</span></div>
      <p className="studio-muted">{active.clips.length} canonical narration blocks · Existing production remains authoritative.</p>
      {active.clips.map(c => <details key={c.clipKey} className="studio-legacy-clip">
        <summary>{c.clipKey} · {c.voice?.approved ? 'VOICE LOCKED' : c.voice?.generated ? 'Voice draft' : 'Original script'}</summary>
        <p>{c.narration}</p>
        {c.voice?.generated && <audio controls preload="none" src={voiceClipAudioUrl(c.clipKey,
          scriptRevision,
          c.voice.generationRevision)} />}
      </details>)}
      <div className="studio-buttons">
        <button type="button" onClick={() => { window.location.hash='#/agents/voice?shot='+encodeURIComponent(active.key); }}>Open original Voice Agent</button>
        <button type="button" onClick={() => { window.location.hash='#/agents/visual'; }}>Open original Visual Agent</button>
      </div>
    </div>}
  </section>;
}
