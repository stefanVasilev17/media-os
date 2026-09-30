import { Eye, Play, X } from 'lucide-react';
import type { AgentActionPreview } from '../api/agentPreviewApi';
import '../styles/agentActionPreview.css';

export function AgentActionPreviewCard({
  preview,
  confirmLabel,
  busy,
  onConfirm,
  onCancel
}: {
  preview: AgentActionPreview;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="agent-action-preview" aria-label="Zero-token agent action preview">
      <div className="agent-action-preview-head">
        <div>
          <span><Eye size={14} /> ZERO-TOKEN PREVIEW</span>
          <strong>{preview.agentName}</strong>
        </div>
        <button type="button" className="agent-action-preview-close" onClick={onCancel} aria-label="Close preview">
          <X size={15} />
        </button>
      </div>

      <p className="agent-action-preview-summary">
        {preview.plannedPaidCalls} paid call · {preview.model} · output cap {preview.maxOutputTokens.toLocaleString()} tokens
      </p>

      {preview.blockers.length > 0 && (
        <div className="agent-action-preview-blockers">
          {preview.blockers.map(item => <p key={item}>{item}</p>)}
        </div>
      )}

      <details>
        <summary>What this agent will receive and change</summary>
        <div className="agent-action-preview-details">
          <div>
            <strong>Context</strong>
            {preview.contextSources.map(item => <p key={item}>{item}</p>)}
          </div>
          <div>
            <strong>On success</strong>
            {preview.onSuccess.map(item => <p key={item}>{item}</p>)}
          </div>
        </div>
      </details>

      <div className="agent-action-preview-actions">
        {!preview.paidAiEnabled && (
          <button type="button" onClick={() => { window.location.hash = '#/settings'; }}>Open Settings</button>
        )}
        <button type="button" className="primary" disabled={busy || !preview.canRun} onClick={onConfirm}>
          <Play size={14} /> {confirmLabel}
        </button>
      </div>
    </section>
  );
}
