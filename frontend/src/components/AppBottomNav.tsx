import type { ReactNode } from 'react';
import { Activity, Box, Home, Settings } from 'lucide-react';

type NavItem = {
  label: string;
  hash: string;
  icon: ReactNode;
  match: (hash: string) => boolean;
};

const items: NavItem[] = [
  {
    label: 'Home',
    hash: '#/',
    icon: <Home size={19} />,
    match: hash => hash === '#/' || hash === ''
  },
  {
    label: 'Spline',
    hash: '#/agents/spline',
    icon: <Box size={19} />,
    match: hash => hash.startsWith('#/agents/spline') || hash.startsWith('#/spline-agent') || hash.startsWith('#/diagnostics')
  },
  {
    label: 'Activity',
    hash: '#/activity',
    icon: <Activity size={19} />,
    match: hash => hash.startsWith('#/activity')
  },
  {
    label: 'Settings',
    hash: '#/settings',
    icon: <Settings size={19} />,
    match: hash => hash.startsWith('#/settings')
  }
];

export function AppBottomNav({ currentHash }: { currentHash: string }) {
  return (
    <nav className="media-os-bottom-nav" aria-label="Media OS navigation">
      {items.map(item => {
        const active = item.match(currentHash);
        return (
          <button
            key={item.label}
            className={active ? 'active' : ''}
            onClick={() => { window.location.hash = item.hash; }}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
