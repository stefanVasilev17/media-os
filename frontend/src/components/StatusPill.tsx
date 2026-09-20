import type { ReactNode } from 'react';

export function StatusPill({ children }: { children: ReactNode }) {
  return <span className="status-pill">{children}</span>;
}
