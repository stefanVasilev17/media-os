import { ArrowLeft, Clapperboard, Mic2 } from 'lucide-react';
import { episodeDirectorRoute } from '../api/episodeDirectorApi';
import '../styles/episodeDirectorHub.css';

export function EpisodeShotWorkspacePage({
  episodeId,
  kind,
  shotKey
}: {
  episodeId: string;
  kind: 'voice' | 'video';
  shotKey: string;
}) {
  return (
    <main className="media-os-page episode-hub">
      <header className="episode-hub-header">
        <div>
          <button className="episode-hub-back" type="button" onClick={() => { window.location.hash = episodeDirectorRoute(episodeId); }}>
            <ArrowLeft size={15} /> Director Overview
          </button>
          <span>EPISODE-SCOPED / {kind.toUpperCase()}</span>
          <h1>{shotKey || 'Choose a shot'}</h1>
          <p>{kind === 'voice' ? 'ElevenLabs voice generation' : 'Remotion video production'} for the selected episode only.</p>
        </div>
        {kind === 'voice' ? <Mic2 size={28} /> : <Clapperboard size={28} />}
      </header>
      <div className="episode-hub-empty">
        Episode-specific {kind === 'voice' ? 'Voice generation' : 'Video generation and Director LOCK'} is not enabled yet.
        This screen is intentionally isolated. It will never load or write EP001 clips for another episode.
      </div>
    </main>
  );
}
