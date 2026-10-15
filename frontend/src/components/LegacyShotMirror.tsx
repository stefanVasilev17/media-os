import { useEffect, useMemo, useState } from 'react';
import { Check, LockKeyhole, Mic2, PencilLine, ShieldCheck } from 'lucide-react';
import { loadCreativeStage, type ScriptArtifact } from '../api/creativeApi';
import { loadVoiceClips, type VoiceClipState, voiceClipAudioUrl } from '../api/voiceClipApi';
import { loadVoiceShots, type VoiceShotState } from '../api/voiceApi';
import { loadVisualState, type VisualShotState } from '../api/visualApi';
import { EP001_SHOTS } from '../lib/ep001Production';
import { studio, type StudioClip, type StudioShot } from '../api/studioApi';

type LegacyClip = { narration: string; clipKey: string; startSecond: number; endSecond: number; voice?: VoiceClipState };
type LegacyShot = { key: string; title: string; clips: LegacyClip[]; voice?: VoiceShotState; visual?: VisualShotState };
type Props = {
  workingCopies: StudioShot[];
  onOpenEditor: (shot: StudioShot, sequence: number) => Promise<void>;
};

export function LegacyShotMirror({ workingCopies, onOpenEditor }: Props) {
  const [shots, setShots] = useState<LegacyShot[]>([]);
  const [scriptRevision, setScriptRevision] = useState(0);
  const [selected, setSelected] = useState('SHOT 05');
  const [activeClip, setActiveClip] = useState('');
  const [busy, setBusy] = useState(true);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

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
        if (alive) setError(e instanceof Error ? e.message : 'Could not load EP001 source.');
      } finally { if (alive) setBusy(false); }
    }
    void load();
    return () => { alive = false; };
  }, []);

  const active = useMemo(() => shots.find(s => s.key === selected), [shots, selected]);
  const existingCopy = useMemo(() => workingCopies.find(s => s.sourceShotKey === selected), [workingCopies, selected]);

  async function openForEditing(shot: LegacyShot, sequence: number, generate: boolean) {
    if (pending) return;
    const key = shot.key + ':' + sequence;
    setPending(key); setError(''); setInfo('');
    try {
      let copy = workingCopies.find(s => s.sourceShotKey === shot.key);
      if (!copy) {
        const okay = window.confirm(
          'Open an editable Director working copy of ' + shot.key + '?\n\n' +
          'The approved original Script, voice recordings and video LOCKS will be preserved. ' +
          'Only the new copy will change.'
        );
        if (!okay) return;
        copy = await studio.unlockOriginalShot(shot.key);
      }
      const clip = copy.clips.find(c => c.sequence === sequence);
      if (!clip) throw new Error('The editable clip is missing. Original production was not changed.');
      if (generate) {
        if (clip.approvedAt) throw new Error('This draft voice is already approved; unlock its clip in Studio before regenerating.');
        if (!clip.lockedAt) await studio.lockClip(clip.id);
        await studio.generateVoice(clip.id);
      }
      await onOpenEditor(copy, sequence);
      setInfo(generate
        ? 'New voice draft generated in the working copy. Listen and approve it in the editor.'
        : 'Opened a separate editable working copy. Original video and audio remain safe.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not prepare working copy.');
    } finally {
      setPending('');
    }
  }

  function workingClip(source: LegacyClip): StudioClip | undefined {
    return existingCopy?.clips.find(c => c.sequence === Number(source.clipKey.split('-C').at(-1)));
  }

  return <section className="studio-legacy-mirror">
    <div className="studio-section-head">
      <h2><ShieldCheck size={18}/> EP001 · All original shots</h2>
      <span>Director editing</span>
    </div>
    <p className="studio-muted">Select any shot to edit its narration or regenerate its voice. Corrections are saved as an editable version; your approved original video is never replaced automatically.</p>
    {busy && <p className="studio-muted">Loading EP001…</p>}
    {error && <p className="studio-alert studio-error" role="alert">{error}</p>}
    {info && <p className="studio-alert studio-success" role="status">{info}</p>}
    <div className="studio-legacy-grid">
      {shots.map(shot => {
        const staged = workingCopies.some(c => c.sourceShotKey === shot.key);
        return <button key={shot.key} type="button" className={selected === shot.key ? 'selected' : ''}
          onClick={() => { setSelected(shot.key); setActiveClip(''); setInfo(''); }}>
          <span>{shot.key}</span>
          {staged
            ? <PencilLine size={13} aria-label="Editable working version"/>
            : shot.visual?.locked
              ? <LockKeyhole size={13} aria-label="Original Director video locked"/>
              : shot.voice?.voiceApproved ? <Check size={13} aria-label="Original voice approved"/> : null}
        </button>;
      })}
    </div>
    {active && <div className="studio-legacy-detail">
      <div className="studio-section-head">
        <strong>{active.key} · {active.title}</strong>
        <span>{existingCopy ? 'EDITABLE VERSION' : active.visual?.locked ? 'ORIGINAL VIDEO LOCKED' : 'ORIGINAL PRESERVED'}</span>
      </div>
      <p className="studio-muted">{active.clips.length} voice clips. Original audio is available for comparison; edits affect the working version only.</p>
      {active.clips.map((c, index) => {
        const staged = workingClip(c);
        const expanded = activeClip === c.clipKey || (!activeClip && index === 0);
        const actionLabel = c.voice?.generated ? 'Regenerate Voice' : 'Generate Voice';
        return <div key={c.clipKey} className="studio-legacy-clip">
          <button type="button" className="studio-legacy-clip-toggle"
            onClick={() => setActiveClip(expanded ? 'none' : c.clipKey)}
            aria-expanded={expanded}>
            <strong>{expanded ? '▾' : '▸'} {c.clipKey}</strong>
            <span>{staged?.generated ? 'NEW VOICE DRAFT' : c.voice?.approved ? 'VOICE LOCKED' : c.voice?.generated ? 'VOICE READY' : 'SCRIPT READY'}</span>
          </button>
          {expanded && <div className="studio-legacy-clip-content">
            <p className="studio-legacy-narration">{staged?.narration || c.narration}</p>
            <div className="studio-legacy-clip-actions">
              <button type="button" disabled={Boolean(pending)}
                onClick={() => void openForEditing(active,index+1,false)}>
                <PencilLine size={14}/> {staged ? 'Unlock / Edit Text' : 'Unlock & Edit'}
              </button>
              <button type="button" disabled={Boolean(pending)} className="studio-primary"
                onClick={() => void openForEditing(active,index+1,true)}>
                <Mic2 size={14}/> {pending===active.key+':'+(index+1) ? 'Generating…' : staged?.generated || c.voice?.generated ? 'Regenerate Voice' : actionLabel}
              </button>
            </div>
            {staged?.generated && <div className="studio-legacy-audio">
              <label>New working voice · revision {staged.generationRevision}</label>
              <audio controls preload="metadata" src={studio.audioUrl(staged.id,staged.generationRevision)}/>
            </div>}
            {c.voice?.generated && <div className="studio-legacy-audio">
              <label>Original voice · preserved {c.voice.approved ? 'Director approved' : 'draft'}</label>
              <audio controls preload="metadata" src={voiceClipAudioUrl(c.clipKey,scriptRevision,c.voice.generationRevision)} />
            </div>}
            {!staged && <p className="studio-muted">Unlock creates an independent editable version, leaving the existing video exactly as it is.</p>}
          </div>}
        </div>;
      })}
      <div className="studio-buttons">
        <button type="button" onClick={() => { window.location.hash='#/agents/voice?shot='+encodeURIComponent(active.key); }}>Original Voice Agent</button>
        <button type="button" onClick={() => { window.location.hash='#/agents/visual'; }}>Original Visual Agent</button>
      </div>
    </div>}
  </section>;
}
