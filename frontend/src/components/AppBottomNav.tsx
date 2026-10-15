import type { ReactNode } from 'react';
import { BrainCircuit, FileText, Mic2, Clapperboard, Layers3 } from 'lucide-react';
import '../styles/compactBottomNav.css';

type NavItem = {
  label: string;
  hash: string;
  icon: ReactNode;
  match: (hash: string) => boolean;
};

const items: NavItem[] = [
  {
    label: 'Director',
    hash: '#/',
    icon: <BrainCircuit size={17} />,
    match: hash => hash === '#/' || hash === '' || hash.startsWith('#/director')
  },
  {
    label: 'Studio',
    hash: '#/studio',
    icon: <Layers3 size={17} />,
    match: hash => hash.startsWith('#/studio')
  },
  {
    label: 'Script',
    hash: '#/agents/script',
    icon: <FileText size={17} />,
    match: hash => hash.startsWith('#/agents/script')
  },
  {
    label: 'Voice',
    hash: '#/agents/voice',
    icon: <Mic2 size={17} />,
    match: hash => hash.startsWith('#/agents/voice')
  },
  {
    label: 'Visual',
    hash: '#/agents/visual',
    icon: <Clapperboard size={17} />,
    match: hash => hash.startsWith('#/agents/visual')
  }
];

export function AppBottomNav({ currentHash }: { currentHash: string }) {
  return (
    <nav className="media-os-bottom-nav" aria-label="MediaOS production navigation">
      {items.map(item => {
        const active = item.match(currentHash);
        return (
          <button
            key={item.label}
            className={active ? 'active' : ''}
            onClick={() => { window.location.hash = item.hash; }}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            title={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
