import type { ReactNode } from 'react';
import { BrainCircuit, FileText, Mic2, Clapperboard, Layers3, FolderKanban } from 'lucide-react';
import '../styles/compactBottomNav.css';

type NavItem = {
  label: string;
  hash: string;
  icon: ReactNode;
  match: (hash: string) => boolean;
};

const EP001_ID = '22222222-2222-2222-2222-222222222222';

function episodeFromRoute(hash: string) {
  const match = /^#\/episodes\/([0-9a-fA-F-]{36})\//.exec(hash);
  if (match) return match[1];
  return new URLSearchParams(hash.split('?', 2)[1] || '').get('episodeId') || '';
}

export function AppBottomNav({ currentHash }: { currentHash: string }) {
  const episodeId = episodeFromRoute(currentHash);
  const prefix = episodeId ? '#/episodes/' + episodeId : '#/episodes';
  const legacy = episodeId === EP001_ID;

  const items: NavItem[] = [
    {
      label: 'Episodes', hash: '#/episodes',
      icon: <FolderKanban size={17} />,
      match: hash => hash === '#/' || hash === '#/episodes'
    },
    {
      label: 'Director', hash: episodeId ? prefix + '/director' : '#/episodes',
      icon: <BrainCircuit size={17} />,
      match: hash => /\/director(?:\?|$)/.test(hash)
    },
    {
      label: 'Studio',
      hash: legacy ? '#/studio?episodeId=' + episodeId : episodeId ? prefix + '/video' : '#/episodes',
      icon: <Layers3 size={17} />,
      match: hash => hash.startsWith('#/studio')
    },
    {
      label: 'Script',
      hash: legacy ? '#/agents/script?episodeId=' + episodeId : episodeId ? prefix + '/director' : '#/episodes',
      icon: <FileText size={17} />,
      match: hash => hash.startsWith('#/agents/script')
    },
    {
      label: 'Voice',
      hash: legacy ? '#/agents/voice?episodeId=' + episodeId : episodeId ? prefix + '/voice' : '#/episodes',
      icon: <Mic2 size={17} />,
      match: hash => hash.startsWith('#/agents/voice') || /\/voice(?:\?|$)/.test(hash)
    },
    {
      label: 'Visual',
      hash: legacy ? '#/agents/visual?episodeId=' + episodeId : episodeId ? prefix + '/video' : '#/episodes',
      icon: <Clapperboard size={17} />,
      match: hash => hash.startsWith('#/agents/visual') || /\/video(?:\?|$)/.test(hash)
    }
  ];

  return (
    <nav className="media-os-bottom-nav" aria-label="MediaOS episode-aware navigation">
      {items.map(item => {
        const active = item.match(currentHash);
        return (
          <button key={item.label}
            className={active ? 'active' : ''}
            onClick={() => { window.location.hash = item.hash; }}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label} title={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
