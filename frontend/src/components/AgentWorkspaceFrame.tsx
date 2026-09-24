import type { ReactNode } from 'react';

type AgentCapability = {
  label: string;
  description: string;
};

type AgentWorkspaceFrameProps = {
  agentName: string;
  description: string;
  statusLabel?: string;
  statusTone?: 'ready' | 'standby';
  capabilities: AgentCapability[];
  children: ReactNode;
};

export function AgentWorkspaceFrame({
  agentName,
  description,
  statusLabel,
  statusTone = 'standby',
  capabilities,
  children
}: AgentWorkspaceFrameProps) {
  return (
    <main className="media-os-page agent-workspace-page">
      <header className="media-os-page-header agent-workspace-header">
        <div>
          <span className="media-os-eyebrow">AGENT WORKSPACE</span>
          <h1>{agentName}</h1>
          <p>{description}</p>
        </div>
        {statusLabel && (
          <div className={`agent-workspace-status ${statusTone}`}>
            <span className="media-os-status-dot" aria-hidden="true" />
            <strong>{statusLabel}</strong>
          </div>
        )}
      </header>

      <section className="agent-capability-strip" aria-label={`${agentName} capabilities`}>
        {capabilities.map(capability => (
          <article key={capability.label}>
            <strong>{capability.label}</strong>
            <span>{capability.description}</span>
          </article>
        ))}
      </section>

      {children}
    </main>
  );
}
